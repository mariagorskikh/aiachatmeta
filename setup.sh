#!/bin/bash

echo "🚀 Setting up Agent Chat Application..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 5

echo "🔧 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Initialize Alembic if not already done
if [ ! -d "alembic" ]; then
    echo "Initializing database migrations..."
    alembic init alembic
fi

# Run migrations
echo "Running database migrations..."
alembic revision --autogenerate -m "Initial migration" 2>/dev/null || true
alembic upgrade head

cd ..

echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "📝 Don't forget to update the Llama API key in backend/app/config.py"
echo ""
echo "🌐 Access the app at http://localhost:3000" 