# Re-evaluation of Orchestrated Master Curriculum Version 2

Date: 2026-07-29

Reviewed proposal:
[`ORCHESTRATED-MASTER-CURRICULUM-V2.md`](ORCHESTRATED-MASTER-CURRICULUM-V2.md)

Previous review:
[`CURRICULUM-EVALUATION.md`](CURRICULUM-EVALUATION.md)

Review scope: topic names, foundational DSA and mathematics coverage, transfer
from online practice to ML-infrastructure algorithms, progression, factual
accuracy, duplication, source fidelity, and readiness to become executable
problems in DSA Visualizer. Deployment, MLOps administration, observability,
incident response, and operational troubleshooting remain intentionally out of
scope.

## Verdict

Version 2 is a major conceptual improvement over Version 1. It responds to the
most important criticism: the curriculum now usually teaches the real
algorithmic mechanism instead of attaching an unrelated LeetCode problem to an
ML term.

The strongest rebuilt ladders now provide credible routes into tensor layout,
matrix multiplication, computation graphs, reverse-mode autograd, exact and
approximate vector search, BPE, convolution lowering, XGBoost, ordinary
attention, FlashAttention, continuous batching, PagedAttention, ring
collectives, and ZeRO.

It is not yet implementation-ready.

The remaining problems are different from the Version 1 problems:

- the document describes many good exercises but does not specify judgeable
  problems;
- source coverage is much weaker than the document claims;
- the promised seven-domain structure and prerequisite graph are absent;
- several topics duplicate mechanisms that need one canonical home;
- two topics combine independent branches and should be split;
- a small number of technical statements and formulas are wrong or too broad;
  and
- the document contains corrupted control characters in mathematical notation.

The correct decision is to keep Version 2 as the preferred curriculum design
draft, repair and atomize it, and only then derive the final number of
questions. It should not yet replace the application catalog.

## Scorecard

| Dimension | Assessment | Decision |
| --- | --- | --- |
| DSA-first product alignment | Strong | Accepted |
| Removal of false analogies | Strong improvement | Accepted with a few remaining removals |
| Topic coverage | Broad and mostly relevant | Accepted after two topic splits |
| Foundation-to-endpoint progression | Mostly credible | Needs explicit prerequisite links |
| Online problem provenance | Incomplete | Blocking |
| Executable problem specificity | Incomplete | Blocking |
| Technical accuracy | Mostly sound, with several material errors | Blocking corrections required |
| Deduplication | Improved but unfinished | Canonicalize cross-topic reuse |
| Seven-domain organization | Claimed but not present | Blocking |
| Question-count adequacy | Not auditable from this document | Recount after atomization |

## What Version 2 genuinely fixed

The following are substantive improvements and should be preserved:

1. **Tensor work is now based on real tensor primitives.** Shape conservation,
   flat offsets, strides, views, broadcasting, aliasing, contiguity, dense
   multiplication, sparse formats, and tiling form a useful progression.
2. **The graph branch now reaches real ML execution mechanisms.** Topological
   order, reverse traversal, dependency counters, critical paths, liveness,
   typed expression graphs, and autograd are meaningfully connected.
3. **Missing numerical foundations were added.** Floating-point behavior,
   quantization, stable softmax, probability and losses, and optimizer state
   are necessary for later attention and distributed-training exercises.
4. **The retrieval branch is much sharper.** Exact top-k search, spatial trees,
   HNSW, IVF/PQ, and LSH are now recognizable algorithm families rather than
   generic graph or geometry analogies.
5. **BPE was rebuilt around its actual operations.** Pair counting,
   deterministic pair selection, merge application, merge ranks, byte
   handling, and incremental updates are the right practice surfaces.
6. **Decision-tree content now teaches induction and boosting.** Impurity,
   split scanning, gradient/Hessian statistics, XGBoost gain, missing-value
   direction, and approximate binning replace unrelated binary-tree puzzles.
7. **Ordinary attention was added before FlashAttention.** This repairs a major
   prerequisite jump in Version 1.
8. **Serving algorithms are now algorithmic.** Event simulation, admission,
   continuous batching, block allocation, block tables, reference counting,
   copy-on-write, and prefix sharing are valid practice subjects.
9. **Distributed topics now expose actual state and communication algorithms.**
   Byte accounting, reduce-scatter, all-gather, ring indexing, topology cost,
   and ZeRO stages belong in this product when represented as executable
   simulations.

These changes mean Version 2 should be edited, not discarded.

## Mechanical audit

A literal audit of the markdown found:

- 29 numbered topic modules;
- 44 URL occurrences and 41 unique URLs;
- only 8 of 29 topic modules containing any literal URL;
- 21 topic modules containing no literal URL;
- no domain headings or domain-to-topic mapping;
- no prerequisite graph or explicit cross-topic dependency list; and
- corrupted control characters on lines 688, 905, 983, 1185, 1214, and 1316.

The modules with direct URLs are Topics 01, 02, 06, 07, 14, 15, 18, and 20.
The other 21 modules sometimes name a platform problem, paper, framework, or
article, but do not provide a verifiable direct URL.

This is a source-provenance regression from Version 1. Fewer links would be
acceptable if Version 2 deliberately used canonical cross-links, but it does
not yet declare those cross-links. As written, the statement that every
foundation rung contains a “real online DSA or math problem” is not
demonstrated.

### The “judged code specs” claim is not satisfied

The document says GeeksforGeeks tutorials were converted to judged code
specifications. Most custom entries are currently exercise names or short
concept descriptions, for example “Memory Aliasing Detection,” “BPE
Training,” or “GPU Cluster Topology Routing.”

Those are good problem ideas, but a judged problem additionally needs:

- a stable canonical ID and title;
- a precise prompt;
- input and output schemas;
- constraints;
- deterministic tie-breaking and numerical tolerances;
- examples;
- edge cases;
- a reference implementation;
- an oracle or property-based test strategy;
- difficulty justified by the required operations;
- visualization state and step semantics; and
- exact source/reference metadata.

Until those fields exist, the document is a curriculum outline rather than a
question bank.

### The “deduplicated” claim is only partly satisfied

Cross-topic reuse remains in at least these areas:

- Reshape Matrix, Transpose Matrix, and Diagonal Traverse in Topics 01 and 02;
- K Closest Points in Topics 14 and 16;
- Kahan summation and Welford variance in Topics 04 and 11;
- common-subexpression elimination, constant folding, and dead-code
  elimination in Topics 08 and 29;
- liveness and memory reuse in Topics 07 and 29; and
- top-k/top-p filtering in Topics 12 and 22.

Reuse is not itself wrong. Each item should have one canonical home, one
implementation, and explicit prerequisite links from later topics. It should
not occupy multiple question slots.

### Internal document inconsistencies

- “Added 9 Standalone Foundation Topics” is followed by eight named additions.
- The topic count rises from 23 to 29, a net addition of six modules.
- “3D Parallelism” and “Graph Compiler Passes” are described as standalone
  additions but are combined in Topic 29.
- Topic 14’s evaluation rationale is copied from Topic 13 and describes
  optimizers rather than vector search.
- The five-rung pattern is used uniformly even when the concepts form branches
  or need more than one exercise at a rung.

Treat the five rung names as **types of practice**, not a quota of five
questions or a requirement that every subject be linear.

## Required curriculum architecture

Version 2 says there are seven topological domains but never identifies them.
The following organization fits the actual content:

| Domain | Modules |
| --- | --- |
| 1. Tensor representation and numerical kernels | 01–05 |
| 2. Computation graphs, differentiation, and training mathematics | 06–13 |
| 3. Retrieval and vector indexing | 14–17, after splitting Topic 17 |
| 4. Tokenization and local spatial operators | 18–20 |
| 5. Model algorithm internals | 21–23 |
| 6. Inference scheduling and memory | 24–25 |
| 7. Distributed execution and compiler planning | 26–29, after splitting Topic 29 |

This organization does not imply that every module in a domain is sequential.
The document should publish explicit prerequisite edges. At minimum:

- 01 precedes 02 and 03.
- 04 precedes 05, 10, and 11.
- 06 precedes 07, 08, and 09.
- 01, 02, 06, and the typed-IR portion of 08 support 09.
- 09, 10, and 11 support 13.
- 14 is the shared prerequisite for 15, 16, IVF/PQ, and LSH.
- 18 precedes 19.
- 01, 03, and 04 support 20.
- 03, 04, and 11 support 22.
- 03, 11, and 22 precede 23.
- 22 supports the prefill/decode model used by 24 and 25.
- 13 and 27 precede 28.
- 06, 07, and 08 precede graph-compiler transformations.
- 03, 22, 26, 27, and 28 support tensor, pipeline, and expert parallelism.

The learner should see these dependencies in the roadmap UI. Topic order alone
is not enough because retrieval, tokenization, model algorithms, serving, and
distributed execution branch and later reconverge.

## Blocking technical corrections

### 1. Repair corrupted notation

Several LaTeX commands were converted into control characters, including
forms of `\mod`, `\frac`, `\alpha`, `\beta`, `\text`, and `\rfloor`. This
affects the displayed convolution, attention, communication, ring, and
pipeline formulas. Repair the source text before another model copies formulas
into problem definitions.

### 2. Correct the allocator problem ID

Topic 25 cites “LeetCode 2254 Design Memory Allocator.” The correct problem is
**LeetCode 2502 — Design Memory Allocator**:
[LeetCode 2502](https://leetcode.com/problems/design-memory-allocator/).

### 3. Correct KV-cache byte accounting

The per-token formula in Topic 25 omits the number of key/value heads. A useful
single-device, uniform-layer baseline is:

```text
bytes_per_token_per_sequence =
    2                        # K and V
    * num_layers
    * num_kv_heads
    * head_dim
    * dtype_bytes
```

Total cache size then includes sequence length and batch/request count. A
per-device formula must also state how tensor parallelism shards or replicates
KV heads. MHA, GQA, MQA, MLA, quantized caches, hybrid attention, and
layer-specific shapes change the result. vLLM’s documented cache layouts
explicitly contain the KV axis and `num_kv_heads`:
[vLLM attention cache layout](https://docs.vllm.ai/en/v0.24.0/api/vllm/v1/attention/backends/triton_attn/).

### 4. Distinguish machine epsilon from unit roundoff

Topic 04 uses “Unit Roundoff (Machine Epsilon)” as one quantity. Common
definitions distinguish:

- machine epsilon: the gap from `1` to the next larger representable number;
- unit roundoff: the maximum relative rounding error under round-to-nearest,
  commonly half that gap for binary formats.

For example, FP32 epsilon is about `1.19e-7`, while unit roundoff is about
`5.96e-8`. NumPy documents `eps` and `epsneg` separately:
[`numpy.finfo`](https://numpy.org/doc/stable/reference/generated/numpy.finfo.html).
The curriculum must state its convention and test exact representable values.

The claim that modern accelerators generally “default to BF16” is also too
broad. Precision choice depends on hardware, kernel support, model, optimizer,
and workload. Teach the range/precision tradeoff rather than a universal
preference.

### 5. Correct training-loop semantics

Topic 13 says `optimizer.zero_grad()` avoids accumulation “by default.” In
PyTorch, gradients accumulate by default; `zero_grad()` explicitly resets
them. PyTorch’s tutorial states this behavior directly:
[Zeroing out gradients](https://docs.pytorch.org/tutorials/recipes/recipes/zeroing_out_gradients.html).

Optimizer memory must be parameterized by:

- parameter dtype;
- gradient dtype;
- optimizer and its state tensors;
- whether FP32 master parameters exist;
- whether gradients are set to `None`;
- mixed-precision implementation; and
- sharding/offload assumptions.

The `16 bytes/parameter` example is a useful named configuration, not a
universal law.

### 6. Correct convolution geometry

For dilation `D`, the 1D output-size formula is:

```text
floor((W + 2P - D * (K - 1) - 1) / S) + 1
```

The simpler formula is valid only when `D = 1`. Also distinguish mathematical
convolution, which reverses the kernel, from the cross-correlation operation
commonly implemented by neural-network libraries. `col2im` is not an inverse
convolution; it scatters and accumulates contributions where extracted windows
overlap.

### 7. Correct communication cost notation

Topic 26 should use a clearly defined message-size model such as:

```text
T = alpha + message_bytes / bandwidth
```

or the equivalent `alpha + n * beta` convention. The current
`alpha + beta / B` form does not define `beta` and is corrupted in the source.

“Optimal spanning tree” must name its objective. Minimizing total edge cost,
maximum root-to-leaf completion time, congestion, and aggregate broadcast time
are different optimization problems.

### 8. Constrain broad performance claims

These claims need qualification or replacement with measurement exercises:

- Naïve matrix multiplication is not always “heavily memory-bound”; size, loop
  order, cache reuse, implementation, and hardware determine the bottleneck.
- A K-D tree does not universally fail at `D > 20`; degradation depends on
  dataset size, distribution, and intrinsic dimension.
- Ball trees do not universally overcome K-D trees.
- HNSW does not provide a general sublinear query-time guarantee.
- ADC is `O(m)` lookup-and-sum work for `m` PQ subspaces, not `O(1)` overall.
- IVF-PQ is not universally “the industry standard,” and LSH is not
  universally lower-recall than PQ.
- NCCL does not use one universal message-size threshold to select only ring
  or tree. Its available algorithms, protocols, topology, architecture, and
  tuner inputs affect selection:
  [NCCL algorithm configuration](https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2287/user-guide/docs/env.html).
- The pipeline bubble formula in Topic 29 assumes balanced stages and a
  particular idealized schedule.
- The MoE auxiliary-loss equation is one formulation, not a universal MoE
  definition.

Turn these into benchmark or simulation questions with stated assumptions
instead of presenting them as universal facts.

### 9. Correct ZeRO staging details

The high-level stage progression is right:

- Stage 1 partitions optimizer state.
- Stage 2 additionally partitions reduced gradients.
- Stage 3 additionally partitions parameters.

The exact collectives, residency, bucketing, dtype, and peak-memory behavior
depend on the implementation and configuration. The problem statement should
name its model rather than imply one universal trace. DeepSpeed documents the
stage semantics and configurable reduce-scatter/all-gather behavior:
[DeepSpeed ZeRO](https://deepspeed.readthedocs.io/en/stable/zero3.html).

Topic 28 also violates the project’s basics-first rule by placing byte
accounting in Rung 1 and the online partitioning problems in Rung 2. Put Split
Array Largest Sum and related load-balancing practice first, then introduce
the ML state model.

## Topic-by-topic decision

### Topic 01 — Matrix Shape, Indexing & Layout Foundations

**Decision:** Keep with minor edits.

The title and progression are appropriate. Make reshape, transpose, and
diagonal traversal canonical prerequisites rather than duplicating them in
Topic 02. Define whether “bytes touched” means unique accessed elements, total
load operations, or the address span; those are different values. Add full
problem contracts for flat-offset reconstruction, strides, and slice
accounting.

### Topic 02 — Tensor Strides, Views, Broadcasting & Aliasing

**Decision:** Keep with bounded specifications.

This is a strong advanced successor to Topic 01. Cross-link the shared matrix
questions. Specify the supported descriptor model for zero-copy reshape and
overlap detection; arbitrary `as_strided` overlap questions can become
surprisingly complex. Broadcasting inference, gradient reduction, view/copy
classification, and contiguity repair are excellent direct exercises.

### Topic 03 — Dense & Sparse Matrix Multiplication & SRAM Tiling

**Decision:** Keep the subject; revise framing and sourcing.

Use `Cache/SRAM Tiling` only if the exercise states whether it is:

- a Python cache simulator;
- a CPU cache-blocking benchmark;
- a CUDA shared-memory kernel; or
- a Triton kernel.

Do not pretend an ordinary Python list benchmark directly measures GPU SRAM.
Qualify the memory-bound claim, add a verifiable foundation source, and treat
MapReduce multiplication as optional distributed decomposition rather than the
culminating core exercise.

### Topic 04 — Floating-Point Representation, Precision & Stable Reductions

**Decision:** Necessary topic; substantial authoring corrections required.

Keep bit layouts, range, cancellation, non-associativity, pairwise summation,
mixed-precision accumulation, Kahan, and Welford. Correct epsilon terminology
and hardware generalizations. Add executable problems with exact input bit
patterns, reference results, ULP or relative-error tolerances, and online math
or coding references.

### Topic 05 — Integer Arithmetic, Scaling & Tensor Quantization

**Decision:** Keep with dependency and source corrections.

The bit/overflow foundations transfer well to quantization. Add exact source
URLs and define rounding, saturation, signed range, per-channel axis, and
zero-point rules. KL-based calibration depends on later probability topics;
either move that exercise after Topic 10 or make the dependency explicit.

### Topic 06 — Topological Ordering, Cycle Detection & Dependency Graphs

**Decision:** Keep.

This remains one of the strongest modules. Correct one terminology issue:
Kahn’s scheduler uses remaining prerequisites/indegree for readiness, while
tensor deallocation usually tracks remaining consumers/use counts, which
correspond to outgoing uses. Do not call both “indegree tracking.”

### Topic 07 — Dynamic Programming, Critical Paths & Liveness on DAGs

**Decision:** Keep after pruning and scoping.

All Ancestors of a Node is not required for reverse gradient accumulation;
immediate outgoing consumers and their counts are sufficient. Keep it only as
optional reachability practice. Constrain checkpoint optimization to a chain,
tree, small bounded DAG, or an explicitly defined heuristic. General optimal
rematerialization should not be implied to have a simple DP solution. Give
liveness one canonical home and cross-link it from the compiler branch.

### Topic 08 — Expression Parsing, AST Evaluation & Operator IR

**Decision:** Keep, but narrow ownership.

This module should own parsing, AST construction, typed operator nodes, shape
inference, lowering to a DAG, and serialization of an execution tape. Move
CSE, constant folding, dead-code elimination, fusion legality, and buffer
planning to the graph-compiler topic. Lisp environments and symbolic
polynomials can be optional advanced parser practice.

### Topic 09 — Calculus, Chain Rule, VJPs & Reverse-Mode Autograd

**Decision:** Keep with minor reordering.

The rebuilt ladder is strong and directly executable. Move gradient clipping
to Topic 13. Keep JVP, HVP, and Jacobian-chain ordering as optional depth rather
than prerequisites. Add exact mathematics practice sources and make
finite-difference tolerances part of the judge contract.

### Topic 10 — Loss Functions & Probability Mathematics

**Decision:** Keep; rewrite as actual problems.

Probability normalization, expectation, MSE, BCE, multiclass cross-entropy,
NLL, entropy, and KL are appropriate. The statement that the
softmax-plus-cross-entropy gradient “solves the vanishing gradient problem” is
too broad; it avoids one saturation pathway associated with particular
loss/activation combinations, not the general deep-network problem. Focal loss
is optional specialist depth. This topic currently has no direct online source
or executable contracts.

### Topic 11 — LogSumExp, Stable Softmax & Numerical Reductions

**Decision:** Keep after deduplication and semantic fixes.

Kahan belongs canonically in Topic 04. Welford also belongs in Topic 04 or a
normalization/statistics branch, not as the stress endpoint for softmax. Topic
11 should own stable LogSumExp, log-softmax, masked softmax, fused
cross-entropy, and online softmax.

The all-masked-row behavior must be part of the problem contract. Returning a
uniform distribution over invalid positions is usually wrong for attention.
Valid policies include an explicit error, an all-zero output plus a validity
flag, or framework-specific semantics; choose one and test it.

### Topic 12 — Prefix Sums, Categorical Sampling & Decoding Filters

**Decision:** Keep.

This is a coherent bridge from cumulative arrays and binary search to weighted
sampling and decoding. Make top-k/top-p canonical here and link from Topic 22.
Specify RNG, seed, batch-stream independence, floating tolerance, empty/zero
weights, and statistical test strategy. Add direct source URLs.

### Topic 13 — Optimizers & Training-Loop State

**Decision:** Necessary topic; substantial problem authoring required.

Correct `zero_grad` semantics and parameterize memory accounting. Every
optimizer update needs a precise sign convention, update order, epsilon
placement, bias correction, and weight-decay definition. Use an online ML
coding platform for foundational implementations where suitable; Deep-ML, for
example, exposes exercises for gradient-descent variants and Adam:
[Deep-ML PyTorch Basics](https://www.deep-ml.com/collections/PyTorch%20Basics).

### Topic 14 — Exact Vector Search: Similarity, Top-k & Heaps

**Decision:** Keep after repairing the copied rationale.

Replace Topic 14’s optimizer text with vector-search rationale. Remove Max Dot
Product of Two Subsequences; it is a sequence-DP problem, not an exact
retrieval primitive. Keep Mahalanobis distance optional unless a covariance
foundation is added. Exact batched search and Recall@K are good canonical
baselines for all ANN topics.

### Topic 15 — Exact Spatial Indexes: K-D, Ball & Quad Trees

**Decision:** Keep with qualified performance claims.

The branch-and-bound and bounding-region exercises are directly relevant.
Replace generic article references with exact sources or original judged
specs. Remove the universal `D > 20` threshold and the claim that Ball Trees
overcome K-D Trees. Require empirical comparison over controlled dataset size,
ambient dimension, and intrinsic dimension.

### Topic 16 — Graph-Based ANN: NSW & HNSW

**Decision:** Keep.

The new ladder is directly aligned with HNSW. Use K Closest Points as a
cross-link to Topic 14, not a duplicate. Describe `efSearch` as a search-list
size/control rather than simply a fixed-width beam, and avoid promising
sublinear complexity. Search quality should be measured against Topic 14’s
exact ground truth. Add the direct HNSW paper:
[Malkov and Yashunin](https://arxiv.org/abs/1603.09320).

### Topic 17 — IVF, Product Quantization, ADC, and LSH

**Decision:** Split.

IVF, residuals, PQ, and ADC form one coherent ladder. Random-hyperplane LSH is
an alternative ANN branch, not the named mechanism that naturally follows PQ.
Create:

1. `Inverted File Index, Product Quantization & ADC`
2. `Locality-Sensitive Hashing`

Correct ADC complexity to `O(m)` table lookups and additions for `m`
subspaces. Remove universal recall, latency, and “industry standard” rankings;
make students benchmark parameterized indexes against the exact-search
baseline.

### Topic 18 — String Matching & Trie Foundations

**Decision:** Keep with tokenizer-boundary corrections.

This is a good trie module. Greedy longest-match tokenization specifically fits
WordPiece-style lookup; BPE encoding follows learned merge ranks and is not
generally greedy longest-prefix matching. State that distinction. Aho-Corasick
is useful optional multi-pattern depth, not a tokenization prerequisite.

### Topic 19 — Subword Tokenization & BPE

**Decision:** Keep.

This is one of the most improved modules. Choose and name the exact variant:
the word-level BPE procedure in Sennrich et al., byte-level BPE, or separate
exercises for both. Do not imply that GPT, LLaMA, and Claude all use one
identical tokenizer mechanism. Add the direct source:
[Sennrich, Haddow, and Birch](https://aclanthology.org/P16-1162/).

String Compression, Word Break, and Adjacent Duplicates are only loose
foundations; pair counting and deterministic ranked merging are the true
required exercises.

### Topic 20 — Convolution Window Geometry, Im2Col & Col2Im

**Decision:** Keep after formula corrections.

The progression is appropriate. Add dilation to the output formula,
distinguish convolution from cross-correlation, and describe `col2im` as
scatter-add accumulation. Matrix Block Sum and Largest Local Values are useful
window foundations; Image Overlap is optional rather than required.

### Topic 21 — Decision Trees & Gradient Boosting

**Decision:** Keep the mechanism; revise the foundation.

LeetCode 105 proves recursive binary-tree construction but does not teach
data-driven induction. Reuse the app’s canonical tree prerequisite instead of
creating another ML-path copy, then start this module with histograms,
impurity, partitioning, and prefix-statistic split scans. The XGBoost endpoint
is appropriate and should cite:
[XGBoost](https://arxiv.org/abs/1603.02754).

Each split-finding and boosting bullet still needs a judged contract.

### Topic 22 — Scaled Dot-Product Attention, Masking & KV-Cache Geometry

**Decision:** Keep; it is a required prerequisite that Version 1 lacked.

Add executable foundation sources and exact shape rules for multi-head
attention, `d_v`, GQA/MQA, padding masks, and fully masked rows. Make cache
geometry parameterized by `num_kv_heads`, not just query heads. Remove the
duplicated top-k/top-p content and link Topic 12. Cite the ordinary attention
source and make a tested baseline implementation the oracle for Topic 23.

### Topic 23 — FlashAttention & Online Softmax Tiling

**Decision:** Keep.

This is a direct ladder once Topics 03, 11, and 22 are explicit prerequisites.
Add the source:
[FlashAttention](https://arxiv.org/abs/2205.14135).
Specify numerical tolerances and tile-edge behavior. The backward pass can be
optional advanced practice; a correct forward pass, causal handling, and I/O
model are sufficient for the core path.

### Topic 24 — Priority Queues, Event Scheduling & Continuous Batching

**Decision:** Keep after pruning.

Process Tasks Using Servers, Meeting Rooms II, Single-Threaded CPU, and
deadline scheduling transfer well. Median from Data Stream and Find K Pairs
with Smallest Sums are heap practice but do not teach scheduling; move or make
them optional prerequisites. The event simulator, admission policy, fairness,
and continuous-batching exercises need exact event ordering, tie-breaking,
capacity constraints, and metric definitions.

### Topic 25 — Block Allocation, KV-Cache Paging & PagedAttention

**Decision:** Keep the topic; block implementation until critical corrections
are made.

Correct LeetCode 2254 to 2502 and repair KV-cache accounting. LRU and In-Memory
File System are optional analogies, not core PagedAttention requirements. The
essential sequence is fixed-block allocation, logical-to-physical block
tables, append/free lifecycle, fragmentation metrics, block-table gather,
reference counting, copy-on-write, and prefix sharing. Cite:
[PagedAttention](https://arxiv.org/abs/2309.06180).

### Topic 26 — Weighted Graphs, Paths & Communication Topologies

**Decision:** Keep after cost-model corrections.

The DSA foundations are valid. Define message bytes, latency, bandwidth,
directionality, contention assumptions, and the tree objective. Treat ring
ordering as a constrained topology-mapping problem; do not casually label it
equivalent to a tractable shortest-path problem.

### Topic 27 — Circular Buffers, Modular Indexing & Ring Collectives

**Decision:** Keep with trace-level specifications.

The circular-array foundation transfers directly to rank and chunk indexing.
Because reduce-scatter/all-gather indexing depends on convention, require
simulation tests that verify every final rank receives the correct reduced
chunks. Qualify tree-root bottleneck statements and NCCL selection claims;
modern collective implementations use topology-aware trees, rings, protocols,
channels, and other algorithms rather than one fixed crossover rule.

### Topic 28 — Distributed Training State, Sharding & ZeRO

**Decision:** Keep after reordering and parameterization.

Move online partitioning/load-balancing practice to the foundation rung.
Parameterize dtype and optimizer-state byte accounting. Clarify ZeRO stage and
collective assumptions using the DeepSpeed documentation rather than treating
one trace as universal. Peak versus persistent memory and uneven alignment are
excellent stress exercises.

### Topic 29 — Parallelism & Graph Compiler Transforms

**Decision:** Split.

Compiler optimization passes do not pedagogically lead into tensor, pipeline,
and expert parallelism. Create two modules:

1. `Graph Compiler Transforms & Memory Planning`
   - CSE, constant folding, dead-code elimination;
   - shape/layout propagation;
   - fusion legality;
   - liveness and buffer reuse.
2. `Tensor, Pipeline & Expert Parallel Algorithms`
   - column/row parallel linear layers;
   - communication placement;
   - balanced pipeline partitioning;
   - micro-batch schedules and bubble simulation;
   - expert routing, capacity, and load balance.

The compiler module should depend on Topics 06–08. The parallelism module
should depend on matrix multiplication, attention, communication collectives,
and distributed-state accounting. Use the Megatron sources for the parallel
algorithms:
[Megatron-LM tensor parallelism](https://arxiv.org/abs/1909.08053) and
[composed tensor/pipeline/data parallelism](https://arxiv.org/abs/2104.04473).

## Topic-name decisions

Most Version 2 names are accurate enough to retain. Apply these changes:

- Topic 03: prefer `Dense & Sparse Matrix Multiplication & Cache/SRAM Tiling`
  and state the execution model.
- Topic 16: shorten to `Graph-Based ANN: NSW & HNSW`.
- Topic 17: split into the two titles listed above.
- Topic 21: remove the editorial `V2` marker from the heading.
- Topic 29: split into the two titles listed above.

After the two splits, the working architecture would contain 31 modules. That
is not a target count. A later merge or split is acceptable when justified by
the prerequisite graph and executable practice, not by symmetry.

## Is the number of questions adequate?

Version 2 does not provide enough information to answer with a reliable
number.

It mixes:

- online questions;
- repeated mentions of the same online question;
- concepts;
- multi-part exercises;
- mechanisms;
- benchmarks;
- optional depth; and
- reference material.

For example, “Minimal Autograd Engine” may be one large project or six
separately judgeable problems. “PagedAttention” may be one label but requires
allocator, block-table, lifecycle, gather, copy-on-write, and prefix-sharing
exercises. Counting markdown bullets would therefore be misleading.

The curriculum appears to contain enough **ideas** for a strong path, but it
does not yet prove that every topic has enough **questions**. Count only after
each exercise has a canonical record and prerequisite links.

No per-topic quota should be introduced. A topic is adequate when:

1. the learner has the necessary online DSA or math foundations;
2. at least one focused variant changes an important constraint;
3. the direct ML bridge is executable and tested;
4. the named endpoint is implemented or traced rather than merely explained;
5. stress practice exists when scale, sparsity, numerical stability, memory,
   or distribution materially changes the algorithm; and
6. no listed question exists only because its surface story resembles the ML
   topic.

## Source strategy for the next research pass

Use three distinct source classes:

1. **Online judged foundations** — LeetCode, CSES, HackerRank, or another
   verifiable problem page with exact ID, title, and URL.
2. **Online ML coding practice** — a platform exercise when it directly
   implements the required mathematics or ML primitive. Deep-ML currently
   exposes tensor, autograd, softmax, loss, convolution, SGD, Adam, and
   training-loop exercises:
   [Deep-ML PyTorch Basics](https://www.deep-ml.com/collections/PyTorch%20Basics).
3. **Primary mechanism references** — original papers and official framework
   documentation. These validate the endpoint but are not counted as judged
   questions.

Every retained source should record:

- exact title and platform ID;
- direct URL;
- source class;
- operation learned;
- destination ML mechanism;
- whether it is required or optional; and
- whether the app reuses an existing canonical problem.

Do not force every later topic to repeat a new LeetCode problem. A visible
cross-link to an earlier canonical foundation is better than artificial or
duplicated practice.

## Readiness gate

Version 2 becomes safe to implement only after all of the following are true:

- [ ] repair all corrupted notation;
- [ ] add the seven-domain map and prerequisite graph;
- [ ] split Topic 17 and Topic 29;
- [ ] correct the allocator ID and all formulas identified above;
- [ ] assign one canonical home to every shared problem or mechanism;
- [ ] provide exact URLs or explicit prerequisite cross-links;
- [ ] convert every retained custom exercise into a complete problem contract;
- [ ] label optional depth separately from required path content;
- [ ] verify primary references for every named ML algorithm;
- [ ] atomize the bank and compute unique required/optional question counts;
- [ ] validate representative ladders end to end in the app’s workspace and
  trivia model; and
- [ ] only then create the catalog migration plan.

## Final recommendation

Use Version 2 as the new research baseline because its educational direction
is much better than Version 1. Do not use its prose directly as algorithm
definitions.

The next model should perform a **normalization and authoring pass**, not
another unrestricted topic brainstorm:

1. repair the document and split the two mixed topics;
2. publish domains and prerequisites;
3. verify/canonicalize sources;
4. write complete problem contracts;
5. perform a technical review of reference Python implementations and
   visualization semantics; and
6. derive the unique question count from those records.

That sequence preserves the valuable research while preventing a second
migration built from attractive topic descriptions that cannot yet function
as rigorous practice problems.
