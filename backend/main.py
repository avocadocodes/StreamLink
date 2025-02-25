import os
import multiprocessing
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response
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

# Load environment variables
load_dotenv()

app = FastAPI()
router = APIRouter()
MONGO_URI = os.getenv("DATABASE_URL")
client = MongoClient(MONGO_URI)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://streamlink-sigma.vercel.app")

# ✅ Ensure `FRONTEND_URL` is correctly formatted (remove trailing slashes)
FRONTEND_URL = FRONTEND_URL.rstrip("/")

# ✅ CORS Middleware - Ensure it is before the routers!
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "*"
        # FRONTEND_URL,
        # "https://streamlink-sigma.vercel.app",
        # "http://localhost:3000",
        # "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # ✅ Allow all headers, including "Origin"
)

logging.basicConfig(level=logging.DEBUG)

class StartMeetingRequest(BaseModel):
    meeting_id: str
    username: str

# ✅ Ensure CORS headers are applied correctly
# @app.middleware("http")
# async def add_cors_headers(request, call_next):
#     response = await call_next(request)
#     origin = request.headers.get("Origin")

#     allowed_origins = [
#         FRONTEND_URL,
#         "https://streamlink-sigma.vercel.app",
#         "http://localhost:3000",
#         "http://127.0.0.1:3000",
#     ]

#     if origin in allowed_origins:
#         response.headers["Access-Control-Allow-Origin"] = origin
#     else:
#         response.headers["Access-Control-Allow-Origin"] = FRONTEND_URL  # Use ENV URL for safety

#     response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
#     response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Origin, X-CSRF-Token"

#     return response

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

print("✅ Registering routers...")
app.include_router(auth_router)  
app.include_router(signaling_router)
app.include_router(router)
