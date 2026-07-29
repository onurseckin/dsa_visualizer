# Run Contract: Curriculum V4 Repair & Complete Protocol Execution

**Date:** 2026-07-29  
**Protocol Reference:** [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](../../AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)  
**Authoritative Input Artifacts:**
1. [`README.md`](../../README.md)
2. [`ORCHESTRATED-MASTER-CURRICULUM-V2.md`](../../ORCHESTRATED-MASTER-CURRICULUM-V2.md)
3. [`CURRICULUM-EVALUATION-V2.md`](../../CURRICULUM-EVALUATION-V2.md)
4. [`ORCHESTRATED-MASTER-CURRICULUM-V3-NORMALIZED.md`](../../ORCHESTRATED-MASTER-CURRICULUM-V3-NORMALIZED.md)
5. [`CURRICULUM-EVALUATION-V3.md`](../../CURRICULUM-EVALUATION-V3.md)

**Output Artifact Location:**
`research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v4-repair/`

---

## 1. Objective & User Outcome

Produce a 100% complete, fully verified, mathematically sound, executable, and deduplicated Master Curriculum Version 4 (`ORCHESTRATED-MASTER-CURRICULUM-V4.md`) that resolves all 17 defect items in `CURRICULUM-EVALUATION-V3.md` and passes a fresh adversarial gatekeeper audit.

---

## 2. In-Scope vs Out-Of-Scope

### In-Scope:
- **31 Complete Module Records:** Every single module (01 to 16, 17a, 17b, 18 to 28, 29a, 29b) restored with full 5-rung ladders, prerequisites, learning outcomes, decision rationales, direct literal URLs, and required/optional status.
- **Topological Prerequisite DAG:** Corrected DAG with explicit edges and domain mappings.
- **Technical & Contract Corrections:**
  - Remove LeetCode 1458 (Max Dot Product) from Topic 14 (sequence DP mismatch).
  - Fix Online Softmax (Topic 11) to maintain running max & normalizer with rescalable output accumulator.
  - Fix AdamW (Topic 13) to match PyTorch exact update order.
  - Fix HNSW (Topic 16) to implement Malkov 2016 `SEARCH-LAYER` with visited set, candidate queue `C`, and result set `W`.
  - Fix BPE (Topic 19) to specify Sennrich word-level and byte-level BPE contracts.
  - Fix Orca Scheduler (Topic 24) to iteration-level sequence admission and step execution.
  - Fix PagedAttention (Topic 25) to logical-to-physical block table lookup and gather.
  - Fix Ring-AllReduce (Topic 27) to explicit $P-1$ Scatter-Reduce + $P-1$ All-Gather step traces.
  - Fix ZeRO-3 (Topic 28) to exact parameter sharding math across GPUs.
  - Fix 1F1B (Topic 29b) to Megatron 1F1B bubble fraction math $F = \frac{P-1}{m + P - 1}$.
- **Direct Literal URLs for All 31 Modules:** Literal URLs for every online foundation and primary research paper across all 31 modules.
- **Deduplicated Canonical Registry:** ONE canonical home per problem, cross-linking downstream.
- **Complete Executable Problem Contracts:** Author contracts meeting 100% of the declared schema (ID, Title, Primary Link, Prompt, Input/Output Schema, Constraints, Tolerances, Worked Examples (2+), Canonical Python Code, Test Strategy, Visualizer State) for ALL custom ML bridge exercises.
- **Full Agentic Protocol Loop:** Round 1 Specialist Work $\to$ Evidence Ledger $\to$ Round 2 Independent Cross-Review $\to$ Disposition & Revisions $\to$ Synthesis $\to$ Fresh Gate Audit.

### Out-Of-Scope:
- Deployment, MLOps administration setup (Docker, Kubernetes, Helm, Terraform).
- Prometheus/Grafana monitoring, alerting, incident response.
- Modifying repository application catalog files (`src/curriculum/topics.ts`) before passing the final gatekeeper review.

---

## 3. Mandatory Completion Checklist for V4 (`PASS` Gate Criteria)

- [ ] **31 Module Registry:** The document contains 31 complete, bounded topic modules (01 to 16, 17a, 17b, 18 to 28, 29a, 29b).
- [ ] **Full 5-Rung Ladders Restored:** Every module progresses from transferable foundations to direct ML mechanisms.
- [ ] **No False Analogies:** LeetCode 1458 removed; zero word-level false analogies.
- [ ] **Complete Source Provenance:** Direct, literal URLs provided for every single online foundation and primary paper.
- [ ] **Deduplication:** ONE canonical counted home per problem; explicit cross-links downstream.
- [ ] **Technical Corrections Resolved:** All contract & technical errors in Section 8 of V3 evaluation closed.
- [ ] **Full Executable Contracts:** Every custom exercise has a complete contract with input/output schema, 2+ worked examples, executable Python code, test strategy, and visualizer state.
- [ ] **Protocol Compliance:** Evidence ledger, disposition ledger, cross-review artifacts, and revision logs exist.
- [ ] **Fresh Gate:** Independent gatekeeper returns `PASS`.
