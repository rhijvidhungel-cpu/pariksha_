from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from typing import List

# Import connection tools directly out of your main directory context layout
from database import get_raw_db

router = APIRouter(
    prefix="/api/dashboards/admindashboard/teacher",
    tags=["Teachers Management Module"]
)

# Pydantic schema validation layers
class TeacherSchema(BaseModel):
    name: str
    email: EmailStr
    department: str

class TeacherResponse(BaseModel):
    id: int
    name: str
    email: str
    department: str

# Helper function to extract fields from query results safely
def safe_get_field(record, key, index=0):
    if not record:
        return None
    if isinstance(record, dict):
        return record.get(key)
    return record[index]

# =========================================================================
# 1. GET: Fetch active faculty members
# =========================================================================
@router.get("", response_model=List[TeacherResponse])
def get_teachers():
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            query = """
                SELECT 
                    t.teacher_id AS id, 
                    t.full_name AS name, 
                    u.username AS email, 
                    d.department_name AS department
                FROM teachers t
                JOIN users u ON t.user_id = u.user_id
                LEFT JOIN departments d ON t.department_id = d.department_id
                ORDER BY t.teacher_id ASC;
            """
            cursor.execute(query)
            records = cursor.fetchall()
            
            teachers = []
            for r in records:
                teachers.append({
                    "id": safe_get_field(r, "id", 0),
                    "name": safe_get_field(r, "name", 1),
                    "email": safe_get_field(r, "email", 2),
                    "department": safe_get_field(r, "department", 3) or "GENERIC"
                })
            return teachers
    except Exception as db_err:
        raise HTTPException(
            status_code=500, 
            detail=f"Database data stream pipeline error: {str(db_err)}"
        )

# =========================================================================
# 2. POST: Insert manual teacher records
# =========================================================================
@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(teacher: TeacherSchema):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT 1 FROM users WHERE username = %s;", (teacher.email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email pointer matrix '{teacher.email}' is already registered."
            )
            
        try:
            cursor.execute("SELECT department_id FROM departments WHERE department_name = %s;", (teacher.department,))
            dept_row = cursor.fetchone()
            dept_id = safe_get_field(dept_row, "department_id", 0)
            
            if not dept_id:
                cursor.execute(
                    "INSERT INTO departments (department_name) VALUES (%s) RETURNING department_id;", 
                    (teacher.department,)
                )
                dept_id = safe_get_field(cursor.fetchone(), "department_id", 0)

            cursor.execute(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, 'teacher') RETURNING user_id;",
                (teacher.email, "teacher123")
            )
            user_id = safe_get_field(cursor.fetchone(), "user_id", 0)

            cursor.execute(
                """
                INSERT INTO teachers (full_name, user_id, department_id) 
                VALUES (%s, %s, %s) RETURNING teacher_id;
                """,
                (teacher.name, user_id, dept_id)
            )
            teacher_id = safe_get_field(cursor.fetchone(), "teacher_id", 0)
            
            conn.commit()
            return {
                "id": teacher_id,
                "name": teacher.name,
                "email": teacher.email,
                "department": teacher.department
            }
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Transaction runtime error execution halt: {str(err)}")

# =========================================================================
# 3. PUT: Update existing faculty details and system accounts
# =========================================================================
@router.put("", status_code=status.HTTP_200_OK)
def update_teacher(teacher: TeacherSchema, id: int = Query(..., description="Teacher ID to update")):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        
        # Pull associated user_id for tracking update markers
        cursor.execute("SELECT user_id FROM teachers WHERE teacher_id = %s;", (id,))
        teacher_row = cursor.fetchone()
        user_id = safe_get_field(teacher_row, "user_id", 0)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Requested teacher profile metadata could not be tracked."
            )
            
        try:
            # 1. Resolve or verify targeted department allocation strings
            cursor.execute("SELECT department_id FROM departments WHERE department_name = %s;", (teacher.department,))
            dept_row = cursor.fetchone()
            dept_id = safe_get_field(dept_row, "department_id", 0)
            
            if not dept_id:
                cursor.execute(
                    "INSERT INTO departments (department_name) VALUES (%s) RETURNING department_id;", 
                    (teacher.department,)
                )
                dept_id = safe_get_field(cursor.fetchone(), "department_id", 0)
            
            # 2. Update core credentials user accounts tables records
            cursor.execute("UPDATE users SET username = %s WHERE user_id = %s;", (teacher.email, user_id))
            
            # 3. Update main structural tables records
            cursor.execute(
                "UPDATE teachers SET full_name = %s, department_id = %s WHERE teacher_id = %s;", 
                (teacher.name, dept_id, id)
            )
            
            conn.commit()
            return {"success": True, "message": "Teacher records sync mutation processed clean."}
        except Exception as update_err:
            conn.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Database update transactional drop failure: {str(update_err)}"
            )

# =========================================================================
# 4. DELETE: Expunge selected records
# =========================================================================
@router.delete("", status_code=status.HTTP_200_OK)
def delete_teacher(id: int = Query(..., description="Target database tracking primary key")):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT user_id FROM teachers WHERE teacher_id = %s;", (id,))
        teacher_row = cursor.fetchone()
        user_id = safe_get_field(teacher_row, "user_id", 0)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target query selection could not find requested teacher index record markers."
            )
            
        try:
            cursor.execute("DELETE FROM teachers WHERE teacher_id = %s;", (id,))
            cursor.execute("DELETE FROM users WHERE user_id = %s;", (user_id,))
            conn.commit()
            return {"success": True, "message": "Faculty member profile cleaned down."}
        except Exception as transactional_err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(transactional_err))