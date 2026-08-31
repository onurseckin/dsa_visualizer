import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_dense_gemm_tiling_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: 3-Level Tiled GEMM Accelerator Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_dense_gemm_tiling",
      title: "Implement 3-Level Tiled GEMM Engine with Memory Metrics",
      difficulty: "Hard",
      rationale:
        "Build a hierarchical block-and-register tiled GEMM simulator that computes exact matrix multiplication, tracks memory traffic across HBM/SRAM/Registers, and calculates operational arithmetic intensity.",
      starterCode: `import numpy as np
from typing import Dict, Any, Tuple

class Solution:
    """
    3-Level Memory Tiled GEMM Engine.
    Executes matrix multiplication across block (BM, BN, BK) and register (TM, TN) tiles,
    measuring theoretical HBM bytes transferred and arithmetic intensity.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "A": np.ndarray of shape [M, K] in float32
                - "B": np.ndarray of shape [K, N] in float32
                - "BM": int, row block tile size (e.g. 64)
                - "BN": int, col block tile size (e.g. 64)
                - "BK": int, reduction block tile size (e.g. 32)
        Returns:
            Dictionary containing:
                - "C": np.ndarray of shape [M, N] in float32 (result matrix)
                - "total_flops": int, total floating-point operations (2 * M * N * K)
                - "tiled_hbm_bytes_read": int, theoretical bytes read under tiling
                - "naive_hbm_bytes_read": int, bytes read under naive un-tiled GEMM
                - "arithmetic_intensity_tiled": float, FLOPs / Byte for tiled implementation
                - "arithmetic_intensity_naive": float, FLOPs / Byte for naive implementation
        """
        A = inputs["A"].astype(np.float32)
        B = inputs["B"].astype(np.float32)
        BM = int(inputs.get("BM", 64))
        BN = int(inputs.get("BN", 64))
        BK = int(inputs.get("BK", 32))

        M, K = A.shape
        _, N = B.shape

        C = np.zeros((M, N), dtype=np.float32)
        bytes_per_elem = 4  # FP32

        # Tiled computation
        for i in range(0, M, BM):
            i_end = min(i + BM, M)
            for j in range(0, N, BN):
                j_end = min(j + BN, N)
                
                c_tile = np.zeros((i_end - i, j_end - j), dtype=np.float32)
                for k in range(0, K, BK):
                    k_end = min(k + BK, K)
                    c_tile += np.matmul(A[i:i_end, k:k_end], B[k:k_end, j:j_end])
                C[i:i_end, j:j_end] = c_tile

        total_flops = 2 * M * N * K
        naive_hbm_bytes_read = (2 * M * N * K) * bytes_per_elem
        
        # Tiled HBM bytes: Each tile of A is loaded (N / BN) times, each tile of B loaded (M / BM) times
        num_tiles_m = (M + BM - 1) // BM
        num_tiles_n = (N + BN - 1) // BN
        tiled_bytes_A = M * K * num_tiles_n * bytes_per_elem
        tiled_bytes_B = K * N * num_tiles_m * bytes_per_elem
        tiled_hbm_bytes_read = tiled_bytes_A + tiled_bytes_B

        arithmetic_intensity_tiled = total_flops / float(tiled_hbm_bytes_read + (M * N * bytes_per_elem))
        arithmetic_intensity_naive = total_flops / float(naive_hbm_bytes_read + (M * N * bytes_per_elem))

        return {
            "C": C,
            "total_flops": total_flops,
            "tiled_hbm_bytes_read": tiled_hbm_bytes_read,
            "naive_hbm_bytes_read": naive_hbm_bytes_read,
            "arithmetic_intensity_tiled": arithmetic_intensity_tiled,
            "arithmetic_intensity_naive": arithmetic_intensity_naive,
        }`,
    },
  ],
};

export const page = page1;
