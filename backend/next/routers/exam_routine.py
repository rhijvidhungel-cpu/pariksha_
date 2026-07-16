from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import logging
from database import get_raw_db

logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/api/routines",
    tags=["Exam Routines"]
)


# ----------------------------
# GET ALL ROUTINES (teacher/student dashboards)
# ----------------------------
@router.get("/all")
async def get_all_routines():
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT
                    batch_name,
                    exam_date,
                    exam_time,
                    subject_name,
                    subject_code
                FROM exam_routines
                ORDER BY batch_name ASC, exam_date ASC, exam_time ASC;
                """
            )

            records = cursor.fetchall()
            results = []

            for row in records:
                results.append({
                    "batch_name": row["batch_name"],
                    "exam_date": str(row["exam_date"]),
                    "exam_time": row["exam_time"] or "",
                    "subject_name": row["subject_name"],
                    "subject_code": row["subject_code"],
                })

            return results

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------
# GET ROUTINE BY BATCH
# ----------------------------
@router.get("")
async def get_routines(batch: str):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT
                    exam_date,
                    exam_time,
                    subject_name,
                    subject_code
                FROM exam_routines
                WHERE batch_name=%s
                ORDER BY exam_date ASC;
                """,
                (batch,)
            )

            records = cursor.fetchall()

            results = []

            for row in records:
                results.append({
                    "Date": str(row["exam_date"]),
                    "Time": row["exam_time"] if row["exam_time"] else "",
                    "Subject": row["subject_name"],
                    "Code": row["subject_code"]
                })

            cursor.close()
            return results

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------
# UPLOAD ROUTINE
# ----------------------------
def normalize_time(time_val):
    """
    Normalize exam_time values so that different Excel formatting
    does not create duplicate slots.
    
    Examples:
      "10:00-12:00"    -> "10:00-12:00"
      "10:00 - 12:00"  -> "10:00-12:00"
      "10:00-12:00 "   -> "10:00-12:00"
      " 10:00-12:00"   -> "10:00-12:00"
    """
    if not time_val or str(time_val).strip() == "":
        return ""
    
    # Convert to string and strip
    s = str(time_val).strip()
    
    # Normalize spaces around hyphens
    # Replace " - " with "-", " -" with "-", "- " with "-"
    import re
    s = re.sub(r'\s*-\s*', '-', s)
    
    # Collapse multiple spaces
    s = re.sub(r'\s+', ' ', s)
    
    return s


def convert_excel_date(value):
    if pd.isna(value):
        return None

    # Excel serial number
    if isinstance(value, (int, float)):
        return pd.to_datetime(
            value,
            unit="D",
            origin="1899-12-30"
        ).date()

    # Already a datetime
    if isinstance(value, pd.Timestamp):
        return value.date()

    # Normal string
    return pd.to_datetime(value).date()


@router.post("/bulk")
async def upload_routine(
    file: UploadFile = File(...),
    batch: str = Form(...)
):

    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Upload an Excel file."
        )

    try:

        contents = await file.read()

        df = pd.read_excel(io.BytesIO(contents))

        df.columns = [c.strip().capitalize() for c in df.columns]

        required = ["Date", "Subject", "Code"]

        for col in required:
            if col not in df.columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing column '{col}'"
                )

        # Optional time column
        if "Time" not in df.columns:
            df["Time"] = ""

        df["Date"] = df["Date"].apply(convert_excel_date)
        
        # Normalize the time column
        df["Time"] = df["Time"].apply(normalize_time)

        # Filter out rows with invalid dates
        df = df[df["Date"].notna()]

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="No valid rows found in the uploaded file."
            )

        with get_raw_db() as conn:

            cursor = conn.cursor()

            try:

                cursor.execute(
                    """
                    DELETE FROM exam_routines
                    WHERE batch_name=%s;
                    """,
                    (batch,)
                )

                for _, row in df.iterrows():
                    cursor.execute(
                        """
                        INSERT INTO exam_routines
                        (
                            batch_name,
                            exam_date,
                            subject_name,
                            subject_code,
                            exam_time
                        )

                        VALUES
                        (%s,%s,%s,%s,%s);
                        """,
                        (
                            batch,
                            str(row["Date"]),
                            row["Subject"],
                            row["Code"],
                            str(row["Time"]) if row["Time"] else ""
                        )
                    )

                conn.commit()

            except Exception as e:
                conn.rollback()
                raise e

            finally:
                cursor.close()

        return {
            "message": "Routine uploaded successfully."
        }

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions")
def get_sessions():
    with get_raw_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DISTINCT
                TRIM(exam_date) AS exam_date,
                TRIM(exam_time) AS exam_time
            FROM exam_routines
            WHERE exam_date IS NOT NULL
            ORDER BY exam_date, exam_time;
        """)

        return cursor.fetchall()