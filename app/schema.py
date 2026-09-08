from pydantic import BaseModel


class ClientRequest(BaseModel):
    conversation_id: bytes
    prompt: str

class ClientResponse(BaseModel):
    status: str
    content: str
    