import os
import random
import sqlite3
import requests
from flask import Flask, request, jsonify, render_template

app = Flask(__name__, template_folder='templates', static_folder='static')

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'quotes.db')

FALLBACK_QUOTES = [
    {"quote": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
    {"quote": "Talk is cheap. Show me the code.", "author": "Linus Torvalds"},
    {"quote": "Programs must be written for people to read, and only secondarily for machines to execute.", "author": "Harold Abelson"},
    {"quote": "Simplicity is the soul of efficiency.", "author": "Austin Freeman"},
    {"quote": "Make it work, make it right, make it fast.", "author": "Kent Beck"},
    {"quote": "First, solve the problem. Then, write the code.", "author": "John Johnson"},
    {"quote": "Knowledge is power.", "author": "Francis Bacon"},
    {"quote": "The best way to predict the future is to invent it.", "author": "Alan Kay"},
    {"quote": "Computers are good at following instructions, but not at reading your mind.", "author": "Donald Knuth"},
    {"quote": "We suffer more often in imagination than in reality.", "author": "Seneca"},
    {"quote": "The happiness of your life depends upon the quality of your thoughts.", "author": "Marcus Aurelius"},
    {"quote": "Life is what happens when you're busy making other plans.", "author": "John Lennon"},
    {"quote": "You miss 100% of the shots you don't take.", "author": "Wayne Gretzky"},
    {"quote": "Whether you think you can or think you can't, you're right.", "author": "Henry Ford"},
    {"quote": "Strive not to be a success, but rather to be of value.", "author": "Albert Einstein"},
    {"quote": "Happiness is not something ready-made. It comes from your own actions.", "author": "Dalai Lama"},
    {"quote": "It is not that we have a short time to live, but that we waste a lot of it.", "author": "Seneca"},
    {"quote": "Code is like humor. When you have to explain it, it’s bad.", "author": "Cory House"},
    {"quote": "Before software can be reusable it first has to be usable.", "author": "Ralph Johnson"},
    {"quote": "Clean code always looks like it was written by someone who cares.", "author": "Michael Feathers"},
    {"quote": "The computer was born to solve problems that did not exist before.", "author": "Bill Gates"},
    {"quote": "Optimism is a occupational hazard of programming: feedback is the treatment.", "author": "Kent Beck"},
    {"quote": "Fix the cause, not the symptom.", "author": "Steve Maguire"},
    {"quote": "Complexity is your enemy. Any fool can make something complicated.", "author": "Richard Branson"},
    {"quote": "The only limit to our realization of tomorrow will be our doubts of today.", "author": "Franklin D. Roosevelt"},
    {"quote": "Do not seek to follow in the footsteps of the wise. Seek what they sought.", "author": "Basho"},
    {"quote": "Be yourself; everyone else is already taken.", "author": "Oscar Wilde"},
    {"quote": "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", "author": "Ralph Waldo Emerson"},
    {"quote": "What you do speaks so loudly that I cannot hear what you say.", "author": "Ralph Waldo Emerson"},
    {"quote": "Control your mind or it will control you.", "author": "Horace"},
    {"quote": "It always seems impossible until it's done.", "author": "Nelson Mandela"},
    {"quote": "Quality is not an act, it is a habit.", "author": "Aristotle"},
    {"quote": "The standard you walk past is the standard you accept.", "author": "David Morrison"},
    {"quote": "In the middle of difficulty lies opportunity.", "author": "Albert Einstein"},
    {"quote": "Great minds discuss ideas; average minds discuss events; small minds discuss people.", "author": "Eleanor Roosevelt"}
]

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DROP TABLE IF EXISTS quote_history')
    cursor.execute('''
        CREATE TABLE quote_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote TEXT NOT NULL,
            author TEXT NOT NULL,
            is_favorite INTEGER DEFAULT 0,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/quote/random', methods=['GET'])
def get_random_quote():
    quote_text = ""
    quote_author = ""
    
    try:
        response = requests.get('https://dummyjson.com/quotes/random', timeout=3.0)
        if response.status_code == 200:
            data = response.json()
            quote_text = data.get('quote', '').strip()
            quote_author = data.get('author', 'Unknown').strip()
    except Exception as e:
        print(f"API Fetch failed: {e}. Using fallback pool.")
    
    if not quote_text:
        selected = random.choice(FALLBACK_QUOTES)
        quote_text = selected["quote"]
        quote_author = selected["author"]

    # Log to DB and return the inserted note with ID
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO quote_history (quote, author, is_favorite) VALUES (?, ?, 0)',
            (quote_text, quote_author)
        )
        quote_id = cursor.lastrowid
        conn.commit()
        
        quote_row = conn.execute('SELECT * FROM quote_history WHERE id = ?', (quote_id,)).fetchone()
        conn.close()
        
        return jsonify({
            'id': quote_row['id'],
            'quote': quote_row['quote'],
            'author': quote_row['author'],
            'is_favorite': bool(quote_row['is_favorite'])
        })
    except Exception as db_err:
        return jsonify({'error': str(db_err)}), 500

@app.route('/api/quotes/history', methods=['GET'])
def get_history():
    try:
        conn = get_db_connection()
        history = conn.execute('SELECT * FROM quote_history ORDER BY id DESC').fetchall()
        conn.close()
        
        history_list = []
        for item in history:
            history_list.append({
                'id': item['id'],
                'quote': item['quote'],
                'author': item['author'],
                'is_favorite': bool(item['is_favorite']),
                'timestamp': item['timestamp']
            })
        return jsonify(history_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quotes/history/<int:quote_id>', methods=['PATCH'])
def toggle_favorite(quote_id):
    try:
        data = request.get_json() or {}
        is_favorite = data.get('is_favorite')
        
        if is_favorite is None:
            return jsonify({'error': 'is_favorite parameter is required'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        quote = conn.execute('SELECT * FROM quote_history WHERE id = ?', (quote_id,)).fetchone()
        if not quote:
            conn.close()
            return jsonify({'error': 'Quote not found'}), 404
            
        cursor.execute(
            'UPDATE quote_history SET is_favorite = ? WHERE id = ?',
            (1 if is_favorite else 0, quote_id)
        )
        conn.commit()
        
        updated = conn.execute('SELECT * FROM quote_history WHERE id = ?', (quote_id,)).fetchone()
        conn.close()
        
        return jsonify({
            'id': updated['id'],
            'quote': updated['quote'],
            'author': updated['author'],
            'is_favorite': bool(updated['is_favorite']),
            'timestamp': updated['timestamp']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quotes/history', methods=['DELETE'])
def clear_history():
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM quote_history')
        conn.commit()
        conn.close()
        return jsonify({'message': 'History cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='127.0.0.1', port=5004, debug=True)
