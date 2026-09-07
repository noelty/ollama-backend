from app.schema import ClientRequest
from app.service import create_llm_request
from app.database import get_db, create_conv, check_if_empty_conv

from fastapi import APIRouter, Depends
import sqlite3
from datetime import datetime, timezone

router = APIRouter()

@router.get("/")
async def root():
    return "helloworld"

@router.post("/api/chat")
async def receive_client_req(client_req: ClientRequest, db:sqlite3.Connection = Depends(get_db)):
    if check_if_empty_conv(db, client_req.conversation_id) is None:
        create_conv(db, "New Chat", datetime.now(timezone.utc))
        create_llm_request(db, client_req.prompt, client_req.conversation_id)
    else:
        result = create_llm_request(db, client_req.prompt, client_req.conversation_id)
            
        print(client_req)
        print("-----------------------------------")
        print(result)
    return {"okey": "send"}