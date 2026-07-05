from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from database import get_raw_db
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
def allocate_students(students, seats):

    allocations = []

    bench_subjects = {}

    seat_index = 0

    for student in students:

        while seat_index < len(seats):

            seat = seats[seat_index]

            key = (
                seat["hall_id"],
                seat["row_no"],
                seat["bench_no"]
            )

            used_subjects = bench_subjects.get(key, set())

            if student["subject_code"] not in used_subjects:

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

                used_subjects.add(student["subject_code"])

                bench_subjects[key] = used_subjects

                seat_index += 1

                break

            else:

                seat_index += 1

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

            for batch in data.batches:

                # Find exam subject
                cursor.execute(
                    """
                    SELECT subject_name,
                           subject_code
                    FROM exam_routines
                    WHERE batch_name=%s
                    AND exam_date=%s
                    AND exam_time=%s;
                    """,
                    (
                        batch,
                        data.exam_date,
                        data.exam_time,
                    ),
                )

                subject = cursor.fetchone()

                if not subject:
                    continue

                # Count students
                cursor.execute(
                    """
                    SELECT COUNT(*) AS count
                    FROM students s
                    JOIN batches b
                    ON s.batch_id=b.batch_id
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
                return {

                   "total_students": len(students),

                    "allocated": len(allocations),

                    "total_capacity": total_capacity,

                    "generated_seats": len(all_seats),

                    "allocations": allocations

                        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )