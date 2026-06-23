from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from database import SessionLocal

# Changed from app = FastAPI() to an APIRouter so main.py can import it
router = APIRouter()

class Login(BaseModel):
    username: str
    password: str

# Changed from @app.post to @router.post
@router.post("/login")
def login(data: Login):
    db = SessionLocal()
    try:
        query = text(
            """
            SELECT user_id, username, role
            FROM users
            WHERE username = :username AND password = :password
            """
        )

        user = db.execute(
            query,
            {
                "username": data.username,
                "password": data.password,
            },
        ).fetchone()
        
        if not user:
            return {"success": False, "message": "Invalid login"}

        # Supports both tuple matching and dict-like attribute access safely
        user_id = user[0] if isinstance(user, tuple) else getattr(user, "user_id", None)
        username = user[1] if isinstance(user, tuple) else getattr(user, "username", None)
        role = user[2] if isinstance(user, tuple) else getattr(user, "role", None)

        return {
            "success": True,
            "role": role,
            "user": {"id": user_id, "name": username},
        }
        
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}"}
        
    finally:
        db.close()