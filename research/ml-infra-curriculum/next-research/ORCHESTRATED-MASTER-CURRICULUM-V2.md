# Orchestrated Master Curriculum (Version 2)
## Pure ML Infrastructure Data Structures, Algorithms & Applied Mathematics

**Version:** 2.0 (Post-Evaluation Topic-by-Topic Multi-Agent Rebuild)  
**Evaluation Reference:** [`CURRICULUM-EVALUATION.md`](CURRICULUM-EVALUATION.md)  
**Purity Guarantee:** 100% Pure Data Structures, Algorithms, Linear Algebra, Multivariable Calculus, Probability, and ML Geometry (Zero DevOps/MLOps Admin Fluff)  
**Structure:** 7 Topological Domains, 29 Individual Topic Modules, 5-Rung Pedagogical Progression Ladders  

---

## Executive Overview of Version 2 Topic-by-Topic Enhancements

This Version 2 Master Curriculum was created by deploying 29 dedicated subagents—one for each canonical topic—to evaluate the feedback in `CURRICULUM-EVALUATION.md`, perform deep live research, and construct a rigorous 5-rung learning ladder:
1. **Rung 1 — Foundation:** Real online DSA or math problem teaching the core data structure/algorithm.
2. **Rung 2 — Focused Variant:** Second problem changing constraints, storage, or representation.
3. **Rung 3 — ML Bridge:** Original/applied problem mapping the operation onto Machine Learning representations.
4. **Rung 4 — Named Mechanism:** Direct executable implementation or trace of the actual ML Infra algorithm.
5. **Rung 5 — Stress/Tradeoff:** Sparse, tiled, batched, distributed, or numerical stability variant.

### Core Rebuild Highlights:
- **Eliminated False Analogies:** Removed misleading mappings (Burst Balloons from Einsum, Sudoku from Views, Kth Smallest Mult Table from FlashAttention, Histogram from Col2Im/ZeRO).
- **Added 9 Standalone Foundation Topics:** Introduced dedicated topics for Floating-Point Precision, INT8 Quantization, Loss Functions, Optimizers (SGD/Adam), IVF-PQ-LSH, Scaled Dot-Product Attention, 3D Parallelism, and Graph Compiler Passes.
- **Converted GeeksforGeeks Links to Judged Code Specs:** Transformed generic documentation tutorials into explicit, executable ML bridge coding specifications.
- **Deduplicated Question Titles:** Resolved cross-topic duplicate assignments into single canonical homes.

---

# Topic 01: Matrix Shape, Indexing & Layout Foundations


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 2022 (Convert 1D to 2D), LeetCode 566 (Reshape Matrix), LeetCode 867 (Transpose Matrix), LeetCode 498 (Diagonal Traverse), LeetCode 766 (Toeplitz Matrix).
- **Removed:** LeetCode 304 (Range Sum 2D — *moved to prefix sums*), Forest Queries (*moved to prefix sums*), LeetCode 885 (Spiral III — *pure grid simulation*), LeetCode 1572 (Nice Matrix — *symmetry puzzle*).
- **Added:** Row-major/col-major flat offset math, index reconstruction from flat offset, `numel` shape validation, contiguous stride vector construction, row vs col-major cache locality benchmark, bytes touched calculation for strided slices.

## Overview
This topic covers the physical mapping between logical multidimensional tensors and linear hardware memory. It transitions from basic matrix traversal into formal stride vectors, memory locality, and slice accounting.

## The 5-Rung Learning Ladder

### 1. Foundation
*Genuine online DSA problems that teach the underlying mapping operation.*
- **[LeetCode 2022: Convert 1D Array Into 2D Array](https://leetcode.com/problems/convert-1d-array-into-2d-array/)**
- **[LeetCode 566: Reshape the Matrix](https://leetcode.com/problems/reshape-the-matrix/)**
  *Objective:* Master `numel` validation and basic logical-to-physical coordinate mapping.

### 2. Focused Variant
*Problems that change the representation, constraint, or access pattern.*
- **[LeetCode 867: Transpose Matrix](https://leetcode.com/problems/transpose-matrix/)**
- **[LeetCode 498: Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/)**
- **[LeetCode 766: Toeplitz Matrix](https://leetcode.com/problems/toeplitz-matrix/)** (Optional stride-pattern exercise)
  *Objective:* Handle custom boundaries and non-standard traversal sequences across coordinates.

### 3. ML Bridge
*Original problems that apply the same operation to an ML representation.*
- **Multidimensional Offset Calculation:** Compute the row-major 1D flat offset from 3D/4D tensor indices.
- **Index Reconstruction:** Reconstruct N-dimensional logical indices strictly from a 1D flat offset.
- **Shape Validation & `numel`:** Implement functions to validate view safety and element conservation.
- **Contiguous Stride Vector Construction:** Dynamically generate a contiguous stride array for an arbitrary shape vector.

### 4. Named Mechanism
*Executable implementation of the actual ML-infrastructure concept.*
- **Memory Layout Access Benchmark:** Write a simulation or empirical benchmark comparing sequential access order for **row-major** versus **column-major** layouts, demonstrating hardware cache locality and spatial access patterns.

### 5. Stress or Tradeoff
*A larger, batched, or mathematically difficult variant.*
- **Calculate Bytes Touched for Strided Slices:** Given an N-dimensional shape, a custom stride vector, and a sliced range, compute the exact total number of bytes read from memory, avoiding out-of-bounds access.

---

# Topic 02: Tensor Strides, Views, Broadcasting & Aliasing


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 566 (Reshape Matrix), LeetCode 867 (Transpose Matrix), LeetCode 48 (Rotate Image), LeetCode 498 (Diagonal Traverse).
- **Removed:** LeetCode 36 (Valid Sudoku — *false analogy: 2D grid validation, not strided tensor view*), LeetCode 312 (Burst Balloons — *false analogy: interval DP, not einsum contraction*), LeetCode 668 (Kth Smallest Mult Table — *false analogy: binary search, not SRAM tiling*), Matrix Exponentiation (*too distant*).
- **Added:** Storage offset formula ($O = \sum i_d \cdot s_d$), zero-copy transpose/slice index math, view compatibility rules, broadcasting shape inference, broadcast gradient reduction, PyTorch `as_strided` & aliasing check, contiguity repair (`contiguous()`).

**Prior draft correspondence:** Formerly Topic 03.

This topic covers the physical memory layout of tensors, specifically how shapes and strides map to underlying 1D storage. It transitions from basic matrix traversal in traditional DSA to the complex rules of zero-copy views, broadcasting, and aliasing found in modern ML frameworks like PyTorch.

## 1. Foundation
Genuine online DSA problems that teach the underlying multidimensional array traversal and shape manipulation.

* **[Reshape the Matrix (LeetCode 566)](https://leetcode.com/problems/reshape-the-matrix/):** Introductory shape analogy. Demonstrates how a 2D matrix can be flattened and unflattened into a new shape, teaching row-major traversal semantics.
* **[Transpose Matrix (LeetCode 867)](https://leetcode.com/problems/transpose-matrix/):** Introductory stride manipulation. Swaps axes to change traversal order.
* **[Rotate Image (LeetCode 48)](https://leetcode.com/problems/rotate-image/):** Teaches advanced index mapping and in-place coordinate transformation.
* **[Diagonal Traverse (LeetCode 498)](https://leetcode.com/problems/diagonal-traverse/):** Non-standard traversal that requires careful bound checking and coordinate progression, foundational for understanding arbitrary strides.

## 2. Focused Variant
Direct bridge problems that transition from standard grid traversal to stride math and zero-copy transformations.

* **Storage Offset Calculation:** Given a multidimensional index, compute the flat 1D storage offset using the tensor's shape, stride, and base storage offset.
* **Transpose and Slice without Copying:** Implement matrix transpose and slicing solely by manipulating the shape and stride vectors of a tensor descriptor, leaving the underlying data array untouched.
* **View Compatibility Rules:** Given a tensor's shape and strides, determine if a requested `reshape` can be performed as a zero-copy view (i.e. checking if the memory remains contiguous for the new shape dimensions) or if it requires a copy.

## 3. ML Bridge
Original problems applying stride and shape concepts to ML-specific representations and rules.

* **Broadcasting Shape Inference:** Implement the algorithm to determine the resulting broadcasted shape when combining two tensors of arbitrary shapes, matching PyTorch's trailing-dimension alignment rules.
* **Broadcast Gradient Reduction:** Given a gradient tensor resulting from a broadcasted operation, compute the reduction (via summation over expanded/broadcasted dimensions) required to accumulate the gradient back to the source tensor's original shape.
* **Basic vs. Advanced Indexing:** Classify an indexing operation. Determine whether a multi-dimensional indexing request qualifies as basic (returning a view via stride adjustment) or advanced (returning a copy).

## 4. Named Mechanism
Executable implementation of actual ML-infrastructure algorithms.

* **PyTorch View & as_strided Mechanics:** Implement a lightweight tensor descriptor that supports PyTorch-style `as_strided` creation.
* **Memory Aliasing Detection:** Given multiple `as_strided` tensor views, detect if their memory regions overlap or alias, a critical safety check for in-place operations.

## 5. Stress or Tradeoff
Handling larger, difficult, or edge-case variants of tensor layouts.

* **Contiguity Repair (`contiguous()` allocation):** Implement an allocation and copying algorithm that takes an arbitrarily strided, non-contiguous tensor view and materializes it into a dense, row-major contiguous memory block.
* **Overlapping In-Place Operations:** Model the tradeoff and error detection logic when an in-place operator modifies an aliased tensor view where written elements might overwrite data needed for subsequent reads in the same operation.

---
### References
* PyTorch Tensor Views: [https://pytorch.org/docs/stable/tensor_view.html](https://pytorch.org/docs/stable/tensor_view.html)
* PyTorch Broadcasting Semantics: [https://pytorch.org/docs/stable/notes/broadcasting.html](https://pytorch.org/docs/stable/notes/broadcasting.html)

---

# Topic 03: Dense & Sparse Matrix Multiplication & SRAM Tiling


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 311 (Sparse Matrix Multiplication), HackerRank MapReduce MatMul, Block-wise GEMM endpoint.
- **Removed:** LeetCode 1074 (Submatrices Sum — *prefix sum*), LeetCode 1314 (Matrix Block Sum — *moved to Convolutions*), LeetCode 2536 (Increment Submatrices — *prefix sum*), Forest Queries (*prefix sum*), SVD / PCA (*moved to linear algebra*).
- **Added:** Dot product vector kernel, matrix-vector multiplication, naive dense GEMM ($O(N^3)$), `ijk` vs `ikj` loop-order memory access comparison, SRAM Tiled GEMM with edge tiles, global memory load/store counter, COO and CSR sparse GEMM formats.

This document outlines the revised curriculum for Topic 03 (formerly Topic 02), focusing strictly on matrix multiplication, memory access patterns, and sparsity. Extraneous matrix topics (like Submatrices Sum Target, Forest Queries, SVD/PCA, etc.) have been removed to maintain sharp focus on ML infrastructure fundamentals.

## The 5-Rung Ladder

### 1. Foundation: The Basics of Matrix Operations
The foundation introduces the core operations that build up to matrix multiplication. We establish correct shape validation and basic iterative algorithms.
*   **Dot Product Vector Kernel:** The fundamental building block (1D array multiplication and accumulation).
*   **Matrix-Vector Multiplication:** Extending dot product to 2D matrix and 1D vector.
*   **Naive Dense Matrix Multiplication:** Standard $O(N^3)$ implementation $C = A \times B$ with strict shape checks ($A.cols == B.rows$).

### 2. Focused Variant: Memory Access and Hardware Realities
Once naive MatMul is understood, the focus shifts to how real hardware executes it, emphasizing the memory wall and cache lines.
*   **Loop-Order Memory Access Comparison (`ijk` vs `ikj` vs `kij`):** Demonstrating that in row-major languages (C++/C/Python), the `ikj` or `kij` loop order provides stride-1 (contiguous) memory access for the innermost loop, drastically reducing cache misses compared to the standard `ijk` order.
*   **Arithmetic / Operational Intensity Calculation:** Introducing the metric (FLOPs/byte) to determine if a kernel is compute-bound or memory-bound. Students will analyze naive MatMul to see it is heavily memory-bound.

### 3. ML Bridge: SRAM Tiling and Block-wise GEMM
To overcome the memory wall, we introduce block-wise operations, mirroring how CUDA kernels utilize Shared Memory (SRAM).
*   **Tiled Matrix Multiplication:** Breaking the matrices into smaller tiles (e.g., $16 \times 16$) that fit in the L1 cache / SRAM. Crucially includes **edge tile handling** (bounds checking/padding) when dimensions are not perfect multiples of the tile size.
*   **Memory Load/Store Counter:** A practical exercise where students instrument their naive vs. tiled implementations to count global memory loads/stores, proving the theoretical benefit of tiling.
*   **Block-wise GEMM Endpoint:** Extending tiling to a General Matrix Multiply (GEMM) format, serving as a primitive for neural network linear layers.

### 4. Named Mechanism: Exploiting Sparsity
Real-world ML matrices (like embeddings or graphs) are often sparse. We introduce formats that save compute and memory by skipping zeros.
*   **Sparse Matrix Multiplication (LeetCode #311):** The standard algorithm of skipping zero-valued elements during multiplication.
*   **Sparse COO & CSR Matrix Multiplication:** Introducing standard formats. COO (Coordinate format - `row, col, value`) is used for easy construction, while CSR (Compressed Sparse Row - `data, indices, row_ptr`) is highly optimized for fast arithmetic and row-wise access during multiplication.

### 5. Stress/Tradeoff: Distributed Computing
Scaling matrix multiplication beyond a single machine.
*   **MapReduce Matrix Multiplication (HackerRank):** Distributed matrix decomposition where mappers emit `((i, k), (Matrix, j, value))` and reducers compute the dot product for each cell $C_{ik}$. This teaches the tradeoff between network communication overhead and distributed compute power.

## Changes from V1
*   **Kept:** Sparse MatMul (#311), HackerRank MapReduce MatMul, Block-wise GEMM endpoint.
*   **Removed:** Submatrices Sum Target (#1074), Matrix Block Sum (#1314), Increment Submatrices (#2536), Forest Queries, Rearrangements (#1727), SVD/PCA.
*   **Added:** Vector kernels, `ikj` loop optimization, arithmetic intensity, SRAM tiling with edge handling, memory profiling, and COO/CSR formats.

---

# Topic 04: Floating-Point Representation, Precision & Stable Reductions


## Evaluation Modifications & Rationale
- **Status:** New Standalone Topic introduced to address missing numerical foundations.
- **Added:** FP32/FP16/BF16 bit layout & range, unit roundoff & catastrophic cancellation, non-associativity accumulation order, pairwise summation algorithm, mixed-precision FP32 accumulation, Kahan compensated summation, Welford online mean & variance.

This topic serves as the critical numerical prerequisite for LogSumExp, Quantization, FlashAttention, and Distributed Reductions in ML Infrastructure.

## The 5-Rung Ladder

### 1. Foundation: IEEE 754 & Bit Interpretation
**Concept:** Understanding the bit-level anatomy of floating-point numbers.
*   **Sign, Exponent, Mantissa (Fraction):** How bits are distributed in FP32 (1/8/23), FP16 (1/5/10), and BF16 (1/8/7).
*   **Unit Roundoff (Machine Epsilon):** The upper bound on the relative error due to rounding. How it differs between FP32 (~1e-7), FP16 (~1e-3), and BF16 (~1e-2).
*   **Representable Range:** The minimum (subnormal/normal) and maximum values before overflow/underflow occurs, crucial for understanding why BF16 is preferred over FP16 for deep learning despite having fewer mantissa bits (same range as FP32).

### 2. Focused Variant: Accumulation & Cancellation
**Concept:** How floating-point arithmetic breaks algebraic laws.
*   **Catastrophic Cancellation:** The severe loss of precision when subtracting two nearly equal numbers. Example: calculating variance naively ($E[X^2] - (E[X])^2$).
*   **Accumulation-Order Effects:** Floating-point addition is not associative: $(A + B) + C \neq A + (B + C)$. The order of summation matters drastically when adding sequences of varying magnitudes.
*   **Pairwise Summation:** A divide-and-conquer approach to summation that reduces the worst-case error bound from $O(N)$ to $O(\log N)$.

### 3. ML Bridge: Mixed-Precision Training Choices
**Concept:** Applying precision trade-offs to neural network training.
*   **FP16 vs. BF16 vs. FP32:** Why modern accelerators (like TPUs and newer GPUs) default to BF16 for matrix multiplications and weights, but keep FP32 for weight updates and accumulation.
*   **Accumulation Choices:** The necessity of accumulating dot products (like in matrix multiplications or reductions) in FP32 even when the operands are FP16/BF16, to prevent stalled learning due to small gradients being swallowed by large accumulated sums.

### 4. Named Mechanism: Stable Algorithms
**Concept:** Standard algorithmic solutions to precision issues.
*   **Kahan Compensated Summation:** An algorithm that mitigates precision loss during the summation of a sequence of finite-precision numbers by maintaining a running compensation term (error tracking). Crucial for large-scale reductions.
*   **Welford's Algorithm:** A numerically stable, single-pass (online) method used to compute the mean and variance. It avoids catastrophic cancellation by incrementally updating the mean and the sum of squared differences.

### 5. Stress/Tradeoff: System-Level Reductions
**Concept:** Scaling these concepts to hardware and distributed systems.
*   **Overflow/Underflow Management:** Handling extreme values in deep learning (e.g., softmax logic leading into LogSumExp).
*   **Distributed Reductions:** In a ring-allreduce or tree-reduce, the non-associativity of floating-point numbers means that the order in which nodes communicate and aggregate gradients can yield slightly different results. Ensuring deterministic reductions requires strict summation order or compensated summation across nodes.
*   **Hardware Implications:** The area and power cost of FMA (Fused Multiply-Add) units for FP32 vs BF16, explaining the physical motivation for mixed-precision architectures (e.g., Tensor Cores).

---

# Topic 05: Integer Arithmetic, Scaling & Tensor Quantization

## Ladder of Concepts


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 7 (Reverse Integer), LeetCode 29 (Divide Two Integers), LeetCode 371 (Sum of Two Integers), LeetCode 201 (Bitwise AND of Numbers Range).
- **Removed:** LeetCode 311 (Sparse MatMul — *moved to Topic 03*), Focal Loss (*moved to Loss Functions*), Codeforces AND 0 Sum Big (*bitwise puzzle*).
- **Added:** INT8/INT32 signed/unsigned range, scale ($S$) & zero-point ($Z$) derivation, symmetric vs asymmetric quantization, per-tensor vs per-channel parameters, INT8 GEMM with INT32 accumulators, requantization from INT32 to INT8, static/dynamic calibration & KL error.

### 1. Foundation: Bitwise Operations & Ranges
*   **Concepts:** INT8/INT32 signed and unsigned range calculation. Understanding the raw bits and bounds of integers.
*   **DSA Practice:** 
    *   *Sum of Two Integers (LeetCode #371)*: Introduces bitwise operations (XOR for addition without carry, AND for carry calculation) in place of standard arithmetic.
    *   *Bitwise AND of Numbers Range (LeetCode #201)*: Helps build familiarity with bitwise representations, common prefixes, and operating over contiguous ranges.

### 2. Focused Variant: Overflow, Truncation & Boundaries
*   **Concepts:** Recognizing when arithmetic breaks constraints, truncation towards zero behavior, and overflow detection in limited bit-width domains.
*   **DSA Practice:** 
    *   *Reverse Integer (LeetCode #7)*: Requires meticulous overflow detection logic before operations push 32-bit values out of bounds.
    *   *Divide Two Integers (LeetCode #29)*: Implements division purely via bit shifts and subtraction, reinforcing truncation and extreme bounds (e.g., dividing $-2^{31}$ by $-1$).

### 3. ML Bridge: The Basics of Quantization
*   **Concepts:** Translating continuous floating-point spaces into discrete integer buckets.
    *   **Scale (S) & Zero-point (Z) Derivation:** Formulaic derivation from `min` / `max` ranges.
    *   **Symmetric vs Asymmetric Quantization:** Symmetric forces zero to be perfectly aligned (scale based on absolute maximum), while asymmetric allows a non-zero zero-point mapping to arbitrary `min`/`max` spans.
    *   **Saturating Clamp & Round-to-Nearest:** Standardizing the out-of-bounds behavior and precision rounding during the transition to integers.
    *   **Transformations:** Implementing pure Quantize and Dequantize math.

### 4. Named Mechanism: Tensor Mapping and Integer GEMM
*   **Concepts:** Advanced scaling approaches and high-performance integer math for neural networks.
    *   **Per-Tensor vs Per-Channel Parameters:** Understanding granularity. Per-tensor is lightweight but error-prone on skewed data; per-channel assigns independent S/Z parameters (typically along the output dimension for weights) improving accuracy.
    *   **INT8 GEMM with INT32 Accumulation:** Representing matrix multiplication in PyTorch / hardware, demonstrating why the dot products of INT8 inputs demand an INT32 accumulator to prevent catastrophic overflow.

### 5. Stress/Tradeoff: Requantization and Error Analysis
*   **Concepts:** The pipeline after integer operations and evaluating the cost of lost precision.
    *   **Requantizing INT32 Accumulator:** Downcasting the INT32 results of an INT8 GEMM back into an INT8 output range for the next layer (requires calculating combined requantization scales).
    *   **Calibration & Clipping Error Metrics:** Analyzing how static vs dynamic ranges affect outputs. Tracking Mean Squared Error (MSE) or Kullback-Leibler (KL) divergence when clamping outlier values vs preserving smaller granularity.

---

# Topic 06: Topological Ordering, Cycle Detection & Dependency Graphs

## Critique & Modifications
- **Kept**: Course Schedule I & II (#207, #210), Eventual Safe States (#802), Parallel Courses (#1136), Group Dependencies (#1203), Sequence Reconstruction (#444), Recipes (#2115), Build Matrix With Conditions (#2392).
- **Removed/Moved**: CSES Course Schedule (clone), Course Schedule III (greedy heap), Parallel Courses II (bitmask DP), Parallel Courses III (DAG DP), Min Vertices Reach All Nodes (indegree only).

## 5-Rung Ladder


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 207 (Course Schedule), LeetCode 210 (Course Schedule II), LeetCode 1136 (Parallel Courses), LeetCode 802 (Eventual Safe States), LeetCode 444 (Sequence Reconstruction), LeetCode 2115 (Find Recipes), LeetCode 1203 (Sort Items by Groups), LeetCode 2392 (Build Matrix With Conditions).
- **Removed:** CSES Course Schedule (*duplicate of LC 210*), LeetCode 630 (Course Schedule III — *greedy heap, moved to Topic 24*), LeetCode 1494 (Parallel Courses II — *bitmask DP*), Min Vertices Reach All Nodes (*indegree only*).
- **Added:** Operator graph cycle validation, deterministic topological order with tie-breaking, reverse topological backward pass order, consumer reference count tensor deallocation.

### 1. Foundation
- [LeetCode 207: Course Schedule](https://leetcode.com/problems/course-schedule/)
  - Cycle detection in a directed graph.
- [LeetCode 210: Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
  - Standard topological sorting using Kahn's Algorithm or DFS.

### 2. Focused Variant
- [LeetCode 1136: Parallel Courses](https://leetcode.com/problems/parallel-courses/) (Premium)
  - Level-by-level topological sort to find the longest path (minimum semesters).
- [LeetCode 802: Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/)
  - Identifying terminal paths and detecting cycles using out-degrees or reverse graph traversal.

### 3. ML Bridge
- **Operator Execution Graph Cycle Validation**
  - Validating an operator execution graph to report cycles and prevent infinite loops during inference.
- **Deterministic Topological Execution Order**
  - Producing a deterministic topological execution order with tie-breaking (e.g., using a priority queue instead of a standard queue in Kahn's algorithm) to guarantee identical execution schedules across runs.
- **Reverse Topological Ordering for Autograd**
  - Finding a valid reverse topological order for the backward autograd pass to ensure gradients are propagated correctly from outputs to inputs.
- **Automatic Tensor Deallocation**
  - Maintaining consumer/use reference counts (indegree tracking) for automatic tensor deallocation as soon as they are no longer needed in the execution schedule.

### 4. Named Mechanism
- [LeetCode 444: Sequence Reconstruction](https://leetcode.com/problems/sequence-reconstruction/) (Premium)
  - Validating a unique topological sort.
- [LeetCode 2115: Find All Possible Recipes from Given Supplies](https://leetcode.com/problems/find-all-possible-recipes-from-given-supplies/)
  - Managing active sources dynamically and producing valid derivations.

### 5. Stress/Tradeoff
- [LeetCode 1203: Sort Items by Groups Respecting Dependencies](https://leetcode.com/problems/sort-items-by-groups-respecting-dependencies/)
  - Two-level topological sort (intra-group and inter-group dependencies).
- [LeetCode 2392: Build a Matrix With Conditions](https://leetcode.com/problems/build-a-matrix-with-conditions/)
  - Applying topological sort on two independent dimensions (rows and columns) and combining the results.

---

# Topic 07: Dynamic Programming, Critical Paths & Liveness on DAGs


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 797 (All Paths Source to Target), CSES 1681 (Game Routes), CSES 1680 (Longest Flight Route), LeetCode 2050 (Parallel Courses III), LeetCode 1857 (Largest Color Value), LeetCode 329 (Longest Increasing Path), LeetCode 2192 (All Ancestors in DAG).
- **Removed:** LeetCode 1494 (Parallel Courses II — *subset/bitmask DP*).
- **Added:** Forward shape/value propagation, reverse gradient accumulation count, critical path latency cost calculation, activation last-use / liveness analysis, ready-queue in-degree runtime scheduler, Gradient Checkpointing (recompute decision), minimum peak live-memory simulation.

## 1. Foundation

These problems establish the core techniques of computing values on a Directed Acyclic Graph (DAG) using topological sorting and dynamic programming, which map perfectly to dataflow analysis on computation graphs.

- **All Paths From Source to Target** ([LeetCode #797](https://leetcode.com/problems/all-paths-from-source-to-target/))
  *Concepts:* DFS, Backtracking, Path Enumeration, DAG Traversal.
  *Relevance:* Basic traversal on a DAG to explore all valid execution traces or paths through a model.
- **Game Routes** ([CSES 1681](https://cses.fi/problemset/task/1681))
  *Concepts:* Path Counting, DP on DAG, Topological Sort.
  *Relevance:* Foundational for counting the number of ways gradients or data can flow through a network.
- **Longest Flight Route** ([CSES 1680](https://cses.fi/problemset/task/1680))
  *Concepts:* DP on DAG, Topological Sort, Path Reassembly.
  *Relevance:* Finding the critical path (longest sequence of dependencies), similar to determining the minimum total execution time in an ML operator DAG.

## 2. Focused Variant

More advanced DAG problems that introduce scheduling, matrix-implicit DAGs, and state propagation constraints.

- **Parallel Courses III** ([LeetCode #2050](https://leetcode.com/problems/parallel-courses-iii/))
  *Concepts:* DAG DP, Topological Sort (Kahn's Algorithm), Scheduling.
  *Relevance:* Directly models critical-path latency cost calculation on an operator DAG with heterogeneous task durations.
- **Largest Color Value in a Directed Graph** ([LeetCode #1857](https://leetcode.com/problems/largest-color-value-in-a-directed-graph/))
  *Concepts:* DP on DAG, Topological Sort, Cycle Detection.
  *Relevance:* State propagation through a graph; akin to tracking tensor types, shapes, or liveness state across layers.
- **Longest Increasing Path in a Matrix** ([LeetCode #329](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/))
  *Concepts:* Memoization, DFS, Implicit DAG.
  *Relevance:* Memoized DP on a DAG where the topology is dynamically discovered rather than explicitly provided.
- **All Ancestors of a Node in a Directed Acyclic Graph** ([LeetCode #2192](https://leetcode.com/problems/all-ancestors-of-a-node-in-a-directed-acyclic-graph/))
  *Concepts:* Reachability, DAG Traversal, BFS/DFS.
  *Relevance:* Critical for reverse gradient accumulation (knowing all consumers) and identifying dependencies for checkpointing.

*Note: Parallel Courses II was moved to subset/bitmask DP as per the critique.*

## 3. ML Bridge

Applying DAG-based algorithms directly to machine learning infrastructure, focusing on operator dataflow, memory lifecycle, and execution latency.

- **Forward Shape and Value Propagation**
  *Bridge:* Traverse the operator DAG in topological order to determine the output shape or value of every node based on its inputs, a fundamental requirement for static graph compilation and tensor allocation.
- **Reverse Gradient Accumulation Count**
  *Bridge:* Process the DAG in reverse topological order to compute how many consumer nodes need the gradient of a particular node before it can be freed, essentially doing DP over DAG edges for backpropagation.
- **Critical Path Latency Cost Calculation**
  *Bridge:* Use algorithms like in *Parallel Courses III* to determine the minimum theoretical execution time of an operator DAG, identifying bottleneck paths for kernel fusion or hardware optimization.

## 4. Named Mechanism

Industry-standard mechanisms for memory efficiency and scheduling that rely on DAG state tracking.

- **Activation Last-Use / Liveness Analysis**
  *Mechanism:* Analyze the DAG to determine the exact point where a tensor is no longer needed by any consumer node, allowing the allocator to recycle the memory buffer immediately.
- **Ready-Queue Scheduling with Dependency Counters**
  *Mechanism:* A runtime engine maintains in-degree counters for each operator. As operations finish, consumer counts are decremented, and nodes hitting zero are pushed to a ready queue for execution (Kahn's algorithm in practice).

## 5. Stress / Tradeoff

Balancing computational cost vs. memory usage using DAG analysis.

- **Checkpoint / Recompute Decision on an Operator Chain or DAG**
  *Tradeoff:* Instead of storing all forward activations for the backward pass, strategically drop some intermediate tensors to save memory, and recompute them on-the-fly during backpropagation (Gradient Checkpointing). The DP problem models finding the optimal checkpoint locations to minimize recomputation overhead while staying within a memory budget.
- **Minimum Peak Live-Memory Simulation**
  *Tradeoff:* Simulating the execution order of a DAG to calculate the peak memory usage. Changing the valid topological schedule can drastically alter the peak memory high-water mark, creating a tradeoff between parallelism (latency) and sequential execution (memory).

---

# Topic 08: Expression Parsing, AST Evaluation & Operator IR


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 150 (Evaluate RPN), LeetCode 224 (Basic Calculator), LeetCode 1628 (Expression Tree), LeetCode 1597 (Infix to Tree), LeetCode 736 (Parse Lisp Expression), LeetCode 770 (Basic Calculator IV).
- **Removed:** Lambda calculus reductions (*not autograd prerequisite*), Minimum Cost Change Expression (*boolean DP*).
- **Added:** Build typed operator graph from string, shape inference through AST, Common Subexpression Elimination (CSE), constant folding optimization pass, dead-node elimination pass, serialize operator tape for autograd.

## 1. Foundation
- **Evaluate Reverse Polish Notation (LeetCode 150):** Introduces stack-based evaluation of mathematical expressions, directly modeling how a postfix execution tape or lowered stack machine evaluates an operator sequence.

## 2. Focused Variant
- **Basic Calculator (LeetCode 224):** Introduces parsing of infix notation and handling precedence and grouping (parentheses).
- **Design an Expression Tree With Evaluate Function (LeetCode 1628):** Builds a structural abstraction (Abstract Syntax Tree) over an expression, moving from sequential processing to hierarchical evaluation.
- **Build Binary Expression Tree From Infix Expression (LeetCode 1597):** Combines string parsing, precedence resolution, and AST construction into a single workflow.

## 3. ML Bridge
- **Build a Typed Operator Graph:** Parse an expression string (e.g., `(A + B) * C`) into a typed graph where nodes are mathematical operators and edges are data dependencies.
- **Infer Tensor Shapes Through an AST:** Given input tensor shapes, propagate them through the expression tree to deduce the output shape at each operator node.
- **Common Subexpression Elimination (CSE):** Detect identical subtrees within an expression DAG and merge them to avoid redundant computation.
- **Constant Folding Optimization:** Evaluate subtrees containing only constants at graph-build time and replace them with their scalar results.
- **Dead-Node Elimination:** Identify and prune subtrees whose outputs are never consumed or do not contribute to the final expression result.
- **Serialize an Operator Execution Tape:** Flatten the parsed AST/DAG into a linear tape (reverse topological order) to enable reverse-mode autograd traversal.

## 4. Named Mechanism
- **Operator IR & AST Evaluator:** The core frontend compilation step for ML frameworks. User-defined expressions or graph definitions are parsed into an Abstract Syntax Tree, lowered into an Intermediate Representation (IR) DAG, optimized (CSE, constant folding, dead code elimination), and then executed or serialized to an execution tape.

## 5. Stress/Tradeoff
- **Parse Lisp Expression (LeetCode 736):** Stresses scoping rules, nested environments, and variable bindings in an AST context, simulating complex execution scopes.
- **Basic Calculator IV (LeetCode 770):** Introduces symbolic manipulation and polynomial representation, demonstrating how to evaluate and combine expressions symbolically rather than purely numerically.

---

# Topic 09: Calculus, Chain Rule, VJPs & Reverse-Mode Autograd (V2)


## Evaluation Modifications & Rationale
- **Kept:** Scalar chain rule, gradient clipping bounds, forward-mode JVP, Hessian-Vector Product (HVP).
- **Removed:** LeetCode 311 (Sparse MatMul — *moved to Topic 03*), Conjugate Gradient (*unrelated solver*), Neural ODE Step Solver (*too advanced*).
- **Added:** Scalar derivatives & local chain rule, saved forward intermediates caching, reverse topological traversal, gradient accumulation at fan-out nodes, VJPs for add/mul/matmul/reduce/reshape/broadcast, Minimal Autograd Engine (`MicroGrad`), detach / stop-gradient behavior, finite-difference gradient checking.

## Overview
Based on the curriculum evaluation critique, this revised topic focuses heavily on the fundamental prerequisites of automatic differentiation (autograd), building up from basic scalar calculus to a minimal reverse-mode autograd engine. Advanced numerical methods and solvers have been removed, and specialized differentiation topics have been deferred to the final rung.

## 5-Rung Ladder

### 1. Foundation: Core Calculus & The Chain Rule
*   **Scalar Derivatives & Local Derivative Rules:** Introduction to basic differentiation for fundamental operations (addition, multiplication, powers, exponentials).
*   **The Chain Rule on Expression Trees:** Manually applying the chain rule to small, composed mathematical expressions. Understanding how local gradients multiply along a path.
*   **Computational Graphs:** Representing equations as directed acyclic graphs (DAGs) with inputs as leaf nodes and operations as internal nodes.

### 2. Focused Variant: Forward Pass & Topological Backpropagation
*   **Saved Forward Values & Intermediates:** The necessity of caching intermediate activations (the "tape" or context) during the forward pass to compute gradients later.
*   **Reverse Topological Traversal:** Algorithmically walking the computational graph backward from the scalar loss root to the leaf inputs.
*   **Gradient Accumulation at Fan-out/Fan-in Nodes:** Correctly summing gradients when a single variable is used in multiple downstream operations (multivariate chain rule).

### 3. ML Bridge: Vector-Jacobian Products (VJPs)
*   **VJP Rules for Element-wise Ops:** Deriving and implementing VJPs for `add` and `multiply`.
*   **VJP Rules for Linear Algebra:** Understanding the backward pass of `matmul` (matrix multiplication) using transposes.
*   **VJP Rules for Reductions:** Implementing gradients for `sum` and `mean` operations (routing gradients back to the original shapes).
*   **VJP Rules for Shape Manipulation:** Handling `reshape` and `broadcast` (which requires summing gradients across broadcasted dimensions).

### 4. Named Mechanism: Minimal Autograd Engine
*   **Building a Minimal Reverse-Mode Engine:** Constructing a micro-autograd system for scalars and basic tensors.
*   **Detach / Stop-Gradient Behavior:** Implementing mechanics to cut the computational graph, preventing gradients from flowing into certain branches (e.g., `.detach()`, `torch.no_grad()`).
*   **Finite-Difference Gradient Checking (`gradcheck`):** Implementing numerical gradient approximation using central differences to verify the analytical VJPs computed by the engine.

### 5. Stress/Tradeoff: Advanced Differentiation Mechanisms
*   **Forward-Mode Autograd & JVPs:** Exploring Jacobian-Vector Products (JVPs) and when forward-mode is more efficient than reverse-mode.
*   **Hessian-Vector Products (HVPs):** Efficiently computing second-order derivatives without realizing the full Hessian matrix.
*   **Matrix-Chain Order for Jacobian Accumulation:** Optimizing the order of matrix multiplications when computing complex Jacobians.
*   **Gradient Clipping Bounds:** Strategies for mitigating exploding gradients during training by capping gradient norms.

## Removed Concepts
*   Sparse MatMul (Moved/Removed)
*   Conjugate Gradient (Removed)
*   Neural ODE Integrators (Removed)

---

# Topic 10: Loss Functions & Probability Mathematics


## Evaluation Modifications & Rationale
- **Status:** New Standalone Topic introduced to address missing loss mathematics.
- **Added:** Probability normalization ($\sum p_i = 1$), Expected Value & Variance single pass, MSE loss & analytical gradients, Binary & Multiclass Cross-Entropy Loss, NLL & Softmax+Cross Entropy gradient, Information Entropy & KL Divergence, Focal Loss modulating factor $(1-p_t)^\gamma$.

## Overview
This topic serves as the foundational mathematics layer for ML infrastructure, specifically focusing on probability normalization, loss functions, and their analytical gradients. It acts as a prerequisite for LogSumExp, Softmax, Focal Loss, and Categorical Sampling techniques.

## 5-Rung Ladder Progression

### 1. Foundation: Probability Normalization & Statistical Moments
- **Concept**: Probability Normalization ($\sum p_i = 1$), Expected Value ($E[X]$), and Variance ($Var(X)$).
- **Core Mechanism**: Transforming arbitrary weights or counts into a valid probability distribution where all elements sum to 1. Computing the expected value (mean) as the probability-weighted sum of outcomes, and variance as the expected squared deviation from the mean.
- **Implementation Focus**: Writing robust code to normalize arrays (avoiding division by zero) and computing expected value and variance efficiently in a single pass where possible.

### 2. Focused Variant: Mean Squared Error (MSE) & Analytical Gradients
- **Concept**: Mean Squared Error (MSE) loss and its analytical gradients.
- **Core Mechanism**: Measuring the average squared difference between estimated values and the actual value. Often derived assuming Gaussian noise. 
- **Implementation Focus**: 
  - Forward pass: $L = \frac{1}{N} \sum (\hat{y}_i - y_i)^2$
  - Backward pass (Gradient): $\frac{\partial L}{\partial \hat{y}} = \frac{2}{N} (\hat{y} - y)$.
  - Interview context: Understanding why the gradient of MSE combined with non-linear activations (like Sigmoid) can lead to vanishing gradients when the model is "confidently wrong".

### 3. ML Bridge: Cross-Entropy (BCE & Multiclass) & NLL
- **Concept**: Binary Cross-Entropy (BCE), Multiclass Cross-Entropy, and Negative Log-Likelihood (NLL).
- **Core Mechanism**: Moving from continuous regression targets to categorical distributions. Cross-entropy penalizes confident wrong predictions logarithmically.
- **Implementation Focus**: 
  - Log-likelihood optimization vs minimizing NLL.
  - The beautiful gradient simplification when Softmax is paired with Cross-Entropy: $\frac{\partial L}{\partial z} = \hat{y} - y$. This linear gradient solves the vanishing gradient problem seen with MSE + Sigmoid.
  - Numerically stable implementations avoiding $\log(0)$.

### 4. Named Mechanism: Entropy & Kullback-Leibler (KL) Divergence
- **Concept**: Information Entropy ($H(p)$) and KL Divergence ($D_{KL}(P||Q)$).
- **Core Mechanism**: Entropy measures the inherent uncertainty of a distribution. KL Divergence measures how one probability distribution $Q$ differs from a reference distribution $P$.
- **Implementation Focus**: 
  - Cross-Entropy = Entropy + KL Divergence. Since the true distribution's entropy is constant, minimizing Cross-Entropy is equivalent to minimizing KL Divergence.
  - Asymmetric nature of KL divergence ($D_{KL}(P||Q) \neq D_{KL}(Q||P)$).

### 5. Stress/Tradeoff: Focal Loss Modulating Factor $(1 - p_t)^\gamma$
- **Concept**: Modulating Cross-Entropy to handle extreme class imbalance.
- **Core Mechanism**: In object detection or highly imbalanced datasets, standard Cross-Entropy is overwhelmed by the sheer number of "easy" background examples. Focal loss introduces a modulating factor $(1 - p_t)^\gamma$ to the cross-entropy loss, where $p_t$ is the probability of the true class.
- **Implementation Focus**: 
  - Down-weighting easy examples ($\gamma > 0$) so the model focuses on hard, misclassified examples.
  - Implementing Focal Loss stably by combining it with log-sigmoid or log-softmax to prevent underflow.

---

# Topic 11: LogSumExp, Stable Softmax & Numerical Reductions (V2)


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 50 (Pow(x, n)), Stable LogSumExp, Stable Softmax.
- **Removed:** LeetCode 29 (Divide Two Integers — *moved to Topic 05*), CSES Coin Piles (*unrelated math puzzle*), GFG Article links (*replaced with code specs*).
- **Added:** Overflow/underflow detection in exp sums, Kahan compensated summation, temperature scaling & masked softmax, Log-Softmax fused operator, Fused Softmax Cross-Entropy Loss, Online Softmax State Update & Merge (FlashAttention engine), Welford streaming mean & variance.

## 1. Overview
This topic addresses the critical path of numerical stability in machine learning infrastructure. Specifically, we tackle the mathematical identities and streaming algorithms used to prevent catastrophic cancellation, overflow, and underflow in core operations like softmax, cross-entropy, and running variance. We remove simple math or arbitrary bitwise problems in favor of production-grade numerical tricks, building directly up to the mathematical engine behind FlashAttention.

**Prerequisites:**
- Pow(x, n) (LeetCode #50) - Weak prerequisite for understanding exponentiation and numeric representation constraints.

## 2. The 5-Rung Ladder

### Rung 1: Foundation (Precision & Summation)
**Concept:** Understanding finite-precision floating-point arithmetic and mitigating accumulated error.
*   **Naïve Exponentiation Sums:** Identifying and detecting overflow/underflow (NaNs and Infs) when simply summing $e^{x_i}$. 
*   **Kahan Compensated Summation:** A running compensation term to track lost low-order bits, mitigating catastrophic cancellation during the addition of long sequences of floating-point numbers.

### Rung 2: Focused Variant (Stable LogSumExp & Softmax)
**Concept:** The "Max-Subtraction" trick (safe softmax identity) to bound the exponentiation range.
*   **Stable LogSumExp:** For two terms and vectors, implemented as $\max(z) + \log \sum e^{z_i - \max(z)}$. 
*   **Stable Softmax:** Applying logit max-subtraction to compute $\frac{e^{x_i - M}}{\sum e^{x_j - M}}$.
*   **Temperature Scaling & Masking:** Handling $x / T$, and specifically dealing with masked softmax where an all-masked row must be handled gracefully (often by producing zeros or a uniform distribution instead of NaNs).

### Rung 3: ML Bridge (Log-Softmax & Fused Cross-Entropy)
**Concept:** Operator fusion for analytical simplification and stability.
*   **Log-Softmax:** Combining the log and softmax algebraically: $x_i - \max(x) - \log \sum e^{x_j - \max(x)}$. This avoids computing probabilities directly to prevent underflow before the log is taken.
*   **Fused Softmax Cross-Entropy:** Fusing the log-softmax with the negative log-likelihood loss, skipping the materialization of the standalone softmax gradient and avoiding division by near-zero probabilities.

### Rung 4: Named Mechanism (Online Softmax)
**Concept:** The FlashAttention math—computing Softmax in a single pass over memory blocks without materializing the full vector.
*   **State Update & Merge:** Maintaining a running max ($m$) and normalizer ($l$) over chunks of data.
*   **Rescaling:** When a new block introduces a larger local maximum ($m_{\text{new}} > m_{\text{old}}$), the existing sum $l$ must be rescaled by $e^{m_{\text{old}} - m_{\text{new}}}$. This ensures the normalization denominator remains mathematically exact while being computed in bounded SRAM.

### Rung 5: Stress/Tradeoff (Streaming Variance)
**Concept:** Numerically stable one-pass algorithms for other fundamental ML statistics, critical for operations like BatchNorm/LayerNorm.
*   **Welford's Algorithm (Stable Running Mean & Variance):** Avoiding the catastrophic cancellation of standard $E[X^2] - (E[X])^2$ by updating the mean and sum of squared differences incrementally: $M_k = M_{k-1} + \frac{x_k - M_{k-1}}{k}$. This requires strict $O(1)$ memory and produces robust statistics for streaming/batched data.

## 3. Removals & Justifications
- **Removed:** Divide Two Integers (Moved to Quantization topic).
- **Removed:** Coin Piles (Unrelated to ML numeric stability).
- **Removed:** External tutorial links (GFG). Replaced with explicit code specifications and mathematical identities above to ensure testable implementations.

## 4. Implementation Guidelines
- **Testing:** Unit tests must inject edge cases like vectors with all extremely negative values (triggering underflow in naïve implementations), extremely large values (triggering overflow), and mixed magnitudes.
- **Constraints:** Enforce single-pass constraints for Online Softmax and Welford's algorithm to ensure the algorithmic structure is respected (i.e., reject algorithms that store the full sequence).

---

# Topic 12: Prefix Sums, Categorical Sampling & Decoding Filters


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 238 (Product Except Self), LeetCode 303 (Range Sum 1D), LeetCode 304 (Range Sum 2D), LeetCode 528 (Random Pick Weight), LeetCode 497 (Random Point Rectangles), LeetCode 470 (Rand10 from Rand7), Alias Method ($O(1)$).
- **Removed:** Random Pick Blacklist (*hash remapping*), Gumbel-Softmax (*moved to VAEs*), Wasserstein Distance (*moved to Optimal Transport*).
- **Added:** Deterministic seeded categorical sampling, temperature + Top-k/Top-p logit filtering, stable logit renormalization, batched sampling with independent RNGs, Top-P Nucleus Sampling Engine, Reservoir Sampling for infinite streams.

## 1. Foundation
*   **Product of Array Except Self (LeetCode 238):** Understanding left and right prefix products to achieve $O(n)$ time and $O(1)$ extra space without division.
*   **Range Sum Query 1D (LeetCode 303) & 2D (LeetCode 304):** Core prefix sums to reduce repeated range queries to $O(1)$ time, forming the basis for cumulative distributions.

## 2. Focused Variant
*   **Random Pick with Weight (LeetCode 528):** Constructing a cumulative distribution function (CDF) from weights and using binary search to sample an index in $O(\log n)$ time.
*   **Random Point in Non-overlapping Rectangles (LeetCode 497):** Extending the CDF concept to 2D areas, picking a rectangle weighted by area and then sampling a point within it.
*   **Core Concepts:** Binary search over cumulative distribution function (CDF).

## 3. ML Bridge
*   **Deterministic Seeded Categorical Sampling:** Ensuring reproducibility in random generation across different environments and batches.
*   **Temperature Scaling & Logit Filtering:** Applying temperature scaling, along with Top-k and Top-p logit filtering to control the randomness and quality of generated tokens.
*   **Stable Logit Renormalization:** Renormalizing probabilities accurately and stably after filtering out low-probability tokens.
*   **Batched Sampling with Independent RNG Streams:** Managing batched sampling with isolated random number generator streams to ensure correctness and reproducibility during parallel decoding.

## 4. Named Mechanism
*   **Top-P Nucleus Sampling:** A pivotal decoding mechanism in LLMs that truncates the tail of the probability distribution, ensuring dynamic vocabulary selection based on cumulative probability mass.
*   **Alias Method ($O(1)$ sampling):** Constructing an alias table for $O(1)$ sampling from a categorical distribution, heavily optimizing repeated sampling operations compared to the $O(\log n)$ binary search approach.

## 5. Stress/Tradeoff
*   **Rand10 from Rand7 (LeetCode 470):** Demonstrating rejection sampling to generate a uniform distribution, highlighting the tradeoff between deterministic time and expected time bounds.
*   **Reservoir Sampling:** Streaming sampling techniques where the total number of items is unknown or too large to fit in memory, providing $O(1)$ space tradeoffs against exact CDF methods.

---

# Topic 13: Optimizers & Training-Loop State

**Status:** V2 Revision
**Scope:** Missing standalone topic previously omitted, acting as a critical prerequisite for DeepSpeed ZeRO-1/2/3 and Distributed Parallelism.

## Rung 1: Foundation
**Batch & Mini-batch Gradient Descent Loops**
- Explaining the core training loop: processing data in mini-batches, computing gradients, and updating parameters.
- **Stochastic Gradient Descent (SGD):** The fundamental concept of taking steps in the opposite direction of the gradient. 
- **PyTorch Bridge:** `optimizer.zero_grad()` to avoid gradient accumulation across iterations by default.

## Rung 2: Focused Variant
**Momentum and Adaptive Rates**
- **SGD with Momentum:** Introducing a velocity vector to smooth out updates. Formula: $\mathbf{v} = \gamma \mathbf{v} + \eta \mathbf{g}$. Memory requirement doubles (must store velocity for each parameter).
- **RMSProp:** Adaptive learning rate based on the moving average of squared gradients. Scaling updates inversely proportional to recent gradient magnitudes.

## Rung 3: ML Bridge
**Adam and Decoupled Weight Decay**
- **Adam Optimizer:** Combining Momentum and RMSProp. Moment estimation ($m_t, v_t$) and bias correction ($\hat{m}_t, \hat{v}_t$) for early steps.
- **AdamW:** Decoupled weight decay. Rather than tying L2 regularization into the gradient (which interacts poorly with Adam's adaptive scaling), AdamW applies weight decay directly to the weights during the update step.

## Rung 4: Named Mechanism
**Loop Enhancements**
- **Gradient Accumulation:** Accumulating gradients over micro-batches before calling `optimizer.step()`. Simulates large batch sizes under tight memory constraints.
- **Learning Rate Schedules:** Adjusting $\eta$ over time.
  - *Linear Warmup:* Gradually increasing the learning rate to avoid destabilizing early gradients.
  - *Cosine Annealing:* Smoothly decaying the learning rate following a cosine curve.

## Rung 5: Stress/Tradeoff
**Optimizer-State Memory Accounting**
- Memory is not just weights! For every parameter, optimizers store state.
- **Bytes Required per Parameter:**
  - *FP32 SGD:* 4 bytes (weights) + 4 bytes (gradients) = 8 bytes.
  - *FP32 Momentum:* +4 bytes (velocity) = 12 bytes.
  - *FP32 Adam:* 4 bytes (weights) + 4 bytes (gradients) + 4 bytes ($m$) + 4 bytes ($v$) = 16 bytes.
  - *FP16/Mixed Precision Adam:* Requires master weights in FP32 (4 bytes) + FP16 weights (2 bytes) + FP16 gradients (2 bytes) + FP32 momentum (4 bytes) + FP32 variance (4 bytes) = 16 bytes total per parameter of state/overhead, laying the groundwork for ZeRO-1/2/3 memory partitioning.

---

# Topic 14: Exact Vector Search: Similarity, Top-k & Heaps


## Evaluation Modifications & Rationale
- **Status:** New Standalone Topic introduced to address missing optimizer loop state.
- **Added:** Mini-batch SGD & `zero_grad()` logic, SGD with Momentum ($\mathbf{v} = \gamma \mathbf{v} + \eta \mathbf{g}$), RMSProp adaptive learning rates, Adam moment estimation & bias correction, AdamW decoupled weight decay, gradient accumulation over micro-batches, learning rate schedules (warmup/cosine), optimizer-state VRAM accounting.

## 1. Foundation: Top-K and Heaps

**Core Concepts:**
- **Bounded Max/Min-Heap vs Full Sorting Performance:** Understanding the $O(N \log K)$ vs $O(N \log N)$ tradeoff when retrieving the top $K$ items.
- **Stable Tie-Breaking Rules:** Ensuring deterministic behavior when elements have identical values or distances (e.g., using index or ID as secondary sort criteria).

**Problems:**
- [LeetCode 215: Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)

## 2. Focused Variant: Geometric Proximity

**Core Concepts:**
- **Distance Metrics:** 
  - L1 (Manhattan)
  - L2 (Euclidean)
  - Squared L2 (computationally cheaper than L2 as it avoids the square root)
  - Mahalanobis distance (accounting for correlations between variables)

**Problems:**
- [LeetCode 658: Find K Closest Elements](https://leetcode.com/problems/find-k-closest-elements/)
- [LeetCode 973: K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/)

## 3. ML Bridge: Vector Similarity

**Core Concepts:**
- **Dot Product & Cosine Similarity Distance Metrics:** The standard metrics used in embedding-based ML models.
- **Vector Normalization & Cosine/Dot-Product Equivalence:** Understanding that when vectors are $L_2$ normalized, calculating their dot product is mathematically equivalent to calculating their cosine similarity, enabling highly optimized matrix multiplications.
- **Sparse Cosine Similarity:** Computing similarity efficiently when vectors are mostly zeros (e.g., TF-IDF or lexical search vectors).

**Problems:**
- [LeetCode 1570: Dot Product of Two Sparse Vectors](https://leetcode.com/problems/dot-product-of-two-sparse-vectors/)

## 4. Named Mechanism: Exact Vector Search Engine

**Core Concepts:**
- **Brute-Force Exact Top-K over $N$ $D$-dimensional Vectors:** The baseline standard for ground truth in retrieval. Requires $O(N \cdot D)$ time complexity per query.
- **Batch-Query Exact Search Engine:** Optimizing exact search by batching multiple queries together to fully utilize memory bandwidth and vectorized operations (BLAS/SIMD).

## 5. Stress/Tradeoff: Streaming, DP, and Evaluation

**Core Concepts:**
- **Recall@K Evaluation Metric Calculation:** The primary metric for evaluating retrieval systems (whether exact or approximate), measuring the proportion of relevant ground-truth items found in the top $K$ returned results.

**Problems:**
- [LeetCode 703: Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/)
- [LeetCode 1458: Max Dot Product of Two Subsequences](https://leetcode.com/problems/max-dot-product-of-two-subsequences/)

---

# Topic 15: Exact Spatial Indexes: K-D, Ball & Quad Trees


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 427 (Construct Quad Tree), LeetCode 558 (Logical OR QuadTree), K-D Tree Search & Insert, Ball Tree Hyper-Sphere Search.
- **Removed:** Forest Queries (*prefix sum*), Hyperbolic Poincaré distance (*moved*).
- **Added:** Median-selection K-D tree build ($O(N \log N)$), alternating axis splitting $(d mod K)$, bounding-box lower bound distance, nearest-neighbor branch-and-bound pruning, Spatial Range Search Trees, high-dimensional degradation benchmark.

## Overview and Justification
This topic focuses on exact spatial indexing structures, fundamentally transitioning from basic hierarchical data structures to sophisticated techniques for indexing multidimensional data, a critical capability for Machine Learning Infrastructure (especially for Retrieval, Nearest Neighbors, and Geographic search).

Based on the evaluation criteria, we have:
- **Kept:** K-D tree insert/search, QuadTree build/queries (LC 427, LC 558), Ball Tree hyper-sphere search.
- **Removed/Moved:** Forest Queries (2D prefix sums), Hyperbolic / Poincaré distance (moved to Riemannian embeddings).
- **Added:** Median-selection K-D tree construction, alternating axis selection ($d \bmod K$), bounding-box lower bound distance calculation, nearest-neighbor branch-and-bound pruning, k-nearest search with a bounded max-heap, spatial range search, deletion/rebuild tradeoff, demonstration of K-D tree degradation as dimensionality $D$ increases (curse of dimensionality).

## 5-Rung Ladder

### 1. Foundation: QuadTree Construction and Queries
- **Concept:** Building a 2D spatial subdivision tree (QuadTree).
- **Key Operations:** Recursively splitting a grid into 4 quadrants. Representing binary grids via QuadTrees.
- **Problems Verified:**
  - [LeetCode 427: Construct Quad Tree](https://leetcode.com/problems/construct-quad-tree/)
  - [LeetCode 558: Logical OR of Two Quad Trees](https://leetcode.com/problems/logical-or-of-two-quad-trees/)

### 2. Focused Variant: K-D Tree Construction & Range Queries
- **Concept:** Generalizing the binary search tree to $K$ dimensions.
- **Key Operations:** 
  - Median-selection for balanced tree construction in $O(N \log N)$ time.
  - Alternating axis selection ($d \bmod K$) at each depth.
  - Spatial range search (identifying points falling within a hyper-rectangle).
- **Reference:** GFG articles on K Dimensional Tree setup and basic insertion/search.

### 3. ML Bridge: K-Nearest Neighbor (KNN) Branch-and-Bound
- **Concept:** Efficient exact K-nearest neighbor searches using K-D trees.
- **Key Operations:**
  - Branch-and-bound pruning: Maintaining a lower bound distance to the current query point using the bounding box of the tree node's subspace.
  - K-nearest search with a bounded max-heap: Using a max-heap of size $k$ to track the closest $k$ neighbors seen so far, rejecting distant branches if their bounding-box lower bound is greater than the heap's maximum.

### 4. Named Mechanism: Ball Tree Hyper-sphere Search
- **Concept:** Overcoming the limitations of axis-aligned splits by using hyper-spheres to partition space, which models clusters more effectively.
- **Key Operations:** 
  - Bounding-sphere distance checks. If the distance from the query to the sphere's centroid minus its radius exceeds the worst candidate in our bounded max-heap, the entire sphere (and its subtree) is pruned.

### 5. Stress/Tradeoff: Deletions, Rebuilds, & The Curse of Dimensionality
- **Concept:** Operational realities of exact spatial indexes.
- **Key Operations & Analysis:**
  - **Deletion/Rebuild Tradeoff:** Deletions often leave tombstone markers because rebalancing a K-D tree locally is complex. After too many deletions, a full $O(N \log N)$ rebuild is triggered.
  - **The Curse of Dimensionality:** Mathematical demonstration and simulation showing K-D tree degradation as dimensionality $D$ increases. When $D$ is large (e.g., $D > 20$), almost all points lie near the boundaries of the hyper-volume, forcing the algorithm to visit almost every leaf, causing $O(\log N)$ expected search time to degrade to $O(N)$ brute-force scanning.

---

# Topic 16: Graph-Based Approximate Nearest Neighbor Search: NSW & HNSW


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 1206 (Design Skiplist — *level analogy*), LeetCode 973 (K Closest Points), Greedy proximity graph search.
- **Removed:** LeetCode 787 (Cheapest Flights — *weighted graph*), LeetCode 1334 (City Threshold — *weighted graph*), ADC (*moved to IVF/PQ*), Cosine LSH (*moved to LSH*).
- **Added:** Candidate and result priority queues, `efSearch` beam expansion with visited set, randomized HNSW level assignment, upper-layer greedy descent & Layer-0 beam, heuristic neighbor selection & pruning, Recall vs Visited Nodes vs `efSearch` benchmark.

## 1. Foundation: Greedy Search on a Proximity Graph
**Concept**: The foundation of Navigable Small World (NSW) graphs. Before adding layers, we must understand how to navigate a single layer (a flat proximity graph) using greedy routing.
**Key Elements**:
- Greedy search on a proximity graph to find the closest node to a query.
- Using **candidate and result heaps** to manage the frontier and keep track of the best matches found so far.
- **Prerequisites**: K Closest Points (LeetCode 973), weighted best-first search.

## 2. Focused Variant: Beam Expansion
**Concept**: Improving greedy search by keeping a larger frontier.
**Key Elements**:
- **`efSearch` beam expansion with a visited set**: Instead of just keeping the single closest node, we keep a beam (priority queue) of size `efSearch` to avoid local minima. This expands the search horizon.

## 3. ML Bridge: Hierarchical Navigable Small World (HNSW)
**Concept**: Bringing in the hierarchical structure (Malkov & Yashunin 2016). HNSW is a hierarchy of navigable small-world proximity graphs, NOT a skip list, though it uses a similar randomized level distribution.
**Key Elements**:
- **Randomized HNSW level assignment**: Nodes are assigned a maximum layer $l$ using an exponentially decaying probability distribution (similar to Skiplist analogy, LeetCode 1206).
- **Upper-layer greedy descent**: Searching starts at the top layer (which has very few hubs) and descends layer by layer to quickly narrow down the search space.

## 4. Named Mechanism: Construction and Heuristics
**Concept**: How to build the HNSW index dynamically.
**Key Elements**:
- **Node insertion at level $l$**: Inserting a new vector into the graph and connecting it to nearest neighbors at each layer up to its assigned level.
- **Heuristic neighbor selection & pruning**: The specific HNSW heuristic that prunes connections to maintain diversity (e.g., if a candidate neighbor is closer to an existing neighbor than to the node itself, it might be pruned) to prevent dense clustering and keep the graph navigable.

## 5. Stress/Tradeoff: Evaluation and High Dimensions
**Concept**: Understanding when and why HNSW shines compared to alternatives.
**Key Elements**:
- **Compare recall vs visited nodes vs `efSearch` parameter**: Analyzing how increasing `efSearch` improves recall (accuracy) at the cost of computing more distances (slower search).
- **Compare exact search vs K-D tree vs HNSW on high dimensions**: Showing that K-D trees suffer from the curse of dimensionality, while HNSW maintains sub-linear scaling and high recall for high-dimensional embeddings.

## Removed Concepts
- Cheapest Flights (#787)
- City threshold (#1334)
- ADC (moved to IVF/PQ)
- Cosine LSH (moved to LSH)

---

# Topic 17: Inverted File Index (IVF), Product Quantization (PQ/ADC) & LSH


## Evaluation Modifications & Rationale
- **Status:** New Standalone Topic introduced for Faiss vector index family.
- **Added:** K-Means Voronoi centroid assignment, Inverted File Index (IVF) posting lists, vector residual calculation ($r = x - c$), Product Quantization (PQ) sub-spaces, Asymmetric Distance Computation (ADC), Cosine LSH Random Hyperplane Bit Engine, Faiss IVF-PQ vs HNSW benchmark.

## Overview
This topic introduces the foundational structures and mechanisms used in large-scale vector search, moving beyond naive exact search (Flat L2/Inner Product) to approximate methods that balance recall, memory footprint, and query latency.

## 5-Rung Ladder

### 1. Foundation: Inverted File Index (IVF)
At the core of reducing query latency is avoiding exhaustive search. The Inverted File Index (IVF) partitions the vector space using K-Means clustering. The resulting centroids define Voronoi cells. During ingestion, a vector is assigned to its nearest coarse centroid, and its identifier is appended to that centroid's **posting list**. During a query, the search only explores the posting lists of the nearest `nprobe` centroids, drastically reducing the search space.

### 2. Focused Variant: Vector Residuals and Base Quantization
Instead of storing the full original vector in the posting list, it is more efficient to store the **vector residual**: $r = x - c$, where $x$ is the original vector and $c$ is its assigned coarse centroid. Because residuals within a Voronoi cell share similar bounds, they are highly compressible via quantization techniques. This sets the stage for advanced compression strategies that drastically reduce memory overhead.

### 3. ML Bridge: Product Quantization (PQ) & ADC/SDC
**Product Quantization (PQ)** takes compression further through sub-space decomposition. A high-dimensional vector is split into $m$ smaller sub-vectors, and a separate small codebook is trained (via K-Means) for each sub-space. A vector is then represented merely as a short sequence of centroid IDs.
- **Asymmetric Distance Computation (ADC):** At query time, the original uncompressed query vector is compared against the quantized database vectors. ADC precomputes a lookup table of distances from the query's sub-vectors to all sub-space centroids, making distance calculation a fast $O(1)$ lookup and sum. This preserves high recall.
- **Symmetric Distance Computation (SDC):** Both query and database vectors are quantized before comparison. While even faster, it generally leads to a worse approximation and lower recall than ADC.

### 4. Named Mechanism: Locality Sensitive Hashing (LSH)
For extremely fast, memory-efficient approximate nearest neighbors, **Locality Sensitive Hashing (LSH)** uses random-hyperplane projections to map vectors into binary hash codes (e.g., Cosine LSH bit hashing). Vectors that are close in space are likely to fall on the same side of a hyperplane, yielding similar bit hashes. The search then becomes a lightning-fast Hamming distance calculation. However, LSH generally struggles with recall in very high dimensions compared to PQ-based methods.

### 5. Stress/Tradeoff: Faiss Architecture Trade-offs
Modern vector databases (like those built on the Faiss architecture) force an explicit trade-off between **recall, memory, and query latency**:
- **Flat Index:** Perfect recall, high memory, terrible latency.
- **IVFFlat:** Good recall, high memory, low latency.
- **IVFPQ (with ADC):** Good recall, low memory, very low latency (the industry standard).
- **LSH:** Mediocre recall, extremely low memory, ultra-low latency.
Engineers must choose the right index type based on their infrastructure constraints and application requirements.

---

# Topic 18: String Matching & Trie Foundations

**Theme:** Building fast prefix-matching data structures and connecting them to tokenization and vocabulary lookup in ML systems.

## 5-Rung Ladder


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 208 (Implement Trie), LeetCode 211 (Add & Search Word), LeetCode 648 (Replace Words), LeetCode 1268 (Search Suggestions), LeetCode 745 (Prefix Suffix Search), LeetCode 212 (Word Search II), CSES 1731 (Word Combinations), Aho-Corasick Automaton.
- **Removed:** LeetCode 14 (Longest Common Prefix — *too basic*), LeetCode 336 (Palindrome Pairs — *strings*), LeetCode 472 (Concatenated Words — *recursion*), LeetCode 1032 (Stream of Characters — *suffix*).
- **Added:** Longest-prefix token lookup engine, greedy longest-match WordPiece tokenizer, vocabulary ID lookup table & `[UNK]` fallback, compact Trie node pointer optimization.

### 1. Foundation: Core Trie Operations
- **Implement Trie (Prefix Tree) (LeetCode #208):** Building the core `insert`, `search`, and `startsWith` operations. ([Link](https://leetcode.com/problems/implement-trie-prefix-tree/))
- **Replace Words (LeetCode #648):** Using a Trie to find the shortest prefix match to replace words in a sentence. ([Link](https://leetcode.com/problems/replace-words/))

### 2. Focused Variant: Flexible Search and Suggestions
- **Design Add and Search Words Data Structure (LeetCode #211):** Adding wildcard matching (e.g., `.`) to Trie traversal using DFS. ([Link](https://leetcode.com/problems/design-add-and-search-words-data-structure/))
- **Search Suggestions System (LeetCode #1268):** Using a Trie (or binary search) to return top-k lexicographical matches for an incrementally typed prefix. ([Link](https://leetcode.com/problems/search-suggestions-system/))

### 3. ML Bridge: Tokenization and Vocabulary
- **Longest-Prefix Token Lookup:** Adapting Trie traversal to greedily consume characters until a valid subword token is formed.
- **Greedy Longest-Match Tokenization:** Understanding how tokenizer algorithms (like WordPiece or BPE) rely on prefix matching to partition text.
- **Vocabulary ID Lookup Table:** Augmenting Trie nodes to store vocabulary IDs, allowing `O(L)` conversion of raw strings to token integers.
- **Unknown-Token (`[UNK]`) Fallback Handling:** Designing the traversal to gracefully handle missing branches by emitting an `[UNK]` ID and recovering the search state.

### 4. Named Mechanism: Advanced Pattern Matching
- **Prefix and Suffix Search (LeetCode #745):** Creating a Trie structure that can answer simultaneous prefix and suffix queries (e.g., indexing `suffix#prefix`). ([Link](https://leetcode.com/problems/prefix-and-suffix-search/))
- **Aho-Corasick Automata:** A foundational algorithm for multi-pattern string search, conceptually building a DFA over a Trie with failure links.

### 5. Stress & Tradeoff: Complex State and Memory Management
- **Word Search II (LeetCode #212):** Combining DFS/backtracking on a 2D grid with a Trie for fast pruning of invalid paths. ([Link](https://leetcode.com/problems/word-search-ii/))
- **Word Combinations (CSES 1731):** Using DP combined with a Trie to efficiently count the number of ways to form a target string from a dictionary. ([Link](https://cses.fi/problemset/task/1731))
- **Compact Trie Memory Accounting & Node Pointer Optimization:** Analyzing the memory overhead of a 26-ary array vs hash map vs linked list in Trie nodes, and implementing memory-compact representations for large ML vocabularies.

---

# Topic 19: Subword Tokenization & Byte-Pair Encoding (BPE)


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 443 (String Compression), LeetCode 1047 (Remove Adj Duplicates), LeetCode 139 (Word Break).
- **Removed:** Substring search (#28 — *false analogy*), LeetCode 316 (Remove Dup Letters — *false analogy*), LeetCode 767 (Reorganize String — *false analogy*), LeetCode 1392 (Happy Prefix — *KMP*), LeetCode 214 (Shortest Palindrome — *KMP*), CSES 1753 (String Matching — *KMP*).
- **Added:** Adjacent symbol pair frequency counting, deterministic max-frequency pair selection, single pair merge application & update, BPE vocabulary training loop ($K$ merges), BPE Encoder/Decoder merge-rank lookup, byte-level pretokenization & UTF-8 boundaries, incremental heap BPE update algorithm.

## Overview
Based on the critical redesign from CURRICULUM-EVALUATION.md, this topic focuses directly on BPE training and merge-rank encoding (Sennrich et al., 2016), replacing disconnected substring algorithms with direct ML infrastructure requirements for tokenization.

## 5-Rung Ladder

### 1. Foundation
Keep these problems as loose foundations to introduce string operations, segmentation boundaries, and adjacent pair reductions:
*   **String Compression (LeetCode #443):** Introduces sequence reduction and counting.
*   **Word Break (LeetCode #139):** Contrasts subword merge approaches with strict dictionary segmentation.
*   **Remove All Adjacent Duplicates In String (LeetCode #1047):** Introduces elementary local symbol merging logic.

*(Removed: substring search (#28), Remove Duplicate Letters (#316), Reorganize String (#767), Construct Repeat Limit (#2182), Longest Happy Prefix (#1392), Shortest Palindrome (#214), CSES String Matching (#1753), Word Break II (#140))*

### 2. Focused Variant
These direct BPE additions establish the core operations needed to train a subword vocabulary:
*   **Pair Counting:** Count adjacent symbol pairs in a given token sequence.
*   **Deterministic Selection:** Identify the most-frequent pair deterministically, handling tie-breaking properly.
*   **Single Merge Update:** Apply a single pair merge across the sequence and appropriately update the adjacent pair counts.

### 3. ML Bridge
Constructing the full pipeline that directly maps to Sennrich et al. (2016):
*   **BPE Training:** Train a BPE vocabulary by iterating the pair counting and merging for a fixed number of merges ($K$).
*   **BPE Encoding:** Encode unseen text using the learned merge-rank lookup table, mimicking the inference phase of modern LLM tokenizers (e.g., GPT, LLaMA, Claude).

### 4. Named Mechanism
Handling practical edge cases in real-world tokenization:
*   **Byte-Level Pretokenization:** Implement byte-level pretokenization and properly handle UTF-8 byte boundaries so that the tokenizer can gracefully fall back to individual bytes for unknown characters.
*   **Boundary Preservation:** Explicitly preserve end-of-word and whitespace boundaries to ensure token semantics don't incorrectly span across words.

### 5. Stress/Tradeoff
Comparing architectural choices for performance scaling:
*   **Naïve Rescanning vs Incremental Heap/Count Update:** Compare the computational tradeoff and implementation complexity of naïvely rescanning the entire sequence after every merge versus maintaining an incremental max-heap and updating counts locally around the merged symbols.

## References
*   Sennrich, R., Haddow, B., & Birch, A. (2016). *Neural Machine Translation of Rare Words with Subword Units*. In Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics.

---

# Topic 20: Convolution Window Geometry, Im2Col & Col2Im


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 1314 (Matrix Block Sum), LeetCode 2373 (Largest Local Values), LeetCode 835 (Image Overlap), Im2Col / Col2Im kernels.
- **Removed:** LeetCode 239 (Sliding Window Max — *deque problem*), LeetCode 2022 (1D to 2D — *moved to Topic 01*).
- **Added:** Naïve 1D & 2D convolution kernels, output shape formula ($O = \lfloor rac{W-K+2P}{S} floor + 1$), receptive field trace calculation, `Im2Col` shape & index flattening, GEMM result reshaping back to 2D, `Col2Im` overlap gradient accumulation, grouped & depthwise separable convs.

## 1. Foundation
- **LeetCode 1314: Matrix Block Sum** (https://leetcode.com/problems/matrix-block-sum/)
- **Naïve 1D Convolution / Cross-correlation**: Introduction to sliding window geometry in 1D, padding ($P$), stride ($S$), and kernel size ($K$). Output shape calculation formula: $O = \lfloor \frac{W - K + 2P}{S} \rfloor + 1$.

## 2. Focused Variant
- **LeetCode 2373: Largest Local Values in a Matrix** (https://leetcode.com/problems/largest-local-values-in-a-matrix/)
- **Naïve Multi-Channel 2D Convolution**: Extending the sliding window to 2D matrices and multiple input/output channels. Involves spatial iteration and channel aggregation.

## 3. ML Bridge
- **LeetCode 835: Image Overlap** (https://leetcode.com/problems/image-overlap/)
- **Col2Im Overlap Gradient Accumulation**: Reversing the convolution operation. Accumulating gradients from overlapping window crops back to the original image grid.

## 4. Named Mechanism
- **Im2Col Shape & Index Matrix Flattening**: Transforming sliding windows into column vectors to convert convolution into matrix multiplication.
- **GEMM Output Matrix Reshaping**: Performing General Matrix Multiplication on the Im2Col output and reshaping the result back into spatial dimensions.

## 5. Stress/Tradeoff
- **Strided & Dilated Convolutions**: Skipping spatial steps (strides) or introducing gaps in the kernel (dilation).
- **Explicit Receptive Field Trace**: Calculating the effective field of view for deeper network layers.
- **Grouped / Depthwise Separable Convolution (Optional Depth)**: Factoring multi-channel convolution to save computation while capturing spatial and channel relationships.

## Changes from Draft
- **Kept**: Matrix Block Sum (#1314), Largest Local Values (#2373), Image Overlap (#835), Im2Col, Col2Im, strided & dilated convolutions.
- **Removed/Moved**: Sliding Window Maximum (#239 - deque problem, not convolution), Convert 1D to 2D (#2022 - shape foundation).
- **Required Additions**: naïve 1D convolution / cross-correlation, output shape calculation formula, naïve multi-channel 2D convolution, explicit receptive field trace, im2col shape & index matrix flattening, GEMM output matrix reshaping, col2im overlap gradient accumulation, grouped / depthwise separable convolution.

---

# Topic 21 V2: Decision Trees & Gradient Boosting (XGBoost)

## Critique Addressed
- **CRITICAL REDESIGN:** Ordinary binary tree problems do not teach decision tree induction or gradient boosting.
- **Keep as minimal prerequisite:** 1 binary tree construction problem (Construct Preorder/Inorder #105), XGBoost second-order gain as endpoint.
- **Remove:** Maximum Subarray (#53), Largest Rectangle (#84), Unique BSTs (#96), Count Complete Nodes (#222), Guess Word (#843), Min Cost Tree (#1130).

## The 5-Rung Ladder

### 1. Foundation
**LeetCode 105: Construct Binary Tree from Preorder and Inorder Traversal**
*   **Purpose:** Establishes the core recursive mechanics for building a binary tree from scratch. This acts as the minimum structural prerequisite to prove recursive tree-building skills before shifting context to ML-specific trees.

### 2. Focused Variant (Decision Tree Core Mechanics)
*   **Concepts:**
    *   **Class-count histogram construction:** Computing the frequencies of each class within a dataset partition.
    *   **Shannon Entropy & Gini Impurity calculation:** Evaluating the impurity of a partition.
    *   **Partition dataset rows by a threshold:** Splitting data into left and right branches based on a feature and a threshold.
*   **Purpose:** Transitions from arbitrary tree nodes to data-driven recursive partitioning, teaching how to evaluate split quality.

### 3. ML Bridge (Split Finding & Prediction)
*   **Concepts:**
    *   **Scan sorted feature values for optimal split using prefix statistics:** Instead of re-calculating impurity for every possible threshold from scratch, sort the feature and use running prefix/suffix counts to find the best split point in $O(N \log N)$ time.
    *   **Predict leaf outputs with a learned decision tree:** Navigating a built tree using feature inputs to reach a leaf and outputting the prediction.
*   **Purpose:** Introduces the algorithmic efficiency needed to train decision trees on continuous features without exhaustive $O(N^2)$ checks per node.

### 4. Named Mechanism (Gradient Boosting & XGBoost Exact Greedy)
*   **Concepts:**
    *   **Residual fitting for gradient boosting:** Training sequential trees where each new tree fits the negative gradient (residuals) of the previous ensemble's predictions.
    *   **Sum gradients ($G_j$) and Hessians ($H_j$) per bin/partition:** Aggregating first-order and second-order statistics for a set of instances $I_j$ in node $j$.
    *   **XGBoost optimal leaf weight ($w_j^* = -\frac{G_j}{H_j + \lambda}$) and split gain equation:** Calculating the structural score / gain for evaluating exact greedy splits.
        *   Gain: $\frac{1}{2} \left[ \frac{G_L^2}{H_L + \lambda} + \frac{G_R^2}{H_R + \lambda} - \frac{(G_L + G_R)^2}{H_L + H_R + \lambda} \right] - \gamma$
    *   **Handle missing-value default split direction:** XGBoost's sparsity-aware split finding (learning the default direction for missing values).
*   **Purpose:** Teaches the mathematical foundation of modern second-order gradient boosting systems like XGBoost.

### 5. Stress/Tradeoff (XGBoost Scalability)
*   **Concepts:**
    *   **Weighted quantile sketch or histogram binning:** Replacing the Exact Greedy algorithm's exhaustive sorting with approximate histogram binning.
    *   Instead of evaluating every single feature value, instances are bucketed into discrete bins (often using Hessians as weights), reducing split candidate evaluation to the number of bins rather than the number of unique feature values.
*   **Purpose:** Moves beyond exact exact algorithms to the approximate methods necessary for scaling gradient boosting to massive datasets that cannot fit in memory or require distributed computing.

---

# Topic 22: Scaled Dot-Product Attention, Masking & KV-Cache Geometry


## Evaluation Modifications & Rationale
- **Status:** New Standalone Topic introduced to precede FlashAttention.
- **Added:** Scaled Dot-Product Attention ($S = rac{QK^T}{\sqrt{d_k}}$), causal lower-triangular & padding masks, row-wise stable softmax & $O = PV$, score matrix VRAM memory footprint ($O(N^2)$), prefill phase vs 1-token decode phase, Key-Value (KV) cache append/lookup indexing, Top-K / Top-P decoding filters.

## 1. Foundation: The Attention Formula
At the heart of the Transformer architecture (Vaswani et al., "Attention Is All You Need") lies the Scaled Dot-Product Attention mechanism. The core computation defines how tokens attend to each other:
1. **Scores:** $S = \frac{Q K^T}{\sqrt{d_k}}$ where $Q$ is queries, $K$ is keys, and $d_k$ is the head dimension.
2. **Masking:** $S_{masked} = S + M$, where $M$ is the mask matrix. For causal attention, $M_{i,j} = -\infty$ for $j > i$.
3. **Probabilities:** $P = \text{Softmax}(S_{masked})$, using a row-wise numerically stable Softmax operation.
4. **Output:** $O = P V$, multiplying probabilities by the Values matrix.
This fundamentally maps an $N \times d$ input sequence to an $N \times d$ output, allowing tokens to share representations.

## 2. Focused Variant: Causal Masking & Score-Matrix Memory
When generating text autoregressively, tokens cannot "look ahead." This necessitates the causal mask.
*   **The $O(N^2)$ Footprint:** The intermediate score matrix $S$ (and $P$) has dimensions $N \times N$, where $N$ is the sequence length. As context lengths grow, computing and storing this $N \times N$ matrix becomes the primary memory bottleneck.
*   **Essential Prerequisite:** Understanding this footprint is crucial for advanced ML infrastructure like FlashAttention (which avoids materializing the $N \times N$ matrix in HBM) and PagedAttention (which manages KV-cache memory fragmentation).

## 3. ML Bridge: Prefill vs. Decode Phase
In practical LLM inference, the attention mechanism operates in two distinct phases:
*   **Prefill Phase (Multi-Token Prompt):** The model processes the entire user prompt simultaneously. Computations involve large matrix multiplications (GEMM) processing an $N_{prompt} \times d$ sequence. This phase is typically compute-bound.
*   **Decode Phase (1-Token Generation):** The model generates one token at a time. The query $Q$ is just $1 \times d$, but it must attend to all previous keys and values. This phase relies on Matrix-Vector multiplications (GEMV) and is heavily memory-bandwidth bound.

## 4. Named Mechanism: KV-Cache Geometry
To avoid recomputing $K$ and $V$ for past tokens during the decode phase, models employ a **KV-Cache**.
*   **Appending & Lookup Indexing:** Instead of full sequence recomputation, the engine computes $K_{new}$ and $V_{new}$ for the single newly generated token, and appends them to the cached $K$ and $V$ tensors.
*   **Tensor Geometry:** The cache must maintain tensors sized roughly `[batch_size, num_heads, max_seq_len, head_dim]`. Managing this memory layout dynamically is a major engineering challenge (leading to innovations like PagedAttention).

## 5. Stress/Tradeoff: Logit Decoding Filters
After attention and feed-forward layers, the model outputs raw logits. Transforming these into a final token choice involves sampling filters that trade off determinism for creativity:
*   **Top-K:** Filters out all but the $K$ most likely next tokens before sampling.
*   **Top-P (Nucleus):** Filters out the long tail of probabilities, keeping only the smallest set of top tokens whose cumulative probability exceeds a threshold $P$.
These steps occur exactly at the boundary of model inference output before feeding the new token back into the KV-cache loop.

---

# Topic 23: FlashAttention & Online Softmax Tiling

**Builds upon**: Topic 22 (Ordinary Attention)


## Evaluation Modifications & Rationale
- **Kept:** SRAM block matrix tiling, online softmax block combine, causal scaled dot-product attention.
- **Removed:** LeetCode 1647 (Static Range Min — *RMQ*), LeetCode 85 (Maximal Rectangle — *stack*), LeetCode 1476 (Subrectangle Queries — *range*), LeetCode 308 (2D Mutable Range Sum — *Fenwick*).
- **Added:** Online softmax block combine ($m^{	ext{new}}, l^{	ext{new}}$), tiled attention loop with running max/sum, FlashAttention forward pass execution, tiled vs exact attention output benchmark, causal block skipping optimization, HBM memory reads/writes FLOP counter.

## Overview
This topic introduces FlashAttention and its core innovation, the online softmax operation. By keeping track of running normalizers and breaking matrix multiplication into tiles, we avoid materializing large intermediate $N \times N$ matrices in High Bandwidth Memory (HBM).

## 5-Rung Ladder

### 1. Foundation: SRAM Block Matrix Tiling
**Objective:** Simulate the memory hierarchy by performing matrix multiplications in small blocks that fit in a constrained "SRAM" buffer.
- Divide large matrices into smaller tiles.
- Perform operations block by block to minimize expensive HBM reads and writes.

### 2. Focused Variant: Online Softmax
**Objective:** Compute the softmax of a large sequence continuously over a stream of values without maintaining the entire sequence in memory.
- Maintain a running maximum ($m$) and a running sum of exponentials ($l$).
- **Combine Step for 2 Blocks:**
  $$m^{\text{new}} = \max(m, m')$$
  $$l^{\text{new}} = e^{m - m^{\text{new}}} l + e^{m' - m^{\text{new}}} l'$$
- Ensures numeric stability while avoiding multiple passes over the data.

### 3. ML Bridge: Causal Scaled Dot-Product Attention
**Objective:** Implement standard causal scaled dot-product attention as a baseline to understand the sequence masking requirements.
- Mask out future tokens to prevent information leakage.
- Standard formulation: $\text{softmax}\left(\frac{QK^T}{\sqrt{d}}\right)V$.

### 4. Named Mechanism: FlashAttention
**Objective:** Combine block matrix tiling and online softmax to implement the FlashAttention algorithm (Dao et al. 2022).
- Tiled attention loop with running max, normalizer, and value accumulator.
- Operates entirely within the fast SRAM limits by loading tiles of $Q, K, V$, computing local attention, and updating the global running state.

### 5. Stress/Tradeoff: Performance & HBM Modeling
**Objective:** Validate the implementation and analyze the performance tradeoffs.
- Compare tiled attention output with ordinary exact attention output to ensure mathematical equivalence.
- **Causal Block Skipping Optimization:** Skip processing entire blocks where all queries are strictly before keys in the causal mask.
- Count exact HBM memory reads/writes in the naïve approach vs. the tiled FlashAttention approach, demonstrating the massive I/O savings.

## Eliminations
Based on the curriculum critique, the following older problems have been removed to focus entirely on FlashAttention and online softmax:
- Static range min (#1647)
- Maximal rectangle (#85)
- Subrectangle queries (#1476)
- Diagonal traverse II (#1424)
- 2D mutable range sums (#308)

---

# Topic 24: Priority Queues, Discrete-Event Scheduling & Continuous Batching


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 621 (Task Scheduler), LeetCode 1882 (Process Tasks Servers), LeetCode 253 (Meeting Rooms II), LeetCode 1834 (Single-Threaded CPU), LeetCode 630 (Course Sched III), LeetCode 373 (K Pairs Smallest Sums), LeetCode 295 (Find Median Stream).
- **Removed:** LeetCode 218 (Skyline — *geometry*), LeetCode 502 (IPO — *greedy*), LeetCode 871 (Refueling Stops — *greedy*), LeetCode 355 (Design Twitter — *heap*).
- **Added:** Arrival/completion event simulation engine, FCFS vs shortest-remaining-work queues, token-budget admission control, iteration-level removal & admission (Orca), prefill vs decode step accounting, waiting-time aging & fairness safeguards, chunked prefill & P99 tail latency metrics.

## 1. Foundation
- **Core Concept**: Priority Queues and basic scheduling logic.
- **Problems**:
  - **Task Scheduler (#621)**: Introduction to resource scheduling with cooldowns and interleaving, providing a foundation for understanding idle time and sequence ordering.
  - **Median Stream (#295)** & **Find K Pairs Smallest Sums (#373)**: Fundamental applications of priority queues to maintain running statistics and ordered streams.

## 2. Focused Variant
- **Core Concept**: Discrete-Event Simulation and Resource Assignment.
- **Problems**:
  - **Process Tasks Using Servers (#1882)**: Introduces the concept of managing multiple resources (servers) with varying weights and availability times.
  - **Meeting Rooms II (#253)**: Tracks peak concurrent resource utilization (rooms needed) over time.
  - **Single-Threaded CPU (#1834)**: Explores a CPU scheduling problem mimicking Shortest Job First (SJF).
  - **Course Schedule III (#630)**: Explores scheduling with deadlines and priority-based swapping.

## 3. ML Bridge
- **Core Concept**: Mapping discrete-event simulation to ML infrastructure.
- **Topics**:
  - **Arrival/Completion Event Simulation Engine**: Transitioning from static arrays to dynamic, time-based event engines.
  - **Queueing Policies**: FCFS (First-Come, First-Served) vs. Shortest-Remaining-Work queues.
  - **Token-Budget Admission Control**: Managing the memory capacity and token budgets constraint inherent in LLM serving (analogous to server capacity).

## 4. Named Mechanism
- **Core Concept**: Continuous Batching (Iteration-Level Scheduling).
- **Key Reference**: Orca (OSDI 2022).
- **Topics**:
  - **Iteration-Level Sequence Removal & Admission**: The core Orca mechanism. Instead of waiting for a full batch of sequences to finish (static batching), the scheduler re-evaluates the batch after every token iteration, retiring finished sequences and injecting newly arrived ones.
  - **Prefill vs. Decode Step Accounting**: Handling the distinct computational profiles of the initial prompt processing (prefill) and the autoregressive token generation (decode).

## 5. Stress & Tradeoff
- **Core Concept**: System-Level Optimizations and Metrics.
- **Topics**:
  - **Scheduling Tradeoffs**: Chunked-prefill scheduling, Preemption & Resume mechanisms when memory limits are reached.
  - **Fairness & Starvation**: Waiting-time aging & fairness policies to ensure long-running or lower-priority requests aren't starved by shortest-job-first approaches.
  - **Metrics**: Evaluating systems on Throughput, Mean Latency, and Tail Latency ($P99$).
  - **Comparison**: Compare the efficiency, head-of-line blocking behavior, and GPU utilization of Static Batching vs. Iteration-Level Continuous Batching.

---

# Topic 25: Block Allocation, KV-Cache Paging & PagedAttention


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 146 (LRU Cache), LeetCode 2254 (Design Allocator), LeetCode 588 (In-Memory File System), Page Faults in LRU simulation.
- **Removed:** LeetCode 380 (Insert Delete GetRandom — *hash*), LeetCode 138 (Copy List Random Pointer — *list*), LeetCode 432 (All O(1) — *doubly linked list*), LeetCode 460 (LFU Cache — *unnecessary policy*).
- **Added:** Free-list fixed-block allocator engine, logical token to physical block table translation, sequence allocation/expansion/freeing lifecycle, internal & external memory fragmentation, KV-cache VRAM calculation ($2 	imes 2 	imes n_{layers} 	imes d_{head}$), reference counting & Copy-on-Write (CoW), PagedAttention block table lookup & gather, prefix block sharing across prompts.

## 1. Overview
This topic explores the core mechanisms of memory allocation, focusing on fixed-block allocators and how they scale up to solve the massive fragmentation issues encountered when caching Key-Value (KV) tensors for Large Language Model (LLM) serving. It culminates in PagedAttention, the foundational memory management algorithm behind vLLM.

**References & Foundations:**
- *PagedAttention:* Kwon et al. 2023, "Efficient Memory Management for Large Language Model Serving with PagedAttention". vLLM introduced OS-level virtual memory paging concepts to LLM KV caches.
- *KV-Cache Memory Requirement:* Each token's KV cache typically requires $2 \times 2 \times n_{\text{layers}} \times d_{\text{head}}$ bytes (2 for K and V, 2 bytes for float16).

## 2. LeetCode Curation
**Keep:**
- **#146 LRU Cache:** Foundational for understanding eviction policies and cache states.
- **#2254 Design Memory Allocator:** Teaches block allocation, freeing memory, and managing contiguous/fragmented spaces.
- **#588 Design In-Memory File System:** Useful for representing hierarchical or block-based storage systems, analogous to prefix sharing.

**Remove:**
- Insert Delete GetRandom O(1) (#380)
- Copy List with Random Pointer (#138)
- All O(1) Data Structure (#432)
- LFU Cache (#460)

## 3. The 5-Rung Ladder

### Rung 1: Foundation
**Caching & Block Allocation Basics**
- Build a standard LRU Cache to manage limited memory and handle page faults (#146).
- Implement a basic memory allocator (#2254) managing raw memory sequences, encountering external and internal fragmentation.

### Rung 2: Focused Variant
**Virtual to Physical Mapping**
- Introduce a free-list fixed-block allocator.
- Translate logical sequence concepts to physical block tables (similar to how operating systems handle virtual memory pages).
- Manage the memory lifecycle: allocate, append, and free sequences over time.
- Calculate internal and external fragmentation metrics explicitly.

### Rung 3: ML Bridge
**The KV-Cache Problem**
- Frame the problem in LLM generation: The KV-cache size grows unpredictably token by token.
- Apply the memory calculation: For a sequence, calculate bytes required per token/layer/head using the formula $2 \times 2 \times n_{\text{layers}} \times d_{\text{head}}$.
- Understand why pre-allocating max context lengths (e.g., 2048 or 8192 tokens) per sequence leads to severe internal fragmentation and low batch sizes.

### Rung 4: Named Mechanism
**PagedAttention**
- Implement logical token to physical block table translation tailored for LLMs.
- Divide the KV cache into fixed-size logical blocks.
- Gather Keys and Values non-contiguously through the block table during the attention computation.
- Schedule admission dynamically based on available physical blocks rather than max-possible length.

### Rung 5: Stress / Tradeoff
**Copy-on-Write (CoW) and Prefix Sharing**
- Handle parallel decoding scenarios like Beam Search.
- Implement reference counting on physical blocks.
- Enable Copy-on-Write (CoW) to duplicate blocks only when divergence occurs, significantly saving memory.
- Share system prompts or common prefixes across multiple concurrent request sequences to maximize throughput.

---

# Topic 26: Weighted Graphs, Network Paths & Communication Topologies


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 743 (Network Delay Time), CSES 1671 (Dijkstra Shortest Route), LeetCode 787 (Cheapest Flights — *Bellman-Ford*), CSES 1672 (Floyd-Warshall), LeetCode 1631 (Path Min Effort), LeetCode 1334 (City Threshold).
- **Removed:** LeetCode 778 (Swim in Rising Water — *duplicate of Min Effort*).
- **Added:** GPU cluster interconnect topology modeling, latency vs bandwidth path cost ($T = lpha + rac{eta}{B}$), message-size-dependent shortest path routing, spanning tree build for broadcast/reduction, topology-aware ring ordering generator, Path vs Ring vs Spanning-Tree cost model.

## 1. Foundation: Dijkstra & Network Delay
- **Problem:** Network Delay Time (LeetCode 743), CSES 1671 (Shortest Routes I)
- **Concept:** Standard Dijkstra’s algorithm to find the single-source shortest path in a graph with non-negative edge weights. This models the baseline communication latency from a parameter server or master node to all worker nodes.

## 2. Focused Variant: Bounded Hops & All-Pairs Shortest Path
- **Problem:** Cheapest Flights Within K Stops (LeetCode 787), CSES 1672 (Shortest Routes II)
- **Concept:** Bellman-Ford algorithm to find shortest paths subject to a maximum number of hops (e.g., routing through a limited depth of switches). Floyd-Warshall for all-pairs shortest paths to evaluate the worst-case latency between any two nodes in a cluster. 

## 3. ML Bridge: Message-Size-Dependent Routing
- **Problem:** GPU Cluster Topology Routing
- **Concept:** Model a GPU cluster device/interconnect topology (NVLink, PCIe, Ethernet) as a weighted graph. Compute the shortest path cost based on latency and bandwidth parameters: $T = \alpha + \frac{\beta}{B}$, where $\alpha$ is latency and $B$ is bandwidth. The shortest path depends dynamically on the message size (a small message prioritizes low $\alpha$, while a large message prioritizes high $B$). Adapted from Path Min Effort (LeetCode 1631) and City Threshold (LeetCode 1334).

## 4. Named Mechanism: Spanning Trees for Broadcast/Reduction
- **Concept:** Construct a spanning tree for collective communication (Broadcast, Reduce). The optimal spanning tree minimizes the total communication cost or latency to distribute gradients or activations across the node hierarchy.

## 5. Stress/Tradeoff: Communication Topologies Comparison
- **Concept:** Topology-aware ring ordering vs Tree models.
- **Evaluation:** Compare the theoretical and practical communication cost models of Path vs Ring vs Tree structures. For instance, evaluate a Ring All-Reduce topology mapped onto the actual physical graph vs a Tree All-Reduce. Find the optimal ring ordering (similar to the Traveling Salesperson Problem on the weighted topology graph) to minimize bottleneck bandwidth.

---

# Topic 27: Circular Buffers, Modular Indexing & Ring Collectives


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 189 (Rotate Array), LeetCode 622 (Design Circular Queue), LeetCode 457 (Circular Array Loop), LeetCode 503 (Next Greater Element II), Shortest distance in circular array.
- **Removed:** LeetCode 918 (Max Sum Circular Subarray — *DP*), LeetCode 462 (Min Moves Equal II — *median*).
- **Added:** Circular buffer enqueue/dequeue with wraparound, tensor splitting into $P$ rank-owned chunks, Reduce-Scatter step indexing ($i_{	ext{send}} = (	ext{rank}-	ext{step})mod P$), All-Gather step indexing ($i_{	ext{send}} = (	ext{rank}-	ext{step}+1)mod P$), Ring-AllReduce trace ($2 \cdot rac{P-1}{P} N$ bytes), uneven chunk padding & memory alignment, Ring vs Tree collective bandwidth model.

## 1. Foundation
**Core Concepts:**
- Modular indexing: mapping an out-of-bounds index back into a fixed array using modulo arithmetic `(i + k) % N`.
- Circular Buffers: maintaining `head` and `tail` pointers to enqueue and dequeue elements in a fixed-size array with wraparound.

**Key Problems:**
- **Rotate Array (#189):** Shift elements in an array to the right by $k$ steps. Teaches in-place array manipulation and cyclic replacements.
- **Design Circular Queue (#622):** Implement a circular queue (ring buffer) using a fixed array. Covers the exact logic needed for buffering network packets or streams in ML infrastructure.

## 2. Focused Variant
**Core Concepts:**
- Traversing arrays with cyclic properties.
- Monotonic stacks over circular domains (e.g., simulating two passes).
- Detecting cycles and shortest distances in cyclic structures.

**Key Problems:**
- **Circular Array Loop (#457):** Detect if a cycle exists in a circular array of relative indices.
- **Shortest distance in circular array:** Finding the minimum number of steps between two indices moving left or right.
- **Next Greater Element II (#503):** Use a monotonic stack to find the next greater element in a circular array, typically solved by iterating $2N$ times and applying `% N`.

## 3. ML Bridge
**Core Concepts:**
- **Data Chunking:** Splitting a large tensor of size $N$ into $P$ rank-owned chunks (where $P$ is the number of GPUs/ranks).
- **Uneven Chunk Padding:** Handling cases where $N$ is not perfectly divisible by $P$, requiring padding or dynamic chunk sizing.
- **Ring Topology Indexing:** 
  - Each GPU is connected in a logical ring: `next = (rank + 1) % P` and `prev = (rank - 1 + P) % P`.
  - **Reduce-Scatter Step Indexing:** In step $k$, GPU $r$ sends chunk `(r - k + P) % P` to GPU `(r + 1) % P` and receives chunk `(r - k - 1 + P) % P` from GPU `(r - 1 + P) % P`.
  - **All-Gather Step Indexing:** Similar modulo arithmetic to broadcast the reduced chunks around the ring.

## 4. Named Mechanism: Ring AllReduce
**Core Concepts:**
- **Mechanism Overview:** The standard algorithm for aggregating gradients across multiple GPUs without bottlenecking on a single parameter server.
- **Two Phases:**
  1. **Reduce-Scatter:** $P-1$ steps. Each GPU sends one chunk to the next and receives one chunk, reducing them. At the end, each GPU holds the fully reduced result for exactly one chunk.
  2. **All-Gather:** $P-1$ steps. Each GPU shares its fully reduced chunk with the rest of the ring.
- **Bandwidth Calculation:**
  - In each step, each GPU sends and receives $\frac{N}{P}$ bytes.
  - Across $2(P-1)$ total steps, the total bytes transferred by each GPU is: $2 \cdot \frac{P-1}{P} N$.
  - This is asymptotically $2N$ bytes, independent of the number of GPUs $P$, making it highly scalable for large tensors.

## 5. Stress/Tradeoff: Ring vs Tree Collectives
**Core Concepts:**
- **Ring AllReduce:**
  - **Pros:** Bandwidth optimal. Peak bandwidth utilization for large messages.
  - **Cons:** Latency scales linearly with $P$. Unsuitable for small tensors (e.g., scalar metrics or tiny embedding updates) because $2(P-1)$ network hops dominate the time.
- **Tree AllReduce:**
  - **Pros:** Latency scales logarithmically $O(\log P)$. Better for small messages.
  - **Cons:** Bandwidth bottleneck at the root/intermediate nodes compared to ring.
- **Tradeoff Analysis:** Compare the latency/bandwidth model. The crossover point depends on the tensor size, network bandwidth, and hop latency. ML libraries like NCCL dynamically switch between Tree/Double-Binary-Tree for small reductions and Ring algorithms for large gradient tensors.

---

# Topic 28: Distributed Training State, Sharding & ZeRO


## Evaluation Modifications & Rationale
- **Kept:** LeetCode 410 (Split Array Largest Sum), LeetCode 1011 (Capacity Ship Packages).
- **Removed:** LeetCode 875 (Koko Eating Bananas — *duplicate search*), LeetCode 84 (Largest Rectangle — *false analogy*), LeetCode 1655 (Distribute Repeating — *backtrack*), LeetCode 1723 (Min Time Jobs — *backtrack*).
- **Added:** Parameter ($P$), Gradient ($G$), Optimizer-State ($O$), and Activation ($A$) byte accounting, Data-Parallel (DP) replicated memory baseline, ZeRO-1 Optimizer-State partitioning math, ZeRO-2 Gradient partitioning math, ZeRO-3 Parameter partitioning math, All-Gather & Reduce-Scatter collective traces, peak vs persistent VRAM calculation.

## Overview
This topic explores the algorithmic problem of optimally partitioning large workloads and states across parallel workers, extending foundational load-balancing techniques (like those seen in LeetCode #410 and #1011) to the domain of large language model training via DeepSpeed's Zero Redundancy Optimizer (ZeRO).

## The 5-Rung Ladder

### 1. Foundation: Replicated Memory Model & Byte Accounting
In standard Data Parallel (DP) training, each device maintains a complete replica of the model. To understand why this fails for large models, we must account for the primary memory consumers (assuming mixed-precision training with Adam):
- **Parameters ($\Psi$)**: 2 bytes per parameter (fp16/bf16).
- **Gradients**: 2 bytes per parameter (fp16/bf16).
- **Optimizer State**: 12 bytes per parameter (4 bytes fp32 momentum, 4 bytes fp32 variance, 4 bytes fp32 master parameter copy).
- Total Model State Memory per GPU: $16\Psi$ bytes.
As models grow, this replicated baseline model rapidly exceeds the capacity of a single GPU, motivating the need for sharding.

### 2. Focused Variant: Partitioning & Load Balancing
- **Split Array Largest Sum (LeetCode #410)** and **Capacity to Ship Packages Within D Days (LeetCode #1011)**.
- These algorithms teach us how to divide a contiguous sequence of elements (e.g., layers, parameters) into $k$ continuous sub-arrays such that the maximum sum among these sub-arrays is minimized.
- This is the theoretical underpinning of load-balancing partitions. When dividing parameters or optimizer states across $N$ GPUs, the goal is to achieve an even distribution of memory and compute load (sharding) without violating dependency boundaries.

### 3. ML Bridge: DeepSpeed ZeRO 1, 2, and 3
ZeRO (Rajbhandari et al., 2020) solves the DP memory wall by partitioning the model state across the $N_d$ data parallel ranks instead of replicating it.
- **ZeRO-1 (Optimizer State Partitioning)**: Only the optimizer state ($12\Psi$) is partitioned. Each GPU updates its own slice of the parameters. Memory per GPU drops to $\approx \frac{12\Psi}{N_d} + 4\Psi$.
- **ZeRO-2 (Gradient Partitioning)**: Optimizer states and gradients ($2\Psi$) are partitioned. Memory per GPU drops to $\approx \frac{14\Psi}{N_d} + 2\Psi$.
- **ZeRO-3 (Parameter Partitioning)**: Optimizer states, gradients, and model parameters ($2\Psi$) are partitioned. Memory per GPU drops to $\approx \frac{16\Psi}{N_d}$. 

### 4. Named Mechanism: Collective Traces
To maintain mathematical equivalence to standard DP while sharding state, ZeRO relies heavily on optimized communication collectives per stage:
- **ZeRO-1/2**: Uses **Reduce-Scatter** on gradients during the backward pass. Each GPU aggregates only the gradient slice it is responsible for. After the optimizer step, an **All-Gather** broadcasts the updated parameter slices to all GPUs.
- **ZeRO-3**: Parameters are discarded when not in use. During the forward pass, **All-Gather** fetches required parameter shards for a specific layer, executes the layer, and then discards them. The same happens in the backward pass, followed by a **Reduce-Scatter** of the gradients.

### 5. Stress & Tradeoff: Alignment and Memory Calculations
- **Uneven Shard Padding & Memory Alignment**: When the number of parameters $\Psi$ is not perfectly divisible by $N_d$, uneven shards occur. Padding is required to align memory buffers for collective communications (like NCCL), introducing slight overheads.
- **Peak vs. Persistent Memory**: ZeRO-3 drastically reduces *persistent* memory (memory held for the duration of the step). However, *peak* memory can spike during the All-Gather of a massive layer's parameters or when accounting for activation byte storage (which scales with batch size and sequence length). Balancing communication overhead against these peak memory spikes is the primary tradeoff of scaling with ZeRO.

---

# Topic 29: Parallelism & Graph Compiler Transforms (V2)


## Evaluation Modifications & Rationale
- **Status:** New Standalone Topic introduced for 3D Parallelism & Graph Compiler Passes.
- **Added:** ColumnParallelLinear ($Y = XW_1$) & RowParallelLinear ($Y = XW_2 + b$ + AllReduce), Pipeline stage partitioning, 1F1B micro-batch schedule & bubble fraction math ($F = rac{P-1}{m+P-1}$), Expert Parallelism (MoE) token routing & aux loss, Common Subexpression Elimination (CSE), Constant folding & dead-code elimination, Operator fusion legality validation, Buffer liveness & memory reuse planning.

## 1. Foundation
The foundation of modern machine learning infrastructure relies on efficient execution and scaling of massive computational graphs. At the core, this involves understanding directed acyclic graphs (DAGs) of operations, data dependencies, and the physical limits of hardware (memory and compute). Compilers like TVM and XLA optimize these DAGs through transformations such as:
- **Common-Subexpression Elimination (CSE):** Identifying and removing redundant computations in the operator DAG.
- **Constant Folding & Dead-Code Elimination:** Pre-computing operations on constants at compile-time and removing nodes whose outputs are never used.

## 2. Focused Variant
Building upon basic graph optimization, we introduce **Operator Fusion** and **Memory Planning**.
- **Operator Fusion Legality:** Compilers must ensure that fusing multiple operators into a single kernel does not violate the DAG's dependency constraints. Creating a circular dependency (cycle) is illegal. Legality checking involves traversing the dependency graph to guarantee the original execution order is preserved.
- **Buffer Liveness & Memory Reuse Planning:** Analyzing the lifespan of intermediate tensors to reuse memory buffers, reducing the memory footprint.
- **Layout Propagation:** Automatically determining and propagating the most efficient memory layout (e.g., NCHW vs. NHWC) across the graph to maximize memory bandwidth and hardware utilization.

## 3. ML Bridge
To scale models beyond a single accelerator, we bridge compiler graph optimizations with distributed execution strategies, particularly **3D Parallelism** (Data, Tensor, and Pipeline Parallelism).
- **Tensor Parallelism (Megatron-LM):**
  - **`ColumnParallelLinear`:** The weight matrix $W_1$ is split column-wise ($Y = X W_1$). Each GPU computes a partial output independently without immediate communication.
  - **`RowParallelLinear`:** The weight matrix $W_2$ is split row-wise ($Y = X W_2 + b$). This layer takes the sharded outputs from the column-parallel layer and typically requires an `AllReduce` operation to aggregate the final result.

## 4. Named Mechanism
For scaling model depth, we use **Pipeline Parallelism**. A key mechanism here is the **1F1B (One-Forward-One-Backward)** micro-batch execution schedule.
- **Pipeline Stage Partitioning:** The model is partitioned into $P$ stages, each assigned to a different device. The global batch is split into $m$ micro-batches.
- **1F1B Schedule:** After a warmup phase, each device alternates between processing one forward pass and one backward pass.
- **Bubble Fraction Math:** The proportion of idle time (pipeline bubble) is calculated as $F = \frac{P-1}{m + P - 1}$. Increasing the number of micro-batches $m$ reduces this bubble fraction.

## 5. Stress/Tradeoff
Scaling further introduces **Expert Parallelism (Mixture-of-Experts / MoE)**, which brings complex tradeoffs in token routing and load balancing.
- **Token Routing & Load Balancing Loss:** MoE routes tokens to a subset of experts. Without balancing, the network may suffer from routing collapse, where only a few experts receive all tokens, causing hardware bottlenecks and wasting capacity.
- **Auxiliary Loss Function:** To penalize uneven routing, an auxiliary loss is added:
  $$\mathcal{L}_{\text{aux}} = \alpha \cdot N \sum_{i=1}^{N} f_i P_i$$
  where $N$ is the number of experts, $f_i$ is the fraction of tokens routed to expert $i$, $P_i$ is the average routing probability for expert $i$, and $\alpha$ is a scaling weight.
- **Tradeoff:** While $\mathcal{L}_{\text{aux}}$ prevents routing collapse, tuning $\alpha$ is critical. A value too high degrades the main task performance by forcing arbitrary token assignment, whereas a value too low leads to load imbalance and inefficient distributed execution.

---

