import sqlite3
from app.database import get_message_from_db, insert_message, empty_conv, save_conv, search_conv
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import json
from ollama import chat

from app.schema import ChatData

def utc_to_ist(utc_time: datetime):
    return utc_time.astimezone(ZoneInfo("Asia/Kolkata"))

def stream_llm(db: sqlite3.Connection, conv: ChatData, prompt: str, conv_id: str):
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
        
    print(search_conv(db, conv_id))
    
    if search_conv(db, conv_id) == None:
        created = utc_to_ist(datetime.fromisoformat(conv.createdAt))
        updated = utc_to_ist(datetime.fromisoformat(conv.updatedAt))
        save_conv(db, conv.id, conv.title, created, updated)
        print("saved in db----------------------")
    
    insert_message(db, "user", prompt, utc_to_ist(datetime.now(timezone.utc)), conv_id)
    
    llm_response = ""
    stream = chat(
        model='llama3.2',
        messages=messages,
        stream=True,
    )
    for chunk in stream:
            content = chunk.get("message", {}).get("content", "")
            if content:
                llm_response += content
                # Structure the response chunk as JSON wrapped in SSE format
                yield f"event: token\ndata: {json.dumps({'text': content})}\n\n"
    yield "event: done\ndata: {}\n\n"
    
    insert_message(db, "assistant", llm_response, utc_to_ist(datetime.now(timezone.utc)), conv_id)