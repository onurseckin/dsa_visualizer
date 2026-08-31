import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_dense_gemm_tiling_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Dense GEMM: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive 3-Nested Loop GEMM",
          code: `import numpy as np

def naive_gemm(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    M, K = A.shape
    _, N = B.shape
    C = np.zeros((M, N), dtype=np.float32)
    
    # 3-nested loop with 0 cache reuse
    for i in range(M):
        for j in range(N):
            for k in range(K):
                C[i, j] += A[i, k] * B[k, j]
                
    return C`,
          explanation:
            "Un-tiled scalar loops. Incurs $2 M N K$ memory loads from main memory, resulting in $0.25 \\text{ FLOP/byte}$ arithmetic intensity.",
          timeComplexity: "O(M * N * K)",
          spaceComplexity: "O(1) auxiliary",
        },
        {
          label: "Stage 2: 2D Block-Tiled Cache-Conscious GEMM",
          code: `import numpy as np

def block_tiled_gemm(
    A: np.ndarray, B: np.ndarray,
    BM: int = 64, BN: int = 64, BK: int = 32
) -> np.ndarray:
    M, K = A.shape
    _, N = B.shape
    C = np.zeros((M, N), dtype=np.float32)
    
    # Iterate across grid of tiles
    for i in range(0, M, BM):
        i_end = min(i + BM, M)
        for j in range(0, N, BN):
            j_end = min(j + BN, N)
            
            # Temporary SRAM tile accumulator
            c_tile = np.zeros((i_end - i, j_end - j), dtype=np.float32)
            
            for k in range(0, K, BK):
                k_end = min(k + BK, K)
                
                # Load block tiles into simulated L1 SRAM
                a_tile = A[i:i_end, k:k_end]  # [BM, BK]
                b_tile = B[k:k_end, j:j_end]  # [BK, BN]
                
                # Local tile matrix product in fast memory
                c_tile += np.matmul(a_tile, b_tile)
                
            C[i:i_end, j:j_end] = c_tile
            
    return C`,
          explanation:
            "Decomposes matrices into $(B_M, B_K)$ and $(B_K, B_N)$ blocks, increasing L1 cache reuse by factor $\\min(B_M, B_N)$.",
          timeComplexity: "O(M * N * K)",
          spaceComplexity: "O(BM * BK + BK * BN) fast SRAM buffer",
        },
        {
          label: "Stage 3: Register-Tiled Double-Buffered GPU Kernel Simulation",
          code: `import numpy as np

def register_tiled_double_buffered_gemm_sim(
    A: np.ndarray, B: np.ndarray,
    BM: int = 128, BN: int = 128, BK: int = 16,
    TM: int = 8, TN: int = 8,  # Per-thread register tile
) -> np.ndarray:
    """
    Simulates a high-performance CUDA / Cutlass GEMM kernel:
    1. Grid of thread blocks: (M / BM, N / BN).
    2. Shared memory double-buffering (ping-pong buffers) hides HBM latency.
    3. Thread-level register outer-product: accumulates TM x TN sub-matrix directly in registers.
    """
    M, K = A.shape
    _, N = B.shape
    C = np.zeros((M, N), dtype=np.float32)
    
    # Each thread block owns a (BM, BN) output tile
    for bi in range(0, M, BM):
        for bj in range(0, N, BN):
            # Simulated Shared Memory buffers (Double Buffering: Buffer 0 and Buffer 1)
            smem_A = [np.zeros((BM, BK), dtype=np.float32), np.zeros((BM, BK), dtype=np.float32)]
            smem_B = [np.zeros((BK, BN), dtype=np.float32), np.zeros((BK, BN), dtype=np.float32)]
            
            # Thread register accumulators for (TM, TN) tile
            reg_C = np.zeros((BM, BN), dtype=np.float32)
            
            # Prefetch first tile into smem buffer 0 via async DMA (cp.async / TMA)
            buf = 0
            smem_A[buf] = A[bi:bi+BM, 0:BK]
            smem_B[buf] = B[0:BK, bj:bj+BN]
            
            for k in range(0, K, BK):
                next_k = k + BK
                next_buf = 1 - buf
                
                # Asynchronously prefetch next tile into smem buffer 1
                if next_k < K:
                    smem_A[next_buf] = A[bi:bi+BM, next_k:next_k+BK]
                    smem_B[next_buf] = B[next_k:next_k+BK, bj:bj+BN]
                    
                # Compute on current smem buffer using register outer products
                # Thread loads 1D slices into registers: reg_A [TM] and reg_B [TN]
                for dot_k in range(BK):
                    reg_A = smem_A[buf][:, dot_k:dot_k+1]  # [BM, 1]
                    reg_B = smem_B[buf][dot_k:dot_k+1, :]  # [1, BN]
                    reg_C += np.matmul(reg_A, reg_B)       # Outer product in registers!
                    
                buf = next_buf
                
            C[bi:bi+BM, bj:bj+BN] = reg_C
            
    return C`,
          explanation:
            "Simulates the CUTLASS / TensorRT GEMM kernel pipeline: double-buffering completely hides global memory transfer latency behind compute, while thread-level outer products accumulate directly in register files.",
          timeComplexity: "O(M * N * K) near peak FLOP/s",
          spaceComplexity: "O(BM * BK + BK * BN) double-buffered SRAM footprint",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Shared Memory Bank Conflicts & XOR Swizzling in GEMM",
      content:
        "In shared memory, matrix $B$ is loaded in column-major slices during inner outer-product loops. If threads in a warp access elements residing in the same memory bank (32 banks, 4 bytes/bank), execution serializes into 32 separate transactions. Modern GPU libraries (CUTLASS) employ **XOR Swizzling**: the shared memory address is computed as $\\text{bank\\_id} = (\\text{row} \\oplus (\\text{col} / 8)) \\pmod{32}$. This permutes column memory storage across orthogonal banks, guaranteeing 100% conflict-free 1-cycle warp broadcast.",
    },
  ],
};
