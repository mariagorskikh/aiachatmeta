from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..database.connection import get_db
from ..database.models import User, Conversation, Message, AgentTone
from ..services.chat_service import ChatService
from .auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])
chat_service = ChatService()

class SendMessageRequest(BaseModel):
    content: str

class UpdateToneRequest(BaseModel):
    tone: str
    custom_prompt: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_username: str
    original_content: str
    transformed_content: str
    timestamp: str
    is_mine: bool
    is_read: bool

class ConversationResponse(BaseModel):
    id: str
    other_user: Dict[str, str]
    last_message: Optional[Dict[str, Any]]
    unread_count: int
    my_agent_tone: str
    my_custom_prompt: Optional[str]

@router.get("/users", response_model=List[Dict[str, str]])
async def get_all_users(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all users except current user"""
    result = await db.execute(
        select(User).where(User.id != current_user.id)
    )
    users = result.scalars().all()
    
    return [
        {"id": user.id, "username": user.username}
        for user in users
    ]

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all conversations for current user"""
    conversations = await chat_service.get_user_conversations(current_user.id, db)
    return conversations

@router.post("/conversation/{other_user_id}")
async def get_or_create_conversation(
    other_user_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get or create conversation with another user"""
    # Check if other user exists
    other_user = await db.get(User, other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    conversation = await chat_service.get_or_create_conversation(
        current_user.id, other_user_id, db
    )
    
    # Get user's tone for this conversation
    if conversation.user1_id == current_user.id:
        user_tone = conversation.user1_agent_tone
        user_custom_prompt = conversation.user1_custom_prompt
    else:
        user_tone = conversation.user2_agent_tone
        user_custom_prompt = conversation.user2_custom_prompt
    
    return {
        "id": conversation.id,
        "other_user": {
            "id": other_user.id,
            "username": other_user.username
        },
        "my_agent_tone": user_tone.value,
        "my_custom_prompt": user_custom_prompt
    }

@router.get("/conversation/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all messages in a conversation"""
    # Verify user is part of this conversation
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mark messages as read
    await chat_service.mark_messages_as_read(conversation_id, current_user.id, db)
    
    # Get messages
    messages = await chat_service.get_conversation_messages(conversation_id, db)
    
    # Get sender usernames
    user_ids = list(set([msg.sender_id for msg in messages]))
    users_result = await db.execute(
        select(User).where(User.id.in_(user_ids))
    )
    users = {u.id: u.username for u in users_result.scalars().all()}
    
    return [
        MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            sender_username=users.get(msg.sender_id, "Unknown"),
            original_content=msg.original_content,
            transformed_content=msg.transformed_content,
            timestamp=msg.timestamp.isoformat(),
            is_mine=msg.sender_id == current_user.id,
            is_read=msg.is_read
        )
        for msg in messages
    ]

@router.post("/conversation/{conversation_id}/send")
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message in a conversation"""
    # Verify user is part of this conversation
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Send message
    message = await chat_service.send_message(
        conversation_id, current_user.id, request.content, db
    )
    
    if not message:
        raise HTTPException(status_code=500, detail="Failed to send message")
    
    return {
        "id": message.id,
        "original_content": message.original_content,
        "transformed_content": message.transformed_content,
        "timestamp": message.timestamp.isoformat()
    }

@router.put("/conversation/{conversation_id}/tone")
async def update_tone(
    conversation_id: str,
    request: UpdateToneRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update agent tone for a conversation"""
    try:
        tone = AgentTone(request.tone)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tone")
    
    success = await chat_service.update_agent_tone(
        conversation_id, current_user.id, tone, request.custom_prompt, db
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found or not authorized")
    
    return {"success": True} 