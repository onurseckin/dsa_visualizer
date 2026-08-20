import { MLTopicQuestionBank } from "./types";

export const domain03to04: MLTopicQuestionBank[] = [
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
  {
    topicId: "ml_hypothesis_testing_bootstrap",
    title: "Sampling & Bootstrap",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 11",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 11",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 11",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the probability of a specific",
        prompt:
          "Prove that the probability of a specific item NOT being chosen in a bootstrap sample of size N approaches 1/e as N goes to infinity.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the unbiasedness of reservoir samp",
        prompt: "Prove the unbiasedness of reservoir sampling.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How do you implement distributed reservo",
        prompt: "How do you implement distributed reservoir sampling across multiple nodes?",
        engineeringContext:
          "Production ML infrastructure consideration for Sampling & Bootstrap at scale.",
      },
      {
        title: "In random forest training, how does boot",
        prompt: "In random forest training, how does bootstrapping help reduce model variance?",
        engineeringContext:
          "Production ML infrastructure consideration for Sampling & Bootstrap at scale.",
      },
      {
        title: "How do you ensure reproducibility when u",
        prompt:
          "How do you ensure reproducibility when using stochastic sampling methods in production ML pipelines?",
        engineeringContext:
          "Production ML infrastructure consideration for Sampling & Bootstrap at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Bootstrapping a dataset with highly imbalanced classes without stratification.",
        scenario: "Bootstrapping a dataset with highly imbalanced classes without stratification.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Confidence interval calculation when the metric has extremely high variance.",
        scenario: "Confidence interval calculation when the metric has extremely high variance.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-11",
      title: "Sampling & Bootstrap",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_hypothesis_testing_bootstrap",
      prompt: "Implement the canonical algorithm for Sampling & Bootstrap.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import random\n\ndef bootstrap_confidence_interval(data, num_bootstraps, confidence_level):\n    """\n    Calculates the bootstrap confidence interval for the mean.\n    """\n    if not data:\n        raise ValueError("Data cannot be empty")\n        \n    n = len(data)\n    means = []\n    \n    for _ in range(num_bootstraps):\n        sample = [random.choice(data) for _ in range(n)]\n        means.append(sum(sample) / n)\n        \n    means.sort()\n    \n    alpha = 1.0 - confidence_level\n    lower_idx = int(num_bootstraps * (alpha / 2))\n    upper_idx = int(num_bootstraps * (1 - alpha / 2))\n    \n    return means[lower_idx], means[min(upper_idx, num_bootstraps - 1)]',
    },
    codeVariants: [
      {
        id: "ml_hypothesis_testing_bootstrap-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import random\n\ndef bootstrap_confidence_interval(data, num_bootstraps, confidence_level):\n    """\n    Calculates the bootstrap confidence interval for the mean.\n    """\n    if not data:\n        raise ValueError("Data cannot be empty")\n        \n    n = len(data)\n    means = []\n    \n    for _ in range(num_bootstraps):\n        sample = [random.choice(data) for _ in range(n)]\n        means.append(sum(sample) / n)\n        \n    means.sort()\n    \n    alpha = 1.0 - confidence_level\n    lower_idx = int(num_bootstraps * (alpha / 2))\n    upper_idx = int(num_bootstraps * (1 - alpha / 2))\n    \n    return means[lower_idx], means[min(upper_idx, num_bootstraps - 1)]',
      },
      {
        id: "ml_hypothesis_testing_bootstrap-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport random\n\ndef bootstrap_confidence_interval(data, num_bootstraps, confidence_level):\n    """\n    Calculates the bootstrap confidence interval for the mean.\n    """\n    if not data:\n        raise ValueError("Data cannot be empty")\n        \n    n = len(data)\n    means = []\n    \n    for _ in range(num_bootstraps):\n        sample = [random.choice(data) for _ in range(n)]\n        means.append(sum(sample) / n)\n        \n    means.sort()\n    \n    alpha = 1.0 - confidence_level\n    lower_idx = int(num_bootstraps * (alpha / 2))\n    upper_idx = int(num_bootstraps * (1 - alpha / 2))\n    \n    return means[lower_idx], means[min(upper_idx, num_bootstraps - 1)]',
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
        "Comprehensive exploration of Sampling & Bootstrap, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Sampling",
          definition: "Core computational primitive governing Sampling & Bootstrap.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Sampling & Bootstrap.",
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
        "Conceptual introduction to Sampling & Bootstrap, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_sampling_top_p",
    title: "Distributions & LLM Sampling",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 12",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 12",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 12",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Show that applying temperature T to soft",
        prompt:
          "Show that applying temperature T to softmax changes the entropy of the resulting distribution.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that top-p sampling correctly trun",
        prompt:
          "Prove that top-p sampling correctly truncates the tail of a probability distribution while maintaining valid probabilities after rescaling.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How is top-p and top-k filtering impleme",
        prompt:
          "How is top-p and top-k filtering implemented efficiently on GPUs during LLM generation?",
        engineeringContext:
          "Production ML infrastructure consideration for Distributions & LLM Sampling at scale.",
      },
      {
        title: "What happens to the generation quality i",
        prompt: "What happens to the generation quality if temperature is set to 0 vs 2.0?",
        engineeringContext:
          "Production ML infrastructure consideration for Distributions & LLM Sampling at scale.",
      },
      {
        title: "How do you handle sampling bottlenecks w",
        prompt:
          "How do you handle sampling bottlenecks when serving large vocabulary language models?",
        engineeringContext:
          "Production ML infrastructure consideration for Distributions & LLM Sampling at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "p is 0.0 or 1.0.",
        scenario: "p is 0.0 or 1.0.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Multiple tokens having the exact same probability bridging the top-p threshold.",
        scenario: "Multiple tokens having the exact same probability bridging the top-p threshold.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-12",
      title: "Distributions & LLM Sampling",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_sampling_top_p",
      prompt: "Implement the canonical algorithm for Distributions & LLM Sampling.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def top_p_filtering(probs, p):\n    """\n    Applies top-p (nucleus) filtering to a probability distribution.\n    \n    probs: dict mapping token_id -> probability\n    p: cumulative probability threshold\n    \n    Returns filtered probabilities normalized to sum to 1\n    """\n    if p < 0 or p > 1:\n        raise ValueError("p must be between 0 and 1")\n        \n    sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)\n    \n    cumulative_prob = 0.0\n    filtered_probs = {}\n    \n    for token_id, prob in sorted_probs:\n        filtered_probs[token_id] = prob\n        cumulative_prob += prob\n        if cumulative_prob >= p:\n            break\n            \n    if not filtered_probs:\n        return {}\n        \n    total = sum(filtered_probs.values())\n    for token_id in filtered_probs:\n        filtered_probs[token_id] /= total\n        \n    return filtered_probs',
    },
    codeVariants: [
      {
        id: "ml_sampling_top_p-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def top_p_filtering(probs, p):\n    """\n    Applies top-p (nucleus) filtering to a probability distribution.\n    \n    probs: dict mapping token_id -> probability\n    p: cumulative probability threshold\n    \n    Returns filtered probabilities normalized to sum to 1\n    """\n    if p < 0 or p > 1:\n        raise ValueError("p must be between 0 and 1")\n        \n    sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)\n    \n    cumulative_prob = 0.0\n    filtered_probs = {}\n    \n    for token_id, prob in sorted_probs:\n        filtered_probs[token_id] = prob\n        cumulative_prob += prob\n        if cumulative_prob >= p:\n            break\n            \n    if not filtered_probs:\n        return {}\n        \n    total = sum(filtered_probs.values())\n    for token_id in filtered_probs:\n        filtered_probs[token_id] /= total\n        \n    return filtered_probs',
      },
      {
        id: "ml_sampling_top_p-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef top_p_filtering(probs, p):\n    """\n    Applies top-p (nucleus) filtering to a probability distribution.\n    \n    probs: dict mapping token_id -> probability\n    p: cumulative probability threshold\n    \n    Returns filtered probabilities normalized to sum to 1\n    """\n    if p < 0 or p > 1:\n        raise ValueError("p must be between 0 and 1")\n        \n    sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)\n    \n    cumulative_prob = 0.0\n    filtered_probs = {}\n    \n    for token_id, prob in sorted_probs:\n        filtered_probs[token_id] = prob\n        cumulative_prob += prob\n        if cumulative_prob >= p:\n            break\n            \n    if not filtered_probs:\n        return {}\n        \n    total = sum(filtered_probs.values())\n    for token_id in filtered_probs:\n        filtered_probs[token_id] /= total\n        \n    return filtered_probs',
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
        "Comprehensive exploration of Distributions & LLM Sampling, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Distributions",
          definition: "Core computational primitive governing Distributions & LLM Sampling.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Distributions & LLM Sampling.",
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
        "Conceptual introduction to Distributions & LLM Sampling, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
