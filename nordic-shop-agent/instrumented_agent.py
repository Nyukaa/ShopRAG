import json

from anthropic import Anthropic
from config import ANTHROPIC_API_KEY
from tools import (
    TOOLS_SCHEMA,
    search_products,
    get_product,
    recommend_products,
    check_availability,
)

client = Anthropic(api_key=ANTHROPIC_API_KEY)

# Test against the model you actually plan to ship with the chatbot.
# Swap to "claude-sonnet-5" to compare behavior against a stronger model.
model_under_test = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """You are a helpful and elegant shopping assistant for Nordic Shop.

BRAND & STORE IDENTITY:
We curate timeless Nordic objects designed for calm, modern living: soft lighting, natural
materials, prints, candles, wall art, mirrors, and vases. We DO NOT sell outdoor gear.

CRITICAL INSTRUCTIONS FOR TOOL USAGE:
1. Always assume you do not know the exact, live inventory by heart.
2. When a user asks about a specific item or category, you MUST use search_products before
   answering, UNLESS you are simply following up on results already found earlier in this
   same conversation.
3. Never say "we don't carry this" or state stock numbers without checking via a tool first.

TONE: Helpful, calm, concise. Decline politely if a question is unrelated to the shop."""

TOOL_FUNCTIONS = {
    "search_products": search_products,
    "get_product": get_product,
    "recommend_products": recommend_products,
    "check_availability": check_availability,
}


def execute_tool_sync(name: str, tool_input: dict):
    """Sync wrapper since eval scripts are simpler run outside asyncio."""
    import asyncio

    fn = TOOL_FUNCTIONS.get(name)
    if fn is None:
        return {"error": f"Unknown tool: {name}"}
    return asyncio.run(fn(**tool_input))


def _extract_product_names(tool_result: dict | list):
    """Pulls out any product 'name' fields found in a tool result, however it's shaped."""
    names = []
    items = tool_result if isinstance(tool_result, list) else [tool_result]
    for item in items:
        if isinstance(item, dict) and "name" in item:
            names.append(item["name"])
    return names


def run_conversation(conversation: list[str]) -> dict:
    """
    Runs a full multi-turn conversation through the agent loop.
    Only the tool calls made in response to the LAST message are returned
    for tool-call grading, but products seen across the WHOLE conversation
    are accumulated for groundedness grading (since earlier turns provide
    legitimate context for later answers).
    """
    history = []
    all_products_seen = set()
    last_turn_tool_calls = []
    final_reply = ""

    for i, user_message in enumerate(conversation):
        is_last_turn = i == len(conversation) - 1
        history.append({"role": "user", "content": user_message})
        turn_tool_calls = []

        while True:
            response = client.messages.create(
                model=model_under_test,
                max_tokens=1000,
                system=SYSTEM_PROMPT,
                tools=TOOLS_SCHEMA,
                messages=history,
            )

            assistant_blocks = []
            for block in response.content:
                if block.type == "text":
                    assistant_blocks.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_blocks.append(
                        {
                            "type": "tool_use",
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        }
                    )
            history.append({"role": "assistant", "content": assistant_blocks})

            if response.stop_reason != "tool_use":
                final_reply = "\n".join(
                    b.text for b in response.content if b.type == "text"
                )
                break

            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue

                turn_tool_calls.append({"name": block.name, "input": block.input})
                result = execute_tool_sync(block.name, block.input)
                all_products_seen.update(_extract_product_names(result))

                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    }
                )

            history.append({"role": "user", "content": tool_results})

        if is_last_turn:
            last_turn_tool_calls = turn_tool_calls

    return {
        "reply": final_reply,
        "last_turn_tool_calls": last_turn_tool_calls,
        "all_products_seen": all_products_seen,
    }
