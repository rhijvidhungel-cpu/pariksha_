from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_raw_db
import bcrypt

router = APIRouter()


class Login(BaseModel):
    username: str
    password: str


class ChangePassword(BaseModel):
    user_id: int
    current_password: str
    new_password: str


@router.post("/login")
def login(data: Login):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT user_id, username,password, role, first_login
                FROM users
                WHERE username=%s;
                """,
                (data.username,),
            )

            user = cursor.fetchone()

            if not user:
                return {
                    "success": False,
                    "message": "Invalid login",
                }
            stored_password = (
                user["password"] if isinstance(user, dict) else user[2]
            )

            if not bcrypt.checkpw(
                data.password.encode("utf-8"),
                stored_password.encode("utf-8"),
            ):
                return {
                    "success": False,
                    "message": "Invalid login",
                }

            # Supports both RealDictCursor and normal cursor
            user_id = user["user_id"] if isinstance(user, dict) else user[0]
            username = user["username"] if isinstance(user, dict) else user[1]
            role = user["role"] if isinstance(user, dict) else user[3]
            first_login = user["first_login"] if isinstance(user, dict) else user[4]

            # DEBUG
            print("========== LOGIN SUCCESS ==========")
            print("User ID      :", user_id)
            print("Username     :", username)
            print("Role         :", role)
            print("First Login  :", first_login)
            print("===================================")

            return {
                "success": True,
                "user_id": user_id,
                "username": username,
                "role": role,
                "first_login": first_login,
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Database error pipeline halt: {str(e)}",
        }


@router.post("/change-password")
def change_password(data: ChangePassword):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT password
                FROM users
                WHERE user_id=%s;
                """,
                (data.user_id,),
            )

            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found",
                )

            old_password = (
                user["password"] if isinstance(user, dict) else user[0]
            )

            if not bcrypt.checkpw(
            data.current_password.encode("utf-8"),
                old_password.encode("utf-8"),
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Current password is incorrect.",
                )

            hashed_password = bcrypt.hashpw(
                data.new_password.encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            cursor.execute(
                """
                UPDATE users
                SET password=%s,
                    first_login=FALSE
                WHERE user_id=%s;
                """,
                (
                    hashed_password,
                    data.user_id,
                ),
            )

            conn.commit()

            return {
                "success": True,
                "message": "Password changed successfully.",
            }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )