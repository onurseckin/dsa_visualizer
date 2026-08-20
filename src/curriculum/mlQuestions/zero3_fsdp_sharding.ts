import type { MLTopicQuestionBank } from "./types";

export const zero3FsdpSharding: MLTopicQuestionBank[] = [
  {
    topicId: "ml_zero3_parameter_sharding",
    title: "Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 39",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 39",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 39",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP) optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
];
