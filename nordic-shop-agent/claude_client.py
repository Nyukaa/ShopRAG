import json

from anthropic import AsyncAnthropic

from config import ANTHROPIC_API_KEY
from prompts import SYSTEM_PROMPT
from router import classify_scope, history_to_text, OUT_OF_SCOPE_REPLY
from tools import (
    TOOLS_SCHEMA,
    search_products,
    get_product,
    recommend_products,
    check_availability,
)

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
model = "claude-haiku-4-5-20251001"

TOOL_FUNCTIONS = {
    "search_products": search_products,
    "get_product": get_product,
    "recommend_products": recommend_products,
    "check_availability": check_availability,
}

# In-memory conversation store, keyed by session_id.
# Same idea as the "messages" list from the course notebooks, just one
# list per session instead of one global variable. Note: this is process
# memory only — it resets on server restart and won't work across multiple
# uvicorn workers. Fine for the course exercise; swap for Redis/DB later.
SESSIONS: dict[str, list] = {}


def get_history(session_id: str) -> list:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = []
    return SESSIONS[session_id]


def add_user_message(history: list, content) -> None:
    history.append({"role": "user", "content": content})


def add_assistant_message(history: list, response) -> None:
    """Converts the API response's content blocks into plain dicts before
    storing, since raw SDK block objects can't be re-sent as-is on the
    next request."""
    blocks = []
    for block in response.content:
        if block.type == "text":
            blocks.append({"type": "text", "text": block.text})
        elif block.type == "tool_use":
            blocks.append(
                {
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                }
            )
    history.append({"role": "assistant", "content": blocks})


async def execute_tool(name: str, tool_input: dict):
    fn = TOOL_FUNCTIONS.get(name)
    if fn is None:
        return {"error": f"Unknown tool: {name}"}
    return await fn(**tool_input)


async def handle_chat(session_id: str, user_message: str) -> str:
    history = get_history(session_id)

    # Routing workflow: a cheap classification call decides whether this message
    # deserves the full tool-calling loop at all, before any tool schema is sent
    # or any tool gets a chance to run. Classified against the existing history
    # so a legitimate follow-up ("how many of those?") isn't misread as off-topic
    # just because it has no product name in it.
    scope = await classify_scope(user_message, history_to_text(history))

    add_user_message(history, user_message)

    if scope == "out_of_scope":
        history.append({"role": "assistant", "content": [{"type": "text", "text": OUT_OF_SCOPE_REPLY}]})
        return OUT_OF_SCOPE_REPLY

    while True:
        response = await client.messages.create(
            model=model,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            tools=TOOLS_SCHEMA,
            messages=history,
        )

        add_assistant_message(history, response)

        if response.stop_reason != "tool_use":
            text_blocks = [
                block.text for block in response.content if block.type == "text"
            ]
            return "\n".join(text_blocks)

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            result = await execute_tool(block.name, block.input)

            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                }
            )

        add_user_message(history, tool_results)
