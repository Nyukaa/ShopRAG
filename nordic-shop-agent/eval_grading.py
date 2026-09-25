import json

from anthropic import Anthropic
from config import ANTHROPIC_API_KEY

client = Anthropic(api_key=ANTHROPIC_API_KEY)
grader_model = "claude-sonnet-5"  # a stronger model judges the model under test


def grade_tool_call(test_case: dict, last_turn_tool_calls: list) -> float:
    """Deterministic — no LLM involved. Checks whether a tool was (or wasn't)
    called on the last turn as expected, and whether it was the right one."""
    expected = test_case["expect_tool_call_on_last_turn"]
    actually_called = len(last_turn_tool_calls) > 0

    if expected != actually_called:
        return 0

    if not expected:
        return 10  # correctly made no tool call

    expected_name = test_case.get("expected_tool_name")
    if expected_name is None:
        return 10  # a tool was expected, one was called, no specific name required

    called_names = [c["name"] for c in last_turn_tool_calls]
    return 10 if expected_name in called_names else 0


def _get_text(response) -> str:
    """Extracts the text block from a response, ignoring any ThinkingBlock
    that may come first — claude-sonnet-5 has adaptive thinking on by default
    and can return thinking content before the actual text, so content[0]
    isn't safely the answer."""
    for block in response.content:
        if block.type == "text":
            return block.text
    return ""


def _parse_json_loose(text: str):
    """Strips a ```json ... ``` fence if the model added one anyway, then parses.
    Claude Sonnet 4.6+ don't support assistant message prefill, so we can't force
    the fence open the way earlier course examples do — instead we just ask for
    plain JSON and clean up defensively before parsing."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def _extract_mentioned_products(reply: str) -> list[str]:
    """Uses Claude to pull out product names mentioned in the reply, as clean JSON.
    No assistant prefill (unsupported on Sonnet 4.6+) — instruction-only instead."""
    prompt = f"""
Extract every specific product name mentioned in this text. Return only real product names,
not generic category words like "lamps" or "candles".

Text:
{reply}

Respond with ONLY a JSON array of strings, no markdown fences, no explanation.
Example: ["Bjorn Table Lamp", "Sven Desk Lamp"]
"""
    messages = [{"role": "user", "content": prompt}]
    response = client.messages.create(
        model=grader_model,
        max_tokens=300,
        messages=messages,
    )
    try:
        return _parse_json_loose(_get_text(response))
    except json.JSONDecodeError:
        return []


def grade_groundedness(reply: str, all_products_seen: set) -> float:
    """Checks that every product mentioned in the reply actually came from
    a real tool result at some point in the conversation, not invented."""
    mentioned = _extract_mentioned_products(reply)
    if not mentioned:
        return 10  # nothing specific claimed, nothing to hallucinate

    seen_lower = {p.lower() for p in all_products_seen}
    hallucinated = [m for m in mentioned if m.lower() not in seen_lower]

    if not hallucinated:
        return 10

    # Partial credit proportional to how much of what was claimed is grounded
    grounded_count = len(mentioned) - len(hallucinated)
    return round(10 * grounded_count / len(mentioned), 1)


def grade_by_model(test_case: dict, conversation: list, reply: str) -> dict:
    """Model-based judgment against the scenario's solution_criteria."""
    eval_prompt = f"""
You are an expert reviewer for an AI shopping assistant chatbot.

Conversation:
{json.dumps(conversation, indent=2)}

Assistant's final reply:
{reply}

Criteria the reply should meet:
{test_case["solution_criteria"]}

Return ONLY valid JSON:
{{
  "strengths": ["short", "short"],
  "weaknesses": ["short", "short"],
  "reasoning": "one short sentence",
  "score": 1
}}

Rules:
- score: number from 1 to 10
- maximum 2 strengths, maximum 2 weaknesses
- Respond with ONLY the JSON object, no markdown fences, no explanation outside the JSON
"""
    messages = [{"role": "user", "content": eval_prompt}]
    response = client.messages.create(
        model=grader_model,
        max_tokens=400,
        messages=messages,
    )
    return _parse_json_loose(_get_text(response))