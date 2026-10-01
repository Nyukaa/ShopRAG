from anthropic import Anthropic, AsyncAnthropic
from config import ANTHROPIC_API_KEY

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
sync_client = Anthropic(api_key=ANTHROPIC_API_KEY)  # for sync eval scripts (instrumented_agent.py)

# Single source of truth for the canned reply, so production and every eval
# harness say exactly the same thing when the router flags a message out of scope.
OUT_OF_SCOPE_REPLY = (
    "I'm here to help with Nordic Shop's home decor collection — lighting, candles, "
    "wall art, mirrors, and vases. Is there anything from our shop I can help you find?"
)

# Deliberately the cheapest model and a tiny max_tokens — this call's only job
# is a one-word classification, so it should cost a fraction of a full
# tool-calling turn. This is the point of a routing workflow: cheap, fast,
# deterministic triage before the expensive/flexible part of the pipeline runs.
router_model = "claude-haiku-4-5-20251001"

ROUTING_PROMPT = """You are a strict binary classifier for Nordic Shop's chat assistant.

Nordic Shop sells home decor: lamps, candles, vases, mirrors, wall art, and prints.

Classify the user's message as exactly one of:
- in_scope: anything about the shop's products, prices, stock/availability, recommendations,
  or a reasonable follow-up about something already discussed in this conversation
- out_of_scope: anything unrelated to the shop (weather, recipes, tech support, sports, general
  chit-chat, or asking the assistant to do something it has no connection to)

Conversation so far:
{history}

Latest message to classify: "{message}"

Respond with ONLY one word: in_scope or out_of_scope"""


async def classify_scope(message: str, history_text: str = "(none yet)") -> str:
    response = await client.messages.create(
        model=router_model,
        max_tokens=10,
        messages=[
            {
                "role": "user",
                "content": ROUTING_PROMPT.format(history=history_text, message=message),
            }
        ],
    )
    text = next((b.text for b in response.content if b.type == "text"), "")
    text = text.strip().lower()
    # Defensive default: if the classifier answers unexpectedly, fail open to
    # in_scope rather than silently refusing a legitimate shopping question.
    return "out_of_scope" if "out_of_scope" in text else "in_scope"


def classify_scope_sync(message: str, history_text: str = "(none yet)") -> str:
    """Same classifier, sync client — used by the sync eval harness
    (instrumented_agent.py) so it doesn't need to become async just for this."""
    response = sync_client.messages.create(
        model=router_model,
        max_tokens=10,
        messages=[
            {
                "role": "user",
                "content": ROUTING_PROMPT.format(history=history_text, message=message),
            }
        ],
    )
    text = next((b.text for b in response.content if b.type == "text"), "")
    text = text.strip().lower()
    return "out_of_scope" if "out_of_scope" in text else "in_scope"


def history_to_text(history: list) -> str:
    """Turns the existing message history into a short plain-text transcript
    for the router prompt. Only user/assistant text is kept — tool_use and
    tool_result blocks are skipped since the router only needs to know what
    was discussed, not how it was fetched."""
    lines = []
    for msg in history:
        content = msg["content"]
        if isinstance(content, str):
            lines.append(f"{msg['role']}: {content}")
        elif isinstance(content, list):
            for block in content:
                if block.get("type") == "text":
                    lines.append(f"{msg['role']}: {block['text']}")
    return "\n".join(lines) if lines else "(none yet)"
