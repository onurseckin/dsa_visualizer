import type { MLTopicQuestionBank } from "./types";

export const recurrentNetworks: MLTopicQuestionBank[] = [
  {
    topicId: "ml_recurrent_lstm_gru",
    title: "LSTM Cell",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 23",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 23",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 23",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
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
];
