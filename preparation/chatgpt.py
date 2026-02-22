import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

prompt = "hello"

# Configuration
API_KEY = os.getenv("openai_api_key")
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}",
}

def callChatGPT(prompt):
    # 简化的消息格式，类似 generateText.ts
    payload = {
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "model": "gpt-4o-mini"
    }

    ENDPOINT = "https://api.openai.com/v1/chat/completions"

    # Send request
    try:
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
    except requests.RequestException as e:
        raise SystemExit(f"Failed to make the request. Error: {e}")

    # Handle the response
    output = response.json()["choices"][0]["message"]["content"]
    return output

callChatGPT(prompt)