from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..config import settings
from ..database.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        pass
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)
    
    async def authenticate_user(self, db: AsyncSession, username: str, password: str):
        user = await self.get_user_by_username(db, username)
        if not user:
            return False
        if not self.verify_password(password, user.password_hash):
            return False
        return user
    
    async def get_user_by_username(self, db: AsyncSession, username: str):
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()
    
    async def get_user_by_email(self, db: AsyncSession, email: str):
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    async def get_current_user(self, token: str, db: AsyncSession):
        credentials_exception = Exception("Could not validate credentials")
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
        # Get user by ID
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None:
            raise credentials_exception
        return user
    
    async def create_user(self, db: AsyncSession, username: str, email: str, password: str = None):
        """Create a new user"""
        # Check if user exists
        existing_user = await self.get_user_by_username(db, username)
        if existing_user:
            raise ValueError("Username already exists")
        
        if email:
            existing_email = await self.get_user_by_email(db, email)
            if existing_email:
                raise ValueError("Email already exists")
        
        # Create user
        hashed_password = self.get_password_hash(password) if password else ""
        user = User(
            username=username,
            email=email,
            password_hash=hashed_password
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user 