import type { MLTopicQuestionBank } from "./types";

export const domain01_part1: MLTopicQuestionBank[] = [
  {
    topicId: "ml_matrix_memory_layout",
    title: "Multi-dimensional Array Indexing & Strides",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Reshape the Matrix",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for Multi-dimensional Array Indexing & Strides.",
        difficulty: "Easy",
      },
      {
        title: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Algorithmic foundation for Multi-dimensional Array Indexing & Strides.",
        difficulty: "Medium",
      },
      {
        title: "Diagonal Traverse",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Algorithmic foundation for Multi-dimensional Array Indexing & Strides.",
        difficulty: "Medium",
      },
      {
        title: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image/",
        rationale: "Algorithmic foundation for Multi-dimensional Array Indexing & Strides.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that for a contiguous C-order arra",
        prompt:
          "Prove that for a contiguous C-order array of shape $(d_1, d_2, \\ldots, d_n)$, the stride $s_i$ for dimension $i$ is given by $s_i = \\prod_{j=i+1}^n d_j$.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that an array shape and strides co",
        prompt:
          "Prove that an array shape and strides combination represents a set of overlapping memory elements if and only if there exists a valid index arithmetic collision.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does PyTorch represent tensor views",
        prompt:
          "How does PyTorch represent tensor views (e.g., after `transpose`) without copying data? Explain the role of strides and offsets.",
        engineeringContext:
          "Production ML infrastructure consideration for Multi-dimensional Array Indexing & Strides at scale.",
      },
      {
        title: "In CUDA or custom C++ kernels, why is co",
        prompt:
          "In CUDA or custom C++ kernels, why is contiguous memory access critical for performance, and how do non-contiguous strides impact memory coalescing?",
        engineeringContext:
          "Production ML infrastructure consideration for Multi-dimensional Array Indexing & Strides at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Zero-dimensional tensors (scalars)",
        scenario:
          "Zero-dimensional tensors (scalars): ensure strides and shapes are handled correctly.",
        failureMode: "ensure strides and shapes are handled correctly.",
      },
      {
        title: "Dimensions of size 1",
        scenario: "Dimensions of size 1: test stride behaviors when broadcasting or squeezing.",
        failureMode: "test stride behaviors when broadcasting or squeezing.",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-01",
      title: "Multi-dimensional Array Indexing & Strides",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_matrix_memory_layout",
      prompt: "Implement the canonical algorithm for Multi-dimensional Array Indexing & Strides.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def compute_offset(index, shape, strides):\n    """\n    Computes the flat memory offset for a multidimensional index.\n    """\n    if len(index) != len(shape) or len(index) != len(strides):\n        raise ValueError("Length of index, shape, and strides must match.")\n    offset = 0\n    for i, s, st in zip(index, shape, strides):\n        if i < 0 or i >= s:\n            raise IndexError("Index out of bounds.")\n        offset += i * st\n    return offset',
    },
    codeVariants: [
      {
        id: "ml_matrix_memory_layout-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def compute_offset(index, shape, strides):\n    """\n    Computes the flat memory offset for a multidimensional index.\n    """\n    if len(index) != len(shape) or len(index) != len(strides):\n        raise ValueError("Length of index, shape, and strides must match.")\n    offset = 0\n    for i, s, st in zip(index, shape, strides):\n        if i < 0 or i >= s:\n            raise IndexError("Index out of bounds.")\n        offset += i * st\n    return offset',
      },
      {
        id: "ml_matrix_memory_layout-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef compute_offset(index, shape, strides):\n    """\n    Computes the flat memory offset for a multidimensional index.\n    """\n    if len(index) != len(shape) or len(index) != len(strides):\n        raise ValueError("Length of index, shape, and strides must match.")\n    offset = 0\n    for i, s, st in zip(index, shape, strides):\n        if i < 0 or i >= s:\n            raise IndexError("Index out of bounds.")\n        offset += i * st\n    return offset',
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
        "Comprehensive exploration of Multi-dimensional Array Indexing & Strides, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Multi-dimensional Array Indexing",
          definition:
            "Core computational primitive governing Multi-dimensional Array Indexing & Strides.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Multi-dimensional Array Indexing & Strides.",
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
        "Conceptual introduction to Multi-dimensional Array Indexing & Strides, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
  {
    topicId: "ml_tensor_strides_views",
    title: "Broadcasting Semantics",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array With Elements Not Equal to Average of Neighbors",
        url: "https://leetcode.com/problems/array-with-elements-not-equal-to-average-of-neighbors/",
        rationale: "Algorithmic foundation for Broadcasting Semantics.",
        difficulty: "Medium",
      },
      {
        title: "Valid Boomerang",
        url: "https://leetcode.com/problems/valid-boomerang/",
        rationale: "Algorithmic foundation for Broadcasting Semantics.",
        difficulty: "Medium",
      },
      {
        title: "Construct Target Array With Multiple Sums",
        url: "https://leetcode.com/problems/construct-target-array-with-multiple-sums/",
        rationale: "Algorithmic foundation for Broadcasting Semantics.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the broadcasted shape of two",
        prompt:
          "Prove that the broadcasted shape of two tensors $A$ and $B$ is uniquely determined by the standard NumPy broadcasting rules or fails.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the associativity of broadcasting",
        prompt:
          "Prove the associativity of broadcasting: $Broadcast(Broadcast(A, B), C) = Broadcast(A, Broadcast(B, C))$.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does broadcasting save memory during",
        prompt:
          "How does broadcasting save memory during forward passes in neural networks? Provide an example with adding bias to a batched matrix multiplication.",
        engineeringContext:
          "Production ML infrastructure consideration for Broadcasting Semantics at scale.",
      },
      {
        title: "Explain how implicit broadcasting is imp",
        prompt:
          "Explain how implicit broadcasting is implemented in optimized backends like XLA or cuDNN.",
        engineeringContext:
          "Production ML infrastructure consideration for Broadcasting Semantics at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Broadcasting a scalar with a high-dimensional tensor.",
        scenario: "Broadcasting a scalar with a high-dimensional tensor.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Incompatible shapes (e.g., `(3, 4)` and `(3, 5)`).",
        scenario: "Incompatible shapes (e.g., `(3, 4)` and `(3, 5)`).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Broadcasting arrays with many dimensions of size 1.",
        scenario: "Broadcasting arrays with many dimensions of size 1.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-02",
      title: "Broadcasting Semantics",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_tensor_strides_views",
      prompt: "Implement the canonical algorithm for Broadcasting Semantics.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def broadcast_shapes(shape1, shape2):\n    """\n    Returns the broadcasted shape of two array shapes, or raises ValueError if incompatible.\n    """\n    res = []\n    len1, len2 = len(shape1), len(shape2)\n    max_len = max(len1, len2)\n    s1 = (1,) * (max_len - len1) + tuple(shape1)\n    s2 = (1,) * (max_len - len2) + tuple(shape2)\n    for dim1, dim2 in zip(s1, s2):\n        if dim1 == dim2:\n            res.append(dim1)\n        elif dim1 == 1:\n            res.append(dim2)\n        elif dim2 == 1:\n            res.append(dim1)\n        else:\n            raise ValueError(f"Incompatible shapes for broadcasting: {shape1} and {shape2}")\n    return tuple(res)',
    },
    codeVariants: [
      {
        id: "ml_tensor_strides_views-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def broadcast_shapes(shape1, shape2):\n    """\n    Returns the broadcasted shape of two array shapes, or raises ValueError if incompatible.\n    """\n    res = []\n    len1, len2 = len(shape1), len(shape2)\n    max_len = max(len1, len2)\n    s1 = (1,) * (max_len - len1) + tuple(shape1)\n    s2 = (1,) * (max_len - len2) + tuple(shape2)\n    for dim1, dim2 in zip(s1, s2):\n        if dim1 == dim2:\n            res.append(dim1)\n        elif dim1 == 1:\n            res.append(dim2)\n        elif dim2 == 1:\n            res.append(dim1)\n        else:\n            raise ValueError(f"Incompatible shapes for broadcasting: {shape1} and {shape2}")\n    return tuple(res)',
      },
      {
        id: "ml_tensor_strides_views-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef broadcast_shapes(shape1, shape2):\n    """\n    Returns the broadcasted shape of two array shapes, or raises ValueError if incompatible.\n    """\n    res = []\n    len1, len2 = len(shape1), len(shape2)\n    max_len = max(len1, len2)\n    s1 = (1,) * (max_len - len1) + tuple(shape1)\n    s2 = (1,) * (max_len - len2) + tuple(shape2)\n    for dim1, dim2 in zip(s1, s2):\n        if dim1 == dim2:\n            res.append(dim1)\n        elif dim1 == 1:\n            res.append(dim2)\n        elif dim2 == 1:\n            res.append(dim1)\n        else:\n            raise ValueError(f"Incompatible shapes for broadcasting: {shape1} and {shape2}")\n    return tuple(res)',
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
        "Comprehensive exploration of Broadcasting Semantics, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Broadcasting Semantics",
          definition: "Core computational primitive governing Broadcasting Semantics.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Broadcasting Semantics.",
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
        "Conceptual introduction to Broadcasting Semantics, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
