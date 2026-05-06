import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Always load .env from the backend directory, regardless of CWD
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PRIMARY_MODEL = "gemma2-9b-it"
CONTEXT_MODEL = "llama-3.3-70b-versatile"

groq_client = Groq(api_key=GROQ_API_KEY)


def call_llm(prompt: str, system_prompt: str = None, model: str = PRIMARY_MODEL) -> str:
    """Call Groq LLM and return text response."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = groq_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.3,
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()
