# Task Map: Curriculum Version 8.0 — Parallel Uncapped Question Bank Generation

**Run Directory:** `research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/`  
**Deployment Formula:** $2N + 1$ Triad Architecture ($N = 4 \implies 4 \text{ Implementers} + 4 \text{ Validators}$)

---

## 1. Work Lanes & Disjoint Scopes

| Lane | Assigned Files | Topics | Scope Focus | Target Question Range | Implementer | Validator |
|---|---|---|---|---|---|---|
| **Lane 1** | `domain-01-linear-algebra.md`<br>`domain-02-calculus-and-optimization.md` | Topics 01–08 | Matrix Memory, Strides, Gram-Schmidt, SVD/PCA, Jacobians, Autodiff DAGs, AdamW, Loss Functions | 40–60 Questions | `Implementer 1 (Math Foundations)` | `Validator 1 (Math Foundations)` |
| **Lane 2** | `domain-03-probability-and-statistics.md`<br>`domain-04-classical-ml-and-data-science.md` | Topics 09–18 | Distributions, Covariance, Naive Bayes, Bootstrap, Top-P, OLS, Logistic, CART, XGBoost, K-Means++, SVM, ALS | 60–80 Questions | `Implementer 2 (Stats & Classical ML)` | `Validator 2 (Stats & Classical ML)` |
| **Lane 3** | `domain-05-deep-learning-and-activations.md`<br>`domain-06-tokenization-and-retrieval.md` | Topics 19–27 | MLPs, Online Softmax, RMSNorm, Im2Col, LSTMs, Tries, BPE/tiktoken, K-D Trees, HNSW, IVF-PQ | 50–70 Questions | `Implementer 3 (Deep Learning & Retrieval)` | `Validator 3 (Deep Learning & Retrieval)` |
| **Lane 4** | `domain-07-attention-and-transformers.md`<br>`domain-08-inference-systems.md`<br>`domain-09-precision-quantization-kernels.md`<br>`domain-10-distributed-and-compilers.md` | Topics 28–41 | SDPA, RoPE/GQA, FlashAttention, Orca Continuous Batching, PagedAttention, Speculative Decoding, Kahan, INT8/FP8, Tiled GEMM, $\alpha$-$\beta$ Network, Ring-AllReduce, ZeRO-3, IR Fusion, 1F1B & MoE | 80–120 Questions | `Implementer 4 (Transformers & Systems)` | `Validator 4 (Transformers & Systems)` |

---

## 2. Topic Structure Standard for Version 8.0

For EVERY topic in the assigned domain files:
1. **Topic Metadata**: Title, ID, Learning Outcome, Prerequisites, Decision Rationale.
2. **Academic & Modern Tech SOTA Alignment**: Stanford / MIT / CMU syllabus links, OpenAI / Meta / DeepSeek / Google / vLLM production applications.
3. **Comprehensive Question & Problem Bank** (Dynamically scaled according to depth):
   - **Part A: Foundational DSA & Coding Problems**: Curated list of verified LeetCode (Easy/Med/Hard), CSES, or platform problems with direct URLs and learning objectives.
   - **Part B: Mathematical & Conceptual Analysis Questions**: In-depth analytical questions, proofs, gradient derivations, and dimensional shape verifications.
   - **Part C: Real-World Systems & ML Interview Questions**: Production scenarios, memory footprint sizing, latency formulas, and architectural tradeoffs.
   - **Part D: Frontier Edge Cases & Failure Modes**: Numerical instability, floating-point cancellations, sparsity collapse, out-of-bounds inputs, and stress conditions.
4. **Primary Executable Machine Learning Problem Contract**:
   - `ID`, `Title`, `Primary Reference URL`, `Prompt`, `Input Schema`, `Output Schema`, `Constraints`, `Tolerances`, `Worked Examples`, `Canonical Python Code` (pure Python, 100% bug-free), `Test Strategy`, `Visualizer State Schema`.
