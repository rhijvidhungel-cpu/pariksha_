from fastapi import APIRouter, HTTPException
from database import get_raw_db

router = APIRouter(
    prefix="/api/allocation",
    tags=["Seat Allocation"]
)


@router.get("/sessions")
def get_exam_sessions():
    """
    Returns all available exam sessions (Date + Time)
    """

    try:
        with get_raw_db() as conn:

            cursor = conn.cursor()

            cursor.execute("""
                SELECT DISTINCT exam_date, exam_time
                FROM exam_routines
                ORDER BY exam_date, exam_time;
            """)

            rows = cursor.fetchall()

            sessions = []

            for row in rows:
                sessions.append({
                    "exam_date": row["exam_date"],
                    "exam_time": row["exam_time"]
                })

            cursor.close()

            return sessions

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session")
def get_session_details(exam_date: str, exam_time: str):
    """
    Returns all batches appearing for a selected session
    with subject and student count.
    """

    try:

        with get_raw_db() as conn:

            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    er.batch_name,
                    er.subject_name,
                    er.subject_code,
                    COUNT(s.student_id) AS students

                FROM exam_routines er

                LEFT JOIN batches b
                    ON er.batch_name = b.batch_name

                LEFT JOIN students s
                    ON b.batch_id = s.batch_id

                WHERE
                    er.exam_date=%s
                    AND er.exam_time=%s

                GROUP BY
                    er.batch_name,
                    er.subject_name,
                    er.subject_code

                ORDER BY
                    er.batch_name;
            """, (exam_date, exam_time))

            rows = cursor.fetchall()

            batches = []
            total = 0

            for row in rows:

                count = int(row["students"])

                total += count

                batches.append({

                    "batch": row["batch_name"],

                    "subject": row["subject_name"],

                    "subject_code": row["subject_code"],

                    "students": count

                })

            cursor.close()

            return {

                "exam_date": exam_date,

                "exam_time": exam_time,

                "total_students": total,

                "batches": batches

            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))