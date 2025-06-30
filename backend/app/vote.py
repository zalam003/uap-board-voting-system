from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta

from .database import SessionLocal
from .models import OTP, Vote

router = APIRouter()

# Request payload for voting
class VoteIn(BaseModel):
    email: EmailStr
    code: str  # the 6-digit OTP
    candidate: str

@router.post("/vote")
def cast_vote(payload: VoteIn):
    db = SessionLocal()

    # Check if vote already exists for this email
    existing_vote = db.query(Vote).filter_by(email=payload.email).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted.")

    # Validate OTP and check expiry
    time_threshold = datetime.utcnow() - timedelta(minutes=5)
    otp = (
        db.query(OTP)
        .filter_by(email=payload.email, code=payload.code)
        .filter(OTP.created_at >= time_threshold)
        .first()
    )

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    # Record vote
    vote = Vote(
        email=payload.email,
        candidate=payload.candidate,
        timestamp=datetime.utcnow()
    )
    db.add(vote)
    db.commit()

    # Optional: delete OTP to prevent reuse
    db.delete(otp)
    db.commit()

    return {"message": f"Vote for '{payload.candidate}' recorded successfully."}
