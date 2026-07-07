from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from database import get_raw_db
from collections import defaultdict
 
def generate_room_seats(room):
 
    seats = []
 
    for row in range(1, room["rows_count"] + 1):
 
        for bench in range(1, room["benches_per_row"] + 1):
 
            for seat in range(1, room["seats_per_bench"] + 1):
 
                seats.append({
                    "hall_id": room["hall_id"],
                    "room_no": room["room_no"],
                    "row_no": row,
                    "bench_no": bench,
                    "seat_no": seat
                })
 
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
 
        # Same room only
        if allocated["hall_id"] != seat["hall_id"]:
            continue
 
        # Rule 1: Same bench
        if (
            allocated["row_no"] == seat["row_no"]
            and allocated["bench_no"] == seat["bench_no"]
            and allocated["subject_code"] == student["subject_code"]
        ):
            return False
 
        # Rule 2: Front / Back
        if (
            allocated["bench_no"] == seat["bench_no"]
            and abs(allocated["row_no"] - seat["row_no"]) == 1
            and allocated["subject_code"] == student["subject_code"]
        ):
            return False
 
    return True
 
 
def allocate_students(students, seats):
 
    allocations = []
 
    remaining_students = students.copy()
 
    for seat in seats:
 
        allocated = False
 
        for student in remaining_students[:]:
 
            if is_valid_seat(student, seat, allocations):
 
                allocations.append({
 
                    "student_id": student["student_id"],
 
                    "full_name": student["full_name"],
 
                    "batch": student["batch"],
 
                    "subject_name": student["subject_name"],
 
                    "subject_code": student["subject_code"],
 
                    "hall_id": seat["hall_id"],
 
                    "room_no": seat["room_no"],
 
                    "row_no": seat["row_no"],
 
                    "bench_no": seat["bench_no"],
 
                    "seat_no": seat["seat_no"]
 
                })
 
                remaining_students.remove(student)
 
                allocated = True
 
                break
 
    return allocations
 
 
router = APIRouter(
    prefix="/api/seat-allocation",
    tags=["Seat Allocation"]
)
 
 
class AllocationRequest(BaseModel):
    exam_date: str
    exam_time: str
    batches: List[str]
    rooms: List[int]
 
@router.post("/preview")
def preview_allocation(data: AllocationRequest):
 
    try:
 
        with get_raw_db() as conn:
 
            cursor = conn.cursor()
 
            result = []
            total_students = 0
 
            # Get all batches having exam in the selected session
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
                (
                    data.exam_date,
                    data.exam_time,
                ),
            )
 
            exam_batches = cursor.fetchall()
 
            for subject in exam_batches:
 
                batch = subject["batch_name"]
 
                # Count students in this batch
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
                    }
                )
 
            return {
                "batches": result,
                "total_students": total_students,
            }
 
    except Exception as e:
 
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
 
 
@router.get("/status")
def get_allocation_status(exam_date: str, exam_time: str):
    """
    Returns, for a specific exam_date + exam_time slot:
      - every hall with its capacity, how many seats are currently occupied
        for THIS exam slot only, and whether it's full / has any allocations.
      - every batch that currently has an active allocation for THIS exam
        slot, and which hall(s) it's seated in.
 
    This is what the frontend uses to grey out full halls and lock
    already-allocated batches.
    """
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
 
            # Occupied seat count per hall, scoped to this exam slot only.
            cursor.execute(
                """
                SELECT hall_id, COUNT(*) AS allocated_count
                FROM seat_allocations
                WHERE exam_date=%s AND exam_time=%s
                GROUP BY hall_id;
                """,
                (exam_date, exam_time),
            )
            occupied_rows = cursor.fetchall()
            occupied_map = {
                row["hall_id"]: row["allocated_count"] for row in occupied_rows
            }
 
            cursor.execute(
                """
                SELECT hall_id, room_no, capacity
                FROM exam_halls
                ORDER BY hall_id;
                """
            )
            halls = cursor.fetchall()
 
            rooms_status = []
            for hall in halls:
                allocated_count = occupied_map.get(hall["hall_id"], 0)
                rooms_status.append(
                    {
                        "hall_id": hall["hall_id"],
                        "room_no": hall["room_no"],
                        "capacity": hall["capacity"],
                        "allocatedCount": allocated_count,
                        "isFull": allocated_count >= hall["capacity"],
                        "hasAllocations": allocated_count > 0,
                    }
                )
 
            # Which batches already have seats for this exam slot, and where.
            cursor.execute(
                """
                SELECT DISTINCT batch_name, hall_id
                FROM seat_allocations
                WHERE exam_date=%s AND exam_time=%s;
                """,
                (exam_date, exam_time),
            )
            batch_rows = cursor.fetchall()
 
            batch_halls = {}
            for row in batch_rows:
                batch_halls.setdefault(row["batch_name"], set()).add(row["hall_id"])
 
            batches_status = [
                {
                    "batch": batch_name,
                    "allocated": True,
                    "hall_ids": sorted(list(hall_ids)),
                }
                for batch_name, hall_ids in batch_halls.items()
            ]
 
            return {
                "rooms": rooms_status,
                "batches": batches_status,
            }
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@router.delete("/room")
def remove_room_allocation(exam_date: str, exam_time: str, hall_id: int):
    """Admin action: clear every allocation from a specific hall, for a specific exam slot only."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                DELETE FROM seat_allocations
                WHERE exam_date=%s AND exam_time=%s AND hall_id=%s;
                """,
                (exam_date, exam_time, hall_id),
            )
            conn.commit()
            return {
                "status": "success",
                "message": f"Cleared all allocations from hall {hall_id} for this exam slot.",
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@router.delete("/batch")
def remove_batch_allocation(exam_date: str, exam_time: str, batch: str):
    """Admin action: clear every allocation for a specific batch, for a specific exam slot only."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                DELETE FROM seat_allocations
                WHERE exam_date=%s AND exam_time=%s AND batch_name=%s;
                """,
                (exam_date, exam_time, batch),
            )
            conn.commit()
            return {
                "status": "success",
                "message": f"Cleared all allocations for batch '{batch}' for this exam slot.",
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@router.post("/generate")
def generate_allocation(data: AllocationRequest):
 
    try:
 
        with get_raw_db() as conn:
 
            cursor = conn.cursor()
 
            students = []
 
            # ---------- Load students from selected batches ----------
 
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
                    (batch,)
                )
 
                batch_students = cursor.fetchall()
 
                for student in batch_students:
 
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
                        (
                            batch,
                            data.exam_date,
                            data.exam_time
                        )
                    )
 
                    subject = cursor.fetchone()
 
                    if not subject:
                        continue
 
                    students.append({
 
                        "student_id": student["student_id"],
 
                        "full_name": student["full_name"],
 
                        "batch": batch,
 
                        "subject_name": subject["subject_name"],
 
                        "subject_code": subject["subject_code"]
 
                    })
 
            # ---------- Load selected rooms ----------
            students = reorder_students(students)
            rooms = []
            all_seats = []
            total_capacity = 0
 
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
                    (hall_id,)
                )
 
                room = cursor.fetchone()
 
                if room:
 
                    rooms.append(room)
 
                    total_capacity += room["capacity"]
 
                    room_seats = generate_room_seats(room)
 
                    all_seats.extend(room_seats)
 
            allocations = allocate_students(
                students,
                all_seats
            )
            # -----------------------------
            # Delete previous allocation for this exam
            # -----------------------------
            cursor.execute(
                """
                DELETE FROM seat_allocations
                WHERE exam_date=%s
                AND exam_time=%s;
                """,
                (
                    data.exam_date,
                    data.exam_time,
                )
            )
 
            # -----------------------------
            # Save new allocations
            # -----------------------------
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
                    )
                )
 
            conn.commit()
 
            remaining_students = students[len(allocations):]
 
            return {
 
                "status": (
                    "COMPLETE"
                    if len(remaining_students) == 0
                    else "ROOM_FULL"
                ),
 
                "allocated": len(allocations),
 
                "remaining": len(remaining_students),
 
                "remaining_students": remaining_students,
 
                "allocations": allocations,
 
                "generated_seats": len(all_seats),
 
                "total_capacity": total_capacity
 
            }
 
    except Exception as e:
 
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )