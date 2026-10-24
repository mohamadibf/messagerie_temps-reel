from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    profile_photo: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_photo: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    profile_photo: Optional[str] = None
    last_seen: Optional[str] = None


class MessageCreate(BaseModel):
    content: str
    receiver_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    content: str
    sender_id: int
    receiver_id: Optional[int] = None
    timestamp: str
    username: Optional[str] = None
    profile_photo: Optional[str] = None
    is_read: bool = False
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_size: Optional[int] = None
