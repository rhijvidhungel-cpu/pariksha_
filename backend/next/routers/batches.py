from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Batch

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.get("/")
def get_batches(db: Session = Depends(get_db)):
    return db.query(Batch).order_by(Batch.batch_name).all()