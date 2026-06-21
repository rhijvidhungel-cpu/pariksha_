import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

# Replace with your actual pgAdmin / PostgreSQL credentials
DB_PARAMS = {
    "host": "localhost",
    "database": "pariksha",
    "user": "postgres",
    "password": "rhijvi123", 
    "port": "5432"
}

@contextmanager
def get_raw_db():
    """Context manager to ensure connections are safely closed after queries finish."""
    conn = psycopg2.connect(**DB_PARAMS, cursor_factory=RealDictCursor)
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()