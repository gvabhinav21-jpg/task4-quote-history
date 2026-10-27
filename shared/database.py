"""Small sqlite3 helpers shared by the task applications."""

import sqlite3
from contextlib import contextmanager


@contextmanager
def connection(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def initialize(db_path, schema, seed=None, seed_sql=None):
    with connection(db_path) as conn:
        conn.executescript(schema)
        if seed and seed_sql:
            conn.executemany(seed_sql, seed)


def fetch_all(db_path, sql, params=()):
    with connection(db_path) as conn:
        return conn.execute(sql, params).fetchall()


def fetch_one(db_path, sql, params=()):
    with connection(db_path) as conn:
        return conn.execute(sql, params).fetchone()


def execute(db_path, sql, params=(), *, return_id=False):
    with connection(db_path) as conn:
        cursor = conn.execute(sql, params)
        return cursor.lastrowid if return_id else cursor.rowcount
