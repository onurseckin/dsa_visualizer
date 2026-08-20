# Task Map: Modular 10-Domain Question Bank Architecture (< 500 lines per file)

**Run ID:** `2026-08-20-code-modularity-and-hardening`  

---

## 1. Modular File Structure

| Target File | Scope / Topics | Expected Lines | Assigned Role |
|---|---|---|---|
| `src/curriculum/mlQuestions/types.ts` | Unified Types (deduplicated against `src/types/dsa.ts`) | ~90 lines | Type Architect |
| `src/curriculum/mlQuestions/domain01_linear_algebra.ts` | Topics 01–04 | ~350 lines | Implementer 1 |
| `src/curriculum/mlQuestions/domain02_calculus_autograd.ts` | Topics 05–08 | ~350 lines | Implementer 2 |
| `src/curriculum/mlQuestions/domain03_probability_stats.ts` | Topics 09–12 | ~350 lines | Implementer 3 |
| `src/curriculum/mlQuestions/domain04_classical_ml_part1.ts` | Topics 13–15 | ~280 lines | Implementer 4 |
| `src/curriculum/mlQuestions/domain04_classical_ml_part2.ts` | Topics 16–18 | ~280 lines | Implementer 5 |
| `src/curriculum/mlQuestions/domain05_deep_learning_part1.ts` | Topics 19–21 | ~280 lines | Implementer 6 |
| `src/curriculum/mlQuestions/domain05_deep_learning_part2.ts` | Topics 22–23 | ~220 lines | Implementer 7 |
| `src/curriculum/mlQuestions/domain06_tokenization_retrieval.ts` | Topics 24–27 | ~360 lines | Implementer 8 |
| `src/curriculum/mlQuestions/domain07_attention_transformers.ts` | Topics 28–30 | ~300 lines | Implementer 9 |
| `src/curriculum/mlQuestions/domain08_inference_systems.ts` | Topics 31–33 | ~300 lines | Implementer 10 |
| `src/curriculum/mlQuestions/domain09_precision_kernels.ts` | Topics 34–36 | ~300 lines | Implementer 11 |
| `src/curriculum/mlQuestions/domain10_distributed_training.ts` | Topics 37–39 | ~280 lines | Implementer 12 |
| `src/curriculum/mlQuestions/domain10_compilers_parallelism.ts` | Topics 40–41 | ~220 lines | Implementer 13 |
| `src/curriculum/mlQuestions/index.ts` | Aggregator & Helpers | ~60 lines | Index Integrator |

---

## 2. Validation Gates
- **Line Count Invariant**: Every file $\le 500$ lines.
- **Type Deduplication**: Shared types re-exported from `src/types/dsa.ts`.
- **Exact Count**: 41 topics, 486+ questions, 0 empty arrays.
- **Compiler**: 100% pure Python compilation.
- **Repository Gates**: `bun run check` passes with 0 errors.
