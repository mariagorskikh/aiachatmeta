# Agent Chat Backend

The backend API for the Agent-to-Agent Communication Chat App.

## Prerequisites

- Python 3.8+
- PostgreSQL
- Redis

## Setup

1. **Create a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up PostgreSQL:**
```bash
# Create database
createdb agent_chat

# Update DATABASE_URL in app/config.py if needed
```

4. **Set up Redis:**
```bash
# Make sure Redis is running on localhost:6379
redis-server
```

5. **Run database migrations:**
```bash
# Initialize Alembic
alembic init alembic

# Create first migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

6. **Run the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once the server is running, visit:
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/token` - Login
- `GET /api/auth/me` - Get current user

### Agent Communication
- `POST /api/agent/chat` - Send message to your agent
- `GET /api/agent/messages/sent` - Get sent messages
- `GET /api/agent/messages/received` - Get received messages
- `GET /api/agent/contacts` - Get available contacts
- `GET /api/agent/conversations` - Get conversation history

### WebSocket
- `ws://localhost:8000/ws/{user_id}` - Real-time updates

## Environment Variables

Create a `.env` file:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/agent_chat
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
LLAMA_API_KEY=your-llama-api-key
``` 