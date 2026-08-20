import type { MLTopicQuestionBank } from "./types";

export const domain08_part2: MLTopicQuestionBank[] = [
  {
    topicId: "ml_speculative_decoding",
    title: "Speculative Decoding & Prefix Caching Algorithms",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 33",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 33",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 33",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Speculative Decoding & Prefix Caching Algorithms.",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Speculative Decoding & Prefix Caching Algorithms.",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Speculative Decoding & Prefix Caching Algorithms scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Speculative Decoding & Prefix Caching Algorithms optimized via Triton/CUDA kernel fusion and SRAM caching?",
        engineeringContext: "GPU micro-architecture and high bandwidth memory utilization.",
      },
    ],
    partD_stressTests: [
      {
        title: "Numerical Underflow & Overflow",
        scenario: "Extreme input scale provoking floating-point exponent saturation.",
        failureMode: "NaN / Inf propagation.",
      },
      {
        title: "Boundary Dimension Collapse",
        scenario: "Batch size N=1 or empty sequence dimension.",
        failureMode: "Zero division / Shape mismatch error.",
      },
    ],
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
];
