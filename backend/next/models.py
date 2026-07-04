from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base  # Assuming your database.py defines a 'Base'

class ExamHall(Base):
    __tablename__ = "exam_halls"
    hall_id = Column(Integer, primary_key=True)
    room_no = Column(String, unique=True)
    rows_count = Column(Integer)
    benches_per_row = Column(Integer)
    seats_per_bench = Column(Integer)
    capacity = Column(Integer, nullable=False)

class Student(Base):
    __tablename__ = "students"
    student_id = Column(Integer, primary_key=True)
    full_name = Column(String)
    room_id = Column(Integer, ForeignKey("exam_halls.hall_id"))
    seat_number = Column(String)