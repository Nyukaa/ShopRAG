import json

from anthropic import Anthropic
from config import ANTHROPIC_API_KEY

client = Anthropic(api_key=ANTHROPIC_API_KEY)
model = "claude-haiku-4-5-20251001"

DATASET_PROMPT = """
Generate an evaluation dataset for testing an AI shopping assistant chatbot for "Nordic Shop",
a Nordic home decor e-commerce store (lamps, candles, vases, mirrors, wall art).

The assistant has these tools available:
- search_products(query): searches the product catalog
- get_product(product_id): gets full details for one product
- recommend_products(product_id): gets products similar to a given product
- check_availability(product_id): checks stock quantity for a product

Generate an array of JSON objects, each representing a test scenario. Each object must have:
- "id": a short snake_case identifier
- "conversation": an array of 1-3 user messages representing a multi-turn conversation
  (only the LAST message is being evaluated; earlier messages just build context)
- "expect_tool_call_on_last_turn": true or false — whether the assistant SHOULD call a tool
  in response to the last message
- "expected_tool_name": the tool name expected on the last turn (omit if
  expect_tool_call_on_last_turn is false)
- "solution_criteria": a short description of what a correct response must do

Cover this mix of scenario types (roughly equal numbers of each):
1. Simple product search ("do you have X")
2. Follow-up question referring back to a previous product WITHOUT naming it again
   (should reuse context, no new tool call needed)
3. A NEW, unrelated search request occurring later in the same conversation
   (must trigger a fresh tool call, must not reuse the earlier answer)
4. A search for a product that doesn't exist (must not hallucinate a matching product)
5. A stock/availability question (must call check_availability and report the real number)
6. An off-topic question unrelated to the shop (must NOT call any tool, must politely decline)

Respond with ONLY the JSON array, no other text.

Example shape:
```json
[
  {
    "id": "simple_search_lamps",
    "conversation": ["Do you have any lamps?"],
    "expect_tool_call_on_last_turn": true,
    "expected_tool_name": "search_products",
    "solution_criteria": "Must call search_products and only mention lamps actually returned"
  }
]
```

Please generate 24 objects, 4 per scenario type listed above.
"""


def generate_dataset(output_file="dataset.json"):
    messages = [{"role": "user", "content": DATASET_PROMPT}]
    response = client.messages.create(
        model=model,
        max_tokens=4000,
        messages=messages,
    )
    text = next(block.text for block in response.content if block.type == "text")

    # Strip a leading/trailing ```json fence if Claude added one anyway
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    dataset = json.loads(text.strip())

    with open(output_file, "w") as f:
        json.dump(dataset, f, indent=2)

    print(f"Generated {len(dataset)} test cases -> {output_file}")
    return dataset


if __name__ == "__main__":
    generate_dataset()