import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database URL for SQLAlchemy
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:rhijvi123@localhost:5432/pariksha")

# 1. Setup SQLAlchemy (for ORM models)
# Change your engine initialization to this:
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True,
    pool_recycle=60,         # Recycle every 60 seconds
    pool_size=5,             # Keep a small pool
    max_overflow=10
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for FastAPI to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2. Setup Raw SQL (for direct connections)
# Fallback local credentials if DATABASE_URL is not set
LOCAL_DB_PARAMS = {
    "host": "localhost",
    "database": "pariksha",
    "user": "postgres",
    "password": "rhijvi123",
    "port": "5432"
}

@contextmanager
def get_raw_db():
    """Context manager for raw psycopg2 connections."""
    db_url = os.environ.get("DATABASE_URL")
    
    conn = None
    try:
        if db_url:
            if "sslmode=" not in db_url:
                db_url += "&sslmode=require" if "?" in db_url else "?sslmode=require"
            conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        else:
            conn = psycopg2.connect(**LOCAL_DB_PARAMS, cursor_factory=RealDictCursor)
            
        yield conn
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()