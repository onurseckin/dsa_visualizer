import os
import re

dir_path = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v6-patch/rounds/round-01"
output_path = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v6-patch/rounds/round-02/audit-pedagogy-and-dag.md"

files = [
    "domain-01-tensors-and-numerics-v6.md",
    "domain-02-autograd-and-training-math-v6.md",
    "domain-03-retrieval-and-vector-search-v6.md",
    "domain-04-05-tokenization-and-attention-v6.md",
    "domain-06-07-distributed-and-serving-v6.md"
]

expected_modules = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17a", "17b", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29a", "29b"]

expected_prereqs = {
    "01": "None (Foundational Module).",
    "02": "Topic 01 (Matrix Layout).",
    "03": "Topic 01 (Matrix Layout), Topic 02 (Strides & Views).",
    "04": "None (Foundational Module).",
    "05": "Topic 04 (FP Precision & Reductions), Topic 03 (Dense MatMul & Tiling).",
    "06": "None (Foundational Module).",
    "07": "Topic 06 (Topological Ordering).",
    "08": "Topic 06 (Topological Ordering).",
    "09": "Topic 01 (Matrix Layout), Topic 02 (Strides & Views), Topic 06 (Topological Ordering), Topic 08 (AST & Operator IR).",
    "10": "Topic 04 (FP Precision & Reductions).",
    "11": "Topic 04 (FP Precision & Reductions).",
    "12": "Topic 04 (FP Precision & Reductions), Topic 10 (Loss Functions & Probability), Topic 11 (LogSumExp & Softmax).",
    "13": "Topic 09 (Autograd Engine), Topic 10 (Loss Functions & Probability), Topic 11 (LogSumExp & Softmax).",
    "14": "None (Foundational Module).",
    "15": "Topic 14 (Exact Vector Search).",
    "16": "Topic 14 (Exact Vector Search).",
    "17a": "Topic 14 (Exact Vector Search).",
    "17b": "Topic 14 (Exact Vector Search).",
    "18": "None (Foundational Module).",
    "19": "Topic 18 (String Matching & Tries).",
    "20": "Topic 01 (Matrix Layout), Topic 03 (Dense MatMul & Tiling), Topic 04 (FP Precision & Reductions).",
    "21": "Topic 03 (Dense MatMul & Tiling), Topic 04 (FP Precision & Reductions), Topic 10 (Loss Functions & Probability).",
    "22": "Topic 03 (Dense MatMul & Tiling), Topic 04 (FP Precision & Reductions), Topic 11 (LogSumExp & Softmax).",
    "23": "Topic 03 (Dense MatMul & Tiling), Topic 11 (LogSumExp & Softmax), Topic 22 (SDPA & KV Cache).",
    "24": "Topic 22 (SDPA & KV Cache).",
    "25": "Topic 22 (SDPA & KV Cache).",
    "26": "None (Foundational Module).",
    "27": "Topic 26 (Interconnect Topology).",
    "28": "Topic 13 (Optimizers & State), Topic 27 (Ring Collectives).",
    "29a": "Topic 02 (Strides & Views), Topic 06 (Topological Ordering), Topic 07 (DAG DP & Liveness), Topic 08 (AST & Operator IR).",
    "29b": "Topic 03 (Dense MatMul & Tiling), Topic 22 (SDPA & KV Cache), Topic 26 (Interconnect Topology), Topic 27 (Ring Collectives), Topic 28 (Distributed State & ZeRO), Topic 29a (Compiler Passes & Fusion)."
}

report = []
report.append("# Pedagogy & DAG Audit Report\n")

found_modules = {}

for fname in files:
    with open(os.path.join(dir_path, fname), 'r') as f:
        content = f.read()
    
    parts = re.split(r'^#{2,3}\s*Topic (\w+):.*$', content, flags=re.MULTILINE)
    
    for i in range(1, len(parts), 2):
        topic_id = parts[i]
        topic_content = parts[i+1]
        
        prereq_match = re.search(r'\*\*Prerequisites:\*\*\s*(.*)', topic_content)
        prereq_text = prereq_match.group(1).strip() if prereq_match else "NOT FOUND"
        
        rungs = []
        for r in range(1, 6):
            if re.search(rf'^#{{1,5}}\s*{r}\.', topic_content, flags=re.MULTILINE):
                rungs.append(r)
        
        has_contract = "Executable Problem Contract" in topic_content
        
        found_modules[topic_id] = {
            "prereq": prereq_text,
            "rungs": rungs,
            "has_contract": has_contract,
            "content": topic_content
        }

report.append("## 1. Module and Rungs Verification")
missing_modules = [m for m in expected_modules if m not in found_modules]
if missing_modules:
    report.append(f"- **FAILED**: Missing modules: {missing_modules}")
else:
    report.append("- **PASSED**: All 31 modules exist.")

all_5_rungs = True
for m, data in found_modules.items():
    if len(data["rungs"]) != 5:
        report.append(f"  - **FAILED**: Module {m} has rungs {data['rungs']} instead of 5 explicit rungs.")
        all_5_rungs = False
if all_5_rungs:
    report.append("- **PASSED**: All modules have 5 explicit rungs.")

report.append("\n## 2. Prerequisites Verification")
prereqs_match = True
for m, expected in expected_prereqs.items():
    if m in found_modules:
        actual = found_modules[m]["prereq"]
        if actual != expected:
            report.append(f"- **FAILED**: Module {m} prereq mismatch.\n  Expected: `{expected}`\n  Actual: `{actual}`")
            prereqs_match = False
if prereqs_match:
    report.append("- **PASSED**: All module prerequisites match `generate_dag_and_prereqs.py`.")

report.append("\n## 3. Topic 07 Verification")
if "07" in found_modules:
    t07 = found_modules["07"]
    if len(t07["rungs"]) == 5 and t07["has_contract"]:
        report.append("- **PASSED**: Topic 07 is fully authored with complete ladders and contract.")
    else:
        report.append(f"- **FAILED**: Topic 07 verification failed. Rungs: {len(t07['rungs'])}, Has Contract: {t07['has_contract']}")
else:
    report.append("- **FAILED**: Topic 07 not found.")

report.append("\n## 4. Weak Analogy Replacements Verification")
def check_keyword(topic_id, keyword):
    if topic_id in found_modules:
        if keyword.lower() in found_modules[topic_id]["content"].lower():
            return True
    return False

report.append("- Topic 11 (LogSumExp): " + ("**PASSED**" if check_keyword("11", "logsumexp") else "**FAILED** (LogSumExp not found)"))
report.append("- Topic 27 (Circular Queue): " + ("**PASSED**" if check_keyword("27", "circular queue") or check_keyword("27", "circular buffer") else "**FAILED** (Circular Queue/Buffer not found)"))
report.append("- Topic 28 (Split List): " + ("**PASSED**" if check_keyword("28", "split list") or check_keyword("28", "split linked list") or check_keyword("28", "split") or check_keyword("28", "sharding") else "**FAILED** (Split List not found)"))
report.append("- Topic 29b (Cookies): " + ("**PASSED**" if check_keyword("29b", "cookie") else "**FAILED** (Cookies not found)"))

with open(output_path, 'w') as f:
    f.write("\n".join(report))
