from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
import enum

Base = declarative_base()

# Use String type for SQLite, UUID for PostgreSQL
def get_uuid_type():
    import os
    if 'sqlite' in os.environ.get('DATABASE_URL', ''):
        return String(36)
    return PostgresUUID(as_uuid=True)

UUID = get_uuid_type()

class AgentTone(enum.Enum):
    SMARTER = "smarter"
    PROFESSIONAL = "professional"
    NICER = "nicer"
    MEANER = "meaner"
    SARCASM = "sarcasm"
    LOVING = "loving"
    ANGRY = "angry"
    CUSTOM = "custom"

class MessageStatus(enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversations_initiated = relationship("Conversation", foreign_keys="Conversation.user1_id", back_populates="user1")
    conversations_received = relationship("Conversation", foreign_keys="Conversation.user2_id", back_populates="user2")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user1_id = Column(String(36), ForeignKey("users.id"))
    user2_id = Column(String(36), ForeignKey("users.id"))
    user1_agent_tone = Column(Enum(AgentTone), default=AgentTone.NICER)
    user2_agent_tone = Column(Enum(AgentTone), default=AgentTone.NICER)
    user1_custom_prompt = Column(Text, nullable=True)
    user2_custom_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_message_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id], back_populates="conversations_initiated")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="conversations_received")
    messages = relationship("Message", back_populates="conversation", order_by="Message.timestamp")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"))
    sender_id = Column(String(36), ForeignKey("users.id"))
    original_content = Column(Text, nullable=False)
    transformed_content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    is_read = Column(Boolean, default=False)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages") 