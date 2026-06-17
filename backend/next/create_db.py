"""Create the schooldb database if it doesn't exist."""
import psycopg

try:
    conn = psycopg.connect(
        "host=localhost user=postgres password=kunal@123 dbname=postgres"
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        # Check if database exists
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = 'schooldb'"
        )
        if not cur.fetchone():
            cur.execute("CREATE DATABASE schooldb")
            print("✓ Created database 'schooldb'")
        else:
            print("✓ Database 'schooldb' already exists")
except Exception as e:
    print(f"✗ Error: {e}")
finally:
    conn.close()
