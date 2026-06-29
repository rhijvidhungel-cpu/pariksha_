import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Student, ExamHall
from schemas import ExamHallCreate
router = APIRouter(tags=["Allocation"])

@router.post("/")  
def create_room(room_data: ExamHallCreate, db: Session = Depends(get_db)):
    try:
        new_hall = ExamHall(
            room_no=room_data.room_no,
            rows_count=room_data.rows_count,
            benches_per_row=room_data.benches_per_row,
            seats_per_bench=room_data.seats_per_bench
        )
        db.add(new_hall)
        db.commit()
        db.refresh(new_hall)
        return {"status": "success", "message": "Room created", "hall_id": new_hall.hall_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-allocate")
def auto_allocate(db: Session = Depends(get_db)):
    try:
        db.query(Student).update({"room_id": None, "seat_number": None}, synchronize_session=False)
        db.commit()
        
        students = db.query(Student).all()
        halls = db.query(ExamHall).order_by(ExamHall.hall_id).all()
        
        if not students:
            return {"status": "success", "message": "No students found."}
        if not halls:
            raise HTTPException(status_code=400, detail="No exam halls configured.")

        student_idx = 0
        for hall in halls:
            rows = int(hall.rows_count or 0)
            benches = int(hall.benches_per_row or 0)
            seats = int(hall.seats_per_bench or 0)
            
            for r in range(1, rows + 1):
                for b in range(1, benches + 1):
                    for s in range(1, seats + 1):
                        if student_idx < len(students):
                            students[student_idx].room_id = hall.hall_id
                            students[student_idx].seat_number = f"R{r}-B{b}-S{s}"
                            student_idx += 1
            if student_idx >= len(students):
                break
        
        db.commit()
        return {"status": "success", "allocated": student_idx}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))