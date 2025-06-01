"""Test the Llama API directly"""
import os
import httpx
import json

# Set the API key
api_key = 'LLM|969038691802156|u86DbGY93yYwAq2wdW-SJRp49AE'

# Test request
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "model": "Llama-4-Maverick-17B-128E-Instruct-FP8",
    "messages": [
        {
            "role": "system",
            "content": "You are a message transformer. Transform the given message according to the instruction. Keep it concise and natural."
        },
        {
            "role": "user",
            "content": "Make this message sound more professional: Hey what's up"
        }
    ],
    "temperature": 0.7,
    "max_tokens": 200
}

print("Testing Llama API...")
print(f"URL: https://api.llama.com/v1/chat/completions")
print(f"Headers: {headers}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = httpx.post(
        "https://api.llama.com/v1/chat/completions",
        headers=headers,
        json=data,
        timeout=30.0
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"\nResponse Body:")
    print(json.dumps(response.json(), indent=2))
    
    # Extract the transformed text
    if response.status_code == 200:
        resp_json = response.json()
        if 'completion_message' in resp_json:
            content = resp_json['completion_message']['content']
            if isinstance(content, dict) and 'text' in content:
                print(f"\nTransformed text: {content['text']}")
            
except Exception as e:
    print(f"\nError: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc() 