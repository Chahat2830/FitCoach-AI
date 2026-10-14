
import os
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(env_path)

key = os.getenv("GROQ_API_KEY")

if key and key != "your_groq_api_key_here":
    print("Groq API key loaded successfully.")
else:
    print("GROQ_API_KEY is missing or still a placeholder.")
