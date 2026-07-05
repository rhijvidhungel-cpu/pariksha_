from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from database import get_raw_db

router = APIRouter(
    prefix="/api/seat-allocation",
    tags=["Seat Allocation"]
)


class PreviewRequest(BaseModel):
    exam_date: str
    exam_time: str
    batches: List[str]


@router.post("/preview")
def preview_allocation(data: PreviewRequest):

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
                    SELECT COUNT(*)
                    FROM students s
                    JOIN batches b
                    ON s.batch_id=b.batch_id
                    WHERE b.batch_name=%s;
                    """,
                    (batch,),
                )

                count = cursor.fetchone()[0]

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