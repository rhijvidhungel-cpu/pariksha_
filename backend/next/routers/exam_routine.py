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
            # Updated to match your database column names: subject_name, subject_code
            query = """
                SELECT exam_date, subject_name, subject_code 
                FROM exam_routines 
                WHERE batch_name = %s 
                ORDER BY exam_date ASC;
            """
            cursor.execute(query, (batch,))
            records = cursor.fetchall()
            return [{"Date": r[0], "Subject": r[1], "Code": r[2]} for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk")
async def upload_routine(file: UploadFile = File(...), batch: str = Form(...)):
    if not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx) files are allowed!")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = [c.capitalize() for c in df.columns]
        
        # Verify required columns exist in the uploaded Excel
        if not all(col in df.columns for col in ['Date', 'Subject', 'Code']):
            raise ValueError("Excel must contain columns: 'Date', 'Subject', 'Code'")

        with get_raw_db() as conn:
            cursor = conn.cursor()
            # Clean old records for this batch
            cursor.execute("DELETE FROM exam_routines WHERE batch_name = %s;", (batch,))
            
            # Insert using your database's exact column names: subject_name, subject_code
            for _, row in df.iterrows():
                cursor.execute(
                    """
                    INSERT INTO exam_routines (
                        batch_name, 
                        exam_date, 
                        subject_name, 
                        subject_code
                    ) VALUES (%s, %s, %s, %s);
                    """,
                    (
                        str(batch), 
                        str(row['Date']), 
                        str(row['Subject']),  # Maps to subject_name
                        str(row['Code'])      # Maps to subject_code
                    )
                )
            conn.commit()
        return {"message": f"Routine for {batch} updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))