from fastapi import APIRouter, HTTPException, Request, Depends, Header
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.hash import bcrypt
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging
import os
logger = logging.getLogger(__name__)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

auth_router = APIRouter()

def generate_token(user_id: ObjectId) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"user_id": str(user_id), "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

# Dependency to get DB
def get_db(request: Request):
    db = getattr(request.app, "mongodb", None)
    if db is None:
        raise RuntimeError("MongoDB not initialized in app")
    return db


# Dependency to decode token
async def token_required(authorization: Optional[str] = Header(None), db=Depends(get_db)) -> Dict[str, Any]:
    if not authorization:
        raise HTTPException(status_code=401, detail="Token missing")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = ObjectId(payload["user_id"])
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token validation error")

# Register route
@auth_router.post("/register")
async def register(request: Request, db=Depends(get_db)):
    try:
        data = await request.json()
        logger.debug(f"Register data: {data}")

        required_fields = ["name", "email", "password"]
        missing = [f for f in required_fields if f not in data]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing fields: {missing}")
        
        email = data["email"]
        if "@" not in email or "." not in email:
            raise HTTPException(status_code=400, detail="Invalid email format")

        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=409, detail="User with this email already exists")

        hashed_password = bcrypt.hash(data["password"])
        username = email.split('@')[0]

        user_data = {
            "name": data["name"],
            "email": email,
            "username": username,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }

        result = await db.users.insert_one(user_data)
        token = generate_token(result.inserted_id)

        return JSONResponse(status_code=201, content={
            "success": True,
            "data": {
                "token": token,
                "user": {
                    "id": str(result.inserted_id),
                    "name": data["name"],
                    "email": email,
                    "username": username
                }
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Server error during registration")

# Login route
@auth_router.post("/login")
async def login(request: Request, db=Depends(get_db)):
    try:
        data = await request.json()
        if "email" not in data or "password" not in data:
            raise HTTPException(status_code=400, detail="Missing email or password")

        user = await db.users.find_one({"email": data["email"]})
        if not user or not bcrypt.verify(data["password"], user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = generate_token(user["_id"])

        return {
            "success": True,
            "data": {
                "token": token,
                "user": {
                    "id": str(user["_id"]),
                    "name": user["name"],
                    "email": user["email"]
                }
            }
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Server error during login")
