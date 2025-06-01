from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, chat
from .database.models import Base
from .database.connection import engine
from .config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Agent Chat API",
    description="Backend API for Agent-to-Agent Communication Chat App",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "Agent Chat Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    print("Agent Chat Backend Started")
    if settings.LLAMA_API_KEY:
        print("Llama API configured")
    else:
        print("Warning: LLAMA_API_KEY not set")

@app.on_event("shutdown")
async def shutdown_event():
    print("Agent Chat Backend Shutting Down") 