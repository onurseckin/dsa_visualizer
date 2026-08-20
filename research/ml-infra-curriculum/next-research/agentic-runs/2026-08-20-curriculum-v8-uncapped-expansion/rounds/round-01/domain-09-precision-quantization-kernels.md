# Domain 9: Numerical Precision, Quantization & Accelerator Kernels

## Topic 34: Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation
### 1. Learning Outcome
Understand IEEE 754 floating-point representations, dynamic range vs precision trade-offs (FP16 vs BF16 vs FP8 E4M3/E5M2), and implement compensated summation (Kahan Algorithm) to eliminate catastrophic cancellation in long reductions.

### 2. Prerequisites & Dependencies
- Binary representations & IEEE 754
- Matrix Layout & Offsets (Topic 01)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Numerical precision issues are notoriously subtle in mixed-precision training. Kahan compensated summation demonstrates how accumulator errors compound across millions of floating-point operations.
**Academic Course Alignment:** CMU 10-714 (Deep Learning Systems) - Numerical formats and precision trade-offs.
**Industry SOTA Alignment:** NVIDIA H100 FP8 tensor cores (E4M3/E5M2 formats), BF16 default training on Google TPUs and Ampere+.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Single Number II](https://leetcode.com/problems/single-number-ii/) - Bit-level arithmetic and accumulator registers build comfort with binary manipulation.
- **Rung 2 (Mechanics)**: [Add Binary](https://leetcode.com/problems/add-binary/) - Carry-over tracking in low-precision registers demonstrates precision boundaries.
- **Rung 3 (ML Bridge)**: [Wikipedia: Kahan summation algorithm](https://en.wikipedia.org/wiki/Kahan_summation_algorithm) - Bringing carry-over concepts into floating-point via $O(1)$ auxiliary running error compensation.
- **Rung 4 (Pure Python Contract)**: Kahan Compensated Float Summation (Contract ID: `CONTRACT-TOPIC-34-KAHAN-PRECISION`) - Students implement the exact accumulation logic, observing how tracking lost low-order bits prevents catastrophic cancellation.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We analyze float accumulation underflow when summing large numbers of infinitesimal weights and contrast dynamic range vs mantissa precision (e.g., FP16 vs BF16).

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-34-KAHAN-PRECISION`
**Title**: Kahan Compensated Float Summation
**Primary Reference URL**: https://en.wikipedia.org/wiki/Kahan_summation_algorithm
**Prompt**: Implement the Kahan summation algorithm to accurately sum an array of floating-point numbers while maintaining a running compensation term `c` for lost low-order bits.
**Input Schema**: `values: list[float]`
**Output Schema**: `total_sum: float`
**Constraints**: Pure Python with `math`. Array length up to 10^5.
**Tolerances**: Exact IEEE-754 double precision match.
**Worked Examples**:
- Input: `[1.0, 1e-16, 1e-16]`
- Output: `1.0000000000000002` (Standard float naive addition loses the second `1e-16` due to rounding; Kahan preserves it).
**Canonical Python Code**:
```python
def kahan_compensated_sum(floats: list[float]) -> float:
    values = floats
    total = 0.0
    c = 0.0  # Running compensation for lost low-order bits
    
    for v in values:
        y = v - c
        t = total + y
        c = (t - total) - y
        total = t
        
    return total
```
**Test Strategy**: Validate summation of `[1.0] + [1e-16]*10` where naive `sum()` fails to register increments.
**Visualizer State Schema**: `{ current_item: float, current_sum: float, lost_bits_compensation: float, compensated_item: float }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Single Number II](https://leetcode.com/problems/single-number-ii/) - Bit-level arithmetic.
2. [Add Binary](https://leetcode.com/problems/add-binary/) - Carry logic.
3. Implement a function to extract the sign, exponent, and mantissa from a 32-bit float.
4. Write a naive cumulative sum and compare its precision loss against Kahan summation for $10^7$ tiny floats.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Kahan Error Bound: Prove that Kahan summation reduces the worst-case error bound from $O(N\epsilon)$ to $O(\epsilon)$ independent of $N$.
2. Dynamic Range: Calculate the exact representable bounds and minimum positive values for FP16, BF16, and FP8 (E4M3 and E5M2).
3. Prove why BF16 prevents underflow in deep network gradients compared to FP16, despite having fewer mantissa bits.

**Part C: Real-World ML Systems & Engineering Questions**
1. FP8 Training: Why do H100s use E4M3 for forward passes and E5M2 for backward passes?
2. Analyze the overhead of maintaining FP32 master weights while doing gradient updates in mixed-precision training.
3. Discuss the impact of catastrophic cancellation in layer normalization and why it's usually computed in FP32.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. All-Reduce Precision Loss: Stress test distributed sums across 1024 GPUs causing massive precision degradation.
2. Overflow in FP16 attention dot products before the softmax scaling factor is applied.
3. NaN propagation through Kahan summation compensation variables.


## Topic 35: Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant)
### 1. Learning Outcome
Understand uniform affine quantization, symmetric vs asymmetric quantization, zero-point mapping, and dequantization for INT8/FP8 model compression.

### 2. Prerequisites & Dependencies
- Floating-Point Formats (Topic 34)
- Tensor Slices & Strides (Topic 02)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Quantization (AWQ, GPTQ, SmoothQuant) reduces model memory footprints by 2-4x and doubles inference throughput on memory-bound workloads.
**Academic Course Alignment:** Stanford CS336 - Model compression and quantization; CMU 10-714 - Acceleration and kernels.
**Industry SOTA Alignment:** AutoAWQ, GPTQ, llama.cpp (GGUF INT4/INT8 formats), BitsAndBytes `nf4`.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Reverse Integer](https://leetcode.com/problems/reverse-integer/) - Bounded integer clamping $[-128, 127]$ and overflow handling build the foundational guardrails for quantization.
- **Rung 2 (Mechanics)**: [Encode Number](https://leetcode.com/problems/encode-number/) - Bit packing into integer representations bridges to low-bit payload representation.
- **Rung 3 (ML Bridge)**: [A White Paper on Neural Network Quantization](https://arxiv.org/abs/2106.08295) (Nagel et al., 2021) - Formalizing uniform affine quantization mapping continuous values to discrete bins.
- **Rung 4 (Pure Python Contract)**: Affine INT8 Scale & Zero-Point Quantization (Contract ID: `CONTRACT-TOPIC-35-AFFINE-QUANT`) - Students implement the scaling factor and zero-point alignment arithmetic directly.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We analyze activation outlier channels destroying INT8 dynamic range, setting up the necessity for techniques like SmoothQuant or FP8 dynamically-scaled formats.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-35-AFFINE-QUANT`
**Title**: Affine Scale & Zero-Point Quantization
**Primary Reference URL**: https://arxiv.org/abs/2106.08295
**Prompt**: Given a continuous float array `x` and target bit width (default 8, values in $[0, 255]$), compute the scale factor $S = (\max(x) - \min(x)) / (2^b - 1)$ and integer zero-point $Z = \text{round}(-\min(x) / S)$, and return the quantized integer array $q = \text{clamp}(\text{round}(x / S + Z), 0, 2^b - 1)$ alongside $(S, Z)$.
**Input Schema**: `x: list[float], bits: int`
**Output Schema**: `tuple[float, int, list[int]]` (Scale S, ZeroPoint Z, Quantized q)
**Constraints**: Bits $b=8$. Array length $N \le 10^4$.
**Tolerances**: Absolute scale error < 1e-6, exact integer zero-point and quantized codes.
**Worked Examples**:
- Input: `x=[-1.0, 0.0, 1.0], bits=8`
- Output: `S = 2.0 / 255 = 0.0078431, Z = 128, q = [0, 128, 255]`
**Canonical Python Code**:
```python
def quantize_affine_int8(x: list[float]) -> tuple[float, int, list[int]]:
    bits = 8
    min_val = min(x)
    max_val = max(x)
    
    qmin = 0
    qmax = (1 << bits) - 1
    
    if max_val == min_val:
        return 1.0, 0, [0] * len(x)
        
    scale = (max_val - min_val) / float(qmax - qmin)
    zero_point = int(round(-min_val / scale))
    zero_point = max(qmin, min(qmax, zero_point))
    
    q = []
    for val in x:
        q_val = int(round(val / scale + zero_point))
        q_val = max(qmin, min(qmax, q_val))
        q.append(q_val)
        
    return scale, zero_point, q
```
**Test Strategy**: Assert that dequantization $x_{\text{approx}} = S \cdot (q - Z)$ reconstructs the original vector with bounded quantization error $\le S / 2$.
**Visualizer State Schema**: `{ continuous_float_line: float[], scale: float, zero_point: int, discrete_int8_bins: int[] }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Reverse Integer](https://leetcode.com/problems/reverse-integer/) - Overflow and bounds handling.
2. [Encode Number](https://leetcode.com/problems/encode-number/) - Custom bit representations.
3. Implement a block-wise INT8 quantizer that scales chunks of 64 elements independently.
4. Write a function to perform an INT8 dot product and accumulate the result in FP32.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Quantization Error: Derive the maximum quantization error bound $\le S/2$ for uniform affine quantization.
2. Zero-Point Algebra: Prove mathematically how the zero-point $Z$ allows exact representation of the real value $0.0$, avoiding asymmetric bias in padded convolutions.
3. SmoothQuant: Formulate the mathematical transformation of migrating activation variance into weights via a smoothing factor $s$.

**Part C: Real-World ML Systems & Engineering Questions**
1. Outlier Channels: Explain why activation outliers in LLMs (e.g., at 6.7B parameters) destroy standard token-wise INT8 quantization and necessitate AWQ/GPTQ.
2. Discuss the memory bandwidth advantages of Weight-Only quantization (INT4/INT8 weights, FP16 activations) over full quantization during batch-size=1 inference.
3. How do bitsandbytes `nf4` (Normal Float 4) data types optimize scale factors for normally distributed neural network weights?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Stress Test: Extreme activation spikes causing the scale factor to explode, squashing all other values to 0.
2. Zero-point clamping errors when intermediate calculations fall outside the representable $0-255$ range.
3. Dequantization accumulation overflow in low-precision Tensor Cores.


## Topic 36: Dense GEMM & SRAM L1 Block Tiling
### 1. Learning Outcome
Understand hardware memory hierarchies, arithmetic intensity, and 2D SRAM tile loops to maximize cache reuse and compute throughput in General Matrix Multiply (GEMM).

### 2. Prerequisites & Dependencies
- Matrix Layout & Memory Offsets (Topic 01)
- Strides & Tensor Views (Topic 02)

### 3. Decision Rationales & Alignments
**Decision Rationale:** GEMM is the single most dominant operation in deep learning. Understanding how 2D block tiling transforms an $O(N^3)$ memory access pattern into an SRAM-cached $O(N^3 / B)$ pattern is essential for kernel optimization (Triton/CUDA).
**Academic Course Alignment:** CMU 10-714 - GPU architecture and GEMM optimizations; UC Berkeley CS294 / SkyLab - Hardware acceleration.
**Industry SOTA Alignment:** OpenAI Triton compiler kernels, NVIDIA cuBLAS tile strategies, CUTLASS templates.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Matrix Multiplication](https://leetcode.com/problems/sparse-matrix-multiplication/) - Canonical 3-loop GEMM establishes the basic operations.
- **Rung 2 (Mechanics)**: [Block Matrix Traversal](https://leetcode.com/problems/determine-whether-matrix-can-be-obtained-by-rotation/) - 2D block index math sets up how matrices can be operated on in sub-grids.
- **Rung 3 (ML Bridge)**: [Anatomy of High-Performance Matrix Multiplication](https://www.cs.utexas.edu/~flame/pubs/GotoTOMS_revision.pdf) (Goto & van de Geijn) - The seminal paper on hierarchical cache blocking.
- **Rung 4 (Pure Python Contract)**: 2D Block Tiled GEMM (Contract ID: `CONTRACT-TOPIC-36-GEMM-TILED`) - Students implement the 2D tiling loop to explicitly manage loading tiles into simulated SRAM and computing outer products.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We discuss register spilling, SRAM bank conflicts for excessively large tile dimensions, and the crucial concept of arithmetic intensity (FLOPs/byte).

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-36-GEMM-TILED`
**Title**: 2D SRAM Tiled GEMM
**Primary Reference URL**: https://arxiv.org/abs/2205.14135
**Prompt**: Implement a 2D tiled matrix multiplication $C = A \times B$ where $A \in \mathbb{R}^{M \times K}$ and $B \in \mathbb{R}^{K \times N}$. Divide matrices into square tiles of size $B_s$, simulate loading tiles into SRAM, and accumulate outer-product tile updates into $C$. Return $C$ and the sequence of tile step coordinates processed.
**Input Schema**: `A: list[list[float]], B: list[list[float]], tile_size: int`
**Output Schema**: `tuple[list[list[float]], list[tuple[int, int, int]]]` (Result matrix C, Tile execution trace)
**Constraints**: $M, K, N \le 128$. `tile_size` divides dimensions evenly or bounds are handled.
**Tolerances**: Absolute error < 1e-5.
**Worked Examples**:
- Input: `A=[[1.0, 2.0], [3.0, 4.0]], B=[[5.0, 6.0], [7.0, 8.0]], tile_size=1`
- Output: `C=[[19.0, 22.0], [43.0, 50.0]]`, trace contains 8 tile inner-loop steps.
**Canonical Python Code**:
```python
def tiled_gemm_2d(
    A: list[list[float]], 
    B: list[list[float]], 
    BM: int, BN: int, BK: int
) -> tuple[list[list[float]], list[tuple[int, int, int]]]:
    M = len(A)
    K = len(A[0])
    N = len(B[0])
    
    C = [[0.0] * N for _ in range(M)]
    trace = []
    
    for ti in range(0, M, BM):
        for tj in range(0, N, BN):
            for tk in range(0, K, BK):
                trace.append((ti, tj, tk))
                i_end = min(M, ti + BM)
                j_end = min(N, tj + BN)
                k_end = min(K, tk + BK)
                
                for i in range(ti, i_end):
                    for k in range(tk, k_end):
                        a_ik = A[i][k]
                        for j in range(tj, j_end):
                            C[i][j] += a_ik * B[k][j]
                            
    return C, trace
```
**Test Strategy**: Validate output against naive matrix multiply across various matrix dimensions and tile sizes ($1, 2, 4, 8$).
**Visualizer State Schema**: `{ A_matrix: float[][], B_matrix: float[][], active_A_tile: int[], active_B_tile: int[], C_accumulator: float[][] }`


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Sparse Matrix Multiplication](https://leetcode.com/problems/sparse-matrix-multiplication/) - Core GEMM layout.
2. [Determine Whether Matrix Can Be Obtained By Rotation](https://leetcode.com/problems/determine-whether-matrix-can-be-obtained-by-rotation/) - Sub-grid block handling.
3. Write a blocked matrix transpose algorithm optimizing for cache-lines.
4. Implement a 2D tile matrix multiplication with edge-case padding handling.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Cache Complexity: Prove that 2D tiling reduces HBM memory access complexity from $O(N^3)$ to $O(N^3 / B)$ where $B$ is the tile size.
2. Arithmetic Intensity: Derive the FLOPs-to-Bytes ratio for a GEMM operation and show how it scales with matrix dimension $N$.
3. Compute the optimal SRAM tile dimensions for an architecture with $128$ KB of shared memory per SM and $256$ registers per thread.

**Part C: Real-World ML Systems & Engineering Questions**
1. Matrix Shapes: Why are LLM linear layers typically sized in multiples of 128 or 256 for NVIDIA Tensor Cores?
2. Compare CuBLAS batched GEMM vs grouped GEMM for routing tokens in MoE architectures.
3. How does Triton compile Python-like nested loops into PTX assembly that orchestrates cooperative thread block loading?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Bank Conflicts: Explain how unaligned shared memory accesses stall warp execution during tile loading.
2. Register Spilling: What happens to performance when the tile size demands more local variables than the SM register file can hold?
3. Edge padding inefficiencies when dimensions are prime numbers (e.g., $N=1013$).


