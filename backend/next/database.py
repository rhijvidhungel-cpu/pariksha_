import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

# Fallback local credentials (what you use on your computer)
LOCAL_DB_PARAMS = {
    "host": "localhost",
    "database": "pariksha",
    "user": "postgres",
    "password": "rhijvi123", 
    "port": "5432"
}
Base = declarative_base()
@contextmanager
def get_raw_db():
    """Context manager that connects via DATABASE_URL with SSL enforcement for cloud, or falls back to local."""
    db_url = os.environ.get("DATABASE_URL")
    
    try:
        if db_url:
            # FIX: If it's a Neon connection string, ensure sslmode is explicitly passed to psycopg2
            if "sslmode=" not in db_url:
                # Add parameter safely depending on existing query strings
                db_url += "&sslmode=require" if "?" in db_url else "?sslmode=require"
            
            conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        else:
            conn = psycopg2.connect(**LOCAL_DB_PARAMS, cursor_factory=RealDictCursor)
            
        yield conn
    except Exception:
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'conn' in locals():
            conn.close()