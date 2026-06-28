from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Student, ExamHall

router = APIRouter(prefix="/rooms", tags=["Allocation"])

@router.post("/auto-allocate")
def auto_allocate(db: Session = Depends(get_db)):
    try:
        # 1. Reset all existing allocations
        db.query(Student).update({"room_id": None, "seat_number": None})
        
        # 2. Fetch all students and halls
        students = db.query(Student).all()
        halls = db.query(ExamHall).order_by(ExamHall.hall_id).all()
        
        if not students:
            return {"status": "success", "message": "No students found to allocate."}
        if not halls:
            raise HTTPException(status_code=400, detail="No exam halls configured.")

        # 3. Allocation Algorithm
        student_idx = 0
        for hall in halls:
            # Check if hall has necessary capacity fields
            # Ensure hall.rows_count etc. exist in your database table
            for r in range(1, (getattr(hall, 'rows_count', 0) or 0) + 1):
                for b in range(1, (getattr(hall, 'benches_per_row', 0) or 0) + 1):
                    for s in range(1, (getattr(hall, 'seats_per_bench', 0) or 0) + 1):
                        if student_idx < len(students):
                            student = students[student_idx]
                            student.room_id = hall.hall_id
                            student.seat_number = f"R{r}-B{b}-S{s}"
                            student_idx += 1
            
            if student_idx >= len(students):
                break
        
        db.commit()
        return {
            "status": "success", 
            "allocated": student_idx, 
            "total_students": len(students)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))