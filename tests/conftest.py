"""
pytest configuration: load .env before any test module is collected,
so OPENAI_API_KEY is available for skipif guards.
"""
import os
from dotenv import load_dotenv

# Load .env from repo root (one level up from tests/)
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(_ROOT, ".env"))
