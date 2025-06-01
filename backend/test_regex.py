import re

def test_extract_intent():
    test_messages = [
        "Send a message to justin saying hello",
        "Tell maria that I'll be late",
        "Message john about the meeting",
        "Send to sarah that the project is done",
        "Let mike know I'm on my way"
    ]
    
    patterns = [
        r"(?:tell|say to|message|send to|contact)\s+(\w+)\s+(?:that\s+)?(.+)",
        r"(?:let)\s+(\w+)\s+(?:know\s+)?(.+)",
        r"(?:send)\s+(?:a\s+)?(?:message\s+)?(?:to\s+)?(\w+)\s+(?:saying\s+)?(.+)",
    ]
    
    for msg in test_messages:
        print(f"\nTesting: '{msg}'")
        found = False
        for i, pattern in enumerate(patterns):
            match = re.search(pattern, msg.lower(), re.IGNORECASE)
            if match:
                print(f"  Pattern {i} matched!")
                print(f"  Groups: {match.groups()}")
                found = True
                break
        if not found:
            print("  No match found")

if __name__ == "__main__":
    test_extract_intent() 