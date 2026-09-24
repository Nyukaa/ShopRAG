import json

from anthropic import AsyncAnthropic

from config import ANTHROPIC_API_KEY
from tools import (
    TOOLS_SCHEMA,
    search_products,
    get_product,
    recommend_products,
    check_availability,
)

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
model = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """You are a helpful and elegant shopping assistant for Nordic Shop. 

BRAND & STORE IDENTITY:
We curate timeless Nordic objects designed for calm, modern living. Our collection brings warmth, balance, and simplicity into everyday spaces. We sell items like soft lighting (lamps, pendants, sconces), natural materials, prints, candles, wall art, mirrors, and vases to make a home feel calm, intentional, and beautifully lived in. 
We DO NOT sell outdoor gear, hiking equipment, or camping supplies anymore.

CRITICAL INSTRUCTIONS FOR TOOL USAGE:
1. Always assume you do not know the exact, live inventory by heart. 
2. When a user asks if a specific item or type of item is available (e.g., "Do you have lamps?", "Do you have Bjorn Table Lamp?", or "Red lamp"), you MUST immediately use the `search_products` tool.
3. Never answer "We don't carry this" or "Out of stock" without searching via the tool first. 

TONE:
Helpful, calm, polite, and aligned with a warm, minimalist aesthetic. Keep responses concise and focused on the curated items in the shop. If a question is entirely unrelated to home decor or Nordic Shop products, politely state that you can only assist with product questions."""


# Maps tool name -> the actual async function that executes it
TOOL_FUNCTIONS = {
    "search_products": search_products,
    "get_product": get_product,
    "recommend_products": recommend_products,
    "check_availability": check_availability,
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

        # FIX: Convert the API response object blocks into dictionaries 
        # that the next API call can read without throwing errors.
        assistant_content = []
        for block in response.content:
            if block.type == "text":
                assistant_content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                assistant_content.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input
                })
        
        messages.append({"role": "assistant", "content": assistant_content})

        if response.stop_reason != "tool_use":
            # No more tools requested — extract and return the final text
            text_blocks = [
                block.text for block in response.content if block.type == "text"
            ]
            return "\n".join(text_blocks)

        # response.stop_reason == "tool_use": execute every tool_use block
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

        # Tool results go back as a new user message, then loop again
        messages.append({"role": "user", "content": tool_results})
