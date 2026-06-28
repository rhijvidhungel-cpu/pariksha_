from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, ExamHall # Adjust based on your actual models file

router = APIRouter(prefix="/rooms", tags=["Allocation"])

@router.post("/auto-allocate")
def auto_allocate(db: Session = Depends(get_db)):
    # 1. Reset all existing allocations
    db.query(Student).update({"room_id": None, "seat_number": None})
    
    # 2. Fetch all students and halls
    students = db.query(Student).all()
    halls = db.query(ExamHall).all()
    
    # 3. Allocation Algorithm
    student_idx = 0
    for hall in halls:
        # Calculate how many seats this hall has
        total_hall_seats = hall.rows_count * hall.benches_per_row * hall.seats_per_bench
        
        for r in range(1, hall.rows_count + 1):
            for b in range(1, hall.benches_per_row + 1):
                for s in range(1, hall.seats_per_bench + 1):
                    if student_idx < len(students):
                        student = students[student_idx]
                        student.room_id = hall.hall_id
                        student.seat_number = f"R{r}-B{b}-S{s}"
                        student_idx += 1
        
        if student_idx >= len(students):
            break
            
    db.commit()
    return {"status": "success", "allocated": student_idx}