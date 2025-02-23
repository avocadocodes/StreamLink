import os
import multiprocessing
from dotenv import load_dotenv
from fastapi import FastAPI,APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_meetings_collection
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from datetime import datetime
from signaling import signaling_router
from pymongo import MongoClient
from auth import get_current_user
from models import MeetingSchema
import logging
from fastapi.responses import JSONResponse

# Load Environment Variables
load_dotenv()
MONGO_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)

# App Initialization
app = FastAPI()
router = APIRouter()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "FRONTEND_URL",
    ], 
    allow_credentials=True,  # ✅ Required for cookies and Authorization headers
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.basicConfig(level=logging.DEBUG)

# Meeting Request Model
class StartMeetingRequest(BaseModel):
    meeting_id: str
    username: str

app.include_router(auth_router)  
app.include_router(signaling_router)
app.include_router(router)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logging.error(f"🔥 Internal Server Error: {exc}")  # ✅ Print error in logs
    return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

# ✅ Start a Meeting
@router.post("/start-meeting")
async def start_meeting(meeting: MeetingSchema, current_user: dict = Depends(get_current_user)):
    meetings_collection = get_meetings_collection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    existing_meeting = await meetings_collection.find_one({"meeting_id": meeting.meeting_id})
    if existing_meeting:
        return {"message": "Meeting already exists", "meeting_id": meeting.meeting_id}
    
    new_meeting = {
        "meeting_id": meeting.meeting_id,
        "host": current_user["username"],
        "participants": [current_user["username"]],
    }
    await meetings_collection.insert_one(new_meeting)

    return {"message": "Meeting created", "meeting_id": meeting.meeting_id}

@router.post("/join-meeting")
async def join_meeting(meeting: MeetingSchema, current_user: dict = Depends(get_current_user)):
    meetings_collection = get_meetings_collection()

    if not current_user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    existing_meeting = await meetings_collection.find_one({"meeting_id": meeting.meeting_id})
    if not existing_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if current_user["username"] not in existing_meeting["participants"]:
        await meetings_collection.update_one(
            {"meeting_id": meeting.meeting_id},
            {"$push": {"participants": current_user["username"]}}
        )

    return {"message": "Joined meeting successfully", "meeting_id": meeting.meeting_id}
@app.get("/")
def read_root():
    return {"message": "Backend is running!"}


if __name__ == "__main__":
    multiprocessing.set_start_method("spawn")
