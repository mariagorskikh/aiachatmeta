"""Clear all data from the database"""
import asyncio
from sqlalchemy import delete
from app.database.connection import AsyncSessionLocal
from app.database.models import User, Conversation, Message

async def clear_all_data():
    """Clear all data from the database"""
    async with AsyncSessionLocal() as session:
        try:
            # Delete in order to respect foreign key constraints
            print("Clearing messages...")
            await session.execute(delete(Message))
            
            print("Clearing conversations...")
            await session.execute(delete(Conversation))
            
            print("Clearing users...")
            await session.execute(delete(User))
            
            await session.commit()
            print("✅ Database cleared successfully!")
            
        except Exception as e:
            print(f"❌ Error clearing database: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(clear_all_data()) 