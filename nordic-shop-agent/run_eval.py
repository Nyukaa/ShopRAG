import json
from statistics import mean

from instrumented_agent import run_conversation
from eval_grading import grade_tool_call, grade_groundedness, grade_by_model


def run_test_case(test_case: dict) -> dict:
    result = run_conversation(test_case["conversation"])

    tool_score = grade_tool_call(test_case, result["last_turn_tool_calls"])
    groundedness_score = grade_groundedness(result["reply"], result["all_products_seen"])
    model_grade = grade_by_model(test_case, test_case["conversation"], result["reply"])

    # Equal weight across the three signals. Adjust if one matters more to you —
    # e.g. weight groundedness higher since hallucination is the costliest failure.
    final_score = round(
        (tool_score + groundedness_score + model_grade["score"]) / 3, 1
    )

    return {
        "id": test_case["id"],
        "reply": result["reply"],
        "tool_score": tool_score,
        "groundedness_score": groundedness_score,
        "model_score": model_grade["score"],
        "model_reasoning": model_grade["reasoning"],
        "final_score": final_score,
    }


def run_eval(dataset_file="dataset.json"):
    with open(dataset_file) as f:
        dataset = json.load(f)

    results = []
    for test_case in dataset:
        print(f"Running: {test_case['id']}...")
        result = run_test_case(test_case)
        results.append(result)
        print(
            f"  tool={result['tool_score']} "
            f"grounded={result['groundedness_score']} "
            f"model={result['model_score']} "
            f"-> final={result['final_score']}"
        )

    avg = mean(r["final_score"] for r in results)
    avg_tool = mean(r["tool_score"] for r in results)
    avg_grounded = mean(r["groundedness_score"] for r in results)
    avg_model = mean(r["model_score"] for r in results)

    print("\n=== Summary ===")
    print(f"Average tool-call score:   {avg_tool:.1f}")
    print(f"Average groundedness score: {avg_grounded:.1f}")
    print(f"Average model score:        {avg_model:.1f}")
    print(f"Average FINAL score:        {avg:.1f}")

    with open("eval_results.json", "w") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    run_eval()
