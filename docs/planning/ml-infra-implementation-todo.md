# ML Infrastructure & AI Systems Implementation TODO Tracker

Document Status: Implementation Completed
Last Updated: 2026-07-27

---

## Multi-Category Tagging & Architecture Rules
- Every algorithm includes `categories: [primaryCategory, ...additionalCategories]`.
- Standard LeetCode/DSA problems in ML Infra topics have both their ML Infra category and their Knowledge Tree category in `categories`.
- Pure ML Infra algorithms (e.g. Triton kernels, ZeRO-3 dynamic sharding) have `isMlInfra: true` and their ML topic in `category` & `categories`.
- Component tests use `.render.spec.tsx` and unique file basenames.
- Commits are pushed after each topic phase completion following Conventional Commits (`feat: ...`).

---

## Topic Progress Tracker

| Topic ID | Topic Name | Questions Target | Status | Commit Hash |
|---|---|---|---|---|
| `ml_tensor_algebra` | Topic 1: Tensor Memory Layouts & Pointer Arithmetic | 15 Questions | ✅ Completed | Completed |
| `ml_gemm_roofline` | Topic 2: GEMM Architecture, SRAM Tiling & Rooflines | 17 Questions | ✅ Completed | Completed |
| `ml_autograd_dags` | Topic 3: Autograd, Computational Graph DAGs & VJPs | 16 Questions | ✅ Completed | Completed |
| `ml_precision_quantization` | Topic 4: Numerical Precision, Fused Softmax & Quantization | 15 Questions | ✅ Completed | Completed |
| `ml_vector_search` | Topic 5: Vector Search, LSH, IVF-PQ & HNSW Indexing | 16 Questions | ✅ Completed | Completed |
| `ml_tokenization` | Topic 6: Subword Tokenization, Tries & Viterbi Segmenters | 16 Questions | ✅ Completed | Completed |
| `ml_attention_geometry` | Topic 7: Attention Geometry, RoPE & Multi-Head Grouping | 16 Questions | ✅ Completed | Completed |
| `ml_convolutions` | Topic 8: Convolutional Lowering & im2col GEMM Mapping | 16 Questions | ✅ Completed | Completed |
| `ml_tree_ensembles` | Topic 9: Decision Trees & XGBoost 2nd-Order Boosting | 15 Questions | ✅ Completed | Completed |
| `ml_hardware_kernels` | Topic 10: SRAM FlashAttention Tiling & Triton SPMD Compilers | 16 Questions | ✅ Completed | Completed |
| `ml_distributed_systems` | Topic 11: Distributed Interconnects, Ring-AllReduce & ZeRO | 16 Questions | ✅ Completed | Completed |
| `ml_llm_serving` | Topic 12: Production LLM Serving, PagedAttention & Speculative | 16 Questions | ✅ Completed | Completed |

Total: 190 Questions implemented across 12 ML Infra topics.
All 190 algorithms registered in `ALGORITHM_REGISTRY` (`src/algorithms/registry.ts`).
All 12 ML Infra Knowledge Graph nodes (`src/components/knowledge-graph/mlInfraGraphData.ts`) updated with question lists.
TypeScript `typecheck` passes with zero errors.
