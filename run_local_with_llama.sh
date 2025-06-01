#!/bin/bash

echo "Starting Agent Chat Application with Llama API..."

# Export the Llama API key
export LLAMA_API_KEY='LLM|969038691802156|u86DbGY93yYwAq2wdW-SJRp49AE'

# Start backend
echo "Starting backend server with Llama API key..."
cd backend
source venv/bin/activate
LLAMA_API_KEY=$LLAMA_API_KEY uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend on port 3001
echo "Starting frontend server..."
cd ../frontend
PORT=3001 npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 Application started with Llama API!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3001"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait 