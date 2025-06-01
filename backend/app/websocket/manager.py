from typing import Dict, List
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)
    
    async def send_json_to_user(self, data: dict, user_id: str):
        if user_id in self.active_connections:
            message = json.dumps(data)
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)
    
    async def broadcast(self, message: str):
        for user_connections in self.active_connections.values():
            for connection in user_connections:
                await connection.send_text(message)

# Global connection manager instance
manager = ConnectionManager() 