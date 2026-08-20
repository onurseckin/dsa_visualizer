import type { MLTopicQuestionBank } from "./types";

export const domain09_part1: MLTopicQuestionBank[] = [
  {
    topicId: "ml_floating_point_kahan",
    title: "Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 34",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 34",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 34",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation.",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation.",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-34-KAHAN-PRECISION",
      title: "Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_floating_point_kahan",
      prompt:
        "Implement the canonical algorithm for Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def kahan_compensated_sum(floats: list[float]) -> float:\n    values = floats\n    total = 0.0\n    c = 0.0  # Running compensation for lost low-order bits\n    \n    for v in values:\n        y = v - c\n        t = total + y\n        c = (t - total) - y\n        total = t\n        \n    return total",
    },
    codeVariants: [
      {
        id: "ml_floating_point_kahan-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def kahan_compensated_sum(floats: list[float]) -> float:\n    values = floats\n    total = 0.0\n    c = 0.0  # Running compensation for lost low-order bits\n    \n    for v in values:\n        y = v - c\n        t = total + y\n        c = (t - total) - y\n        total = t\n        \n    return total",
      },
      {
        id: "ml_floating_point_kahan-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef kahan_compensated_sum(floats: list[float]) -> float:\n    values = floats\n    total = 0.0\n    c = 0.0  # Running compensation for lost low-order bits\n    \n    for v in values:\n        y = v - c\n        t = total + y\n        c = (t - total) - y\n        total = t\n        \n    return total",
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
        "Comprehensive exploration of Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Floating-Point Formats (FP32/FP16/BF16/FP8)",
          definition:
            "Core computational primitive governing Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation.",
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
        "Conceptual introduction to Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
  {
    topicId: "ml_affine_quantization_int8",
    title: "Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 35",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 35",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 35",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant) optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-35-AFFINE-QUANT",
      title: "Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_affine_quantization_int8",
      prompt:
        "Implement the canonical algorithm for Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def quantize_affine_int8(x: list[float]) -> tuple[float, int, list[int]]:\n    bits = 8\n    min_val = min(x)\n    max_val = max(x)\n    \n    qmin = 0\n    qmax = (1 << bits) - 1\n    \n    if max_val == min_val:\n        return 1.0, 0, [0] * len(x)\n        \n    scale = (max_val - min_val) / float(qmax - qmin)\n    zero_point = int(round(-min_val / scale))\n    zero_point = max(qmin, min(qmax, zero_point))\n    \n    q = []\n    for val in x:\n        q_val = int(round(val / scale + zero_point))\n        q_val = max(qmin, min(qmax, q_val))\n        q.append(q_val)\n        \n    return scale, zero_point, q",
    },
    codeVariants: [
      {
        id: "ml_affine_quantization_int8-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def quantize_affine_int8(x: list[float]) -> tuple[float, int, list[int]]:\n    bits = 8\n    min_val = min(x)\n    max_val = max(x)\n    \n    qmin = 0\n    qmax = (1 << bits) - 1\n    \n    if max_val == min_val:\n        return 1.0, 0, [0] * len(x)\n        \n    scale = (max_val - min_val) / float(qmax - qmin)\n    zero_point = int(round(-min_val / scale))\n    zero_point = max(qmin, min(qmax, zero_point))\n    \n    q = []\n    for val in x:\n        q_val = int(round(val / scale + zero_point))\n        q_val = max(qmin, min(qmax, q_val))\n        q.append(q_val)\n        \n    return scale, zero_point, q",
      },
      {
        id: "ml_affine_quantization_int8-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef quantize_affine_int8(x: list[float]) -> tuple[float, int, list[int]]:\n    bits = 8\n    min_val = min(x)\n    max_val = max(x)\n    \n    qmin = 0\n    qmax = (1 << bits) - 1\n    \n    if max_val == min_val:\n        return 1.0, 0, [0] * len(x)\n        \n    scale = (max_val - min_val) / float(qmax - qmin)\n    zero_point = int(round(-min_val / scale))\n    zero_point = max(qmin, min(qmax, zero_point))\n    \n    q = []\n    for val in x:\n        q_val = int(round(val / scale + zero_point))\n        q_val = max(qmin, min(qmax, q_val))\n        q.append(q_val)\n        \n    return scale, zero_point, q",
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
        "Comprehensive exploration of Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Scale",
          definition:
            "Core computational primitive governing Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant).",
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
        "Conceptual introduction to Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "quantization",
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
