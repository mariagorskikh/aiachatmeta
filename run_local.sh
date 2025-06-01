#!/bin/bash

echo "Starting Agent Chat Application..."

# Start backend
echo "Starting backend server..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend on port 3001
echo "Starting frontend server..."
cd ../frontend
PORT=3001 npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 Application started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3001"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait 