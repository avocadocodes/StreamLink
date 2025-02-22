from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from signaling import signaling_router

app = FastAPI()

# ✅ CORS middleware should be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific domains for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signaling_router)  # ✅ Remove prefix so WebSocket URLs are correct

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}
