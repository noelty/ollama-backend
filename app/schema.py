from pydantic import BaseModel, Field
from datetime import datetime, timezone
from ulid import ULID
class ChatData(BaseModel):
    id: str = Field(default_factory=lambda: str(ULID()))
    title: str = "simple title"
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updatedAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

samplechat = ChatData()
class ClientRequest(BaseModel):
    conversation_id: str = samplechat.id
    prompt: str = "hello world"
    chat: ChatData

class ClientResponse(BaseModel):
    status: str
    content: str