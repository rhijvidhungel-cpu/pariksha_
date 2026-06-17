"""
Seed script to initialize the database with tables and test data.
Run this once to set up the database for development.

Usage: python seed.py
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL, SessionLocal

def seed_database():
    """Create tables and seed test user accounts."""
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Create users table if it doesn't exist
        create_table_sql = text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            );
        """)
        conn.execute(create_table_sql)
        conn.commit()
        print("✓ Created 'users' table (if not exists)")
    
    # Seed test accounts
    db = SessionLocal()
    try:
        # Check if test users already exist
        check_query = text("SELECT COUNT(*) as cnt FROM users WHERE username IN ('student', 'teacher', 'admin')")
        result = db.execute(check_query).fetchone()
        
        if result and result[0] > 0:
            print("✓ Test users already exist. Skipping seed.")
            return
        
        # Insert test users
        insert_query = text("""
            INSERT INTO users (username, password, role) VALUES
                ('student', 'student123', 'student'),
                ('teacher', 'teacher123', 'teacher'),
                ('admin', 'admin123', 'admin')
            ON CONFLICT (username) DO NOTHING;
        """)
        db.execute(insert_query)
        db.commit()
        print("✓ Seeded test users:")
        print("  - student / student123 (role: student)")
        print("  - teacher / teacher123 (role: teacher)")
        print("  - admin / admin123 (role: admin)")
    
    except Exception as e:
        print(f"✗ Error seeding database: {e}")
        db.rollback()
        raise
    
    finally:
        db.close()
    
    print("\n✓ Database seeding complete!")

if __name__ == "__main__":
    seed_database()
