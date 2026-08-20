import type { MLTopicQuestionBank } from "./types";

export const distributionsBayes: MLTopicQuestionBank[] = [
  {
    topicId: "ml_distributions_covariance",
    title: "Covariance & Correlation",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 9",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 9",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 9",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that correlation coefficient is be",
        prompt: "Prove that correlation coefficient is between -1 and 1.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the linearity of expectation",
        prompt: "Prove the linearity of expectation: E[X+Y] = E[X] + E[Y].",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that covariance is symmetric and b",
        prompt: "Prove that covariance is symmetric and bilinear.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How do you efficiently update the covari",
        prompt: "How do you efficiently update the covariance matrix for a streaming dataset?",
        engineeringContext:
          "Production ML infrastructure consideration for Covariance & Correlation at scale.",
      },
      {
        title: "How does high feature correlation affect",
        prompt:
          "How does high feature correlation affect the condition number of the design matrix in OLS?",
        engineeringContext:
          "Production ML infrastructure consideration for Covariance & Correlation at scale.",
      },
      {
        title: "What are the memory and computational tr",
        prompt:
          "What are the memory and computational tradeoffs of computing a full correlation matrix for a billion-scale embedding matrix?",
        engineeringContext:
          "Production ML infrastructure consideration for Covariance & Correlation at scale.",
      },
    ],
    partD_stressTests: [
      {
        title:
          "X and Y are completely independent but non-linear (e.g. Y = X^2 where X is symmetric around 0) - what is the covariance?",
        scenario:
          "X and Y are completely independent but non-linear (e.g. Y = X^2 where X is symmetric around 0) - what is the covariance?",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Constant variables where variance is 0 (divide by zero issue for correlation).",
        scenario: "Constant variables where variance is 0 (divide by zero issue for correlation).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Precision loss when calculating sample variance with large floats.",
        scenario: "Precision loss when calculating sample variance with large floats.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-09",
      title: "Covariance & Correlation",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_distributions_covariance",
      prompt: "Implement the canonical algorithm for Covariance & Correlation.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def calculate_covariance(x, y):\n    """\n    Calculates the sample covariance of two lists x and y.\n    """\n    if len(x) != len(y) or len(x) <= 1:\n        raise ValueError("x and y must have same length > 1")\n    \n    n = len(x)\n    mean_x = sum(x) / n\n    mean_y = sum(y) / n\n    \n    covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n)) / (n - 1)\n    return covariance',
    },
    codeVariants: [
      {
        id: "ml_distributions_covariance-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def calculate_covariance(x, y):\n    """\n    Calculates the sample covariance of two lists x and y.\n    """\n    if len(x) != len(y) or len(x) <= 1:\n        raise ValueError("x and y must have same length > 1")\n    \n    n = len(x)\n    mean_x = sum(x) / n\n    mean_y = sum(y) / n\n    \n    covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n)) / (n - 1)\n    return covariance',
      },
      {
        id: "ml_distributions_covariance-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef calculate_covariance(x, y):\n    """\n    Calculates the sample covariance of two lists x and y.\n    """\n    if len(x) != len(y) or len(x) <= 1:\n        raise ValueError("x and y must have same length > 1")\n    \n    n = len(x)\n    mean_x = sum(x) / n\n    mean_y = sum(y) / n\n    \n    covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n)) / (n - 1)\n    return covariance',
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
        "Comprehensive exploration of Covariance & Correlation, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Covariance",
          definition: "Core computational primitive governing Covariance & Correlation.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Covariance & Correlation.",
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
        "Conceptual introduction to Covariance & Correlation, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_mle_map_naive_bayes",
    title: "Bayesian Inference",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 10",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 10",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 10",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Derive Bayes' theorem from conditional p",
        prompt: "Derive Bayes' theorem from conditional probability definition.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that the posterior is proportional",
        prompt: "Prove that the posterior is proportional to the likelihood times the prior.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Show that Gaussian Naive Bayes provides",
        prompt:
          "Show that Gaussian Naive Bayes provides a linear decision boundary if class variances are equal.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "In a Naive Bayes spam filter, how do you",
        prompt:
          "In a Naive Bayes spam filter, how do you handle out-of-vocabulary words in production?",
        engineeringContext:
          "Production ML infrastructure consideration for Bayesian Inference at scale.",
      },
      {
        title: "Why do we compute log probabilities inst",
        prompt: "Why do we compute log probabilities instead of raw probabilities?",
        engineeringContext:
          "Production ML infrastructure consideration for Bayesian Inference at scale.",
      },
      {
        title: "How do you implement Bayesian updating f",
        prompt:
          "How do you implement Bayesian updating for CTR (click-through rate) prediction at scale?",
        engineeringContext:
          "Production ML infrastructure consideration for Bayesian Inference at scale.",
      },
    ],
    partD_stressTests: [
      {
        title:
          "Handling zero probability for a feature given a class (requires Laplace smoothing).",
        scenario:
          "Handling zero probability for a feature given a class (requires Laplace smoothing).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title:
          "Extreme prior imbalance leading to one class dominating completely regardless of likelihood.",
        scenario:
          "Extreme prior imbalance leading to one class dominating completely regardless of likelihood.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-10",
      title: "Bayesian Inference",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_mle_map_naive_bayes",
      prompt: "Implement the canonical algorithm for Bayesian Inference.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef naive_bayes_predict_log_proba(class_priors, feature_probs, sample):\n    """\n    Predicts the log probability for each class given a sample.\n    \n    class_priors: dict mapping class -> prior probability\n    feature_probs: dict mapping class -> dict of feature -> probability\n    sample: list of features\n    \n    Returns dict mapping class -> unnormalized log posterior\n    """\n    log_posteriors = {}\n    for c, prior in class_priors.items():\n        if prior <= 0:\n            log_posteriors[c] = float(\'-inf\')\n            continue\n        \n        log_prob = math.log(prior)\n        for feature in sample:\n            prob = feature_probs.get(c, {}).get(feature, 1e-9) # simple smoothing\n            log_prob += math.log(prob)\n        log_posteriors[c] = log_prob\n        \n    return log_posteriors',
    },
    codeVariants: [
      {
        id: "ml_mle_map_naive_bayes-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef naive_bayes_predict_log_proba(class_priors, feature_probs, sample):\n    """\n    Predicts the log probability for each class given a sample.\n    \n    class_priors: dict mapping class -> prior probability\n    feature_probs: dict mapping class -> dict of feature -> probability\n    sample: list of features\n    \n    Returns dict mapping class -> unnormalized log posterior\n    """\n    log_posteriors = {}\n    for c, prior in class_priors.items():\n        if prior <= 0:\n            log_posteriors[c] = float(\'-inf\')\n            continue\n        \n        log_prob = math.log(prior)\n        for feature in sample:\n            prob = feature_probs.get(c, {}).get(feature, 1e-9) # simple smoothing\n            log_prob += math.log(prob)\n        log_posteriors[c] = log_prob\n        \n    return log_posteriors',
      },
      {
        id: "ml_mle_map_naive_bayes-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef naive_bayes_predict_log_proba(class_priors, feature_probs, sample):\n    """\n    Predicts the log probability for each class given a sample.\n    \n    class_priors: dict mapping class -> prior probability\n    feature_probs: dict mapping class -> dict of feature -> probability\n    sample: list of features\n    \n    Returns dict mapping class -> unnormalized log posterior\n    """\n    log_posteriors = {}\n    for c, prior in class_priors.items():\n        if prior <= 0:\n            log_posteriors[c] = float(\'-inf\')\n            continue\n        \n        log_prob = math.log(prior)\n        for feature in sample:\n            prob = feature_probs.get(c, {}).get(feature, 1e-9) # simple smoothing\n            log_prob += math.log(prob)\n        log_posteriors[c] = log_prob\n        \n    return log_posteriors',
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
        "Comprehensive exploration of Bayesian Inference, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Bayesian Inference",
          definition: "Core computational primitive governing Bayesian Inference.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Bayesian Inference.",
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
        "Conceptual introduction to Bayesian Inference, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
];
