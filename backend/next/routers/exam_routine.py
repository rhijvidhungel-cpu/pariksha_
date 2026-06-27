from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
from database import get_raw_db

router = APIRouter(prefix="/api/routines", tags=["Exam Routines"])

@router.get("/")
async def get_routines(batch: str):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            query = "SELECT exam_date, subject, subject_code FROM exam_routines WHERE batch_name = %s ORDER BY exam_date ASC;"
            cursor.execute(query, (batch,))
            records = cursor.fetchall()
            # Return data in a format the frontend expects
            return [{"Date": r[0], "Subject": r[1], "Code": r[2]} for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk")
async def upload_routine(file: UploadFile = File(...), batch: str = Form(...)):
    # FIX: Check for Excel extensions, not PDF
    if not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx) files are allowed!")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = [c.capitalize() for c in df.columns]
        
        if not all(col in df.columns for col in ['Date', 'Subject', 'Code']):
            raise ValueError("Excel must contain columns: 'Date', 'Subject', 'Code'")

        with get_raw_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM exam_routines WHERE batch_name = %s;", (batch,))
            for _, row in df.iterrows():
                cursor.execute(
                    "INSERT INTO exam_routines (batch_name, exam_date, subject, subject_code) VALUES (%s, %s, %s, %s);",
                    (batch, str(row['Date']), str(row['Subject']), str(row['Code']))
                )
            conn.commit()
        return {"message": f"Routine for {batch} updated!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))