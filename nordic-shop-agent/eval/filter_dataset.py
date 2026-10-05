import json
from pathlib import Path

EVAL_DIR = Path(__file__).parent
DATA_DIR = EVAL_DIR / "data"

# List of 9 test cases that you need to select
selected_ids = {
    "nonexistent_product_request_4",
    "context_reuse_color_question",
    "context_reuse_price_question",
    "simple_search_lamps_1",
    "simple_search_candles_1",
    "simple_search_mirrors_1",
    "simple_search_wall_art_1",
    "availability_check_specific",
    "availability_check_multiple"
}

# Load your original full dataset
with open(DATA_DIR / "dataset.json", "r", encoding="utf-8") as f:
    full_dataset = json.load(f)

# If the dataset structure is a direct array of objects:
if isinstance(full_dataset, list):
    filtered_cases = [case for case in full_dataset if case.get("id") in selected_ids]
# If the dataset is wrapped in an object (e.g., {"test_cases": [...]})
elif isinstance(full_dataset, dict) and "test_cases" in full_dataset:
    filtered_cases = [case for case in full_dataset["test_cases"] if case.get("id") in selected_ids]
else:
    filtered_cases = []

# Save the selected 9 test cases to a new file
with open(DATA_DIR / "dataset_selected.json", "w", encoding="utf-8") as f:
    json.dump(filtered_cases, f, indent=2, ensure_ascii=False)

print(f"Successfully selected {len(filtered_cases)} out of 9 test cases and saved to dataset_selected.json")
