import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    
    cursor.execute("CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(100), created_at DATETIME)")
    cursor.execute("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, role CHAR(10), content TEXT, created_at DATETIME, conv_id INTEGER, FOREIGN KEY (conv_id) REFERENCES conversations(id))")
    
    conn.commit()
    conn.close()
    
def get_db():
    conn = sqlite3.connect("chat.db",check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def get_message_from_db(conn: sqlite3.Connection, conv_id: int):
    cursor = conn.cursor()
    res = cursor.execute("SELECT role, content FROM messages WHERE messages.conv_id == ? ORDER BY messages.created_at DESC LIMIT 5",(conv_id,))
    conn.commit()
    return res.fetchall()


def create_conv(conn: sqlite3.Connection, title: str, created: datetime):
    cursor = conn.cursor()
    cursor.execute("INSERT INTO conversations(title, created_at) VALUES(?,?)",(title, created))
    conn.commit()
    return cursor.lastrowid

def update_conv_title(conn: sqlite3.Connection, conv_id: int, title: str):
    cursor = conn.cursor()
    cursor.execute("UPDATE conversations SET title = ? WHERE conversations.id == ?",(title, conv_id))
    conn.commit()

def delete_conv(conn: sqlite3.Connection, conv_id: int):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conversations WHERE conversations.id == ?", (conv_id,))
    conn.commit()
    
    
def insert_message(conn: sqlite3.Connection, role: str, content: str, created_at: datetime, conv_id: int):
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages(role, content, created_at, conv_id) VALUES(?,?,?,?)",(role, content, created_at, conv_id))
    conn.commit()
    
def check_if_empty_conv(conn: sqlite3.Connection, conv_id: int):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM conversations WHERE id == ?", (conv_id,))
    conn.commit()
    row = cursor.fetchone()
    return None if row is None else row[0]