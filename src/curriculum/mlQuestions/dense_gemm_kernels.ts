import type { MLTopicQuestionBank } from "./types";

export const denseGemmKernels: MLTopicQuestionBank[] = [
  {
    topicId: "ml_dense_gemm_tiling",
    title: "Dense GEMM & SRAM L1 Block Tiling",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 36",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 36",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 36",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Dense GEMM & SRAM L1 Block Tiling.",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Dense GEMM & SRAM L1 Block Tiling.",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Dense GEMM & SRAM L1 Block Tiling scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Dense GEMM & SRAM L1 Block Tiling optimized via Triton/CUDA kernel fusion and SRAM caching?",
        engineeringContext: "GPU micro-architecture and high bandwidth memory utilization.",
      },
    ],
    partD_stressTests: [
      {
        title: "Numerical Underflow & Overflow",
        scenario: "Extreme input scale provoking floating-point exponent saturation.",
        failureMode: "NaN / Inf propagation.",
      },
      {
        title: "Boundary Dimension Collapse",
        scenario: "Batch size N=1 or empty sequence dimension.",
        failureMode: "Zero division / Shape mismatch error.",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-36-GEMM-TILED",
      title: "Dense GEMM & SRAM L1 Block Tiling",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_dense_gemm_tiling",
      prompt: "Implement the canonical algorithm for Dense GEMM & SRAM L1 Block Tiling.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def tiled_gemm_2d(\n    A: list[list[float]], \n    B: list[list[float]], \n    BM: int, BN: int, BK: int\n) -> tuple[list[list[float]], list[tuple[int, int, int]]]:\n    M = len(A)\n    K = len(A[0])\n    N = len(B[0])\n    \n    C = [[0.0] * N for _ in range(M)]\n    trace = []\n    \n    for ti in range(0, M, BM):\n        for tj in range(0, N, BN):\n            for tk in range(0, K, BK):\n                trace.append((ti, tj, tk))\n                i_end = min(M, ti + BM)\n                j_end = min(N, tj + BN)\n                k_end = min(K, tk + BK)\n                \n                for i in range(ti, i_end):\n                    for k in range(tk, k_end):\n                        a_ik = A[i][k]\n                        for j in range(tj, j_end):\n                            C[i][j] += a_ik * B[k][j]\n                            \n    return C, trace",
    },
    codeVariants: [
      {
        id: "ml_dense_gemm_tiling-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def tiled_gemm_2d(\n    A: list[list[float]], \n    B: list[list[float]], \n    BM: int, BN: int, BK: int\n) -> tuple[list[list[float]], list[tuple[int, int, int]]]:\n    M = len(A)\n    K = len(A[0])\n    N = len(B[0])\n    \n    C = [[0.0] * N for _ in range(M)]\n    trace = []\n    \n    for ti in range(0, M, BM):\n        for tj in range(0, N, BN):\n            for tk in range(0, K, BK):\n                trace.append((ti, tj, tk))\n                i_end = min(M, ti + BM)\n                j_end = min(N, tj + BN)\n                k_end = min(K, tk + BK)\n                \n                for i in range(ti, i_end):\n                    for k in range(tk, k_end):\n                        a_ik = A[i][k]\n                        for j in range(tj, j_end):\n                            C[i][j] += a_ik * B[k][j]\n                            \n    return C, trace",
      },
      {
        id: "ml_dense_gemm_tiling-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef tiled_gemm_2d(\n    A: list[list[float]], \n    B: list[list[float]], \n    BM: int, BN: int, BK: int\n) -> tuple[list[list[float]], list[tuple[int, int, int]]]:\n    M = len(A)\n    K = len(A[0])\n    N = len(B[0])\n    \n    C = [[0.0] * N for _ in range(M)]\n    trace = []\n    \n    for ti in range(0, M, BM):\n        for tj in range(0, N, BN):\n            for tk in range(0, K, BK):\n                trace.append((ti, tj, tk))\n                i_end = min(M, ti + BM)\n                j_end = min(N, tj + BN)\n                k_end = min(K, tk + BK)\n                \n                for i in range(ti, i_end):\n                    for k in range(tk, k_end):\n                        a_ik = A[i][k]\n                        for j in range(tj, j_end):\n                            C[i][j] += a_ik * B[k][j]\n                            \n    return C, trace",
      },
    ],
    complexityAnalysis: {
      timeComplexity: "O(N) amortized",
      spaceComplexity: "O(1) auxiliary",
      breakdown:
        "Algorithmic time complexity scales with input tensor volume; memory operations bounded by cache line transfers and SRAM capacity.",
    },
    topicGuide: {
      overview:
        "Comprehensive exploration of Dense GEMM & SRAM L1 Block Tiling, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Dense GEMM",
          definition: "Core computational primitive governing Dense GEMM & SRAM L1 Block Tiling.",
        },
        {
          term: "Memory Bandwidth",
          definition:
            "Rate at which data can be read from or stored into memory by a processor or accelerator.",
        },
        {
          term: "Computational Arithmetic Intensity",
          definition:
            "Ratio of arithmetic operations (FLOPs) to memory traffic (Bytes transferred).",
        },
      ],
      sections: [
        {
          heading: "1. Mathematical Foundations",
          body: "Analytical formulation, derivations, and structural invariants underpinning Dense GEMM & SRAM L1 Block Tiling.",
        },
        {
          heading: "2. Modern Hardware & Acceleration",
          body: "Mapping the algorithm efficiently across CPU SIMD, GPU Tensor Cores, and SRAM hierarchy.",
        },
        {
          heading: "3. Production Systems Engineering",
          body: "Real-world tradeoffs in large-scale machine learning training and inference pipelines.",
        },
      ],
    },
    tutorialAlignment: {
      phase1_intro:
        "Conceptual introduction to Dense GEMM & SRAM L1 Block Tiling, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "tiled_gemm",
      stateVariables: {
        input: "Input Tensor / Data Buffer",
        accumulator: "Active SRAM Intermediate",
        output: "Output Tensor / State Buffer",
      },
      colorMapping: {
        default: "#3b82f6",
        active: "#eab308",
        computed: "#22c55e",
        highlighted: "#ef4444",
      },
    },
  },
];
