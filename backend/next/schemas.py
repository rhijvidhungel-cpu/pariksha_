from pydantic import BaseModel

class ExamHallCreate(BaseModel):
    room_no: str
    rows_count: int
    benches_per_row: int
    seats_per_bench: int
    capacity: int  