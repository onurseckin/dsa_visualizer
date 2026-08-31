import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_rope_gqa_attention_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "RoPE & GQA: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Pairwise Trigonometric Loop",
          code: `import math
from typing import List, Tuple

def naive_rope_embedding(
    x: List[List[List[float]]],  # Shape: [seq_len, num_heads, head_dim]
    theta_base: float = 10000.0,
) -> List[List[List[float]]]:
    seq_len = len(x)
    num_heads = len(x[0])
    head_dim = len(x[0][0])
    assert head_dim % 2 == 0
    
    out = [[[0.0] * head_dim for _ in range(num_heads)] for _ in range(seq_len)]
    
    for m in range(seq_len):
        for h in range(num_heads):
            for i in range(head_dim // 2):
                theta_i = 1.0 / (theta_base ** ((2 * i) / head_dim))
                angle = m * theta_i
                cos_val = math.cos(angle)
                sin_val = math.sin(angle)
                
                # Pairwise 2D coordinates
                x1 = x[m][h][2 * i]
                x2 = x[m][h][2 * i + 1]
                
                # 2D counter-clockwise rotation
                out[m][h][2 * i] = x1 * cos_val - x2 * sin_val
                out[m][h][2 * i + 1] = x1 * sin_val + x2 * cos_val
                
    return out`,
          explanation:
            "Iterates across sequence tokens, heads, and 2D embedding pairs. Computes trigonometric sine and cosine values on the fly without lookup caching.",
          timeComplexity: "O(seq_len * num_heads * head_dim)",
          spaceComplexity: "O(seq_len * num_heads * head_dim)",
        },
        {
          label: "Stage 2: Algorithmic Vectorized RoPE & GQA Expansion",
          code: `import torch

class VectorizedRoPEGQA(torch.nn.Module):
    def __init__(self, d_k: int, max_seq_len: int = 8192, theta_base: float = 500000.0):
        super().__init__()
        self.d_k = d_k
        # Precompute inv_freq table: [d_k / 2]
        inv_freq = 1.0 / (theta_base ** (torch.arange(0, d_k, 2).float() / d_k))
        self.register_buffer("inv_freq", inv_freq)
        
        # Precompute full cos/sin cache up to max_seq_len
        t = torch.arange(max_seq_len, dtype=torch.float32)
        freqs = torch.outer(t, inv_freq)  # [max_seq_len, d_k / 2]
        # Duplicate frequencies to match [max_seq_len, d_k]
        emb = torch.cat((freqs, freqs), dim=-1)
        self.register_buffer("cos_cached", emb.cos()[None, None, :, :])  # [1, 1, seq_len, d_k]
        self.register_buffer("sin_cached", emb.sin()[None, None, :, :])
        
    def _rotate_half(self, x: torch.Tensor) -> torch.Tensor:
        # Splits [x1, x2, ..., x_{d/2}, x_{d/2+1}, ...] -> [-x2_half, x1_half]
        x1 = x[..., : self.d_k // 2]
        x2 = x[..., self.d_k // 2 :]
        return torch.cat((-x2, x1), dim=-1)

    def forward_rope(self, q: torch.Tensor, k: torch.Tensor, seq_len: int):
        # Broadcast precomputed cos and sin across batch and head dimensions
        cos = self.cos_cached[:, :, :seq_len, :]
        sin = self.sin_cached[:, :, :seq_len, :]
        q_rot = (q * cos) + (self._rotate_half(q) * sin)
        k_rot = (k * cos) + (self._rotate_half(k) * sin)
        return q_rot, k_rot

    def forward_gqa_attention(self, q_rot: torch.Tensor, k_rot: torch.Tensor, v: torch.Tensor):
        # q_rot: [B, H_Q, N, d], k_rot: [B, H_KV, N, d], v: [B, H_KV, N, d]
        B, H_Q, N, D = q_rot.shape
        H_KV = k_rot.shape[1]
        G = H_Q // H_KV
        
        # Expand KV heads to match query head groups without allocating extra memory
        k_expanded = k_rot.unsqueeze(2).expand(B, H_KV, G, N, D).reshape(B, H_Q, N, D)
        v_expanded = v.unsqueeze(2).expand(B, H_KV, G, N, D).reshape(B, H_Q, N, D)
        
        scores = torch.matmul(q_rot, k_expanded.transpose(-2, -1)) / (D ** 0.5)
        causal_mask = torch.triu(torch.ones(N, N, dtype=torch.bool, device=q_rot.device), diagonal=1)
        scores = scores.masked_fill(causal_mask, float('-inf'))
        p_attn = torch.softmax(scores, dim=-1)
        return torch.matmul(p_attn, v_expanded)`,
          explanation:
            "Vectorizes rotary embedding using precomputed frequency tables and tensor slicing (`_rotate_half`). Utilizes `unsqueeze + expand` strided views to broadcast shared KV heads without duplicating HBM memory.",
          timeComplexity: "O(B * H_Q * N^2 * D)",
          spaceComplexity: "O(max_seq_len * d_k) precomputed cache",
        },
        {
          label: "Stage 3: Systems-Optimized Fused RoPE Kernel Structure",
          code: `import torch

def fused_inplace_rope_and_gqa_step(
    q_token: torch.Tensor,       # [B, H_Q, 1, D] - Single active decode token
    k_token: torch.Tensor,       # [B, H_KV, 1, D]
    v_token: torch.Tensor,       # [B, H_KV, 1, D]
    kv_cache_k: torch.Tensor,    # [B, H_KV, max_len, D]
    kv_cache_v: torch.Tensor,    # [B, H_KV, max_len, D]
    current_pos: int,
    cos_cache: torch.Tensor,     # [1, 1, 1, D]
    sin_cache: torch.Tensor,     # [1, 1, 1, D]
) -> torch.Tensor:
    """
    Simulates a fused GPU decode kernel (e.g. FlashDecoding / vLLM kernel).
    Executes in-place RoPE rotation on registers, commits new token to KV cache,
    and performs strided GQA reduction across KV cache without tensor copying.
    """
    B, H_Q, _, D = q_token.shape
    H_KV = k_token.shape[1]
    G = H_Q // H_KV
    
    # 1. In-place RoPE on active register tokens
    half_d = D // 2
    q_r = torch.cat((-q_token[..., half_d:], q_token[..., :half_d]), dim=-1)
    k_r = torch.cat((-k_token[..., half_d:], k_token[..., :half_d]), dim=-1)
    
    q_rot = q_token * cos_cache + q_r * sin_cache
    k_rot = k_token * cos_cache + k_r * sin_cache
    
    # 2. In-place write to physical KV cache buffer (zero reallocation)
    kv_cache_k[:, :, current_pos : current_pos + 1, :] = k_rot
    kv_cache_v[:, :, current_pos : current_pos + 1, :] = v_token
    
    # 3. Strided GQA GEMV reduction over past context [0 .. current_pos]
    valid_k = kv_cache_k[:, :, : current_pos + 1, :]  # [B, H_KV, T, D]
    valid_v = kv_cache_v[:, :, : current_pos + 1, :]  # [B, H_KV, T, D]
    
    # Reshape Q into [B, H_KV, G, 1, D] to match KV head groups directly
    q_grouped = q_rot.view(B, H_KV, G, 1, D)
    
    # Fused strided dot product: [B, H_KV, G, 1, T]
    scores = torch.matmul(q_grouped, valid_k.unsqueeze(2).transpose(-2, -1)) / (D ** 0.5)
    attn_weights = torch.softmax(scores, dim=-1)
    
    # Fused value accumulation: [B, H_KV, G, 1, D] -> [B, H_Q, 1, D]
    out_grouped = torch.matmul(attn_weights, valid_v.unsqueeze(2))
    return out_grouped.view(B, H_Q, 1, D)`,
          explanation:
            "Simulates the execution model of production decode kernels (FlashDecoding / TensorRT-LLM). Avoids intermediate allocations, performs in-place KV updates, and calculates GEMV attention across strided grouped heads.",
          timeComplexity: "O(B * H_Q * T * D) with peak memory bandwidth utilization",
          spaceComplexity: "O(1) temporary memory beyond static KV cache buffers",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Traps: 64-Byte Cache Line Alignment & Strided Heads",
      content:
        "Modern GPU DRAM controllers transfer data in 32-byte or 64-byte bursts across 32 individual memory channels. In FP16, a head dimension of $d_{\\text{head}} = 128$ is exactly $128 \\times 2 = 256$ bytes, perfectly matching four contiguous 64-byte cache lines. If the KV cache tensor is transposed or stored with a non-contiguous stride (e.g. $[\\text{seq\\_len}, \\text{batch}, \\text{head}, d]$), each memory transaction fetches unaligned bytes, causing up to 50-75% of HBM bandwidth to be wasted on discarded cache lines.",
    },
  ],
};

export const page_02_systems = page2;
