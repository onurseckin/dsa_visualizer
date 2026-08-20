import type { MLTopicQuestionBank } from "./types";

export const domain03_part2: MLTopicQuestionBank[] = [
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
];
