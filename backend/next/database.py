import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

# 1. Fallback local credentials (what you already had)
LOCAL_DB_PARAMS = {
    "host": "localhost",
    "database": "pariksha",
    "user": "postgres",
    "password": "rhijvi123", 
    "port": "5432"
}

@contextmanager
def get_raw_db():
    """Context manager that checks for a cloud database URL first, then falls back to local."""
    # 2. Check if Render has provided a DATABASE_URL environment variable
    db_url = os.environ.get("DATABASE_URL")
    
    try:
        if db_url:
            # Connect using the cloud URL string on Render
            conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        else:
            # Connect using your local credentials on your machine
            conn = psycopg2.connect(**LOCAL_DB_PARAMS, cursor_factory=RealDictCursor)
            
        yield conn
    except Exception:
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'conn' in locals():
            conn.close()