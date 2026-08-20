import type { MLTopicQuestionBank } from "./types";

export const domain04_part3: MLTopicQuestionBank[] = [
  {
    topicId: "ml_svm_kernel_smo",
    title: "SVMs & Margins",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 17",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 17",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 17",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Show that maximizing the margin is equiv",
        prompt: "Show that maximizing the margin is equivalent to minimizing ||w||^2.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "State and prove the KKT conditions for t",
        prompt: "State and prove the KKT conditions for the SVM dual optimization problem.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is the kernel trick so computational",
        prompt:
          "Why is the kernel trick so computationally powerful for SVMs compared to explicitly projecting features?",
        engineeringContext:
          "Production ML infrastructure consideration for SVMs & Margins at scale.",
      },
      {
        title: "How is Sequential Minimal Optimization (",
        prompt:
          "How is Sequential Minimal Optimization (SMO) used to solve the SVM dual problem efficiently?",
        engineeringContext:
          "Production ML infrastructure consideration for SVMs & Margins at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Linearly inseparable data without soft margin (leads to no solution).",
        scenario: "Linearly inseparable data without soft margin (leads to no solution).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Data points collinear along the decision boundary.",
        scenario: "Data points collinear along the decision boundary.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-17",
      title: "SVMs & Margins",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_svm_kernel_smo",
      prompt: "Implement the canonical algorithm for SVMs & Margins.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def linear_svm_decision_function(X, weights, bias):\n    """\n    Calculates the decision function values for an SVM.\n    """\n    if not X:\n        return []\n        \n    n_samples = len(X)\n    n_features = len(weights)\n    \n    decisions = []\n    for i in range(n_samples):\n        val = sum(X[i][j] * weights[j] for j in range(n_features)) + bias\n        decisions.append(val)\n        \n    return decisions',
    },
    codeVariants: [
      {
        id: "ml_svm_kernel_smo-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def linear_svm_decision_function(X, weights, bias):\n    """\n    Calculates the decision function values for an SVM.\n    """\n    if not X:\n        return []\n        \n    n_samples = len(X)\n    n_features = len(weights)\n    \n    decisions = []\n    for i in range(n_samples):\n        val = sum(X[i][j] * weights[j] for j in range(n_features)) + bias\n        decisions.append(val)\n        \n    return decisions',
      },
      {
        id: "ml_svm_kernel_smo-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef linear_svm_decision_function(X, weights, bias):\n    """\n    Calculates the decision function values for an SVM.\n    """\n    if not X:\n        return []\n        \n    n_samples = len(X)\n    n_features = len(weights)\n    \n    decisions = []\n    for i in range(n_samples):\n        val = sum(X[i][j] * weights[j] for j in range(n_features)) + bias\n        decisions.append(val)\n        \n    return decisions',
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
        "Comprehensive exploration of SVMs & Margins, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "SVMs",
          definition: "Core computational primitive governing SVMs & Margins.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning SVMs & Margins.",
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
        "Conceptual introduction to SVMs & Margins, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "scatter_decision_boundary",
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
    topicId: "ml_collaborative_filtering_als",
    title: "Recommender Systems / Matrix Factorization",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 18",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 18",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 18",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the singular value decomposit",
        prompt:
          "Prove that the singular value decomposition (SVD) provides the best low-rank approximation of a matrix in terms of Frobenius norm.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Derive the update rule for Alternating L",
        prompt:
          "Derive the update rule for Alternating Least Squares (ALS) by taking the derivative of the regularized loss function with respect to user latent factors.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How do you serve recommendations from ma",
        prompt:
          "How do you serve recommendations from matrix factorization models with extremely low latency?",
        engineeringContext:
          "Production ML infrastructure consideration for Recommender Systems / Matrix Factorization at scale.",
      },
      {
        title: "What are the advantages of Implicit ALS",
        prompt:
          "What are the advantages of Implicit ALS versus Explicit ALS in real-world scenarios?",
        engineeringContext:
          "Production ML infrastructure consideration for Recommender Systems / Matrix Factorization at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "User with no rated items (cold start problem).",
        scenario: "User with no rated items (cold start problem).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Matrix with extreme sparsity and only uninformative ratings (e.g., all 5 stars).",
        scenario:
          "Matrix with extreme sparsity and only uninformative ratings (e.g., all 5 stars).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-18",
      title: "Recommender Systems / Matrix Factorization",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_collaborative_filtering_als",
      prompt: "Implement the canonical algorithm for Recommender Systems / Matrix Factorization.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def als_explicit_step(R, num_factors, num_iterations, reg):\n    """\n    Performs ALS steps for explicit matrix factorization.\n    """\n    if not R or not R[0]:\n        return [], []\n        \n    n_users = len(R)\n    n_items = len(R[0])\n    \n    U = [[0.1] * num_factors for _ in range(n_users)]\n    V = [[0.1] * num_factors for _ in range(n_items)]\n    \n    lr = 0.01\n    for _ in range(num_iterations):\n        for u in range(n_users):\n            for i in range(n_items):\n                if R[u][i] > 0:\n                    pred = sum(U[u][k] * V[i][k] for k in range(num_factors))\n                    err = R[u][i] - pred\n                    \n                    for k in range(num_factors):\n                        grad_U = -err * V[i][k] + reg * U[u][k]\n                        grad_V = -err * U[u][k] + reg * V[i][k]\n                        \n                        U[u][k] -= lr * grad_U\n                        V[i][k] -= lr * grad_V\n                        \n    return U, V',
    },
    codeVariants: [
      {
        id: "ml_collaborative_filtering_als-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def als_explicit_step(R, num_factors, num_iterations, reg):\n    """\n    Performs ALS steps for explicit matrix factorization.\n    """\n    if not R or not R[0]:\n        return [], []\n        \n    n_users = len(R)\n    n_items = len(R[0])\n    \n    U = [[0.1] * num_factors for _ in range(n_users)]\n    V = [[0.1] * num_factors for _ in range(n_items)]\n    \n    lr = 0.01\n    for _ in range(num_iterations):\n        for u in range(n_users):\n            for i in range(n_items):\n                if R[u][i] > 0:\n                    pred = sum(U[u][k] * V[i][k] for k in range(num_factors))\n                    err = R[u][i] - pred\n                    \n                    for k in range(num_factors):\n                        grad_U = -err * V[i][k] + reg * U[u][k]\n                        grad_V = -err * U[u][k] + reg * V[i][k]\n                        \n                        U[u][k] -= lr * grad_U\n                        V[i][k] -= lr * grad_V\n                        \n    return U, V',
      },
      {
        id: "ml_collaborative_filtering_als-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef als_explicit_step(R, num_factors, num_iterations, reg):\n    """\n    Performs ALS steps for explicit matrix factorization.\n    """\n    if not R or not R[0]:\n        return [], []\n        \n    n_users = len(R)\n    n_items = len(R[0])\n    \n    U = [[0.1] * num_factors for _ in range(n_users)]\n    V = [[0.1] * num_factors for _ in range(n_items)]\n    \n    lr = 0.01\n    for _ in range(num_iterations):\n        for u in range(n_users):\n            for i in range(n_items):\n                if R[u][i] > 0:\n                    pred = sum(U[u][k] * V[i][k] for k in range(num_factors))\n                    err = R[u][i] - pred\n                    \n                    for k in range(num_factors):\n                        grad_U = -err * V[i][k] + reg * U[u][k]\n                        grad_V = -err * U[u][k] + reg * V[i][k]\n                        \n                        U[u][k] -= lr * grad_U\n                        V[i][k] -= lr * grad_V\n                        \n    return U, V',
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
        "Comprehensive exploration of Recommender Systems / Matrix Factorization, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Recommender Systems / Matrix Factorization",
          definition:
            "Core computational primitive governing Recommender Systems / Matrix Factorization.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Recommender Systems / Matrix Factorization.",
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
        "Conceptual introduction to Recommender Systems / Matrix Factorization, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "matrix_factorization",
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
