from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_raw_db
from typing import Optional

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


class NotificationSend(BaseModel):
    type: str
    message: str
    target_id: Optional[str] = None


@router.get("")
def get_all_notifications():
    """Get all notifications (for admin view)."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, type, message, target_id, created_at
                FROM notifications
                ORDER BY created_at DESC
                LIMIT 50;
                """
            )
            rows = cursor.fetchall()
            result = []
            for row in rows:
                result.append({
                    "id": row["id"],
                    "type": row["type"],
                    "message": row["message"],
                    "target_id": row.get("target_id"),
                    "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
                })
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{user_id}")
def get_student_notifications(user_id: int):
    """Get notifications for a specific student."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            # Get student's batch and department
            cursor.execute(
                """
                SELECT b.batch_name, d.department_name
                FROM students s
                JOIN batches b ON s.batch_id = b.batch_id
                JOIN departments d ON s.department_id = d.department_id
                WHERE s.user_id = %s;
                """,
                (user_id,),
            )
            student_info = cursor.fetchone()
            if not student_info:
                return []

            batch_name = student_info["batch_name"]
            dept_name = student_info["department_name"]

            # Use CAST for proper type comparison
            cursor.execute(
                """
                SELECT id, type, message, target_id, created_at
                FROM notifications
                WHERE
                    type = 'all_students'
                    OR (type = 'single_student' AND CAST(target_id AS TEXT) = CAST(%s AS TEXT))
                    OR (type = 'batch_students' AND CAST(target_id AS TEXT) = CAST(%s AS TEXT))
                    OR (type = 'department_students' AND CAST(target_id AS TEXT) = CAST(%s AS TEXT))
                ORDER BY created_at DESC
                LIMIT 20;
                """,
                (str(user_id), batch_name, dept_name),
            )
            rows = cursor.fetchall()
            result = []
            for row in rows:
                result.append({
                    "id": row["id"],
                    "type": row["type"],
                    "message": row["message"],
                    "target_id": row.get("target_id"),
                    "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
                })
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/teacher/{user_id}")
def get_teacher_notifications(user_id: int):
    """Get notifications for a specific teacher."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            # Get teacher's department
            cursor.execute(
                """
                SELECT d.department_name
                FROM teachers t
                JOIN departments d ON t.department_id = d.department_id
                WHERE t.user_id = %s;
                """,
                (user_id,),
            )
            teacher_info = cursor.fetchone()
            dept_name = teacher_info["department_name"] if teacher_info else ""

            cursor.execute(
                """
                SELECT id, type, message, target_id, created_at
                FROM notifications
                WHERE
                    type = 'all_teachers'
                    OR (type = 'single_teacher' AND CAST(target_id AS TEXT) = CAST(%s AS TEXT))
                    OR (type = 'department_teachers' AND CAST(target_id AS TEXT) = CAST(%s AS TEXT))
                ORDER BY created_at DESC
                LIMIT 20;
                """,
                (str(user_id), dept_name),
            )
            rows = cursor.fetchall()
            result = []
            for row in rows:
                result.append({
                    "id": row["id"],
                    "type": row["type"],
                    "message": row["message"],
                    "target_id": row.get("target_id"),
                    "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
                })
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send")
def send_notification(data: NotificationSend):
    """Send a notification."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            # Create notifications table if not exists (with TEXT target_id)
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    target_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )

            cursor.execute(
                """
                INSERT INTO notifications (type, message, target_id)
                VALUES (%s, %s, %s);
                """,
                (data.type, data.message, data.target_id),
            )
            conn.commit()
            return {"success": True, "message": "Notification sent successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))