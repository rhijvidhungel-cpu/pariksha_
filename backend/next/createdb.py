"""Create the schooldb database and structure its layout tables for smart desk tracking."""

# Prefer psycopg (psycopg3), fall back to psycopg2 if unavailable.
try:
    import psycopg as psycopg_module # type: ignore
except Exception:
    try:
        import psycopg2 as psycopg_module
    except Exception:
        psycopg_module = None

try:
    if psycopg_module is None:
        raise RuntimeError("No suitable psycopg module found. Install 'psycopg' or 'psycopg2'.")

    # Step 1: Connect to default postgres DB to ensure 'schooldb' exists
    conn = psycopg_module.connect(
        "host=localhost user=postgres password=kunal@123 dbname=postgres"
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'schooldb'")
        if not cur.fetchone():
            cur.execute("CREATE DATABASE schooldb")
            print("✓ Created database 'schooldb'")
        else:
            print("✓ Database 'schooldb' already exists")
    conn.close()

    # Step 2: Connect directly to 'schooldb' to build the smart layout schema
    print("Connecting to 'schooldb' to set up furniture maps...")
    conn_school = psycopg_module.connect(
        "host=localhost user=postgres password=kunal@123 dbname=schooldb"
    )
    conn_school.autocommit = True
    
    with conn_school.cursor() as cur:
        # 🏫 1. Rooms Register Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                rows_count INTEGER NOT NULL DEFAULT 5,
                benches_per_row INTEGER NOT NULL DEFAULT 3,
                seats_per_bench INTEGER NOT NULL DEFAULT 2, -- Each desk handles 2 students
                capacity INTEGER NOT NULL,
                allocated_students_count INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Available'
            );
        """)
        print("✓ Table 'rooms' verified.")

        # 💺 2. Smart Seat Allocations Table (Benches / Desks tracking)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS seat_allocations (
                id SERIAL PRIMARY KEY,
                room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                row_number INTEGER NOT NULL,
                bench_number INTEGER NOT NULL,
                seat_position VARCHAR(10) NOT NULL, -- 'Left' (S1) or 'Right' (S2)
                seat_number VARCHAR(50) NOT NULL     -- Complete label e.g. "R1-B3-Left"
            );
        """)
        print("✓ Table 'seat_allocations' verified.")

        # 🎒 3. Seed 4 Default Rooms with 2-seater desk capacities
        # Room A & B: Large spaces (5 rows x 4 benches wide = 20 desks = 40 students)
        # Room C & D: Standard spaces (5 rows x 3 benches wide = 15 desks = 30 students)
        default_rooms = [
            ("Hall A - Main Block", 5, 4, 2, 40),
            ("Hall B - Science Block", 5, 4, 2, 40),
            ("Room 101 - IT Center", 5, 3, 2, 30),
            ("Room 102 - Management Wing", 5, 3, 2, 30)
        ]

        for name, rows, benches, seats, cap in default_rooms:
            cur.execute("SELECT 1 FROM rooms WHERE name = %s", (name,))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO rooms (name, rows_count, benches_per_row, seats_per_bench, capacity)
                    VALUES (%s, %s, %s, %s, %s)
                """, (name, rows, benches, seats, cap))
                print(f"➕ Seeded default classroom: {name} ({cap} seats)")

    conn_school.close()
    print("🚀 All smart allocation schemas and 4 rooms built successfully!")

except Exception as e:
    print(f"✗ Error: {e}")