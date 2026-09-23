import json

from anthropic import AsyncAnthropic

from config import ANTHROPIC_API_KEY
from tools import (
    TOOLS_SCHEMA,
    search_products,
    get_product,
    recommend_products,
)

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
model = "claude-3-5-sonnet-20241022"

SYSTEM_PROMPT = """You are a helpful shopping assistant for Nordic Shop, an outdoor gear e-commerce store.
Answer questions about products using the tools available to you.
If a question is unrelated to Nordic Shop products, politely say you can only help with product questions."""

# Maps tool name -> the actual async function that executes it
TOOL_FUNCTIONS = {
    "search_products": search_products,
    "get_product": get_product,
    "recommend_products": recommend_products,
}


async def execute_tool(name: str, tool_input: dict):
    """Looks up the right function and calls it with the args Claude provided."""
    fn = TOOL_FUNCTIONS.get(name)
    if fn is None:
        return {"error": f"Unknown tool: {name}"}
    return await fn(**tool_input)


async def handle_chat(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]

    # Loop until Claude stops asking for tools and gives a final text answer
    while True:
        response = await client.messages.create(
            model=model,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            tools=TOOLS_SCHEMA,
            messages=messages,
        )

        # Claude's turn goes into history exactly as returned (may contain
        # a mix of text blocks and tool_use blocks)
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            # No more tools requested — extract and return the final text
            text_blocks = [
                block.text for block in response.content if block.type == "text"
            ]
            return "\n".join(text_blocks)

        # response.stop_reason == "tool_use": execute every tool_use block
        # Claude asked for (there can be more than one in a single turn)
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

        # Tool results go back as a new user message, then loop again so
        # Claude can either call more tools or write the final answer
        messages.append({"role": "user", "content": tool_results})