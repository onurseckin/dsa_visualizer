import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_attention_causal_sdpa_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Causal SDPA: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Python Loops (Scalar Formulation)",
          code: `import math
from typing import List

def naive_causal_attention(
    Q: List[List[float]],  # Shape: [N, d_k]
    K: List[List[float]],  # Shape: [N, d_k]
    V: List[List[float]],  # Shape: [N, d_v]
) -> List[List[float]]:
    N = len(Q)
    d_k = len(Q[0])
    d_v = len(V[0])
    scale = 1.0 / math.sqrt(d_k)
    
    # 1. Compute Scaled Dot Product Scores with Causal Mask
    S = [[0.0] * N for _ in range(N)]
    for i in range(N):
        for j in range(N):
            if j <= i:  # Causal lower-triangular invariant
                dot = sum(Q[i][d] * K[j][d] for d in range(d_k))
                S[i][j] = dot * scale
            else:
                S[i][j] = float('-inf')  # Mask out future tokens
                
    # 2. Row-wise Numerically Stable Softmax
    P = [[0.0] * N for _ in range(N)]
    for i in range(N):
        # Find maximum over valid causal prefix
        m_i = max(S[i][j] for j in range(i + 1))
        # Compute exponentiated differences and denominator sum
        row_exp = [math.exp(S[i][j] - m_i) if j <= i else 0.0 for j in range(N)]
        l_i = sum(row_exp[:i + 1])
        # Normalize probabilities
        for j in range(N):
            P[i][j] = row_exp[j] / l_i if j <= i else 0.0
            
    # 3. Value Contraction: O = P x V
    O = [[0.0] * d_v for _ in range(N)]
    for i in range(N):
        for d in range(d_v):
            O[i][d] = sum(P[i][j] * V[j][d] for j in range(i + 1))
            
    return O`,
          explanation:
            "Exposes the explicit token-by-token loop structure. Highlights causal conditioning ($j \\le i$), max-subtraction numerical stabilization, and $O(N^2 d_k)$ computational complexity.",
          timeComplexity: "O(N^2 d_k + N^2 d_v)",
          spaceComplexity: "O(N^2) memory for score matrix",
        },
        {
          label: "Stage 2: Vectorized PyTorch SDPA (Batched Multi-Head)",
          code: `import torch
import torch.nn.functional as F

def vectorized_causal_sdpa(
    q: torch.Tensor,  # Shape: [batch, n_heads, seq_len, head_dim]
    k: torch.Tensor,  # Shape: [batch, n_heads, seq_len, head_dim]
    v: torch.Tensor,  # Shape: [batch, n_heads, seq_len, head_dim]
) -> torch.Tensor:
    B, H, N, D = q.shape
    scale = 1.0 / (D ** 0.5)
    
    # 1. Batched Matrix Multiply: Q @ K^T -> [B, H, N, N]
    scores = torch.matmul(q, k.transpose(-2, -1)) * scale
    
    # 2. Vectorized Causal Mask Creation via Upper-Triangular View
    # Construct boolean mask where True indicates upper-triangle positions to be masked
    causal_mask = torch.triu(torch.ones(N, N, dtype=torch.bool, device=q.device), diagonal=1)
    scores = scores.masked_fill(causal_mask, float('-inf'))
    
    # 3. Softmax along last dimension with automatic FP32 accumulation
    p_weights = F.softmax(scores, dim=-1)
    
    # 4. Context Contraction: P @ V -> [B, H, N, D]
    output = torch.matmul(p_weights, v)
    return output`,
          explanation:
            "Leverages cuBLAS batched matrix multiplications (`torch.matmul`) and vectorized mask broadcasting. While compute is vectorized, this approach still materializes the $B \\times H \\times N \\times N$ tensor in HBM.",
          timeComplexity: "O(B * H * N^2 * D)",
          spaceComplexity: "O(B * H * N^2) HBM allocations",
        },
        {
          label: "Stage 3: Block-Tiled Online Softmax Kernel (Memory-Efficient SDPA)",
          code: `import torch

def fused_tiled_causal_sdpa(
    q: torch.Tensor,  # [B, H, N, D]
    k: torch.Tensor,  # [B, H, N, D]
    v: torch.Tensor,  # [B, H, N, D]
    block_r: int = 64,
    block_c: int = 64,
) -> torch.Tensor:
    """
    Simulation of a fused GPU SRAM-tiled attention kernel.
    Evaluates online softmax row-by-row across SRAM tiles without
    materializing the global [B, H, N, N] score matrix into DRAM.
    """
    B, H, N, D = q.shape
    scale = 1.0 / (D ** 0.5)
    out = torch.zeros_like(q)
    
    for b in range(B):
        for h in range(H):
            # Tile over Query dimension (outer loop)
            for br in range(0, N, block_r):
                br_end = min(br + block_r, N)
                q_tile = q[b, h, br:br_end, :]  # Load Q tile into SRAM
                Tr = br_end - br
                
                # Running online statistics in SRAM registers
                m_prev = torch.full((Tr, 1), float('-inf'), device=q.device)
                l_prev = torch.zeros((Tr, 1), device=q.device)
                acc_o = torch.zeros((Tr, D), device=q.device)
                
                # Tile over Key/Value dimension (inner loop, causal boundary bc <= br)
                for bc in range(0, br_end, block_c):
                    bc_end = min(bc + block_c, N)
                    k_tile = k[b, h, bc:bc_end, :]  # Load K tile into SRAM
                    v_tile = v[b, h, bc:bc_end, :]  # Load V tile into SRAM
                    
                    # Compute SRAM tile scores: [Tr, Tc]
                    s_tile = torch.matmul(q_tile, k_tile.transpose(0, 1)) * scale
                    
                    # Apply local tile causal mask
                    row_idx = torch.arange(br, br_end, device=q.device).unsqueeze(1)
                    col_idx = torch.arange(bc, bc_end, device=q.device).unsqueeze(0)
                    s_tile = torch.where(col_idx <= row_idx, s_tile, float('-inf'))
                    
                    # Online softmax update equations
                    m_curr = torch.max(s_tile, dim=-1, keepdim=True).values
                    m_new = torch.maximum(m_prev, m_curr)
                    
                    # Rescale previous and current accumulators
                    alpha = torch.exp(m_prev - m_new)
                    beta = torch.exp(s_tile - m_new)
                    
                    l_new = alpha * l_prev + torch.sum(beta, dim=-1, keepdim=True)
                    acc_o = alpha * acc_o + torch.matmul(beta, v_tile)
                    
                    m_prev = m_new
                    l_prev = l_new
                    
                # Write final normalized tile output back to HBM
                out[b, h, br:br_end, :] = acc_o / l_prev
                
    return out`,
          explanation:
            "Executes FlashAttention-style online softmax rescaling ($m_{new} = \\max(m_{prev}, m_{curr})$, $l_{new} = \\alpha l_{prev} + \\sum \\beta$, $O_{new} = \\alpha O_{prev} + \\beta V$). Reduces HBM memory traffic from $O(N^2)$ to $O(N d)$, maintaining peak arithmetic intensity.",
          timeComplexity: "O(B * H * N^2 * D)",
          spaceComplexity: "O(B_r * D + B_c * D) on-chip SRAM buffer footprint",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Roofline Arithmetic Intensity: Prefill vs. Decode Phase",
      content:
        "The hardware behavior of SDPA bifurcates across LLM execution phases:\\n\\n1. **Prefill Phase (Prompt Evaluation):** Sequence length $N \\gg 1$. The attention computation is compute-dense GEMM ($2 B H N^2 D$ FLOPs). High arithmetic intensity allows the GPU to achieve near-peak Tensor Core TFLOP/s.\\n\\n2. **Decode Phase (Token-by-Token Generation):** Active query length $N_Q = 1$ attending to past context $N_{KV}$. The matrix multiplication degrades into a Matrix-Vector product (GEMV). For every single token generated, the hardware must stream the entire $2 \\times N_{KV} \\times D$ bytes of the KV cache from HBM across the memory bus to perform only $2 N_{KV} D$ FLOPs. Arithmetic intensity drops to $I = \\frac{2 N_{KV} D}{2 N_{KV} D \\times \\text{sizeof(FP16)}} = 0.5 \\text{ FLOP/byte}$, making generation strictly memory-bandwidth bound.",
    },
  ],
};

export const page_02_systems = page2;
