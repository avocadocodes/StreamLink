from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://nikitakar82925:zqPF9aI475rAQ8DX@cluster0.pogmm.mongodb.net/"
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_database("video_call_db")
users_collection = db.get_collection("users")
