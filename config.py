from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = str(BASE_DIR / "quotes.db")
HOST = "127.0.0.1"
PORT = 5004
DEBUG = True
QUOTE_API = "https://dummyjson.com/quotes/random"
QUOTE_API_TIMEOUT = 3.0
