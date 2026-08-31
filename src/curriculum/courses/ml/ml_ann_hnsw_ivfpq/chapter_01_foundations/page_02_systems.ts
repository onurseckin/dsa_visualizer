import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_ann_hnsw_ivfpq_c1_p2",
  pageNumber: 3,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Approximate Vector Search: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Exact Flat Vector Scan Baseline",
          code: `import numpy as np
from typing import Tuple

def flat_exact_search(database: np.ndarray, query: np.ndarray, k: int = 10) -> Tuple[np.ndarray, np.ndarray]:
    """
    Exhaustive Euclidean flat scan.
    Requires streaming full database matrix from DRAM.
    """
    # database: [N, D], query: [D]
    dists = np.sum((database - query) ** 2, axis=1)
    top_k = np.argpartition(dists, k)[:k]
    sorted_top_k = top_k[np.argsort(dists[top_k])]
    return sorted_top_k, np.sqrt(dists[sorted_top_k])`,
          explanation:
            "Linear scan computes all pairwise distances, requiring enormous DRAM bandwidth ($N \\times D \\times 4$ bytes).",
          timeComplexity: "O(N * D)",
          spaceComplexity: "O(N * D * 4) bytes in DRAM",
        },
        {
          label: "Stage 2: Inverted File Index (IVF) with Voronoi Centroid Clustering",
          code: `import numpy as np
from typing import Dict, List, Tuple

class IVFIndex:
    """
    Inverted File Index (IVF):
    1. Clusters dataset into nlist Voronoi centroids using K-means.
    2. Maps centroid_id -> list of (vector_id, raw_vector).
    3. Searches only the nprobe nearest Voronoi clusters.
    """
    def __init__(self, centroids: np.ndarray):
        self.centroids = centroids  # [nlist, D]
        self.nlist = len(centroids)
        self.invlists: Dict[int, List[Tuple[int, np.ndarray]]] = {i: [] for i in range(self.nlist)}
        
    def add(self, vector_id: int, vec: np.ndarray):
        # Assign to closest centroid
        dists = np.sum((self.centroids - vec) ** 2, axis=1)
        best_c = int(np.argmin(dists))
        self.invlists[best_c].append((vector_id, vec))
        
    def search(self, query: np.ndarray, k: int = 10, nprobe: int = 4) -> List[Tuple[int, float]]:
        # 1. Find nprobe nearest centroids
        centroid_dists = np.sum((self.centroids - query) ** 2, axis=1)
        probed_centroids = np.argsort(centroid_dists)[:nprobe]
        
        # 2. Scan only candidates in probed inverted lists
        candidates = []
        for c in probed_centroids:
            for vec_id, vec in self.invlists[c]:
                d = float(np.sum((query - vec) ** 2))
                candidates.append((vec_id, d))
                
        # 3. Sort top-k
        candidates.sort(key=lambda x: x[1])
        return candidates[:k]`,
          explanation:
            "IVF restricts distance computations to `nprobe` Voronoi cells, pruning $(1 - \\text{nprobe}/\\text{nlist}) \\times 100\\%$ of vectors.",
          timeComplexity: "O(nlist * D + (nprobe / nlist) * N * D)",
          spaceComplexity: "O(N * D * 4) bytes for raw vectors",
        },
        {
          label: "Stage 3: Full IVF-PQ with Asymmetric Distance Lookup Tables (ADC)",
          code: `import numpy as np
from typing import Dict, List, Tuple

class ProductQuantizerADC:
    """
    Product Quantization with Asymmetric Distance Computation (ADC):
    - Decomposes D-dimensional vector into M sub-vectors of dimension d_sub = D / M.
    - Quantizes each sub-vector into 8-bit centroid codes (K = 256 codebook).
    - Computes distance via M=96 L1-resident lookup table entries and additions!
    """
    def __init__(self, codebooks: np.ndarray):
        # codebooks: [M, 256, d_sub]
        self.codebooks = codebooks.astype(np.float32)
        self.M, self.K, self.d_sub = codebooks.shape
        self.D = self.M * self.d_sub
        self.codes: List[np.ndarray] = []  # List of [M] uint8 codes
        
    def encode_vector(self, vec: np.ndarray) -> np.ndarray:
        # vec: [D]
        code = np.zeros(self.M, dtype=np.uint8)
        for m in range(self.M):
            sub_vec = vec[m * self.d_sub : (m + 1) * self.d_sub]
            # Find nearest of 256 centroids for sub-vector m
            sub_dists = np.sum((self.codebooks[m] - sub_vec) ** 2, axis=1)
            code[m] = np.argmin(sub_dists)
        return code
        
    def add(self, vec: np.ndarray):
        self.codes.append(self.encode_vector(vec))
        
    def search_adc(self, query: np.ndarray, k: int = 10) -> Tuple[np.ndarray, np.ndarray]:
        # 1. Precompute ADC Distance Lookup Table: [M, 256] in L1 cache
        lut = np.zeros((self.M, self.K), dtype=np.float32)
        for m in range(self.M):
            q_sub = query[m * self.d_sub : (m + 1) * self.d_sub]
            lut[m] = np.sum((self.codebooks[m] - q_sub) ** 2, axis=1)
            
        # 2. Evaluate all database vectors via table lookups: [N, M]
        codes_matrix = np.array(self.codes, dtype=np.int32)  # [N, M]
        N = len(codes_matrix)
        
        # Vectorized ADC table gathering
        dists = np.zeros(N, dtype=np.float32)
        for m in range(self.M):
            dists += lut[m, codes_matrix[:, m]]
            
        top_k = np.argpartition(dists, k)[:k]
        sorted_top_k = top_k[np.argsort(dists[top_k])]
        return sorted_top_k, np.sqrt(dists[sorted_top_k])`,
          explanation:
            "Full IVF-PQ with ADC lookup table execution. Eliminates high-dimensional floating point multiplications during search, evaluating distances via $M$ fast integer table lookups in L1 cache.",
          timeComplexity: "O(M * 256 * d_sub) table precompute + O(N * M) integer table lookups",
          spaceComplexity: "O(N * M * 1) byte per vector (64x compression!)",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Realities: ADC Lookup Table L1 Cache Residency & SIMD VBMI",
      content:
        "An ADC distance lookup table for $M = 96$ sub-vectors and $K = 256$ centroids in FP16 occupies $96 \\times 256 \\times 2 \\text{ bytes} = 48 \\text{ KB}$. This fits completely inside the **48-64 KB L1 Data Cache** of modern x86/ARM CPUs. Modern SIMD instruction sets (ARM NEON `tbl` / Intel AVX-512 VBMI `_mm512_permutexvar_epi8`) evaluate 64 parallel table lookups per clock cycle, allowing a single CPU core to evaluate over **50 million vector distances per second**.",
    },
  ],
};

export const page_02_systems = page2;
