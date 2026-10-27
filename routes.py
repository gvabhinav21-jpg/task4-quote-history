import random

import requests
from flask import Blueprint, jsonify, render_template

from config import DB_PATH, QUOTE_API, QUOTE_API_TIMEOUT
from data import FALLBACK_QUOTES
from shared.api import json_error, json_payload, row_to_dict
from shared.database import execute, fetch_all, fetch_one

bp = Blueprint("quotes", __name__)

QUOTE_COLUMNS = ("id", "quote", "author", "is_favorite", "timestamp")


def serialize_quote(row):
    data = row_to_dict(row, boolean_fields=("is_favorite",))
    return {column: data[column] for column in QUOTE_COLUMNS}


def fetch_api_quote():
    try:
        response = requests.get(QUOTE_API, timeout=QUOTE_API_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            return data.get("quote", "").strip(), data.get("author", "Unknown").strip()
    except Exception as exc:
        print(f"API Fetch failed: {exc}. Using fallback pool.")
    return "", ""


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/api/quote/random", methods=["GET"])
def get_random_quote():
    quote_text, quote_author = fetch_api_quote()

    if not quote_text:
        selected = random.choice(FALLBACK_QUOTES)
        quote_text = selected["quote"]
        quote_author = selected["author"]

    try:
        quote_id = execute(
            DB_PATH,
            "INSERT INTO quote_history (quote, author, is_favorite) VALUES (?, ?, 0)",
            (quote_text, quote_author),
            return_id=True,
        )
        quote_row = fetch_one(DB_PATH, "SELECT * FROM quote_history WHERE id = ?", (quote_id,))
        return jsonify(serialize_quote(quote_row))
    except Exception as exc:
        return json_error(str(exc), 500)


@bp.route("/api/quotes/history", methods=["GET"])
def get_history():
    try:
        history = fetch_all(DB_PATH, "SELECT * FROM quote_history ORDER BY id DESC")
        return jsonify([serialize_quote(item) for item in history])
    except Exception as exc:
        return json_error(str(exc), 500)


@bp.route("/api/quotes/history/<int:quote_id>", methods=["PATCH"])
def toggle_favorite(quote_id):
    try:
        data = json_payload()
        is_favorite = data.get("is_favorite")

        if is_favorite is None:
            return json_error("is_favorite parameter is required")

        quote = fetch_one(DB_PATH, "SELECT * FROM quote_history WHERE id = ?", (quote_id,))
        if not quote:
            return json_error("Quote not found", 404)

        execute(
            DB_PATH,
            "UPDATE quote_history SET is_favorite = ? WHERE id = ?",
            (1 if is_favorite else 0, quote_id),
        )

        updated = fetch_one(DB_PATH, "SELECT * FROM quote_history WHERE id = ?", (quote_id,))
        return jsonify(serialize_quote(updated))
    except Exception as exc:
        return json_error(str(exc), 500)


@bp.route("/api/quotes/history", methods=["DELETE"])
def clear_history():
    try:
        execute(DB_PATH, "DELETE FROM quote_history")
        return jsonify({"message": "History cleared successfully"})
    except Exception as exc:
        return json_error(str(exc), 500)
