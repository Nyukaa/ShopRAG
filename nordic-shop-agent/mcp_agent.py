import asyncio
import sys

from anthropic import AsyncAnthropic

from config import ANTHROPIC_API_KEY
from mcp_client import MCPClient

# Reuse the exact same system prompt as the eval agent, so any behavior
# difference between the two versions comes from the tool plumbing, not the prompt.
from instrumented_agent import SYSTEM_PROMPT
from router import classify_scope, history_to_text, OUT_OF_SCOPE_REPLY

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
model = "claude-haiku-4-5-20251001"


def to_anthropic_tools(mcp_tools) -> list[dict]:
    """MCP tool definitions -> the format messages.create(tools=...) expects.
    name/description/inputSchema map 1:1, so this is just a rename."""
    return [
        {
            "name": t.name,
            "description": t.description or "",
            "input_schema": t.input_schema,  # mcp 2.x attribute name
        }
        for t in mcp_tools
    ]


def tool_result_text(result) -> str:
    """Flattens an MCP CallToolResult into one string for a tool_result block.
    A tool returning a list comes back as several text blocks, so join them."""
    return "\n".join(
        block.text for block in result.content if getattr(block, "type", "") == "text"
    )


async def chat(mcp_client: MCPClient, history: list, user_message: str) -> str:
    scope = await classify_scope(user_message, history_to_text(history))
    history.append({"role": "user", "content": user_message})

    if scope == "out_of_scope":
        history.append(
            {"role": "assistant", "content": [{"type": "text", "text": OUT_OF_SCOPE_REPLY}]}
        )
        return OUT_OF_SCOPE_REPLY

    tools = to_anthropic_tools(await mcp_client.list_tools())

    while True:
        response = await client.messages.create(
            model=model,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            tools=tools,
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
            return "\n".join(b.text for b in response.content if b.type == "text")

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            print(f"  [tool call] {block.name}({block.input})")
            result = await mcp_client.call_tool(block.name, block.input)

            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": tool_result_text(result),
                    "is_error": bool(result.is_error),  # mcp 2.x attribute name
                }
            )

        history.append({"role": "user", "content": tool_results})


async def main():
    # The client launches mcp_server.py itself as a subprocess (stdio), using the
    # same Python interpreter/venv, so you don't run the server separately.
    async with MCPClient(command=sys.executable, args=["mcp_server.py"]) as mcp_client:
        tools = await mcp_client.list_tools()
        print("Connected. Tools from MCP server:", [t.name for t in tools])
        print("Type a question (or 'exit').\n")

        history: list = []
        while True:
            user_input = await asyncio.to_thread(input, "You: ")
            if user_input.strip().lower() in {"exit", "quit"}:
                break
            reply = await chat(mcp_client, history, user_input)
            print(f"Claude: {reply}\n")


if __name__ == "__main__":
    asyncio.run(main())
