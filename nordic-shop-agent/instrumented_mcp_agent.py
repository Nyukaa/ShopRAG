import sys
import json

from anthropic import Anthropic
from config import ANTHROPIC_API_KEY
from mcp_client import MCPClient
from instrumented_agent import SYSTEM_PROMPT  # same prompt, so only the tool plumbing differs
from router import classify_scope_sync, history_to_text, OUT_OF_SCOPE_REPLY

client = Anthropic(api_key=ANTHROPIC_API_KEY)
model_under_test = "claude-haiku-4-5-20251001"  # same model as the local-tools baseline


def to_anthropic_tools(mcp_tools) -> list[dict]:
    return [
        {
            "name": t.name,
            "description": t.description or "",
            "input_schema": t.input_schema,  # mcp 2.x attribute name
        }
        for t in mcp_tools
    ]


def _tool_result_text(result) -> str:
    return "\n".join(
        block.text for block in result.content if getattr(block, "type", "") == "text"
    )


def _extract_product_names_from_result(mcp_result) -> list[str]:
    """Parses each MCP content block SEPARATELY as its own JSON document.
    Bug history: an earlier version flattened all blocks into one string and
    split on "\\n" before parsing — but a single block can itself be
    pretty-printed JSON with embedded newlines, so splitting on "\\n" chopped
    valid JSON objects into invalid fragments and silently extracted nothing.
    Parsing block.text whole, one block at a time, avoids that entirely."""
    names = []
    for block in mcp_result.content:
        if getattr(block, "type", "") != "text":
            continue
        try:
            parsed = json.loads(block.text)
        except json.JSONDecodeError:
            continue
        items = parsed if isinstance(parsed, list) else [parsed]
        for item in items:
            if isinstance(item, dict) and "name" in item:
                names.append(item["name"])
    return names


async def run_conversation(conversation: list[str]) -> dict:
    """Same contract as instrumented_agent.run_conversation: runs the full
    conversation, returns the final reply, the tool calls made on the LAST
    turn, and every product name seen across the WHOLE conversation. The only
    difference is tools are listed/executed via the MCP server subprocess."""
    async with MCPClient(command=sys.executable, args=["mcp_server.py"]) as mcp:
        mcp_tools = await mcp.list_tools()
        anthropic_tools = to_anthropic_tools(mcp_tools)

        history = []
        all_products_seen = set()
        last_turn_tool_calls = []
        final_reply = ""

        for i, user_message in enumerate(conversation):
            is_last_turn = i == len(conversation) - 1
            turn_tool_calls = []

            # Same routing workflow as production and the non-MCP eval path.
            scope = classify_scope_sync(user_message, history_to_text(history))
            history.append({"role": "user", "content": user_message})

            if scope == "out_of_scope":
                history.append(
                    {"role": "assistant", "content": [{"type": "text", "text": OUT_OF_SCOPE_REPLY}]}
                )
                if is_last_turn:
                    final_reply = OUT_OF_SCOPE_REPLY
                    last_turn_tool_calls = []
                continue

            while True:
                response = client.messages.create(
                    model=model_under_test,
                    max_tokens=1000,
                    system=SYSTEM_PROMPT,
                    tools=anthropic_tools,
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
                    mcp_result = await mcp.call_tool(block.name, block.input)
                    all_products_seen.update(_extract_product_names_from_result(mcp_result))

                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": _tool_result_text(mcp_result),
                            "is_error": bool(mcp_result.is_error),
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
