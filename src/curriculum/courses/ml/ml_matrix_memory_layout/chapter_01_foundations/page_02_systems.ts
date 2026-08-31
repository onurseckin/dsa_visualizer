import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_matrix_memory_layout_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Implementation Progression",
  subtitle: "Hardware Caching, Bank Conflicts, and Tiled Matrix Traversal",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: 64B Cache Lines & DRAM Bank Conflicts",
      content:
        "Modern CPUs load memory in 64-byte chunks (cache lines) over a 64-bit wide memory bus. In multi-channel DDR5 / HBM3, memory is partitioned into independent Banks (e.g., 16 or 32 banks). When consecutive accesses target different addresses mapped to the SAME bank but different rows, a **Row Buffer Conflict (Miss)** occurs: the open row must be precharged (~15ns) and the new row activated (~15ns), serializing memory pipelines.\n\nPower-of-2 matrix strides (e.g., strides of 512, 1024, 2048, 4096 elements) naturally align memory addresses into identical cache sets and identical DRAM banks, causing severe cache set collisions and bank thrashing.",
    },
    {
      type: "code_progression",
      title: "Matrix Multiplication: From Naive IJK to Cache-Blocked Tiled GEMM",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive I-J-K Traversal (High Cache Miss Rate)",
          code: `import numpy as np

def matmul_naive_ijk(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    """
    Standard naive 3-loop matrix multiplication.
    A has shape (M, K), B has shape (K, N).
    In the innermost loop, B is indexed as B[k][j], reading column-wise across k.
    For large K, each step k incurs a 64-byte cache miss on B.
    """
    M, K = len(A), len(A[0])
    N = len(B[0])
    C = [[0.0] * N for _ in range(M)]

    for i in range(M):
        for j in range(N):
            acc = 0.0
            for k in range(K):
                # B[k][j] jumps K*sizeof(float) bytes per iteration -> Cache thrashing!
                acc += A[i][k] * B[k][j]
            C[i][j] = acc
    return C`,
          explanation:
            "The innermost loop increments $k$. In $A[i][k]$, access is contiguous (row-major). But in $B[k][j]$, access jumps by $N$ elements on every single step, evicting cache lines before they can be reused.",
          timeComplexity: "O(M * N * K)",
          spaceComplexity: "O(M * N) auxiliary memory",
        },
        {
          label: "Stage 2: Loop Interchanged I-K-J Traversal (Contiguous Inner Loop)",
          code: `import numpy as np

def matmul_interchanged_ikj(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """
    Loop interchange: outer i, middle k, inner j.
    In the innermost loop, both B[k, j] and C[i, j] advance along j.
    j is the contiguous stride-1 dimension in row-major layout!
    """
    M, K = A.shape
    K2, N = B.shape
    assert K == K2, "Inner dimensions must match"
    
    C = np.zeros((M, N), dtype=np.float32)
    
    for i in range(M):
        for k in range(K):
            # A[i, k] is invariant with respect to inner loop j
            a_ik = A[i, k]
            # Vectorized contiguous slice: B[k, :] and C[i, :] are contiguous in RAM
            for j in range(N):
                C[i, j] += a_ik * B[k, j]
                
    return C`,
          explanation:
            "Swapping the $j$ and $k$ loops ensures that both $B[k, j]$ and $C[i, j]$ are read/written sequentially along their contiguous dimension ($j$). This achieves near-100% L1 cache line utilization and enables SIMD vectorization.",
          timeComplexity: "O(M * N * K)",
          spaceComplexity: "O(M * N)",
        },
        {
          label: "Stage 3: Cache-Blocked (Tiled) GEMM for L1/L2 Cache Residency",
          code: `import numpy as np

def matmul_tiled_l1_cache(A: np.ndarray, B: np.ndarray, tile_size: int = 32) -> np.ndarray:
    """
    Cache-conscious blocked matrix multiplication.
    Partitions A, B, and C into sub-matrices of size (tile_size x tile_size).
    Ensures that active tiles fit entirely inside the L1/L2 data cache.
    For L1 data cache of 32KB (8192 float32 elements):
    3 * (tile_size^2) * 4 bytes <= 32KB -> tile_size <= 51.
    """
    M, K = A.shape
    K2, N = B.shape
    assert K == K2, "Dimension mismatch"
    
    # Ensure C-contiguous float32 arrays
    A_contig = np.ascontiguousarray(A, dtype=np.float32)
    B_contig = np.ascontiguousarray(B, dtype=np.float32)
    C = np.zeros((M, N), dtype=np.float32)
    
    B_sz = tile_size
    
    # Outer block loops over tiles
    for i0 in range(0, M, B_sz):
        i_max = min(i0 + B_sz, M)
        for k0 in range(0, K, B_sz):
            k_max = min(k0 + B_sz, K)
            for j0 in range(0, N, B_sz):
                j_max = min(j0 + B_sz, N)
                
                # Mini-GEMM on cache-resident sub-matrices
                for i in range(i0, i_max):
                    for k in range(k0, k_max):
                        a_ik = A_contig[i, k]
                        for j in range(j0, j_max):
                            C[i, j] += a_ik * B_contig[k, j]
                            
    return C`,
          explanation:
            "Tiling reduces DRAM memory traffic from $O(M N K)$ element transfers down to $O(M N K / \\text{tile\\_size})$, transforming a memory-bandwidth-bound kernel into a compute-bound operation running near peak CPU FLOPS.",
          timeComplexity: "O(M * N * K) arithmetic operations",
          spaceComplexity: "O(1) auxiliary memory (in-place accumulation)",
        },
      ],
      stepByStep: [
        "1. Identify L1/L2 cache capacity $M_{\\text{cache}}$ and choose tile size $B$ such that $3 B^2 \\cdot \\text{sizeof}(T) \\le M_{\\text{cache}}$.",
        "2. Ensure memory buffers are aligned to 64-byte cache line boundaries.",
        "3. Tile all three loop dimensions $(i, j, k)$ to retain tile blocks in SRAM/L1.",
        "4. Order the inner tile loops as $i \\to k \\to j$ to guarantee stride-1 contiguous access along $j$.",
      ],
    },
  ],
};
