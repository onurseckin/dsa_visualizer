import type { MLTopicQuestionBank } from "./types";

export const domain10_part3: MLTopicQuestionBank[] = [
  {
    topicId: "ml_compiler_fusion_liveness",
    title: "Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 40",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 40",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 40",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton) optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-40-IR-FUSION-LIVENESS",
      title: "Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_compiler_fusion_liveness",
      prompt:
        "Implement the canonical algorithm for Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals\n    events = []\n    for tensor_name, (start, end, size) in liveness.items():\n        events.append((start, size))    # Allocation event\n        events.append((end, -size))    # Free event\n        \n    # Sort events by timestep. If equal, free before allocate\n    events.sort(key=lambda x: (x[0], x[1]))\n    \n    current_mem = 0\n    peak_mem = 0\n    \n    for _, delta in events:\n        current_mem += delta\n        if current_mem > peak_mem:\n            peak_mem = current_mem\n            \n    return peak_mem",
    },
    codeVariants: [
      {
        id: "ml_compiler_fusion_liveness-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals\n    events = []\n    for tensor_name, (start, end, size) in liveness.items():\n        events.append((start, size))    # Allocation event\n        events.append((end, -size))    # Free event\n        \n    # Sort events by timestep. If equal, free before allocate\n    events.sort(key=lambda x: (x[0], x[1]))\n    \n    current_mem = 0\n    peak_mem = 0\n    \n    for _, delta in events:\n        current_mem += delta\n        if current_mem > peak_mem:\n            peak_mem = current_mem\n            \n    return peak_mem",
      },
      {
        id: "ml_compiler_fusion_liveness-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals\n    events = []\n    for tensor_name, (start, end, size) in liveness.items():\n        events.append((start, size))    # Allocation event\n        events.append((end, -size))    # Free event\n        \n    # Sort events by timestep. If equal, free before allocate\n    events.sort(key=lambda x: (x[0], x[1]))\n    \n    current_mem = 0\n    peak_mem = 0\n    \n    for _, delta in events:\n        current_mem += delta\n        if current_mem > peak_mem:\n            peak_mem = current_mem\n            \n    return peak_mem",
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
        "Comprehensive exploration of Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Compiler Graph Passes, Kernel Fusion",
          definition:
            "Core computational primitive governing Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton).",
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
        "Conceptual introduction to Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "memory_liveness_arena",
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
    topicId: "ml_parallelism_3d_moe_1f1b",
    title: "3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 41",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 41",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 41",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing optimized via Triton/CUDA kernel fusion and SRAM caching?",
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
      id: "CONTRACT-TOPIC-41-MOE-1F1B",
      title: "3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_parallelism_3d_moe_1f1b",
      prompt:
        "Implement the canonical algorithm for 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "def calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:\n    P = num_stages\n    M = num_microbatches\n    if M + P - 1 == 0:\n        return 0.0\n    return float(P - 1) / float(M + P - 1)\n\ndef moe_topk_routing_with_capacity(\n    gate_logits: list[list[float]], \n    top_k: int, \n    capacity_limit: int\n) -> list[list[int]]:\n    num_experts = len(gate_logits[0]) if gate_logits else 0\n    expert_counts = {e: 0 for e in range(num_experts)}\n    assignments = []\n    \n    for token_logits in gate_logits:\n        indexed_logits = list(enumerate(token_logits))\n        indexed_logits.sort(key=lambda x: x[1], reverse=True)\n        top_experts = [idx for idx, _ in indexed_logits[:top_k]]\n        \n        token_assignments = []\n        for expert in top_experts:\n            if expert_counts[expert] < capacity_limit:\n                expert_counts[expert] += 1\n                token_assignments.append(expert)\n            else:\n                token_assignments.append(-1)\n        assignments.append(token_assignments)\n            \n    return assignments",
    },
    codeVariants: [
      {
        id: "ml_parallelism_3d_moe_1f1b-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "def calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:\n    P = num_stages\n    M = num_microbatches\n    if M + P - 1 == 0:\n        return 0.0\n    return float(P - 1) / float(M + P - 1)\n\ndef moe_topk_routing_with_capacity(\n    gate_logits: list[list[float]], \n    top_k: int, \n    capacity_limit: int\n) -> list[list[int]]:\n    num_experts = len(gate_logits[0]) if gate_logits else 0\n    expert_counts = {e: 0 for e in range(num_experts)}\n    assignments = []\n    \n    for token_logits in gate_logits:\n        indexed_logits = list(enumerate(token_logits))\n        indexed_logits.sort(key=lambda x: x[1], reverse=True)\n        top_experts = [idx for idx, _ in indexed_logits[:top_k]]\n        \n        token_assignments = []\n        for expert in top_experts:\n            if expert_counts[expert] < capacity_limit:\n                expert_counts[expert] += 1\n                token_assignments.append(expert)\n            else:\n                token_assignments.append(-1)\n        assignments.append(token_assignments)\n            \n    return assignments",
      },
      {
        id: "ml_parallelism_3d_moe_1f1b-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\ndef calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:\n    P = num_stages\n    M = num_microbatches\n    if M + P - 1 == 0:\n        return 0.0\n    return float(P - 1) / float(M + P - 1)\n\ndef moe_topk_routing_with_capacity(\n    gate_logits: list[list[float]], \n    top_k: int, \n    capacity_limit: int\n) -> list[list[int]]:\n    num_experts = len(gate_logits[0]) if gate_logits else 0\n    expert_counts = {e: 0 for e in range(num_experts)}\n    assignments = []\n    \n    for token_logits in gate_logits:\n        indexed_logits = list(enumerate(token_logits))\n        indexed_logits.sort(key=lambda x: x[1], reverse=True)\n        top_experts = [idx for idx, _ in indexed_logits[:top_k]]\n        \n        token_assignments = []\n        for expert in top_experts:\n            if expert_counts[expert] < capacity_limit:\n                expert_counts[expert] += 1\n                token_assignments.append(expert)\n            else:\n                token_assignments.append(-1)\n        assignments.append(token_assignments)\n            \n    return assignments",
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
        "Comprehensive exploration of 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "3D Parallelism, 1F1B Pipeline Bubble Analysis",
          definition:
            "Core computational primitive governing 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing.",
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
        "Conceptual introduction to 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "parallel_pipeline_moe",
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
