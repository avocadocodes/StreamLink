from pydantic import BaseModel, EmailStr
from typing import Optional

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
