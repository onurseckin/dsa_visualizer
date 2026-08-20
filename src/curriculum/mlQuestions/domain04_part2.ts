import type { MLTopicQuestionBank } from "./types";

export const domain04_part2: MLTopicQuestionBank[] = [
  {
    topicId: "ml_ensemble_xgboost",
    title: "Gradient Boosting",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 15",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 15",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 15",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Derive the optimal leaf weight formula i",
        prompt:
          "Derive the optimal leaf weight formula in XGBoost using the second-order Taylor expansion of the loss function.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the split gain formula for a given",
        prompt:
          "Prove the split gain formula for a given node in XGBoost based on gradients and hessians.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does XGBoost handle missing values d",
        prompt: "How does XGBoost handle missing values during training?",
        engineeringContext:
          "Production ML infrastructure consideration for Gradient Boosting at scale.",
      },
      {
        title: "What is histogram-based splitting in Lig",
        prompt: "What is histogram-based splitting in LightGBM and how does it speed up training?",
        engineeringContext:
          "Production ML infrastructure consideration for Gradient Boosting at scale.",
      },
      {
        title: "Discuss the differences between level-wi",
        prompt:
          "Discuss the differences between level-wise (XGBoost) and leaf-wise (LightGBM) tree growth.",
        engineeringContext:
          "Production ML infrastructure consideration for Gradient Boosting at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Sum of hessians in a node is less than min_child_weight.",
        scenario: "Sum of hessians in a node is less than min_child_weight.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Large regularization parameter lambda causing splits to yield negative gain.",
        scenario: "Large regularization parameter lambda causing splits to yield negative gain.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-15",
      title: "Gradient Boosting",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_ensemble_xgboost",
      prompt: "Implement the canonical algorithm for Gradient Boosting.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def xgboost_exact_split_gain(g, h, l2_reg, min_child_weight):\n    """\n    Calculates the maximum split gain for a set of gradients and hessians.\n    """\n    n = len(g)\n    G = sum(g)\n    H = sum(h)\n    \n    if H < 2 * min_child_weight:\n        return 0.0\n        \n    best_gain = 0.0\n    G_left = 0.0\n    H_left = 0.0\n    \n    for i in range(n - 1):\n        G_left += g[i]\n        H_left += h[i]\n        \n        G_right = G - G_left\n        H_right = H - H_left\n        \n        if H_left < min_child_weight or H_right < min_child_weight:\n            continue\n            \n        gain = (G_left**2 / (H_left + l2_reg)) + (G_right**2 / (H_right + l2_reg)) - (G**2 / (H + l2_reg))\n        gain = 0.5 * gain\n        \n        if gain > best_gain:\n            best_gain = gain\n            \n    return best_gain',
    },
    codeVariants: [
      {
        id: "ml_ensemble_xgboost-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def xgboost_exact_split_gain(g, h, l2_reg, min_child_weight):\n    """\n    Calculates the maximum split gain for a set of gradients and hessians.\n    """\n    n = len(g)\n    G = sum(g)\n    H = sum(h)\n    \n    if H < 2 * min_child_weight:\n        return 0.0\n        \n    best_gain = 0.0\n    G_left = 0.0\n    H_left = 0.0\n    \n    for i in range(n - 1):\n        G_left += g[i]\n        H_left += h[i]\n        \n        G_right = G - G_left\n        H_right = H - H_left\n        \n        if H_left < min_child_weight or H_right < min_child_weight:\n            continue\n            \n        gain = (G_left**2 / (H_left + l2_reg)) + (G_right**2 / (H_right + l2_reg)) - (G**2 / (H + l2_reg))\n        gain = 0.5 * gain\n        \n        if gain > best_gain:\n            best_gain = gain\n            \n    return best_gain',
      },
      {
        id: "ml_ensemble_xgboost-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef xgboost_exact_split_gain(g, h, l2_reg, min_child_weight):\n    """\n    Calculates the maximum split gain for a set of gradients and hessians.\n    """\n    n = len(g)\n    G = sum(g)\n    H = sum(h)\n    \n    if H < 2 * min_child_weight:\n        return 0.0\n        \n    best_gain = 0.0\n    G_left = 0.0\n    H_left = 0.0\n    \n    for i in range(n - 1):\n        G_left += g[i]\n        H_left += h[i]\n        \n        G_right = G - G_left\n        H_right = H - H_left\n        \n        if H_left < min_child_weight or H_right < min_child_weight:\n            continue\n            \n        gain = (G_left**2 / (H_left + l2_reg)) + (G_right**2 / (H_right + l2_reg)) - (G**2 / (H + l2_reg))\n        gain = 0.5 * gain\n        \n        if gain > best_gain:\n            best_gain = gain\n            \n    return best_gain',
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
        "Comprehensive exploration of Gradient Boosting, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Gradient Boosting",
          definition: "Core computational primitive governing Gradient Boosting.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Gradient Boosting.",
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
        "Conceptual introduction to Gradient Boosting, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_clustering_kmeans_dbscan",
    title: "K-Means & Clustering",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 16",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 16",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 16",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that Lloyd's algorithm for K-Means",
        prompt:
          "Prove that Lloyd's algorithm for K-Means monotonically decreases the within-cluster sum of squares (WCSS).",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the bound for the approximation ra",
        prompt: "Prove the bound for the approximation ratio of K-Means++ initialization.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How do you scale K-Means for datasets th",
        prompt:
          "How do you scale K-Means for datasets that do not fit in memory? (Mini-batch K-Means)",
        engineeringContext:
          "Production ML infrastructure consideration for K-Means & Clustering at scale.",
      },
      {
        title: "What are the advantages of using KD-Tree",
        prompt:
          "What are the advantages of using KD-Trees or Ball Trees for finding the nearest centroid?",
        engineeringContext:
          "Production ML infrastructure consideration for K-Means & Clustering at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "k is greater than the number of unique points in the dataset.",
        scenario: "k is greater than the number of unique points in the dataset.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Points perfectly equidistant from multiple centroids.",
        scenario: "Points perfectly equidistant from multiple centroids.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-16",
      title: "K-Means & Clustering",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_clustering_kmeans_dbscan",
      prompt: "Implement the canonical algorithm for K-Means & Clustering.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import random\n\ndef euclidean_dist_sq(p1, p2):\n    return sum((x - y) ** 2 for x, y in zip(p1, p2))\n\ndef kmeans_pp_init(X, k):\n    """\n    Initializes k centroids using the K-Means++ algorithm.\n    """\n    if not X or k <= 0:\n        return []\n    \n    n_samples = len(X)\n    k = min(k, n_samples)\n    \n    centroids = [X[0]]  # Deterministic for testability, though usually random\n    \n    for _ in range(1, k):\n        distances = []\n        for point in X:\n            min_dist_sq = min(euclidean_dist_sq(point, c) for c in centroids)\n            distances.append(min_dist_sq)\n            \n        total_dist = sum(distances)\n        \n        if total_dist == 0:\n            remaining = [p for p in X if p not in centroids]\n            if remaining:\n                centroids.append(remaining[0])\n            else:\n                break\n            continue\n            \n        r = random.uniform(0, total_dist)\n        cumulative = 0.0\n        for i, point in enumerate(X):\n            cumulative += distances[i]\n            if cumulative >= r:\n                centroids.append(point)\n                break\n                \n    return centroids',
    },
    codeVariants: [
      {
        id: "ml_clustering_kmeans_dbscan-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import random\n\ndef euclidean_dist_sq(p1, p2):\n    return sum((x - y) ** 2 for x, y in zip(p1, p2))\n\ndef kmeans_pp_init(X, k):\n    """\n    Initializes k centroids using the K-Means++ algorithm.\n    """\n    if not X or k <= 0:\n        return []\n    \n    n_samples = len(X)\n    k = min(k, n_samples)\n    \n    centroids = [X[0]]  # Deterministic for testability, though usually random\n    \n    for _ in range(1, k):\n        distances = []\n        for point in X:\n            min_dist_sq = min(euclidean_dist_sq(point, c) for c in centroids)\n            distances.append(min_dist_sq)\n            \n        total_dist = sum(distances)\n        \n        if total_dist == 0:\n            remaining = [p for p in X if p not in centroids]\n            if remaining:\n                centroids.append(remaining[0])\n            else:\n                break\n            continue\n            \n        r = random.uniform(0, total_dist)\n        cumulative = 0.0\n        for i, point in enumerate(X):\n            cumulative += distances[i]\n            if cumulative >= r:\n                centroids.append(point)\n                break\n                \n    return centroids',
      },
      {
        id: "ml_clustering_kmeans_dbscan-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport random\n\ndef euclidean_dist_sq(p1, p2):\n    return sum((x - y) ** 2 for x, y in zip(p1, p2))\n\ndef kmeans_pp_init(X, k):\n    """\n    Initializes k centroids using the K-Means++ algorithm.\n    """\n    if not X or k <= 0:\n        return []\n    \n    n_samples = len(X)\n    k = min(k, n_samples)\n    \n    centroids = [X[0]]  # Deterministic for testability, though usually random\n    \n    for _ in range(1, k):\n        distances = []\n        for point in X:\n            min_dist_sq = min(euclidean_dist_sq(point, c) for c in centroids)\n            distances.append(min_dist_sq)\n            \n        total_dist = sum(distances)\n        \n        if total_dist == 0:\n            remaining = [p for p in X if p not in centroids]\n            if remaining:\n                centroids.append(remaining[0])\n            else:\n                break\n            continue\n            \n        r = random.uniform(0, total_dist)\n        cumulative = 0.0\n        for i, point in enumerate(X):\n            cumulative += distances[i]\n            if cumulative >= r:\n                centroids.append(point)\n                break\n                \n    return centroids',
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
        "Comprehensive exploration of K-Means & Clustering, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "K-Means",
          definition: "Core computational primitive governing K-Means & Clustering.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning K-Means & Clustering.",
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
        "Conceptual introduction to K-Means & Clustering, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "scatter_clustering",
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
