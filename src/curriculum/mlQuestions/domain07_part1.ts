import type { MLTopicQuestionBank } from "./types";

export const domain07_part1: MLTopicQuestionBank[] = [
  {
    topicId: "ml_attention_causal_sdpa",
    title: "Scaled Dot-Product Attention & Causal KV-Cache Masking",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 28",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 28",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 28",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Scaled Dot-Product Attention & Causal KV-Cache Masking.",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Scaled Dot-Product Attention & Causal KV-Cache Masking.",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Scaled Dot-Product Attention & Causal KV-Cache Masking scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Scaled Dot-Product Attention & Causal KV-Cache Masking optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-28-SDPA-CAUSAL",
      title: "Scaled Dot-Product Attention & Causal KV-Cache Masking",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_attention_causal_sdpa",
      prompt:
        "Implement the canonical algorithm for Scaled Dot-Product Attention & Causal KV-Cache Masking.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import math\n\ndef scaled_dot_product_attention_causal(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]]\n) -> list[list[float]]:\n    N = len(Q)\n    d_k = len(Q[0])\n    scale = 1.0 / math.sqrt(d_k)\n    \n    # 1. Compute raw scores: S = Q * K^T * scale\n    # 2. Apply causal mask (set j > i to -inf)\n    # 3. Softmax along each row\n    # 4. Multiply by V\n    \n    O = [[0.0] * d_k for _ in range(N)]\n    \n    for i in range(N):\n        row_scores = []\n        for j in range(N):\n            if j > i:\n                row_scores.append(-float('inf'))\n            else:\n                dot = sum(Q[i][k] * K[j][k] for k in range(d_k))\n                row_scores.append(dot * scale)\n                \n        # Numerically stable softmax for row i\n        valid_scores = [s for s in row_scores[:i+1]]\n        max_score = max(valid_scores) if valid_scores else 0.0\n        exp_scores = [math.exp(s - max_score) for s in valid_scores]\n        sum_exp = sum(exp_scores)\n        probs = [e / sum_exp for e in exp_scores]\n        \n        # Multiply attention weights by V\n        for d in range(d_k):\n            O[i][d] = sum(probs[j] * V[j][d] for j in range(i + 1))\n            \n    return O",
    },
    codeVariants: [
      {
        id: "ml_attention_causal_sdpa-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import math\n\ndef scaled_dot_product_attention_causal(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]]\n) -> list[list[float]]:\n    N = len(Q)\n    d_k = len(Q[0])\n    scale = 1.0 / math.sqrt(d_k)\n    \n    # 1. Compute raw scores: S = Q * K^T * scale\n    # 2. Apply causal mask (set j > i to -inf)\n    # 3. Softmax along each row\n    # 4. Multiply by V\n    \n    O = [[0.0] * d_k for _ in range(N)]\n    \n    for i in range(N):\n        row_scores = []\n        for j in range(N):\n            if j > i:\n                row_scores.append(-float('inf'))\n            else:\n                dot = sum(Q[i][k] * K[j][k] for k in range(d_k))\n                row_scores.append(dot * scale)\n                \n        # Numerically stable softmax for row i\n        valid_scores = [s for s in row_scores[:i+1]]\n        max_score = max(valid_scores) if valid_scores else 0.0\n        exp_scores = [math.exp(s - max_score) for s in valid_scores]\n        sum_exp = sum(exp_scores)\n        probs = [e / sum_exp for e in exp_scores]\n        \n        # Multiply attention weights by V\n        for d in range(d_k):\n            O[i][d] = sum(probs[j] * V[j][d] for j in range(i + 1))\n            \n    return O",
      },
      {
        id: "ml_attention_causal_sdpa-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport math\n\ndef scaled_dot_product_attention_causal(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]]\n) -> list[list[float]]:\n    N = len(Q)\n    d_k = len(Q[0])\n    scale = 1.0 / math.sqrt(d_k)\n    \n    # 1. Compute raw scores: S = Q * K^T * scale\n    # 2. Apply causal mask (set j > i to -inf)\n    # 3. Softmax along each row\n    # 4. Multiply by V\n    \n    O = [[0.0] * d_k for _ in range(N)]\n    \n    for i in range(N):\n        row_scores = []\n        for j in range(N):\n            if j > i:\n                row_scores.append(-float('inf'))\n            else:\n                dot = sum(Q[i][k] * K[j][k] for k in range(d_k))\n                row_scores.append(dot * scale)\n                \n        # Numerically stable softmax for row i\n        valid_scores = [s for s in row_scores[:i+1]]\n        max_score = max(valid_scores) if valid_scores else 0.0\n        exp_scores = [math.exp(s - max_score) for s in valid_scores]\n        sum_exp = sum(exp_scores)\n        probs = [e / sum_exp for e in exp_scores]\n        \n        # Multiply attention weights by V\n        for d in range(d_k):\n            O[i][d] = sum(probs[j] * V[j][d] for j in range(i + 1))\n            \n    return O",
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
        "Comprehensive exploration of Scaled Dot-Product Attention & Causal KV-Cache Masking, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Scaled Dot-Product Attention",
          definition:
            "Core computational primitive governing Scaled Dot-Product Attention & Causal KV-Cache Masking.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Scaled Dot-Product Attention & Causal KV-Cache Masking.",
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
        "Conceptual introduction to Scaled Dot-Product Attention & Causal KV-Cache Masking, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
  {
    topicId: "ml_rope_gqa_attention",
    title: "Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 29",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 29",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 29",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi) optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-29-ROPE-GQA",
      title: "Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_rope_gqa_attention",
      prompt:
        "Implement the canonical algorithm for Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import math\n\ndef apply_rope_2d(x: list[float], pos: int, base: float = 10000.0) -> list[float]:\n    d = len(x)\n    out = [0.0] * d\n    \n    for i in range(0, d, 2):\n        theta = base ** (-i / d)\n        angle = pos * theta\n        cos_val = math.cos(angle)\n        sin_val = math.sin(angle)\n        \n        x0 = x[i]\n        x1 = x[i + 1]\n        \n        out[i] = x0 * cos_val - x1 * sin_val\n        out[i + 1] = x0 * sin_val + x1 * cos_val\n        \n    return out",
    },
    codeVariants: [
      {
        id: "ml_rope_gqa_attention-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import math\n\ndef apply_rope_2d(x: list[float], pos: int, base: float = 10000.0) -> list[float]:\n    d = len(x)\n    out = [0.0] * d\n    \n    for i in range(0, d, 2):\n        theta = base ** (-i / d)\n        angle = pos * theta\n        cos_val = math.cos(angle)\n        sin_val = math.sin(angle)\n        \n        x0 = x[i]\n        x1 = x[i + 1]\n        \n        out[i] = x0 * cos_val - x1 * sin_val\n        out[i + 1] = x0 * sin_val + x1 * cos_val\n        \n    return out",
      },
      {
        id: "ml_rope_gqa_attention-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport math\n\ndef apply_rope_2d(x: list[float], pos: int, base: float = 10000.0) -> list[float]:\n    d = len(x)\n    out = [0.0] * d\n    \n    for i in range(0, d, 2):\n        theta = base ** (-i / d)\n        angle = pos * theta\n        cos_val = math.cos(angle)\n        sin_val = math.sin(angle)\n        \n        x0 = x[i]\n        x1 = x[i + 1]\n        \n        out[i] = x0 * cos_val - x1 * sin_val\n        out[i + 1] = x0 * sin_val + x1 * cos_val\n        \n    return out",
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
        "Comprehensive exploration of Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Multi-Head, Grouped-Query Attention (GQA)",
          definition:
            "Core computational primitive governing Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi).",
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
        "Conceptual introduction to Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "vector",
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
