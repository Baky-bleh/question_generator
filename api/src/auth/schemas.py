from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class OAuthRequest(BaseModel):
    id_token: str


class UserProfileResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    avatar_url: str | None = None
    timezone: str
    daily_goal: int
    created_at: datetime


class UserUpdateRequest(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=100)
    avatar_url: str | None = None
    timezone: str | None = Field(None, max_length=50)
    daily_goal: int | None = Field(None, ge=1, le=120)


class TokenResponse(BaseModel):
    user_id: UUID
    email: str
    display_name: str
    access_token: str
    refresh_token: str
    expires_in: int


class RefreshResponse(BaseModel):
    access_token: str
    expires_in: int
