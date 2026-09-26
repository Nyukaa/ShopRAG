import json
from statistics import mean

from instrumented_agent import run_conversation
from eval_grading import grade_tool_call, grade_groundedness, grade_by_model


def run_test_case(test_case: dict, n_trials: int = 1) -> dict:
    """Runs a test case n_trials times and averages the scores. Haiku's tool-call
    decisions aren't fully deterministic, so a single run can't distinguish a real
    behavioral regression from ordinary sampling variance — n_trials > 1 lets you
    see the spread before concluding a prompt change helped or hurt."""
    trial_results = []

    for _ in range(n_trials):
        result = run_conversation(test_case["conversation"])

        tool_score = grade_tool_call(test_case, result["last_turn_tool_calls"])
        groundedness_score = grade_groundedness(result["reply"], result["all_products_seen"])
        model_grade = grade_by_model(
            test_case, test_case["conversation"], result["reply"], result["last_turn_tool_calls"]
        )
        final_score = round((tool_score + groundedness_score + model_grade["score"]) / 3, 1)

        trial_results.append(
            {
                "reply": result["reply"],
                "tool_score": tool_score,
                "groundedness_score": groundedness_score,
                "model_score": model_grade["score"],
                "model_reasoning": model_grade["reasoning"],
                "final_score": final_score,
            }
        )

    return {
        "id": test_case["id"],
        "trials": trial_results,
        "tool_score": mean(t["tool_score"] for t in trial_results),
        "tool_score_spread": max(t["tool_score"] for t in trial_results)
        - min(t["tool_score"] for t in trial_results),
        "groundedness_score": mean(t["groundedness_score"] for t in trial_results),
        "model_score": mean(t["model_score"] for t in trial_results),
        "final_score": round(mean(t["final_score"] for t in trial_results), 1),
    }


def run_eval(dataset_file="dataset.json", n_trials: int = 1):
    with open(dataset_file) as f:
        dataset = json.load(f)

    results = []
    for test_case in dataset:
        print(f"Running: {test_case['id']} (x{n_trials})...")
        result = run_test_case(test_case, n_trials=n_trials)
        results.append(result)
        spread_flag = " ⚠ UNSTABLE" if result["tool_score_spread"] > 0 else ""
        print(
            f"  tool={result['tool_score']:.1f} "
            f"grounded={result['groundedness_score']:.1f} "
            f"model={result['model_score']:.1f} "
            f"-> final={result['final_score']}{spread_flag}"
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
    # Bump n_trials to 3-5 when you specifically need to distinguish a real
    # behavioral change from ordinary model sampling variance (e.g. right after
    # a prompt edit). Leave at 1 for quick day-to-day iteration.
    run_eval(n_trials=1)