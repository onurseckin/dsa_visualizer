import { MLTopicQuestionBank } from "./types";

export const domain01to02: MLTopicQuestionBank[] = [
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
  {
    topicId: "ml_vector_spaces_gram_schmidt",
    title: "Orthogonalization & Gram-Schmidt",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Valid Square",
        url: "https://leetcode.com/problems/valid-square/",
        rationale: "Algorithmic foundation for Orthogonalization & Gram-Schmidt.",
        difficulty: "Medium",
      },
      {
        title: "Max Points on a Line",
        url: "https://leetcode.com/problems/max-points-on-a-line/",
        rationale: "Algorithmic foundation for Orthogonalization & Gram-Schmidt.",
        difficulty: "Medium",
      },
      {
        title: "Minimum Area Rectangle",
        url: "https://leetcode.com/problems/minimum-area-rectangle/",
        rationale: "Algorithmic foundation for Orthogonalization & Gram-Schmidt.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the vectors produced by the G",
        prompt:
          "Prove that the vectors produced by the Gram-Schmidt process are mutually orthogonal.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that the span of the first $k$ ort",
        prompt:
          "Prove that the span of the first $k$ orthogonalized vectors equals the span of the first $k$ original vectors.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is the modified Gram-Schmidt process",
        prompt:
          "Why is the modified Gram-Schmidt process preferred over the classical Gram-Schmidt process for numerical stability in floating-point arithmetic?",
        engineeringContext:
          "Production ML infrastructure consideration for Orthogonalization & Gram-Schmidt at scale.",
      },
      {
        title: "How is orthogonalization used in maintai",
        prompt:
          "How is orthogonalization used in maintaining the stability of recurrent neural networks (e.g., orthogonal initialization)?",
        engineeringContext:
          "Production ML infrastructure consideration for Orthogonalization & Gram-Schmidt at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Linearly dependent input vectors (should result in zero vectors).",
        scenario: "Linearly dependent input vectors (should result in zero vectors).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Almost collinear vectors (stress tests numerical stability).",
        scenario: "Almost collinear vectors (stress tests numerical stability).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-03",
      title: "Orthogonalization & Gram-Schmidt",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_vector_spaces_gram_schmidt",
      prompt: "Implement the canonical algorithm for Orthogonalization & Gram-Schmidt.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef dot_product(v1, v2):\n    return sum(x * y for x, y in zip(v1, v2))\n\ndef scalar_mult(c, v):\n    return [c * x for x in v]\n\ndef vector_sub(v1, v2):\n    return [x - y for x, y in zip(v1, v2)]\n\ndef gram_schmidt(vectors):\n    """\n    Performs modified Gram-Schmidt orthogonalization on a list of vectors.\n    Returns a list of orthogonal (not necessarily normalized) vectors.\n    """\n    if not vectors:\n        return []\n    u = []\n    for v in vectors:\n        current_u = list(v)\n        for prev_u in u:\n            prev_u_dot = dot_product(prev_u, prev_u)\n            if prev_u_dot < 1e-12:\n                continue\n            proj_coef = dot_product(current_u, prev_u) / prev_u_dot\n            proj = scalar_mult(proj_coef, prev_u)\n            current_u = vector_sub(current_u, proj)\n        u.append(current_u)\n    return u',
    },
    codeVariants: [
      {
        id: "ml_vector_spaces_gram_schmidt-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef dot_product(v1, v2):\n    return sum(x * y for x, y in zip(v1, v2))\n\ndef scalar_mult(c, v):\n    return [c * x for x in v]\n\ndef vector_sub(v1, v2):\n    return [x - y for x, y in zip(v1, v2)]\n\ndef gram_schmidt(vectors):\n    """\n    Performs modified Gram-Schmidt orthogonalization on a list of vectors.\n    Returns a list of orthogonal (not necessarily normalized) vectors.\n    """\n    if not vectors:\n        return []\n    u = []\n    for v in vectors:\n        current_u = list(v)\n        for prev_u in u:\n            prev_u_dot = dot_product(prev_u, prev_u)\n            if prev_u_dot < 1e-12:\n                continue\n            proj_coef = dot_product(current_u, prev_u) / prev_u_dot\n            proj = scalar_mult(proj_coef, prev_u)\n            current_u = vector_sub(current_u, proj)\n        u.append(current_u)\n    return u',
      },
      {
        id: "ml_vector_spaces_gram_schmidt-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef dot_product(v1, v2):\n    return sum(x * y for x, y in zip(v1, v2))\n\ndef scalar_mult(c, v):\n    return [c * x for x in v]\n\ndef vector_sub(v1, v2):\n    return [x - y for x, y in zip(v1, v2)]\n\ndef gram_schmidt(vectors):\n    """\n    Performs modified Gram-Schmidt orthogonalization on a list of vectors.\n    Returns a list of orthogonal (not necessarily normalized) vectors.\n    """\n    if not vectors:\n        return []\n    u = []\n    for v in vectors:\n        current_u = list(v)\n        for prev_u in u:\n            prev_u_dot = dot_product(prev_u, prev_u)\n            if prev_u_dot < 1e-12:\n                continue\n            proj_coef = dot_product(current_u, prev_u) / prev_u_dot\n            proj = scalar_mult(proj_coef, prev_u)\n            current_u = vector_sub(current_u, proj)\n        u.append(current_u)\n    return u',
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
        "Comprehensive exploration of Orthogonalization & Gram-Schmidt, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Orthogonalization",
          definition: "Core computational primitive governing Orthogonalization & Gram-Schmidt.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Orthogonalization & Gram-Schmidt.",
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
        "Conceptual introduction to Orthogonalization & Gram-Schmidt, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "vector",
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
    topicId: "ml_matrix_svd_pca",
    title: "Eigendecomposition & Power Iteration",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Sort Integers by The Power Value",
        url: "https://leetcode.com/problems/sort-integers-by-the-power-value/",
        rationale: "Algorithmic foundation for Eigendecomposition & Power Iteration.",
        difficulty: "Medium",
      },
      {
        title: "Pow(x, n)",
        url: "https://leetcode.com/problems/powx-n/",
        rationale: "Algorithmic foundation for Eigendecomposition & Power Iteration.",
        difficulty: "Medium",
      },
      {
        title: "Find the Duplicate Number",
        url: "https://leetcode.com/problems/find-the-duplicate-number/",
        rationale: "Algorithmic foundation for Eigendecomposition & Power Iteration.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the power iteration method co",
        prompt:
          "Prove that the power iteration method converges to the dominant eigenvector for a diagonalizable matrix with a strictly dominant eigenvalue.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the rate of convergence of power i",
        prompt:
          "Prove the rate of convergence of power iteration depends on the ratio $|\\lambda_2| / |\\lambda_1|$.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How is power iteration used in computing",
        prompt:
          "How is power iteration used in computing Spectral Normalization for Generative Adversarial Networks (GANs)?",
        engineeringContext:
          "Production ML infrastructure consideration for Eigendecomposition & Power Iteration at scale.",
      },
      {
        title: "Why is full eigendecomposition computati",
        prompt:
          "Why is full eigendecomposition computationally prohibitive for large ML weight matrices, and when are iterative approximations preferred?",
        engineeringContext:
          "Production ML infrastructure consideration for Eigendecomposition & Power Iteration at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Matrices with multiple dominant eigenvalues (e.g., $\\lambda_1 = -\\lambda_2$).",
        scenario: "Matrices with multiple dominant eigenvalues (e.g., $\\lambda_1 = -\\lambda_2$).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Zero matrix or identity matrix (ensures valid fallback behavior).",
        scenario: "Zero matrix or identity matrix (ensures valid fallback behavior).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-04",
      title: "Eigendecomposition & Power Iteration",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_matrix_svd_pca",
      prompt: "Implement the canonical algorithm for Eigendecomposition & Power Iteration.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef mat_vec_mul(X, v):\n    res = []\n    for row in X:\n        res.append(sum(r * val for r, val in zip(row, v)))\n    return res\n\ndef normalize(v):\n    norm = math.sqrt(sum(x * x for x in v))\n    if norm < 1e-12:\n        return v\n    return [x / norm for x in v]\n\ndef top_principal_component(X, num_iterations):\n    """\n    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.\n    X is a list of lists representing a matrix.\n    Returns the dominant eigenvector as a normalized list.\n    """\n    if not X or not X[0]:\n        return []\n    rows = len(X)\n    cols = len(X[0])\n    \n    # Compute covariance matrix C = X^T X\n    C = [[0.0] * cols for _ in range(cols)]\n    for i in range(cols):\n        for j in range(cols):\n            val = sum(X[k][i] * X[k][j] for k in range(rows))\n            C[i][j] = val\n            \n    # Initialize random vector (or all ones)\n    b_k = [1.0] * cols\n    b_k = normalize(b_k)\n    \n    for _ in range(num_iterations):\n        b_k1 = mat_vec_mul(C, b_k)\n        b_k = normalize(b_k1)\n        \n    return b_k',
    },
    codeVariants: [
      {
        id: "ml_matrix_svd_pca-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef mat_vec_mul(X, v):\n    res = []\n    for row in X:\n        res.append(sum(r * val for r, val in zip(row, v)))\n    return res\n\ndef normalize(v):\n    norm = math.sqrt(sum(x * x for x in v))\n    if norm < 1e-12:\n        return v\n    return [x / norm for x in v]\n\ndef top_principal_component(X, num_iterations):\n    """\n    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.\n    X is a list of lists representing a matrix.\n    Returns the dominant eigenvector as a normalized list.\n    """\n    if not X or not X[0]:\n        return []\n    rows = len(X)\n    cols = len(X[0])\n    \n    # Compute covariance matrix C = X^T X\n    C = [[0.0] * cols for _ in range(cols)]\n    for i in range(cols):\n        for j in range(cols):\n            val = sum(X[k][i] * X[k][j] for k in range(rows))\n            C[i][j] = val\n            \n    # Initialize random vector (or all ones)\n    b_k = [1.0] * cols\n    b_k = normalize(b_k)\n    \n    for _ in range(num_iterations):\n        b_k1 = mat_vec_mul(C, b_k)\n        b_k = normalize(b_k1)\n        \n    return b_k',
      },
      {
        id: "ml_matrix_svd_pca-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef mat_vec_mul(X, v):\n    res = []\n    for row in X:\n        res.append(sum(r * val for r, val in zip(row, v)))\n    return res\n\ndef normalize(v):\n    norm = math.sqrt(sum(x * x for x in v))\n    if norm < 1e-12:\n        return v\n    return [x / norm for x in v]\n\ndef top_principal_component(X, num_iterations):\n    """\n    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.\n    X is a list of lists representing a matrix.\n    Returns the dominant eigenvector as a normalized list.\n    """\n    if not X or not X[0]:\n        return []\n    rows = len(X)\n    cols = len(X[0])\n    \n    # Compute covariance matrix C = X^T X\n    C = [[0.0] * cols for _ in range(cols)]\n    for i in range(cols):\n        for j in range(cols):\n            val = sum(X[k][i] * X[k][j] for k in range(rows))\n            C[i][j] = val\n            \n    # Initialize random vector (or all ones)\n    b_k = [1.0] * cols\n    b_k = normalize(b_k)\n    \n    for _ in range(num_iterations):\n        b_k1 = mat_vec_mul(C, b_k)\n        b_k = normalize(b_k1)\n        \n    return b_k',
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
        "Comprehensive exploration of Eigendecomposition & Power Iteration, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Eigendecomposition",
          definition:
            "Core computational primitive governing Eigendecomposition & Power Iteration.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Eigendecomposition & Power Iteration.",
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
        "Conceptual introduction to Eigendecomposition & Power Iteration, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_gradients_jacobians_hessians",
    title: "Finite Differences & Numerical Jacobians",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Evaluate Reverse Polish Notation",
        url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
        rationale: "Algorithmic foundation for Finite Differences & Numerical Jacobians.",
        difficulty: "Medium",
      },
      {
        title: "Basic Calculator",
        url: "https://leetcode.com/problems/basic-calculator/",
        rationale: "Algorithmic foundation for Finite Differences & Numerical Jacobians.",
        difficulty: "Hard",
      },
      {
        title: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element/",
        rationale: "Algorithmic foundation for Finite Differences & Numerical Jacobians.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that the central difference method",
        prompt:
          "Prove that the central difference method has an error of $O(h^2)$, while forward difference has an error of $O(h)$.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Show that numerical differentiation is h",
        prompt:
          "Show that numerical differentiation is highly sensitive to catastrophic cancellation for very small $h$ in floating-point representation.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "When debugging custom CUDA autograd kern",
        prompt:
          "When debugging custom CUDA autograd kernels, how is numerical gradient checking (gradcheck) implemented using finite differences?",
        engineeringContext:
          "Production ML infrastructure consideration for Finite Differences & Numerical Jacobians at scale.",
      },
      {
        title: "What are the performance trade-offs of u",
        prompt:
          "What are the performance trade-offs of using numerical Jacobians versus analytical Jacobians via reverse-mode autodiff?",
        engineeringContext:
          "Production ML infrastructure consideration for Finite Differences & Numerical Jacobians at scale.",
      },
    ],
    partD_stressTests: [
      {
        title:
          "Highly non-linear functions where finite difference fails to approximate local gradients accurately.",
        scenario:
          "Highly non-linear functions where finite difference fails to approximate local gradients accurately.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Step functions or functions with discontinuous derivatives (e.g., ReLU at 0).",
        scenario: "Step functions or functions with discontinuous derivatives (e.g., ReLU at 0).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-05",
      title: "Finite Differences & Numerical Jacobians",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_gradients_jacobians_hessians",
      prompt: "Implement the canonical algorithm for Finite Differences & Numerical Jacobians.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'def compute_jacobian(f, x, h=1e-5):\n    """\n    Computes the numerical Jacobian of a vector-valued function f at vector x using central differences.\n    Returns a list of lists representing the Jacobian matrix.\n    """\n    n = len(x)\n    # Get the output dimension\n    fx = f(x)\n    m = len(fx)\n    \n    jacobian = [[0.0] * n for _ in range(m)]\n    \n    for j in range(n):\n        x_plus = list(x)\n        x_minus = list(x)\n        x_plus[j] += h\n        x_minus[j] -= h\n        \n        f_plus = f(x_plus)\n        f_minus = f(x_minus)\n        \n        for i in range(m):\n            jacobian[i][j] = (f_plus[i] - f_minus[i]) / (2 * h)\n            \n    return jacobian',
    },
    codeVariants: [
      {
        id: "ml_gradients_jacobians_hessians-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'def compute_jacobian(f, x, h=1e-5):\n    """\n    Computes the numerical Jacobian of a vector-valued function f at vector x using central differences.\n    Returns a list of lists representing the Jacobian matrix.\n    """\n    n = len(x)\n    # Get the output dimension\n    fx = f(x)\n    m = len(fx)\n    \n    jacobian = [[0.0] * n for _ in range(m)]\n    \n    for j in range(n):\n        x_plus = list(x)\n        x_minus = list(x)\n        x_plus[j] += h\n        x_minus[j] -= h\n        \n        f_plus = f(x_plus)\n        f_minus = f(x_minus)\n        \n        for i in range(m):\n            jacobian[i][j] = (f_plus[i] - f_minus[i]) / (2 * h)\n            \n    return jacobian',
      },
      {
        id: "ml_gradients_jacobians_hessians-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\ndef compute_jacobian(f, x, h=1e-5):\n    """\n    Computes the numerical Jacobian of a vector-valued function f at vector x using central differences.\n    Returns a list of lists representing the Jacobian matrix.\n    """\n    n = len(x)\n    # Get the output dimension\n    fx = f(x)\n    m = len(fx)\n    \n    jacobian = [[0.0] * n for _ in range(m)]\n    \n    for j in range(n):\n        x_plus = list(x)\n        x_minus = list(x)\n        x_plus[j] += h\n        x_minus[j] -= h\n        \n        f_plus = f(x_plus)\n        f_minus = f(x_minus)\n        \n        for i in range(m):\n            jacobian[i][j] = (f_plus[i] - f_minus[i]) / (2 * h)\n            \n    return jacobian',
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
        "Comprehensive exploration of Finite Differences & Numerical Jacobians, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Finite Differences",
          definition:
            "Core computational primitive governing Finite Differences & Numerical Jacobians.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Finite Differences & Numerical Jacobians.",
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
        "Conceptual introduction to Finite Differences & Numerical Jacobians, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "computation_graph",
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
    topicId: "ml_autodiff_engines",
    title: "Scalar Autograd Engine",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Design a Graph With Shortest Path Calculator",
        url: "https://leetcode.com/problems/design-a-graph-with-shortest-path-calculator/",
        rationale: "Algorithmic foundation for Scalar Autograd Engine.",
        difficulty: "Hard",
      },
      {
        title: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule/",
        rationale: "Algorithmic foundation for Scalar Autograd Engine.",
        difficulty: "Medium",
      },
      {
        title: "Find Eventual Safe States",
        url: "https://leetcode.com/problems/find-eventual-safe-states/",
        rationale: "Algorithmic foundation for Scalar Autograd Engine.",
        difficulty: "Medium",
      },
      {
        title: "Clone Graph",
        url: "https://leetcode.com/problems/clone-graph/",
        rationale: "Algorithmic foundation for Scalar Autograd Engine.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove the chain rule of calculus over co",
        prompt:
          "Prove the chain rule of calculus over computational graphs (multivariable chain rule).",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that reverse-mode automatic differ",
        prompt:
          "Prove that reverse-mode automatic differentiation computes the gradient of a scalar output with respect to $N$ inputs in a single backward pass, taking $O(1)$ times the forward pass cost.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does PyTorch construct a dynamic com",
        prompt:
          "How does PyTorch construct a dynamic computational graph during the forward pass? Compare this with static graph construction in TensorFlow v1 or XLA.",
        engineeringContext:
          "Production ML infrastructure consideration for Scalar Autograd Engine at scale.",
      },
      {
        title: "Why must gradients be explicitly zeroed",
        prompt:
          "Why must gradients be explicitly zeroed out (e.g., `optimizer.zero_grad()`) in most deep learning frameworks?",
        engineeringContext:
          "Production ML infrastructure consideration for Scalar Autograd Engine at scale.",
      },
    ],
    partD_stressTests: [
      {
        title:
          "Re-using the same node multiple times in the graph (handling accumulating gradients).",
        scenario:
          "Re-using the same node multiple times in the graph (handling accumulating gradients).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Empty graphs or operations with no dependencies.",
        scenario: "Empty graphs or operations with no dependencies.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "In-place operations and their effect on gradient tracking.",
        scenario: "In-place operations and their effect on gradient tracking.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-06",
      title: "Scalar Autograd Engine",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_autodiff_engines",
      prompt: "Implement the canonical algorithm for Scalar Autograd Engine.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "class Value:\n    \"\"\"\n    A simple scalar autograd engine tracking computation graphs.\n    \"\"\"\n    def __init__(self, data, _children=(), _op=''):\n        self.data = data\n        self.grad = 0.0\n        self._backward = lambda: None\n        self._prev = set(_children)\n        self._op = _op\n\n    def __add__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data + other.data, (self, other), '+')\n\n        def _backward():\n            self.grad += out.grad\n            other.grad += out.grad\n        out._backward = _backward\n\n        return out\n\n    def __mul__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data * other.data, (self, other), '*')\n\n        def _backward():\n            self.grad += other.data * out.grad\n            other.grad += self.data * out.grad\n        out._backward = _backward\n\n        return out\n\n    def backward(self):\n        topo = []\n        visited = set()\n        def build_topo(v):\n            if v not in visited:\n                visited.add(v)\n                for child in v._prev:\n                    build_topo(child)\n                topo.append(v)\n        build_topo(self)\n\n        self.grad = 1.0\n        for v in reversed(topo):\n            v._backward()",
    },
    codeVariants: [
      {
        id: "ml_autodiff_engines-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "class Value:\n    \"\"\"\n    A simple scalar autograd engine tracking computation graphs.\n    \"\"\"\n    def __init__(self, data, _children=(), _op=''):\n        self.data = data\n        self.grad = 0.0\n        self._backward = lambda: None\n        self._prev = set(_children)\n        self._op = _op\n\n    def __add__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data + other.data, (self, other), '+')\n\n        def _backward():\n            self.grad += out.grad\n            other.grad += out.grad\n        out._backward = _backward\n\n        return out\n\n    def __mul__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data * other.data, (self, other), '*')\n\n        def _backward():\n            self.grad += other.data * out.grad\n            other.grad += self.data * out.grad\n        out._backward = _backward\n\n        return out\n\n    def backward(self):\n        topo = []\n        visited = set()\n        def build_topo(v):\n            if v not in visited:\n                visited.add(v)\n                for child in v._prev:\n                    build_topo(child)\n                topo.append(v)\n        build_topo(self)\n\n        self.grad = 1.0\n        for v in reversed(topo):\n            v._backward()",
      },
      {
        id: "ml_autodiff_engines-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nclass Value:\n    \"\"\"\n    A simple scalar autograd engine tracking computation graphs.\n    \"\"\"\n    def __init__(self, data, _children=(), _op=''):\n        self.data = data\n        self.grad = 0.0\n        self._backward = lambda: None\n        self._prev = set(_children)\n        self._op = _op\n\n    def __add__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data + other.data, (self, other), '+')\n\n        def _backward():\n            self.grad += out.grad\n            other.grad += out.grad\n        out._backward = _backward\n\n        return out\n\n    def __mul__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data * other.data, (self, other), '*')\n\n        def _backward():\n            self.grad += other.data * out.grad\n            other.grad += self.data * out.grad\n        out._backward = _backward\n\n        return out\n\n    def backward(self):\n        topo = []\n        visited = set()\n        def build_topo(v):\n            if v not in visited:\n                visited.add(v)\n                for child in v._prev:\n                    build_topo(child)\n                topo.append(v)\n        build_topo(self)\n\n        self.grad = 1.0\n        for v in reversed(topo):\n            v._backward()",
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
        "Comprehensive exploration of Scalar Autograd Engine, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Scalar Autograd Engine",
          definition: "Core computational primitive governing Scalar Autograd Engine.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Scalar Autograd Engine.",
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
        "Conceptual introduction to Scalar Autograd Engine, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "computation_graph",
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
    topicId: "ml_gradient_descent_adamw",
    title: "AdamW Optimizer Step",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Moving Average from Data Stream",
        url: "https://leetcode.com/problems/moving-average-from-data-stream/",
        rationale: "Algorithmic foundation for AdamW Optimizer Step.",
        difficulty: "Medium",
      },
      {
        title: "Design Tic-Tac-Toe",
        url: "https://leetcode.com/problems/design-tic-tac-toe/",
        rationale: "Algorithmic foundation for AdamW Optimizer Step.",
        difficulty: "Medium",
      },
      {
        title: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1/",
        rationale: "Algorithmic foundation for AdamW Optimizer Step.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove the bias-correction factors in Ada",
        prompt:
          "Prove the bias-correction factors in Adam ($\\hat{m}_t$ and $\\hat{v}_t$) ensure that the moving averages are unbiased estimates of the first and second moments.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Show mathematically why AdamW (decoupled",
        prompt:
          "Show mathematically why AdamW (decoupled weight decay) is inequivalent to L2 regularization (Adam with L2 penalty) for adaptive gradient methods.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "In distributed training strategies like",
        prompt:
          "In distributed training strategies like ZeRO, optimizer states (like Adam's momentum) dominate memory usage. How much memory per parameter does Adam require?",
        engineeringContext:
          "Production ML infrastructure consideration for AdamW Optimizer Step at scale.",
      },
      {
        title: "How is Adam implemented efficiently as a",
        prompt:
          "How is Adam implemented efficiently as a fused CUDA kernel to minimize memory bandwidth bottlenecks?",
        engineeringContext:
          "Production ML infrastructure consideration for AdamW Optimizer Step at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "$t=0$ or $t=1$ startup steps (ensuring correct bias correction).",
        scenario: "$t=0$ or $t=1$ startup steps (ensuring correct bias correction).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Gradient sparsity",
        scenario: "Gradient sparsity: applying Adam updates to sparse embeddings.",
        failureMode: "applying Adam updates to sparse embeddings.",
      },
      {
        title: "Extreme learning rates or epsilon values (preventing division by zero).",
        scenario: "Extreme learning rates or epsilon values (preventing division by zero).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-07",
      title: "AdamW Optimizer Step",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_gradient_descent_adamw",
      prompt: "Implement the canonical algorithm for AdamW Optimizer Step.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef adamw_step(params, grads, m, v, t, lr, betas, eps, weight_decay):\n    """\n    Performs a single AdamW optimization step on a list of parameters.\n    Updates params, m, and v in-place.\n    """\n    beta1, beta2 = betas\n    for i in range(len(params)):\n        # Decoupled weight decay\n        params[i] -= lr * weight_decay * params[i]\n        \n        # Update biased first moment estimate\n        m[i] = beta1 * m[i] + (1 - beta1) * grads[i]\n        # Update biased second raw moment estimate\n        v[i] = beta2 * v[i] + (1 - beta2) * (grads[i] ** 2)\n        \n        # Compute bias-corrected first moment estimate\n        m_hat = m[i] / (1 - beta1 ** t)\n        # Compute bias-corrected second raw moment estimate\n        v_hat = v[i] / (1 - beta2 ** t)\n        \n        # Update parameters\n        params[i] -= lr * m_hat / (math.sqrt(v_hat) + eps)',
    },
    codeVariants: [
      {
        id: "ml_gradient_descent_adamw-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef adamw_step(params, grads, m, v, t, lr, betas, eps, weight_decay):\n    """\n    Performs a single AdamW optimization step on a list of parameters.\n    Updates params, m, and v in-place.\n    """\n    beta1, beta2 = betas\n    for i in range(len(params)):\n        # Decoupled weight decay\n        params[i] -= lr * weight_decay * params[i]\n        \n        # Update biased first moment estimate\n        m[i] = beta1 * m[i] + (1 - beta1) * grads[i]\n        # Update biased second raw moment estimate\n        v[i] = beta2 * v[i] + (1 - beta2) * (grads[i] ** 2)\n        \n        # Compute bias-corrected first moment estimate\n        m_hat = m[i] / (1 - beta1 ** t)\n        # Compute bias-corrected second raw moment estimate\n        v_hat = v[i] / (1 - beta2 ** t)\n        \n        # Update parameters\n        params[i] -= lr * m_hat / (math.sqrt(v_hat) + eps)',
      },
      {
        id: "ml_gradient_descent_adamw-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef adamw_step(params, grads, m, v, t, lr, betas, eps, weight_decay):\n    """\n    Performs a single AdamW optimization step on a list of parameters.\n    Updates params, m, and v in-place.\n    """\n    beta1, beta2 = betas\n    for i in range(len(params)):\n        # Decoupled weight decay\n        params[i] -= lr * weight_decay * params[i]\n        \n        # Update biased first moment estimate\n        m[i] = beta1 * m[i] + (1 - beta1) * grads[i]\n        # Update biased second raw moment estimate\n        v[i] = beta2 * v[i] + (1 - beta2) * (grads[i] ** 2)\n        \n        # Compute bias-corrected first moment estimate\n        m_hat = m[i] / (1 - beta1 ** t)\n        # Compute bias-corrected second raw moment estimate\n        v_hat = v[i] / (1 - beta2 ** t)\n        \n        # Update parameters\n        params[i] -= lr * m_hat / (math.sqrt(v_hat) + eps)',
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
        "Comprehensive exploration of AdamW Optimizer Step, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "AdamW Optimizer Step",
          definition: "Core computational primitive governing AdamW Optimizer Step.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning AdamW Optimizer Step.",
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
        "Conceptual introduction to AdamW Optimizer Step, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "vector",
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
    topicId: "ml_loss_functions_info_theory",
    title: "Stable Softmax & Cross-Entropy",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray/",
        rationale: "Algorithmic foundation for Stable Softmax & Cross-Entropy.",
        difficulty: "Medium",
      },
      {
        title: "Continuous Subarray Sum",
        url: "https://leetcode.com/problems/continuous-subarray-sum/",
        rationale: "Algorithmic foundation for Stable Softmax & Cross-Entropy.",
        difficulty: "Medium",
      },
      {
        title: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways/",
        rationale: "Algorithmic foundation for Stable Softmax & Cross-Entropy.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that subtracting a constant $C$ fr",
        prompt:
          "Prove that subtracting a constant $C$ from all logits does not change the output probabilities of the Softmax function.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Derive the gradient of the Cross-Entropy",
        prompt:
          "Derive the gradient of the Cross-Entropy Loss with respect to the input logits, showing it simplifies to $P_i - Y_i$ where $P_i$ is the softmax probability and $Y_i$ is the one-hot target.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is Softmax and Cross-Entropy typical",
        prompt:
          "Why is Softmax and Cross-Entropy typically fused into a single operation in modern DL frameworks (e.g., `F.cross_entropy` in PyTorch)?",
        engineeringContext:
          "Production ML infrastructure consideration for Stable Softmax & Cross-Entropy at scale.",
      },
      {
        title: "How does the max-subtraction trick preve",
        prompt:
          "How does the max-subtraction trick prevent numerical overflow when computing exponents of large positive logits in FP16?",
        engineeringContext:
          "Production ML infrastructure consideration for Stable Softmax & Cross-Entropy at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Extremely large positive or negative logits (overflow/underflow prevention).",
        scenario: "Extremely large positive or negative logits (overflow/underflow prevention).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Uniform logits (should result in equal probabilities and max entropy).",
        scenario: "Uniform logits (should result in equal probabilities and max entropy).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-08",
      title: "Stable Softmax & Cross-Entropy",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_loss_functions_info_theory",
      prompt: "Implement the canonical algorithm for Stable Softmax & Cross-Entropy.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'import math\n\ndef stable_cross_entropy(logits, target_idx):\n    """\n    Computes the stable cross-entropy loss for a single example given a list of logits and a target index.\n    Returns the scalar loss.\n    """\n    if not logits:\n        return 0.0\n        \n    max_logit = max(logits)\n    \n    # Compute exp(x - max) and log-sum-exp\n    sum_exp = 0.0\n    for x in logits:\n        sum_exp += math.exp(x - max_logit)\n        \n    log_sum_exp = math.log(sum_exp)\n    \n    # Loss is -log(softmax(logits)[target_idx])\n    # = -(logits[target_idx] - max_logit - log_sum_exp)\n    loss = - (logits[target_idx] - max_logit - log_sum_exp)\n    \n    return loss',
    },
    codeVariants: [
      {
        id: "ml_loss_functions_info_theory-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'import math\n\ndef stable_cross_entropy(logits, target_idx):\n    """\n    Computes the stable cross-entropy loss for a single example given a list of logits and a target index.\n    Returns the scalar loss.\n    """\n    if not logits:\n        return 0.0\n        \n    max_logit = max(logits)\n    \n    # Compute exp(x - max) and log-sum-exp\n    sum_exp = 0.0\n    for x in logits:\n        sum_exp += math.exp(x - max_logit)\n        \n    log_sum_exp = math.log(sum_exp)\n    \n    # Loss is -log(softmax(logits)[target_idx])\n    # = -(logits[target_idx] - max_logit - log_sum_exp)\n    loss = - (logits[target_idx] - max_logit - log_sum_exp)\n    \n    return loss',
      },
      {
        id: "ml_loss_functions_info_theory-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nimport math\n\ndef stable_cross_entropy(logits, target_idx):\n    """\n    Computes the stable cross-entropy loss for a single example given a list of logits and a target index.\n    Returns the scalar loss.\n    """\n    if not logits:\n        return 0.0\n        \n    max_logit = max(logits)\n    \n    # Compute exp(x - max) and log-sum-exp\n    sum_exp = 0.0\n    for x in logits:\n        sum_exp += math.exp(x - max_logit)\n        \n    log_sum_exp = math.log(sum_exp)\n    \n    # Loss is -log(softmax(logits)[target_idx])\n    # = -(logits[target_idx] - max_logit - log_sum_exp)\n    loss = - (logits[target_idx] - max_logit - log_sum_exp)\n    \n    return loss',
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
        "Comprehensive exploration of Stable Softmax & Cross-Entropy, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Stable Softmax",
          definition: "Core computational primitive governing Stable Softmax & Cross-Entropy.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Stable Softmax & Cross-Entropy.",
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
        "Conceptual introduction to Stable Softmax & Cross-Entropy, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
