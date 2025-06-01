import httpx
from typing import Dict, Any, Optional, List
from ..config import settings
from ..database.models import User, Conversation, Message, AgentTone, MessageStatus
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, update
from sqlalchemy.orm import selectinload
from datetime import datetime

class ChatService:
    def __init__(self):
        self.tone_prompts = {
            AgentTone.SMARTER: "Transform to sophisticated vocabulary and intelligent phrasing (output only the message): ",
            AgentTone.PROFESSIONAL: "Transform to formal professional business tone (output only the message): ",
            AgentTone.NICER: "Transform to be warmer and friendlier (output only the message): ",
            AgentTone.MEANER: "Transform to be colder and more critical (output only the message): ",
            AgentTone.SARCASM: "Transform the given message to be a message with subtle sarcasm and wit (output only the message): ",
            AgentTone.LOVING: "Transform to express warmth and affection (output only the message): ",
            AgentTone.ANGRY: "Transform to express frustration and anger civilly (output only the message): ",
        }
    
    async def get_or_create_conversation(self, user1_id: str, user2_id: str, db: AsyncSession) -> Conversation:
        """Get existing conversation or create new one between two users"""
        # Check both directions since conversation can be initiated from either side
        result = await db.execute(
            select(Conversation).where(
                or_(
                    and_(Conversation.user1_id == user1_id, Conversation.user2_id == user2_id),
                    and_(Conversation.user1_id == user2_id, Conversation.user2_id == user1_id)
                )
            )
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            # Create new conversation
            conversation = Conversation(
                user1_id=user1_id,
                user2_id=user2_id
            )
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
        
        return conversation
    
    async def update_agent_tone(self, conversation_id: str, user_id: str, 
                               tone: AgentTone, custom_prompt: Optional[str], 
                               db: AsyncSession) -> bool:
        """Update the agent tone for a user in a conversation"""
        conversation = await db.get(Conversation, conversation_id)
        if not conversation:
            return False
        
        if conversation.user1_id == user_id:
            conversation.user1_agent_tone = tone
            if tone == AgentTone.CUSTOM:
                conversation.user1_custom_prompt = custom_prompt
        elif conversation.user2_id == user_id:
            conversation.user2_agent_tone = tone
            if tone == AgentTone.CUSTOM:
                conversation.user2_custom_prompt = custom_prompt
        else:
            return False
        
        await db.commit()
        return True
    
    async def transform_message(self, content: str, tone: AgentTone, 
                              custom_prompt: Optional[str] = None) -> str:
        """Transform message content based on agent tone using Llama API"""
        if tone == AgentTone.CUSTOM and custom_prompt:
            prompt = f"{custom_prompt}: {content}"
        elif tone in self.tone_prompts:
            prompt = self.tone_prompts[tone] + content
        else:
            # Default - return original if no tone set
            return content
        
        print(f"\n=== TRANSFORMING MESSAGE ===")
        print(f"Original: '{content}'")
        print(f"Tone: {tone}")
        print(f"Prompt: '{prompt}'")
        
        try:
            headers = {
                "Authorization": f"Bearer {settings.LLAMA_API_KEY}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "Llama-4-Maverick-17B-128E-Instruct-FP8",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a message transformer. Transform the given message according to the instruction. Output ONLY the transformed message without any introduction, explanation, or quotation marks. Do not say 'Here is' or similar phrases. Just output the transformed message directly."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 200
            }
            
            print(f"Calling Llama API...")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.llama.com/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=30.0
                )
            
            print(f"API Status: {response.status_code}")
            
            if response.status_code == 200:
                resp_json = response.json()
                if 'completion_message' in resp_json:
                    content_obj = resp_json['completion_message']['content']
                    if isinstance(content_obj, dict) and 'text' in content_obj:
                        transformed = content_obj['text'].strip()
                        print(f"Transformed: '{transformed}'")
                        print("=== TRANSFORMATION COMPLETE ===\n")
                        return transformed
            
            print(f"API Error: {response.text}")
            raise Exception(f"API returned status {response.status_code}")
                
        except Exception as e:
            print(f"ERROR transforming message: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            # Reraise the exception - no fallback
            raise
    
    async def send_message(self, conversation_id: str, sender_id: str, 
                          content: str, db: AsyncSession) -> Optional[Message]:
        """Send a message in a conversation"""
        conversation = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = conversation.scalar_one_or_none()
        
        if not conversation:
            return None
        
        # Determine which tone to use based on sender
        if conversation.user1_id == sender_id:
            tone = conversation.user1_agent_tone
            custom_prompt = conversation.user1_custom_prompt
            print(f"User1 sending: tone={tone}, custom_prompt={custom_prompt}")
        elif conversation.user2_id == sender_id:
            tone = conversation.user2_agent_tone
            custom_prompt = conversation.user2_custom_prompt
            print(f"User2 sending: tone={tone}, custom_prompt={custom_prompt}")
        else:
            return None
        
        # Transform the message
        transformed_content = await self.transform_message(content, tone, custom_prompt)
        
        # Create message record
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            original_content=content,
            transformed_content=transformed_content
        )
        db.add(message)
        
        # Update conversation last message time
        conversation.last_message_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(message)
        
        return message
    
    async def get_conversation_messages(self, conversation_id: str, db: AsyncSession) -> List[Message]:
        """Get all messages in a conversation"""
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.timestamp.asc())
        )
        return result.scalars().all()
    
    async def mark_messages_as_read(self, conversation_id: str, user_id: str, db: AsyncSession):
        """Mark all messages in a conversation as read for a user"""
        await db.execute(
            update(Message)
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,
                    Message.is_read == False
                )
            )
            .values(is_read=True, status=MessageStatus.READ)
        )
        await db.commit()
    
    async def get_user_conversations(self, user_id: str, db: AsyncSession) -> List[Dict[str, Any]]:
        """Get all conversations for a user with last message and unread count"""
        result = await db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
                selectinload(Conversation.messages)
            )
            .where(
                or_(
                    Conversation.user1_id == user_id,
                    Conversation.user2_id == user_id
                )
            )
            .order_by(Conversation.last_message_at.desc())
        )
        conversations = result.scalars().all()
        
        conv_list = []
        for conv in conversations:
            # Get the other user
            other_user = conv.user2 if conv.user1_id == user_id else conv.user1
            
            # Get last message
            last_message = None
            if conv.messages:
                last_message = conv.messages[-1]
            
            # Count unread messages
            unread_count = sum(1 for msg in conv.messages 
                             if msg.sender_id != user_id and not msg.is_read)
            
            # Get user's tone for this conversation
            if conv.user1_id == user_id:
                user_tone = conv.user1_agent_tone
                user_custom_prompt = conv.user1_custom_prompt
            else:
                user_tone = conv.user2_agent_tone
                user_custom_prompt = conv.user2_custom_prompt
            
            conv_list.append({
                "id": conv.id,
                "other_user": {
                    "id": other_user.id,
                    "username": other_user.username
                },
                "last_message": {
                    "content": last_message.transformed_content if last_message else None,
                    "timestamp": last_message.timestamp.isoformat() if last_message else None,
                    "is_mine": last_message.sender_id == user_id if last_message else None
                },
                "unread_count": unread_count,
                "my_agent_tone": user_tone.value,
                "my_custom_prompt": user_custom_prompt
            })
        
        return conv_list 