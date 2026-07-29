# Run Contract: Curriculum V5 Patch & Protocol Execution

**Date:** 2026-07-29  
**Protocol Reference:** [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](../../AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)  
**Authoritative Input Artifacts:**
1. [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](../../AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)
2. [`ORCHESTRATED-MASTER-CURRICULUM-V4.md`](../../ORCHESTRATED-MASTER-CURRICULUM-V4.md)
3. [`CURRICULUM-EVALUATION-V4.md`](../../CURRICULUM-EVALUATION-V4.md)

**Output Artifact Location:**
`research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v5-patch/`

---

## 1. Objective & User Outcome

Produce a 100% complete, verified, mathematically sound, executable, and deduplicated Master Curriculum Version 5 (`ORCHESTRATED-MASTER-CURRICULUM-V5.md`) that closes all 23 acceptance criteria items in Section 11 of `CURRICULUM-EVALUATION-V4.md` and passes a fresh independent gatekeeper audit with reproducible python test evidence.

---

## 2. In-Scope vs Out-Of-Scope

### In-Scope:
- **31 Complete Module Records:** Every module (01 to 16, 17a, 17b, 18 to 28, 29a, 29b) restored with full 5-rung ladders (adding missing 5th rungs to Topics 09, 11, 12, 13), prerequisites, decision rationales, direct literal URLs, and required/optional status.
- **Topic 07 Authored Content:** Replace `8-12. Extrapolated...` marker with fully authored topic content, ladders, and contracts.
- **Weak Analogy Replacements:**
  - Topic 11: Replace `Pow(x,n)` with Topic 04 reductions & Topic 10 probability normalization.
  - Topic 27: Replace `Circular Array Loop` with LeetCode 622 (Circular Queue) / LeetCode 641 (Circular Deque).
  - Topic 28: Replace `Partition Equal Subset Sum` with LeetCode 725 (Split Linked List in Parts).
  - Topic 29b: Make `Fair Distribution of Cookies` optional and add capacity-constrained MoE routing.
- **DAG & Edge Alignment:** Normalize prerequisite graph (add `T02->T03`, `T03->T05`, `T10->T12`, `T11->T12`, `T26->T27`, etc.) and align module metadata.
- **Canonical Problem Registry:** Create a 31-module registry table & canonical problem bank table detailing canonical IDs, exact titles, problem types, direct URLs, canonical module homes, cross-links, rungs, required/optional status, difficulty rationales, transfer operations, and contract IDs. Derive the unique problem count.
- **Executable Contract Technical Repairs & Python Testing:**
  - FlashAttention: Fix normalization recurrence formula to match Dao et al. 2022 and verify tile loop execution against exact full attention.
  - Orca: Fix token admission and active sequence decode expansion logic; add selective batching prefill/decode semantics.
  - ZeRO-3: Rename as **Simplified Contiguous Parameter Sharding** or implement DeepSpeed's per-parameter partition accounting.
  - 1F1B: Match total schedule bubble fraction $F = (P-1)/(M+P-1)$ across names, formulas, code, and worked examples.
  - Kahan & Quantization: Fix worked examples so outputs match Python execution `1.0000000000000002` and `round()` zero-point convention.
  - Explicit Contract IDs & Full Schemas for ALL custom exercises across all 31 modules.
- **Python Execution Testing:** Run Python test scripts to verify 100% of worked examples match Python outputs.
- **Local Link Cleanup:** Fix relative links (`CURRICULUM-EVALUATION-V4.md`, etc.) to point within `next-research/`.

### Out-Of-Scope:
- Deployment, MLOps administration setup (Docker, Kubernetes, Helm, Terraform).
- Prometheus/Grafana monitoring, alerting, incident response.
- Modifying repository application catalog files (`src/curriculum/topics.ts`) before passing the final gatekeeper review.

---

## 3. Mandatory Completion Checklist for V5 (`PASS` Gate Criteria)

- [ ] **31 Module Records with Full 5 Rungs:** All 31 modules have 5 explicit rungs (Topics 09, 11, 12, 13 repaired).
- [ ] **Topic 07 Authored:** Extrapolation marker replaced with complete authored curriculum.
- [ ] **Weak Analogies Fixed:** Pow(x,n), Circular Array Loop, Partition Equal Subset Sum, Cookies replaced/narrowed.
- [ ] **Prerequisite Edge Alignment:** DAG edges and module prerequisite headers 100% aligned.
- [ ] **Canonical Problem Registry:** Canonical table published with direct URLs; unique count derived.
- [ ] **Executable Contracts & Python Code:** All custom exercises have explicit contract IDs and parseable Python code.
- [ ] **Technical Counterexamples Fixed:** FlashAttention, Orca, ZeRO-3, 1F1B, Kahan, Quantization contracts verified with Python test output.
- [ ] **No Broken Links or Control Characters:** Clean markdown formatting.
- [ ] **Protocol Review & Test Ledgers:** `02-evidence-ledger.md`, `03-disposition-ledger.md`, test outputs, and fresh gate report populated.
- [ ] **Fresh Gate:** Independent gatekeeper returns `PASS`.
