# Domain 1: Tensor Representation and Numerical Kernels

## Topic 01: Matrix Shape, Indexing & Layout Foundations

### Learning Outcome
Master the physical mapping between logical multidimensional tensors and linear hardware memory, transitioning from basic matrix traversal to formal stride vectors, memory locality, and slice accounting.

### Prerequisites & Dependencies
- **Prerequisites:** Basic array iteration and pointer arithmetic.
- **Outgoing Dependencies:** Topic 02 (Tensor Strides, Views, Broadcasting & Aliasing).

### Decision Rationales (Evaluation Modifications)
- **Kept:** LeetCode 2022 (Convert 1D to 2D), LeetCode 566 (Reshape Matrix), LeetCode 867 (Transpose Matrix), LeetCode 498 (Diagonal Traverse), LeetCode 766 (Toeplitz Matrix).
- **Removed:** LeetCode 304, Forest Queries, LeetCode 885, LeetCode 1572.
- **Added:** Row-major/col-major flat offset math, index reconstruction from flat offset, `numel` shape validation, contiguous stride vector construction, row vs col-major cache locality benchmark, bytes touched calculation for strided slices.

### 5-Rung Learning Ladder

#### 1. Foundation
- **[Convert 1D Array Into 2D Array](https://leetcode.com/problems/convert-1d-array-into-2d-array/)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy introductory problem for basic array shape manipulation and looping.
- **[Reshape the Matrix](https://leetcode.com/problems/reshape-the-matrix/)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy introductory shape analogy teaching element count validation and row-major semantic flattening.

#### 2. Focused Variant
- **[Transpose Matrix](https://leetcode.com/problems/transpose-matrix/)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy stride manipulation introducing axis swapping.
- **[Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Teaches non-standard traversal sequences that require careful boundary checking.
- **[Toeplitz Matrix](https://leetcode.com/problems/toeplitz-matrix/)**
  - *Status:* Optional. 
  - *Difficulty Rationale:* Easy additional stride-pattern exercise.

#### 3. ML Bridge
- **[Multidimensional Offset Calculation](https://numpy.org/doc/stable/reference/arrays.ndarray.html#internal-memory-layout)** (Custom, Contract ID: `CONTRACT-TOPIC-01-LAYOUT`)
  - *Status:* Required.
  - *Difficulty Rationale:* Medium. Bridges concepts to compute row-major 1D flat offsets from N-dimensional coordinates.
- **[Index Reconstruction](https://pytorch.org/docs/stable/tensor_attributes.html#torch.Tensor.stride)** (Custom)
  - *Status:* Required.
  - *Difficulty Rationale:* Medium. Reconstructs logical coordinates backwards from a 1D offset.

#### 4. Named Mechanism
- **[Memory Layout Access Benchmark](https://en.wikipedia.org/wiki/Row-_and_column-major_order)** (Custom)
  - *Status:* Required.
  - *Difficulty Rationale:* Medium. Directly simulates hardware cache locality patterns for row vs column-major orders.

#### 5. Stress / Tradeoff
- **[Calculate Bytes Touched for Strided Slices](https://numpy.org/doc/stable/reference/arrays.indexing.html)** (Custom)
  - *Status:* Required.
  - *Difficulty Rationale:* Hard. Involves complex slice accounting across N-dimensions with custom strides, ensuring memory bounds safety.

### Executable Problem Contract

**ID:** `CONTRACT-TOPIC-01-LAYOUT`
**Title:** Multidimensional Offset Calculation
**Primary Reference URL:** https://numpy.org/doc/stable/reference/arrays.ndarray.html#internal-memory-layout
**Prompt:** Given a tensor's shape, its stride vector (in elements), and a target N-dimensional index, compute the corresponding flat 1D storage offset. If the index is out of bounds for the given shape, raise an exception or return a designated error code (e.g., -1).
**Input Schema:** `shape: List[int], strides: List[int], index: List[int]`
**Output Schema:** `int`
**Constraints:** `1 <= N <= 8`, `1 <= shape[i] <= 10^5`, shapes, strides, and indices are the same length.
**Tolerances:** Exact integer match.
**Worked Examples:**
1. Input: `shape=[3, 4], strides=[4, 1], index=[2, 1]`
   Output: `9`
   *Explanation:* 2 * 4 + 1 * 1 = 9
2. Input: `shape=[2, 2, 2], strides=[4, 2, 1], index=[1, 0, 1]`
   Output: `5`
   *Explanation:* 1 * 4 + 0 * 2 + 1 * 1 = 5
**Canonical Python Code:**
```python
def calculate_offset(shape: list[int], strides: list[int], index: list[int]) -> int:
    if len(shape) != len(strides) or len(shape) != len(index):
        return -1
    offset = 0
    for i in range(len(shape)):
        if index[i] < 0 or index[i] >= shape[i]:
            return -1
        offset += index[i] * strides[i]
    return offset
```
**Test Strategy:**
- Valid in-bound accesses across 1D to 8D tensors.
- Out of bound indices (too large or negative).
- Mixed strides (contiguous and non-contiguous).
**Visualizer State:** 
- Visual mapping of N-dimensional grid cells highlighted corresponding to the flat 1D array index being traversed.

---

## Topic 02: Tensor Strides, Views, Broadcasting & Aliasing

### Learning Outcome
Understand the physical memory layout of tensors, specifically how shapes and strides map to underlying 1D storage, and master the complex rules of zero-copy views, broadcasting, and aliasing found in modern ML frameworks.

### Prerequisites & Dependencies
- **Prerequisites:** Topic 01 (Matrix Shape, Indexing & Layout Foundations).
- **Outgoing Dependencies:** Topic 03 (Dense MatMul), Topic 29a (Graph Compiler Transforms).

### Decision Rationales (Evaluation Modifications)
- **Kept (Canonical Home in Topic 01; Cross-Referenced in Topic 02):** LeetCode 566 (Reshape Matrix - Canonical: Topic 01), LeetCode 867 (Transpose Matrix - Canonical: Topic 01), LeetCode 48 (Rotate Image - Canonical: Topic 02), LeetCode 498 (Diagonal Traverse - Canonical: Topic 01).
- **Removed:** LeetCode 36 (Valid Sudoku - false analogy), LeetCode 312 (Burst Balloons - false analogy), LeetCode 668 (Kth Smallest Mult Table - false analogy), Matrix Exponentiation.
- **Added:** Storage offset formula, zero-copy transpose/slice index math, view compatibility rules, broadcasting shape inference, broadcast gradient reduction, PyTorch `as_strided`, contiguity repair.

### 5-Rung Learning Ladder

#### 1. Foundation
- **[Reshape the Matrix](https://leetcode.com/problems/reshape-the-matrix/)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy. Introduces the flattening and unflattening logic essential for zero-copy reshape comprehension.
- **[Transpose Matrix](https://leetcode.com/problems/transpose-matrix/)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy. Directly applies to swapping axes to change traversal order.
- **[Rotate Image](https://leetcode.com/problems/rotate-image/)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Teaches advanced index mapping and in-place coordinate transformations.
- **[Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/)**
  - *Status:* Optional. 
  - *Difficulty Rationale:* Medium. Foundational for understanding arbitrary strides.

#### 2. Focused Variant
- **[Zero-Copy Transpose and Slice](https://pytorch.org/docs/stable/generated/torch.transpose.html)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Operates purely on shape/stride vectors without touching the data array.
- **[View Compatibility Rules](https://pytorch.org/docs/stable/tensor_view.html)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Decides if a reshape can be contiguous (zero-copy) or requires a data copy.

#### 3. ML Bridge
- **[Broadcasting Shape Inference](https://pytorch.org/docs/stable/notes/broadcasting.html)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Matches PyTorch's trailing-dimension alignment rules.
- **[Broadcast Gradient Reduction](https://pytorch.org/docs/stable/notes/broadcasting.html#backward-pass-for-broadcasting)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Reduces gradients over broadcasted dimensions back to the source shape.

#### 4. Named Mechanism
- **[PyTorch as_strided Mechanics](https://pytorch.org/docs/stable/generated/torch.as_strided.html)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Exposes raw stride manipulation similar to PyTorch internals.
- **[Memory Aliasing Detection](https://pytorch.org/docs/stable/tensor_attributes.html#torch.Tensor.data_ptr)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Detects overlapping memory regions from `as_strided` views.

#### 5. Stress / Tradeoff
- **[Contiguity Repair (contiguous())](https://pytorch.org/docs/stable/generated/torch.Tensor.contiguous.html)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Materializes non-contiguous strided views into dense, row-major memory blocks.

### Executable Problem Contract

**ID:** `CONTRACT-TOPIC-02-VIEW`
**Title:** Storage Offset and Stride Math
**Primary Reference URL:** https://pytorch.org/docs/stable/tensor_view.html
**Prompt:** Given a tensor described by its `shape`, `stride`, and `storage_offset`, compute the 1D flat storage indices corresponding to a list of N-dimensional queries. Also handle cases with 0-dimensional scalars. If any stride is negative, offset mathematics should still resolve to the correct storage index. Raise an error if an index is out-of-bounds for the given shape.
**Input Schema:** `shape: List[int], stride: List[int], storage_offset: int, queries: List[List[int]]`
**Output Schema:** `List[int]`
**Constraints:** `0 <= len(shape) <= 8` (0 length implies scalar), `0 <= queries <= 1000`. 
**Tolerances:** Exact integer match.
**Worked Examples:**
1. Input: `shape=[3, 3], stride=[3, 1], storage_offset=0, queries=[[0,0], [1,2]]`
   Output: `[0, 5]`
   *Explanation:* query [1,2] -> offset 0 + 1*3 + 2*1 = 5.
2. Input: `shape=[], stride=[], storage_offset=42, queries=[[]]`
   Output: `[42]`
   *Explanation:* 0-dimensional scalar accesses the base offset.
3. Input: `shape=[2], stride=[-1], storage_offset=1, queries=[[0], [1]]`
   Output: `[1, 0]`
   *Explanation:* query [0] -> 1 + 0*(-1) = 1. query [1] -> 1 + 1*(-1) = 0.
**Canonical Python Code:**
```python
def resolve_storage_indices(shape: list[int], stride: list[int], storage_offset: int, queries: list[list[int]]) -> list[int]:
    results = []
    for query in queries:
        if len(query) != len(shape):
            raise ValueError("Query dimensionality mismatch.")
        idx = storage_offset
        for i, q in enumerate(query):
            if q < 0 or q >= shape[i]:
                raise ValueError("Out of bounds.")
            idx += q * stride[i]
        results.append(idx)
    return results
```
**Test Strategy:**
- Valid queries on multi-dimensional contiguous and non-contiguous tensors.
- Negative stride scenarios.
- 0-dimensional scalar tensor representations.
- Out of bounds boundary violation errors.
**Visualizer State:** 
- Diagram mapping logical coordinates to physical 1D storage array boxes, highlighting aliasing or gaps.

---

## Topic 03: Dense & Sparse Matrix Multiplication & SRAM Tiling

### Learning Outcome
Understand the mechanics of matrix multiplication, memory access patterns (row-major vs. column-major execution), block-wise operations to overcome the memory wall (SRAM tiling), and exploiting sparsity using specialized formats.

### Prerequisites & Dependencies
- **Prerequisites:** Topic 02 (Tensor Strides, Views, Broadcasting & Aliasing).
- **Outgoing Dependencies:** Topic 04 (Floating-Point Precision), Topic 29b (Tensor Parallelism).

### Decision Rationales (Evaluation Modifications)
- **Kept:** LeetCode 311 (Sparse Matrix Multiplication), HackerRank MapReduce MatMul, Block-wise GEMM endpoint.
- **Removed:** LeetCode 1074, LeetCode 1314, LeetCode 2536, Forest Queries, SVD / PCA.
- **Added:** Dot product vector kernel, matrix-vector multiplication, naive dense GEMM ($O(N^3)$), `ijk` vs `ikj` loop-order memory access comparison, SRAM Tiled GEMM with edge tiles, global memory load/store counter, COO and CSR sparse GEMM formats.

### 5-Rung Learning Ladder

#### 1. Foundation
- **[Dot Product Vector Kernel](https://en.wikipedia.org/wiki/Dot_product)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy. The fundamental 1D building block for multiplication and accumulation.
- **[Matrix-Vector Multiplication](https://en.wikipedia.org/wiki/Matrix-vector_multiplication)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy. Extends dot product to 2D.
- **[Naive Dense Matrix Multiplication](https://en.wikipedia.org/wiki/Matrix_multiplication_algorithm)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Standard $O(N^3)$ algorithm establishing shape checks.

#### 2. Focused Variant
- **[Loop-Order Memory Access Comparison (ijk vs ikj)](https://en.wikipedia.org/wiki/Loop_nest_optimization)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Demonstrates stride-1 contiguous memory access in row-major languages.
- **[Arithmetic Intensity Calculation](https://en.wikipedia.org/wiki/Roofline_model)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Introduces FLOPs/byte metric to identify compute-bound vs memory-bound kernels.

#### 3. ML Bridge
- **[SRAM Tiled Matrix Multiplication](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#shared-memory)** (Custom, Contract ID: `CONTRACT-TOPIC-03-GEMM-TILED`)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Breaks matrices into tiles that fit in cache, with crucial edge-tile handling.
- **[Memory Load/Store Counter](https://developer.nvidia.com/nsight-compute)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Practical exercise to instrument implementations and prove tiling benefits.

#### 4. Named Mechanism
- **[Sparse Matrix Multiplication](https://leetcode.com/problems/sparse-matrix-multiplication/) (LeetCode 311)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. The standard algorithm skipping zero-valued elements.
- **[Sparse COO & CSR Matrix Multiplication](https://en.wikipedia.org/wiki/Sparse_matrix#Compressed_sparse_row_(CSR,_CRS_or_Yale_format))** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Operates over heavily optimized sparse representation formats.

#### 5. Stress / Tradeoff
- **[MapReduce Matrix Multiplication](https://www.hackerrank.com/challenges/map-reduce-advanced-matrix-multiplication/problem)**
  - *Status:* Optional. 
  - *Difficulty Rationale:* Hard. Distributed decomposition teaching the tradeoff between network communication and compute power.

### Executable Problem Contract

**ID:** `CONTRACT-TOPIC-03-GEMM-TILED`
**Title:** SRAM Tiled GEMM
**Primary Reference URL:** https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#shared-memory
**Prompt:** Implement a tiled General Matrix Multiply (GEMM) for $C = A \times B$. You are given matrices $A$ (size $M \times K$) and $B$ (size $K \times N$), and a `TILE_SIZE`. Calculate $C$ (size $M \times N$) using block-wise operations. You must properly handle "edge tiles" where dimensions are not perfectly divisible by `TILE_SIZE`, using zero-padding conceptually or explicit bounds checking. To prove tiling, your output must also include a trace of the order blocks were computed. Use a deterministic accumulation order to ensure floating-point reproducibility. Compare outputs using a defined tolerance.
**Input Schema:** `A: List[List[float]], B: List[List[float]], TILE_SIZE: int`
**Output Schema:** `Tuple[List[List[float]], List[dict]]`
**Constraints:** $1 \le M, K, N \le 256$, `1 <= TILE_SIZE <= 64`.
**Tolerances:** Absolute error $\le 1e-5$, Relative error $\le 1e-5$.
**Worked Examples:**
1. Input: `A=[[1, 2, 3], [4, 5, 6]], B=[[7, 8], [9, 10], [11, 12]], TILE_SIZE=2`
   Output: `([[58, 64], [139, 154]], [{'i': 0, 'j': 0, 'k': 0, 'tile_A': [[1, 2], [4, 5]], 'tile_B': [[7, 8], [9, 10]]}, {'i': 0, 'j': 0, 'k': 2, 'tile_A': [[3], [6]], 'tile_B': [[11, 12]]}])`
   *Explanation:* The computation uses tiles of 2x2. A's tiles are 2x2 and 2x1. B's tiles are 2x2 and 1x2.
2. Input: `A=[[1]], B=[[2]], TILE_SIZE=2`
   Output: `([[2]], [{'i': 0, 'j': 0, 'k': 0, 'tile_A': [[1]], 'tile_B': [[2]]}])`
   *Explanation:* 1x1 matrix fits entirely in one edge tile.
**Canonical Python Code:**
```python
def tiled_gemm(A: list[list[float]], B: list[list[float]], TILE_SIZE: int) -> tuple[list[list[float]], list[dict]]:
    M, K = len(A), len(A[0])
    K2, N = len(B), len(B[0])
    if K != K2:
        raise ValueError("Inner dimensions must match.")
    
    C = [[0.0 for _ in range(N)] for _ in range(M)]
    trace = []
    
    for i_block in range(0, M, TILE_SIZE):
        for j_block in range(0, N, TILE_SIZE):
            for k_block in range(0, K, TILE_SIZE):
                
                i_end = min(i_block + TILE_SIZE, M)
                j_end = min(j_block + TILE_SIZE, N)
                k_end = min(k_block + TILE_SIZE, K)
                
                tile_A = [[A[i][k] for k in range(k_block, k_end)] for i in range(i_block, i_end)]
                tile_B = [[B[k][j] for j in range(j_block, j_end)] for k in range(k_block, k_end)]
                
                trace.append({
                    'i': i_block,
                    'j': j_block,
                    'k': k_block,
                    'tile_A': tile_A,
                    'tile_B': tile_B
                })
                
                for i in range(i_block, i_end):
                    for j in range(j_block, j_end):
                        acc = 0.0
                        for k in range(k_block, k_end):
                            acc += A[i][k] * B[k][j]
                        C[i][j] += acc
    return C, trace
```
**Test Strategy:**
- Matrices perfectly divisible by `TILE_SIZE`.
- Matrices where $M, K, N$ leave different remainders modulo `TILE_SIZE`.
- Validation against a naive $O(N^3)$ standard dense multiplier using `math.isclose` within tolerances.
**Visualizer State:** 
- A grid showing matrices A and B overlaid with tile boundaries, highlighting the active block in SRAM and the corresponding output block accumulating results.

---

## Topic 04: Floating-Point Representation, Precision & Stable Reductions

### Learning Outcome
Understand the bit-level anatomy of floating-point numbers, recognize when floating-point arithmetic breaks algebraic laws (catastrophic cancellation), and apply standard algorithmic solutions (compensated summation) to maintain precision in system-level reductions.

### Prerequisites & Dependencies
- **Prerequisites:** Basic arithmetic and array iterations.
- **Outgoing Dependencies:** Topic 05 (Integer Quantization), Topic 11 (Stable Softmax), Topic 27 (Ring Collectives).

### Decision Rationales (Evaluation Modifications)
- **Status:** New Standalone Topic introduced to address missing numerical foundations.
- **Added:** FP32/FP16/BF16 bit layout & range, unit roundoff & catastrophic cancellation, non-associativity accumulation order, pairwise summation algorithm, mixed-precision FP32 accumulation, Kahan compensated summation, Welford online mean & variance.

### 5-Rung Learning Ladder

#### 1. Foundation
- **[IEEE 754 & Bit Interpretation](https://en.wikipedia.org/wiki/IEEE_754)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy. Teaches bit-level anatomy (Sign, Exponent, Mantissa) for FP32, FP16, and BF16.
- **[Machine Epsilon & Unit Roundoff](https://en.wikipedia.org/wiki/Machine_epsilon)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Easy. Teaches the explicit distinction between Machine Epsilon ($\epsilon \approx 1.19e-7$ for FP32) and Unit Roundoff ($u \approx 5.96e-8$ for FP32), and their role in bounding relative error.

#### 2. Focused Variant
- **[Catastrophic Cancellation Detection](https://en.wikipedia.org/wiki/Catastrophic_cancellation)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Identifies precision loss when subtracting nearly equal numbers.
- **[Accumulation-Order Effects & Pairwise Summation](https://en.wikipedia.org/wiki/Pairwise_summation)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Demonstrates non-associativity of floating point addition, utilizing divide-and-conquer to reduce error.

#### 3. ML Bridge
- **[Mixed-Precision Training Choices](https://arxiv.org/abs/1710.03740)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Discusses FP16 vs BF16 vs FP32 accumulation choices.

#### 4. Named Mechanism
- **[Kahan Compensated Summation](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)** (Custom, Contract ID: `CONTRACT-TOPIC-04-KAHAN`)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Implements the standard algorithm that tracks errors in a running compensation term.
- **[Welford's Algorithm](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Implements stable, single-pass mean and variance calculation avoiding catastrophic cancellation.

#### 5. Stress / Tradeoff
- **[Distributed Reductions & Overflow Management](https://pytorch.org/docs/stable/distributed.html)** (Custom)
  - *Status:* Optional. 
  - *Difficulty Rationale:* Hard. Scales numerical stability to ring-allreduce operations ensuring deterministic accumulation order.

### Executable Problem Contract

**ID:** `CONTRACT-TOPIC-04-KAHAN`
**Title:** Kahan Compensated Summation
**Primary Reference URL:** https://en.wikipedia.org/wiki/Kahan_summation_algorithm
**Prompt:** Implement the Kahan summation algorithm to sum a list of floating-point numbers. The algorithm maintains a running compensation term to track lost low-order bits during addition. Handle NaN and Inf inputs by propagating them correctly per IEEE 754 rules. Return the final sum. Note: Your environment may perform operations in higher precision than FP32. To simulate loss, you might be provided specific edge cases that trigger the compensation logic strongly. 
**Input Schema:** `values: List[float]`
**Output Schema:** `float`
**Constraints:** `0 <= len(values) <= 10^5`, floats are IEEE 754 double precision.
**Tolerances:** The implementation must perfectly match the analytical Kahan accumulator steps.
**Worked Examples:**
1. Input: `values=[1.0, 1e-16, 1e-16]`
   Output: `1.0000000000000002`
   *Explanation:* In Python's FP64, `1.0 + 1e-16` loses the `1e-16` without Kahan. Kahan preserves it in `c`, and the second `1e-16` makes `y = 2e-16`, which is representable when added to `1.0` giving `1.0000000000000002`.
2. Input: `values=[float('inf'), 1.0]`
   Output: `inf`
**Canonical Python Code:**
```python
import math

def kahan_sum(values: list[float]) -> float:
    sum_val = 0.0
    c = 0.0  # A running compensation for lost low-order bits.
    for val in values:
        if math.isnan(sum_val) or math.isnan(val):
            sum_val = float('nan')
            c = 0.0
            continue
        if math.isinf(sum_val) or math.isinf(val):
            sum_val += val
            c = 0.0
            continue
            
        y = val - c
        t = sum_val + y
        c = (t - sum_val) - y
        sum_val = t
    return sum_val
```
**Test Strategy:**
- Lists with drastically different magnitudes.
- Lists containing NaN, +Inf, -Inf.
- Sequences that trigger catastrophic cancellation.
**Visualizer State:** 
- A running trace showing `sum_val`, `val`, `y` (compensated val), `t` (new sum), and `c` (new error) for each step in a table.

---

## Topic 05: Integer Arithmetic, Scaling & Tensor Quantization

### Learning Outcome
Translate continuous floating-point spaces into discrete integer buckets (quantization), master bitwise operations, prevent overflow, and evaluate the error (KL divergence) of precision reduction.

### Prerequisites & Dependencies
- **Prerequisites:** Topic 04 (Floating-Point Precision).
- **Outgoing Dependencies:** None in this domain. (Connects to downstream optimizations).

### Decision Rationales (Evaluation Modifications)
- **Kept:** LeetCode 7 (Reverse Integer), LeetCode 29 (Divide Two Integers), LeetCode 371 (Sum of Two Integers), LeetCode 201 (Bitwise AND of Numbers Range).
- **Removed:** LeetCode 311 (moved to Topic 03), Focal Loss (moved to Topic 10), Codeforces AND 0 Sum Big.
- **Added:** INT8/INT32 signed/unsigned range, scale ($S$) & zero-point ($Z$) derivation, symmetric vs asymmetric quantization, per-tensor vs per-channel parameters, INT8 GEMM with INT32 accumulators, requantization from INT32 to INT8, static/dynamic calibration & KL error.

### 5-Rung Learning Ladder

#### 1. Foundation
- **[Sum of Two Integers](https://leetcode.com/problems/sum-of-two-integers/) (LeetCode 371)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Introduces bitwise operations (XOR for addition, AND for carry).
- **[Bitwise AND of Numbers Range](https://leetcode.com/problems/bitwise-and-of-numbers-range/) (LeetCode 201)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Builds familiarity with bitwise representations and common prefixes.

#### 2. Focused Variant
- **[Reverse Integer](https://leetcode.com/problems/reverse-integer/) (LeetCode 7)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Demands meticulous overflow detection before pushing 32-bit values out of bounds.
- **[Divide Two Integers](https://leetcode.com/problems/divide-two-integers/) (LeetCode 29)**
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Implements division via bit shifts, reinforcing truncation and extreme bounds.

#### 3. ML Bridge
- **[Scale & Zero-Point Derivation](https://pytorch.org/docs/stable/quantization.html)** (Custom, Contract ID: `CONTRACT-TOPIC-05-QUANTIZATION`)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Derives $S$ and $Z$ from `min`/`max` ranges for asymmetric quantization.
- **[Symmetric vs Asymmetric Quantization](https://pytorch.org/docs/stable/quantization.html)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Medium. Explores when zero must be perfectly aligned versus mapping arbitrary spans.

#### 4. Named Mechanism
- **[Tensor Mapping & Per-Channel Parameters](https://pytorch.org/docs/stable/quantization.html#quantized-tensors)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Distinguishes per-tensor from per-channel granularity.
- **[INT8 GEMM with INT32 Accumulation](https://developer.nvidia.com/blog/int8-inference-autonomous-vehicles-tensorrt/)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Demonstrates why dot products of INT8 inputs demand an INT32 accumulator to prevent overflow.

#### 5. Stress / Tradeoff
- **[Requantization & KL Error Metrics](https://arxiv.org/abs/1705.02061)** (Custom)
  - *Status:* Required. 
  - *Difficulty Rationale:* Hard. Calculates requantization scales downcasting INT32 back to INT8, measuring KL divergence.

### Executable Problem Contract

**ID:** `CONTRACT-TOPIC-05-QUANTIZATION`
**Title:** Scale and Zero-Point Quantization
**Primary Reference URL:** https://pytorch.org/docs/stable/quantization.html#quantization-equation
**Prompt:** Given an array of floating-point numbers `x` and a target bit-width (e.g. `8` for INT8), compute the asymmetric quantization parameters `scale` (S) and `zero_point` (Z). Then, apply the quantization formula to convert the array into clamped integers. 
The mapping is defined by $x_q = \text{clamp}(\text{round}(x / S + Z), q_{min}, q_{max})$. 
Use dynamic calibration based on the absolute minimum and maximum of the input array. If the array is empty or constant, handle it gracefully ($S=1.0, Z=0$). Output the tuple `(S, Z, quantized_array)`.
**Input Schema:** `x: List[float], bit_width: int`
**Output Schema:** `Tuple[float, int, List[int]]`
**Constraints:** `0 <= len(x) <= 10^5`, `bit_width` is typically 8. $q_{min} = 0$, $q_{max} = 2^{b}-1$ for unsigned asymmetric quantization.
**Tolerances:** `scale` matched to $1e-5$, `zero_point` exact integer, `quantized_array` exact integer match.
**Worked Examples:**
1. Input: `x=[-1.0, 0.0, 1.0], bit_width=8`
   Output: `(0.007843137, 128, [0, 128, 255])`
   *Explanation:* `qmin=0, qmax=255`. $S = (1.0 - (-1.0)) / (255 - 0) = 2.0 / 255 \approx 0.007843137$. $Z = \text{round}(0 - (-1.0)/S) = \text{round}(127.5) = 128$ (Python round-to-even).
2. Input: `x=[5.0, 5.0], bit_width=8`
   Output: `(1.0, 0, [5, 5])`
   *Explanation:* Constant array defaults to S=1.0, Z=0.
**Canonical Python Code:**
```python
def quantize_asymmetric(x: list[float], bit_width: int) -> tuple[float, int, list[int]]:
    if not x:
        return 1.0, 0, []
    
    x_min, x_max = min(x), max(x)
    q_min, q_max = 0, (1 << bit_width) - 1
    
    if x_min == x_max:
        S = 1.0
        Z = 0
        q_arr = [max(q_min, min(q_max, round(v))) for v in x]
        return S, Z, q_arr
        
    S = (x_max - x_min) / (q_max - q_min)
    Z = round(q_min - x_min / S)
    
    # clamp Z
    Z = max(q_min, min(q_max, Z))
    
    q_arr = []
    for v in x:
        q_val = round(v / S + Z)
        q_val = max(q_min, min(q_max, q_val))
        q_arr.append(int(q_val))
        
    return S, Z, q_arr
```
**Test Strategy:**
- Standard distributed floating arrays.
- Constant arrays (all same value).
- Empty arrays.
- Negative only, positive only, and zero-centered spans.
**Visualizer State:** 
- A number line showing the continuous `min/max` being mapped to the discrete integer buckets `q_min` to `q_max`.
