import os
from dotenv import load_dotenv

# Загружаем .env из текущей папки агента
load_dotenv()

NORDIC_API_URL = os.getenv("NORDIC_API_URL", "http://localhost:3000").rstrip("/")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    print("Warning: ANTHROPIC_API_KEY is not set. Claude will not work, but HTTP tools can be tested.")
