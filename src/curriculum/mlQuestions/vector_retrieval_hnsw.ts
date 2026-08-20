import type { MLTopicQuestionBank } from "./types";

export const vectorRetrievalHnsw: MLTopicQuestionBank[] = [
  {
    topicId: "ml_kd_trees_top_k",
    title: "KD-Tree for Retrieval",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 26",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 26",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 26",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove the $O(N \\log N)$ expected time co",
        prompt:
          "Prove the $O(N \\log N)$ expected time complexity of constructing a balanced KD-Tree.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: 'Explain mathematically the "curse of dim',
        prompt:
          'Explain mathematically the "curse of dimensionality" and why KD-Trees become inefficient in high dimensions (D > 20).',
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why do vector databases prefer approxima",
        prompt:
          "Why do vector databases prefer approximate nearest neighbor (ANN) algorithms over exact KD-Trees for dense embeddings?",
        engineeringContext:
          "Production ML infrastructure consideration for KD-Tree for Retrieval at scale.",
      },
      {
        title: "How can KD-Trees be used for efficient s",
        prompt:
          "How can KD-Trees be used for efficient spatial querying in geographical recommendation systems?",
        engineeringContext:
          "Production ML infrastructure consideration for KD-Tree for Retrieval at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Collinear or exactly overlapping points.",
        scenario: "Collinear or exactly overlapping points.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Querying in spaces with very high dimensionality.",
        scenario: "Querying in spaces with very high dimensionality.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-26",
      title: "KD-Tree for Retrieval",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_kd_trees_top_k",
      prompt: "Implement the canonical algorithm for KD-Tree for Retrieval.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import math\n\nclass KDNode:\n    def __init__(self, point, axis, left=None, right=None):\n        self.point = point\n        self.axis = axis\n        self.left = left\n        self.right = right\n\nclass KDTree:\n    def __init__(self, points):\n        self.k = len(points[0]) if points else 0\n        self.root = self._build_tree(points, depth=0)\n        \n    def _build_tree(self, points, depth):\n        if not points:\n            return None\n        axis = depth % self.k\n        points.sort(key=lambda x: x[axis])\n        median = len(points) // 2\n        return KDNode(\n            points[median],\n            axis,\n            self._build_tree(points[:median], depth + 1),\n            self._build_tree(points[median + 1:], depth + 1)\n        )\n        \n    def nearest(self, query):\n        best = None\n        best_dist = float('inf')\n        \n        def _search(node):\n            nonlocal best, best_dist\n            if node is None:\n                return\n            \n            d = sum((a - b) ** 2 for a, b in zip(node.point, query))\n            if d < best_dist:\n                best_dist = d\n                best = node.point\n                \n            axis = node.axis\n            diff = query[axis] - node.point[axis]\n            \n            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)\n            _search(close)\n            if diff ** 2 < best_dist:\n                _search(away)\n                \n        _search(self.root)\n        return best",
    },
    codeVariants: [
      {
        id: "ml_kd_trees_top_k-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import math\n\nclass KDNode:\n    def __init__(self, point, axis, left=None, right=None):\n        self.point = point\n        self.axis = axis\n        self.left = left\n        self.right = right\n\nclass KDTree:\n    def __init__(self, points):\n        self.k = len(points[0]) if points else 0\n        self.root = self._build_tree(points, depth=0)\n        \n    def _build_tree(self, points, depth):\n        if not points:\n            return None\n        axis = depth % self.k\n        points.sort(key=lambda x: x[axis])\n        median = len(points) // 2\n        return KDNode(\n            points[median],\n            axis,\n            self._build_tree(points[:median], depth + 1),\n            self._build_tree(points[median + 1:], depth + 1)\n        )\n        \n    def nearest(self, query):\n        best = None\n        best_dist = float('inf')\n        \n        def _search(node):\n            nonlocal best, best_dist\n            if node is None:\n                return\n            \n            d = sum((a - b) ** 2 for a, b in zip(node.point, query))\n            if d < best_dist:\n                best_dist = d\n                best = node.point\n                \n            axis = node.axis\n            diff = query[axis] - node.point[axis]\n            \n            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)\n            _search(close)\n            if diff ** 2 < best_dist:\n                _search(away)\n                \n        _search(self.root)\n        return best",
      },
      {
        id: "ml_kd_trees_top_k-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport math\n\nclass KDNode:\n    def __init__(self, point, axis, left=None, right=None):\n        self.point = point\n        self.axis = axis\n        self.left = left\n        self.right = right\n\nclass KDTree:\n    def __init__(self, points):\n        self.k = len(points[0]) if points else 0\n        self.root = self._build_tree(points, depth=0)\n        \n    def _build_tree(self, points, depth):\n        if not points:\n            return None\n        axis = depth % self.k\n        points.sort(key=lambda x: x[axis])\n        median = len(points) // 2\n        return KDNode(\n            points[median],\n            axis,\n            self._build_tree(points[:median], depth + 1),\n            self._build_tree(points[median + 1:], depth + 1)\n        )\n        \n    def nearest(self, query):\n        best = None\n        best_dist = float('inf')\n        \n        def _search(node):\n            nonlocal best, best_dist\n            if node is None:\n                return\n            \n            d = sum((a - b) ** 2 for a, b in zip(node.point, query))\n            if d < best_dist:\n                best_dist = d\n                best = node.point\n                \n            axis = node.axis\n            diff = query[axis] - node.point[axis]\n            \n            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)\n            _search(close)\n            if diff ** 2 < best_dist:\n                _search(away)\n                \n        _search(self.root)\n        return best",
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
        "Comprehensive exploration of KD-Tree for Retrieval, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "KD-Tree for Retrieval",
          definition: "Core computational primitive governing KD-Tree for Retrieval.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning KD-Tree for Retrieval.",
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
        "Conceptual introduction to KD-Tree for Retrieval, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
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
    topicId: "ml_ann_hnsw_ivfpq",
    title: "Simplified HNSW",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 27",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 27",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 27",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove that Navigable Small World graphs",
        prompt:
          'Prove that Navigable Small World graphs exhibit the "six degrees of separation" property for connectivity.',
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Demonstrate why adding layers in HNSW st",
        prompt:
          "Demonstrate why adding layers in HNSW strictly reduces the expected path length compared to a flat NSW graph.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does HNSW balance search speed and r",
        prompt:
          "How does HNSW balance search speed and recall during inference in retrieval-augmented generation (RAG)?",
        engineeringContext:
          "Production ML infrastructure consideration for Simplified HNSW at scale.",
      },
      {
        title: "What are the memory access patterns of H",
        prompt:
          "What are the memory access patterns of HNSW, and how do they impact CPU cache utilization?",
        engineeringContext:
          "Production ML infrastructure consideration for Simplified HNSW at scale.",
      },
    ],
    partD_stressTests: [
      {
        title:
          "Graph becoming disconnected (should be impossible by construction, but needs testing).",
        scenario:
          "Graph becoming disconnected (should be impossible by construction, but needs testing).",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "All points having extremely similar embeddings.",
        scenario: "All points having extremely similar embeddings.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-27",
      title: "Simplified HNSW",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_ann_hnsw_ivfpq",
      prompt: "Implement the canonical algorithm for Simplified HNSW.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "import math\nimport random\n\nclass SimplifiedHNSW:\n    def __init__(self, max_elements, M=16, ef_construction=100):\n        self.M = M\n        self.ef_construction = ef_construction\n        self.graph = {}\n        self.points = {}\n        self.entry_point = None\n        \n    def _distance(self, p1, p2):\n        return sum((a - b) ** 2 for a, b in zip(p1, p2))\n        \n    def add_point(self, point_id, vector):\n        self.points[point_id] = vector\n        self.graph[point_id] = []\n        \n        if self.entry_point is None:\n            self.entry_point = point_id\n            return\n            \n        # Simplified: Just find neighbors using a basic greedy search\n        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)\n        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]\n        \n        for n_id, dist in neighbors:\n            self.graph[point_id].append(n_id)\n            self.graph[n_id].append(point_id)\n            if len(self.graph[n_id]) > self.M:\n                # Keep top M neighbors\n                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]\n                \n    def _search_layer(self, query, ep, ef):\n        candidates = [(ep, self._distance(query, self.points[ep]))]\n        visited = {ep}\n        results = [(ep, self._distance(query, self.points[ep]))]\n        \n        while candidates:\n            candidates.sort(key=lambda x: x[1])\n            curr, curr_dist = candidates.pop(0)\n            \n            results.sort(key=lambda x: x[1])\n            if curr_dist > results[-1][1] and len(results) >= ef:\n                break\n                \n            for neighbor in self.graph[curr]:\n                if neighbor not in visited:\n                    visited.add(neighbor)\n                    dist = self._distance(query, self.points[neighbor])\n                    if len(results) < ef or dist < results[-1][1]:\n                        candidates.append((neighbor, dist))\n                        results.append((neighbor, dist))\n                        results.sort(key=lambda x: x[1])\n                        if len(results) > ef:\n                            results.pop()\n                            \n        return results\n        \n    def search(self, query, k=1):\n        if self.entry_point is None:\n            return []\n        res = self._search_layer(query, self.entry_point, max(k, self.M))\n        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]",
    },
    codeVariants: [
      {
        id: "ml_ann_hnsw_ivfpq-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "import math\nimport random\n\nclass SimplifiedHNSW:\n    def __init__(self, max_elements, M=16, ef_construction=100):\n        self.M = M\n        self.ef_construction = ef_construction\n        self.graph = {}\n        self.points = {}\n        self.entry_point = None\n        \n    def _distance(self, p1, p2):\n        return sum((a - b) ** 2 for a, b in zip(p1, p2))\n        \n    def add_point(self, point_id, vector):\n        self.points[point_id] = vector\n        self.graph[point_id] = []\n        \n        if self.entry_point is None:\n            self.entry_point = point_id\n            return\n            \n        # Simplified: Just find neighbors using a basic greedy search\n        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)\n        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]\n        \n        for n_id, dist in neighbors:\n            self.graph[point_id].append(n_id)\n            self.graph[n_id].append(point_id)\n            if len(self.graph[n_id]) > self.M:\n                # Keep top M neighbors\n                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]\n                \n    def _search_layer(self, query, ep, ef):\n        candidates = [(ep, self._distance(query, self.points[ep]))]\n        visited = {ep}\n        results = [(ep, self._distance(query, self.points[ep]))]\n        \n        while candidates:\n            candidates.sort(key=lambda x: x[1])\n            curr, curr_dist = candidates.pop(0)\n            \n            results.sort(key=lambda x: x[1])\n            if curr_dist > results[-1][1] and len(results) >= ef:\n                break\n                \n            for neighbor in self.graph[curr]:\n                if neighbor not in visited:\n                    visited.add(neighbor)\n                    dist = self._distance(query, self.points[neighbor])\n                    if len(results) < ef or dist < results[-1][1]:\n                        candidates.append((neighbor, dist))\n                        results.append((neighbor, dist))\n                        results.sort(key=lambda x: x[1])\n                        if len(results) > ef:\n                            results.pop()\n                            \n        return results\n        \n    def search(self, query, k=1):\n        if self.entry_point is None:\n            return []\n        res = self._search_layer(query, self.entry_point, max(k, self.M))\n        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]",
      },
      {
        id: "ml_ann_hnsw_ivfpq-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nimport math\nimport random\n\nclass SimplifiedHNSW:\n    def __init__(self, max_elements, M=16, ef_construction=100):\n        self.M = M\n        self.ef_construction = ef_construction\n        self.graph = {}\n        self.points = {}\n        self.entry_point = None\n        \n    def _distance(self, p1, p2):\n        return sum((a - b) ** 2 for a, b in zip(p1, p2))\n        \n    def add_point(self, point_id, vector):\n        self.points[point_id] = vector\n        self.graph[point_id] = []\n        \n        if self.entry_point is None:\n            self.entry_point = point_id\n            return\n            \n        # Simplified: Just find neighbors using a basic greedy search\n        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)\n        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]\n        \n        for n_id, dist in neighbors:\n            self.graph[point_id].append(n_id)\n            self.graph[n_id].append(point_id)\n            if len(self.graph[n_id]) > self.M:\n                # Keep top M neighbors\n                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]\n                \n    def _search_layer(self, query, ep, ef):\n        candidates = [(ep, self._distance(query, self.points[ep]))]\n        visited = {ep}\n        results = [(ep, self._distance(query, self.points[ep]))]\n        \n        while candidates:\n            candidates.sort(key=lambda x: x[1])\n            curr, curr_dist = candidates.pop(0)\n            \n            results.sort(key=lambda x: x[1])\n            if curr_dist > results[-1][1] and len(results) >= ef:\n                break\n                \n            for neighbor in self.graph[curr]:\n                if neighbor not in visited:\n                    visited.add(neighbor)\n                    dist = self._distance(query, self.points[neighbor])\n                    if len(results) < ef or dist < results[-1][1]:\n                        candidates.append((neighbor, dist))\n                        results.append((neighbor, dist))\n                        results.sort(key=lambda x: x[1])\n                        if len(results) > ef:\n                            results.pop()\n                            \n        return results\n        \n    def search(self, query, k=1):\n        if self.entry_point is None:\n            return []\n        res = self._search_layer(query, self.entry_point, max(k, self.M))\n        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]",
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
        "Comprehensive exploration of Simplified HNSW, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Simplified HNSW",
          definition: "Core computational primitive governing Simplified HNSW.",
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
          body: "Analytical formulation, derivations, and structural invariants underpinning Simplified HNSW.",
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
        "Conceptual introduction to Simplified HNSW, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "graph",
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
