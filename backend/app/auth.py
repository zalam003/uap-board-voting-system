import os
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from .database import SessionLocal
from .models import OTP

router = APIRouter()

class EmailRequest(BaseModel):
    email: EmailStr

@router.post("/send-otp")
def send_otp(payload: EmailRequest):
    db = SessionLocal()

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))

    # Optional: Invalidate old OTPs
    db.query(OTP).filter(OTP.email == payload.email).delete()

    # Save to DB
    new_otp = OTP(
        email=payload.email,
        code=otp_code,
        created_at=datetime.utcnow()
    )
    db.add(new_otp)
    db.commit()

    # Compose email
    from_email = os.getenv("FROM_EMAIL")
    if not from_email:
        raise HTTPException(status_code=500, detail="FROM_EMAIL not set in environment")

    message = Mail(
        from_email=from_email,
        to_emails=payload.email,
        subject="Your UAP Voting OTP",
        html_content=f"""
        <p>Dear voter,</p>
        <p>Your One-Time Password (OTP) for the UAP Board Voting system is:</p>
        <h2>{otp_code}</h2>
        <p>This OTP is valid for 5 minutes.</p>
        """
    )

    try:
        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
        sg.send(message)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    return {"message": f"OTP sent to {payload.email}"}
