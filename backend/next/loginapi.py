from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
# 1. Removed SQLAlchemy imports and imported your working get_raw_db
from database import get_raw_db 

router = APIRouter()

class Login(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(data: Login):
    # 2. Replaced SessionLocal() with your raw database connection manager
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()
            
            query = """
                SELECT user_id, username, role
                FROM users
                WHERE username = %s AND password = %s;
            """
            
            cursor.execute(query, (data.username, data.password))
            user = cursor.fetchone()
            
            if not user:
                return {"success": False, "message": "Invalid login"}

            # Accessing fields smoothly by index position
            user_id = user[0]
            username = user[1]
            role = user[2]

            return {
                "success": True,
                "role": role,
                "user": {"id": user_id, "name": username},
            }
            
    except Exception as e:
        return {"success": False, "message": f"Database error pipeline halt: {str(e)}"}