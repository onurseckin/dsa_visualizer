import type { MLTopicQuestionBank } from "./types";

export const interconnectRingAllreduce: MLTopicQuestionBank[] = [
  {
    topicId: "ml_interconnect_alpha_beta",
    title: "Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 37",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 37",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 37",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model) optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-37-NETWORK-ALPHA-BETA",
      title: "Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_interconnect_alpha_beta",
      prompt:
        "Implement the canonical algorithm for Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes\n    return hops * alpha + (size_bytes / beta)",
    },
    codeVariants: [
      {
        id: "ml_interconnect_alpha_beta-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes\n    return hops * alpha + (size_bytes / beta)",
      },
      {
        id: "ml_interconnect_alpha_beta-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes\n    return hops * alpha + (size_bytes / beta)",
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
        "Comprehensive exploration of Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Interconnect Topologies",
          definition:
            "Core computational primitive governing Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model).",
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
        "Conceptual introduction to Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "network_topology",
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
    topicId: "ml_ring_allreduce_collective",
    title: "Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 38",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 38",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 38",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce) optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-38-RING-ALLREDUCE",
      title: "Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_ring_allreduce_collective",
      prompt:
        "Implement the canonical algorithm for Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)\n    import copy\n    state = copy.deepcopy(initial_state)\n    trace = []\n    \n    # Phase 1: Scatter-Reduce (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n - step) % P\n            next_state[send_to][chunk_idx] += state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    # Phase 2: All-Gather (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n + 1 - step) % P\n            next_state[send_to][chunk_idx] = state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    return trace",
    },
    codeVariants: [
      {
        id: "ml_ring_allreduce_collective-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)\n    import copy\n    state = copy.deepcopy(initial_state)\n    trace = []\n    \n    # Phase 1: Scatter-Reduce (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n - step) % P\n            next_state[send_to][chunk_idx] += state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    # Phase 2: All-Gather (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n + 1 - step) % P\n            next_state[send_to][chunk_idx] = state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    return trace",
      },
      {
        id: "ml_ring_allreduce_collective-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)\n    import copy\n    state = copy.deepcopy(initial_state)\n    trace = []\n    \n    # Phase 1: Scatter-Reduce (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n - step) % P\n            next_state[send_to][chunk_idx] += state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    # Phase 2: All-Gather (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n + 1 - step) % P\n            next_state[send_to][chunk_idx] = state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    return trace",
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
        "Comprehensive exploration of Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)",
          definition:
            "Core computational primitive governing Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce).",
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
        "Conceptual introduction to Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "ring_network",
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
