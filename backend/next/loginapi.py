from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_raw_db 

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
            
            # Query to check credentials
            query = """
                SELECT user_id, username, role, first_login
                FROM users
                WHERE username = %s AND password = %s;
            """
            
            cursor.execute(query, (data.username, data.password))
            user = cursor.fetchone()
            
            if not user:
                return {"success": False, "message": "Invalid login"}

            # FIX: Reading fields dynamically as a dictionary (RealDictCursor compatible)
            user_id = user.get("user_id") if isinstance(user, dict) else user[0]
            username = user.get("username") if isinstance(user, dict) else user[1]
            role = user.get("role") if isinstance(user, dict) else user[2]
            first_login = user.get("first_login") if isinstance(user, dict) else user[3]

            return {
                "success": True,
                "user_id": user_id,
                "username": username,
                "role": role,
                "first_login": first_login,
            }
            
    except Exception as e:
        return {"success": False, "message": f"Database error pipeline halt: {str(e)}"}
    
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
                raise HTTPException(status_code=404, detail="User not found")

            old_password = (
                user["password"] if isinstance(user, dict) else user[0]
            )

            if old_password != data.current_password:
                raise HTTPException(
                    status_code=400,
                    detail="Current password is incorrect."
                )

            cursor.execute(
                """
                UPDATE users
                SET password=%s,
                    first_login=FALSE
                WHERE user_id=%s;
                """,
                (
                    data.new_password,
                    data.user_id,
                ),
            )

            conn.commit()

            return {
                "success": True,
                "message": "Password changed successfully."
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    