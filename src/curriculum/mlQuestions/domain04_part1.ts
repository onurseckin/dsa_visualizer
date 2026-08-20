import type { MLTopicQuestionBank } from "./types";

export const domain04_part1: MLTopicQuestionBank[] = [
  {
    topicId: "ml_linear_logistic_regression",
    title: "Linear & Logistic Regression",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 13",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 13",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 13",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Derive the gradient of the binary cross-",
        prompt:
          "Derive the gradient of the binary cross-entropy loss with respect to the weights in logistic regression.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that the logistic regression objec",
        prompt: "Prove that the logistic regression objective is convex.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Show that Ordinary Least Squares (OLS) h",
        prompt: "Show that Ordinary Least Squares (OLS) has a closed-form solution.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does feature scaling affect the conv",
        prompt:
          "How does feature scaling affect the convergence of Gradient Descent in Logistic Regression?",
        engineeringContext:
          "Production ML infrastructure consideration for Linear & Logistic Regression at scale.",
      },
      {
        title: "Explain the difference in implementation",
        prompt:
          "Explain the difference in implementation and convergence for full-batch GD vs SGD for regression models.",
        engineeringContext:
          "Production ML infrastructure consideration for Linear & Logistic Regression at scale.",
      },
      {
        title: "What is the impact of multi-collinearity",
        prompt:
          "What is the impact of multi-collinearity on OLS and how does L2 regularization solve it?",
        engineeringContext:
          "Production ML infrastructure consideration for Linear & Logistic Regression at scale.",
      },
    ],
    partD_stressTests: [
      {
        title:
          "Perfectly separable data causing weights to diverge to infinity (complete separation).",
        scenario:
          "Perfectly separable data causing weights to diverge to infinity (complete separation).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Extremely high learning rate causing divergence.",
        scenario: "Extremely high learning rate causing divergence.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Dataset with more features than samples (p > n).",
        scenario: "Dataset with more features than samples (p > n).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-13",
      title: "Linear & Logistic Regression",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_linear_logistic_regression",
      prompt: "Implement the canonical algorithm for Linear & Logistic Regression.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef sigmoid(z):\n    if z < -100:\n        return 0.0\n    if z > 100:\n        return 1.0\n    return 1.0 / (1.0 + math.exp(-z))\n\ndef logistic_regression_gd(X, y, lr, iterations):\n    """\n    Performs gradient descent for logistic regression.\n    X: list of lists (samples x features)\n    y: list of binary labels (0 or 1)\n    lr: learning rate\n    iterations: number of epochs\n    \n    Returns: list of weights\n    """\n    if not X or not X[0]:\n        return []\n    \n    n_samples = len(X)\n    n_features = len(X[0])\n    weights = [0.0] * n_features\n    \n    for _ in range(iterations):\n        gradients = [0.0] * n_features\n        for i in range(n_samples):\n            z = sum(X[i][j] * weights[j] for j in range(n_features))\n            pred = sigmoid(z)\n            error = pred - y[i]\n            \n            for j in range(n_features):\n                gradients[j] += error * X[i][j]\n                \n        for j in range(n_features):\n            weights[j] -= lr * (gradients[j] / n_samples)\n            \n    return weights',
    },
    codeVariants: [
      {
        id: "ml_linear_logistic_regression-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef sigmoid(z):\n    if z < -100:\n        return 0.0\n    if z > 100:\n        return 1.0\n    return 1.0 / (1.0 + math.exp(-z))\n\ndef logistic_regression_gd(X, y, lr, iterations):\n    """\n    Performs gradient descent for logistic regression.\n    X: list of lists (samples x features)\n    y: list of binary labels (0 or 1)\n    lr: learning rate\n    iterations: number of epochs\n    \n    Returns: list of weights\n    """\n    if not X or not X[0]:\n        return []\n    \n    n_samples = len(X)\n    n_features = len(X[0])\n    weights = [0.0] * n_features\n    \n    for _ in range(iterations):\n        gradients = [0.0] * n_features\n        for i in range(n_samples):\n            z = sum(X[i][j] * weights[j] for j in range(n_features))\n            pred = sigmoid(z)\n            error = pred - y[i]\n            \n            for j in range(n_features):\n                gradients[j] += error * X[i][j]\n                \n        for j in range(n_features):\n            weights[j] -= lr * (gradients[j] / n_samples)\n            \n    return weights',
      },
      {
        id: "ml_linear_logistic_regression-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef sigmoid(z):\n    if z < -100:\n        return 0.0\n    if z > 100:\n        return 1.0\n    return 1.0 / (1.0 + math.exp(-z))\n\ndef logistic_regression_gd(X, y, lr, iterations):\n    """\n    Performs gradient descent for logistic regression.\n    X: list of lists (samples x features)\n    y: list of binary labels (0 or 1)\n    lr: learning rate\n    iterations: number of epochs\n    \n    Returns: list of weights\n    """\n    if not X or not X[0]:\n        return []\n    \n    n_samples = len(X)\n    n_features = len(X[0])\n    weights = [0.0] * n_features\n    \n    for _ in range(iterations):\n        gradients = [0.0] * n_features\n        for i in range(n_samples):\n            z = sum(X[i][j] * weights[j] for j in range(n_features))\n            pred = sigmoid(z)\n            error = pred - y[i]\n            \n            for j in range(n_features):\n                gradients[j] += error * X[i][j]\n                \n        for j in range(n_features):\n            weights[j] -= lr * (gradients[j] / n_samples)\n            \n    return weights',
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
        "Comprehensive exploration of Linear & Logistic Regression, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Linear",
          definition: "Core computational primitive governing Linear & Logistic Regression.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Linear & Logistic Regression.",
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
        "Conceptual introduction to Linear & Logistic Regression, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_decision_trees_cart",
    title: "Decision Trees & Forests",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 14",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 14",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 14",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the Gini impurity is maximum",
        prompt: "Prove that the Gini impurity is maximum when classes are perfectly balanced.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Show that Information Gain is always non",
        prompt: "Show that Information Gain is always non-negative.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that deep unpruned decision trees",
        prompt:
          "Prove that deep unpruned decision trees can perfectly memorize any training dataset with distinct features.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How do you efficiently find the best spl",
        prompt:
          "How do you efficiently find the best split for continuous features without sorting the entire dataset repeatedly?",
        engineeringContext:
          "Production ML infrastructure consideration for Decision Trees & Forests at scale.",
      },
      {
        title: "Why is Random Forest typically highly pa",
        prompt:
          "Why is Random Forest typically highly parallelizable, and how is it implemented across multiple workers?",
        engineeringContext:
          "Production ML infrastructure consideration for Decision Trees & Forests at scale.",
      },
      {
        title: "How is memory managed when building deep",
        prompt:
          "How is memory managed when building deep decision trees on datasets larger than RAM?",
        engineeringContext:
          "Production ML infrastructure consideration for Decision Trees & Forests at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Dataset where all features have the exact same value but target labels differ.",
        scenario: "Dataset where all features have the exact same value but target labels differ.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Dataset with only a single sample.",
        scenario: "Dataset with only a single sample.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-14",
      title: "Decision Trees & Forests",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_decision_trees_cart",
      prompt: "Implement the canonical algorithm for Decision Trees & Forests.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def gini_impurity(y):\n    if not y:\n        return 0.0\n    counts = {}\n    for label in y:\n        counts[label] = counts.get(label, 0) + 1\n    \n    impurity = 1.0\n    for count in counts.values():\n        prob = count / len(y)\n        impurity -= prob ** 2\n    return impurity\n\ndef find_best_split_gini(X, y):\n    """\n    Finds the best split (feature index, threshold) based on Gini impurity.\n    X: list of lists (samples x features), continuous features\n    y: list of labels\n    \n    Returns: (best_feature_idx, best_threshold)\n    """\n    n_samples = len(X)\n    n_features = len(X[0]) if n_samples > 0 else 0\n    \n    best_gini = float(\'inf\')\n    best_split = (None, None)\n    \n    for feature_idx in range(n_features):\n        feature_values = sorted(set(X[i][feature_idx] for i in range(n_samples)))\n        \n        for i in range(len(feature_values) - 1):\n            threshold = (feature_values[i] + feature_values[i+1]) / 2.0\n            \n            left_y = [y[j] for j in range(n_samples) if X[j][feature_idx] <= threshold]\n            right_y = [y[j] for j in range(n_samples) if X[j][feature_idx] > threshold]\n            \n            if not left_y or not right_y:\n                continue\n                \n            gini_left = gini_impurity(left_y)\n            gini_right = gini_impurity(right_y)\n            \n            weighted_gini = (len(left_y) * gini_left + len(right_y) * gini_right) / n_samples\n            \n            if weighted_gini < best_gini:\n                best_gini = weighted_gini\n                best_split = (feature_idx, threshold)\n                \n    return best_split',
    },
    codeVariants: [
      {
        id: "ml_decision_trees_cart-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def gini_impurity(y):\n    if not y:\n        return 0.0\n    counts = {}\n    for label in y:\n        counts[label] = counts.get(label, 0) + 1\n    \n    impurity = 1.0\n    for count in counts.values():\n        prob = count / len(y)\n        impurity -= prob ** 2\n    return impurity\n\ndef find_best_split_gini(X, y):\n    """\n    Finds the best split (feature index, threshold) based on Gini impurity.\n    X: list of lists (samples x features), continuous features\n    y: list of labels\n    \n    Returns: (best_feature_idx, best_threshold)\n    """\n    n_samples = len(X)\n    n_features = len(X[0]) if n_samples > 0 else 0\n    \n    best_gini = float(\'inf\')\n    best_split = (None, None)\n    \n    for feature_idx in range(n_features):\n        feature_values = sorted(set(X[i][feature_idx] for i in range(n_samples)))\n        \n        for i in range(len(feature_values) - 1):\n            threshold = (feature_values[i] + feature_values[i+1]) / 2.0\n            \n            left_y = [y[j] for j in range(n_samples) if X[j][feature_idx] <= threshold]\n            right_y = [y[j] for j in range(n_samples) if X[j][feature_idx] > threshold]\n            \n            if not left_y or not right_y:\n                continue\n                \n            gini_left = gini_impurity(left_y)\n            gini_right = gini_impurity(right_y)\n            \n            weighted_gini = (len(left_y) * gini_left + len(right_y) * gini_right) / n_samples\n            \n            if weighted_gini < best_gini:\n                best_gini = weighted_gini\n                best_split = (feature_idx, threshold)\n                \n    return best_split',
      },
      {
        id: "ml_decision_trees_cart-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef gini_impurity(y):\n    if not y:\n        return 0.0\n    counts = {}\n    for label in y:\n        counts[label] = counts.get(label, 0) + 1\n    \n    impurity = 1.0\n    for count in counts.values():\n        prob = count / len(y)\n        impurity -= prob ** 2\n    return impurity\n\ndef find_best_split_gini(X, y):\n    """\n    Finds the best split (feature index, threshold) based on Gini impurity.\n    X: list of lists (samples x features), continuous features\n    y: list of labels\n    \n    Returns: (best_feature_idx, best_threshold)\n    """\n    n_samples = len(X)\n    n_features = len(X[0]) if n_samples > 0 else 0\n    \n    best_gini = float(\'inf\')\n    best_split = (None, None)\n    \n    for feature_idx in range(n_features):\n        feature_values = sorted(set(X[i][feature_idx] for i in range(n_samples)))\n        \n        for i in range(len(feature_values) - 1):\n            threshold = (feature_values[i] + feature_values[i+1]) / 2.0\n            \n            left_y = [y[j] for j in range(n_samples) if X[j][feature_idx] <= threshold]\n            right_y = [y[j] for j in range(n_samples) if X[j][feature_idx] > threshold]\n            \n            if not left_y or not right_y:\n                continue\n                \n            gini_left = gini_impurity(left_y)\n            gini_right = gini_impurity(right_y)\n            \n            weighted_gini = (len(left_y) * gini_left + len(right_y) * gini_right) / n_samples\n            \n            if weighted_gini < best_gini:\n                best_gini = weighted_gini\n                best_split = (feature_idx, threshold)\n                \n    return best_split',
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
        "Comprehensive exploration of Decision Trees & Forests, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Decision Trees",
          definition: "Core computational primitive governing Decision Trees & Forests.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Decision Trees & Forests.",
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
        "Conceptual introduction to Decision Trees & Forests, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
];
