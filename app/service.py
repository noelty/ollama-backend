import sqlite3
from app.database import get_message_from_db, insert_message
import datetime


def create_llm_request(db: sqlite3.Connection, prompt: str, conv_id: int):
    messages = []
    db_result = get_message_from_db(db, conv_id)
    print("db result",db_result)
    for row in db_result:
        print(row)
        messages.append({
            "role": row["role"],
            "content": row["content"]
        })
    messages.append({
        "prompt": prompt
    })
    insert_message(db, "user", prompt, datetime.datetime.now(), conv_id)
    return messages

def stream_llm(db: sqlite3.Connection, prompt: str, conv_id: int):
    messages = create_llm_request(db, prompt, conv_id)
    return messages