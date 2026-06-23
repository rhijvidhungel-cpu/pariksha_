from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_raw_db 

router = APIRouter()

class Login(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(data: Login):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            
            # Query to check credentials
            query = """
                SELECT user_id, username, role
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

            return {
                "success": True,
                "role": role,
                "user": {"id": user_id, "name": username},
            }
            
    except Exception as e:
        return {"success": False, "message": f"Database error pipeline halt: {str(e)}"}