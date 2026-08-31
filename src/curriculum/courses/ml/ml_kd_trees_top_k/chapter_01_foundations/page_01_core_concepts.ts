import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_kd_trees_top_k_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: The Curse of Dimensionality & Flat-Array Layouts",
  sections: [
    {
      type: "prose",
      title: "The Exponential Dimensionality Wall in Modern Machine Learning",
      content:
        "In modern machine learning embeddings (e.g. OpenAI `text-embedding-3-small` with $D = 1536$, BERT with $D = 768$, CLIP with $D = 512$), all data points become virtually equidistant in high-dimensional space (distance concentration phenomenon). For dimension $D = 1536$, the constant $2^D = 2^{1536} \\approx 10^{462}$, meaning the query ball intersects literally every single split plane in the tree. Attempting to use a K-D Tree on high-dimensional vectors causes the algorithm to visit 100% of all tree nodes, adding the severe overhead of recursive stack frames and non-sequential pointer dereferences on top of a full $O(N)$ scan.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Pointer Tree vs Flat Contiguous Array Memory Access",
      visualIntuition:
        "Pointer K-D Tree:   [ Node A @ 0x1000 ] --(Pointer)--> [ Node B @ 0x8500 ] --(Pointer)--> [ Node C @ 0x2400 ]\\n                     (Every comparison = CPU L1/L2 Cache Miss + Branch Misprediction)\\nFlat SIMD Array:     [ Point 0 ][ Point 1 ][ Point 2 ] ... [ Point N ] (Contiguous 64-byte aligned DRAM)\\n                     (Streamed at 300 GB/s via AVX-512 / Tensor Core matrix multiplies!)",
      invariant:
        "Memory Bandwidth Invariant: When index pruning factor is < 5x (which occurs whenever D > 20), streaming an un-indexed contiguous flat array at peak hardware memory bandwidth (300-3000 GB/s) is strictly faster than tree-based pruning.",
      stateTransitions:
        "Low Dimension (D <= 10): K-D Tree / Ball Tree -> Prunes 90%+ dataset -> O(log N) win.\\nHigh Dimension (D >= 50): Collapse -> Switch to HNSW Graph or Inverted File Index with Product Quantization (IVF-PQ).",
      naiveBottleneck:
        "Using K-D Trees for high-dimensional embeddings wastes CPU cycles on branching and pointer hops while pruning zero nodes.",
      optimalInsight:
        "Systems engineers reserve K-D Trees for spatial 2D/3D physics, robotics, and low-dimensional manifolds, using HNSW/IVF-PQ for high-dimensional representation retrieval.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: High-Dimensional Distance Concentration",
      theorem:
        "Let $X_1, X_2, \\dots, X_N$ be independent and identically distributed random vectors in $\\mathbb{R}^D$ where each coordinate is drawn from a distribution with mean $\\mu$ and variance $\\sigma^2$. As dimension $D \\to \\infty$, the relative difference between the maximum distance $\\max_i \\|X_i\\|_2$ and minimum distance $\\min_i \\|X_i\\|_2$ to the origin vanishes: $\\lim_{D \\to \\infty} \\frac{\\max_i \\|X_i\\| - \\min_i \\|X_i\\|}{\\min_i \\|X_i\\|} = 0$.",
      proof:
        "1. Norm Formulation:\\nLet $Y = \\|X\\|_2^2 = \\sum_{d=1}^D X_d^2$. By the Law of Large Numbers, as $D \\to \\infty$:\\n$$\\mathbb{E}[Y] = D \\cdot \\mathbb{E}[X_1^2] = D (\\mu^2 + \\sigma^2) = D \\cdot m_2$$\\n$$\\text{Var}(Y) = D \\cdot \\text{Var}(X_1^2) = D \\cdot v_2$$\\n\\n2. Standard Deviation of Distance:\\nThe standard deviation of Euclidean distance $\\|X\\|_2 = \\sqrt{Y}$ scales as:\\n$$\\sigma_{\\|X\\|} \\sim \\frac{\\sqrt{\\text{Var}(Y)}}{2\\sqrt{\\mathbb{E}[Y]}} = \\frac{\\sqrt{D v_2}}{2\\sqrt{D m_2}} = O(1)$$\\nwhile the expected distance grows as $\\mathbb{E}[\\|X\\|] \\sim \\sqrt{D m_2} = O(\\sqrt{D})$.\\n\\n3. Relative Spread Convergence:\\n$$\\frac{\\max_i \\|X_i\\| - \\min_i \\|X_i\\|}{\\min_i \\|X_i\\|} \\le \\frac{C \\cdot \\sigma_{\\|X\\|}}{\\mathbb{E}[\\|X\\|] - C \\cdot \\sigma_{\\|X\\|}} = \\frac{O(1)}{O(\\sqrt{D}) - O(1)} \\xrightarrow{D \\to \\infty} 0$$\\nIn high dimensions, all pairwise distances become identical, destroying the geometric selectivity of bounding-box spatial partitions.",
    },
  ],
};
