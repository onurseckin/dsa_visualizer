# Evaluation of the Pure ML Infrastructure DSA Curriculum

Date: 2026-07-29

Reviewed proposal:
[`ORCHESTRATED-MASTER-CURRICULUM.md`](ORCHESTRATED-MASTER-CURRICULUM.md)

Review scope: topic names, DSA and interview-problem relevance, progression
from fundamentals to ML-infrastructure algorithms, missing practice, duplicate
coverage, and source fidelity. This review intentionally excludes deployment,
MLOps administration, monitoring, governance, and incident-response content.

## Verdict

The DSA-first direction is correct, but the proposed bank is not ready to
implement.

It contains useful raw material, especially for graph ordering, DAG dynamic
programming, expression evaluation, tries, heaps, weighted graphs, spatial
indexes, convolution windows, and virtual-memory analogies. However, many
question-to-topic mappings are metaphorical rather than instructional. Several
topics reach an advanced named ML system without teaching its actual
primitives, and some foundational skills are missing entirely.

The right next action is not to preserve or reduce the current count. It is to:

1. keep the relevant online DSA questions as prerequisite exercises;
2. move tangential questions to their true topic or remove them from this path;
3. add direct, executable bridge problems for the named ML mechanism;
4. add missing mathematical and algorithmic foundation topics; and
5. derive the final count from the resulting prerequisite graph.

## Mechanical audit

The proposal contains:

- 23 topic headings;
- 232 displayed question slots;
- 216 normalized unique question titles;
- 14 duplicate-title groups occupying 30 slots;
- 107 slots with a direct URL; and
- 125 slots without a direct URL, although many of those still provide a
  recognizable LeetCode number.

The total of 232 happens to equal the former ML-bound bank size. That equality
does not demonstrate adequate coverage and should not become an implicit
constraint.

The proposal says it was organized under seven domains, but the document
contains no domain headings, prerequisite graph, difficulty sequence, or
domain-to-topic mapping. A learner cannot tell which topics are prerequisites,
parallel branches, or advanced endpoints.

### Repeated questions

Cross-topic reuse can be pedagogically useful, but it should point to one
canonical problem rather than create multiple implementations or count the
same exercise repeatedly. Repeated titles include:

- Range Sum Query 2D — Topics 01 and 09;
- Sparse Matrix Multiplication — Topics 02, 10, and 22;
- Matrix Block Sum — Topics 02 and 20;
- Course Schedule III — Topics 04 and 16;
- Parallel Courses II and III — Topics 04 and 05;
- Divide Two Integers — Topics 08 and 10;
- Find K Closest Elements — Topics 11 and 13;
- Kth Largest in a Stream — Topics 11 and 16;
- K Closest Points — Topics 11, 13, and 16;
- Cheapest Flights Within K Stops — Topics 13 and 18;
- Find the City Within a Distance Threshold — Topics 13 and 18;
- Sliding Window Maximum — Topics 16 and 20; and
- Largest Rectangle in Histogram — Topics 19 and 21.

The existing DSA registry already provides reusable canonical foundations such
as `prefix-sum`, `binary-search-1d`, `kth-largest-element`,
`topological-sort`, `dag-dp-longest-path`, `trie-prefix-tree`,
`kmp-string-match`, `dijkstra-shortest-path`, `bellman-ford`,
`floyd-warshall`, `matrix-exponentiation`, `markov-chains`, and the standard
graph traversals. The ML path should link to or share those definitions instead
of cloning them.

## Evaluation standard

Every topic should contain a progression with as many rungs as its concepts
need:

1. **Foundation:** a genuine online DSA or mathematics problem that teaches the
   underlying operation.
2. **Focused variant:** a second problem that changes the representation,
   constraint, or algorithmic technique.
3. **ML bridge:** an original problem that applies the same operation to an ML
   representation.
4. **Named mechanism:** an executable implementation or trace of the actual
   ML-infrastructure algorithm.
5. **Stress or tradeoff:** a larger, sparse, tiled, batched, distributed, or
   numerically difficult variant when that distinction matters.

Not every topic needs all five categories. A topic is adequate only when a
learner can reach its named endpoint without an unexplained conceptual jump.

An online question is relevant when solving it practices an operation reused
by the ML endpoint. A visual resemblance or shared word is insufficient.

## Topic-by-topic evaluation

### Topic 01 — Hardware Memory Layouts & Tensor Strides

**Verdict:** Rebuild and rename. The title starts at hardware while most listed
questions teach ordinary matrix traversal.

**Recommended title:** `Matrix Shape, Indexing & Layout Foundations`

**Keep as foundations:**

- Convert 1D Array Into 2D Array;
- Reshape the Matrix;
- Transpose Matrix;
- Diagonal Traverse; and
- Toeplitz Matrix as an optional stride-pattern exercise.

**Move or remove:**

- Range Sum Query 2D and Forest Queries belong to prefix sums.
- Spiral Matrix III is coordinate simulation, not tensor layout.
- Nice Matrix is symmetry/median optimization, not memory layout.
- Bilinear interpolation belongs with spatial sampling or convolution.

**Required direct additions:**

- row-major flat offset from multidimensional indices;
- reconstruct indices from a flat offset;
- shape validation and `numel` preservation;
- contiguous stride-vector construction;
- compare access order for row-major and column-major layouts; and
- calculate bytes touched for a slice.

**Adequacy:** The current count is more than enough for matrix traversal but
insufficient for the actual layout endpoint.

### Topic 02 — SRAM Tiling & Matrix Multiplication Geometry

**Verdict:** Rebuild around a dense-matmul progression. Only a few listed
questions teach multiplication.

**Recommended title:** `Dense and Sparse Matrix Multiplication & Tiling`

**Keep:**

- Sparse Matrix Multiplication;
- the HackerRank MapReduce Matrix Multiplication exercise as an optional
  decomposition variant; and
- Block-wise Matrix Multiplication as the direct endpoint.

**Move or remove:**

- Number of Submatrices That Sum to Target, Matrix Block Sum, Increment
  Submatrices, and Forest Queries are prefix/difference-array problems.
- Largest Submatrix With Rearrangements is not matrix multiplication.
- SVD power iteration and PCA eigensolvers are linear-algebra applications,
  not prerequisites for SRAM tiling.

**Required direct additions:**

- dot product;
- matrix-vector multiplication;
- naïve dense matrix multiplication with shape checks;
- loop-order comparison (`ijk`, `ikj`, and related orders);
- tiled matrix multiplication with edge tiles;
- count naïve versus tiled memory loads;
- sparse COO/CSR multiplication; and
- arithmetic-intensity or reuse calculation.

NVIDIA’s CUDA guide teaches shared-memory tiling specifically as a way to
reuse matrix elements and coalesce global-memory access. Generic 2D prefix
problems do not practice that mechanism:
[CUDA C++ Best Practices](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html).

**Adequacy:** Not adequate despite eleven entries; the direct learning ladder
is mostly absent.

### Topic 03 — Stride Vector Manipulations & Zero-Copy Views

**Verdict:** Keep as a separate advanced layout topic, but remove false
analogies and place it after Topic 01.

**Recommended title:** `Tensor Strides, Views, Broadcasting & Aliasing`

**Keep or reuse:**

- Reshape the Matrix and Rotate Image as introductory shape/view analogies;
- transpose and diagonal access as stride calculations; and
- Sparse Matrix Multiplication only in Topic 02.

**Move or remove:**

- Valid Sudoku does not teach a tensor view.
- Burst Balloons is interval DP, not matrix-chain or `einsum` path
  optimization.
- Kth Smallest in a Multiplication Table does not teach implicit GEMM or
  FlashAttention materialization.
- Matrix Exponentiation belongs to linear algebra.
- LoRA factorization and Gram style loss belong to later model/math branches,
  not zero-copy views.

**Required direct additions:**

- compute storage offsets from shape, stride, and storage offset;
- determine whether a reshape can be a view;
- transpose and slice without copying;
- detect overlapping/aliased `as_strided` views;
- broadcast-shape inference;
- reduction of broadcast gradients back to the source shape;
- basic versus advanced indexing: view or copy; and
- contiguous-copy repair.

PyTorch defines views through shared storage and constrains `view()` by shape
and stride compatibility. Broadcasting can expand dimensions without copying:
[Tensor views](https://docs.pytorch.org/docs/main/tensor_view.html),
[`Tensor.view`](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.view.html),
and [broadcasting semantics](https://docs.pytorch.org/docs/stable/notes/broadcasting.html).

**Adequacy:** Not adequate. The list repeats matrix problems but omits the
actual view rules.

### Topic 04 — Graph Topological Sorting & Cycle Detection

**Verdict:** One of the stronger topics after cleanup.

**Recommended title:** `Topological Ordering, Cycle Detection & Dependency Graphs`

**Keep:**

- Course Schedule and Course Schedule II;
- Find Eventual Safe States;
- Parallel Courses;
- Sort Items by Groups Respecting Dependencies;
- Sequence Reconstruction;
- Find All Possible Recipes; and
- Build a Matrix With Conditions.

**Move or consolidate:**

- CSES Course Schedule duplicates the core topological-sort skill and can be a
  variant rather than a separate canonical implementation.
- Course Schedule III is greedy heap scheduling, not topological sorting.
- Parallel Courses II is bitmask DP and belongs in an advanced scheduling
  branch.
- Parallel Courses III belongs primarily in DAG DP/critical-path practice.
- Minimum Number of Vertices to Reach All Nodes is useful indegree reasoning
  but does not teach cycle detection.

**Required ML bridges:**

- validate an operator graph and report a cycle;
- produce deterministic execution order with tie-breaking;
- reverse topological order for backward execution; and
- maintain consumer/use counts for dependency release.

**Adequacy:** Adequate DSA coverage; missing direct computation-graph bridges.

### Topic 05 — Dynamic Programming on Computation DAGs

**Verdict:** Strong foundation with several classification errors.

**Recommended title:** `Dynamic Programming, Critical Paths & Liveness on DAGs`

**Keep:**

- Longest Flight Route;
- Game Routes;
- Largest Color Value in a Directed Graph;
- Longest Increasing Path in a Matrix as a memoized implicit-DAG variant;
- Parallel Courses III;
- All Ancestors of a DAG; and
- All Paths From Source to Target as traversal practice.

**Move:**

- Parallel Courses II is subset/bitmask scheduling, not ordinary DAG DP.

**Required ML bridges:**

- forward shape/value propagation;
- reverse gradient accumulation counts;
- critical-path cost on an operator DAG;
- activation last-use/liveness analysis;
- minimum peak live-memory simulation;
- checkpoint/recompute choice on a chain or small DAG; and
- ready-queue scheduling with dependency counters.

**Adequacy:** Good DSA quantity; add direct liveness and computation-DAG
problems.

### Topic 06 — Stack-Based Mathematical Tapes & AST Evaluation

**Verdict:** Useful topic with an unclear name and too much language-parser
depth.

**Recommended title:** `Expression Parsing, AST Evaluation & Operator IR`

**Keep:**

- Evaluate Reverse Polish Notation;
- Basic Calculator;
- build/evaluate expression trees;
- infix-to-expression-tree conversion;
- Parse Lisp Expression as an advanced evaluator; and
- Basic Calculator IV as optional symbolic manipulation.

**Move or make optional:**

- Lambda-calculus reductions are not a necessary autograd prerequisite.
- Minimum Cost to Change an Expression is a specialized boolean DP task.

**Required ML bridges:**

- build a typed operator graph from an expression;
- infer shapes through an AST;
- common-subexpression detection;
- constant folding;
- dead-node elimination; and
- serialize a small operator tape for reverse traversal.

**Adequacy:** Adequate parser practice; direct operator-IR work is missing.

### Topic 07 — Vector-Jacobian Products & Autograd Engine

**Verdict:** Critical redesign. The proposed list begins far beyond the
prerequisites and includes specialist material that does not teach basic
autograd.

**Keep as later depth:**

- forward-mode JVP;
- Hessian-vector product;
- matrix-chain order for Jacobian accumulation; and
- gradient clipping as training-state practice.

**Move or remove from the required path:**

- Sparse Matrix Multiplication is not an introduction to VJPs.
- Conjugate Gradient belongs to numerical linear solvers.
- Neural ODE integrators are specialist model/research content, not an
  autograd-engine essential.

**Required additions before those items:**

- scalar derivatives and local derivative rules;
- chain rule on a small expression tree;
- forward values plus saved intermediates;
- reverse topological traversal;
- gradient accumulation at a fan-out/fan-in node;
- VJP for add, multiply, matrix multiply, reduction, reshape, and broadcast;
- finite-difference gradient checking;
- detach/stop-gradient behavior; and
- implement a minimal reverse-mode scalar or tensor autograd engine.

PyTorch describes autograd as a dynamically recorded DAG traversed in reverse
using the chain rule, and its beginner material introduces VJPs before
higher-order products:
[Autograd mechanics](https://docs.pytorch.org/docs/stable/notes/autograd) and
[Autograd fundamentals](https://docs.pytorch.org/tutorials/beginner/introyt/autogradyt_tutorial.html).

**Adequacy:** Not adequate. Seven advanced names do not replace the missing
fundamental ladder.

### Topic 08 — Numerically Stable LogSumExp & Softmax

**Verdict:** Critical redesign. Four linked GeeksforGeeks pages are explanatory
articles rather than judged DSA exercises, and three online questions are
unrelated.

**Keep as a weak prerequisite:**

- Pow(x, n) can practice exponentiation but does not teach floating-point
  stability.

**Move or remove:**

- Divide Two Integers belongs to integer arithmetic/quantization.
- Coin Piles is unrelated.
- The GeeksforGeeks pages should be references, not counted as practice
  problems.

**Required direct additions:**

- detect overflow/underflow in naïve exponentiation sums;
- stable two-term and vector LogSumExp;
- stable softmax;
- log-softmax;
- fused softmax cross-entropy;
- online softmax state update and merge;
- masked softmax with all-masked-row handling;
- Kahan or pairwise summation;
- stable mean/variance update; and
- temperature scaling as a later ML bridge.

These problems also justify a separate earlier topic on floating-point formats,
rounding, cancellation, and reductions.

**Adequacy:** Not adequate. The named mechanism lacks executable problems.

### Topic 09 — Prefix Sums & Weighted Probability Sampling

**Verdict:** Useful topic after removing unrelated specialist mathematics.

**Recommended title:** `Prefix Sums, Categorical Sampling & Decoding`

**Keep:**

- Product of Array Except Self;
- one 1D and one 2D range-sum problem;
- Random Pick with Weight;
- Random Point in Non-overlapping Rectangles;
- Alias Method;
- top-p sampling; and
- optionally Rand10 from Rand7 as a distribution-transformation exercise.

**Move or remove:**

- Random Pick with Blacklist is hash remapping, not weighted prefix sampling.
- Gumbel-Softmax is differentiable-estimator theory and not necessary for ML
  infrastructure fundamentals.
- Wasserstein distance belongs to probability/optimal transport, not this
  sampling ladder.

**Required additions:**

- deterministic seeded categorical sampling;
- binary search over a cumulative distribution;
- alias-table construction and sampling;
- temperature plus top-k/top-p filtering;
- stable renormalization after filtering;
- batched sampling with independent RNG streams; and
- reservoir sampling as an optional streaming bridge.

**Adequacy:** Nearly adequate after direct ML bridges are specified.

### Topic 10 — Fixed-Point INT8 Affine Quantization Math

**Verdict:** Critical redesign. Bit-manipulation questions are only distant
prerequisites, and Focal Loss is unrelated.

**Recommended title:** `Integer Arithmetic, Scaling & Tensor Quantization`

**Keep as prerequisites:**

- Reverse Integer for overflow detection;
- Divide Two Integers;
- Sum of Two Integers; and
- selected bit-range operations.

**Move or remove:**

- Sparse Matrix Multiplication belongs to matrix kernels.
- Focal Loss belongs to loss functions.
- the Codeforces AND problem does not establish quantization competence.
- the straight-through estimator belongs to optional quantization-aware
  training after inference quantization.

**Required direct additions:**

- signed and unsigned range calculation;
- saturating clamp and round-to-nearest behavior;
- derive scale and zero point from a range;
- quantize and dequantize a tensor;
- symmetric versus asymmetric mapping;
- per-tensor versus per-channel parameters;
- INT8 multiplication with INT32 accumulation;
- requantize an accumulator into the output range;
- calibration and clipping error;
- compare quantization error by tensor/channel/group; and
- pack/unpack low-bit values as optional depth.

The official PyTorch formula explicitly includes division by scale, zero point,
clamping, and dequantization; it also distinguishes per-tensor and per-channel
schemes:
[PyTorch quantization reference](https://docs.pytorch.org/docs/stable/quantization-support).

**Adequacy:** Not adequate. The most important direct problems are missing.

### Topic 11 — Distance Metrics & Ranked Heap Searches

**Verdict:** Solid foundation with several tangential geometry problems.

**Recommended title:** `Exact Vector Search: Similarity, Top-k & Heaps`

**Keep:**

- Kth Largest Element;
- Find K Closest Elements;
- Kth Largest in a Stream;
- K Closest Points;
- Dot Product of Two Sparse Vectors;
- Max Dot Product as optional DP depth; and
- Mahalanobis distance as optional advanced metric work.

**Move or remove:**

- Minimum Spanning Tree on points, minimizing Manhattan distances, and closest
  pair do not teach ranked vector retrieval.

**Required additions:**

- L1, L2, squared L2, dot product, and cosine;
- normalization and cosine/dot-product equivalence;
- brute-force exact top-k over dense vectors;
- sparse cosine similarity;
- stable tie-breaking;
- bounded max-heap versus full sort;
- batch-query exact search; and
- recall@k comparison for later approximate indexes.

**Adequacy:** Close, but the metric and exact-search bridges need explicit
problems.

### Topic 12 — Spatial Partition Trees

**Verdict:** Correct topic family but under-specified.

**Recommended title:** `Exact Spatial Indexes: K-D, Ball & Quad Trees`

**Keep:**

- K-D tree insert/search;
- quadtree construction and queries;
- Ball Tree search; and
- one multidimensional range-search problem.

**Move or make optional:**

- Forest Queries is a 2D prefix-sum problem, not a spatial tree.
- Hyperbolic/Poincaré distance is specialist geometry and not a prerequisite
  for K-D trees.

**Required additions:**

- median-selection K-D tree build;
- axis choice;
- bounding-box lower bound;
- nearest-neighbor branch-and-bound;
- k-nearest search with a bounded heap;
- range search;
- deletion/rebuild tradeoff as optional depth; and
- demonstrate K-D degradation as dimensionality rises.

**Adequacy:** Needs several direct construction and pruning exercises.

### Topic 13 — Multi-Layer Skip Graphs & HNSW Graph Search

**Verdict:** Critical redesign and rename.

**Recommended title:** `Graph-Based Approximate Nearest Neighbor Search: NSW & HNSW`

HNSW is a hierarchy of navigable small-world proximity graphs. Its paper notes
an analogy to skip lists, but it is not a skip graph:
[HNSW paper](https://arxiv.org/abs/1603.09320).

**Keep as prerequisites:**

- Design Skiplist only as an analogy for randomized levels;
- K Closest Points or exact top-k as a prerequisite; and
- one weighted best-first graph search.

**Move:**

- Cheapest Flights and threshold-city shortest paths belong to weighted
  graphs.
- Asymmetric Distance Computation belongs to IVF/PQ.
- random-hyperplane LSH belongs to a separate hashing/ANN topic.

**Required direct additions:**

- greedy search on a proximity graph;
- candidate and result heaps;
- `efSearch` beam expansion with a visited set;
- randomized HNSW level assignment;
- upper-layer greedy descent;
- insertion at one layer;
- heuristic neighbor selection/pruning;
- compare recall, visited nodes, and `efSearch`; and
- compare exact search, K-D tree, and HNSW on increasing dimensions.

**Adequacy:** Not adequate. None of the listed questions implements the central
HNSW search or insertion algorithm.

### Topic 14 — Character & Subword Tries

**Verdict:** Strong DSA bank, but the title overclaims subword tokenization.

**Recommended title:** `String Matching & Trie Foundations`

**Keep:**

- Implement Trie;
- Add and Search Word;
- Replace Words;
- Search Suggestions;
- Word Search II;
- Word Combinations;
- Prefix and Suffix Search; and
- Aho-Corasick as optional multi-pattern depth.

**Move or make optional:**

- Longest Common Prefix does not require a trie.
- Palindrome Pairs and Concatenated Words are advanced variants, not required
  tokenizer prerequisites.
- Stream of Characters is useful only if the path wants an online suffix-trie
  variant.

**Required bridge additions:**

- longest-prefix token lookup;
- greedy longest-match tokenization;
- vocabulary ID lookup;
- unknown-token fallback; and
- compact trie memory accounting.

**Adequacy:** More than adequate for tries; it still needs explicit tokenizer
bridges.

### Topic 15 — Byte-Pair Encoding & Pair Merging

**Verdict:** Critical redesign. The separate
[`TOPIC-15-AUDIT.md`](TOPIC-15-AUDIT.md) repeats the list but does not audit it.
None of the twelve questions implements BPE training or merge-rank encoding.

**Keep as loose foundations:**

- String Compression;
- Word Break as a segmentation contrast; and
- Remove Adjacent Duplicates only as an elementary local-merge exercise.

**Move or remove:**

- substring search, Remove Duplicate Letters, Reorganize String,
  repeat-limited strings, longest happy prefix, shortest palindrome, and CSES
  String Matching do not teach BPE.
- Word Break II is an expensive enumeration task unrelated to deterministic
  BPE merge ranks.

**Required direct additions:**

- count adjacent pairs in a token sequence;
- deterministic most-frequent-pair selection with tie-breaking;
- apply one merge and update affected counts;
- train BPE for a fixed number of merges;
- encode using a learned merge-rank table;
- byte-level pretokenization and UTF-8 boundary handling;
- preserve word/end-of-word boundaries where the chosen BPE variant requires
  them; and
- compare naïve rescanning with incremental heap/count updates.

The original subword-NMT work applies BPE through repeated pair merging; that
mechanism is absent from the proposed online problems:
[Sennrich, Haddow, and Birch](https://aclanthology.org/P16-1162/).

**Adequacy:** Not adequate. This is the clearest example of many questions but
no direct endpoint.

### Topic 16 — Priority Queues & Continuous Batching Scheduling

**Verdict:** Good scheduling foundation with irrelevant heap examples and no
continuous-batching simulator.

**Recommended title:** `Priority Queues, Discrete-Event Scheduling & Continuous Batching`

**Keep:**

- Task Scheduler;
- Process Tasks Using Servers;
- Meeting Rooms II;
- Single-Threaded CPU;
- Course Schedule III;
- Find K Pairs with Smallest Sums as a heap-merge variant;
- Median from Data Stream as optional multi-heap practice; and
- sliding-window maximum only if explicitly teaching deque versus heap.

**Move or remove:**

- Skyline is sweep-line geometry.
- IPO and Refueling Stops are greedy selection, not request scheduling.
- Design Twitter, Kth Largest, and K Closest repeat other topics.
- Beam-search length penalty and speculative-decoding sampling are decoding
  algorithms, not batching schedulers.

**Required direct additions:**

- arrival/completion event simulation;
- FCFS and shortest-remaining-work queues;
- token-budget admission;
- iteration-level removal and admission;
- prefill versus decode work accounting;
- waiting-time aging/fairness;
- chunked-prefill scheduling;
- preemption and resume;
- throughput, mean latency, and tail-latency calculation; and
- compare static batching with iteration-level scheduling.

Orca’s defining mechanism is iteration-level scheduling, where a batch can
change between model iterations:
[Orca, OSDI 2022](https://www.usenix.org/conference/osdi22/presentation/yu).

**Adequacy:** DSA quantity is high; the named ML-infrastructure endpoint is
missing.

### Topic 17 — Circular Arrays & Ring Modulo Arithmetic

**Verdict:** Salvageable after removing unrelated problems and making the
collective-communication endpoint explicit.

**Recommended title:** `Circular Buffers, Modular Indexing & Ring Collectives`

**Keep:**

- Rotate Array;
- Design Circular Queue;
- Circular Array Loop;
- shortest distance in a circular array;
- Next Greater Element II as optional circular traversal; and
- Ring AllReduce as the ML endpoint.

**Move or remove:**

- Max Sum Circular Subarray is useful circular DP but not needed for
  collectives.
- Min Moves Equal Array II is not a circular-array problem.
- generic ring-topology articles are references, not judged exercises.

**Required direct additions:**

- circular buffer enqueue/dequeue with wraparound;
- split a tensor into rank-owned chunks;
- reduce-scatter step indexing;
- all-gather step indexing;
- ring AllReduce trace;
- bytes transferred and step-count calculation;
- uneven chunk padding; and
- compare ring with a tree collective on a simple latency/bandwidth model.

**Adequacy:** Needs direct collective problems.

### Topic 18 — Network Delay & Cluster Graph Traversals

**Verdict:** Good shortest-path set, but the title and ML bridge are vague.

**Recommended title:** `Weighted Graphs, Network Paths & Communication Topologies`

**Keep:**

- Network Delay Time;
- Dijkstra/CSES Shortest Routes I;
- Bellman-Ford-style bounded flights;
- Floyd-Warshall/CSES Shortest Routes II;
- Path With Minimum Effort as a minimax variant; and
- Find the City as an all-pairs/threshold variant.

**Move or make optional:**

- Swim in Rising Water duplicates minimax path reasoning if Path With Minimum
  Effort is retained.

**Required direct additions:**

- model a device/interconnect topology as a weighted graph;
- compute latency versus bandwidth-weighted path cost;
- shortest path under a message-size-dependent edge weight;
- construct a spanning tree for broadcast/reduction;
- topology-aware ring ordering; and
- compare path, ring, and tree communication cost.

**Adequacy:** Adequate generic shortest paths; missing cluster-communication
bridges.

### Topic 19 — Memory Partitioning Algorithms

**Verdict:** Critical redesign. The generic partition questions do not
collectively teach ZeRO, while pipeline and expert parallelism broaden the
topic beyond its title.

**Recommended title:** `Distributed Training State, Sharding & ZeRO`

**Keep as foundations:**

- Split Array Largest Sum;
- Capacity to Ship Packages;
- one fair-partition or load-balancing problem; and
- DeepSpeed ZeRO memory accounting.

**Move or remove:**

- Koko Eating Bananas is generic binary search and adds little after capacity
  partitioning.
- Largest Rectangle is unrelated.
- Work Sessions, Cookies, and Maximum Tasks are different combinatorial
  problems and do not teach tensor-state sharding.
- pipeline bubble scheduling and MoE token routing deserve separate advanced
  topics.
- tensor-parallel split boundaries belong to a general parallelism topic.

**Required direct additions:**

- parameter, gradient, optimizer-state, and activation byte accounting;
- data-parallel replicated baseline;
- ZeRO-1 optimizer-state partition;
- ZeRO-2 gradient partition;
- ZeRO-3 parameter partition;
- all-gather and reduce-scatter trace;
- uneven shard padding/alignment;
- peak versus persistent memory calculation;
- compare memory and communication by stage; and
- choose data/tensor/pipeline sharding for a constrained shape only after the
  required parallelism foundations.

The ZeRO stages partition optimizer states, then gradients, then parameters:
[Microsoft Research ZeRO summary](https://www.microsoft.com/en-us/research/blog/zero-deepspeed-new-system-optimizations-enable-training-models-with-over-100-billion-parameters)
and [ZeRO paper](https://www.microsoft.com/en-us/research/publication/zero-memory-optimizations-toward-training-trillion-parameter-models/).

**Adequacy:** Not adequate. The direct memory-state sequence is missing.

### Topic 20 — Spatial Convolutions & Im2Col Window Sliding

**Verdict:** Good endpoint with an incomplete foundation ladder.

**Recommended title:** `Convolution Window Geometry, Im2Col & Col2Im`

**Keep:**

- Matrix Block Sum;
- Largest Local Values;
- Image Overlap;
- Im2Col;
- Col2Im; and
- strided/dilated convolution.

**Move or use only as a weak analogy:**

- Sliding Window Maximum is a deque problem, not convolution.
- Convert 1D Array to 2D belongs to shape foundations.

**Required additions:**

- naïve 1D convolution/cross-correlation;
- output-size calculation with kernel, padding, stride, and dilation;
- naïve multi-channel 2D convolution;
- explicit receptive-field trace;
- im2col shape and index mapping;
- GEMM result reshaping;
- col2im overlap accumulation; and
- grouped/depthwise convolution as optional depth.

**Adequacy:** Salvageable, but add the direct convolution basics before
im2col.

### Topic 21 — Decision Trees & Hessian Leaf Weight Math

**Verdict:** Critical redesign. Ordinary binary-tree problems do not teach
decision-tree induction or gradient boosting.

**Recommended title:** `Decision Trees, Histograms & Gradient Boosting`

**Keep as a minimal prerequisite:**

- one binary-tree traversal/construction problem, preferably linked from the
  existing DSA tree topic; and
- XGBoost second-order gain as a later endpoint.

**Move or remove:**

- Maximum Subarray and Largest Rectangle are unrelated.
- Unique BST counts, Count Complete Nodes, Guess the Word, and Minimum Cost
  Tree do not teach feature splits.
- reconstructing a binary tree is useful general DSA but not sufficient ML
  preparation.

**Required direct additions:**

- class-count histogram;
- entropy and Gini impurity;
- scan sorted feature values for the best split using prefix statistics;
- partition rows by a threshold;
- handle missing-value default direction;
- predict with a learned tree;
- residual fitting for gradient boosting;
- sum gradients and Hessians per bin;
- XGBoost leaf weight and split gain;
- weighted quantile sketch or histogram binning as advanced depth; and
- cache-friendly histogram construction.

XGBoost’s systems contribution includes sparsity-aware learning, a weighted
quantile sketch, cache behavior, compression, and sharding—not generic binary
tree manipulation:
[XGBoost paper](https://arxiv.org/abs/1603.02754).

**Adequacy:** Not adequate. Seven of eight entries do not teach the named
algorithm.

### Topic 22 — FlashAttention Online Softmax Tiling

**Verdict:** Critical redesign. It skips ordinary attention and relies on
unrelated range/rectangle problems.

**Recommended title:** Keep `FlashAttention & Online Softmax Tiling`, but add a
separate prerequisite topic for ordinary attention, masks, and KV-cache
geometry.

**Keep or move into prerequisites:**

- block matrix tiling;
- Sparse Matrix Multiplication only as optional sparse-attention depth;
- online softmax; and
- causal scaled dot-product attention.

**Move or remove:**

- static range minimum, maximal rectangle, subrectangle queries, and diagonal
  traversal do not teach FlashAttention.
- 2D mutable range sums are a data-structure topic, not an attention
  prerequisite.

**Required additions:**

- compute `QKᵀ`;
- apply scaling and a causal/padding mask;
- row-wise stable softmax;
- multiply probabilities by `V`;
- calculate score-matrix memory;
- online softmax combine for two blocks;
- tiled attention with running max, normalizer, and value accumulator;
- compare tiled output with ordinary exact attention;
- causal block skipping; and
- count HBM reads/writes in naïve versus tiled attention.

FlashAttention is an exact attention algorithm whose defining ideas are IO
awareness, HBM/SRAM tiling, and fewer memory reads/writes:
[FlashAttention paper](https://arxiv.org/abs/2205.14135).

**Adequacy:** Not adequate. The central attention and online-reduction ladder
is missing.

### Topic 23 — PagedAttention Block Virtual Memory Paging

**Verdict:** Salvageable, but several general data-structure questions are
unrelated.

**Recommended title:** `Block Allocation, KV-Cache Paging & PagedAttention`

**Keep as foundations:**

- LRU Cache as an optional cache-policy exercise;
- Design Memory Allocator;
- Design File System or In-Memory File System only for hierarchical mapping;
- Page Faults in LRU as a virtual-memory analogy; and
- PagedAttention block table/COW as the endpoint.

**Move or remove:**

- Insert Delete GetRandom;
- Copy List with Random Pointer;
- All O(1) Data Structure; and
- LFU unless a later prefix-cache eviction topic explicitly needs it.

**Required additions:**

- free-list fixed-block allocator;
- logical-token to physical-block translation;
- allocate/append/free a sequence;
- internal and external fragmentation calculation;
- KV-cache bytes per token/layer/head;
- reference counting and copy-on-write;
- prefix/block sharing;
- gather K/V through a block table; and
- schedule admission based on available blocks.

PagedAttention addresses dynamic KV-cache growth, fragmentation, and sharing
through paging-inspired block management:
[PagedAttention paper](https://arxiv.org/abs/2309.06180).

**Adequacy:** Close as a concept family, but only one current entry reaches the
actual endpoint.

## Missing standalone topics

The current 23 topics should not be treated as complete. At least these
standalone learning surfaces are missing or compressed into advanced topics:

### Vector, matrix, and tensor algebra

Before tiling, autograd, attention, and vector search, the learner needs direct
practice with:

- vector addition/scaling;
- dot and outer products;
- matrix-vector and matrix-matrix multiplication;
- transpose and batched dimensions;
- reductions by axis;
- norms and normalization;
- broadcasting; and
- shape inference.

These should not be hidden under “hardware memory layouts.”

### Floating-point representation and stable reductions

The curriculum needs:

- FP sign/exponent/mantissa interpretation;
- unit roundoff and representable range;
- overflow, underflow, and cancellation;
- accumulation-order effects;
- pairwise/Kahan sum;
- online mean and variance; and
- FP16/BF16/FP32 accumulation choices.

This topic should precede LogSumExp, quantization, FlashAttention, and
distributed reduction.

### Calculus and chain-rule foundations

VJPs require earlier practice with scalar derivatives, partial derivatives,
chain rule, Jacobian shapes, and local derivative composition.

### Loss functions and probability mathematics

The current list jumps to softmax derivatives, Focal Loss, and sampling without
teaching:

- probability normalization;
- log likelihood;
- binary and multiclass cross-entropy;
- entropy/KL divergence;
- mean squared error;
- expected value and variance; and
- gradients of common losses.

### Optimizers and training-loop state

There is no coherent practice for:

- batch and mini-batch gradient descent;
- SGD;
- momentum;
- RMSProp;
- Adam/AdamW moment updates and bias correction;
- gradient accumulation;
- zeroing gradients;
- learning-rate schedules; and
- optimizer-state memory accounting.

This omission directly weakens the later ZeRO topic because ZeRO shards
training state. PyTorch’s optimizer API explicitly maintains parameter state
and implements SGD, Adam, AdamW, and related algorithms:
[PyTorch optimizers](https://docs.pytorch.org/docs/main/optim.html).

### Ordinary attention, masks, KV cache, and decoding

FlashAttention and PagedAttention cannot be the first attention topics. Add
practice for:

- scaled dot-product attention;
- causal and padding masks;
- multi-head shape transformations;
- prefill versus one-token decode;
- KV-cache append and lookup;
- top-k/top-p token selection; and
- beam/speculative decoding only after ordinary decoding.

### IVF, product quantization, and LSH

Topic 13 contains ADC and LSH even though neither is HNSW. If these techniques
remain in scope, give them their own branch after exact vector search:

- coarse centroid assignment;
- inverted lists;
- vector residuals;
- product-quantizer subspaces/codebooks;
- ADC lookup tables;
- random-hyperplane LSH; and
- recall/memory/latency comparisons.

### Graph compiler transforms and memory planning

Topic 06 provides parsing foundations but never reaches compiler algorithms:

- common-subexpression elimination;
- constant folding;
- dead-code elimination;
- pattern matching and operator fusion;
- topological partitioning;
- buffer liveness and reuse;
- layout propagation; and
- fusion legality under dependencies.

### Parallelism beyond ZeRO

The current ZeRO topic also contains pipeline, tensor, and expert parallelism.
These need either distinct advanced topics or an explicitly structured
parallelism topic covering:

- tensor partition dimensions;
- pipeline stage partitioning;
- microbatch schedules and bubble fraction;
- expert token routing and load balance; and
- composition with data parallelism.

## Recommended seven-domain structure

This is a coverage structure, not a fixed topic or problem count.

### Domain A — Tensor and numerical foundations

- Matrix shape, indexing, and traversal
- Tensor storage, strides, views, broadcasting, and aliasing
- Vector/matrix/tensor algebra
- Dense and sparse matrix multiplication
- Memory hierarchy, tiled GEMM, scans, and reductions
- Floating-point representation and numerical stability
- Integer arithmetic and tensor quantization

### Domain B — Computation graphs and training algorithms

- Topological ordering and cycle detection
- DAG DP, critical paths, liveness, and checkpointing
- Expression parsing, ASTs, and operator IR
- Calculus, chain rule, JVPs, and VJPs
- Reverse-mode autograd and gradient accumulation
- Loss functions and probability mathematics
- Prefix/categorical sampling and decoding filters
- Optimizers and training-loop state

### Domain C — Retrieval and indexing algorithms

- Exact vector similarity and top-k search
- K-D, Ball, and Quad Trees
- Graph ANN with NSW/HNSW
- IVF, PQ/ADC, and LSH as an advanced branch

### Domain D — Text representation algorithms

- String matching and trie foundations
- Subword tokenization and BPE

### Domain E — Model operator algorithms

- Convolution geometry, im2col, and col2im
- Decision trees, histograms, and gradient boosting
- Scaled dot-product attention, masking, KV cache, and decoding
- FlashAttention and online softmax tiling

### Domain F — Serving schedulers and memory algorithms

- Discrete-event queues and continuous batching
- Fixed-block allocation, KV paging, and PagedAttention

### Domain G — Distributed and compiled execution

- Weighted graph topology and communication cost
- Ring/tree collectives and reduce-scatter/all-gather
- Distributed training state and ZeRO
- Tensor, pipeline, context, and expert parallel algorithms
- Graph transforms, fusion, and buffer-memory planning

This structure contains more conceptual surfaces than the current 23 because
several advanced titles currently hide multiple prerequisite subjects. It also
makes branching possible: decision-tree systems, convolution kernels, vector
retrieval, distributed training, and LLM serving do not need to be forced into
one single chain.

## Source and authoring requirements

### Online problems

For every online DSA problem record:

- canonical platform;
- exact title and problem number/slug;
- direct URL;
- platform difficulty;
- the specific reusable operation;
- target topic and learner stage; and
- whether an equivalent problem already exists in the local 88-item DSA bank.

Use the online problem as provenance and inspiration. Author an original local
description, examples, explanation, visualization, and tests rather than
copying proprietary prompt text.

### Articles are not practice problems

GeeksforGeeks tutorials, framework documentation, and papers can support
technical accuracy. They should be labeled `reference`, not counted as online
judge questions unless they expose a real executable problem with a judge
contract.

The proposal currently uses vague labels such as “GFG Online Softmax
Calculation,” “GFG Block Matrix Tiling,” and “GFG Ring Topology Data Transfer”
without exact links. Those are not auditable problem records.

### Custom ML bridge problems

Every custom problem needs:

- a primary paper or official technical reference;
- a precise input/output or state-transition contract;
- a canonical Python solution;
- authored edge cases;
- a visualization that exposes the governing state when useful;
- an explicit abstraction boundary when simulating hardware/framework
  behavior; and
- a difficulty justified by operations and prerequisites.

## Count conclusion

The current quantity is neither globally “too small” nor “good enough.”

- Some topics are overfilled with tangential online questions: Topics 03, 14,
  16, 19, and 21.
- Some show many entries but almost no direct practice of the named mechanism:
  Topics 07, 08, 10, 13, 15, 22, and 23.
- Some are close after cleanup and bridge additions: Topics 04, 05, 06, 09,
  11, 12, 17, 18, and 20.
- Topics 01–03 need boundary and ordering changes before their counts can be
  judged.
- Several missing foundation topics need their own questions.

The final bank may be smaller than 232 after duplicates and unrelated analogies
are removed, or larger after genuine foundation ladders are added. Either
outcome is acceptable. The correct count is the number of distinct exercises
needed to make every dependency edge learnable.

## Readiness gate before implementation

Do not migrate the catalog from this proposal until:

1. the seven domains and prerequisite DAG are explicit;
2. topic names match the mechanisms they teach;
3. every current slot has a keep, move, merge, reference, or remove decision;
4. every retained online question has a direct canonical URL;
5. existing DSA definitions are cross-linked instead of cloned;
6. every topic has a direct ML bridge and named-mechanism exercise;
7. the missing foundation topics are filled;
8. custom problems have technical sources and executable contracts;
9. difficulty is assigned after the progression is known; and
10. the owner reviews one complete foundation-to-ML ladder before any mass
    implementation.
