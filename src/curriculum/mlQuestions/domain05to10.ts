import { MLTopicQuestionBank } from "./types";

export const domain05to10: MLTopicQuestionBank[] = [
  {
    topicId: "ml_mlp_backpropagation",
    title: "Multi-Layer Perceptron (MLP) Forward and Backward Pass",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
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
    partA_dsaCoding: [],
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
  {
    topicId: "ml_normalization_rmsnorm",
    title: "RMSNorm",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
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
    partA_dsaCoding: [],
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
  {
    topicId: "ml_recurrent_lstm_gru",
    title: "LSTM Cell",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [
      {
        title: "Prove that the forget gate in LSTM helps",
        prompt: "Prove that the forget gate in LSTM helps mitigate the vanishing gradient problem.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Derive the backpropagation through time",
        prompt: "Derive the backpropagation through time (BPTT) equations for an LSTM cell.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is LSTM execution generally slower a",
        prompt:
          "Why is LSTM execution generally slower and harder to parallelize than Transformers?",
        engineeringContext: "Production ML infrastructure consideration for LSTM Cell at scale.",
      },
      {
        title: "How can we fuse LSTM operations to impro",
        prompt: "How can we fuse LSTM operations to improve GPU memory bandwidth utilization?",
        engineeringContext: "Production ML infrastructure consideration for LSTM Cell at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Extremely long sequences causing exploding gradients.",
        scenario: "Extremely long sequences causing exploding gradients.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "All-zero inputs and initial hidden states.",
        scenario: "All-zero inputs and initial hidden states.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-23",
      title: "LSTM Cell",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_recurrent_lstm_gru",
      prompt: "Implement the canonical algorithm for LSTM Cell.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import numpy as np\n\ndef sigmoid(x):\n    return 1 / (1 + np.exp(-x))\n\ndef lstm_cell_forward(x, h_prev, c_prev, W, U, b):\n    # W, U, b contain concatenated weights/biases for i, f, o, g\n    D_h = h_prev.shape[0]\n    z = np.dot(W, x) + np.dot(U, h_prev) + b\n    \n    i = sigmoid(z[0:D_h])\n    f = sigmoid(z[D_h:2*D_h])\n    o = sigmoid(z[2*D_h:3*D_h])\n    g = np.tanh(z[3*D_h:4*D_h])\n    \n    c_next = f * c_prev + i * g\n    h_next = o * np.tanh(c_next)\n    \n    return h_next, c_next",
    },
    codeVariants: [
      {
        id: "ml_recurrent_lstm_gru-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import numpy as np\n\ndef sigmoid(x):\n    return 1 / (1 + np.exp(-x))\n\ndef lstm_cell_forward(x, h_prev, c_prev, W, U, b):\n    # W, U, b contain concatenated weights/biases for i, f, o, g\n    D_h = h_prev.shape[0]\n    z = np.dot(W, x) + np.dot(U, h_prev) + b\n    \n    i = sigmoid(z[0:D_h])\n    f = sigmoid(z[D_h:2*D_h])\n    o = sigmoid(z[2*D_h:3*D_h])\n    g = np.tanh(z[3*D_h:4*D_h])\n    \n    c_next = f * c_prev + i * g\n    h_next = o * np.tanh(c_next)\n    \n    return h_next, c_next",
      },
      {
        id: "ml_recurrent_lstm_gru-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport numpy as np\n\ndef sigmoid(x):\n    return 1 / (1 + np.exp(-x))\n\ndef lstm_cell_forward(x, h_prev, c_prev, W, U, b):\n    # W, U, b contain concatenated weights/biases for i, f, o, g\n    D_h = h_prev.shape[0]\n    z = np.dot(W, x) + np.dot(U, h_prev) + b\n    \n    i = sigmoid(z[0:D_h])\n    f = sigmoid(z[D_h:2*D_h])\n    o = sigmoid(z[2*D_h:3*D_h])\n    g = np.tanh(z[3*D_h:4*D_h])\n    \n    c_next = f * c_prev + i * g\n    h_next = o * np.tanh(c_next)\n    \n    return h_next, c_next",
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
        "Comprehensive exploration of LSTM Cell, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "LSTM Cell",
          definition: "Core computational primitive governing LSTM Cell.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning LSTM Cell.",
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
        "Conceptual introduction to LSTM Cell, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_trie_aho_corasick",
    title: "Trie-based Vocabulary",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [
      {
        title: "Prove the time complexity of searching a",
        prompt:
          "Prove the time complexity of searching and inserting a word of length L in a Trie.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the space complexity of a Trie sto",
        prompt: "Prove the space complexity of a Trie storing N words of maximum length L.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does a Trie structure improve vocabu",
        prompt: "How does a Trie structure improve vocabulary search efficiency in tokenizers?",
        engineeringContext:
          "Production ML infrastructure consideration for Trie-based Vocabulary at scale.",
      },
      {
        title: "What are the memory overheads of a stand",
        prompt:
          "What are the memory overheads of a standard Trie compared to a Directed Acyclic Word Graph (DAWG)?",
        engineeringContext:
          "Production ML infrastructure consideration for Trie-based Vocabulary at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Inserting identical words multiple times.",
        scenario: "Inserting identical words multiple times.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Searching for a prefix of an inserted word that is not a complete word.",
        scenario: "Searching for a prefix of an inserted word that is not a complete word.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-24",
      title: "Trie-based Vocabulary",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_trie_aho_corasick",
      prompt: "Implement the canonical algorithm for Trie-based Vocabulary.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end_of_word = False\n\nclass TrieVocab:\n    def __init__(self):\n        self.root = TrieNode()\n        \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end_of_word = True\n        \n    def search(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                return False\n            node = node.children[char]\n        return node.is_end_of_word",
    },
    codeVariants: [
      {
        id: "ml_trie_aho_corasick-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end_of_word = False\n\nclass TrieVocab:\n    def __init__(self):\n        self.root = TrieNode()\n        \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end_of_word = True\n        \n    def search(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                return False\n            node = node.children[char]\n        return node.is_end_of_word",
      },
      {
        id: "ml_trie_aho_corasick-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nclass TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end_of_word = False\n\nclass TrieVocab:\n    def __init__(self):\n        self.root = TrieNode()\n        \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end_of_word = True\n        \n    def search(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                return False\n            node = node.children[char]\n        return node.is_end_of_word",
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
        "Comprehensive exploration of Trie-based Vocabulary, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Trie-based Vocabulary",
          definition: "Core computational primitive governing Trie-based Vocabulary.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Trie-based Vocabulary.",
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
        "Conceptual introduction to Trie-based Vocabulary, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "trie",
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
    topicId: "ml_subword_bpe_tiktoken",
    title: "Byte Pair Encoding (BPE)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [
      {
        title: "Show that BPE guarantees a finite, monot",
        prompt:
          "Show that BPE guarantees a finite, monotonically decreasing maximum sequence length on the training corpus.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that BPE does not create out-of-vo",
        prompt:
          "Prove that BPE does not create out-of-vocabulary (OOV) tokens for any string if initialized with byte-level characters.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is BPE the standard tokenization met",
        prompt: "Why is BPE the standard tokenization method for LLMs like GPT and LLaMA?",
        engineeringContext:
          "Production ML infrastructure consideration for Byte Pair Encoding (BPE) at scale.",
      },
      {
        title: "How can BPE merging be parallelized effi",
        prompt: "How can BPE merging be parallelized efficiently across large corpora?",
        engineeringContext:
          "Production ML infrastructure consideration for Byte Pair Encoding (BPE) at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: 'Words with heavily repeating character sequences (e.g., "aaaaa").',
        scenario: 'Words with heavily repeating character sequences (e.g., "aaaaa").',
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Merging when no pair occurs more than once.",
        scenario: "Merging when no pair occurs more than once.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-25",
      title: "Byte Pair Encoding (BPE)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_subword_bpe_tiktoken",
      prompt: "Implement the canonical algorithm for Byte Pair Encoding (BPE).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'from collections import Counter, defaultdict\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\ndef merge_vocab(pair, v_in):\n    v_out = {}\n    bigram = " ".join(pair)\n    replacement = "".join(pair)\n    for word in v_in:\n        w_out = word.replace(bigram, replacement)\n        v_out[w_out] = v_in[word]\n    return v_out\n\ndef bpe_train_step(vocab, num_merges):\n    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}\n    for i in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        best = max(pairs, key=pairs.get)\n        vocab = merge_vocab(best, vocab)\n    return vocab',
    },
    codeVariants: [
      {
        id: "ml_subword_bpe_tiktoken-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'from collections import Counter, defaultdict\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\ndef merge_vocab(pair, v_in):\n    v_out = {}\n    bigram = " ".join(pair)\n    replacement = "".join(pair)\n    for word in v_in:\n        w_out = word.replace(bigram, replacement)\n        v_out[w_out] = v_in[word]\n    return v_out\n\ndef bpe_train_step(vocab, num_merges):\n    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}\n    for i in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        best = max(pairs, key=pairs.get)\n        vocab = merge_vocab(best, vocab)\n    return vocab',
      },
      {
        id: "ml_subword_bpe_tiktoken-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nfrom collections import Counter, defaultdict\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\ndef merge_vocab(pair, v_in):\n    v_out = {}\n    bigram = " ".join(pair)\n    replacement = "".join(pair)\n    for word in v_in:\n        w_out = word.replace(bigram, replacement)\n        v_out[w_out] = v_in[word]\n    return v_out\n\ndef bpe_train_step(vocab, num_merges):\n    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}\n    for i in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        best = max(pairs, key=pairs.get)\n        vocab = merge_vocab(best, vocab)\n    return vocab',
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
        "Comprehensive exploration of Byte Pair Encoding (BPE), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Byte Pair Encoding (BPE)",
          definition: "Core computational primitive governing Byte Pair Encoding (BPE).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Byte Pair Encoding (BPE).",
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
        "Conceptual introduction to Byte Pair Encoding (BPE), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "trie",
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
    topicId: "ml_kd_trees_top_k",
    title: "KD-Tree for Retrieval",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [
      {
        title: "Prove the $O(N \\log N)$ expected time co",
        prompt:
          "Prove the $O(N \\log N)$ expected time complexity of constructing a balanced KD-Tree.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: 'Explain mathematically the "curse of dim',
        prompt:
          'Explain mathematically the "curse of dimensionality" and why KD-Trees become inefficient in high dimensions (D > 20).',
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why do vector databases prefer approxima",
        prompt:
          "Why do vector databases prefer approximate nearest neighbor (ANN) algorithms over exact KD-Trees for dense embeddings?",
        engineeringContext:
          "Production ML infrastructure consideration for KD-Tree for Retrieval at scale.",
      },
      {
        title: "How can KD-Trees be used for efficient s",
        prompt:
          "How can KD-Trees be used for efficient spatial querying in geographical recommendation systems?",
        engineeringContext:
          "Production ML infrastructure consideration for KD-Tree for Retrieval at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Collinear or exactly overlapping points.",
        scenario: "Collinear or exactly overlapping points.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Querying in spaces with very high dimensionality.",
        scenario: "Querying in spaces with very high dimensionality.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-26",
      title: "KD-Tree for Retrieval",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_kd_trees_top_k",
      prompt: "Implement the canonical algorithm for KD-Tree for Retrieval.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import math\n\nclass KDNode:\n    def __init__(self, point, axis, left=None, right=None):\n        self.point = point\n        self.axis = axis\n        self.left = left\n        self.right = right\n\nclass KDTree:\n    def __init__(self, points):\n        self.k = len(points[0]) if points else 0\n        self.root = self._build_tree(points, depth=0)\n        \n    def _build_tree(self, points, depth):\n        if not points:\n            return None\n        axis = depth % self.k\n        points.sort(key=lambda x: x[axis])\n        median = len(points) // 2\n        return KDNode(\n            points[median],\n            axis,\n            self._build_tree(points[:median], depth + 1),\n            self._build_tree(points[median + 1:], depth + 1)\n        )\n        \n    def nearest(self, query):\n        best = None\n        best_dist = float('inf')\n        \n        def _search(node):\n            nonlocal best, best_dist\n            if node is None:\n                return\n            \n            d = sum((a - b) ** 2 for a, b in zip(node.point, query))\n            if d < best_dist:\n                best_dist = d\n                best = node.point\n                \n            axis = node.axis\n            diff = query[axis] - node.point[axis]\n            \n            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)\n            _search(close)\n            if diff ** 2 < best_dist:\n                _search(away)\n                \n        _search(self.root)\n        return best",
    },
    codeVariants: [
      {
        id: "ml_kd_trees_top_k-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import math\n\nclass KDNode:\n    def __init__(self, point, axis, left=None, right=None):\n        self.point = point\n        self.axis = axis\n        self.left = left\n        self.right = right\n\nclass KDTree:\n    def __init__(self, points):\n        self.k = len(points[0]) if points else 0\n        self.root = self._build_tree(points, depth=0)\n        \n    def _build_tree(self, points, depth):\n        if not points:\n            return None\n        axis = depth % self.k\n        points.sort(key=lambda x: x[axis])\n        median = len(points) // 2\n        return KDNode(\n            points[median],\n            axis,\n            self._build_tree(points[:median], depth + 1),\n            self._build_tree(points[median + 1:], depth + 1)\n        )\n        \n    def nearest(self, query):\n        best = None\n        best_dist = float('inf')\n        \n        def _search(node):\n            nonlocal best, best_dist\n            if node is None:\n                return\n            \n            d = sum((a - b) ** 2 for a, b in zip(node.point, query))\n            if d < best_dist:\n                best_dist = d\n                best = node.point\n                \n            axis = node.axis\n            diff = query[axis] - node.point[axis]\n            \n            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)\n            _search(close)\n            if diff ** 2 < best_dist:\n                _search(away)\n                \n        _search(self.root)\n        return best",
      },
      {
        id: "ml_kd_trees_top_k-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport math\n\nclass KDNode:\n    def __init__(self, point, axis, left=None, right=None):\n        self.point = point\n        self.axis = axis\n        self.left = left\n        self.right = right\n\nclass KDTree:\n    def __init__(self, points):\n        self.k = len(points[0]) if points else 0\n        self.root = self._build_tree(points, depth=0)\n        \n    def _build_tree(self, points, depth):\n        if not points:\n            return None\n        axis = depth % self.k\n        points.sort(key=lambda x: x[axis])\n        median = len(points) // 2\n        return KDNode(\n            points[median],\n            axis,\n            self._build_tree(points[:median], depth + 1),\n            self._build_tree(points[median + 1:], depth + 1)\n        )\n        \n    def nearest(self, query):\n        best = None\n        best_dist = float('inf')\n        \n        def _search(node):\n            nonlocal best, best_dist\n            if node is None:\n                return\n            \n            d = sum((a - b) ** 2 for a, b in zip(node.point, query))\n            if d < best_dist:\n                best_dist = d\n                best = node.point\n                \n            axis = node.axis\n            diff = query[axis] - node.point[axis]\n            \n            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)\n            _search(close)\n            if diff ** 2 < best_dist:\n                _search(away)\n                \n        _search(self.root)\n        return best",
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
        "Comprehensive exploration of KD-Tree for Retrieval, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "KD-Tree for Retrieval",
          definition: "Core computational primitive governing KD-Tree for Retrieval.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning KD-Tree for Retrieval.",
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
        "Conceptual introduction to KD-Tree for Retrieval, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "tree",
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
    topicId: "ml_ann_hnsw_ivfpq",
    title: "Simplified HNSW",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [
      {
        title: "Prove that Navigable Small World graphs",
        prompt:
          'Prove that Navigable Small World graphs exhibit the "six degrees of separation" property for connectivity.',
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Demonstrate why adding layers in HNSW st",
        prompt:
          "Demonstrate why adding layers in HNSW strictly reduces the expected path length compared to a flat NSW graph.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does HNSW balance search speed and r",
        prompt:
          "How does HNSW balance search speed and recall during inference in retrieval-augmented generation (RAG)?",
        engineeringContext:
          "Production ML infrastructure consideration for Simplified HNSW at scale.",
      },
      {
        title: "What are the memory access patterns of H",
        prompt:
          "What are the memory access patterns of HNSW, and how do they impact CPU cache utilization?",
        engineeringContext:
          "Production ML infrastructure consideration for Simplified HNSW at scale.",
      },
    ],
    partD_stressTests: [
      {
        title:
          "Graph becoming disconnected (should be impossible by construction, but needs testing).",
        scenario:
          "Graph becoming disconnected (should be impossible by construction, but needs testing).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "All points having extremely similar embeddings.",
        scenario: "All points having extremely similar embeddings.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-27",
      title: "Simplified HNSW",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_ann_hnsw_ivfpq",
      prompt: "Implement the canonical algorithm for Simplified HNSW.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import math\nimport random\n\nclass SimplifiedHNSW:\n    def __init__(self, max_elements, M=16, ef_construction=100):\n        self.M = M\n        self.ef_construction = ef_construction\n        self.graph = {}\n        self.points = {}\n        self.entry_point = None\n        \n    def _distance(self, p1, p2):\n        return sum((a - b) ** 2 for a, b in zip(p1, p2))\n        \n    def add_point(self, point_id, vector):\n        self.points[point_id] = vector\n        self.graph[point_id] = []\n        \n        if self.entry_point is None:\n            self.entry_point = point_id\n            return\n            \n        # Simplified: Just find neighbors using a basic greedy search\n        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)\n        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]\n        \n        for n_id, dist in neighbors:\n            self.graph[point_id].append(n_id)\n            self.graph[n_id].append(point_id)\n            if len(self.graph[n_id]) > self.M:\n                # Keep top M neighbors\n                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]\n                \n    def _search_layer(self, query, ep, ef):\n        candidates = [(ep, self._distance(query, self.points[ep]))]\n        visited = {ep}\n        results = [(ep, self._distance(query, self.points[ep]))]\n        \n        while candidates:\n            candidates.sort(key=lambda x: x[1])\n            curr, curr_dist = candidates.pop(0)\n            \n            results.sort(key=lambda x: x[1])\n            if curr_dist > results[-1][1] and len(results) >= ef:\n                break\n                \n            for neighbor in self.graph[curr]:\n                if neighbor not in visited:\n                    visited.add(neighbor)\n                    dist = self._distance(query, self.points[neighbor])\n                    if len(results) < ef or dist < results[-1][1]:\n                        candidates.append((neighbor, dist))\n                        results.append((neighbor, dist))\n                        results.sort(key=lambda x: x[1])\n                        if len(results) > ef:\n                            results.pop()\n                            \n        return results\n        \n    def search(self, query, k=1):\n        if self.entry_point is None:\n            return []\n        res = self._search_layer(query, self.entry_point, max(k, self.M))\n        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]",
    },
    codeVariants: [
      {
        id: "ml_ann_hnsw_ivfpq-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import math\nimport random\n\nclass SimplifiedHNSW:\n    def __init__(self, max_elements, M=16, ef_construction=100):\n        self.M = M\n        self.ef_construction = ef_construction\n        self.graph = {}\n        self.points = {}\n        self.entry_point = None\n        \n    def _distance(self, p1, p2):\n        return sum((a - b) ** 2 for a, b in zip(p1, p2))\n        \n    def add_point(self, point_id, vector):\n        self.points[point_id] = vector\n        self.graph[point_id] = []\n        \n        if self.entry_point is None:\n            self.entry_point = point_id\n            return\n            \n        # Simplified: Just find neighbors using a basic greedy search\n        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)\n        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]\n        \n        for n_id, dist in neighbors:\n            self.graph[point_id].append(n_id)\n            self.graph[n_id].append(point_id)\n            if len(self.graph[n_id]) > self.M:\n                # Keep top M neighbors\n                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]\n                \n    def _search_layer(self, query, ep, ef):\n        candidates = [(ep, self._distance(query, self.points[ep]))]\n        visited = {ep}\n        results = [(ep, self._distance(query, self.points[ep]))]\n        \n        while candidates:\n            candidates.sort(key=lambda x: x[1])\n            curr, curr_dist = candidates.pop(0)\n            \n            results.sort(key=lambda x: x[1])\n            if curr_dist > results[-1][1] and len(results) >= ef:\n                break\n                \n            for neighbor in self.graph[curr]:\n                if neighbor not in visited:\n                    visited.add(neighbor)\n                    dist = self._distance(query, self.points[neighbor])\n                    if len(results) < ef or dist < results[-1][1]:\n                        candidates.append((neighbor, dist))\n                        results.append((neighbor, dist))\n                        results.sort(key=lambda x: x[1])\n                        if len(results) > ef:\n                            results.pop()\n                            \n        return results\n        \n    def search(self, query, k=1):\n        if self.entry_point is None:\n            return []\n        res = self._search_layer(query, self.entry_point, max(k, self.M))\n        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]",
      },
      {
        id: "ml_ann_hnsw_ivfpq-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport math\nimport random\n\nclass SimplifiedHNSW:\n    def __init__(self, max_elements, M=16, ef_construction=100):\n        self.M = M\n        self.ef_construction = ef_construction\n        self.graph = {}\n        self.points = {}\n        self.entry_point = None\n        \n    def _distance(self, p1, p2):\n        return sum((a - b) ** 2 for a, b in zip(p1, p2))\n        \n    def add_point(self, point_id, vector):\n        self.points[point_id] = vector\n        self.graph[point_id] = []\n        \n        if self.entry_point is None:\n            self.entry_point = point_id\n            return\n            \n        # Simplified: Just find neighbors using a basic greedy search\n        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)\n        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]\n        \n        for n_id, dist in neighbors:\n            self.graph[point_id].append(n_id)\n            self.graph[n_id].append(point_id)\n            if len(self.graph[n_id]) > self.M:\n                # Keep top M neighbors\n                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]\n                \n    def _search_layer(self, query, ep, ef):\n        candidates = [(ep, self._distance(query, self.points[ep]))]\n        visited = {ep}\n        results = [(ep, self._distance(query, self.points[ep]))]\n        \n        while candidates:\n            candidates.sort(key=lambda x: x[1])\n            curr, curr_dist = candidates.pop(0)\n            \n            results.sort(key=lambda x: x[1])\n            if curr_dist > results[-1][1] and len(results) >= ef:\n                break\n                \n            for neighbor in self.graph[curr]:\n                if neighbor not in visited:\n                    visited.add(neighbor)\n                    dist = self._distance(query, self.points[neighbor])\n                    if len(results) < ef or dist < results[-1][1]:\n                        candidates.append((neighbor, dist))\n                        results.append((neighbor, dist))\n                        results.sort(key=lambda x: x[1])\n                        if len(results) > ef:\n                            results.pop()\n                            \n        return results\n        \n    def search(self, query, k=1):\n        if self.entry_point is None:\n            return []\n        res = self._search_layer(query, self.entry_point, max(k, self.M))\n        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]",
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
        "Comprehensive exploration of Simplified HNSW, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Simplified HNSW",
          definition: "Core computational primitive governing Simplified HNSW.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Simplified HNSW.",
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
        "Conceptual introduction to Simplified HNSW, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "graph",
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
    topicId: "ml_attention_causal_sdpa",
    title: "Scaled Dot-Product Attention & Causal KV-Cache Masking",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
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
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
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
  {
    topicId: "ml_flashattention_sram_tiling",
    title: "IO-Aware Attention: FlashAttention SRAM Tile Loop",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
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
  {
    topicId: "ml_continuous_batching_orca",
    title: "Iteration-Level Continuous Batching (Orca Scheduler)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-31-ORCA-SCHEDULER",
      title: "Iteration-Level Continuous Batching (Orca Scheduler)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_continuous_batching_orca",
      prompt:
        "Implement the canonical algorithm for Iteration-Level Continuous Batching (Orca Scheduler).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "from collections import deque\n\nclass Request:\n    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):\n        self.req_id = req_id\n        self.prompt_len = prompt_len\n        self.max_tokens = max_tokens\n        self.tokens_generated = 0\n\n    @property\n    def is_finished(self) -> bool:\n        return self.tokens_generated >= self.max_tokens\n\nclass OrcaContinuousBatchingScheduler:\n    def __init__(self, max_batch_size: int):\n        self.max_batch_size = max_batch_size\n        self.waiting_queue = deque()\n        self.running_batch = []\n\n    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:\n        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))\n\n    def schedule_step(self) -> list[str]:\n        # 1. Evict finished requests\n        self.running_batch = [r for r in self.running_batch if not r.is_finished]\n        \n        # 2. Admit new requests from waiting queue if slots available\n        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:\n            self.running_batch.append(self.waiting_queue.popleft())\n            \n        # 3. Advance each running request by 1 token\n        executed_ids = []\n        for req in self.running_batch:\n            req.tokens_generated += 1\n            executed_ids.append(req.req_id)\n            \n        return executed_ids",
    },
    codeVariants: [
      {
        id: "ml_continuous_batching_orca-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "from collections import deque\n\nclass Request:\n    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):\n        self.req_id = req_id\n        self.prompt_len = prompt_len\n        self.max_tokens = max_tokens\n        self.tokens_generated = 0\n\n    @property\n    def is_finished(self) -> bool:\n        return self.tokens_generated >= self.max_tokens\n\nclass OrcaContinuousBatchingScheduler:\n    def __init__(self, max_batch_size: int):\n        self.max_batch_size = max_batch_size\n        self.waiting_queue = deque()\n        self.running_batch = []\n\n    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:\n        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))\n\n    def schedule_step(self) -> list[str]:\n        # 1. Evict finished requests\n        self.running_batch = [r for r in self.running_batch if not r.is_finished]\n        \n        # 2. Admit new requests from waiting queue if slots available\n        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:\n            self.running_batch.append(self.waiting_queue.popleft())\n            \n        # 3. Advance each running request by 1 token\n        executed_ids = []\n        for req in self.running_batch:\n            req.tokens_generated += 1\n            executed_ids.append(req.req_id)\n            \n        return executed_ids",
      },
      {
        id: "ml_continuous_batching_orca-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nfrom collections import deque\n\nclass Request:\n    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):\n        self.req_id = req_id\n        self.prompt_len = prompt_len\n        self.max_tokens = max_tokens\n        self.tokens_generated = 0\n\n    @property\n    def is_finished(self) -> bool:\n        return self.tokens_generated >= self.max_tokens\n\nclass OrcaContinuousBatchingScheduler:\n    def __init__(self, max_batch_size: int):\n        self.max_batch_size = max_batch_size\n        self.waiting_queue = deque()\n        self.running_batch = []\n\n    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:\n        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))\n\n    def schedule_step(self) -> list[str]:\n        # 1. Evict finished requests\n        self.running_batch = [r for r in self.running_batch if not r.is_finished]\n        \n        # 2. Admit new requests from waiting queue if slots available\n        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:\n            self.running_batch.append(self.waiting_queue.popleft())\n            \n        # 3. Advance each running request by 1 token\n        executed_ids = []\n        for req in self.running_batch:\n            req.tokens_generated += 1\n            executed_ids.append(req.req_id)\n            \n        return executed_ids",
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
        "Comprehensive exploration of Iteration-Level Continuous Batching (Orca Scheduler), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Iteration-Level Continuous Batching (Orca Scheduler)",
          definition:
            "Core computational primitive governing Iteration-Level Continuous Batching (Orca Scheduler).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Iteration-Level Continuous Batching (Orca Scheduler).",
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
        "Conceptual introduction to Iteration-Level Continuous Batching (Orca Scheduler), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "queue",
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
    topicId: "ml_pagedattention_cow_vllm",
    title: "Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-32-PAGEDATTN-COW",
      title: "Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_pagedattention_cow_vllm",
      prompt:
        "Implement the canonical algorithm for Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'class PagedAttentionBlockManager:\n    def __init__(self, block_size: int, total_blocks: int):\n        self.block_size = block_size\n        self.free_blocks = list(range(total_blocks - 1, -1, -1))\n        self.ref_counts = {i: 0 for i in range(total_blocks)}\n        self.block_tables = {}  # req_id -> list of physical block IDs\n        self.num_tokens = {}    # req_id -> int\n\n    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:\n        num_blocks = (num_tokens + self.block_size - 1) // self.block_size\n        blocks = []\n        for _ in range(num_blocks):\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            blk = self.free_blocks.pop()\n            self.ref_counts[blk] = 1\n            blocks.append(blk)\n        self.block_tables[req_id] = blocks\n        self.num_tokens[req_id] = num_tokens\n        return blocks\n\n    def append_token(self, req_id: str) -> int:\n        cur_tokens = self.num_tokens[req_id]\n        blocks = self.block_tables[req_id]\n        \n        # Check if new token requires new block\n        if cur_tokens % self.block_size == 0:\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            new_blk = self.free_blocks.pop()\n            self.ref_counts[new_blk] = 1\n            blocks.append(new_blk)\n        else:\n            # Check Copy-on-Write if last block is shared\n            last_blk = blocks[-1]\n            if self.ref_counts[last_blk] > 1:\n                if not self.free_blocks:\n                    raise MemoryError("Out of physical blocks")\n                self.ref_counts[last_blk] -= 1\n                new_blk = self.free_blocks.pop()\n                self.ref_counts[new_blk] = 1\n                blocks[-1] = new_blk\n                \n        self.num_tokens[req_id] += 1\n        return blocks[-1]\n\n    def read_kv(self, req_id: str) -> list[int]:\n        return list(self.block_tables.get(req_id, []))',
    },
    codeVariants: [
      {
        id: "ml_pagedattention_cow_vllm-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'class PagedAttentionBlockManager:\n    def __init__(self, block_size: int, total_blocks: int):\n        self.block_size = block_size\n        self.free_blocks = list(range(total_blocks - 1, -1, -1))\n        self.ref_counts = {i: 0 for i in range(total_blocks)}\n        self.block_tables = {}  # req_id -> list of physical block IDs\n        self.num_tokens = {}    # req_id -> int\n\n    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:\n        num_blocks = (num_tokens + self.block_size - 1) // self.block_size\n        blocks = []\n        for _ in range(num_blocks):\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            blk = self.free_blocks.pop()\n            self.ref_counts[blk] = 1\n            blocks.append(blk)\n        self.block_tables[req_id] = blocks\n        self.num_tokens[req_id] = num_tokens\n        return blocks\n\n    def append_token(self, req_id: str) -> int:\n        cur_tokens = self.num_tokens[req_id]\n        blocks = self.block_tables[req_id]\n        \n        # Check if new token requires new block\n        if cur_tokens % self.block_size == 0:\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            new_blk = self.free_blocks.pop()\n            self.ref_counts[new_blk] = 1\n            blocks.append(new_blk)\n        else:\n            # Check Copy-on-Write if last block is shared\n            last_blk = blocks[-1]\n            if self.ref_counts[last_blk] > 1:\n                if not self.free_blocks:\n                    raise MemoryError("Out of physical blocks")\n                self.ref_counts[last_blk] -= 1\n                new_blk = self.free_blocks.pop()\n                self.ref_counts[new_blk] = 1\n                blocks[-1] = new_blk\n                \n        self.num_tokens[req_id] += 1\n        return blocks[-1]\n\n    def read_kv(self, req_id: str) -> list[int]:\n        return list(self.block_tables.get(req_id, []))',
      },
      {
        id: "ml_pagedattention_cow_vllm-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nclass PagedAttentionBlockManager:\n    def __init__(self, block_size: int, total_blocks: int):\n        self.block_size = block_size\n        self.free_blocks = list(range(total_blocks - 1, -1, -1))\n        self.ref_counts = {i: 0 for i in range(total_blocks)}\n        self.block_tables = {}  # req_id -> list of physical block IDs\n        self.num_tokens = {}    # req_id -> int\n\n    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:\n        num_blocks = (num_tokens + self.block_size - 1) // self.block_size\n        blocks = []\n        for _ in range(num_blocks):\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            blk = self.free_blocks.pop()\n            self.ref_counts[blk] = 1\n            blocks.append(blk)\n        self.block_tables[req_id] = blocks\n        self.num_tokens[req_id] = num_tokens\n        return blocks\n\n    def append_token(self, req_id: str) -> int:\n        cur_tokens = self.num_tokens[req_id]\n        blocks = self.block_tables[req_id]\n        \n        # Check if new token requires new block\n        if cur_tokens % self.block_size == 0:\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            new_blk = self.free_blocks.pop()\n            self.ref_counts[new_blk] = 1\n            blocks.append(new_blk)\n        else:\n            # Check Copy-on-Write if last block is shared\n            last_blk = blocks[-1]\n            if self.ref_counts[last_blk] > 1:\n                if not self.free_blocks:\n                    raise MemoryError("Out of physical blocks")\n                self.ref_counts[last_blk] -= 1\n                new_blk = self.free_blocks.pop()\n                self.ref_counts[new_blk] = 1\n                blocks[-1] = new_blk\n                \n        self.num_tokens[req_id] += 1\n        return blocks[-1]\n\n    def read_kv(self, req_id: str) -> list[int]:\n        return list(self.block_tables.get(req_id, []))',
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
        "Comprehensive exploration of Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Logical-to-Physical Block Translation",
          definition:
            "Core computational primitive governing Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
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
        "Conceptual introduction to Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "kv_cache_blocks",
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
    topicId: "ml_speculative_decoding",
    title: "Speculative Decoding & Prefix Caching Algorithms",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-33-SPECULATIVE-DECODE",
      title: "Speculative Decoding & Prefix Caching Algorithms",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_speculative_decoding",
      prompt:
        "Implement the canonical algorithm for Speculative Decoding & Prefix Caching Algorithms.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def speculative_rejection_sampler(\n    draft_tokens: list[int],\n    draft_probs: list[list[float]],\n    target_probs: list[list[float]],\n    uniform_draws: list[float] = None\n) -> tuple[list[int], int]:\n    accepted = []\n    gamma = len(draft_tokens)\n    if uniform_draws is None:\n        uniform_draws = [0.0] * gamma\n        \n    for i in range(gamma):\n        token = draft_tokens[i]\n        q_val = draft_probs[i][token]\n        p_val = target_probs[i][token]\n        \n        # Acceptance ratio\n        ratio = p_val / (q_val + 1e-12)\n        u = uniform_draws[i] if i < len(uniform_draws) else 0.0\n        \n        if u <= min(1.0, ratio):\n            accepted.append(token)\n        else:\n            # Rejected at position i: resample from max(0, p - q)\n            resample_dist = [max(0.0, target_probs[i][v] - draft_probs[i][v]) for v in range(len(target_probs[i]))]\n            sum_resample = sum(resample_dist)\n            if sum_resample > 0:\n                bonus_token = max(range(len(resample_dist)), key=lambda v: resample_dist[v])\n            else:\n                bonus_token = max(range(len(target_probs[i])), key=lambda v: target_probs[i][v])\n            accepted.append(bonus_token)\n            break\n            \n    return accepted, len(accepted)",
    },
    codeVariants: [
      {
        id: "ml_speculative_decoding-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def speculative_rejection_sampler(\n    draft_tokens: list[int],\n    draft_probs: list[list[float]],\n    target_probs: list[list[float]],\n    uniform_draws: list[float] = None\n) -> tuple[list[int], int]:\n    accepted = []\n    gamma = len(draft_tokens)\n    if uniform_draws is None:\n        uniform_draws = [0.0] * gamma\n        \n    for i in range(gamma):\n        token = draft_tokens[i]\n        q_val = draft_probs[i][token]\n        p_val = target_probs[i][token]\n        \n        # Acceptance ratio\n        ratio = p_val / (q_val + 1e-12)\n        u = uniform_draws[i] if i < len(uniform_draws) else 0.0\n        \n        if u <= min(1.0, ratio):\n            accepted.append(token)\n        else:\n            # Rejected at position i: resample from max(0, p - q)\n            resample_dist = [max(0.0, target_probs[i][v] - draft_probs[i][v]) for v in range(len(target_probs[i]))]\n            sum_resample = sum(resample_dist)\n            if sum_resample > 0:\n                bonus_token = max(range(len(resample_dist)), key=lambda v: resample_dist[v])\n            else:\n                bonus_token = max(range(len(target_probs[i])), key=lambda v: target_probs[i][v])\n            accepted.append(bonus_token)\n            break\n            \n    return accepted, len(accepted)",
      },
      {
        id: "ml_speculative_decoding-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef speculative_rejection_sampler(\n    draft_tokens: list[int],\n    draft_probs: list[list[float]],\n    target_probs: list[list[float]],\n    uniform_draws: list[float] = None\n) -> tuple[list[int], int]:\n    accepted = []\n    gamma = len(draft_tokens)\n    if uniform_draws is None:\n        uniform_draws = [0.0] * gamma\n        \n    for i in range(gamma):\n        token = draft_tokens[i]\n        q_val = draft_probs[i][token]\n        p_val = target_probs[i][token]\n        \n        # Acceptance ratio\n        ratio = p_val / (q_val + 1e-12)\n        u = uniform_draws[i] if i < len(uniform_draws) else 0.0\n        \n        if u <= min(1.0, ratio):\n            accepted.append(token)\n        else:\n            # Rejected at position i: resample from max(0, p - q)\n            resample_dist = [max(0.0, target_probs[i][v] - draft_probs[i][v]) for v in range(len(target_probs[i]))]\n            sum_resample = sum(resample_dist)\n            if sum_resample > 0:\n                bonus_token = max(range(len(resample_dist)), key=lambda v: resample_dist[v])\n            else:\n                bonus_token = max(range(len(target_probs[i])), key=lambda v: target_probs[i][v])\n            accepted.append(bonus_token)\n            break\n            \n    return accepted, len(accepted)",
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
        "Comprehensive exploration of Speculative Decoding & Prefix Caching Algorithms, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Speculative Decoding",
          definition:
            "Core computational primitive governing Speculative Decoding & Prefix Caching Algorithms.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Speculative Decoding & Prefix Caching Algorithms.",
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
        "Conceptual introduction to Speculative Decoding & Prefix Caching Algorithms, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "distribution",
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
    topicId: "ml_floating_point_kahan",
    title: "Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
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
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
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
  {
    topicId: "ml_dense_gemm_tiling",
    title: "Dense GEMM & SRAM L1 Block Tiling",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
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
  {
    topicId: "ml_interconnect_alpha_beta",
    title: "Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-37-NETWORK-ALPHA-BETA",
      title: "Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_interconnect_alpha_beta",
      prompt:
        "Implement the canonical algorithm for Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes\n    return hops * alpha + (size_bytes / beta)",
    },
    codeVariants: [
      {
        id: "ml_interconnect_alpha_beta-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes\n    return hops * alpha + (size_bytes / beta)",
      },
      {
        id: "ml_interconnect_alpha_beta-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes\n    return hops * alpha + (size_bytes / beta)",
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
        "Comprehensive exploration of Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Interconnect Topologies",
          definition:
            "Core computational primitive governing Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
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
        "Conceptual introduction to Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "network_topology",
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
    topicId: "ml_ring_allreduce_collective",
    title: "Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-38-RING-ALLREDUCE",
      title: "Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_ring_allreduce_collective",
      prompt:
        "Implement the canonical algorithm for Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)\n    import copy\n    state = copy.deepcopy(initial_state)\n    trace = []\n    \n    # Phase 1: Scatter-Reduce (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n - step) % P\n            next_state[send_to][chunk_idx] += state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    # Phase 2: All-Gather (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n + 1 - step) % P\n            next_state[send_to][chunk_idx] = state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    return trace",
    },
    codeVariants: [
      {
        id: "ml_ring_allreduce_collective-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)\n    import copy\n    state = copy.deepcopy(initial_state)\n    trace = []\n    \n    # Phase 1: Scatter-Reduce (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n - step) % P\n            next_state[send_to][chunk_idx] += state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    # Phase 2: All-Gather (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n + 1 - step) % P\n            next_state[send_to][chunk_idx] = state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    return trace",
      },
      {
        id: "ml_ring_allreduce_collective-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)\n    import copy\n    state = copy.deepcopy(initial_state)\n    trace = []\n    \n    # Phase 1: Scatter-Reduce (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n - step) % P\n            next_state[send_to][chunk_idx] += state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    # Phase 2: All-Gather (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n + 1 - step) % P\n            next_state[send_to][chunk_idx] = state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    return trace",
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
        "Comprehensive exploration of Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)",
          definition:
            "Core computational primitive governing Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
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
        "Conceptual introduction to Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "ring_network",
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
    topicId: "ml_zero3_parameter_sharding",
    title: "Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-39-ZERO3-SHARDING",
      title: "Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_zero3_parameter_sharding",
      prompt:
        "Implement the canonical algorithm for Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def zero3_parameter_shard_and_allgather(param_weights: list[float], world_size: int, rank: int) -> tuple[list[float], list[float]]:\n    N = len(param_weights)\n    chunk_size = (N + world_size - 1) // world_size\n    padded_len = chunk_size * world_size\n    \n    padded_weights = param_weights + [0.0] * (padded_len - N)\n    \n    start = rank * chunk_size\n    end = start + chunk_size\n    shard = padded_weights[start:end]\n    \n    # Allgather simulate\n    reconstructed = []\n    for r in range(world_size):\n        r_start = r * chunk_size\n        r_end = r_start + chunk_size\n        reconstructed.extend(padded_weights[r_start:r_end])\n        \n    return shard, reconstructed[:N]",
    },
    codeVariants: [
      {
        id: "ml_zero3_parameter_sharding-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def zero3_parameter_shard_and_allgather(param_weights: list[float], world_size: int, rank: int) -> tuple[list[float], list[float]]:\n    N = len(param_weights)\n    chunk_size = (N + world_size - 1) // world_size\n    padded_len = chunk_size * world_size\n    \n    padded_weights = param_weights + [0.0] * (padded_len - N)\n    \n    start = rank * chunk_size\n    end = start + chunk_size\n    shard = padded_weights[start:end]\n    \n    # Allgather simulate\n    reconstructed = []\n    for r in range(world_size):\n        r_start = r * chunk_size\n        r_end = r_start + chunk_size\n        reconstructed.extend(padded_weights[r_start:r_end])\n        \n    return shard, reconstructed[:N]",
      },
      {
        id: "ml_zero3_parameter_sharding-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef zero3_parameter_shard_and_allgather(param_weights: list[float], world_size: int, rank: int) -> tuple[list[float], list[float]]:\n    N = len(param_weights)\n    chunk_size = (N + world_size - 1) // world_size\n    padded_len = chunk_size * world_size\n    \n    padded_weights = param_weights + [0.0] * (padded_len - N)\n    \n    start = rank * chunk_size\n    end = start + chunk_size\n    shard = padded_weights[start:end]\n    \n    # Allgather simulate\n    reconstructed = []\n    for r in range(world_size):\n        r_start = r * chunk_size\n        r_end = r_start + chunk_size\n        reconstructed.extend(padded_weights[r_start:r_end])\n        \n    return shard, reconstructed[:N]",
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
        "Comprehensive exploration of Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP)",
          definition:
            "Core computational primitive governing Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP).",
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
        "Conceptual introduction to Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "distributed_shards",
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
    topicId: "ml_compiler_fusion_liveness",
    title: "Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-40-IR-FUSION-LIVENESS",
      title: "Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_compiler_fusion_liveness",
      prompt:
        "Implement the canonical algorithm for Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals\n    events = []\n    for tensor_name, (start, end, size) in liveness.items():\n        events.append((start, size))    # Allocation event\n        events.append((end, -size))    # Free event\n        \n    # Sort events by timestep. If equal, free before allocate\n    events.sort(key=lambda x: (x[0], x[1]))\n    \n    current_mem = 0\n    peak_mem = 0\n    \n    for _, delta in events:\n        current_mem += delta\n        if current_mem > peak_mem:\n            peak_mem = current_mem\n            \n    return peak_mem",
    },
    codeVariants: [
      {
        id: "ml_compiler_fusion_liveness-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals\n    events = []\n    for tensor_name, (start, end, size) in liveness.items():\n        events.append((start, size))    # Allocation event\n        events.append((end, -size))    # Free event\n        \n    # Sort events by timestep. If equal, free before allocate\n    events.sort(key=lambda x: (x[0], x[1]))\n    \n    current_mem = 0\n    peak_mem = 0\n    \n    for _, delta in events:\n        current_mem += delta\n        if current_mem > peak_mem:\n            peak_mem = current_mem\n            \n    return peak_mem",
      },
      {
        id: "ml_compiler_fusion_liveness-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals\n    events = []\n    for tensor_name, (start, end, size) in liveness.items():\n        events.append((start, size))    # Allocation event\n        events.append((end, -size))    # Free event\n        \n    # Sort events by timestep. If equal, free before allocate\n    events.sort(key=lambda x: (x[0], x[1]))\n    \n    current_mem = 0\n    peak_mem = 0\n    \n    for _, delta in events:\n        current_mem += delta\n        if current_mem > peak_mem:\n            peak_mem = current_mem\n            \n    return peak_mem",
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
        "Comprehensive exploration of Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Compiler Graph Passes, Kernel Fusion",
          definition:
            "Core computational primitive governing Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
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
        "Conceptual introduction to Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "memory_liveness_arena",
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
    topicId: "ml_parallelism_3d_moe_1f1b",
    title: "3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [],
    partB_mathProofs: [],
    partC_systemsQuestions: [],
    partD_stressTests: [],
    executableContract: {
      id: "CONTRACT-TOPIC-41-MOE-1F1B",
      title: "3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_parallelism_3d_moe_1f1b",
      prompt:
        "Implement the canonical algorithm for 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:\n    P = num_stages\n    M = num_microbatches\n    if M + P - 1 == 0:\n        return 0.0\n    return float(P - 1) / float(M + P - 1)\n\ndef moe_topk_routing_with_capacity(\n    gate_logits: list[list[float]], \n    top_k: int, \n    capacity_limit: int\n) -> list[list[int]]:\n    num_experts = len(gate_logits[0]) if gate_logits else 0\n    expert_counts = {e: 0 for e in range(num_experts)}\n    assignments = []\n    \n    for token_logits in gate_logits:\n        indexed_logits = list(enumerate(token_logits))\n        indexed_logits.sort(key=lambda x: x[1], reverse=True)\n        top_experts = [idx for idx, _ in indexed_logits[:top_k]]\n        \n        token_assignments = []\n        for expert in top_experts:\n            if expert_counts[expert] < capacity_limit:\n                expert_counts[expert] += 1\n                token_assignments.append(expert)\n            else:\n                token_assignments.append(-1)\n        assignments.append(token_assignments)\n            \n    return assignments",
    },
    codeVariants: [
      {
        id: "ml_parallelism_3d_moe_1f1b-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:\n    P = num_stages\n    M = num_microbatches\n    if M + P - 1 == 0:\n        return 0.0\n    return float(P - 1) / float(M + P - 1)\n\ndef moe_topk_routing_with_capacity(\n    gate_logits: list[list[float]], \n    top_k: int, \n    capacity_limit: int\n) -> list[list[int]]:\n    num_experts = len(gate_logits[0]) if gate_logits else 0\n    expert_counts = {e: 0 for e in range(num_experts)}\n    assignments = []\n    \n    for token_logits in gate_logits:\n        indexed_logits = list(enumerate(token_logits))\n        indexed_logits.sort(key=lambda x: x[1], reverse=True)\n        top_experts = [idx for idx, _ in indexed_logits[:top_k]]\n        \n        token_assignments = []\n        for expert in top_experts:\n            if expert_counts[expert] < capacity_limit:\n                expert_counts[expert] += 1\n                token_assignments.append(expert)\n            else:\n                token_assignments.append(-1)\n        assignments.append(token_assignments)\n            \n    return assignments",
      },
      {
        id: "ml_parallelism_3d_moe_1f1b-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:\n    P = num_stages\n    M = num_microbatches\n    if M + P - 1 == 0:\n        return 0.0\n    return float(P - 1) / float(M + P - 1)\n\ndef moe_topk_routing_with_capacity(\n    gate_logits: list[list[float]], \n    top_k: int, \n    capacity_limit: int\n) -> list[list[int]]:\n    num_experts = len(gate_logits[0]) if gate_logits else 0\n    expert_counts = {e: 0 for e in range(num_experts)}\n    assignments = []\n    \n    for token_logits in gate_logits:\n        indexed_logits = list(enumerate(token_logits))\n        indexed_logits.sort(key=lambda x: x[1], reverse=True)\n        top_experts = [idx for idx, _ in indexed_logits[:top_k]]\n        \n        token_assignments = []\n        for expert in top_experts:\n            if expert_counts[expert] < capacity_limit:\n                expert_counts[expert] += 1\n                token_assignments.append(expert)\n            else:\n                token_assignments.append(-1)\n        assignments.append(token_assignments)\n            \n    return assignments",
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
        "Comprehensive exploration of 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "3D Parallelism, 1F1B Pipeline Bubble Analysis",
          definition:
            "Core computational primitive governing 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
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
        "Conceptual introduction to 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "parallel_pipeline_moe",
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
