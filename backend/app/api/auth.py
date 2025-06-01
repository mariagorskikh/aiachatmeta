from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..database.connection import get_db
from ..database.models import User
from ..services.auth_service import AuthService
from ..config import settings
from typing import Optional
import httpx
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse

router = APIRouter(prefix="/api/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
auth_service = AuthService()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

class UserCreate(BaseModel):
    username: str
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str]

class Token(BaseModel):
    access_token: str
    token_type: str

# Helper functions
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

# Simplified authentication for hackathon - auto creates/gets user
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        return await auth_service.get_current_user(token, db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    try:
        new_user = await auth_service.create_user(
            db, 
            username=user.username,
            email=None,
            password=user.password
        )
        
        # Create access token
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Login with username and password"""
    # For simplified version, just create user if doesn't exist
    user = await auth_service.get_user_by_username(db, form_data.username)
    
    if not user:
        # Auto-create user for demo
        user = await auth_service.create_user(
            db,
            username=form_data.username,
            email=None,
            password=form_data.password
        )
    
    # Create token
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email
    )

@router.get("/google/login")
async def google_login():
    """Redirect to Google OAuth login"""
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return {
        "auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope=openid%20email%20profile&access_type=offline"
    }

@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for token
        token_response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        # Get user info from Google
        user_info_response = httpx.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_info_response.json()
        
        # Check if user already exists
        db_user = await auth_service.get_user_by_email(db, user_info["email"])
        
        if not db_user:
            # New user - generate temporary token and redirect to profile setup
            temp_data = {
                "email": user_info["email"],
                "google_id": user_info.get("id"),
                "temp": True
            }
            temp_token = create_access_token(data=temp_data)
            
            # Generate a suggested username
            base_username = user_info.get("name", user_info["email"].split("@")[0])
            suggested_username = base_username.replace(" ", "_").lower()
            
            # Redirect to profile setup page
            frontend_url = "http://localhost:3001"
            return RedirectResponse(
                url=f"{frontend_url}/auth/setup-profile?token={temp_token}&email={user_info['email']}&suggested={suggested_username}",
                status_code=302
            )
        else:
            # Existing user - create access token and redirect to home
            access_token = create_access_token(data={"sub": str(db_user.id)})
            
            # Redirect to frontend callback page
            frontend_url = "http://localhost:3001"
            return RedirectResponse(
                url=f"{frontend_url}/auth/callback?token={access_token}",
                status_code=302
            )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google callback error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class CompleteProfileRequest(BaseModel):
    username: str
    email: str

@router.post("/complete-profile")
async def complete_profile(
    request: CompleteProfileRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Complete profile setup for new Google users"""
    try:
        # Decode the temporary token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verify this is a temp token
        if not payload.get("temp"):
            raise HTTPException(status_code=401, detail="Invalid token")
        
        email = payload.get("email")
        if email != request.email:
            raise HTTPException(status_code=401, detail="Email mismatch")
        
        # Check if username is already taken
        existing_user = await auth_service.get_user_by_username(db, request.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Create new user
        new_user = await auth_service.create_user(
            db,
            username=request.username,
            email=email,
            password=None
        )
        
        # Create real access token
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        return {"success": True, "access_token": access_token, "username": new_user.username}
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Complete profile error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to complete profile setup") 