from app.schema import ClientRequest
from app.service import stream_llm
from app.database import get_db


from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends
import sqlite3
from datetime import datetime, timezone

router = APIRouter()

@router.get("/")
async def root():
    return "helloworld"

@router.post("/api/chat")
async def receive_client_req(client_req: ClientRequest, db:sqlite3.Connection = Depends(get_db)):

    return StreamingResponse(stream_llm(db, client_req.prompt, client_req.conversation_id), media_type="text/event-stream")