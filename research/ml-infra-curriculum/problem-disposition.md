# Current Problem-Bank Dispositions

## Decision vocabulary

Every current definition should receive exactly one migration disposition before
catalog implementation begins:

| Disposition | Meaning |
| --- | --- |
| Retain | The item assesses a distinct target competency and needs only normal source/content updates. |
| Merge | Its mechanism is valuable, but it overlaps other definitions; combine the best visualization, examples, and explanations. |
| Rework | Keep the central idea, but correct factual claims, use authentic execution, change the assessment mode, or retitle the abstraction. |
| Move | The item belongs in the general DSA path, an optional prerequisite, or a different target topic. |
| Reference | Useful deep implementation detail, but not an assessed milestone in the 69-item curriculum. |
| Retire | Duplicate, misleading, obsolete, or too weak to justify maintenance. |

Do not use registry enrollment as an archive. A definition that is retained only
as reference material should not appear as another required "problem."

The audited, exactly-once decision for all 232 current IDs is in
[current-problem-ledger.csv](current-problem-ledger.csv). Reason codes mean:

- `SELECTED_CORE`: preferred current implementation for a target item;
- `CORE_MECHANISM`: a distinct mechanism to preserve inside a merged item;
- `DUPLICATE_FAMILY`: useful material consolidated with sibling definitions;
- `EXACT_DUPLICATE`: confirmed redundant definition to retire;
- `GENERIC_DSA` or `MODEL_PREREQUISITE`: move out of assessed ML infrastructure;
- `OPTIONAL_DEPTH`: keep only as non-curricular specialist reference;
- `AUTHENTICITY` or `MISLEADING_IMPLEMENTATION`: align title and claims with
  actual execution or replace it;
- `FACTUAL_CORRECTION`: a named technical claim requires correction; and
- `PROFILER_CONTEXT`: retain only in a measurement-led optimization task.

## Portfolio-level decision

The recommended 69-item bank contains:

- 45 required lifecycle items, of which the large majority are new because the
  lifecycle is currently absent;
- 24 elective items, mostly consolidated from the current collection; and
- approximately 20 current visual mechanisms worth retaining directly or using
  as the visual core of a merged item.

This does not mean that only 20 existing files contain useful work. A merged
module can reuse code, explanations, tests, examples, and visual conventions
from many definitions. It means that the learner should encounter one coherent
assessment rather than a sequence of near-identical milestones.

## Topic-by-topic decisions

### `ml_tensor_algebra`

Target: R4 Numerical Computing, Tensors & Stability, with small contributions to
E1 and E8.

- **Retain/merge:** stride-offset, layout, view, reshape, contiguity, and
  `as_strided` mechanics into one explorer.
- **Move:** generic flatten, transpose, rotate, prefix/range, and nested-array
  exercises that already belong to DSA.
- **Rework:** distinguish storage layout, views, copies, operation support, and
  performance. Do not claim all kernels require C-contiguous tensors.
- **Reference:** unusual stride tricks and layout transforms after the learner
  masters ordinary views.

Desired assessed output: one R4 tensor item, not 27 memberships.

### `ml_gemm_roofline`

Target: E1 Accelerator Performance, Roofline & Kernel Fundamentals.

- **Retain:** one naïve-to-tiled GEMM memory trace and one roofline calculator.
- **Merge:** the duplicate naïve matrix multiplications; the L1/L2/SRAM/block
  tiling sequence; arithmetic-intensity/roofline calculators.
- **Move:** generic matrix/array/interval/heap problems with only thematic
  titles.
- **Rework:** advanced kernels around profiler evidence, correctness, numerical
  tolerance, and benchmark methodology.
- **Reference:** deeper tensor-core swizzles and architecture-specific tuning.

Desired assessed output: three E1 items, not 46 memberships.

### `ml_autograd_dags`

Target: R6 Training Loops, Autodiff & Optimization.

- **Retain:** one small reverse-mode autodiff graph.
- **Merge:** scalar chain-rule/micrograd variants; checkpointing variants; VJP
  scheduling fragments.
- **Move:** generic DAG topological sorts, AST evaluation, and linked-list
  mechanics to DSA prerequisites unless their ML state is essential.
- **Rework:** include gradient accumulation, zeroing, train/eval state, and
  checkpoint consequences rather than teaching autodiff as isolated graph
  arithmetic.
- **Reference:** advanced asynchronous VJP scheduling.

Desired assessed output: three R6 items, not 20 memberships.

### `ml_precision_quantization`

Targets: R4 for numerical stability/dtypes and E3 for deployment quantization.

- **Retain/merge:** stable softmax/log-sum-exp; affine and per-channel
  quantization; SmoothQuant as one advanced strategy.
- **Merge:** multiple bit-format, scale, zero-point, and quantize/dequantize
  drills.
- **Rework:** every quantization exercise must include calibration evidence,
  accuracy/error budget, hardware/runtime support, and rollback.
- **Reference:** FP8 format details and byte-level representations where useful
  for a hardware specialization.
- **Move:** generic bit manipulation that does not teach a numerical invariant.

Desired assessed output: one R4 numerical item plus one E3 quantization item.

### `ml_vector_search`

Target: E6 Retrieval & Vector Data Systems.

- **Retain:** one exact k-NN trace and one HNSW traversal visual.
- **Merge:** exact-search duplicates; HNSW construction/search fragments;
  IVF/coarse-quantizer/PQ/ADC fragments.
- **Retire:** the exact duplicate IVF-PQ ADC pair.
- **Move:** generic skip-list, bucket, graph, or clustering exercises that do
  not assess retrieval-system behavior.
- **Rework:** make recall, filtered retrieval, updates, embedding versions,
  memory, freshness, and reranking first-class.
- **Reference:** LSH and detailed PQ internals after the standard tradeoff item.

Desired assessed output: three E6 items, not 20 memberships.

### `ml_tokenization`

Target: E4 Transformer Internals & Tokenization.

- **Retain/merge:** a single production-oriented BPE/UTF-8/token-budget trace.
- **Merge:** BPE training, vocabulary, pair-frequency, encoding, and decoder
  fragments; retain one optional Unigram/SentencePiece comparison.
- **Move:** generic trie and dynamic-programming exercises to DSA prerequisites
  unless they expose tokenizer-specific state.
- **Rework:** include normalization, special tokens, unknown/byte fallback,
  vocabulary version compatibility, and downstream token-budget effects.
- **Reference:** lock-free or high-concurrency trie details.

Desired assessed output: the tokenization portion of one E4 item, not 19
memberships.

### `ml_tree_ensembles`

Target: E7 Tree-Ensemble Systems.

- **Retain:** histogram split/gain calculation.
- **Merge:** entropy/Gini/split mechanics and the multiple XGBoost boosting
  fragments.
- **Move:** generic binary-tree traversal and sorting mechanics.
- **Rework:** add missing values, categorical handling, leakage, serving
  representation, model-size/latency, and baseline-selection tradeoffs.
- **Reference:** quantile-sketch and histogram-builder internals.

Desired assessed output: three E7 items, not 17 memberships.

### `ml_convolutions`

Target: E8 Vision & Sequence Model Internals, with lowering concepts informing
E1.

- **Retain/merge:** output-shape/receptive-field and im2col/lowering into one
  visual trace.
- **Merge:** direct, im2col, tiled, depthwise, Winograd, and layout fragments
  where they repeat the same shape or reuse concept.
- **Move:** generic grid/window exercises without model-specific decisions.
- **Reference:** Winograd and cuDNN-like kernel-selection internals.
- **Rework:** make memory cost and runtime choice explicit; avoid implying a
  handwritten simulation represents a vendor kernel.

Desired assessed output: one E8 convolution item, not 18 memberships.

### `ml_recurrent_gates`

Target: E8 Vision & Sequence Model Internals.

- **Retain/rework:** one recurrent unrolling/BPTT gradient-behavior visual.
- **Merge:** the constant-error-carousel idea into the same learning sequence.
- **Remove from the required path:** recurrent internals are model-family
  specialization, not a prerequisite for production infrastructure.
- **Fix immediately during migration:** do not leave the topic enrolled but
  invisible as it is today.

Desired assessed output: one E8 item, not an unplaced two-item topic.

### `ml_attention_geometry`

Targets: E4 for transformer mechanics and E5 where KV state affects serving.

- **Retain:** one scaled dot-product/causal-mask trace.
- **Merge:** attention-head, multi-head, MQA/GQA, causal mask, RoPE, and KV-cache
  fragments into the three E4 concepts.
- **Move:** paging, eviction, and scheduler consequences to E5.
- **Reference:** proof-oriented RoPE variants and CUDA-specific attention
  implementations.
- **Rework:** separate model math from serving state so mastery of attention
  does not falsely imply serving competence.

Desired assessed output: two of the three E4 items plus input to E5, not 31
memberships.

### `ml_hardware_kernels`

Targets: E1 and, for measured LLM bottlenecks, E5.

- **Retain:** one memory hierarchy/tiled-access visual and at most one authentic
  FlashAttention item.
- **Merge:** FlashAttention versions and related online-softmax fragments into
  one mechanism-plus-tradeoff module.
- **Rework:** Triton-named items as actual Triton kernels with reference
  correctness, tests, warmup, benchmarks, and profiler evidence; otherwise
  retitle them as simulations.
- **Reference:** architecture-specific SRAM, warp, tensor-core, async
  double-buffering, and swizzle details.
- **Retire:** framework-branded exercises whose code does not exercise that
  framework and whose abstraction is not disclosed.

Desired assessed output: E1's three items and, at most, supporting material for
one E5 scenario, not 35 memberships.

### `ml_graph_compilers`

Target: E3 Inference Compilation, Quantization & Portable Runtimes.

- **Merge:** ONNX, TensorRT, TVM Relay, and XLA simulations into one small
  vendor-neutral graph containing capture, supported/unsupported operators,
  partition, fusion, lowering, validation, and fallback.
- **Rework:** use at least one authentic export/compile experiment and report
  graph breaks and numerical compatibility.
- **Rename:** the catalog label "Model Compression & Compilers" does not match
  the four compiler definitions. Compression belongs with quantization;
  compilation should be named directly.
- **Move family:** a compiler is not a distributed-systems topic by default.

Desired assessed output: one E3 compiler item, not four separate Hard items.

### `ml_distributed_systems`

Target: E2 Distributed Training & Parallelism.

- **Retain:** ring all-reduce with bytes/steps/failure and a sharded-memory
  calculator.
- **Merge:** ring variants, collective fragments, ZeRO stage fragments, and
  tensor/pipeline/data-parallel reshapers.
- **Rework:** require comparison against a correct profiled single-device
  baseline; include topology, overlap, checkpointing, failure, stragglers, and
  effective throughput.
- **Reference:** detailed IPC/NVLink and topology-specific tuning.
- **Correct prerequisite:** training loops, training platform, and accelerator
  fundamentals—not hardware kernels alone.

Desired assessed output: three E2 items, not 20 memberships.

### `ml_llm_serving`

Target: E5 LLM Serving Systems.

- **Retain:** paged KV allocation and iteration-level continuous batching.
- **Merge:** prefix caching, prefill/decode separation, speculative decoding,
  admission, cancellation, scheduling, and overload fragments into one policy
  scenario.
- **Rework:** scope performance claims to workload and system assumptions;
  evaluate latency percentiles, throughput, memory, fairness, and quality.
- **Retire/replace:** the current custom PyTorch CUDA operation wrapper, which
  neither registers nor invokes a custom PyTorch/CUDA operation.
- **Reference:** raw CUDA wrapper and kernel details after authentic kernel
  foundations.
- **Correct prerequisite:** ordinary inference/serving reliability,
  transformer/KV-cache mechanics, and accelerator performance.

Desired assessed output: three E5 items, not 25 memberships.

## Difficulty relabeling

Do not mechanically carry current difficulty labels into merged items. Score
each target item using the rubric in
[assessment-design.md](assessment-design.md):

- prerequisite depth;
- simultaneous representations/operations;
- causal/state horizon; and
- decision ambiguity.

The target uses five bands—Introductory, Developing, Proficient, Advanced, and
Systems Design—because a one-dimensional Easy/Medium/Hard label hides the
difference between computational complexity and open-ended systems judgment.
If the UI must initially keep three values, map Introductory/Developing to Easy,
Proficient to Medium, and Advanced/Systems Design to Hard while preserving the
four component scores in authored metadata or research notes.

## Per-definition migration ledger

The CSV supplies the stable decision columns now. Before implementation, enrich
it with these authoring and delivery columns:

```text
current_id
target_item_id
disposition
reason_code
current_topic_ids
source_urls
factual_corrections
visual_assets_to_reuse
tests_to_reuse_or_replace
owner
```

The grouped decisions explain the curriculum direction; the ledger prevents a
useful definition from being accidentally deleted or a duplicate from surviving
because it was not noticed. Dispositions are research recommendations and
should be rechecked against implementation details before deletion.
