import io
import traceback
import pandas as pd


from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# Import your routers correctly
from routers import teachers
from routers.allocation import router as allocation_router
from routers.seat_allocation import router as seat_allocation_router
from routers import batches
from routers.exam_routine import router as exam_routine_router
import loginapi
#from routers import seat_allocation

# Import local db pool mapping initialization file
from database import get_raw_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pariksha-vjxk.vercel.app"], # Your specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_get_field(record, key, index=0):
    """Safely handles database item mapping extraction arrays across varying execution drivers."""
    if not record:
        return None
    if isinstance(record, dict):
        return record.get(key)
    return record[index]

# Mount the routers to the FastAPI application instance
app.include_router(teachers.router)
app.include_router(loginapi.router) 
app.include_router(exam_routine_router)
app.include_router(allocation_router, prefix="/rooms")
app.include_router(batches.router)
app.include_router(seat_allocation_router)

@app.get("/api/students")
def get_students():
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            query = """
                SELECT 
                    s.student_id AS sn,
                    s.full_name AS name,
                    u.username AS roll,
                    b.batch_name AS batch
                FROM students s
                JOIN users u ON s.user_id = u.user_id
                LEFT JOIN batches b ON s.batch_id = b.batch_id
                ORDER BY s.student_id ASC;
            """
            cursor.execute(query)
            return cursor.fetchall()
    except Exception as db_err:
        raise HTTPException(
            status_code=500, 
            detail=f"Database pipeline connectivity failure: {str(db_err)}"
        )

@app.get("/api/batches")
def get_batches():
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT batch_name FROM batches ORDER BY batch_name ASC;")
            records = cursor.fetchall()
            
            batches = []
            for item in records:
                name = safe_get_field(item, 'batch_name', 0)
                if name and name not in batches:
                    batches.append(name)
            return batches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def resolve_academic_keys(cursor, batch_name: str):
    """Handles and establishes clean foreign key associations inside relational schemes."""
    dept_name = batch_name.split('-')[0] if '-' in batch_name else "GENERIC"
    
    cursor.execute("SELECT department_id FROM departments WHERE department_name = %s;", (dept_name,))
    dept = cursor.fetchone()
    dept_id = safe_get_field(dept, 'department_id', 0)
    
    if not dept_id:
        cursor.execute("INSERT INTO departments (department_name) VALUES (%s) RETURNING department_id;", (dept_name,))
        dept_id = safe_get_field(cursor.fetchone(), 'department_id', 0)

    cursor.execute("SELECT batch_id FROM batches WHERE batch_name = %s;", (batch_name,))
    batch = cursor.fetchone()
    batch_id = safe_get_field(batch, 'batch_id', 0)
    
    if not batch_id:
        cursor.execute(
            "INSERT INTO batches (batch_name, department_id) VALUES (%s, %s) RETURNING batch_id;", 
            (batch_name, dept_id)
        )
        batch_id = safe_get_field(cursor.fetchone(), 'batch_id', 0)
        
    return dept_id, batch_id

@app.post("/api/students/bulk")
async def bulk_excel_upload(file: UploadFile = File(...), batch: str = Form(...)):
    contents = await file.read()
    target_batch_enforced = batch.strip().upper()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        df.columns = df.columns.str.strip().str.upper()

        name_col = next((c for c in df.columns if c in ['FULL NAME', 'NAME']), None)
        roll_col = next((c for c in df.columns if c in ['ROLL NUMBER', 'ROLL NO', 'ROLL']), None)
        batch_col = next((c for c in df.columns if c in ['TARGET BATCH', 'BATCH']), None)

        if not name_col or not roll_col:
            raise ValueError("Spreadsheet rows must include 'Full Name' and 'Roll Number' columns.")
        
        with get_raw_db() as conn:
            cursor = conn.cursor()
            inserted = 0
            skipped_duplicates = 0
            skipped_mismatch = 0
            
            dept_id, batch_id = resolve_academic_keys(cursor, target_batch_enforced)
            
            cursor.execute("""
                SELECT u.username FROM students s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.batch_id = %s;
            """, (batch_id,))
            existing_usernames = {safe_get_field(r, 'username', 0) for r in cursor.fetchall()}
            
            for index, row in df.iterrows():
                roll_val = str(row[roll_col]).split('.')[0].strip() if '.' in str(row[roll_col]) else str(row[roll_col]).strip()
                name_val = str(row[name_col]).strip()
                file_batch_val = str(row[batch_col]).strip().upper() if batch_col in df.columns else target_batch_enforced
                
                if not roll_val or roll_val == "nan" or not name_val or name_val == "nan":
                    continue
                
                if file_batch_val != target_batch_enforced:
                    skipped_mismatch += 1
                    continue
                
                composite_username = f"{roll_val}-{target_batch_enforced}"
                
                if composite_username in existing_usernames or roll_val in existing_usernames:
                    skipped_duplicates += 1
                    continue 
                parts = composite_username.split("-")
                student_password = f"{parts[0]}-{parts[1]}@{parts[2]}"
                cursor.execute(
                    "INSERT INTO users (username, password, role) VALUES (%s, %s, 'student') RETURNING user_id;",
                     (composite_username, student_password)
                )
                user_id = safe_get_field(cursor.fetchone(), 'user_id', 0)
                
                cursor.execute(
                    "INSERT INTO students (full_name, user_id, department_id, batch_id) VALUES (%s, %s, %s, %s);",
                    (name_val, user_id, dept_id, batch_id)
                )
                
                existing_usernames.add(composite_username)
                inserted += 1
                
            conn.commit()
            
            msg = f"Parsed successfully for batch {target_batch_enforced}. Added: {inserted} records."
            if skipped_duplicates > 0:
                msg += f" Skipped {skipped_duplicates} existing roll items."
            if skipped_mismatch > 0:
                msg += f" Omitted {skipped_mismatch} entries belonging to alternative batches."
                
            return {"success": True, "message": msg}
            
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/students/manual")
def add_manual_student(payload: dict):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        roll = str(payload.get("roll")).strip()
        name = str(payload.get("name")).strip()
        batch_str = str(payload.get("batch")).strip().upper()
        
        if not roll or not name or not batch_str:
            raise HTTPException(status_code=400, detail="Missing required configuration fields.")
            
        dept_id, batch_id = resolve_academic_keys(cursor, batch_str)
        composite_username = f"{roll}-{batch_str}"
        
        check_query = """
            SELECT 1 FROM students s
            WHERE s.batch_id = %s AND s.user_id IN (
                SELECT user_id FROM users WHERE username = %s OR username = %s
            );
        """
        cursor.execute(check_query, (batch_id, roll, composite_username))
        if cursor.fetchone():
            raise HTTPException(
                status_code=400, 
                detail=f"Roll ID '{roll}' already exists within the chosen batch structure '{batch_str}'."
            )
            
        parts = composite_username.split("-")
        student_password = f"{parts[0]}-{parts[1]}@{parts[2]}"
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, 'student') RETURNING user_id;",
            (composite_username, student_password)
        )
        user_id = safe_get_field(cursor.fetchone(), 'user_id', 0)
        
        cursor.execute(
            "INSERT INTO students (full_name, user_id, department_id, batch_id) VALUES (%s, %s, %s, %s);",
            (name, user_id, dept_id, batch_id)
        )
        conn.commit()
        return {"success": True}

@app.delete("/api/students/manual")
def delete_student(roll: str, batch: str):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        
        clean_roll = roll.strip()
        clean_batch = batch.strip().upper()
        
        composite_username = f"{clean_roll}-{clean_batch}"
        cursor.execute("SELECT user_id FROM users WHERE username = %s;", (composite_username,))
        user_record = cursor.fetchone()
        
        if not user_record:
            fallback_query = """
                SELECT u.user_id FROM users u
                JOIN students s ON u.user_id = s.user_id
                JOIN batches b ON s.batch_id = b.batch_id
                WHERE u.username = %s AND b.batch_name = %s;
            """
            cursor.execute(fallback_query, (clean_roll, clean_batch))
            user_record = cursor.fetchone()
        
        if user_record:
            uid = safe_get_field(user_record, 'user_id', 0)
            cursor.execute("DELETE FROM students WHERE user_id = %s;", (uid,))
            cursor.execute("DELETE FROM users WHERE user_id = %s;", (uid,))
            conn.commit()
            return {"success": True, "message": "Record cleaned successfully."}
        
        raise HTTPException(status_code=404, detail="Target student record lookup failed.")

@app.delete("/api/students/bulk-purge")
def bulk_purge_batch(batch: str):
    clean_batch = batch.strip().upper()
    
    with get_raw_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT batch_id FROM batches WHERE batch_name = %s;", (clean_batch,))
        batch_record = cursor.fetchone()
        batch_id = safe_get_field(batch_record, 'batch_id', 0)
        
        if not batch_id:
            raise HTTPException(status_code=404, detail=f"Batch '{clean_batch}' does not exist.")
            
        cursor.execute("SELECT user_id FROM students WHERE batch_id = %s;", (batch_id,))
        user_rows = cursor.fetchall()
        user_ids = [safe_get_field(r, 'user_id', 0) for r in user_rows if safe_get_field(r, 'user_id', 0)]
        
        if user_ids:
            cursor.execute("DELETE FROM students WHERE batch_id = %s;", (batch_id,))
            format_strings = ','.join(['%s'] * len(user_ids))
            cursor.execute(f"DELETE FROM users WHERE user_id IN ({format_strings});", tuple(user_ids))
            
        conn.commit()
        return {"success": True, "message": f"Successfully purged all students from batch '{clean_batch}'."}

@app.put("/api/students/update")
def update_student_credentials(payload: dict):
    student_id = payload.get("student_id")
    new_name = str(payload.get("new_name", "")).strip()
    new_roll = str(payload.get("new_roll", "")).strip()
    batch_name = str(payload.get("batch", "")).strip().upper()
    
    if not student_id or not new_name or not new_roll or not batch_name:
        raise HTTPException(status_code=400, detail="Missing required input properties.")
        
    with get_raw_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT user_id, batch_id FROM students WHERE student_id = %s;", (student_id,))
        student_record = cursor.fetchone()
        if not student_record:
            raise HTTPException(status_code=404, detail="Student profile not found.")
            
        user_id = safe_get_field(student_record, 'user_id', 0)
        batch_id = safe_get_field(student_record, 'batch_id', 1)
        
        new_composite_username = f"{new_roll}-{batch_name}"
        
        check_query = """
            SELECT student_id FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.batch_id = %s AND u.username = %s AND s.student_id != %s;
        """
        cursor.execute(check_query, (batch_id, new_composite_username, student_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail=f"Roll number '{new_roll}' already exists in batch '{batch_name}'.")
            
        cursor.execute("UPDATE students SET full_name = %s WHERE student_id = %s;", (new_name, student_id))
        cursor.execute("UPDATE users SET username = %s WHERE user_id = %s;", (new_composite_username, user_id))
        
        conn.commit()
        return {"success": True, "message": "Student credentials modified successfully."}
@app.get("/version")
def version():
    return {
        "message": "NEW BACKEND",
        "date": "2026-07-04"
    }