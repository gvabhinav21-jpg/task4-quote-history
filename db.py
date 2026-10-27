from config import DB_PATH
from shared.database import initialize

SCHEMA = """
DROP TABLE IF EXISTS quote_history;
CREATE TABLE quote_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    is_favorite INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def init_db():
    initialize(DB_PATH, SCHEMA)
