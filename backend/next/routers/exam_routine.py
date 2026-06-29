from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import logging
from database import get_raw_db

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/routines", tags=["Exam Routines"])

@router.get("")
async def get_routines(batch: str):
    """
    Fetches the exam routine for a specific batch.
    """
    try:
        # We assume get_raw_db() is a context manager.
        with get_raw_db() as conn:
            # If conn is a connection pool wrapper, ensure we get a real connection
            # If get_raw_db returns the connection directly, this works as is.
            cursor = conn.cursor()
            
            query = """
                SELECT exam_date, subject_name, subject_code
                FROM exam_routines
                WHERE batch_name = %s
                ORDER BY exam_date ASC;
            """
            cursor.execute(query, (batch,))
            records = cursor.fetchall()
            
            # Map the results to a list of dictionaries
            results = [{"Date": str(r[0]), "Subject": str(r[1]), "Code": str(r[2])} for r in records]
            
            cursor.close()
            return results

    except Exception as e:
        # Logging the actual exception type and message
        logger.error(f"Database error in get_routines: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@router.post("/bulk")
async def upload_routine(file: UploadFile = File(...), batch: str = Form(...)):
    """
    Uploads an Excel file to update the routine for a specific batch.
    """
    if not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx) files are allowed!")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Standardize: Remove extra spaces and capitalize headers
        df.columns = [c.strip().capitalize() for c in df.columns]

        # Validate required columns
        required = ['Date', 'Subject', 'Code']
        if not all(col in df.columns for col in required):
            raise ValueError(f"Excel must contain exactly: {', '.join(required)}")

        with get_raw_db() as conn:
            cursor = conn.cursor()
            
            # Use a transaction to ensure integrity
            try:
                # Clean old records for this batch
                cursor.execute("DELETE FROM exam_routines WHERE batch_name = %s;", (batch,))

                # Insert new data
                for _, row in df.iterrows():
                    cursor.execute(
                        """
                        INSERT INTO exam_routines (batch_name, exam_date, subject_name, subject_code)
                        VALUES (%s, %s, %s, %s);
                        """,
                        (batch, str(row['Date']), str(row['Subject']), str(row['Code']))
                    )
                conn.commit() # Commit changes
            except Exception as e:
                conn.rollback() # Rollback if anything fails during insertion
                raise e
            finally:
                cursor.close()

        return {"message": f"Routine for {batch} updated successfully!"}

    except Exception as e:
        logger.error(f"Error uploading routine: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))