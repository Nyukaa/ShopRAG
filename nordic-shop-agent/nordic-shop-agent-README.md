# 🛒 Nordic Shop Agent — AI Shopping Assistant

An AI-powered shopping assistant for Nordic Shop, built on top of the existing e-commerce application.

The project started with individual product tools tested through evaluation datasets and evolved into an MCP-based agent architecture. The current version connects Claude to an MCP server, exposes product-related tools, maintains chat sessions, and provides a Next.js chat interface for testing the complete assistant experience.

---

## 🛠 Tech Stack

<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Anthropic-Claude-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/MCP-Model_Context_Protocol-7B61FF?style=for-the-badge" />
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white" />
</p>

- **LLM**: Claude Haiku 4.5 for the shopping assistant
- **Evaluation**: Claude Sonnet 5 as the grader model
- **Agent runtime**: Python
- **API**: FastAPI
- **Tool protocol**: Model Context Protocol (MCP)
- **Frontend**: Next.js App Router, React, TypeScript
- **Product data**: Nordic Shop PostgreSQL / Supabase backend
- **Testing & evaluation**: custom evaluation dataset, multiple trial runs, score averaging

---

## ✨ Key Features

- 🤖 **Claude-powered shopping assistant** — natural-language product discovery and shopping conversations
- 🔧 **Tool-based agent** — Claude can use product tools instead of relying only on its own knowledge
- 🔌 **MCP server** — product tools are exposed through Model Context Protocol
- 🧪 **Tool evaluation** — individual tools were tested before integrating them into the agent
- 📊 **Agent evaluation** — evaluates complete assistant responses, including tool usage and final answers
- 🧠 **System prompt testing** — evaluates how the assistant follows the store identity, shopping rules, and tool-use instructions
- 💬 **Session-based conversations** — chat history is maintained on the backend using a `session_id`
- 🌐 **FastAPI chat API** — simple `/chat` endpoint connects the frontend to the Claude agent
- 🖥️ **Next.js chat UI** — visual interface for testing the complete assistant flow
- ❤️ **Health endpoint** — `/health` provides a simple service status check

---

## 🏗️ Agent Architecture

The assistant evolved in several stages:

```text
Individual Product Tools
        │
        ▼
Tool Evaluation
        │
        ▼
Claude Agent
        │
        ▼
MCP Server
        │
        ▼
MCP Client / Agent
        │
        ▼
FastAPI
        │
        ▼
Next.js Chat UI
```

The current architecture tests the complete path from a user's message to the final shopping response:

```text
User
 │
 ▼
Next.js Chat Page
 │
 │ POST /api/chat
 ▼
FastAPI /chat
 │
 │ session_id + message
 ▼
Claude Client / Agent
 │
 │ system prompt
 │ tool calls
 ▼
MCP Client
 │
 ▼
MCP Server
 │
 ▼
Product Tools
 │
 ▼
Product Data
 │
 └──────────────► tool result
                     │
                     ▼
                  Claude
                     │
                     ▼
               final response
                     │
                     ▼
                Chat UI
```

---

## 🧠 System Prompt

The assistant is configured as a shopping assistant for **Nordic Shop**, a Nordic home decor store focused on timeless objects, calm interiors, warmth, balance, and simplicity.

The system prompt defines:

- store identity and brand voice
- how the assistant should communicate with customers
- when product tools should be used
- how product availability and categories should be handled
- how recommendations should be presented
- how the assistant should behave when no suitable product is found
- rules for avoiding unsupported product claims

The current development stage focuses on testing not only whether the tools work, but whether Claude uses them correctly and produces an appropriate final answer.

---

## 🔧 MCP Tools

The MCP server exposes four product-related tools:

- 🔍 **`search_products`** — search products by query
- 📦 **`get_product`** — retrieve a product by ID
- 💡 **`recommend_products`** — generate product recommendations
- 📊 **`check_availability`** — check product availability

The agent can decide which tool to use based on the user's request.

---

## 🧪 Evaluation

The project first evaluated individual tools and later the complete agent, including tool selection, system-prompt adherence, and final responses.

The evaluation score improved from **[initial average]** to **9.4/10** after refining the system prompt and agent behaviour.

> **Why evaluate the agent?** A tool can work correctly while the agent still chooses or uses it incorrectly.

---

## 🤖 Models

### Main assistant

```python
model = "claude-haiku-4-5-20251001"
```

Claude Haiku 4.5 is used for the main shopping assistant because it handles the interactive chat flow and tool usage.

### Evaluation grader

```python
grader_model = "claude-sonnet-5"
```

A separate Claude model is used to evaluate the assistant's responses.

Keeping the assistant model and grader model separate makes the evaluation process independent from the model generating the original answer.

---

## 🌐 FastAPI

The agent is exposed through a small FastAPI service.

### `POST /chat`

Request:

```json
{
  "session_id": "session-123",
  "message": "I am looking for a warm lamp for my bedroom"
}
```

Response:

```json
{
  "reply": "..."
}
```

The endpoint passes the session ID and user message to the Claude client and returns the assistant's final response.

## 💬 Chat UI

A Next.js chat page was added as a visual interface for users to interact with and test the shopping assistant.

The frontend sends messages to:

```text
/api/chat
```

and displays the assistant's response.

---

## 🗂 Project Structure

```text
nordic-shop-agent/
│
├── src/
│   └── nordic_shop_agent/
│       └── ...
│
├── claude_client.py       ← Claude client and system prompt
├── mcp_agent.py           ← Agent logic using MCP tools
├── mcp_client.py          ← MCP client
├── mcp_server.py          ← MCP server exposing product tools
├── tools.py               ← Product-related tools
├── main.py                ← FastAPI application
│
├── dataset.json           ← Evaluation dataset
├── generate_eval_dataset.py
├── run_eval.py            ← Run evaluation trials
├── eval_grading.py        ← Grade assistant responses
├── eval_results.json      ← Evaluation results
├── test_tools.py          ← Tool-level tests
├── config.py              ← Configuration
├── pyproject.toml         ← Python project configuration
└── README.md
```

The Next.js chat UI lives in the main ShopRAG application:

```text
app/
└── chat/
    └── page.tsx           ← Chat interface

app/api/
└── chat/
    └── route.ts           ← Frontend proxy to the agent API
```

---

## 🔄 Development Evolution

The project was developed incrementally rather than starting with a complete agent architecture.

### 1. Build product tools

Individual tools were implemented for product-related operations.

### 2. Test tools with evaluation

Tools were tested independently to verify their behaviour and expected results.

### 3. Build the Claude agent

Claude was connected to the tools and a system prompt was introduced to define the shopping assistant's behaviour.

### 4. Add MCP

The tools were moved behind an MCP server and connected through an MCP client.

### 5. Evaluate the complete agent

The evaluation moved from isolated tool behaviour to complete assistant responses:

```text
user request
    ↓
system prompt
    ↓
tool selection
    ↓
tool execution
    ↓
tool result
    ↓
final Claude response
```

### 6. Add a visual chat interface

A Next.js chat page was added to test the system interactively and observe how the assistant behaves in a real conversation.

---

## 🔐 Session Handling

The FastAPI endpoint receives a `session_id` with every message:

```python
class ChatRequest(BaseModel):
    session_id: str
    message: str
```

The backend uses the session ID to associate messages with the corresponding conversation history.

### Current limitation

The session ID is currently generated again when the Next.js chat page is reloaded.

This means:

```text
Open chat
   │
   ▼
session A
   │
   ├── message 1
   ├── message 2
   └── message 3
        │
        ▼
Reload page
        │
        ▼
session B
```

The previous conversation is therefore not restored after a page reload.

For persistent conversations, the session ID can later be stored in `localStorage` instead of being generated on every page load. A future backend implementation could also persist conversation history in a database.

---

## 📊 What This Project Demonstrates

- **LLM application development** — integrating Claude into a production-style application
- **Tool use** — connecting an LLM to external product functionality
- **MCP** — exposing and consuming tools through Model Context Protocol
- **Prompt engineering** — defining store identity, behaviour, and tool-use rules
- **LLM evaluation** — testing complete assistant responses with a separate grader model
- **Evaluation methodology** — repeated trials and score averaging
- **FastAPI** — serving an asynchronous AI backend through REST endpoints
- **Next.js integration** — connecting a web UI to an AI backend
- **Session management** — maintaining conversational context across requests
- **Incremental architecture** — evolving from isolated tools to a complete agent system

---

## 🔭 Future Enhancements

- Persist chat sessions across page reloads
- Store conversation history in a database
- Add richer evaluation metrics and failure analysis
- Track tool calls separately from final-answer quality
- Add streaming responses to the chat UI
- Improve observability and structured logging
- Add more product and shopping tools
- Expand the evaluation dataset with edge cases and multi-turn conversations

uv run uvicorn main:app --reload
NODE_OPTIONS="--max-old-space-size=8192" npm run dev
