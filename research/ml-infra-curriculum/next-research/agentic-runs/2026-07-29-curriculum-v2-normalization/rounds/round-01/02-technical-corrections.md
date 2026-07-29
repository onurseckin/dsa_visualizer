# Technical Corrections (Curriculum V2 Normalization)

## 1. Repair Corrupted Notation
- Ensure that LaTeX control characters are properly escaped or formatted correctly across all formulas. This includes correctly rendering: `\mod`, `\frac`, `\alpha`, `\beta`, `\text`, and `\rfloor`. 

## 2. Technical Corrections

### Correct LeetCode ID
- **Correction**: Change LC 2254 to **LeetCode 2502** (Design Memory Allocator).

### Correct KV-Cache Byte Accounting
- **Formula**: `bytes_per_token = 2 * num_layers * num_kv_heads * head_dim * dtype_bytes`

### Distinguish Machine Epsilon from Unit Roundoff
- **FP32 Machine Epsilon**: `eps = 1.19e-7`
- **FP32 Unit Roundoff**: `u = 5.96e-8`

### Correct PyTorch `zero_grad()` Semantics
- **Clarification**: Gradients accumulate by default in PyTorch. The `zero_grad()` function explicitly resets them to 0 or None to prevent accumulation from previous iterations.

### Correct Dilated 1D Conv Formula & Concepts
- **Formula**: `O = floor((W + 2P - D*(K-1) - 1) / S) + 1`
- **Clarifications**:
  - Distinguish between **convolution** (where the kernel is flipped) and **cross-correlation** (where the kernel is not flipped).
  - Note that `col2im` operates as a scatter-add accumulation rather than a direct mapping.

### Correct Network Delay Cost Formula
- **Formula**: `T = \alpha + \text{bytes} / \text{bandwidth}`

### Constrain Over-Generalized Claims
- Ensure the following are framed as parameterized benchmarks with explicit assumptions rather than universal facts:
  - Limits of K-D trees in high-dimensional spaces.
  - Performance characteristics of Ball Trees.
  - Query complexity limits for HNSW.
  - Asymmetric Distance Computation (ADC) $O(m)$ lookups.
  - NCCL algorithm selection criteria based on network topologies.
