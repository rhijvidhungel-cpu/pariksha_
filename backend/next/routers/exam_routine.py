from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import logging
from database import get_raw_db

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/routines", tags=["Exam Routines"])

@router.get("", status_code=200) 
async def get_routines(batch: str):
    conn = None
    try:
        conn = get_raw_db()
        cursor = conn.cursor()
        
        # Ensure the table name exactly matches your database (case-sensitive)
        query = "SELECT exam_date, subject_name, subject_code FROM exam_routines WHERE batch_name = %s ORDER BY exam_date ASC;"
        cursor.execute(query, (batch,))
        records = cursor.fetchall()
        
        if not records:
            return [] # Return empty list instead of crashing

        # Format data safely
        data = []
        for r in records:
            data.append({
                "Date": str(r[0]),
                "Subject": str(r[1]),
                "Code": str(r[2])
            })
        return data

    except Exception as e:
        # This will print the FULL traceback in your logs, not just '0'
        import traceback
        logger.error(f"FULL TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Database failure. Check server logs.")
    finally:
        if conn:
            conn.close()