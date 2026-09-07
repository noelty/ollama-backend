from pydantic import BaseModel


class ClientRequest(BaseModel):
    conversation_id: int
    prompt: str

# class ClientResponse(BaseModel):
    