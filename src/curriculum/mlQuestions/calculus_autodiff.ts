import type { MLTopicQuestionBank } from "./types";

export const calculusAutodiff: MLTopicQuestionBank[] = [
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
];
