import json

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from claude_client import handle_chat, handle_chat_stream, get_history
from router import classify_scope, history_to_text, OUT_OF_SCOPE_REPLY

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


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    async def event_generator():
        # Run router first (only in main.py, not in handle_chat_stream)
        history_text = history_to_text(get_history(req.session_id))
        scope = await classify_scope(req.message, history_text)

        if scope == "out_of_scope":
            yield f"data: {json.dumps({'type': 'text', 'text': OUT_OF_SCOPE_REPLY})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        else:
            # Stream events from the agent loop
            async for event in handle_chat_stream(req.session_id, req.message):
                yield f"data: {event}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}