import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_flashattention_sram_tiling_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "FlashAttention: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Standard Attention (3-Pass HBM Intermediate Materialization)",
          code: `import torch
import torch.nn.functional as F

def standard_attention_hbm_bottleneck(
    q: torch.Tensor,  # [B, H, N, D]
    k: torch.Tensor,  # [B, H, N, D]
    v: torch.Tensor,  # [B, H, N, D]
) -> torch.Tensor:
    # 1. First HBM Pass: Compute dense scores and write to global DRAM
    scale = 1.0 / (q.shape[-1] ** 0.5)
    scores = torch.matmul(q, k.transpose(-2, -1)) * scale  # Memory footprint: B * H * N * N elements!
    
    # 2. Second HBM Pass: Read scores from DRAM, compute softmax, write probabilities back to DRAM
    p_weights = F.softmax(scores, dim=-1)  # Another B * H * N * N allocation in DRAM!
    
    # 3. Third HBM Pass: Read probabilities and values from DRAM, contract into context
    out = torch.matmul(p_weights, v)
    return out`,
          explanation:
            "Standard attention requires 3 sequential kernel launches and allocates large intermediate tensors ($S$ and $P$) in HBM, generating $O(N^2)$ memory reads and writes.",
          timeComplexity: "O(N^2 d)",
          spaceComplexity: "O(N^2) HBM allocation",
        },
        {
          label: "Stage 2: Algorithmic Block-Tiled Online Softmax (FlashAttention-2 Style)",
          code: `import torch

def flashattention2_forward_tiled(
    Q: torch.Tensor,  # [B, H, N, D]
    K: torch.Tensor,  # [B, H, N, D]
    V: torch.Tensor,  # [B, H, N, D]
    Br: int = 64,     # Query block size in SRAM
    Bc: int = 64,     # Key/Value block size in SRAM
    is_causal: bool = True,
) -> torch.Tensor:
    B, H, N, D = Q.shape
    scale = 1.0 / (D ** 0.5)
    O = torch.zeros_like(Q)
    
    Tr = (N + Br - 1) // Br
    Tc = (N + Bc - 1) // Bc
    
    for b in range(B):
        for h in range(H):
            # Outer loop over Query blocks (FlashAttention-2 ordering: minimizes O writebacks)
            for i in range(Tr):
                r_start = i * Br
                r_end = min(r_start + Br, N)
                cur_Br = r_end - r_start
                
                Qi = Q[b, h, r_start:r_end, :]  # Load Q_i into SRAM
                
                # Initialize running statistics for this Q block in registers
                m_i = torch.full((cur_Br, 1), float('-inf'), device=Q.device)
                l_i = torch.zeros((cur_Br, 1), device=Q.device)
                acc_Oi = torch.zeros((cur_Br, D), device=Q.device)
                
                # Inner loop over Key/Value blocks
                max_j = (r_end + Bc - 1) // Bc if is_causal else Tc
                for j in range(max_j):
                    c_start = j * Bc
                    c_end = min(c_start + Bc, N)
                    cur_Bc = c_end - c_start
                    
                    Kj = K[b, h, c_start:c_end, :]  # Load K_j into SRAM
                    Vj = V[b, h, c_start:c_end, :]  # Load V_j into SRAM
                    
                    # Local score computation in SRAM / Tensor Cores
                    Sij = torch.matmul(Qi, Kj.transpose(0, 1)) * scale  # [cur_Br, cur_Bc]
                    
                    if is_causal:
                        # Local causal mask within tile
                        row_idx = torch.arange(r_start, r_end, device=Q.device).unsqueeze(1)
                        col_idx = torch.arange(c_start, c_end, device=Q.device).unsqueeze(0)
                        Sij = torch.where(col_idx <= row_idx, Sij, float('-inf'))
                        
                    # 1. Update running row max
                    m_curr = torch.max(Sij, dim=-1, keepdim=True).values
                    m_new = torch.maximum(m_i, m_curr)
                    
                    # 2. Rescaling factors
                    alpha = torch.exp(m_i - m_new)
                    beta = torch.exp(Sij - m_new)
                    
                    # 3. Update normalizer and output accumulator in registers
                    l_i = alpha * l_i + torch.sum(beta, dim=-1, keepdim=True)
                    acc_Oi = alpha * acc_Oi + torch.matmul(beta, Vj)
                    m_i = m_new
                    
                # Final division by partition sum and write directly to HBM
                O[b, h, r_start:r_end, :] = acc_Oi / l_i
                
    return O`,
          explanation:
            "Decomposes attention across $B_r \\times B_c$ blocks with outer loop over $Q$ (FlashAttention-2). Accumulates output directly in registers, completely avoiding any $N \\times N$ tensor in DRAM.",
          timeComplexity: "O(N^2 d)",
          spaceComplexity: "O(B_r * d + B_c * d) SRAM footprint",
        },
        {
          label: "Stage 3: Bare-Metal Triton Kernel Simulation Structure",
          code: `import torch

# Conceptual representation of a compiled Triton / CUDA FlashAttention kernel
def triton_flashattention_kernel_sim(
    q_ptr, k_ptr, v_ptr, out_ptr,
    stride_qb, stride_qh, stride_qm, stride_qk,
    stride_kb, stride_kh, stride_kn, stride_kk,
    stride_vb, stride_vh, stride_vn, stride_vk,
    stride_ob, stride_oh, stride_om, stride_ok,
    Z, H, N_CTX, HEAD_DIM: int,
    BLOCK_M: int = 128, BLOCK_N: int = 64,
):
    """
    Simulation of GPU grid execution:
    Grid launches (Z * H * (N_CTX / BLOCK_M)) thread blocks.
    Each thread block independently processes one BLOCK_M row tile of Q.
    """
    scale = 1.0 / (HEAD_DIM ** 0.5)
    
    # In Triton: start_m = tl.program_id(0)
    # Offsets and pointers are resolved with zero-overhead affine base arithmetic
    # Tensor Memory Accelerator (TMA) asynchronously prefetches K/V tiles into Shared Memory
    pass`,
          explanation:
            "GPU architecture mapping: 1 thread block per Query tile, utilizing Asynchronous Tensor Memory Accelerator (TMA) on Hopper (H100) or Double-Buffering cp.async on Ampere (A100).",
          timeComplexity: "O(N^2 d) parallelized across SMs",
          spaceComplexity: "O(1) global DRAM allocation beyond output tensor",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Shared Memory Bank Conflicts & Tile Padding",
      content:
        "NVIDIA GPUs organize Shared Memory (SRAM) into 32 banks of 4-byte width (128 bytes per line). When a warp of 32 threads accesses 32 distinct 4-byte words in different banks, the memory transaction completes in a single clock cycle. If multiple threads access different words within the *same* bank, the access is serialized into multiple cycles (a bank conflict). For a head dimension $d = 128$ in FP16 (256 bytes = 64 words), a naive 2D array stride is a multiple of 32 words, causing a catastrophic **32-way bank conflict** on column-wise accesses. GPU kernel engineers pad the inner dimension of shared memory tiles by 8 bytes ($d_{\\text{pad}} = 132$) to shift bank alignments and restore 1-cycle conflict-free throughput.",
    },
  ],
};
