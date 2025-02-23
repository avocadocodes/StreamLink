from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserSchema(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str

class MeetingSchema(BaseModel):
    meeting_id: str
    username: str

class ChatMessage(BaseModel):
    meeting_id: str
    sender: str
    message: str
    timestamp: datetime = datetime.utcnow()