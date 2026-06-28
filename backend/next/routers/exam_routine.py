from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import logging
from database import get_raw_db

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/routines", tags=["Exam Routines"])

@router.get("")
async def get_routines(batch: str):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            query = """
                SELECT exam_date, subject_name, subject_code
                FROM exam_routines
                WHERE batch_name = %s
                ORDER BY exam_date ASC;
            """
            cursor.execute(query, (batch,))
            records = cursor.fetchall()

            # Mapping to dictionaries explicitly ensures JSON compatibility
            # Ensure the keys match exactly what your React frontend expects
            return [
                {
                    "Date": str(r[0]), 
                    "Subject": str(r[1]), 
                    "Code": str(r[2])
                } for r in records
            ]

    except Exception as e:
        logger.error(f"Error fetching routines: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/bulk")
async def upload_routine(file: UploadFile = File(...), batch: str = Form(...)):
    if not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx) files are allowed!")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Standardize: Remove extra spaces and capitalize headers
        df.columns = [c.strip().capitalize() for c in df.columns]

        required = ['Date', 'Subject', 'Code']
        if not all(col in df.columns for col in required):
            raise ValueError(f"Excel must contain exactly: {', '.join(required)}")

        with get_raw_db() as conn:
            cursor = conn.cursor()
            # Clean old records
            cursor.execute("DELETE FROM exam_routines WHERE batch_name = %s;", (batch,))

            # Insert data
            for _, row in df.iterrows():
                cursor.execute(
                    """
                    INSERT INTO exam_routines (batch_name, exam_date, subject_name, subject_code)
                    VALUES (%s, %s, %s, %s);
                    """,
                    (batch, str(row['Date']), str(row['Subject']), str(row['Code']))
                )
            conn.commit()
        return {"message": f"Routine for {batch} updated successfully!"}

    except Exception as e:
        logger.error(f"Error uploading routine: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))