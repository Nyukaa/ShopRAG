# Nordic Shop Agent — AI Shopping Assistant

An intelligent, AI-powered shopping assistant for the **Nordic Shop** home decor e-commerce platform. Built on an advanced agentic architecture using the **Model Context Protocol (MCP)**, this assistant dynamically analyzes user intent, executes live database tools, and delivers clean, contextual responses directly to a minimal Next.js web application.

---

## 🛠 Tech Stack

- **Backend & AI Runtime:** Python, FastAPI, Pydantic, Uvicorn, HTTPX
- **LLM Models:** `claude-haiku-4-5-20251001` (Main Assistant), `claude-sonnet-5` (Evaluation Grader / LLM-as-a-judge)
- **Tool Protocol:** Model Context Protocol (MCP) via isolated standard input/output (`stdio`) subprocesses
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Product Database:** PostgreSQL / Supabase backend

---

## ✨ Key Features

- 🤖 **Autonomous Multi-Turn Agent** — Maintains stateful, multi-turn conversations and leverages real-time internal systems rather than relying on stale parametric memory.
- 🔌 **Decoupled MCP Architecture** — Product inventory and search functions are entirely isolated inside a standard MCP server, making them universally pluggable into any MCP client (e.g., Claude Desktop, Cursor).
- 🧠 **Session-Based Management** — Chat state and contextual message sequences are bound seamlessly to isolated sessions on the backend using a unique `session_id`.
- 📊 **Automated Prompt Evaluations** — Built-in offline testing pipelines using a robust evaluation dataset and an LLM grader model to benchmark system-prompt performance (achieved an evaluation score of **9.4/10**).
- 🖥️ **Minimalist Scandinavian UI** — A clean, interactive web chat view designed to reflect the aesthetic identity of the Nordic Shop brand.

---

## 🏗️ System Architecture

```text
[ Browser: Next.js UI ]
         │ (POST /api/chat)
         ▼
[ Next.js API Gateway Proxy ]
         │ (Proxies requests to local port 8000)
         ▼
[ FastAPI /chat (Python) ] ── (In-Memory Session Context)
         │
         ▼
[ Claude Agent Loop ] <──(stdio transport stream)──> [ MCP Server ]
         │                                                    │
         ▼ (Final Synthesized Text Output)                    ▼ (Executes Node/SQL Route)
[ Frontend Client Chat Component ]                 [ Supabase / Main Store DB ]
```

---

## 🔧 Expose MCP Tools

The agent independently selects and triggers the following tools exposed by the MCP server:

- 🔍 `search_products(query)` — Searches the inventory catalog by string keywords, product type, material, color, or style.
- 📦 `get_product(product_id)` — Fetches comprehensive technical specifications, dimensions, features, and source image configurations.
- 💡 `recommend_products(product_id)` — Generates highly relevant, strictly filtered item associations based on overlapping taxonomy.
- 📊 `check_availability(product_id)` — Triggers an immediate, live stock quantity lookup directly from the transactional database.

---

## 🌐 API Endpoint Schema (FastAPI)

### `POST /chat`

Submits a user message tied to a specific session state and returns Claude's evaluated final text response.

**Request Payload:**

```json
{
  "session_id": "4a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "I'm looking for an oak wood desk lamp"
}
```

**Response Payload:**

```json
{
  "reply": "We have the Sven Desk Lamp ($65) available, featuring adjustable oak wood arms and an elegant fabric cable. There are currently 35 units in stock."
}
```

---

## 🔐 Session Handling & Lifecycle Constraints

- **Current State:** Every message payload includes a `session_id`. The backend associates this ID with an active, temporary in-memory message list array.
- **Reload Limitation:** Reloading the web browser explicitly resets the active React state and triggers a fresh `crypto.randomUUID()`. Because this new token does not match any entry in the backend storage dictionary, a blank history array is initialized. This is an intentional constraint ideal for debugging clean system prompt iterations.
- **Production Plan:** For production deployments, the `session_id` can be cached directly inside browser `localStorage`, and the text thread dictionary can be migrated from active RAM to a permanent database collection.

---

## 📊 Core Concepts Demonstrated

- **Production-Grade AI Integration** — Embedding a state-of-the-art LLM into a realistic, sandboxed corporate infrastructure.
- **Context-Bound Function Calling** — Bridging deterministic software tools and external REST payloads with non-deterministic text engines safely.
- **Data-Driven Evaluation Methodology** — Moving away from subjective manual workspace testing to systematic statistical prompt engineering with multi-trial grading.

---

## 🔭 Future Enhancements & Roadmap

- [ ] **Server-Sent Events (SSE) Streaming:** Introduce full token-by-token streaming to the Next.js frontend to minimize Time-to-Interact (TTI).
- [ ] **Persistent Database Layer:** Migrate active session lists out of volatile application RAM into persistent tables.
- [ ] **Batch Tool Operations:** Implement an optimized `availability_check_multiple` tool schema allowing Claude to track down several item inventories in a single context turn, reducing Anthropic API token overhead (TPM limits).
- [ ] **Advanced Failure Mode Dataset:** Expand the offline evaluation suite with intricate multi-turn negative test paths and edge cases.

---

## 🗂 Project Structure

```text
nordic-shop-agent/
├── claude_client.py       ← High-level Anthropic SDK wrapper and system prompt
├── mcp_agent.py           ← Multi-turn agent loop executing autonomous tool chains
├── mcp_client.py          ← Core MCP client connection transport layer
├── mcp_server.py          ← Core MCP server establishing available tool schemas
├── tools.py               ← Low-level network endpoints parsing live application data
├── main.py                ← Main asynchronous FastAPI service entry point
│
├── dataset.json           ← Standard evaluation scenarios for offline testing
├── run_eval_mcp.py        ← Batch test loop processing data criteria trials
├── eval_grading.py        ← Strict rubric rules used by the grader judge model
└── README.md
```

_The frontend UI pages live inside the primary Next.js application directory:_

- `app/chat/page.tsx` — Interactive frontend user interface layout built with Tailwind CSS.
- `app/api/chat/route.ts` — Edge router acting as a secure local bridge between browser fetch loops and port 8000.

uv run uvicorn main:app --reload
NODE_OPTIONS="--max-old-space-size=8192" npm run dev
