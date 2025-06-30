import os
import io
import csv
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from .database import SessionLocal
from .models import Vote

router = APIRouter()

# ✅ Helper function to verify admin secret
def verify_admin(request: Request):
    secret = request.headers.get("x-admin-secret")
    expected = os.getenv("ADMIN_SECRET")
    if not secret or secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized access")

# 📥 Download all vote records as CSV
@router.get("/admin/results", response_class=StreamingResponse)
def download_results(request: Request):
    verify_admin(request)
    db = SessionLocal()
    votes = db.query(Vote).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Email", "Candidate", "Timestamp"])
    for vote in votes:
        writer.writerow([vote.email, vote.candidate, vote.timestamp])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vote_results.csv"}
    )

# 📊 Return vote tally per candidate
@router.get("/admin/tally")
def get_vote_tally(request: Request):
    verify_admin(request)
    db = SessionLocal()
    results = (
        db.query(Vote.candidate, func.count(Vote.id))
        .group_by(Vote.candidate)
        .all()
    )
    return [{"candidate": name, "votes": count} for name, count in results]
