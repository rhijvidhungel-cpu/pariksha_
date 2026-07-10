from typing import Optional
from pydantic import BaseModel


class ExamHallCreate(BaseModel):
    room_no: str
    rows_count: int
    benches_per_row: int
    seats_per_bench: int
    capacity: Optional[int] = None


class BatchResponse(BaseModel):
    batch_id: int
    batch_name: str

    class Config:
        from_attributes = True