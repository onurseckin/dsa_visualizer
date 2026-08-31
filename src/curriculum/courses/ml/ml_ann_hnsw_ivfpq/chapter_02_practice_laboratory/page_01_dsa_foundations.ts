import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_ann_hnsw_ivfpq_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: High-Throughput HNSW & IVF-PQ Search Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_ann_hnsw_ivfpq",
      title: "Implement Product Quantization (PQ) with ADC Lookup Table Search",
      difficulty: "Hard",
      rationale:
        "Implement a complete Product Quantizer with sub-vector codebook quantization, Asymmetric Distance Computation (ADC) lookup table generation, and fast integer distance evaluation.",
      starterCode: `import numpy as np
from typing import Dict, List, Any, Tuple

class Solution:
    """
    Product Quantization (PQ) and Asymmetric Distance Computation (ADC) Engine.
    Encodes continuous vectors into M-byte discrete codes and evaluates approximate
    nearest neighbors using precomputed distance lookup tables.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "database": np.ndarray of shape [N, D] (FP32 database vectors)
                - "query": np.ndarray of shape [D] (FP32 query vector)
                - "codebooks": np.ndarray of shape [M, K, d_sub] (PQ codebooks)
                - "k": int (number of nearest neighbors to retrieve)
        Returns:
            Dictionary containing:
                - "quantized_codes": np.ndarray of shape [N, M] in uint8
                - "top_k_indices": List[int] (retrieved top-k vector IDs)
                - "top_k_approx_distances": List[float] (ADC distances)
                - "raw_memory_bytes": int (N * D * 4)
                - "pq_memory_bytes": int (N * M * 1)
                - "compression_ratio": float (raw_memory / pq_memory)
        """
        database = inputs["database"].astype(np.float32)
        query = inputs["query"].astype(np.float32)
        codebooks = inputs["codebooks"].astype(np.float32)
        k = int(inputs.get("k", 10))

        N, D = database.shape
        M, K, d_sub = codebooks.shape
        assert D == M * d_sub, "D must equal M * d_sub"

        # 1. Quantize database vectors into M-byte codes
        codes = np.zeros((N, M), dtype=np.uint8)
        for m in range(M):
            sub_db = database[:, m * d_sub : (m + 1) * d_sub]  # [N, d_sub]
            # Compute distance from each vector's sub-vector to all K centroids: [N, K]
            # dists = ||x||^2 + ||c||^2 - 2 x c^T
            sub_centroids = codebooks[m]  # [K, d_sub]
            # Compute pairwise distances
            dists = np.sum((sub_db[:, None, :] - sub_centroids[None, :, :]) ** 2, axis=-1)  # [N, K]
            codes[:, m] = np.argmin(dists, axis=-1).astype(np.uint8)

        # 2. Precompute ADC Distance Lookup Table: [M, K]
        lut = np.zeros((M, K), dtype=np.float32)
        for m in range(M):
            q_sub = query[m * d_sub : (m + 1) * d_sub]  # [d_sub]
            lut[m] = np.sum((codebooks[m] - q_sub[None, :]) ** 2, axis=-1)  # [K]

        # 3. Fast Vectorized ADC Distance Evaluation: [N]
        # Summing lookup table entries across M sub-vectors
        approx_dists_sq = np.zeros(N, dtype=np.float32)
        for m in range(M):
            approx_dists_sq += lut[m, codes[:, m]]

        # 4. Top-K Selection
        top_k_indices = np.argpartition(approx_dists_sq, k)[:k]
        sorted_order = np.argsort(approx_dists_sq[top_k_indices])
        final_indices = top_k_indices[sorted_order]
        final_dists = np.sqrt(approx_dists_sq[final_indices])

        raw_bytes = N * D * 4
        pq_bytes = N * M * 1
        compression = float(raw_bytes) / float(pq_bytes) if pq_bytes > 0 else 1.0

        return {
            "quantized_codes": codes,
            "top_k_indices": final_indices.tolist(),
            "top_k_approx_distances": final_dists.tolist(),
            "raw_memory_bytes": raw_bytes,
            "pq_memory_bytes": pq_bytes,
            "compression_ratio": compression,
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
