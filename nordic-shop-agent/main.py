from fastapi import FastAPI
from pydantic import BaseModel

from claude_client import handle_chat

app = FastAPI()


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    reply = await handle_chat(req.session_id, req.message)
    return ChatResponse(reply=reply)


@app.get("/health")
async def health():
    return {"status": "ok"}