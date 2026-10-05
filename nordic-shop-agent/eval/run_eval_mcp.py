import asyncio
import json
import sys
from pathlib import Path
from statistics import mean

sys.path.insert(0, str(Path(__file__).parent.parent))

from instrumented_mcp_agent import run_conversation
from eval_grading import grade_tool_call, grade_groundedness, grade_by_model


async def run_test_case(test_case: dict) -> dict:
    result = await run_conversation(test_case["conversation"])

    tool_score = grade_tool_call(test_case, result["last_turn_tool_calls"])
    groundedness_score = grade_groundedness(result["reply"], result["all_products_seen"])
    model_grade = grade_by_model(
        test_case, test_case["conversation"], result["reply"], result["last_turn_tool_calls"]
    )
    final_score = round((tool_score + groundedness_score + model_grade["score"]) / 3, 1)

    return {
        "id": test_case["id"],
        "reply": result["reply"],
        "tool_score": tool_score,
        "groundedness_score": groundedness_score,
        "model_score": model_grade["score"],
        "final_score": final_score,
    }


async def run_eval_mcp(dataset_file="data/dataset.json"):
    with open(dataset_file) as f:
        dataset = json.load(f)

    results = []
    for test_case in dataset:
        print(f"Running (MCP): {test_case['id']}...")
        # Sequential on purpose: each test case spins up its own MCP server
        # subprocess, and running many subprocesses concurrently against the
        # same Next.js dev server would confound results with rate limits.
        result = await run_test_case(test_case)
        results.append(result)
        print(
            f"  tool={result['tool_score']} "
            f"grounded={result['groundedness_score']} "
            f"model={result['model_score']} "
            f"-> final={result['final_score']}"
        )

    print("\n=== Summary (MCP path) ===")
    print(f"Average tool-call score:   {mean(r['tool_score'] for r in results):.1f}")
    print(f"Average groundedness score: {mean(r['groundedness_score'] for r in results):.1f}")
    print(f"Average model score:        {mean(r['model_score'] for r in results):.1f}")
    print(f"Average FINAL score:        {mean(r['final_score'] for r in results):.1f}")

    with open("results/eval_results_mcp.json", "w") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    asyncio.run(run_eval_mcp())
