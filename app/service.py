import sqlite3
from app.database import get_message_from_db, insert_message, empty_conv
import datetime


import json
from ollama import chat

def stream_llm(db: sqlite3.Connection, prompt: str, conv_id: bytes):
    messages = []
    if empty_conv(db, conv_id) is not None: 
        db_result = get_message_from_db(db, conv_id)
        print("db result",db_result)
        for row in db_result:
            print(row)
            messages.append({
                "role": row["role"],
                "content": row["content"]
            })
        messages.append({
            "role": "user",
            "content": prompt
        })
    else:
        messages.append({
            "role": "user",
            "content": prompt
        })
    insert_message(db, "user", prompt, datetime.datetime.now(), conv_id)
    
    stream = chat(
        model='gemma3',
        messages=messages,
        stream=True,
    )
    for chunk in stream:
            content = chunk.get("message", {}).get("content", "")
            if content:
                # Structure the response chunk as JSON wrapped in SSE format
                yield f"event: token\ndata: {json.dumps({'text': content})}\n\n"
    yield "event: done\ndata: {}\n\n"
        