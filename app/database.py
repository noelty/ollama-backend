import sqlite3
from datetime import datetime
from ulid import ULID

def init_db():
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    
    cursor.execute("CREATE TABLE IF NOT EXISTS conversations (id VARCHAR(50) PRIMARY KEY, title VARCHAR(100), created_at DATETIME, updated_at DATETIME)")
    cursor.execute("CREATE TABLE IF NOT EXISTS messages (id VARCHAR(50) PRIMARY KEY, role CHAR(10), content TEXT, created_at DATETIME, conv_id VARCHAR(50), FOREIGN KEY (conv_id) REFERENCES conversations(id))")
    cursor.execute("CREATE TABLE IF NOT EXISTS documents (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), conv_id VARCHAR(50), FOREIGN KEY (conv_id) REFERENCES conversations(id))")
    cursor.execute("CREATE TABLE IF NOT EXISTS document_contents (id VARCHAR(50) PRIMARY KEY, content VARCHAR(1000), doc_id VARCHAR(50), FOREIGN KEY (doc_id) REFERENCES documents(id))")
    
    conn.commit()
    conn.close()
    
def get_db():
    conn = sqlite3.connect("chat.db",check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def get_message_from_db(conn: sqlite3.Connection, conv_id: str):
    cursor = conn.cursor()
    res = cursor.execute("SELECT role, content FROM messages WHERE messages.conv_id == ? ORDER BY messages.created_at DESC LIMIT 5",(conv_id,))
    conn.commit()
    return res.fetchall()

def save_conv(conn: sqlite3.Connection, conv_id: str, title: str, created: datetime, updated: datetime):
    conv_id = conv_id
    cursor = conn.cursor()
    cursor.execute("INSERT INTO conversations(id, title, created_at, updated_at) VALUES(?,?,?,?)",(conv_id, title, created, updated))
    conn.commit()
    return cursor.lastrowid

def search_conv(conn: sqlite3.Connection, conv_id: str):
    cursor = conn.cursor()
    row = cursor.execute("SELECT id FROM conversations WHERE conversations.id == ?",(conv_id,))
    row = cursor.fetchone()
    print("----------------------------------------")
    print(row)
    print("----------------------------------------")
    return row if row else None

# def update_conv_title(conn: sqlite3.Connection, conv_id: str, title: str):
#     cursor = conn.cursor()
#     cursor.execute("UPDATE conversations SET title = ? WHERE conversations.id == ?",(title, conv_id))
#     conn.commit()

def delete_conv(conn: sqlite3.Connection, conv_id: str):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE messages.conv_id == ?", (conv_id,))
    cursor.execute("DELETE FROM conversations WHERE conversations.id == ?", (conv_id,))
    conn.commit()
    return cursor.rowcount > 0
    
def insert_message(conn: sqlite3.Connection, role: str, content: str, created_at: datetime, conv_id: str):
    mssg_id = str(ULID())
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages(id, role, content, created_at, conv_id) VALUES(?,?,?,?,?)",(mssg_id, role, content, created_at, conv_id))
    cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (created_at, conv_id))
    conn.commit()
    
def empty_conv(conn: sqlite3.Connection, conv_id: str):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM conversations WHERE id == ?", (conv_id,))
    conn.commit()
    row = cursor.fetchone()
    return None if row is None else row[0]

def get_convs(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
    res = cursor.fetchall()
    convs = []
    for row in res:
        print(row["id"])
        convs.append({
            "id": row["id"],
            "title": row["title"]
            })
    return convs
        
def get_conv_messages(conn: sqlite3.Connection, conv_id: str):
    cursor = conn.cursor()
    cursor.execute("SELECT role, content FROM messages WHERE conv_id == ? ORDER BY id", (conv_id,))
    res = cursor.fetchall()
    conv_messages = []
    for row in res:
        print(row["role"])
        print(row["content"])
        print("=================")
        conv_messages.append({
            "role": row["role"],
            "content": row["content"]
        })
        print("--------------------------------")
        print(conv_messages)
    return conv_messages

def insert_document(conn: sqlite3.Connection, doc_name: str):
    doc_id = str(ULID())
    cursor = conn.cursor()
    cursor.execute("INSERT INTO documents(id, name) VALUES( ?, ?)",(doc_id, doc_name))
    conn.commit()
    return cursor.lastrowid

def insert_content(conn: sqlite3.Connection, content: str, doc_id: str):
    id = str(ULID())
    cursor = conn.cursor()
    cursor.execute("INSERT INTO document_contents(id, content, doc_id) VALUES(?,?,?)", (id, content, doc_id))
    conn.commit()
    return cursor.lastrowid

def delete_document(conn: sqlite3.Connection, doc_id: str):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document_contents WHERE doc_id = ?", (doc_id,))
    cursor.execute("DELETE FROM document WHERE id = ?", (doc_id,))
    conn.commit()
    return cursor.rowcount > 0