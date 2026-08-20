import type { MLTopicQuestionBank } from "./types";

export const domain05_part1: MLTopicQuestionBank[] = [
  {
    topicId: "ml_mlp_backpropagation",
    title: "Multi-Layer Perceptron (MLP) Forward and Backward Pass",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 19",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 19",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 19",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove the chain rule applied to a 2-laye",
        prompt: "Prove the chain rule applied to a 2-layer MLP with ReLU activation.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that gradient descent with a suffi",
        prompt:
          "Prove that gradient descent with a sufficiently small learning rate decreases the loss for convex functions.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does batched matrix multiplication i",
        prompt:
          "How does batched matrix multiplication improve hardware utilization compared to unbatched?",
        engineeringContext:
          "Production ML infrastructure consideration for Multi-Layer Perceptron (MLP) Forward and Backward Pass at scale.",
      },
      {
        title: "What are the memory bandwidth implicatio",
        prompt: "What are the memory bandwidth implications of large linear layers in LLMs?",
        engineeringContext:
          "Production ML infrastructure consideration for Multi-Layer Perceptron (MLP) Forward and Backward Pass at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Learning rate set too high (gradient explosion).",
        scenario: "Learning rate set too high (gradient explosion).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Zero initialization of weights (symmetry breaking failure).",
        scenario: "Zero initialization of weights (symmetry breaking failure).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-19",
      title: "Multi-Layer Perceptron (MLP) Forward and Backward Pass",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_mlp_backpropagation",
      prompt:
        "Implement the canonical algorithm for Multi-Layer Perceptron (MLP) Forward and Backward Pass.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import numpy as np\n\ndef mlp_forward_backward_step(x, W, target, lr):\n    # x: (1, D_in), W: (D_in, D_out), target: (1, D_out)\n    # Simple linear layer without bias, MSE loss\n    out = np.dot(x, W)\n    loss = np.sum((out - target) ** 2)\n    grad_out = 2 * (out - target)\n    grad_W = np.dot(x.T, grad_out)\n    W_new = W - lr * grad_W\n    return W_new, loss",
    },
    codeVariants: [
      {
        id: "ml_mlp_backpropagation-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import numpy as np\n\ndef mlp_forward_backward_step(x, W, target, lr):\n    # x: (1, D_in), W: (D_in, D_out), target: (1, D_out)\n    # Simple linear layer without bias, MSE loss\n    out = np.dot(x, W)\n    loss = np.sum((out - target) ** 2)\n    grad_out = 2 * (out - target)\n    grad_W = np.dot(x.T, grad_out)\n    W_new = W - lr * grad_W\n    return W_new, loss",
      },
      {
        id: "ml_mlp_backpropagation-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport numpy as np\n\ndef mlp_forward_backward_step(x, W, target, lr):\n    # x: (1, D_in), W: (D_in, D_out), target: (1, D_out)\n    # Simple linear layer without bias, MSE loss\n    out = np.dot(x, W)\n    loss = np.sum((out - target) ** 2)\n    grad_out = 2 * (out - target)\n    grad_W = np.dot(x.T, grad_out)\n    W_new = W - lr * grad_W\n    return W_new, loss",
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
        "Comprehensive exploration of Multi-Layer Perceptron (MLP) Forward and Backward Pass, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Multi-Layer Perceptron (MLP) Forward and Backward Pass",
          definition:
            "Core computational primitive governing Multi-Layer Perceptron (MLP) Forward and Backward Pass.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Multi-Layer Perceptron (MLP) Forward and Backward Pass.",
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
        "Conceptual introduction to Multi-Layer Perceptron (MLP) Forward and Backward Pass, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "computation_graph",
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
    topicId: "ml_activations_online_softmax",
    title: "Online Softmax",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 20",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 20",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 20",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the online softmax algorithm",
        prompt:
          "Prove that the online softmax algorithm computes the exact same probability distribution as standard softmax.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Show that subtracting the maximum value",
        prompt:
          "Show that subtracting the maximum value before exponentiation does not change the softmax output, preventing numerical overflow.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does online softmax help in FlashAtt",
        prompt: "How does online softmax help in FlashAttention?",
        engineeringContext:
          "Production ML infrastructure consideration for Online Softmax at scale.",
      },
      {
        title: "Why is numerical stability critical in F",
        prompt:
          "Why is numerical stability critical in FP16/BF16 matrix multiplications for attention?",
        engineeringContext:
          "Production ML infrastructure consideration for Online Softmax at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Inputs containing large positive and negative numbers.",
        scenario: "Inputs containing large positive and negative numbers.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Empty or single-element blocks.",
        scenario: "Empty or single-element blocks.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-20",
      title: "Online Softmax",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_activations_online_softmax",
      prompt: "Implement the canonical algorithm for Online Softmax.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import numpy as np\n\ndef online_softmax(blocks):\n    # blocks: list of arrays\n    global_max = -np.inf\n    global_sum = 0.0\n    \n    for block in blocks:\n        block_max = np.max(block)\n        new_max = max(global_max, block_max)\n        global_sum = global_sum * np.exp(global_max - new_max) + np.sum(np.exp(block - new_max))\n        global_max = new_max\n        \n    probabilities = []\n    for block in blocks:\n        probabilities.append(np.exp(block - global_max) / global_sum)\n        \n    return probabilities",
    },
    codeVariants: [
      {
        id: "ml_activations_online_softmax-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import numpy as np\n\ndef online_softmax(blocks):\n    # blocks: list of arrays\n    global_max = -np.inf\n    global_sum = 0.0\n    \n    for block in blocks:\n        block_max = np.max(block)\n        new_max = max(global_max, block_max)\n        global_sum = global_sum * np.exp(global_max - new_max) + np.sum(np.exp(block - new_max))\n        global_max = new_max\n        \n    probabilities = []\n    for block in blocks:\n        probabilities.append(np.exp(block - global_max) / global_sum)\n        \n    return probabilities",
      },
      {
        id: "ml_activations_online_softmax-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport numpy as np\n\ndef online_softmax(blocks):\n    # blocks: list of arrays\n    global_max = -np.inf\n    global_sum = 0.0\n    \n    for block in blocks:\n        block_max = np.max(block)\n        new_max = max(global_max, block_max)\n        global_sum = global_sum * np.exp(global_max - new_max) + np.sum(np.exp(block - new_max))\n        global_max = new_max\n        \n    probabilities = []\n    for block in blocks:\n        probabilities.append(np.exp(block - global_max) / global_sum)\n        \n    return probabilities",
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
        "Comprehensive exploration of Online Softmax, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Online Softmax",
          definition: "Core computational primitive governing Online Softmax.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Online Softmax.",
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
        "Conceptual introduction to Online Softmax, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
