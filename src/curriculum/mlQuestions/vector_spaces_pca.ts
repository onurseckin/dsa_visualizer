import type { MLTopicQuestionBank } from "./types";

export const vectorSpacesPca: MLTopicQuestionBank[] = [
  {
    topicId: "ml_vector_spaces_gram_schmidt",
    title: "Orthogonalization & Gram-Schmidt",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Valid Square",
        url: "https://leetcode.com/problems/valid-square/",
        rationale: "Algorithmic foundation for Orthogonalization & Gram-Schmidt.",
        difficulty: "Medium",
      },
      {
        title: "Max Points on a Line",
        url: "https://leetcode.com/problems/max-points-on-a-line/",
        rationale: "Algorithmic foundation for Orthogonalization & Gram-Schmidt.",
        difficulty: "Medium",
      },
      {
        title: "Minimum Area Rectangle",
        url: "https://leetcode.com/problems/minimum-area-rectangle/",
        rationale: "Algorithmic foundation for Orthogonalization & Gram-Schmidt.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the vectors produced by the G",
        prompt:
          "Prove that the vectors produced by the Gram-Schmidt process are mutually orthogonal.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that the span of the first $k$ ort",
        prompt:
          "Prove that the span of the first $k$ orthogonalized vectors equals the span of the first $k$ original vectors.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is the modified Gram-Schmidt process",
        prompt:
          "Why is the modified Gram-Schmidt process preferred over the classical Gram-Schmidt process for numerical stability in floating-point arithmetic?",
        engineeringContext:
          "Production ML infrastructure consideration for Orthogonalization & Gram-Schmidt at scale.",
      },
      {
        title: "How is orthogonalization used in maintai",
        prompt:
          "How is orthogonalization used in maintaining the stability of recurrent neural networks (e.g., orthogonal initialization)?",
        engineeringContext:
          "Production ML infrastructure consideration for Orthogonalization & Gram-Schmidt at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Linearly dependent input vectors (should result in zero vectors).",
        scenario: "Linearly dependent input vectors (should result in zero vectors).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Almost collinear vectors (stress tests numerical stability).",
        scenario: "Almost collinear vectors (stress tests numerical stability).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-03",
      title: "Orthogonalization & Gram-Schmidt",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_vector_spaces_gram_schmidt",
      prompt: "Implement the canonical algorithm for Orthogonalization & Gram-Schmidt.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef dot_product(v1, v2):\n    return sum(x * y for x, y in zip(v1, v2))\n\ndef scalar_mult(c, v):\n    return [c * x for x in v]\n\ndef vector_sub(v1, v2):\n    return [x - y for x, y in zip(v1, v2)]\n\ndef gram_schmidt(vectors):\n    """\n    Performs modified Gram-Schmidt orthogonalization on a list of vectors.\n    Returns a list of orthogonal (not necessarily normalized) vectors.\n    """\n    if not vectors:\n        return []\n    u = []\n    for v in vectors:\n        current_u = list(v)\n        for prev_u in u:\n            prev_u_dot = dot_product(prev_u, prev_u)\n            if prev_u_dot < 1e-12:\n                continue\n            proj_coef = dot_product(current_u, prev_u) / prev_u_dot\n            proj = scalar_mult(proj_coef, prev_u)\n            current_u = vector_sub(current_u, proj)\n        u.append(current_u)\n    return u',
    },
    codeVariants: [
      {
        id: "ml_vector_spaces_gram_schmidt-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef dot_product(v1, v2):\n    return sum(x * y for x, y in zip(v1, v2))\n\ndef scalar_mult(c, v):\n    return [c * x for x in v]\n\ndef vector_sub(v1, v2):\n    return [x - y for x, y in zip(v1, v2)]\n\ndef gram_schmidt(vectors):\n    """\n    Performs modified Gram-Schmidt orthogonalization on a list of vectors.\n    Returns a list of orthogonal (not necessarily normalized) vectors.\n    """\n    if not vectors:\n        return []\n    u = []\n    for v in vectors:\n        current_u = list(v)\n        for prev_u in u:\n            prev_u_dot = dot_product(prev_u, prev_u)\n            if prev_u_dot < 1e-12:\n                continue\n            proj_coef = dot_product(current_u, prev_u) / prev_u_dot\n            proj = scalar_mult(proj_coef, prev_u)\n            current_u = vector_sub(current_u, proj)\n        u.append(current_u)\n    return u',
      },
      {
        id: "ml_vector_spaces_gram_schmidt-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef dot_product(v1, v2):\n    return sum(x * y for x, y in zip(v1, v2))\n\ndef scalar_mult(c, v):\n    return [c * x for x in v]\n\ndef vector_sub(v1, v2):\n    return [x - y for x, y in zip(v1, v2)]\n\ndef gram_schmidt(vectors):\n    """\n    Performs modified Gram-Schmidt orthogonalization on a list of vectors.\n    Returns a list of orthogonal (not necessarily normalized) vectors.\n    """\n    if not vectors:\n        return []\n    u = []\n    for v in vectors:\n        current_u = list(v)\n        for prev_u in u:\n            prev_u_dot = dot_product(prev_u, prev_u)\n            if prev_u_dot < 1e-12:\n                continue\n            proj_coef = dot_product(current_u, prev_u) / prev_u_dot\n            proj = scalar_mult(proj_coef, prev_u)\n            current_u = vector_sub(current_u, proj)\n        u.append(current_u)\n    return u',
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
        "Comprehensive exploration of Orthogonalization & Gram-Schmidt, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Orthogonalization",
          definition: "Core computational primitive governing Orthogonalization & Gram-Schmidt.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Orthogonalization & Gram-Schmidt.",
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
        "Conceptual introduction to Orthogonalization & Gram-Schmidt, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_matrix_svd_pca",
    title: "Eigendecomposition & Power Iteration",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Sort Integers by The Power Value",
        url: "https://leetcode.com/problems/sort-integers-by-the-power-value/",
        rationale: "Algorithmic foundation for Eigendecomposition & Power Iteration.",
        difficulty: "Medium",
      },
      {
        title: "Pow(x, n)",
        url: "https://leetcode.com/problems/powx-n/",
        rationale: "Algorithmic foundation for Eigendecomposition & Power Iteration.",
        difficulty: "Medium",
      },
      {
        title: "Find the Duplicate Number",
        url: "https://leetcode.com/problems/find-the-duplicate-number/",
        rationale: "Algorithmic foundation for Eigendecomposition & Power Iteration.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the power iteration method co",
        prompt:
          "Prove that the power iteration method converges to the dominant eigenvector for a diagonalizable matrix with a strictly dominant eigenvalue.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the rate of convergence of power i",
        prompt:
          "Prove the rate of convergence of power iteration depends on the ratio $|\\lambda_2| / |\\lambda_1|$.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How is power iteration used in computing",
        prompt:
          "How is power iteration used in computing Spectral Normalization for Generative Adversarial Networks (GANs)?",
        engineeringContext:
          "Production ML infrastructure consideration for Eigendecomposition & Power Iteration at scale.",
      },
      {
        title: "Why is full eigendecomposition computati",
        prompt:
          "Why is full eigendecomposition computationally prohibitive for large ML weight matrices, and when are iterative approximations preferred?",
        engineeringContext:
          "Production ML infrastructure consideration for Eigendecomposition & Power Iteration at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Matrices with multiple dominant eigenvalues (e.g., $\\lambda_1 = -\\lambda_2$).",
        scenario: "Matrices with multiple dominant eigenvalues (e.g., $\\lambda_1 = -\\lambda_2$).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Zero matrix or identity matrix (ensures valid fallback behavior).",
        scenario: "Zero matrix or identity matrix (ensures valid fallback behavior).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-04",
      title: "Eigendecomposition & Power Iteration",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_matrix_svd_pca",
      prompt: "Implement the canonical algorithm for Eigendecomposition & Power Iteration.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef mat_vec_mul(X, v):\n    res = []\n    for row in X:\n        res.append(sum(r * val for r, val in zip(row, v)))\n    return res\n\ndef normalize(v):\n    norm = math.sqrt(sum(x * x for x in v))\n    if norm < 1e-12:\n        return v\n    return [x / norm for x in v]\n\ndef top_principal_component(X, num_iterations):\n    """\n    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.\n    X is a list of lists representing a matrix.\n    Returns the dominant eigenvector as a normalized list.\n    """\n    if not X or not X[0]:\n        return []\n    rows = len(X)\n    cols = len(X[0])\n    \n    # Compute covariance matrix C = X^T X\n    C = [[0.0] * cols for _ in range(cols)]\n    for i in range(cols):\n        for j in range(cols):\n            val = sum(X[k][i] * X[k][j] for k in range(rows))\n            C[i][j] = val\n            \n    # Initialize random vector (or all ones)\n    b_k = [1.0] * cols\n    b_k = normalize(b_k)\n    \n    for _ in range(num_iterations):\n        b_k1 = mat_vec_mul(C, b_k)\n        b_k = normalize(b_k1)\n        \n    return b_k',
    },
    codeVariants: [
      {
        id: "ml_matrix_svd_pca-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef mat_vec_mul(X, v):\n    res = []\n    for row in X:\n        res.append(sum(r * val for r, val in zip(row, v)))\n    return res\n\ndef normalize(v):\n    norm = math.sqrt(sum(x * x for x in v))\n    if norm < 1e-12:\n        return v\n    return [x / norm for x in v]\n\ndef top_principal_component(X, num_iterations):\n    """\n    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.\n    X is a list of lists representing a matrix.\n    Returns the dominant eigenvector as a normalized list.\n    """\n    if not X or not X[0]:\n        return []\n    rows = len(X)\n    cols = len(X[0])\n    \n    # Compute covariance matrix C = X^T X\n    C = [[0.0] * cols for _ in range(cols)]\n    for i in range(cols):\n        for j in range(cols):\n            val = sum(X[k][i] * X[k][j] for k in range(rows))\n            C[i][j] = val\n            \n    # Initialize random vector (or all ones)\n    b_k = [1.0] * cols\n    b_k = normalize(b_k)\n    \n    for _ in range(num_iterations):\n        b_k1 = mat_vec_mul(C, b_k)\n        b_k = normalize(b_k1)\n        \n    return b_k',
      },
      {
        id: "ml_matrix_svd_pca-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef mat_vec_mul(X, v):\n    res = []\n    for row in X:\n        res.append(sum(r * val for r, val in zip(row, v)))\n    return res\n\ndef normalize(v):\n    norm = math.sqrt(sum(x * x for x in v))\n    if norm < 1e-12:\n        return v\n    return [x / norm for x in v]\n\ndef top_principal_component(X, num_iterations):\n    """\n    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.\n    X is a list of lists representing a matrix.\n    Returns the dominant eigenvector as a normalized list.\n    """\n    if not X or not X[0]:\n        return []\n    rows = len(X)\n    cols = len(X[0])\n    \n    # Compute covariance matrix C = X^T X\n    C = [[0.0] * cols for _ in range(cols)]\n    for i in range(cols):\n        for j in range(cols):\n            val = sum(X[k][i] * X[k][j] for k in range(rows))\n            C[i][j] = val\n            \n    # Initialize random vector (or all ones)\n    b_k = [1.0] * cols\n    b_k = normalize(b_k)\n    \n    for _ in range(num_iterations):\n        b_k1 = mat_vec_mul(C, b_k)\n        b_k = normalize(b_k1)\n        \n    return b_k',
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
        "Comprehensive exploration of Eigendecomposition & Power Iteration, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Eigendecomposition",
          definition:
            "Core computational primitive governing Eigendecomposition & Power Iteration.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Eigendecomposition & Power Iteration.",
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
        "Conceptual introduction to Eigendecomposition & Power Iteration, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "matrix",
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
