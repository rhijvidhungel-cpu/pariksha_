from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
# Ensure these imports match your absolute path structure
from database import get_db
from models import Student, ExamHall

router = APIRouter(prefix="/rooms", tags=["Allocation"])

@router.post("/auto-allocate")
def auto_allocate(db: Session = Depends(get_db)):
    try:
        # 1. Reset all existing allocations using bulk update for efficiency
        db.query(Student).update({"room_id": None, "seat_number": None}, synchronize_session=False)
        db.commit() # Commit reset first
        
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
            # Use safe defaults for room dimensions
            rows = hall.rows_count or 0
            benches = hall.benches_per_row or 0
            seats = hall.seats_per_bench or 0
            
            for r in range(1, rows + 1):
                for b in range(1, benches + 1):
                    for s in range(1, seats + 1):
                        if student_idx < len(students):
                            student = students[student_idx]
                            student.room_id = hall.hall_id
                            student.seat_number = f"R{r}-B{b}-S{s}"
                            student_idx += 1
            
            if student_idx >= len(students):
                break
        
        # 4. Commit all student object changes
        db.commit()
        return {
            "status": "success", 
            "allocated": student_idx, 
            "total_students": len(students)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Allocation failed: {str(e)}")