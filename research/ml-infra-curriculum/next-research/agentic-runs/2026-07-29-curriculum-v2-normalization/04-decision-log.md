# Decision Log: Curriculum V2 Normalization

**Date:** 2026-07-29  
**Status:** Protocol Executed & Gate Audit Passed  

---

## Key Strategic Decisions Made:

1. **Explicit 7-Domain Organization & Topological Prerequisite DAG:**
   - Established Domain 1 through Domain 7 and generated a complete Mermaid topological prerequisite graph for all 31 modules.
2. **Topic Module Splits (29 to 31 Modules):**
   - **Split Topic 17** into Topic 17a (*Inverted File Index, Product Quantization & ADC*) and Topic 17b (*Locality-Sensitive Hashing*).
   - **Split Topic 29** into Topic 29a (*Graph Compiler Transforms, Fusion & Memory Planning*) and Topic 29b (*Tensor, Pipeline & Expert Parallel Algorithms*).
3. **9 Blocking Technical Corrections:**
   - Repaired all LaTeX control-character corruptions (`\mod`, `\frac`, `\alpha`, `\beta`, `\text`, `\rfloor`).
   - Corrected LeetCode 2254 to **LeetCode 2502 — Design Memory Allocator**.
   - Corrected KV-Cache byte accounting formula ($2 \times \text{num\_layers} \times \text{num\_kv\_heads} \times \text{head\_dim} \times \text{dtype\_bytes}$).
   - Distinguished Machine Epsilon ($\epsilon \approx 1.19 \times 10^{-7}$) from Unit Roundoff ($u = \epsilon/2 \approx 5.96 \times 10^{-8}$).
   - Corrected PyTorch `zero_grad()` semantics (gradients accumulate by default; `zero_grad()` resets them).
   - Corrected 1D dilated convolution output formula ($O = \lfloor \frac{W + 2P - D(K-1) - 1}{S} \rfloor + 1$) and cross-correlation vs `col2im` scatter-add.
   - Corrected network delay cost formula ($T = \alpha + \frac{\text{bytes}}{\text{bandwidth}}$).
   - Framed K-D trees, Ball Trees, HNSW query complexity, ADC $O(m)$ lookups, and NCCL algorithm selection as parameterized benchmarks with explicit assumptions.
4. **Source Provenance & Deduplication:**
   - Supplied direct literal URLs for all 31 foundation rungs.
   - Assigned ONE canonical home per problem and provided cross-links downstream.
5. **Executable Problem Contracts:**
   - Authored complete problem contracts (ID, Title, Prompt, Input/Output Schema, Constraints, Tie-Breaking, Edge Cases, Test Strategy, Visualizer State) for custom ML bridge exercises.
