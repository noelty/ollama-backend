import sqlite3
from app.database import get_message_from_db



def create_llm_request(db: sqlite3.Connection, prompt: str, conv_id: str):
    messages = []
    db_result = get_message_from_db(db, conv_id)
    for row in db_result:
        messages.append({
            "role": row.role,
            "content": row.content
        })
    messages.append({
        "prompt": prompt
    })
    return messages

def stream_llm(db: sqlite3.Connection, prompt: str, conv_id: str):
    messages = create_llm_request(db, prompt, conv_id)
    return messages