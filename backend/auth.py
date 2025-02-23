from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from database import users_collection
import os
from bson import ObjectId

# ✅ Load Environment Variables
SECRET_KEY = os.getenv("SECRET_KEY")  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ✅ Initialize Router & Security
router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ✅ User Registration Model
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str

# ✅ Hash Password
def hash_password(password: str):
    return pwd_context.hash(password)

# ✅ Verify Password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# ✅ Generate JWT Token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ✅ Register Route
@router.post("/register")
async def register(user: UserRegister):
    existing_user = await users_collection.find_one({"username": user.username})
    existing_email = await users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = hash_password(user.password)
    user_data = {
        "email": user.email,
        "username": user.username,
        "password": hashed_password,
        "created_at": datetime.utcnow(),
    }

    print("🔍 DEBUG: Inserting user into MongoDB →", user_data)

    insert_result = await users_collection.insert_one(user_data)
    
    if insert_result.inserted_id:
        print("✅ SUCCESS: User inserted with ID:", insert_result.inserted_id)
        return {"message": "User registered successfully"}
    else:
        print("❌ ERROR: User insertion failed!")
        raise HTTPException(status_code=500, detail="User registration failed")

# ✅ Login Route
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    identifier = form_data.username  # ✅ Can be username or email

    user = await users_collection.find_one(
        {"$or": [{"username": identifier}, {"email": identifier}]}
    )

    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # ✅ Store user ID in JWT for better retrieval
    access_token = create_access_token({
        "sub": user["username"],
        "email": user["email"],
        "user_id": str(user["_id"])  # Store user ID
    })
    
    return {"access_token": access_token, "token_type": "bearer"}

# ✅ Fetch Current Logged-in User
@router.get("/user")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # username = payload.get("sub")
        # email = payload.get("email")
        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await users_collection.find_one({"_id": ObjectId(user_id)})  # ✅ Fix here
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "username": user["username"],
            "created_at": user.get("created_at"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")