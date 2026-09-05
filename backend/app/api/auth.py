# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from app.config import settings
from app.db.postgres import db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"])
SECRET_KEY = settings.SECRET_KEY or "mangaverse_super_secret_key_2026"

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    tier: str
    token: str

@router.post("/register", response_model=UserResponse)
async def register(req: RegisterRequest):
    try:
        hashed = pwd_context.hash(req.password)
        user_id = f"user_{datetime.utcnow().timestamp()}"
        await db.execute(
            "INSERT INTO users (id, email, username, password_hash, tier, created_at) VALUES ($1, $2, $3, $4, 'free', NOW()) ON CONFLICT (email) DO NOTHING",
            user_id, req.email, req.username, hashed
        )
        token = jwt.encode({"sub": user_id, "exp": datetime.utcnow() + timedelta(days=30)}, SECRET_KEY, algorithm="HS256")
        return {"id": user_id, "email": req.email, "username": req.username, "tier": "free", "token": token}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest):
    user = await db.fetchrow("SELECT * FROM users WHERE email = $1", req.email)
    if not user or not pwd_context.verify(req.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"sub": user['id'], "exp": datetime.utcnow() + timedelta(days=30)}, SECRET_KEY, algorithm="HS256")
    return {"id": user['id'], "email": user['email'], "username": user['username'], "tier": user['tier'], "token": token}

@router.get("/me")
async def get_me(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = await db.fetchrow("SELECT id, email, username, tier FROM users WHERE id = $1", payload['sub'])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")