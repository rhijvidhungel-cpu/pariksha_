from pydantic import BaseModel

class ExamHallCreate(BaseModel):
    # This must match the field names your frontend sends
    # Looking at your screenshot, your field is "Classroom Name"
    # Ensure this matches what your React/frontend code is sending
    room_no: str 
    rows_count: int
    benches_per_row: int
    seats_per_bench: int