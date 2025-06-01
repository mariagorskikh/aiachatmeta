"""Test the chat service transformation"""
import asyncio
from app.services.chat_service import ChatService
from app.database.models import AgentTone

async def test_transformation():
    chat_service = ChatService()
    
    test_message = "Hey what's up"
    
    print("Testing message transformations...")
    print(f"Original message: '{test_message}'\n")
    
    # Test each tone
    for tone in AgentTone:
        if tone == AgentTone.CUSTOM:
            continue  # Skip custom for now
        
        print(f"Testing {tone.value} tone...")
        try:
            transformed = await chat_service.transform_message(test_message, tone)
            print(f"✅ Success: '{transformed}'")
        except Exception as e:
            print(f"❌ Error: {type(e).__name__}: {e}")
        print()

if __name__ == "__main__":
    asyncio.run(test_transformation()) 