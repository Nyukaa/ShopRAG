from fastapi import FastAPI
from pydantic import BaseModel
#from claude_client import handle_chat
from tools import search_products
app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    #reply = await handle_chat(req.message)
    # Прямой тест: вместо Claude сразу передаем сообщение пользователя в ваш RAG-поиск
    print(f"[FastAPI] Testing direct search for query: {req.message}")
    reply = await search_products(req.message)
    return {"reply": reply}
   