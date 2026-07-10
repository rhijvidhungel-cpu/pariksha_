from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from typing import List
import bcrypt
from database import get_raw_db


router = APIRouter(
    prefix="/api/dashboards/admindashboard/teachers",
    tags=["Teachers Management Module"],
)


class TeacherSchema(BaseModel):
    name: str
    email: EmailStr
    department: str


class TeacherResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    department: str


def safe_get_field(record, key, index=0):
    if not record:
        return None
    if isinstance(record, dict):
        return record.get(key)
    return record[index]


def resolve_department(cursor, department_name: str):
    clean_department = department_name.strip()

    cursor.execute(
        "SELECT department_id FROM departments WHERE department_name = %s;",
        (clean_department,),
    )
    dept_row = cursor.fetchone()
    dept_id = safe_get_field(dept_row, "department_id", 0)

    if dept_id:
        return dept_id

    cursor.execute(
        "INSERT INTO departments (department_name) VALUES (%s) RETURNING department_id;",
        (clean_department,),
    )
    return safe_get_field(cursor.fetchone(), "department_id", 0)


@router.get("", response_model=List[TeacherResponse])
def get_teachers():
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT
                    t.teacher_id AS id,
                    t.user_id AS user_id,
                    t.full_name AS name,
                    u.username AS email,
                    d.department_name AS department
                FROM teachers t
                JOIN users u ON t.user_id = u.user_id
                LEFT JOIN departments d ON t.department_id = d.department_id
                ORDER BY t.teacher_id ASC;
                """
            )

            teachers = []
            for row in cursor.fetchall():
                teachers.append(
                    {
                        "id": safe_get_field(row, "id", 0),
                        "user_id": safe_get_field(row, "user_id", 1),
                        "name": safe_get_field(row, "name", 2),
                        "email": safe_get_field(row, "email", 3),
                        "department": safe_get_field(row, "department", 4) or "GENERIC",
                    }
                )

            return teachers

    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(teacher: TeacherSchema):
    clean_name = teacher.name.strip()
    clean_email = teacher.email.strip().lower()
    clean_department = teacher.department.strip()

    if not clean_name or not clean_email or not clean_department:
        raise HTTPException(status_code=400, detail="Name, email, and department are required.")

    with get_raw_db() as conn:
        cursor = conn.cursor()

        try:
            cursor.execute(
                "SELECT user_id FROM users WHERE LOWER(username) = LOWER(%s);",
                (clean_email,),
            )
            existing_user = cursor.fetchone()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail=f"Email '{clean_email}' is already registered in users table.",
                )

            department_id = resolve_department(cursor, clean_department)

            email_prefix = clean_email.split("@")[0]
            teacher_password = f"{clean_department}-{email_prefix}"

            hashed_password = bcrypt.hashpw(
                teacher_password.encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            cursor.execute(
                """
                INSERT INTO users (username, password, temporary_password, role, first_login)
                VALUES (%s, %s, %s, 'teacher', TRUE)
                RETURNING user_id;
                """,
                (clean_email, hashed_password, teacher_password),
            )
            user_id = safe_get_field(cursor.fetchone(), "user_id", 0)

            cursor.execute(
                """
                INSERT INTO teachers (full_name, user_id, department_id)
                VALUES (%s, %s, %s)
                RETURNING teacher_id;
                """,
                (clean_name, user_id, department_id),
            )
            teacher_id = safe_get_field(cursor.fetchone(), "teacher_id", 0)

            conn.commit()

            return {
                "id": teacher_id,
                "user_id": user_id,
                "name": clean_name,
                "email": clean_email,
                "department": clean_department,
            }

        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))


@router.put("", status_code=status.HTTP_200_OK)
def update_teacher(teacher: TeacherSchema, id: int = Query(...)):
    clean_name = teacher.name.strip()
    clean_email = teacher.email.strip().lower()
    clean_department = teacher.department.strip()

    if not clean_name or not clean_email or not clean_department:
        raise HTTPException(status_code=400, detail="Name, email, and department are required.")

    with get_raw_db() as conn:
        cursor = conn.cursor()

        try:
            cursor.execute(
                "SELECT teacher_id, user_id FROM teachers WHERE teacher_id = %s;",
                (id,),
            )
            teacher_row = cursor.fetchone()
            user_id = safe_get_field(teacher_row, "user_id", 1)

            if not user_id:
                raise HTTPException(status_code=404, detail="Teacher record not found.")

            cursor.execute(
                """
                SELECT user_id
                FROM users
                WHERE LOWER(username) = LOWER(%s)
                AND user_id != %s;
                """,
                (clean_email, user_id),
            )

            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail=f"Email '{clean_email}' is already used by another account.",
                )

            department_id = resolve_department(cursor, clean_department)

            cursor.execute(
                """
                UPDATE users
                SET username = %s, role = 'teacher'
                WHERE user_id = %s;
                """,
                (clean_email, user_id),
            )

            cursor.execute(
                """
                UPDATE teachers
                SET full_name = %s, department_id = %s
                WHERE teacher_id = %s;
                """,
                (clean_name, department_id, id),
            )

            conn.commit()

            return {
                "success": True,
                "message": "Teacher and users table updated successfully.",
            }

        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))


@router.delete("", status_code=status.HTTP_200_OK)
def delete_teacher(id: int = Query(...)):
    with get_raw_db() as conn:
        cursor = conn.cursor()

        try:
            cursor.execute(
                "SELECT user_id FROM teachers WHERE teacher_id = %s;",
                (id,),
            )
            teacher_row = cursor.fetchone()
            user_id = safe_get_field(teacher_row, "user_id", 0)

            if not user_id:
                raise HTTPException(status_code=404, detail="Teacher record not found.")

            cursor.execute("DELETE FROM teachers WHERE teacher_id = %s;", (id,))
            cursor.execute(
                """
                DELETE FROM users
                WHERE user_id = %s
                AND role = 'teacher';
                """,
                (user_id,),
            )

            conn.commit()

            return {
                "success": True,
                "message": "Teacher removed from teachers table and users table.",
            }

        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))