import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_dense_gemm_tiling_c1_p1",
  pageNumber: 1,
  title: "Dense GEMM: 3-Level Memory Tiling & Hong-Kung I/O Bounds",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Memory Wall: GEMM Compute vs Bandwidth Limits",
      content:
        "General Matrix Multiplication (**GEMM**) $C = A \\times B + C$ (where $A \\in \\mathbb{R}^{M \\times K}$, $B \\in \\mathbb{R}^{K \\times N}$, $C \\in \\mathbb{R}^{M \\times N}$) accounts for over 85% of total execution time in Deep Learning. Computing $C$ requires $2 M N K$ floating-point operations. In naive implementations, each multiply-accumulate reads 2 elements from global memory, resulting in an arithmetic intensity of $I = \\frac{2 M N K}{2 M N K \\times 4 \\text{ bytes}} = 0.25 \\text{ FLOP/byte}$. On an NVIDIA H100 (989 TFLOP/s compute, 3.35 TB/s memory bandwidth, requiring $I \\approx 295 \\text{ FLOP/byte}$), naive GEMM executes at less than 0.1% of peak hardware capacity! Modern GPU kernel architectures solve this by staging computation across a **3-Level Memory Hierarchy**: Global HBM $\\to$ Shared Memory SRAM (L1) $\\to$ Register File (RF).",
    },
    {
      type: "mental_model",
      title: "Mental Model: Hierarchical 2D/3D Block-and-Thread Tiling",
      visualIntuition:
        "[ Global HBM: Matrix A (M x K), Matrix B (K x N) ]\\n    |-- (Block Tiling: B_M x B_K and B_K x B_N) --> Loaded into Shared Memory SRAM\\n         |-- (Warp & Thread Tiling: T_M x T_N) --> Loaded into Thread Registers\\n              |-- Inner Outer-Product: R_C[i][j] += R_A[i] * R_B[j] in 1 clock cycle!",
      invariant:
        "Memory Reuse Invariant: By loading a B_M x B_K tile of A and a B_K x B_N tile of B into fast SRAM, every element of A is reused B_N times and every element of B is reused B_M times, reducing global memory traffic by factor min(B_M, B_N).",
      stateTransitions:
        "State 0: Fetch tile (B_M, B_K) and (B_K, B_N) from HBM to SRAM -> State 1: Synchronize warp threads (__syncthreads / TMA barrier) -> State 2: Load sub-vector into registers -> State 3: Tensor Core MMA outer products -> State 4: Repeat along K dimension -> State 5: Write final C tile back to HBM.",
      naiveBottleneck:
        "Naive 3-loop GEMM streams matrices from slow global memory for every single multiply-accumulate, thrashing L1/L2 caches.",
      optimalInsight:
        "Hierarchical 2D register tiling combined with shared memory double-buffering achieves over 95% of theoretical Tensor Core peak TFLOP/s.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Hong-Kung I/O Complexity Lower Bound",
      theorem:
        "Any algorithm that computes the matrix product $C = A \\times B$ of two $N \\times N$ matrices on a computational device with fast memory capacity $M$ must transfer at least $\\Omega\\left(\\frac{N^3}{\\sqrt{M}}\\right)$ words between slow and fast memory.",
      proof:
        "1. Computation Graph Model:\\nThe standard matrix multiplication algorithm evaluates $N^3$ elementary operations $c_{ij} = \\sum_{k=1}^N a_{ik} b_{kj}$, represented by a 3D computational cube $V = \\{ (i, j, k) : 1 \\le i, j, k \\le N \\}$ where $|V| = N^3$.\\n\\n2. Segmented Execution & Loomis-Whitney Inequality:\\nPartition the execution into time segments during which at most $2M$ distinct words are read from or written to fast memory. Let $V_s \\subseteq V$ be the set of cube vertices evaluated in segment $s$.\\nProjecting $V_s$ onto the coordinate planes corresponds to the accessed elements:\\n- Projection onto $(i, k)$ plane: Set of accessed elements of $A$, size $|\\Pi_{ik}(V_s)| \\le 2M$.\\n- Projection onto $(k, j)$ plane: Set of accessed elements of $B$, size $|\\Pi_{kj}(V_s)| \\le 2M$.\\n- Projection onto $(i, j)$ plane: Set of accessed elements of $C$, size $|\\Pi_{ij}(V_s)| \\le 2M$.\\n\\nBy the Loomis-Whitney Inequality:\\n$$|V_s| \\le \\sqrt{|\\Pi_{ik}(V_s)| \\cdot |\\Pi_{kj}(V_s)| \\cdot |\\Pi_{ij}(V_s)|} \\le \\sqrt{(2M) \\cdot (2M) \\cdot (2M)} = (2M)^{3/2} = 2\\sqrt{2} M^{3/2}$$\\n\\n3. Lower Bound on Total Segments:\\nThe minimum number of segments required to evaluate all $N^3$ vertices is:\\n$$S \\ge \\frac{|V|}{\\max_s |V_s|} \\ge \\frac{N^3}{2\\sqrt{2} M^{3/2}}$$\\n\\n4. Total Slow Memory I/O:\\nEach segment transfers $M$ words, so total I/O is bounded by:\\n$$\\text{Total I/O} \\ge S \\cdot M \\ge \\frac{N^3}{2\\sqrt{2} M^{3/2}} \\cdot M = \\frac{1}{2\\sqrt{2}} \\frac{N^3}{\\sqrt{M}} = \\Omega\\left(\\frac{N^3}{\\sqrt{M}}\\right)$$\\nThis proves that 2D block tiling achieves the asymptotically optimal I/O bound possible by the laws of physics.",
    },
  ],
};
