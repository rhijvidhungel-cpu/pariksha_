"""
Seed script to initialize the database with tables and test data.

Usage:
python seed.py
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL, SessionLocal
import bcrypt


def seed_database():
    """Create users table and seed default accounts."""

    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:

        create_table_sql = text("""
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            first_login BOOLEAN DEFAULT TRUE
        );
        """)

        conn.execute(create_table_sql)
        conn.commit()

        print("✓ Users table ready.")

    db = SessionLocal()

    try:

        check_query = text("""
        SELECT COUNT(*)
        FROM users
        WHERE username IN ('student','teacher','admin');
        """)

        result = db.execute(check_query).fetchone()

        if result and result[0] > 0:
            print("✓ Default users already exist.")
            return

        student_password = bcrypt.hashpw(
            "student123".encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        teacher_password = bcrypt.hashpw(
            "teacher123".encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        admin_password = bcrypt.hashpw(
            "admin123".encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        insert_query = text("""
        INSERT INTO users
        (
            username,
            password,
            role,
            first_login
        )
        VALUES
            (:student_username,:student_password,'student',FALSE),
            (:teacher_username,:teacher_password,'teacher',FALSE),
            (:admin_username,:admin_password,'admin',FALSE)
        ON CONFLICT (username) DO NOTHING;
        """)

        db.execute(
            insert_query,
            {
                "student_username": "student",
                "student_password": student_password,

                "teacher_username": "teacher",
                "teacher_password": teacher_password,

                "admin_username": "admin",
                "admin_password": admin_password,
            },
        )

        db.commit()

        print("✓ Seeded default accounts")
        print("Student : student / student123")
        print("Teacher : teacher / teacher123")
        print("Admin   : admin / admin123")

    except Exception as e:

        db.rollback()
        print(f"✗ Error: {e}")
        raise

    finally:
        db.close()

    print("\n✓ Database seeding completed.")


if __name__ == "__main__":
    seed_database()