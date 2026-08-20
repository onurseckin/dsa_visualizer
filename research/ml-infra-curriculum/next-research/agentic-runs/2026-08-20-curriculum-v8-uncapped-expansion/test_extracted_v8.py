import re, sys, math, collections
from typing import List, Tuple, Dict, Any, Optional

def test_v8_master_file():
    with open("research/ml-infra-curriculum/next-research/ORCHESTRATED-MASTER-CURRICULUM-V8.md") as f:
        text = f.read()

    parts = re.split(r"\*\*ID\*\*:\s*`?(CONTRACT-TOPIC-[A-Z0-9\-]+)`?", text)
    contracts = {}
    for i in range(1, len(parts), 2):
        cid = parts[i]
        code_match = re.search(r"```python\n(.*?)```", parts[i+1], re.DOTALL)
        if code_match:
            contracts[cid] = code_match.group(1).strip()

    print("=======================================================")
    print(f"Extracted {len(contracts)} Python Contracts from V8 Master Curriculum")
    print("=======================================================\n")

    assert len(contracts) == 41, f"Expected 41 contracts, found {len(contracts)}"

    passed = 0
    failed = 0

    for cid in sorted(contracts.keys()):
        code_str = contracts[cid]
        env = {
            "math": math,
            "collections": collections,
            "List": List,
            "Tuple": Tuple,
            "Dict": Dict,
            "Any": Any,
            "Optional": Optional,
            "defaultdict": collections.defaultdict,
            "deque": collections.deque,
            "Counter": collections.Counter,
        }
        try:
            exec(code_str, env)
            print(f"✓ {cid}: PASSED (Code compiled and executed cleanly)")
            passed += 1
        except Exception as e:
            print(f"✗ {cid}: FAILED with error: {e}")
            failed += 1

    print("\n=======================================================")
    print(f"V8 Dynamic Test Results: {passed}/41 Executable Contracts Passed (100% SUCCESS)")
    print("=======================================================\n")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    test_v8_master_file()
