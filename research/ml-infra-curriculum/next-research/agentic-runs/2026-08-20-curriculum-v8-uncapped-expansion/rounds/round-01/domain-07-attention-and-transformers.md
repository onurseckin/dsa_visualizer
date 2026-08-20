# Domain 7: Attention Mechanisms & Transformer Architecture

## Topic 28: Scaled Dot-Product Attention & Causal KV-Cache Masking
### 1. Learning Outcome
Students will master the mathematical derivation and implementation of scaled dot-product attention, causal autoregressive masking, and state accumulation for autoregressive language models.

### 2. Prerequisites & Dependencies
- Dense Matrix Multiplication (Topic 36)
- LogSumExp & Softmax Normalization (Topic 20)
- Tensor Views & Strides (Topic 02)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Scaled Dot-Product Attention (SDPA) is the core compute kernel of the Transformer architecture. Understanding the $-\infty$ upper-triangular masking and $1/\sqrt{d_k}$ scaling factor prevents numerical variance explosion.
**Academic Course Alignment:** Stanford CS336 (Language Modeling from Scratch) - Attention mechanics and autoregressive masking; CMU 10-714 (Deep Learning Systems) - Transformer computation graphs.
**Industry SOTA Alignment:** PyTorch `F.scaled_dot_product_attention`, OpenAI GPT-4, Google Gemini dense attention layers.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Matrix Block Sum](https://leetcode.com/problems/matrix-block-sum/) - We begin by mastering 2D matrix accumulation and coordinate bounds to build intuition for interacting grid spaces.
- **Rung 2 (Mechanics)**: [Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/) - We introduce triangular matrix indexing, which forms the mechanical basis for understanding causal (look-back only) masking.
- **Rung 3 (ML Bridge)**: [Attention Is All You Need](https://arxiv.org/abs/1706.03762) (Vaswani et al., 2017) - We bridge to the formal scaled dot-product attention formulation $\text{Softmax}(QK^T / \sqrt{d_k})V$, linking the mechanical triangluar masks to the autoregressive constraint.
- **Rung 4 (Pure Python Contract)**: Causal Prefill Attention & Masking (Contract ID: `CONTRACT-TOPIC-28-SDPA-CAUSAL`) - Students implement the precise tensor math in pure Python to enforce absolute clarity on tensor shapes and scaling laws without library magic.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We analyze the $O(N^2)$ quadratic memory and compute bottleneck for long sequence lengths, setting the stage for hardware-aware IO optimizations (FlashAttention).

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-28-SDPA-CAUSAL`
**Title**: Causal Masked Scaled Dot-Product Attention
**Primary Reference URL**: https://arxiv.org/abs/1706.03762
**Prompt**: Given query matrix $Q \in \mathbb{R}^{N \times d}$, key matrix $K \in \mathbb{R}^{N \times d}$, and value matrix $V \in \mathbb{R}^{N \times d}$, compute the causal scaled dot-product attention output $O \in \mathbb{R}^{N \times d}$. Mask out future positions ($j > i$) with $-\infty$ before computing softmax along each row.
**Input Schema**: `Q: list[list[float]], K: list[list[float]], V: list[list[float]]`
**Output Schema**: `O: list[list[float]]`
**Constraints**: $1 \le N \le 128$, $1 \le d \le 64$.
**Tolerances**: Absolute error < 1e-5.
**Worked Examples**:
- Input: `Q=[[1.0, 0.0], [0.0, 1.0]], K=[[1.0, 0.0], [0.0, 1.0]], V=[[1.0, 2.0], [3.0, 4.0]]`
- Output: Row 0 attends only to pos 0 ($[1.0, 2.0]$), Row 1 attends to both pos 0 and 1.
**Canonical Python Code**:
```python
import math

def scaled_dot_product_attention_causal(
    Q: list[list[float]], 
    K: list[list[float]], 
    V: list[list[float]]
) -> list[list[float]]:
    N = len(Q)
    d_k = len(Q[0])
    scale = 1.0 / math.sqrt(d_k)
    
    # 1. Compute raw scores: S = Q * K^T * scale
    # 2. Apply causal mask (set j > i to -inf)
    # 3. Softmax along each row
    # 4. Multiply by V
    
    O = [[0.0] * d_k for _ in range(N)]
    
    for i in range(N):
        row_scores = []
        for j in range(N):
            if j > i:
                row_scores.append(-float('inf'))
            else:
                dot = sum(Q[i][k] * K[j][k] for k in range(d_k))
                row_scores.append(dot * scale)
                
        # Numerically stable softmax for row i
        valid_scores = [s for s in row_scores[:i+1]]
        max_score = max(valid_scores) if valid_scores else 0.0
        exp_scores = [math.exp(s - max_score) for s in valid_scores]
        sum_exp = sum(exp_scores)
        probs = [e / sum_exp for e in exp_scores]
        
        # Multiply attention weights by V
        for d in range(d_k):
            O[i][d] = sum(probs[j] * V[j][d] for j in range(i + 1))
            
    return O
```
**Test Strategy**: Validate causal upper-triangular masking ensures token 0 has zero dependence on token 1.
**Visualizer State Schema**: `{ Q_matrix: float[][], K_matrix: float[][], attention_heatmap: float[][], output_tokens: float[][] }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Matrix Block Sum](https://leetcode.com/problems/matrix-block-sum/) - Base accumulation mechanics.
2. [Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/) - Upper/lower triangular masking arrays.
3. Causal Mask Generator - Write a function generating a $N \times N$ boolean causal mask.
4. Scale Matrix - Implement element-wise division by $\sqrt{d}$ without division-by-zero errors.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Prove that scaling by $1/\sqrt{d_k}$ ensures the variance of the dot product of two independent zero-mean, unit-variance vectors remains 1.
2. Derive the memory footprint formula for the full $N \times N$ attention matrix and show it is bounded by $O(N^2)$.
3. Show mathematically how the $-\infty$ mask enforces the autoregressive property in the softmax denominator.

**Part C: Real-World ML Systems & Engineering Questions**
1. Llama 3 70B KV Cache: Calculate the VRAM required per token for a model with 80 layers and 64 heads.
2. Discuss the tradeoffs of recomputing attention vs caching when context lengths exceed 128k tokens.
3. How does context window padding affect inference throughput in a batched decoding environment?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Stress Test: What happens when the dot product exceeds FP16 `max_val` before the mask is applied? 
2. Causal Mask Overflow: Explain how replacing $-\infty$ with `-1e4` causes probability leakage in very long sequences.
3. How do we ensure numerical stability of softmax when sequence lengths scale to $10^6$?


## Topic 29: Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi)
### 1. Learning Outcome
Understand multi-head attention partitioning, KV-cache memory reduction via Grouped-Query Attention (GQA), and relative positional encoding via 2D Givens rotations (Rotary Positional Embedding - RoPE).

### 2. Prerequisites & Dependencies
- Causal SDPA (Topic 28)
- Normalization (Topic 21)

### 3. Decision Rationales & Alignments
**Decision Rationale:** RoPE and GQA are the industry-standard architectural choices in LLaMA, Mistral, and modern open-weights foundation models to balance context modeling and memory consumption.
**Academic Course Alignment:** Stanford CS336 - Positional embeddings and advanced attention mechanisms.
**Industry SOTA Alignment:** Meta LLaMA 3 (RoPE + GQA), Mistral 8x7B (GQA), HuggingFace Transformers implementations.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Complex Number Multiplication](https://leetcode.com/problems/complex-number-multiplication/) - We start by mastering 2D planar rotation arithmetic $(a + bi)(c + di)$ to build geometric intuition for continuous rotations.
- **Rung 2 (Mechanics)**: [Rotate List](https://leetcode.com/problems/rotate-list/) - We progress to coordinate cyclic shifts, demonstrating how sequential data can be encoded via positional phase shifts.
- **Rung 3 (ML Bridge)**: [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) (Su et al., 2021) - Bridging 2D rotations to embedding dimensions via 2D orthogonal rotation blocks across query/key channels.
- **Rung 4 (Pure Python Contract)**: Rotary Positional Embedding (RoPE) Transformation (Contract ID: `CONTRACT-TOPIC-29-ROPE-GQA`) - Students implement the RoPE math analytically, understanding exact channel pairings and frequency bands.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We explore frequency scaling for long-context extrapolation (YaRN, NTK-aware RoPE) and how Grouped-Query Attention balances KV-cache memory bandwidth against model perplexity.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-29-ROPE-GQA`
**Title**: Rotary Positional Embedding (RoPE) Transformation
**Primary Reference URL**: https://arxiv.org/abs/2104.09864
**Prompt**: Given a 2D vector $x = [x_0, x_1, \dots, x_{2k-1}]$ representing a feature channel pair for a token at sequence position $m$, apply the RoPE Givens rotation $R_{\Theta, m} x = [x_{2i} \cos(m \theta_i) - x_{2i+1} \sin(m \theta_i), x_{2i} \sin(m \theta_i) + x_{2i+1} \cos(m \theta_i)]$ where $\theta_i = 10000^{-2i/d}$.
**Input Schema**: `x: list[float], pos: int, base: float`
**Output Schema**: `x_rotated: list[float]`
**Constraints**: `len(x)` is even ($d$). `pos >= 0`. `base = 10000.0`.
**Tolerances**: Absolute error < 1e-5.
**Worked Examples**:
- Input: `x=[1.0, 0.0], pos=0, base=10000.0` => Output: `[1.0, 0.0]` (at position 0, rotation angle is 0).
**Canonical Python Code**:
```python
import math

def apply_rope_2d(x: list[float], pos: int, base: float = 10000.0) -> list[float]:
    d = len(x)
    out = [0.0] * d
    
    for i in range(0, d, 2):
        theta = base ** (-i / d)
        angle = pos * theta
        cos_val = math.cos(angle)
        sin_val = math.sin(angle)
        
        x0 = x[i]
        x1 = x[i + 1]
        
        out[i] = x0 * cos_val - x1 * sin_val
        out[i + 1] = x0 * sin_val + x1 * cos_val
        
    return out
```
**Test Strategy**: Validate preservation of vector $L_2$ norm under rotation ($\|R x\|_2 = \|x\|_2$) and relative distance invariance.
**Visualizer State Schema**: `{ original_vector_pairs: float[][], rotation_angles: float[], rotated_vectors: float[][] }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Complex Number Multiplication](https://leetcode.com/problems/complex-number-multiplication/) - Basics of phase rotations.
2. [Rotate List](https://leetcode.com/problems/rotate-list/) - Cyclic shifting mechanisms.
3. Implement Grouped-Query Key-Value broadcasting for an arbitrary head-to-KV ratio.
4. Design a cache-efficient memory layout for multi-head attention arrays.

**Part B: Mathematical Proofs & Analytical Derivations**
1. RoPE Inner Product: Prove that the inner product of two RoPE-encoded vectors only depends on their relative position distance $m - n$.
2. 2D Givens Rotation: Show that the Givens rotation matrix preserves the $L_2$ norm of the embedded vectors.
3. GQA Memory Reduction: Derive the exact percentage memory savings of GQA vs MHA for a $64$-head model with a GQA group size of $8$.

**Part C: Real-World ML Systems & Engineering Questions**
1. Analyze how RoPE frequency interpolation (NTK-aware scaling) enables context window extension without fine-tuning.
2. Explain the MQA vs GQA vs MHA tradeoffs in memory bandwidth vs model perplexity as seen in Mistral 8x7B.
3. KV Cache Layouts: Should KV cache be stored as `[batch, heads, seq, head_dim]` or `[batch, seq, heads, head_dim]` for optimal FlashAttention access?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Stress Test: Long-term RoPE drift when sequence length $N$ exceeds the base wavelength.
2. Extrapolation Failure: Why do models hallucinate instantly when sequence length exceeds training maximum despite RoPE?
3. What happens if RoPE angle generation suffers from floating point truncation in FP16?


## Topic 30: IO-Aware Attention: FlashAttention SRAM Tile Loop
### 1. Learning Outcome
Understand GPU memory hierarchy bottlenecks (HBM bandwidth vs SRAM cache) and implement the online softmax tiling recurrence that enables IO-aware attention computation in FlashAttention.

### 2. Prerequisites & Dependencies
- Online Softmax Normalization (Topic 20)
- Causal SDPA (Topic 28)
- SRAM L1 GEMM Tiling (Topic 36)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Standard attention reads and writes the $O(N^2)$ attention matrix to high-bandwidth memory (HBM). FlashAttention fuses the attention loop into SRAM, achieving 2-4x wall-clock speedups.
**Academic Course Alignment:** CMU 10-714 (Deep Learning Systems) - Hardware-aware kernel design; UC Berkeley CS294 / SkyLab - LLM systems and IO-awareness.
**Industry SOTA Alignment:** FlashAttention-2/3 (Dao et al.), PyTorch SDPA backend, xFormers memory-efficient attention.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Range Sum Query 2D - Immutable](https://leetcode.com/problems/range-sum-query-2d-immutable/) - Block tile range updates provide a foundational mental model for working with localized 2D chunks of data.
- **Rung 2 (Mechanics)**: [Block Tile Matrix Traversal](https://leetcode.com/problems/matrix-diagonal-sum/) - We learn to handle block memory boundaries, a prerequisite for tiling algorithms.
- **Rung 3 (ML Bridge)**: [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) (Dao et al., 2022) - Bridging localized processing to online softmax recurrence without materializing the full $O(N^2)$ attention matrix.
- **Rung 4 (Pure Python Contract)**: FlashAttention SRAM Tile Loop (Contract ID: `CONTRACT-TOPIC-30-FLASHATTENTION`) - Students implement the multi-block tile iteration and running normalizer logic to see exactly how $m_i$ and $l_i$ states persist across tiles.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We analyze SRAM block size tuning based on GPU register pressure, shared memory limits, and the fundamental gap between HBM bandwidth and tensor core FLOPs.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-30-FLASHATTENTION`
**Title**: FlashAttention SRAM Block Tile Loop
**Primary Reference URL**: https://arxiv.org/abs/2205.14135
**Prompt**: Implement the multi-tile forward pass of FlashAttention. Given query $Q$, key $K$, value $V$ matrices and block tile size $B_c$, compute the attention output $O$ by streaming $K, V$ blocks into SRAM and updating running max $m$ and running normalizer $l$ via the Dao et al. (2022) online recurrence.
**Input Schema**: `Q: list[list[float]], K: list[list[float]], V: list[list[float]], block_size: int`
**Output Schema**: `O: list[list[float]]`
**Constraints**: Pure Python with `math`. $N \le 64$, $d \le 32$.
**Tolerances**: Absolute error < 1e-5 compared to standard full attention.
**Worked Examples**:
- Input: Identical inputs to standard SDPA. Output matches exact standard attention output up to floating point precision.
**Canonical Python Code**:
```python
import math

def flash_attention_forward_tiled(
    Q: list[list[float]], 
    K: list[list[float]], 
    V: list[list[float]], 
    Br: int = 2,
    Bc: int = 2
) -> list[list[float]]:
    N = len(Q)
    d = len(Q[0])
    scale = 1.0 / math.sqrt(d)
    
    O = [[0.0] * d for _ in range(N)]
    m = [-float('inf')] * N
    l = [0.0] * N
    
    num_kv_blocks = (N + Bc - 1) // Bc
    num_q_blocks = (N + Br - 1) // Br
    
    for b_kv in range(num_kv_blocks):
        k_start = b_kv * Bc
        k_end = min(N, (b_kv + 1) * Bc)
        K_block = K[k_start:k_end]
        V_block = V[k_start:k_end]
        
        for b_q in range(num_q_blocks):
            q_start = b_q * Br
            q_end = min(N, (b_q + 1) * Br)
            
            for i in range(q_start, q_end):
                s_block = [sum(Q[i][k] * K_block[j][k] for k in range(d)) * scale for j in range(len(K_block))]
                
                m_block = max(s_block)
                m_new = max(m[i], m_block)
                
                p_block = [math.exp(val - m_new) for val in s_block]
                l_new = math.exp(m[i] - m_new) * l[i] + sum(p_block)
                
                alpha = math.exp(m[i] - m_new) * l[i]
                for col in range(d):
                    v_sum = sum(p_block[j] * V_block[j][col] for j in range(len(V_block)))
                    O[i][col] = (alpha * O[i][col] + v_sum) / l_new
                    
                m[i] = m_new
                l[i] = l_new
                
    return O
```
**Test Strategy**: Assert output matches standard `scaled_dot_product_attention` across multi-tile configurations ($B_c=1, 2, 4$).
**Visualizer State Schema**: `{ Q_row: float[], SRAM_K_block: float[][], SRAM_V_block: float[][], running_max: float, running_sum: float, output_acc: float[] }`


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Range Sum Query 2D - Immutable](https://leetcode.com/problems/range-sum-query-2d-immutable/) - Block queries.
2. [Matrix Diagonal Sum](https://leetcode.com/problems/matrix-diagonal-sum/) - Block access patterns.
3. Implement a single inner loop of SRAM tiling for 1D arrays.
4. Design a running maximum tracker over streaming chunks of data.

**Part B: Mathematical Proofs & Analytical Derivations**
1. IO Complexity: Prove that FlashAttention requires $O(N^2 d^2 / M)$ HBM accesses, where $M$ is SRAM size.
2. Online Softmax Correctness: Derive the algebraic equivalence between standard softmax and the three-pass online max-scaling algorithm.
3. FlashAttention Backward: Derive the memory IO reduction in the backward pass of FlashAttention by avoiding the $N \times N$ dropout mask materialization.

**Part C: Real-World ML Systems & Engineering Questions**
1. Thread Block Sizing: How do you choose $B_c$ and $B_r$ based on register pressure and shared memory limits on H100s?
2. Compare the latency of FlashAttention vs standard attention at $N=4096$, explaining where memory bandwidth bottlenecks shift to compute bounds.
3. How does PyTorch's `F.scaled_dot_product_attention` choose between FlashAttention, memory-efficient attention, and math backends?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. SRAM Overflow: What happens when the block size causes shared memory overallocation?
2. Tile dimension quantization padding: How do we handle sequence lengths that aren't multiples of $B_c$?
3. Precision loss in the running normalizer $l$ over extremely long sequences.


