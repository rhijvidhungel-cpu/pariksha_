from collections import defaultdict
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_raw_db


router = APIRouter(
    prefix="/api/seat-allocation",
    tags=["Seat Allocation"],
)


class AllocationRequest(BaseModel):
    exam_date: str
    exam_time: str
    batches: List[str]
    rooms: List[int]


def placeholders(values):
    return ",".join(["%s"] * len(values))


def generate_room_seats(room):
    seats = []

    for row in range(1, room["rows_count"] + 1):
        for bench in range(1, room["benches_per_row"] + 1):
            for seat in range(1, room["seats_per_bench"] + 1):
                seats.append(
                    {
                        "hall_id": room["hall_id"],
                        "room_no": room["room_no"],
                        "row_no": row,
                        "bench_no": bench,
                        "seat_no": seat,
                    }
                )

    return seats


def reorder_students(students):
    groups = defaultdict(list)

    for student in students:
        groups[student["subject_code"]].append(student)

    ordered = []

    while True:
        added = False

        for subject in list(groups.keys()):
            if groups[subject]:
                ordered.append(groups[subject].pop(0))
                added = True

        if not added:
            break

    return ordered


def is_valid_seat(student, seat, allocations):
    for allocated in allocations:
        if allocated["hall_id"] != seat["hall_id"]:
            continue

        if (
            allocated["row_no"] == seat["row_no"]
            and allocated["bench_no"] == seat["bench_no"]
            and allocated["subject_code"] == student["subject_code"]
        ):
            return False

        if (
            allocated["bench_no"] == seat["bench_no"]
            and abs(allocated["row_no"] - seat["row_no"]) == 1
            and allocated["subject_code"] == student["subject_code"]
        ):
            return False

    return True


def allocate_students(students, seats, existing_allocations):
    allocations = []
    remaining_students = students.copy()
    seat_rules_context = existing_allocations.copy()

    for seat in seats:
        for student in remaining_students[:]:
            if is_valid_seat(student, seat, seat_rules_context):
                allocation = {
                    "student_id": student["student_id"],
                    "full_name": student["full_name"],
                    "batch": student["batch"],
                    "subject_name": student["subject_name"],
                    "subject_code": student["subject_code"],
                    "hall_id": seat["hall_id"],
                    "room_no": seat["room_no"],
                    "row_no": seat["row_no"],
                    "bench_no": seat["bench_no"],
                    "seat_no": seat["seat_no"],
                }

                allocations.append(allocation)
                seat_rules_context.append(allocation)
                remaining_students.remove(student)
                break

    return allocations, remaining_students


def fetch_room_usage(cursor, exam_date, exam_time):
    cursor.execute(
        """
        SELECT hall_id, COUNT(*) AS allocated
        FROM seat_allocations
        WHERE exam_date=%s
        AND exam_time=%s
        GROUP BY hall_id;
        """,
        (exam_date, exam_time),
    )

    return {item["hall_id"]: item["allocated"] for item in cursor.fetchall()}


def fetch_existing_allocations(cursor, exam_date, exam_time, hall_ids):
    if not hall_ids:
        return []

    cursor.execute(
        f"""
        SELECT
            hall_id,
            row_no,
            bench_no,
            seat_no,
            subject_code
        FROM seat_allocations
        WHERE exam_date=%s
        AND exam_time=%s
        AND hall_id IN ({placeholders(hall_ids)});
        """,
        (exam_date, exam_time, *hall_ids),
    )

    return cursor.fetchall()


@router.post("/preview")
def preview_allocation(data: AllocationRequest):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT batch_name
                FROM seat_allocations
                WHERE exam_date=%s
                AND exam_time=%s
                GROUP BY batch_name;
                """,
                (data.exam_date, data.exam_time),
            )
            allocated_batches = {item["batch_name"] for item in cursor.fetchall()}

            cursor.execute(
                """
                SELECT
                    batch_name,
                    subject_name,
                    subject_code
                FROM exam_routines
                WHERE exam_date=%s
                AND exam_time=%s
                ORDER BY batch_name;
                """,
                (data.exam_date, data.exam_time),
            )
            exam_batches = cursor.fetchall()

            result = []
            total_students = 0

            for subject in exam_batches:
                batch = subject["batch_name"]

                cursor.execute(
                    """
                    SELECT COUNT(*) AS count
                    FROM students s
                    JOIN batches b
                    ON s.batch_id = b.batch_id
                    WHERE b.batch_name=%s;
                    """,
                    (batch,),
                )

                count = cursor.fetchone()["count"]
                total_students += count

                result.append(
                    {
                        "batch": batch,
                        "subject_name": subject["subject_name"],
                        "subject_code": subject["subject_code"],
                        "students": count,
                        "already_allocated": batch in allocated_batches,
                    }
                )

            room_usage = fetch_room_usage(cursor, data.exam_date, data.exam_time)

            cursor.execute(
                """
                SELECT hall_id, room_no, capacity
                FROM exam_halls
                ORDER BY room_no;
                """
            )

            rooms = []
            for room in cursor.fetchall():
                allocated = room_usage.get(room["hall_id"], 0)
                remaining = max(room["capacity"] - allocated, 0)

                rooms.append(
                    {
                        "hall_id": room["hall_id"],
                        "room_no": room["room_no"],
                        "capacity": room["capacity"],
                        "allocated": allocated,
                        "remaining": remaining,
                        "is_full": remaining == 0,
                    }
                )

            return {
                "batches": result,
                "rooms": rooms,
                "total_students": total_students,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
def generate_allocation(data: AllocationRequest):
    try:
        if not data.batches:
            raise HTTPException(status_code=400, detail="Select at least one batch.")

        if not data.rooms:
            raise HTTPException(status_code=400, detail="Select at least one room.")

        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                f"""
                SELECT DISTINCT batch_name
                FROM seat_allocations
                WHERE exam_date=%s
                AND exam_time=%s
                AND batch_name IN ({placeholders(data.batches)});
                """,
                (data.exam_date, data.exam_time, *data.batches),
            )
            already_allocated_batches = [item["batch_name"] for item in cursor.fetchall()]

            if already_allocated_batches:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "These batches are already allocated for this exam slot: "
                        + ", ".join(already_allocated_batches)
                    ),
                )

            students = []

            for batch in data.batches:
                cursor.execute(
                    """
                    SELECT
                        s.student_id,
                        s.full_name,
                        b.batch_name
                    FROM students s
                    JOIN batches b
                    ON s.batch_id=b.batch_id
                    WHERE b.batch_name=%s
                    ORDER BY s.student_id;
                    """,
                    (batch,),
                )
                batch_students = cursor.fetchall()

                cursor.execute(
                    """
                    SELECT
                        subject_name,
                        subject_code
                    FROM exam_routines
                    WHERE batch_name=%s
                    AND exam_date=%s
                    AND exam_time=%s;
                    """,
                    (batch, data.exam_date, data.exam_time),
                )
                subject = cursor.fetchone()

                if not subject:
                    continue

                for student in batch_students:
                    students.append(
                        {
                            "student_id": student["student_id"],
                            "full_name": student["full_name"],
                            "batch": batch,
                            "subject_name": subject["subject_name"],
                            "subject_code": subject["subject_code"],
                        }
                    )

            students = reorder_students(students)

            room_usage = fetch_room_usage(cursor, data.exam_date, data.exam_time)
            existing_allocations = fetch_existing_allocations(
                cursor,
                data.exam_date,
                data.exam_time,
                data.rooms,
            )
            occupied_seats = {
                (
                    item["hall_id"],
                    item["row_no"],
                    item["bench_no"],
                    item["seat_no"],
                )
                for item in existing_allocations
            }

            all_seats = []
            total_capacity = 0
            available_capacity = 0

            for hall_id in data.rooms:
                cursor.execute(
                    """
                    SELECT
                        hall_id,
                        room_no,
                        capacity,
                        rows_count,
                        benches_per_row,
                        seats_per_bench
                    FROM exam_halls
                    WHERE hall_id=%s;
                    """,
                    (hall_id,),
                )

                room = cursor.fetchone()

                if not room:
                    continue

                allocated_count = room_usage.get(room["hall_id"], 0)
                remaining_capacity = max(room["capacity"] - allocated_count, 0)

                if remaining_capacity == 0:
                    continue

                total_capacity += room["capacity"]
                available_capacity += remaining_capacity

                room_seats = [
                    seat
                    for seat in generate_room_seats(room)
                    if (
                        seat["hall_id"],
                        seat["row_no"],
                        seat["bench_no"],
                        seat["seat_no"],
                    )
                    not in occupied_seats
                ]

                all_seats.extend(room_seats[:remaining_capacity])

            if not all_seats:
                raise HTTPException(
                    status_code=409,
                    detail="Selected rooms are already full for this exam slot.",
                )

            allocations, remaining_students = allocate_students(
                students,
                all_seats,
                existing_allocations,
            )

            for allocation in allocations:
                cursor.execute(
                    """
                    INSERT INTO seat_allocations
                    (
                        exam_date,
                        exam_time,
                        student_id,
                        batch_name,
                        subject_code,
                        subject_name,
                        hall_id,
                        room_no,
                        bench_no,
                        row_no,
                        seat_no
                    )
                    VALUES
                    (
                        %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                    );
                    """,
                    (
                        data.exam_date,
                        data.exam_time,
                        allocation["student_id"],
                        allocation["batch"],
                        allocation["subject_code"],
                        allocation["subject_name"],
                        allocation["hall_id"],
                        allocation["room_no"],
                        allocation["bench_no"],
                        allocation["row_no"],
                        allocation["seat_no"],
                    ),
                )

            conn.commit()

            return {
                "status": "COMPLETE" if len(remaining_students) == 0 else "ROOM_FULL",
                "allocated": len(allocations),
                "remaining": len(remaining_students),
                "remaining_students": remaining_students,
                "allocations": allocations,
                "generated_seats": len(all_seats),
                "total_capacity": total_capacity,
                "available_capacity": available_capacity,
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session")
def delete_session_allocations(exam_date: str, exam_time: str):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            DELETE FROM seat_allocations
            WHERE exam_date=%s
            AND exam_time=%s;
            """,
            (exam_date, exam_time),
        )
        conn.commit()

    return {"success": True, "message": "All allocations removed for this exam slot."}


@router.delete("/batch")
def delete_batch_allocation(exam_date: str, exam_time: str, batch: str):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            DELETE FROM seat_allocations
            WHERE exam_date=%s
            AND exam_time=%s
            AND batch_name=%s;
            """,
            (exam_date, exam_time, batch),
        )
        conn.commit()

    return {"success": True, "message": f"Allocation removed for batch {batch}."}


@router.delete("/room")
def delete_room_allocation(exam_date: str, exam_time: str, hall_id: int):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            DELETE FROM seat_allocations
            WHERE exam_date=%s
            AND exam_time=%s
            AND hall_id=%s;
            """,
            (exam_date, exam_time, hall_id),
        )
        conn.commit()

    return {"success": True, "message": f"Allocation removed for hall {hall_id}."}
