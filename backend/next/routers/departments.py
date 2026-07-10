from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List

from database import get_raw_db


router = APIRouter(prefix="/api/departments", tags=["Departments and Batches"])


class BatchCreate(BaseModel):
    batch_name: str


class DepartmentCreate(BaseModel):
    department_name: str


class BatchResponse(BaseModel):
    batch_id: int
    batch_name: str
    department_id: int
    student_count: int = 0


class DepartmentResponse(BaseModel):
    department_id: int
    department_name: str
    batches: List[BatchResponse] = []


def safe_get_field(record, key, index=0):
    if not record:
        return None
    if isinstance(record, dict):
        return record.get(key)
    return record[index]


def clean_name(value: str, field_name: str):
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        raise HTTPException(status_code=400, detail=f"{field_name} is required.")
    return cleaned


@router.get("", response_model=List[DepartmentResponse])
def get_departments():
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT
                    d.department_id,
                    d.department_name,
                    b.batch_id,
                    b.batch_name,
                    COUNT(s.student_id) AS student_count
                FROM departments d
                LEFT JOIN batches b ON b.department_id = d.department_id
                LEFT JOIN students s ON s.batch_id = b.batch_id
                GROUP BY d.department_id, d.department_name, b.batch_id, b.batch_name
                ORDER BY d.department_name ASC, b.batch_name ASC;
                """
            )

            departments = {}
            for row in cursor.fetchall():
                department_id = safe_get_field(row, "department_id", 0)
                if department_id not in departments:
                    departments[department_id] = {
                        "department_id": department_id,
                        "department_name": safe_get_field(row, "department_name", 1),
                        "batches": [],
                    }

                batch_id = safe_get_field(row, "batch_id", 2)
                if batch_id:
                    departments[department_id]["batches"].append(
                        {
                            "batch_id": batch_id,
                            "batch_name": safe_get_field(row, "batch_name", 3),
                            "department_id": department_id,
                            "student_count": safe_get_field(row, "student_count", 4) or 0,
                        }
                    )

            return list(departments.values())
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate):
    department_name = clean_name(payload.department_name, "Department name")

    with get_raw_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                SELECT department_id, department_name
                FROM departments
                WHERE LOWER(department_name) = LOWER(%s);
                """,
                (department_name,),
            )
            existing = cursor.fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Department already exists.")

            cursor.execute(
                """
                INSERT INTO departments (department_name)
                VALUES (%s)
                RETURNING department_id, department_name;
                """,
                (department_name,),
            )
            created = cursor.fetchone()
            conn.commit()

            return {
                "department_id": safe_get_field(created, "department_id", 0),
                "department_name": safe_get_field(created, "department_name", 1),
                "batches": [],
            }
        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(department_id: int, payload: DepartmentCreate):
    department_name = clean_name(payload.department_name, "Department name")

    with get_raw_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT department_id FROM departments WHERE department_id = %s;",
                (department_id,),
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Department not found.")

            cursor.execute(
                """
                SELECT department_id
                FROM departments
                WHERE LOWER(department_name) = LOWER(%s)
                AND department_id != %s;
                """,
                (department_name, department_id),
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Department name already exists.")

            cursor.execute(
                """
                UPDATE departments
                SET department_name = %s
                WHERE department_id = %s
                RETURNING department_id, department_name;
                """,
                (department_name, department_id),
            )
            updated = cursor.fetchone()
            conn.commit()

            return {
                "department_id": safe_get_field(updated, "department_id", 0),
                "department_name": safe_get_field(updated, "department_name", 1),
                "batches": [],
            }
        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))


@router.delete("/{department_id}")
def delete_department(department_id: int):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT department_id FROM departments WHERE department_id = %s;",
                (department_id,),
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Department not found.")

            cursor.execute(
                "SELECT COUNT(*) AS total FROM batches WHERE department_id = %s;",
                (department_id,),
            )
            batch_count = safe_get_field(cursor.fetchone(), "total", 0) or 0
            if batch_count:
                raise HTTPException(
                    status_code=400,
                    detail="Delete or move all batches before removing this department.",
                )

            cursor.execute("DELETE FROM departments WHERE department_id = %s;", (department_id,))
            conn.commit()
            return {"success": True, "message": "Department deleted successfully."}
        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))


@router.post("/{department_id}/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(department_id: int, payload: BatchCreate):
    batch_name = clean_name(payload.batch_name, "Batch name").upper()

    with get_raw_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT department_id FROM departments WHERE department_id = %s;",
                (department_id,),
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Department not found.")

            cursor.execute(
                """
                SELECT batch_id
                FROM batches
                WHERE LOWER(batch_name) = LOWER(%s);
                """,
                (batch_name,),
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Batch already exists.")

            cursor.execute(
                """
                INSERT INTO batches (batch_name, department_id)
                VALUES (%s, %s)
                RETURNING batch_id, batch_name, department_id;
                """,
                (batch_name, department_id),
            )
            created = cursor.fetchone()
            conn.commit()

            return {
                "batch_id": safe_get_field(created, "batch_id", 0),
                "batch_name": safe_get_field(created, "batch_name", 1),
                "department_id": safe_get_field(created, "department_id", 2),
                "student_count": 0,
            }
        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))


@router.put("/batches/{batch_id}", response_model=BatchResponse)
def update_batch(batch_id: int, payload: BatchCreate):
    batch_name = clean_name(payload.batch_name, "Batch name").upper()

    with get_raw_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                SELECT batch_id, department_id
                FROM batches
                WHERE batch_id = %s;
                """,
                (batch_id,),
            )
            batch = cursor.fetchone()
            if not batch:
                raise HTTPException(status_code=404, detail="Batch not found.")

            cursor.execute(
                "SELECT COUNT(*) AS total FROM students WHERE batch_id = %s;",
                (batch_id,),
            )
            student_count = safe_get_field(cursor.fetchone(), "total", 0) or 0
            if student_count:
                raise HTTPException(
                    status_code=400,
                    detail="Batch rename is blocked after students are added because usernames include the batch name.",
                )

            cursor.execute(
                """
                SELECT batch_id
                FROM batches
                WHERE LOWER(batch_name) = LOWER(%s)
                AND batch_id != %s;
                """,
                (batch_name, batch_id),
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Batch name already exists.")

            cursor.execute(
                """
                UPDATE batches
                SET batch_name = %s
                WHERE batch_id = %s
                RETURNING batch_id, batch_name, department_id;
                """,
                (batch_name, batch_id),
            )
            updated = cursor.fetchone()
            conn.commit()

            return {
                "batch_id": safe_get_field(updated, "batch_id", 0),
                "batch_name": safe_get_field(updated, "batch_name", 1),
                "department_id": safe_get_field(updated, "department_id", 2),
                "student_count": 0,
            }
        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))


@router.delete("/batches/{batch_id}")
def delete_batch(batch_id: int):
    with get_raw_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT batch_id FROM batches WHERE batch_id = %s;", (batch_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Batch not found.")

            cursor.execute(
                "SELECT COUNT(*) AS total FROM students WHERE batch_id = %s;",
                (batch_id,),
            )
            student_count = safe_get_field(cursor.fetchone(), "total", 0) or 0
            if student_count:
                raise HTTPException(
                    status_code=400,
                    detail="Remove students from this batch before deleting it.",
                )

            cursor.execute("DELETE FROM batches WHERE batch_id = %s;", (batch_id,))
            conn.commit()
            return {"success": True, "message": "Batch deleted successfully."}
        except HTTPException:
            conn.rollback()
            raise
        except Exception as err:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(err))
