# Repair Wave Task Map: Full Uncapped Problem Expansion (V8.0)

**Run ID:** `2026-08-20-curriculum-v8-uncapped-expansion`  
**Phase:** Repair Wave 2 ($2N + 1$ Multi-Agent Deployment)  
**Protocol:** `orchestrating-long-tasks` & `iterative-multi-agent-evaluation`

---

## 1. Disjoint Scopes & Multi-Agent Pairs ($N=4 \implies 8$ Subagents)

| Lane | Scope Files | Topics | Assigned Implementer | Assigned Validator | Target |
|---|---|---|---|---|---|
| **Lane 1** | `domain-01-linear-algebra.md`<br>`domain-02-calculus-and-optimization.md` | Topics 01–08 | `Implementer 1 (Math Foundations)` | `Validator 1 (Math Foundations)` | 40–60 Questions & 100% Contract Pass |
| **Lane 2** | `domain-03-probability-and-statistics.md`<br>`domain-04-classical-ml-and-data-science.md` | Topics 09–18 | `Implementer 2 (Stats & Classical ML)` | `Validator 2 (Stats & Classical ML)` | 60–80 Questions & 100% Contract Pass |
| **Lane 3** | `domain-05-deep-learning-and-activations.md`<br>`domain-06-tokenization-and-retrieval.md` | Topics 19–27 | `Implementer 3 (Deep Learning & Retrieval)` | `Validator 3 (Deep Learning & Retrieval)` | 50–70 Questions & 100% Contract Pass |
| **Lane 4** | `domain-07-attention-and-transformers.md`<br>`domain-08-inference-systems.md`<br>`domain-09-precision-quantization-kernels.md`<br>`domain-10-distributed-and-compilers.md` | Topics 28–41 | `Implementer 4 (Transformers & Systems)` | `Validator 4 (Transformers & Systems)` | 80–120 Questions & 100% Contract Pass |

---

## 2. Mandatory Authoring Structure for EVERY Single Topic (Topics 01–41)

Every topic in each domain file MUST feature the full 4-part unconstrained Question Bank:
- `#### Part A: Foundational DSA & Coding Problems`: 3–6 LeetCode problems with direct URLs.
- `#### Part B: Mathematical Proofs & Analytical Derivations`: 2–4 rigorous mathematical proofs.
- `#### Part C: Real-World ML Systems & Engineering Questions`: 2–4 production engineering scenarios.
- `#### Part D: Edge Cases, Numerical Stability & Stress Tests`: 2–3 critical stress-test questions.
- `### Executable Problem Contract`: Pure Python reference code with 100% exact signatures matching the test suite.
