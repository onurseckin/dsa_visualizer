# Run Contract: Curriculum V2 Normalization & Protocol Execution

**Date:** 2026-07-29  
**Protocol Reference:** [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](../../AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)  
**Authoritative Input Artifacts:**
1. [`README.md`](../../README.md)
2. [`ORCHESTRATED-MASTER-CURRICULUM-V2.md`](../../ORCHESTRATED-MASTER-CURRICULUM-V2.md)
3. [`CURRICULUM-EVALUATION-V2.md`](../../CURRICULUM-EVALUATION-V2.md)

**Output Artifact Location:**
`research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v2-normalization/`

---

## 1. Objective & User Outcome

Transform `ORCHESTRATED-MASTER-CURRICULUM-V2.md` into an implementation-ready, 100% verified, deduplicated, and mathematically sound curriculum artifact (`ORCHESTRATED-MASTER-CURRICULUM-V3-NORMALIZED.md`) following the exact rules of `AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`.

---

## 2. In-Scope vs Out-Of-Scope

### In-Scope:
- **7-Domain Organization & Topological Prerequisite DAG:** Publish explicit domain headers and a complete topological dependency graph across all modules.
- **Topic Splits:** Split Topic 17 into *IVF-PQ-ADC* and *LSH*; split Topic 29 into *Graph Compiler Passes* and *3D Parallelism* (expanding from 29 to 31 canonical topic modules).
- **Blocking Technical Corrections:**
  - Repair all LaTeX control-character corruptions (`\mod`, `\frac`, `\alpha`, `\beta`, `\text`, `\rfloor`).
  - Fix LeetCode 2254 to **LeetCode 2502 — Design Memory Allocator**.
  - Correct KV-cache byte accounting ($2 \times \text{num\_layers} \times \text{num\_kv\_heads} \times \text{head\_dim} \times \text{dtype\_bytes}$).
  - Distinguish machine epsilon ($\epsilon$) from unit roundoff ($u = \epsilon/2$).
  - Correct PyTorch `zero_grad()` semantics (gradients accumulate by default).
  - Correct 1D dilated convolution output formula ($O = \lfloor \frac{W + 2P - D(K-1) - 1}{S} \rfloor + 1$) and cross-correlation vs `col2im` scatter-add.
  - Correct network delay cost formula ($T = \alpha + \frac{\text{bytes}}{\text{bandwidth}}$).
  - Constrain over-generalized benchmark claims (K-D trees, Ball Trees, HNSW sublinearity, ADC $O(m)$ lookups, NCCL algorithm selection).
- **Source Provenance:** Provide direct literal URLs (LeetCode, CSES, Deep-ML, official papers) for every single topic.
- **Deduplication:** Assign one canonical home per problem, cross-linking downstream.
- **Executable Problem Contracts:** Write complete problem specifications (ID, Title, Prompt, Input/Output Schema, Constraints, Tie-breaking, Edge cases, Test Strategy, Visualizer state) for custom ML bridge exercises.

### Out-Of-Scope:
- Deployment, MLOps administration setup (Docker, Kubernetes, Helm, Terraform).
- Prometheus/Grafana monitoring, alerting, incident response.
- Modifying repository application catalog files (`src/curriculum/topics.ts`) before passing the final gatekeeper review.

---

## 3. Mandatory Success Gates (Universal & Task-Specific)

- [ ] **Scope & Purity Gate:** 100% pure DSA/Applied Math; zero DevOps/MLOps admin setup.
- [ ] **Domain & DAG Gate:** Explicit 7-Domain structure and prerequisite DAG published.
- [ ] **Topic Splits Gate:** Topics 17 and 29 cleanly split into 4 distinct topics (31 total topics).
- [ ] **Technical Corrections Gate:** All 9 blocking technical corrections (formulas, LeetCode IDs, control characters, epsilon, zero_grad) resolved.
- [ ] **Source Provenance Gate:** Direct, verifiable URLs provided for every single topic's foundations and named mechanisms.
- [ ] **Deduplication Gate:** Zero unassigned duplicates; every problem has one canonical home.
- [ ] **Problem Specification Gate:** Custom exercises formatted into executable problem contracts with input/output schemas and test strategies.
- [ ] **Fresh Adversarial Gate:** Independent gatekeeper returns `PASS`.
