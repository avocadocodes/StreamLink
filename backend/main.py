import os
import multiprocessing
from dotenv import load_dotenv
from fastapi import FastAPI,APIRouter, HTTPException, Depends, Response
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

load_dotenv()
MONGO_URI = os.getenv("DATABASE_URL")
client = MongoClient(MONGO_URI)
FRONTEND_URL = os.getenv("FRONTEND_URL")

app = FastAPI()
router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # ✅ Local frontend
        "http://127.0.0.1:3000",  # ✅ Alternative localhost notation
    ],
    allow_credentials=True,  
    allow_methods=["*"],  
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],  # ✅ Explicitly allow "Authorization"
)


logging.basicConfig(level=logging.DEBUG)

class StartMeetingRequest(BaseModel):
    meeting_id: str
    username: str

app.include_router(auth_router)  
app.include_router(signaling_router)
app.include_router(router)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    allowed_origin = request.headers.get("Origin", "http://localhost:3000")

    response.headers["Access-Control-Allow-Origin"] = allowed_origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-CSRF-Token"
    
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logging.error(f"Internal Server Error: {exc}")  
    return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

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
