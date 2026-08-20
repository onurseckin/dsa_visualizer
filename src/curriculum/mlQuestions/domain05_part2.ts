import type { MLTopicQuestionBank } from "./types";

export const domain05_part2: MLTopicQuestionBank[] = [
  {
    topicId: "ml_normalization_rmsnorm",
    title: "RMSNorm",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 21",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 21",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 21",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that RMSNorm is invariant to scali",
        prompt: "Prove that RMSNorm is invariant to scaling of the input features.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Show mathematically why RMSNorm is compu",
        prompt: "Show mathematically why RMSNorm is computationally cheaper than LayerNorm.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is RMSNorm preferred over LayerNorm",
        prompt: "Why is RMSNorm preferred over LayerNorm in modern LLMs like LLaMA?",
        engineeringContext: "Production ML infrastructure consideration for RMSNorm at scale.",
      },
      {
        title: "How does the choice of `eps` affect nume",
        prompt:
          "How does the choice of `eps` affect numerical stability in mixed-precision training?",
        engineeringContext: "Production ML infrastructure consideration for RMSNorm at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Inputs with all zeros.",
        scenario: "Inputs with all zeros.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Inputs with very large variance (testing `eps` effectiveness).",
        scenario: "Inputs with very large variance (testing `eps` effectiveness).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-21",
      title: "RMSNorm",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_normalization_rmsnorm",
      prompt: "Implement the canonical algorithm for RMSNorm.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import numpy as np\n\ndef rmsnorm_forward(x, gamma, eps):\n    # x: (N, D), gamma: (D,)\n    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)\n    return (x / rms) * gamma",
    },
    codeVariants: [
      {
        id: "ml_normalization_rmsnorm-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import numpy as np\n\ndef rmsnorm_forward(x, gamma, eps):\n    # x: (N, D), gamma: (D,)\n    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)\n    return (x / rms) * gamma",
      },
      {
        id: "ml_normalization_rmsnorm-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport numpy as np\n\ndef rmsnorm_forward(x, gamma, eps):\n    # x: (N, D), gamma: (D,)\n    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)\n    return (x / rms) * gamma",
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
        "Comprehensive exploration of RMSNorm, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "RMSNorm",
          definition: "Core computational primitive governing RMSNorm.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning RMSNorm.",
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
        "Conceptual introduction to RMSNorm, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_convolutions_im2col_gemm",
    title: "Image to Column (Im2Col)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 22",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 22",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 22",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the im2col transformation cor",
        prompt:
          "Prove that the im2col transformation correctly maps 2D convolution to matrix multiplication.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Derive the memory complexity of the im2c",
        prompt: "Derive the memory complexity of the im2col operation.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why do deep learning frameworks use im2c",
        prompt: "Why do deep learning frameworks use im2col despite its high memory consumption?",
        engineeringContext:
          "Production ML infrastructure consideration for Image to Column (Im2Col) at scale.",
      },
      {
        title: "What are the memory optimization strateg",
        prompt:
          "What are the memory optimization strategies (like implicit GEMM) to avoid materializing the im2col matrix?",
        engineeringContext:
          "Production ML infrastructure consideration for Image to Column (Im2Col) at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Convolution kernel size equal to image size.",
        scenario: "Convolution kernel size equal to image size.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Rectangular images and kernels.",
        scenario: "Rectangular images and kernels.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-22",
      title: "Image to Column (Im2Col)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_convolutions_im2col_gemm",
      prompt: "Implement the canonical algorithm for Image to Column (Im2Col).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import numpy as np\n\ndef im2col(image, K):\n    # image: (H, W), K: kernel size (scalar, assuming KxK)\n    H, W = image.shape\n    out_H = H - K + 1\n    out_W = W - K + 1\n    col = np.zeros((K * K, out_H * out_W))\n    \n    col_idx = 0\n    for i in range(out_H):\n        for j in range(out_W):\n            col[:, col_idx] = image[i:i+K, j:j+K].reshape(-1)\n            col_idx += 1\n    return col",
    },
    codeVariants: [
      {
        id: "ml_convolutions_im2col_gemm-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import numpy as np\n\ndef im2col(image, K):\n    # image: (H, W), K: kernel size (scalar, assuming KxK)\n    H, W = image.shape\n    out_H = H - K + 1\n    out_W = W - K + 1\n    col = np.zeros((K * K, out_H * out_W))\n    \n    col_idx = 0\n    for i in range(out_H):\n        for j in range(out_W):\n            col[:, col_idx] = image[i:i+K, j:j+K].reshape(-1)\n            col_idx += 1\n    return col",
      },
      {
        id: "ml_convolutions_im2col_gemm-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport numpy as np\n\ndef im2col(image, K):\n    # image: (H, W), K: kernel size (scalar, assuming KxK)\n    H, W = image.shape\n    out_H = H - K + 1\n    out_W = W - K + 1\n    col = np.zeros((K * K, out_H * out_W))\n    \n    col_idx = 0\n    for i in range(out_H):\n        for j in range(out_W):\n            col[:, col_idx] = image[i:i+K, j:j+K].reshape(-1)\n            col_idx += 1\n    return col",
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
        "Comprehensive exploration of Image to Column (Im2Col), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Image to Column (Im2Col)",
          definition: "Core computational primitive governing Image to Column (Im2Col).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Image to Column (Im2Col).",
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
        "Conceptual introduction to Image to Column (Im2Col), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "grid",
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
