from app.schema import ClientRequest
from app.service import stream_llm
from app.database import get_db, get_convs, get_conv_messages, delete_conv


from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends, status, HTTPException
import sqlite3
from datetime import datetime, timezone

router = APIRouter()

@router.get("/")
async def root():
    return "helloworld"

@router.post("/api/chats", status_code=status.HTTP_201_CREATED)
async def post_client_req(client_req: ClientRequest, db:sqlite3.Connection = Depends(get_db)):
    return StreamingResponse(stream_llm(db, client_req.chat, client_req.prompt, client_req.conversation_id), media_type="text/event-stream")

@router.get("/api/chats", status_code=status.HTTP_200_OK)
async def get_chats(db: sqlite3.Connection = Depends(get_db)):
    convs = get_convs(db)
    return convs

@router.get("/api/chats/{id}/messages", status_code=status.HTTP_200_OK)
async def get_chat_messages(id: str,db:sqlite3.Connection = Depends(get_db)):
    conv_messages = get_conv_messages(db, id)
    return conv_messages

@router.delete("/api/chats/{id}")
async def delete_chat(id: str, db:sqlite3.Connection = Depends(get_db)):

    if delete_conv(db, id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
        )