import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

MONGO_URI = os.getenv("DATABASE_URL")

if not MONGO_URI:
    raise ValueError("❌ ERROR: `DATABASE_URL` is missing from .env!")

print("✅ DEBUG: Connecting to MongoDB at:", MONGO_URI)

# ✅ Create global variables
client = AsyncIOMotorClient(MONGO_URI)
db = client["video_call_db"]

users_collection = db["users"]
meetings_collection = db["meetings"]
chat_collection = db["chat_messages"]

# ✅ Function to Initialize MongoDB
def init_db():
    global client, db, users_collection, meetings_collection
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client["video_call_db"]
        users_collection = db["users"]
        meetings_collection = db["meetings"]
        print("✅ DEBUG: MongoDB initialized successfully!")
    except Exception as e:
        print("❌ ERROR: MongoDB Initialization Failed:", e)

# ✅ Call the function to initialize MongoDB
init_db()

def get_meetings_collection():
    global meetings_collection
    if meetings_collection is None:
        print("⚠️ WARNING: `meetings_collection` is None. Reinitializing Database...")
        init_db()
    return meetings_collection
