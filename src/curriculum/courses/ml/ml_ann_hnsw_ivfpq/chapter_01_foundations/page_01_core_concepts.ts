import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_ann_hnsw_ivfpq_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: Asymmetric Distance Computation (ADC) & Voronoi Routing",
  sections: [
    {
      type: "prose",
      title: "The Product Quantization Asymmetric Distance Formulation",
      content:
        "In Symmetric Distance Computation (SDC), both query and database vectors are quantized to centroid codes, compounding quantization noise. In **Asymmetric Distance Computation (ADC)**, the query vector $q \\in \\mathbb{R}^D$ is kept uncompressed in high-precision FP32, while database vectors $x \\approx \\hat{x} = [c_{1, i_1}, c_{2, i_2}, \\dots, c_{M, i_M}]$ are represented as $M$ discrete 1-byte codebook indices. The squared Euclidean distance is evaluated as:\\n\\n$$\\|q - \\hat{x}\\|^2 = \\sum_{m=1}^M \\|q_m - c_{m, i_m}\\|^2$$\\n\\nBefore scanning inverted lists, the engine precomputes an $M \\times 256$ table $T[m, k] = \\|q_m - c_{m, k}\\|^2$. During vector candidate evaluation, computing distance requires **strictly $M$ cache table lookups and additions**, completely eliminating expensive high-dimensional floating-point multiplications!",
    },
    {
      type: "mental_model",
      title: "Mental Model: Voronoi Coarse Quantization & Multi-Probe Trade-off",
      visualIntuition:
        "Embedding Space partitioned into K=4096 Voronoi Centroids\\nQuery q falls into Voronoi Cell C_7\\nSingle Probe (nprobe=1): Scans only Inverted List for C_7 (Super fast, but misses nearest neighbors near the boundary!)\\nMulti-Probe (nprobe=16): Probes the 16 nearest Voronoi centroids, achieving >98% Recall at a fraction of full-scan cost.",
      invariant:
        "Recall-Latency Trade-off Invariant: Increasing nprobe in IVF or efSearch in HNSW strictly increases search recall monotonically toward 100% at the cost of proportional linear increases in visited candidate volume.",
      stateTransitions:
        "Coarse Quantizer (find nprobe centroids) -> Collect Inverted Lists -> Stream 1-byte PQ codes -> ADC Table Lookups in L1 cache -> Heap insertion -> Emit Top-K IDs.",
      naiveBottleneck:
        "Quantizing vectors with scalar 8-bit quantization preserves dimension D, requiring D multiply-adds per vector; PQ decomposes space into M sub-vectors, cutting operations by factor D/M.",
      optimalInsight:
        "Combining IVF coarse partitioning with PQ fine quantization yields sub-millisecond multi-million vector search on standard CPU servers.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Asymmetric Distance Computation (ADC) Error Bound",
      theorem:
        "Let $X \\in \\mathbb{R}^D$ be a random vector with sub-vector variance $\\sigma_m^2$, and let $\\hat{X} = q(X)$ be its Product Quantization reconstruction using $M$ sub-quantizers each with $K=256$ centroids. The expected squared distance error under ADC satisfies $\\mathbb{E}\\left[ | \\|q - X\\|^2 - \\|q - \\hat{X}\\|^2 | \\right] \\le 2 \\|q\\| \\sqrt{\\text{MSE}_{\\text{PQ}}} + \\text{MSE}_{\\text{PQ}}$, where $\\text{MSE}_{\\text{PQ}} = \\sum_{m=1}^M \\mathbb{E}[\\|X_m - q_m(X_m)\\|^2]$.",
      proof:
        "1. Decomposition of Distance Difference:\\n$$\\|q - X\\|^2 - \\|q - \\hat{X}\\|^2 = (q - X)^T (q - X) - (q - \\hat{X})^T (q - \\hat{X})$$\\nLet the quantization residual vector be $\\epsilon = X - \\hat{X}$, so $X = \\hat{X} + \\epsilon$.\\nSubstituting $X$:\\n$$\\|q - X\\|^2 = \\|q - \\hat{X} - \\epsilon\\|^2 = \\|q - \\hat{X}\\|^2 - 2(q - \\hat{X})^T \\epsilon + \\|\\epsilon\\|^2$$\\n\\n2. Bounding the Residual Cross-Term:\\n$$\\|q - X\\|^2 - \\|q - \\hat{X}\\|^2 = -2(q - \\hat{X})^T \\epsilon + \\|\\epsilon\\|^2$$\\nTaking expectations and applying Cauchy-Schwarz:\\n$$| -2(q - \\hat{X})^T \\epsilon | \\le 2 \\|q - \\hat{X}\\| \\cdot \\|\\epsilon\\| \\le 2 (\\|q\\| + \\|\\hat{X}\\|) \\|\\epsilon\\|$$\\n\\n3. Total Mean Squared Error (MSE):\\nSince each sub-quantizer $m$ is trained via $K$-means to minimize local variance $\\mathbb{E}[\\|X_m - c_{m, i}\\|^2] = \\text{MSE}_m$, the total residual energy is $\\mathbb{E}[\\|\\epsilon\\|^2] = \\sum_{m=1}^M \\text{MSE}_m = \\text{MSE}_{\\text{PQ}}$.\\n\\n4. Conclusion:\\nTaking expectations yields $\\mathbb{E}[| \\|q - X\\|^2 - \\|q - \\hat{X}\\|^2 |] \\le 2 \\|q\\| \\sqrt{\\text{MSE}_{\\text{PQ}}} + \\text{MSE}_{\\text{PQ}}$, rigorously bounding the distortion introduced by ADC lookup tables.",
    },
  ],
};
