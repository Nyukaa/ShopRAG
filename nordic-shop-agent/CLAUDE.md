# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Nordic Shop Agent: an AI shopping assistant backend for a Next.js e-commerce platform.

**Stack:** Python 3.11+, FastAPI, Anthropic Claude API, MCP (Model Context Protocol), `uv` for dependencies.

The agent has **no direct database access**. All product and stock data comes from the shop backend over HTTP (`NORDIC_API_URL`, default `http://localhost:3000`). Do not connect to PostgreSQL/Supabase from this repo.

## Setup

```bash
uv pip install -e .
# Put ANTHROPIC_API_KEY and NORDIC_API_URL in .env
```

## Commands

Always use `uv run python`, never bare `python`.

```bash
# Run API server (port 8000)
uv run uvicorn main:app --reload

# Try it
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123", "message": "Do you have oak lamps?"}'

# Eval, production track (default 1 trial; use --trials 3 to measure variance)
uv run python eval/run_eval.py
uv run python eval/run_eval.py --trials 3

# Eval, MCP track (starts the MCP server over stdio)
uv run python eval/run_eval_mcp.py

# Datasets
uv run python eval/generate_eval_dataset.py
uv run python eval/filter_dataset.py --size 5 --output eval/data/dataset_selected.json
```

## Architecture

Two tracks with the same agent logic:

1. **Production track** (`main.py` -> `router.py` -> `claude_client.py`)
   - A cheap router (Haiku, max_tokens=10) classifies each message as `in_scope` or `out_of_scope`.
   - `out_of_scope` -> static reply. `in_scope` -> multi-turn agent loop with tool calling.
   - Tools are called as local Python functions.
2. **MCP track** (`mcp_agent.py` -> `mcp_client.py` -> `mcp_server.py`)
   - Same tools exposed through an MCP server over stdio.
   - Goal is parity: both tracks should get the same eval scores.

Session state: message history is stored in memory, keyed by `session_id` (UUID from the Next.js frontend). A browser reload starts a new session. This is intentional for prompt iteration.

The router is single-shot: no context between messages.

## Key files

| File                             | Role                                                           |
| -------------------------------- | -------------------------------------------------------------- |
| `main.py`                        | FastAPI app, `/chat` and `/health` endpoints, schemas          |
| `router.py`                      | Scope classifier and canned out-of-scope reply                 |
| `prompts.py`                     | System prompt (single source of truth)                         |
| `claude_client.py`               | Anthropic SDK wrapper, agent loop, imports SYSTEM_PROMPT       |
| `tools.py`                       | Tool functions, `TOOLS_SCHEMA` (JSON schema), HTTP calls       |
| `config.py`                      | Loads config from `.env`                                       |
| `mcp_server.py`                  | MCP server, tool schemas (stdio transport)                     |
| `mcp_client.py`                  | MCP client transport                                           |
| `mcp_agent.py`                   | Agent loop for the MCP track                                   |
| `eval/run_eval.py`               | Eval loop, production track (add `--trials 3` to measure)      |
| `eval/run_eval_mcp.py`           | Eval loop, MCP track                                           |
| `eval/instrumented_agent.py`     | Test runner, production track                                  |
| `eval/instrumented_mcp_agent.py` | Test runner, MCP track                                         |
| `eval/eval_grading.py`           | Scoring: tool-call, groundedness, model-as-judge               |
| `eval/data/dataset.json`         | Test cases (conversation, expected tool calls)                 |
| `eval/results/eval_results.json` | Latest scores and reasoning (generated)                        |

## Tools

- `search_products(query)`: keyword search over the catalog
- `get_product(product_id)`: full product details
- `recommend_products(product_id)`: related items
- `check_availability(product_id)`: live stock count

## Agent behavior (in `prompts.py`)

- Never assume inventory from memory. Search before saying "we don't carry it".
- Follow-ups on results already found in this conversation may skip a re-search (UNLESS clause in rule 2). Stock questions never skip check_availability (rule 4 has no exception).

## Evaluation

Final score is the average of three 0-10 scores: tool-call correctness, groundedness (no claims the tools did not return), and model-as-judge quality. Current baseline: see `eval/results/eval_results.json`.

Haiku output varies between runs. After a prompt or tool change, run with `--trials 3` or more before deciding it helped.

## Common tasks

**Change the prompt:** edit `SYSTEM_PROMPT` in `prompts.py`, then run `uv run python eval/run_eval.py --trials 3` and read `eval/results/eval_results.json`.

**Add a tool:**

1. **`tools.py`:** Add the async function and add an entry to `TOOLS_SCHEMA` (the JSON schema dict list). The schema defines `name`, `description`, and `input_schema` for the Anthropic API.
2. **`claude_client.py`:** Add the function to the `TOOL_FUNCTIONS` dict (maps tool names to functions for local execution).
3. **`mcp_server.py`:** Add a wrapper function with `@mcp.tool()` decorator. FastMCP generates the schema from the function's type hints and docstring, so **tool descriptions in TOOLS_SCHEMA and in the mcp_server.py docstrings must be identical**, otherwise the two tracks will behave differently.
4. Update `SYSTEM_PROMPT` in `prompts.py` if the agent needs guidance on it.
5. Add test cases to `eval/data/dataset.json`.
6. Run both evals and check that the scores match.

## Rules

- Run scripts from the project root. Build file paths with `Path(__file__).parent`; never rely on the current working directory (`eval/` scripts must work from anywhere).
- Use `uv` only. Do not add dependencies without asking.
- Do not edit anything in `eval/results/` by hand. Do not overwrite `eval/data/dataset.json` without asking.
- Do not invent tools, product fields or API endpoints. If unsure, read the code or ask.
- Tool descriptions in TOOLS_SCHEMA and in mcp_server.py docstrings must be identical, otherwise the two tracks behave differently.
- After changing prompts or tools, run `uv run python eval/run_eval.py --trials 3` and report the score.
- Never print or commit API keys. Secrets live in `.env`.
- Make a plan first for any change that touches more than 2 files.
