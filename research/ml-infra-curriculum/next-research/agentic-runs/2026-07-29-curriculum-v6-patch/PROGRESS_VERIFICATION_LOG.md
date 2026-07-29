# Progress and Verification Tracking Log: Curriculum V6 Patch Run

This artifact tracks every defect, missing item, and technical counterexample identified in [`CURRICULUM-EVALUATION-V5.md`](../../CURRICULUM-EVALUATION-V5.md) through authoring, testing, cross-review, and final gatekeeper verification.

| Defect ID | Category | Defect Description (from V5 Evaluation) | Assigned Task | Target Repair / Code Change | Test Verification Method | Final Audit Status |
|---|---|---|---|---|---|---|
| **D-01** | Registry | Missing Canonical Problem Bank Registry Table in Master Curriculum | T-06 | Author 31-module table & canonical problem bank table in V6 | Registry Table Verification | Pending |
| **D-02** | Registry | Missing Published Derived Unique Problem Count | T-06 | Calculate and publish exact counts in V6 overview | Count Derivation Audit | Pending |
| **D-03** | DAG | Conflicts between Mermaid DAG edges and module `Prerequisites:` text | T-06 | Write `generate_dag_and_prereqs.py` to generate 100% aligned DAG & text | Structural Edge Audit | Pending |
| **D-04** | Contracts | 8 modules (06, 07, 08, 09, 10, 12, 26, 29a) have no executable Python block | T-01 to T-05 | Author complete contracts with parseable Python blocks for all 8 modules | Python Extract & Execution | Pending |
| **D-05** | Contracts | Required custom exercises share contract IDs or lack contracts | T-01 to T-05 | Assign unique contract IDs (`CONTRACT-TOPIC-XX-YY`) to ALL custom exercises | Contract ID Registry Audit | Pending |
| **D-06** | Testing | Test script tests copied code rather than code extracted from master document | T-07 | Write `test_extracted_v6.py` to extract Python blocks directly from V6 md | Dynamic Code Extraction Test | Pending |
| **D-07** | Orca | Orca scheduler can exceed token limit and deadlock on `prompt_tokens > limit` | T-05 | Fix Orca token admission check & decode step token expansion logic | `test_extracted_v6.py` Orca Test | Pending |
| **D-08** | BPE | Sennrich BPE prose example produces different merges `[('w','e'), ('l','o')]` | T-04 | Update prose example in Topic 19 to match exact Python execution | `test_extracted_v6.py` BPE Test | Pending |
| **D-09** | Vector/KD | Exact-vector and K-D-tree tie rules fail counterexamples | T-03 | Update exact top-k and K-D tree distance tolerance tie-breakers | `test_extracted_v6.py` KNN Test | Pending |
| **D-10** | XGBoost | XGBoost contract receives no feature values and omits `gamma` term | T-04 | Update contract to pass `feature_values` array & `-gamma` split gain formula | `test_extracted_v6.py` XGBoost Test | Pending |
| **D-11** | Collectives | Ring described as "definitive NCCL algorithm" | T-05 | Rename exercise to **Ring-AllReduce Trace** and frame algorithm choice as comparison | Text Audit | Pending |
| **D-12** | MoE | Required MoE router has no contract in Topic 29b | T-05 | Author `CONTRACT-TOPIC-29B-MOE-ROUTER` with capacity-constrained routing & Python code | `test_extracted_v6.py` MoE Test | Pending |
| **D-13** | Process | Run folder contains no Round-02 Cross-Review Report or independent Re-Review | T-08 | Dispatch independent subagents for Round-02 review, disposition, and gate audit | Independent Audit Verification | Pending |
