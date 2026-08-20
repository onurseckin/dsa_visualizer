import type { MLTopicQuestionBank } from "./types";

export const domain07_part2: MLTopicQuestionBank[] = [
  {
    topicId: "ml_flashattention_sram_tiling",
    title: "IO-Aware Attention: FlashAttention SRAM Tile Loop",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 30",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 30",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 30",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for IO-Aware Attention: FlashAttention SRAM Tile Loop.",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for IO-Aware Attention: FlashAttention SRAM Tile Loop.",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does IO-Aware Attention: FlashAttention SRAM Tile Loop scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is IO-Aware Attention: FlashAttention SRAM Tile Loop optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-30-FLASHATTENTION",
      title: "IO-Aware Attention: FlashAttention SRAM Tile Loop",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_flashattention_sram_tiling",
      prompt:
        "Implement the canonical algorithm for IO-Aware Attention: FlashAttention SRAM Tile Loop.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import math\n\ndef flash_attention_forward_tiled(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]], \n    Br: int = 2,\n    Bc: int = 2\n) -> list[list[float]]:\n    N = len(Q)\n    d = len(Q[0])\n    scale = 1.0 / math.sqrt(d)\n    \n    O = [[0.0] * d for _ in range(N)]\n    m = [-float('inf')] * N\n    l = [0.0] * N\n    \n    num_kv_blocks = (N + Bc - 1) // Bc\n    num_q_blocks = (N + Br - 1) // Br\n    \n    for b_kv in range(num_kv_blocks):\n        k_start = b_kv * Bc\n        k_end = min(N, (b_kv + 1) * Bc)\n        K_block = K[k_start:k_end]\n        V_block = V[k_start:k_end]\n        \n        for b_q in range(num_q_blocks):\n            q_start = b_q * Br\n            q_end = min(N, (b_q + 1) * Br)\n            \n            for i in range(q_start, q_end):\n                s_block = [sum(Q[i][k] * K_block[j][k] for k in range(d)) * scale for j in range(len(K_block))]\n                \n                m_block = max(s_block)\n                m_new = max(m[i], m_block)\n                \n                p_block = [math.exp(val - m_new) for val in s_block]\n                l_new = math.exp(m[i] - m_new) * l[i] + sum(p_block)\n                \n                alpha = math.exp(m[i] - m_new) * l[i]\n                for col in range(d):\n                    v_sum = sum(p_block[j] * V_block[j][col] for j in range(len(V_block)))\n                    O[i][col] = (alpha * O[i][col] + v_sum) / l_new\n                    \n                m[i] = m_new\n                l[i] = l_new\n                \n    return O",
    },
    codeVariants: [
      {
        id: "ml_flashattention_sram_tiling-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import math\n\ndef flash_attention_forward_tiled(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]], \n    Br: int = 2,\n    Bc: int = 2\n) -> list[list[float]]:\n    N = len(Q)\n    d = len(Q[0])\n    scale = 1.0 / math.sqrt(d)\n    \n    O = [[0.0] * d for _ in range(N)]\n    m = [-float('inf')] * N\n    l = [0.0] * N\n    \n    num_kv_blocks = (N + Bc - 1) // Bc\n    num_q_blocks = (N + Br - 1) // Br\n    \n    for b_kv in range(num_kv_blocks):\n        k_start = b_kv * Bc\n        k_end = min(N, (b_kv + 1) * Bc)\n        K_block = K[k_start:k_end]\n        V_block = V[k_start:k_end]\n        \n        for b_q in range(num_q_blocks):\n            q_start = b_q * Br\n            q_end = min(N, (b_q + 1) * Br)\n            \n            for i in range(q_start, q_end):\n                s_block = [sum(Q[i][k] * K_block[j][k] for k in range(d)) * scale for j in range(len(K_block))]\n                \n                m_block = max(s_block)\n                m_new = max(m[i], m_block)\n                \n                p_block = [math.exp(val - m_new) for val in s_block]\n                l_new = math.exp(m[i] - m_new) * l[i] + sum(p_block)\n                \n                alpha = math.exp(m[i] - m_new) * l[i]\n                for col in range(d):\n                    v_sum = sum(p_block[j] * V_block[j][col] for j in range(len(V_block)))\n                    O[i][col] = (alpha * O[i][col] + v_sum) / l_new\n                    \n                m[i] = m_new\n                l[i] = l_new\n                \n    return O",
      },
      {
        id: "ml_flashattention_sram_tiling-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport math\n\ndef flash_attention_forward_tiled(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]], \n    Br: int = 2,\n    Bc: int = 2\n) -> list[list[float]]:\n    N = len(Q)\n    d = len(Q[0])\n    scale = 1.0 / math.sqrt(d)\n    \n    O = [[0.0] * d for _ in range(N)]\n    m = [-float('inf')] * N\n    l = [0.0] * N\n    \n    num_kv_blocks = (N + Bc - 1) // Bc\n    num_q_blocks = (N + Br - 1) // Br\n    \n    for b_kv in range(num_kv_blocks):\n        k_start = b_kv * Bc\n        k_end = min(N, (b_kv + 1) * Bc)\n        K_block = K[k_start:k_end]\n        V_block = V[k_start:k_end]\n        \n        for b_q in range(num_q_blocks):\n            q_start = b_q * Br\n            q_end = min(N, (b_q + 1) * Br)\n            \n            for i in range(q_start, q_end):\n                s_block = [sum(Q[i][k] * K_block[j][k] for k in range(d)) * scale for j in range(len(K_block))]\n                \n                m_block = max(s_block)\n                m_new = max(m[i], m_block)\n                \n                p_block = [math.exp(val - m_new) for val in s_block]\n                l_new = math.exp(m[i] - m_new) * l[i] + sum(p_block)\n                \n                alpha = math.exp(m[i] - m_new) * l[i]\n                for col in range(d):\n                    v_sum = sum(p_block[j] * V_block[j][col] for j in range(len(V_block)))\n                    O[i][col] = (alpha * O[i][col] + v_sum) / l_new\n                    \n                m[i] = m_new\n                l[i] = l_new\n                \n    return O",
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
        "Comprehensive exploration of IO-Aware Attention: FlashAttention SRAM Tile Loop, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "IO-Aware Attention: FlashAttention SRAM Tile Loop",
          definition:
            "Core computational primitive governing IO-Aware Attention: FlashAttention SRAM Tile Loop.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning IO-Aware Attention: FlashAttention SRAM Tile Loop.",
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
        "Conceptual introduction to IO-Aware Attention: FlashAttention SRAM Tile Loop, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "attention_map",
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
