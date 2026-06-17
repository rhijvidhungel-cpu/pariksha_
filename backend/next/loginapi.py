from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from database import SessionLocal

app = FastAPI()

# Allow frontend dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Login(BaseModel):
    username: str
    password: str


@app.post("/login")
def login(data: Login):
    db = SessionLocal()

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

    db.close()

    if not user:
        return {"success": False, "message": "Invalid login"}

    return {
        "success": True,
        "role": user.role,
        "user": {"id": user.user_id, "name": user.username},
    }