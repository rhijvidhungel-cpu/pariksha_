from fastapi import APIRouter, HTTPException
from database import get_raw_db

router = APIRouter(
    prefix="/api/allocation",
    tags=["Seat Allocation"]
)

@router.get("/exams")
def get_exam_sessions():
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT DISTINCT exam_date, exam_time
                FROM exam_routines
                ORDER BY exam_date, exam_time;
            """)

            records = cursor.fetchall()

            result = []

            for row in records:
                result.append({
                    "exam_date": row["exam_date"],
                    "exam_time": row["exam_time"]
                })

            cursor.close()

            return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))