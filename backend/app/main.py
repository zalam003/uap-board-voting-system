from fastapi import FastAPI
from . import database, auth, vote, admin
from .database import Base, engine

# Automatically create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI()

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "UAP Voting System"}

# Register routers
app.include_router(auth.router)
app.include_router(vote.router)
app.include_router(admin.router)
