import { MLTopicQuestionBank } from "./types";

export const domain01to05: MLTopicQuestionBank[] = [
  {
    topicId: "01",
    title: "Multi-dimensional Array Indexing & Strides",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Reshape the Matrix",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "",
      },
      {
        title: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "",
      },
      {
        title: "Diagonal Traverse",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "",
      },
      {
        title: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that for a contiguous C-order array of shape $(d_1, d_2, \\ldots, d_n)$, the stride $s_i$ for dimension $i$ is given by $s_i = \\prod_{j=i+1}^n d_j$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that an array shape and strides combination represents a set of overlapping memory elements if and only if there exists a valid index arithmetic collision.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How does PyTorch represent tensor views (e.g., after `transpose`) without copying data? Explain the role of strides and offsets.",
      },
      {
        title: "Systems Question",
        prompt:
          "In CUDA or custom C++ kernels, why is contiguous memory access critical for performance, and how do non-contiguous strides impact memory coalescing?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario:
          "Zero-dimensional tensors (scalars): ensure strides and shapes are handled correctly.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Dimensions of size 1: test stride behaviors when broadcasting or squeezing.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-01",
      title: "Executable Contract for Multi-dimensional Array Indexing & Strides",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def compute_offset(index, shape, strides):\n    """\n    Computes the flat memory offset for a multidimensional index.\n    """\n    if len(index) != len(shape) or len(index) != len(strides):\n        raise ValueError("Length of index, shape, and strides must match.")\n    offset = 0\n    for i, s, st in zip(index, shape, strides):\n        if i < 0 or i >= s:\n            raise IndexError("Index out of bounds.")\n        offset += i * st\n    return offset',
    },
  },
  {
    topicId: "02",
    title: "Broadcasting Semantics",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array With Elements Not Equal to Average of Neighbors",
        url: "https://leetcode.com/problems/array-with-elements-not-equal-to-average-of-neighbors/",
        rationale: "Adapted for broadcasting rules",
      },
      {
        title: "Valid Boomerang",
        url: "https://leetcode.com/problems/valid-boomerang/",
        rationale: "",
      },
      {
        title: "Construct Target Array With Multiple Sums",
        url: "https://leetcode.com/problems/construct-target-array-with-multiple-sums/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the broadcasted shape of two tensors $A$ and $B$ is uniquely determined by the standard NumPy broadcasting rules or fails.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove the associativity of broadcasting: $Broadcast(Broadcast(A, B), C) = Broadcast(A, Broadcast(B, C))$.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How does broadcasting save memory during forward passes in neural networks? Provide an example with adding bias to a batched matrix multiplication.",
      },
      {
        title: "Systems Question",
        prompt:
          "Explain how implicit broadcasting is implemented in optimized backends like XLA or cuDNN.",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Broadcasting a scalar with a high-dimensional tensor.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Incompatible shapes (e.g., `(3, 4)` and `(3, 5)`).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Broadcasting arrays with many dimensions of size 1.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-02",
      title: "Executable Contract for Broadcasting Semantics",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def broadcast_shapes(shape1, shape2):\n    """\n    Returns the broadcasted shape of two array shapes, or raises ValueError if incompatible.\n    """\n    res = []\n    len1, len2 = len(shape1), len(shape2)\n    max_len = max(len1, len2)\n    s1 = (1,) * (max_len - len1) + tuple(shape1)\n    s2 = (1,) * (max_len - len2) + tuple(shape2)\n    for dim1, dim2 in zip(s1, s2):\n        if dim1 == dim2:\n            res.append(dim1)\n        elif dim1 == 1:\n            res.append(dim2)\n        elif dim2 == 1:\n            res.append(dim1)\n        else:\n            raise ValueError(f"Incompatible shapes for broadcasting: {shape1} and {shape2}")\n    return tuple(res)',
    },
  },
  {
    topicId: "03",
    title: "Orthogonalization & Gram-Schmidt",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Valid Square",
        url: "https://leetcode.com/problems/valid-square/",
        rationale: "",
      },
      {
        title: "Max Points on a Line",
        url: "https://leetcode.com/problems/max-points-on-a-line/",
        rationale: "",
      },
      {
        title: "Minimum Area Rectangle",
        url: "https://leetcode.com/problems/minimum-area-rectangle/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the vectors produced by the Gram-Schmidt process are mutually orthogonal.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the span of the first $k$ orthogonalized vectors equals the span of the first $k$ original vectors.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "Why is the modified Gram-Schmidt process preferred over the classical Gram-Schmidt process for numerical stability in floating-point arithmetic?",
      },
      {
        title: "Systems Question",
        prompt:
          "How is orthogonalization used in maintaining the stability of recurrent neural networks (e.g., orthogonal initialization)?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Linearly dependent input vectors (should result in zero vectors).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Almost collinear vectors (stress tests numerical stability).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-03",
      title: "Executable Contract for Orthogonalization & Gram-Schmidt",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import math\n\ndef dot_product(v1, v2):\n    return sum(x * y for x, y in zip(v1, v2))\n\ndef scalar_mult(c, v):\n    return [c * x for x in v]\n\ndef vector_sub(v1, v2):\n    return [x - y for x, y in zip(v1, v2)]\n\ndef gram_schmidt(vectors):\n    """\n    Performs modified Gram-Schmidt orthogonalization on a list of vectors.\n    Returns a list of orthogonal (not necessarily normalized) vectors.\n    """\n    if not vectors:\n        return []\n    u = []\n    for v in vectors:\n        current_u = list(v)\n        for prev_u in u:\n            prev_u_dot = dot_product(prev_u, prev_u)\n            if prev_u_dot < 1e-12:\n                continue\n            proj_coef = dot_product(current_u, prev_u) / prev_u_dot\n            proj = scalar_mult(proj_coef, prev_u)\n            current_u = vector_sub(current_u, proj)\n        u.append(current_u)\n    return u',
    },
  },
  {
    topicId: "04",
    title: "Eigendecomposition & Power Iteration",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Sort Integers by The Power Value",
        url: "https://leetcode.com/problems/sort-integers-by-the-power-value/",
        rationale: "Adapted for iterative processes",
      },
      {
        title: "Pow(x, n)",
        url: "https://leetcode.com/problems/powx-n/",
        rationale: "",
      },
      {
        title: "Find the Duplicate Number",
        url: "https://leetcode.com/problems/find-the-duplicate-number/",
        rationale: "Cycle detection as a spectral property analogy",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the power iteration method converges to the dominant eigenvector for a diagonalizable matrix with a strictly dominant eigenvalue.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove the rate of convergence of power iteration depends on the ratio $|\\lambda_2| / |\\lambda_1|$.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How is power iteration used in computing Spectral Normalization for Generative Adversarial Networks (GANs)?",
      },
      {
        title: "Systems Question",
        prompt:
          "Why is full eigendecomposition computationally prohibitive for large ML weight matrices, and when are iterative approximations preferred?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Matrices with multiple dominant eigenvalues (e.g., $\\lambda_1 = -\\lambda_2$).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Zero matrix or identity matrix (ensures valid fallback behavior).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-04",
      title: "Executable Contract for Eigendecomposition & Power Iteration",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import math\n\ndef mat_vec_mul(X, v):\n    res = []\n    for row in X:\n        res.append(sum(r * val for r, val in zip(row, v)))\n    return res\n\ndef normalize(v):\n    norm = math.sqrt(sum(x * x for x in v))\n    if norm < 1e-12:\n        return v\n    return [x / norm for x in v]\n\ndef top_principal_component(X, num_iterations):\n    """\n    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.\n    X is a list of lists representing a matrix.\n    Returns the dominant eigenvector as a normalized list.\n    """\n    if not X or not X[0]:\n        return []\n    rows = len(X)\n    cols = len(X[0])\n    \n    # Compute covariance matrix C = X^T X\n    C = [[0.0] * cols for _ in range(cols)]\n    for i in range(cols):\n        for j in range(cols):\n            val = sum(X[k][i] * X[k][j] for k in range(rows))\n            C[i][j] = val\n            \n    # Initialize random vector (or all ones)\n    b_k = [1.0] * cols\n    b_k = normalize(b_k)\n    \n    for _ in range(num_iterations):\n        b_k1 = mat_vec_mul(C, b_k)\n        b_k = normalize(b_k1)\n        \n    return b_k',
    },
  },
  {
    topicId: "05",
    title: "Finite Differences & Numerical Jacobians",
    domain: "Calculus & Optimization",
    partA_dsaCoding: [
      {
        title: "Evaluate Reverse Polish Notation",
        url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
        rationale: "",
      },
      {
        title: "Basic Calculator",
        url: "https://leetcode.com/problems/basic-calculator/",
        rationale: "",
      },
      {
        title: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the central difference method has an error of $O(h^2)$, while forward difference has an error of $O(h)$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show that numerical differentiation is highly sensitive to catastrophic cancellation for very small $h$ in floating-point representation.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "When debugging custom CUDA autograd kernels, how is numerical gradient checking (gradcheck) implemented using finite differences?",
      },
      {
        title: "Systems Question",
        prompt:
          "What are the performance trade-offs of using numerical Jacobians versus analytical Jacobians via reverse-mode autodiff?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario:
          "Highly non-linear functions where finite difference fails to approximate local gradients accurately.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Step functions or functions with discontinuous derivatives (e.g., ReLU at 0).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-05",
      title: "Executable Contract for Finite Differences & Numerical Jacobians",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def compute_jacobian(f, x, h=1e-5):\n    """\n    Computes the numerical Jacobian of a vector-valued function f at vector x using central differences.\n    Returns a list of lists representing the Jacobian matrix.\n    """\n    n = len(x)\n    # Get the output dimension\n    fx = f(x)\n    m = len(fx)\n    \n    jacobian = [[0.0] * n for _ in range(m)]\n    \n    for j in range(n):\n        x_plus = list(x)\n        x_minus = list(x)\n        x_plus[j] += h\n        x_minus[j] -= h\n        \n        f_plus = f(x_plus)\n        f_minus = f(x_minus)\n        \n        for i in range(m):\n            jacobian[i][j] = (f_plus[i] - f_minus[i]) / (2 * h)\n            \n    return jacobian',
    },
  },
  {
    topicId: "06",
    title: "Scalar Autograd Engine",
    domain: "Calculus & Optimization",
    partA_dsaCoding: [
      {
        title: "Design a Graph With Shortest Path Calculator",
        url: "https://leetcode.com/problems/design-graph-with-shortest-path-calculator/",
        rationale: "Topological sort analogy",
      },
      {
        title: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule/",
        rationale: "",
      },
      {
        title: "Find Eventual Safe States",
        url: "https://leetcode.com/problems/find-eventual-safe-states/",
        rationale: "",
      },
      {
        title: "Clone Graph",
        url: "https://leetcode.com/problems/clone-graph/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove the chain rule of calculus over computational graphs (multivariable chain rule).",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that reverse-mode automatic differentiation computes the gradient of a scalar output with respect to $N$ inputs in a single backward pass, taking $O(1)$ times the forward pass cost.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How does PyTorch construct a dynamic computational graph during the forward pass? Compare this with static graph construction in TensorFlow v1 or XLA.",
      },
      {
        title: "Systems Question",
        prompt:
          "Why must gradients be explicitly zeroed out (e.g., `optimizer.zero_grad()`) in most deep learning frameworks?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario:
          "Re-using the same node multiple times in the graph (handling accumulating gradients).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Empty graphs or operations with no dependencies.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "In-place operations and their effect on gradient tracking.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-06",
      title: "Executable Contract for Scalar Autograd Engine",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        "class Value:\n    \"\"\"\n    A simple scalar autograd engine tracking computation graphs.\n    \"\"\"\n    def __init__(self, data, _children=(), _op=''):\n        self.data = data\n        self.grad = 0.0\n        self._backward = lambda: None\n        self._prev = set(_children)\n        self._op = _op\n\n    def __add__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data + other.data, (self, other), '+')\n\n        def _backward():\n            self.grad += out.grad\n            other.grad += out.grad\n        out._backward = _backward\n\n        return out\n\n    def __mul__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data * other.data, (self, other), '*')\n\n        def _backward():\n            self.grad += other.data * out.grad\n            other.grad += self.data * out.grad\n        out._backward = _backward\n\n        return out\n\n    def backward(self):\n        topo = []\n        visited = set()\n        def build_topo(v):\n            if v not in visited:\n                visited.add(v)\n                for child in v._prev:\n                    build_topo(child)\n                topo.append(v)\n        build_topo(self)\n\n        self.grad = 1.0\n        for v in reversed(topo):\n            v._backward()",
    },
  },
  {
    topicId: "07",
    title: "AdamW Optimizer Step",
    domain: "Calculus & Optimization",
    partA_dsaCoding: [
      {
        title: "Moving Average from Data Stream",
        url: "https://leetcode.com/problems/moving-average-from-data-stream/",
        rationale: "Analogy to EMA of gradients",
      },
      {
        title: "Design Tic-Tac-Toe",
        url: "https://leetcode.com/problems/design-tic-tac-toe/",
        rationale: "State management",
      },
      {
        title: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove the bias-correction factors in Adam ($\\hat{m}_t$ and $\\hat{v}_t$) ensure that the moving averages are unbiased estimates of the first and second moments.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show mathematically why AdamW (decoupled weight decay) is inequivalent to L2 regularization (Adam with L2 penalty) for adaptive gradient methods.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "In distributed training strategies like ZeRO, optimizer states (like Adam's momentum) dominate memory usage. How much memory per parameter does Adam require?",
      },
      {
        title: "Systems Question",
        prompt:
          "How is Adam implemented efficiently as a fused CUDA kernel to minimize memory bandwidth bottlenecks?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "$t=0$ or $t=1$ startup steps (ensuring correct bias correction).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Gradient sparsity: applying Adam updates to sparse embeddings.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Extreme learning rates or epsilon values (preventing division by zero).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-07",
      title: "Executable Contract for AdamW Optimizer Step",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import math\n\ndef adamw_step(params, grads, m, v, t, lr, betas, eps, weight_decay):\n    """\n    Performs a single AdamW optimization step on a list of parameters.\n    Updates params, m, and v in-place.\n    """\n    beta1, beta2 = betas\n    for i in range(len(params)):\n        # Decoupled weight decay\n        params[i] -= lr * weight_decay * params[i]\n        \n        # Update biased first moment estimate\n        m[i] = beta1 * m[i] + (1 - beta1) * grads[i]\n        # Update biased second raw moment estimate\n        v[i] = beta2 * v[i] + (1 - beta2) * (grads[i] ** 2)\n        \n        # Compute bias-corrected first moment estimate\n        m_hat = m[i] / (1 - beta1 ** t)\n        # Compute bias-corrected second raw moment estimate\n        v_hat = v[i] / (1 - beta2 ** t)\n        \n        # Update parameters\n        params[i] -= lr * m_hat / (math.sqrt(v_hat) + eps)',
    },
  },
  {
    topicId: "08",
    title: "Stable Softmax & Cross-Entropy",
    domain: "Calculus & Optimization",
    partA_dsaCoding: [
      {
        title: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray/",
        rationale: "Log-sum-exp stability analogy",
      },
      {
        title: "Continuous Subarray Sum",
        url: "https://leetcode.com/problems/continuous-subarray-sum/",
        rationale: "",
      },
      {
        title: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that subtracting a constant $C$ from all logits does not change the output probabilities of the Softmax function.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Derive the gradient of the Cross-Entropy Loss with respect to the input logits, showing it simplifies to $P_i - Y_i$ where $P_i$ is the softmax probability and $Y_i$ is the one-hot target.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "Why is Softmax and Cross-Entropy typically fused into a single operation in modern DL frameworks (e.g., `F.cross_entropy` in PyTorch)?",
      },
      {
        title: "Systems Question",
        prompt:
          "How does the max-subtraction trick prevent numerical overflow when computing exponents of large positive logits in FP16?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Extremely large positive or negative logits (overflow/underflow prevention).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Uniform logits (should result in equal probabilities and max entropy).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-08",
      title: "Executable Contract for Stable Softmax & Cross-Entropy",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import math\n\ndef stable_cross_entropy(logits, target_idx):\n    """\n    Computes the stable cross-entropy loss for a single example given a list of logits and a target index.\n    Returns the scalar loss.\n    """\n    if not logits:\n        return 0.0\n        \n    max_logit = max(logits)\n    \n    # Compute exp(x - max) and log-sum-exp\n    sum_exp = 0.0\n    for x in logits:\n        sum_exp += math.exp(x - max_logit)\n        \n    log_sum_exp = math.log(sum_exp)\n    \n    # Loss is -log(softmax(logits)[target_idx])\n    # = -(logits[target_idx] - max_logit - log_sum_exp)\n    loss = - (logits[target_idx] - max_logit - log_sum_exp)\n    \n    return loss',
    },
  },
  {
    topicId: "09",
    title: "Covariance & Correlation",
    domain: "Probability and Statistics",
    partA_dsaCoding: [
      {
        title: "Implement Rand10() Using Rand7()",
        url: "https://leetcode.com/problems/implement-rand10-using-rand7/",
        rationale: "",
      },
      {
        title: "Maximum Subarray Sum with One Deletion",
        url: "https://leetcode.com/problems/maximum-subarray-sum-with-one-deletion/",
        rationale: "",
      },
      {
        title: "Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight/",
        rationale: "",
      },
      {
        title: "Linked List Random Node",
        url: "https://leetcode.com/problems/linked-list-random-node/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt: "Prove that correlation coefficient is between -1 and 1.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Prove the linearity of expectation: E[X+Y] = E[X] + E[Y].",
      },
      {
        title: "Mathematical Proof",
        prompt: "Prove that covariance is symmetric and bilinear.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt: "How do you efficiently update the covariance matrix for a streaming dataset?",
      },
      {
        title: "Systems Question",
        prompt:
          "How does high feature correlation affect the condition number of the design matrix in OLS?",
      },
      {
        title: "Systems Question",
        prompt:
          "What are the memory and computational tradeoffs of computing a full correlation matrix for a billion-scale embedding matrix?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario:
          "X and Y are completely independent but non-linear (e.g. Y = X^2 where X is symmetric around 0) - what is the covariance?",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Constant variables where variance is 0 (divide by zero issue for correlation).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Precision loss when calculating sample variance with large floats.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-09",
      title: "Executable Contract for Covariance & Correlation",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def calculate_covariance(x, y):\n    """\n    Calculates the sample covariance of two lists x and y.\n    """\n    if len(x) != len(y) or len(x) <= 1:\n        raise ValueError("x and y must have same length > 1")\n    \n    n = len(x)\n    mean_x = sum(x) / n\n    mean_y = sum(y) / n\n    \n    covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n)) / (n - 1)\n    return covariance',
    },
  },
  {
    topicId: "10",
    title: "Bayesian Inference",
    domain: "Probability and Statistics",
    partA_dsaCoding: [
      {
        title: "Probability of a Two Boxes Having The Same Number of Distinct Balls",
        url: "https://leetcode.com/problems/probability-of-a-two-boxes-having-the-same-number-of-distinct-balls/",
        rationale: "",
      },
      {
        title: "New 21 Game",
        url: "https://leetcode.com/problems/new-21-game/",
        rationale: "",
      },
      {
        title: "Soup Servings",
        url: "https://leetcode.com/problems/soup-servings/",
        rationale: "",
      },
      {
        title: "Knight Probability in Chessboard",
        url: "https://leetcode.com/problems/knight-probability-in-chessboard/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt: "Derive Bayes' theorem from conditional probability definition.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Prove that the posterior is proportional to the likelihood times the prior.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show that Gaussian Naive Bayes provides a linear decision boundary if class variances are equal.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "In a Naive Bayes spam filter, how do you handle out-of-vocabulary words in production?",
      },
      {
        title: "Systems Question",
        prompt: "Why do we compute log probabilities instead of raw probabilities?",
      },
      {
        title: "Systems Question",
        prompt:
          "How do you implement Bayesian updating for CTR (click-through rate) prediction at scale?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario:
          "Handling zero probability for a feature given a class (requires Laplace smoothing).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario:
          "Extreme prior imbalance leading to one class dominating completely regardless of likelihood.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-10",
      title: "Executable Contract for Bayesian Inference",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import math\n\ndef naive_bayes_predict_log_proba(class_priors, feature_probs, sample):\n    """\n    Predicts the log probability for each class given a sample.\n    \n    class_priors: dict mapping class -> prior probability\n    feature_probs: dict mapping class -> dict of feature -> probability\n    sample: list of features\n    \n    Returns dict mapping class -> unnormalized log posterior\n    """\n    log_posteriors = {}\n    for c, prior in class_priors.items():\n        if prior <= 0:\n            log_posteriors[c] = float(\'-inf\')\n            continue\n        \n        log_prob = math.log(prior)\n        for feature in sample:\n            prob = feature_probs.get(c, {}).get(feature, 1e-9) # simple smoothing\n            log_prob += math.log(prob)\n        log_posteriors[c] = log_prob\n        \n    return log_posteriors',
    },
  },
  {
    topicId: "11",
    title: "Sampling & Bootstrap",
    domain: "Probability and Statistics",
    partA_dsaCoding: [
      {
        title: "Linked List Random Node",
        url: "https://leetcode.com/problems/linked-list-random-node/",
        rationale: "",
      },
      {
        title: "Random Pick Index",
        url: "https://leetcode.com/problems/random-pick-index/",
        rationale: "",
      },
      {
        title: "Generate Random Point in a Circle",
        url: "https://leetcode.com/problems/generate-random-point-in-a-circle/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the probability of a specific item NOT being chosen in a bootstrap sample of size N approaches 1/e as N goes to infinity.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Prove the unbiasedness of reservoir sampling.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt: "How do you implement distributed reservoir sampling across multiple nodes?",
      },
      {
        title: "Systems Question",
        prompt: "In random forest training, how does bootstrapping help reduce model variance?",
      },
      {
        title: "Systems Question",
        prompt:
          "How do you ensure reproducibility when using stochastic sampling methods in production ML pipelines?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Bootstrapping a dataset with highly imbalanced classes without stratification.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Confidence interval calculation when the metric has extremely high variance.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-11",
      title: "Executable Contract for Sampling & Bootstrap",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import random\n\ndef bootstrap_confidence_interval(data, num_bootstraps, confidence_level):\n    """\n    Calculates the bootstrap confidence interval for the mean.\n    """\n    if not data:\n        raise ValueError("Data cannot be empty")\n        \n    n = len(data)\n    means = []\n    \n    for _ in range(num_bootstraps):\n        sample = [random.choice(data) for _ in range(n)]\n        means.append(sum(sample) / n)\n        \n    means.sort()\n    \n    alpha = 1.0 - confidence_level\n    lower_idx = int(num_bootstraps * (alpha / 2))\n    upper_idx = int(num_bootstraps * (1 - alpha / 2))\n    \n    return means[lower_idx], means[min(upper_idx, num_bootstraps - 1)]',
    },
  },
  {
    topicId: "12",
    title: "Distributions & LLM Sampling",
    domain: "Probability and Statistics",
    partA_dsaCoding: [
      {
        title: "Design an ATM Machine",
        url: "https://leetcode.com/problems/design-an-atm-machine/",
        rationale: "",
      },
      {
        title: "Shuffle an Array",
        url: "https://leetcode.com/problems/shuffle-an-array/",
        rationale: "",
      },
      {
        title: "Random Point in Non-overlapping Rectangles",
        url: "https://leetcode.com/problems/random-point-in-non-overlapping-rectangles/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Show that applying temperature T to softmax changes the entropy of the resulting distribution.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that top-p sampling correctly truncates the tail of a probability distribution while maintaining valid probabilities after rescaling.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How is top-p and top-k filtering implemented efficiently on GPUs during LLM generation?",
      },
      {
        title: "Systems Question",
        prompt: "What happens to the generation quality if temperature is set to 0 vs 2.0?",
      },
      {
        title: "Systems Question",
        prompt:
          "How do you handle sampling bottlenecks when serving large vocabulary language models?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "p is 0.0 or 1.0.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Multiple tokens having the exact same probability bridging the top-p threshold.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-12",
      title: "Executable Contract for Distributions & LLM Sampling",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def top_p_filtering(probs, p):\n    """\n    Applies top-p (nucleus) filtering to a probability distribution.\n    \n    probs: dict mapping token_id -> probability\n    p: cumulative probability threshold\n    \n    Returns filtered probabilities normalized to sum to 1\n    """\n    if p < 0 or p > 1:\n        raise ValueError("p must be between 0 and 1")\n        \n    sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)\n    \n    cumulative_prob = 0.0\n    filtered_probs = {}\n    \n    for token_id, prob in sorted_probs:\n        filtered_probs[token_id] = prob\n        cumulative_prob += prob\n        if cumulative_prob >= p:\n            break\n            \n    if not filtered_probs:\n        return {}\n        \n    total = sum(filtered_probs.values())\n    for token_id in filtered_probs:\n        filtered_probs[token_id] /= total\n        \n    return filtered_probs',
    },
  },
  {
    topicId: "13",
    title: "Linear & Logistic Regression",
    domain: "Classical ML and Data Science",
    partA_dsaCoding: [
      {
        title: "Best Position for a Service Centre",
        url: "https://leetcode.com/problems/best-position-for-a-service-centre/",
        rationale: "",
      },
      {
        title: "Maximum Number of Visible Points",
        url: "https://leetcode.com/problems/maximum-number-of-visible-points/",
        rationale: "",
      },
      {
        title: "Minimum Cost to Make Array Equal",
        url: "https://leetcode.com/problems/minimum-cost-to-make-array-equal/",
        rationale: "",
      },
      {
        title: "Valid Square",
        url: "https://leetcode.com/problems/valid-square/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Derive the gradient of the binary cross-entropy loss with respect to the weights in logistic regression.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Prove that the logistic regression objective is convex.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Show that Ordinary Least Squares (OLS) has a closed-form solution.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How does feature scaling affect the convergence of Gradient Descent in Logistic Regression?",
      },
      {
        title: "Systems Question",
        prompt:
          "Explain the difference in implementation and convergence for full-batch GD vs SGD for regression models.",
      },
      {
        title: "Systems Question",
        prompt:
          "What is the impact of multi-collinearity on OLS and how does L2 regularization solve it?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario:
          "Perfectly separable data causing weights to diverge to infinity (complete separation).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Extremely high learning rate causing divergence.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Dataset with more features than samples (p > n).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-13",
      title: "Executable Contract for Linear & Logistic Regression",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import math\n\ndef sigmoid(z):\n    if z < -100:\n        return 0.0\n    if z > 100:\n        return 1.0\n    return 1.0 / (1.0 + math.exp(-z))\n\ndef logistic_regression_gd(X, y, lr, iterations):\n    """\n    Performs gradient descent for logistic regression.\n    X: list of lists (samples x features)\n    y: list of binary labels (0 or 1)\n    lr: learning rate\n    iterations: number of epochs\n    \n    Returns: list of weights\n    """\n    if not X or not X[0]:\n        return []\n    \n    n_samples = len(X)\n    n_features = len(X[0])\n    weights = [0.0] * n_features\n    \n    for _ in range(iterations):\n        gradients = [0.0] * n_features\n        for i in range(n_samples):\n            z = sum(X[i][j] * weights[j] for j in range(n_features))\n            pred = sigmoid(z)\n            error = pred - y[i]\n            \n            for j in range(n_features):\n                gradients[j] += error * X[i][j]\n                \n        for j in range(n_features):\n            weights[j] -= lr * (gradients[j] / n_samples)\n            \n    return weights',
    },
  },
  {
    topicId: "14",
    title: "Decision Trees & Forests",
    domain: "Classical ML and Data Science",
    partA_dsaCoding: [
      {
        title: "Construct Binary Tree from Preorder and Inorder Traversal",
        url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
        rationale: "",
      },
      {
        title: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
        rationale: "",
      },
      {
        title: "Maximum Depth of Binary Tree",
        url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt: "Prove that the Gini impurity is maximum when classes are perfectly balanced.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Show that Information Gain is always non-negative.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that deep unpruned decision trees can perfectly memorize any training dataset with distinct features.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How do you efficiently find the best split for continuous features without sorting the entire dataset repeatedly?",
      },
      {
        title: "Systems Question",
        prompt:
          "Why is Random Forest typically highly parallelizable, and how is it implemented across multiple workers?",
      },
      {
        title: "Systems Question",
        prompt:
          "How is memory managed when building deep decision trees on datasets larger than RAM?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Dataset where all features have the exact same value but target labels differ.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Dataset with only a single sample.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-14",
      title: "Executable Contract for Decision Trees & Forests",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def gini_impurity(y):\n    if not y:\n        return 0.0\n    counts = {}\n    for label in y:\n        counts[label] = counts.get(label, 0) + 1\n    \n    impurity = 1.0\n    for count in counts.values():\n        prob = count / len(y)\n        impurity -= prob ** 2\n    return impurity\n\ndef find_best_split_gini(X, y):\n    """\n    Finds the best split (feature index, threshold) based on Gini impurity.\n    X: list of lists (samples x features), continuous features\n    y: list of labels\n    \n    Returns: (best_feature_idx, best_threshold)\n    """\n    n_samples = len(X)\n    n_features = len(X[0]) if n_samples > 0 else 0\n    \n    best_gini = float(\'inf\')\n    best_split = (None, None)\n    \n    for feature_idx in range(n_features):\n        feature_values = sorted(set(X[i][feature_idx] for i in range(n_samples)))\n        \n        for i in range(len(feature_values) - 1):\n            threshold = (feature_values[i] + feature_values[i+1]) / 2.0\n            \n            left_y = [y[j] for j in range(n_samples) if X[j][feature_idx] <= threshold]\n            right_y = [y[j] for j in range(n_samples) if X[j][feature_idx] > threshold]\n            \n            if not left_y or not right_y:\n                continue\n                \n            gini_left = gini_impurity(left_y)\n            gini_right = gini_impurity(right_y)\n            \n            weighted_gini = (len(left_y) * gini_left + len(right_y) * gini_right) / n_samples\n            \n            if weighted_gini < best_gini:\n                best_gini = weighted_gini\n                best_split = (feature_idx, threshold)\n                \n    return best_split',
    },
  },
  {
    topicId: "15",
    title: "Gradient Boosting",
    domain: "Classical ML and Data Science",
    partA_dsaCoding: [
      {
        title: "Binary Tree Maximum Path Sum",
        url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
        rationale: "",
      },
      {
        title: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
        rationale: "",
      },
      {
        title: "Binary Search Tree Iterator",
        url: "https://leetcode.com/problems/binary-search-tree-iterator/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Derive the optimal leaf weight formula in XGBoost using the second-order Taylor expansion of the loss function.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove the split gain formula for a given node in XGBoost based on gradients and hessians.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt: "How does XGBoost handle missing values during training?",
      },
      {
        title: "Systems Question",
        prompt: "What is histogram-based splitting in LightGBM and how does it speed up training?",
      },
      {
        title: "Systems Question",
        prompt:
          "Discuss the differences between level-wise (XGBoost) and leaf-wise (LightGBM) tree growth.",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Sum of hessians in a node is less than min_child_weight.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Large regularization parameter lambda causing splits to yield negative gain.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-15",
      title: "Executable Contract for Gradient Boosting",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def xgboost_exact_split_gain(g, h, l2_reg, min_child_weight):\n    """\n    Calculates the maximum split gain for a set of gradients and hessians.\n    """\n    n = len(g)\n    G = sum(g)\n    H = sum(h)\n    \n    if H < 2 * min_child_weight:\n        return 0.0\n        \n    best_gain = 0.0\n    G_left = 0.0\n    H_left = 0.0\n    \n    for i in range(n - 1):\n        G_left += g[i]\n        H_left += h[i]\n        \n        G_right = G - G_left\n        H_right = H - H_left\n        \n        if H_left < min_child_weight or H_right < min_child_weight:\n            continue\n            \n        gain = (G_left**2 / (H_left + l2_reg)) + (G_right**2 / (H_right + l2_reg)) - (G**2 / (H + l2_reg))\n        gain = 0.5 * gain\n        \n        if gain > best_gain:\n            best_gain = gain\n            \n    return best_gain',
    },
  },
  {
    topicId: "16",
    title: "K-Means & Clustering",
    domain: "Classical ML and Data Science",
    partA_dsaCoding: [
      {
        title: "K Closest Points to Origin",
        url: "https://leetcode.com/problems/k-closest-points-to-origin/",
        rationale: "",
      },
      {
        title: "Find the Duplicate Number",
        url: "https://leetcode.com/problems/find-the-duplicate-number/",
        rationale: "",
      },
      {
        title: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that Lloyd's algorithm for K-Means monotonically decreases the within-cluster sum of squares (WCSS).",
      },
      {
        title: "Mathematical Proof",
        prompt: "Prove the bound for the approximation ratio of K-Means++ initialization.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How do you scale K-Means for datasets that do not fit in memory? (Mini-batch K-Means)",
      },
      {
        title: "Systems Question",
        prompt:
          "What are the advantages of using KD-Trees or Ball Trees for finding the nearest centroid?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "k is greater than the number of unique points in the dataset.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Points perfectly equidistant from multiple centroids.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-16",
      title: "Executable Contract for K-Means & Clustering",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'import random\n\ndef euclidean_dist_sq(p1, p2):\n    return sum((x - y) ** 2 for x, y in zip(p1, p2))\n\ndef kmeans_pp_init(X, k):\n    """\n    Initializes k centroids using the K-Means++ algorithm.\n    """\n    if not X or k <= 0:\n        return []\n    \n    n_samples = len(X)\n    k = min(k, n_samples)\n    \n    centroids = [X[0]]  # Deterministic for testability, though usually random\n    \n    for _ in range(1, k):\n        distances = []\n        for point in X:\n            min_dist_sq = min(euclidean_dist_sq(point, c) for c in centroids)\n            distances.append(min_dist_sq)\n            \n        total_dist = sum(distances)\n        \n        if total_dist == 0:\n            remaining = [p for p in X if p not in centroids]\n            if remaining:\n                centroids.append(remaining[0])\n            else:\n                break\n            continue\n            \n        r = random.uniform(0, total_dist)\n        cumulative = 0.0\n        for i, point in enumerate(X):\n            cumulative += distances[i]\n            if cumulative >= r:\n                centroids.append(point)\n                break\n                \n    return centroids',
    },
  },
  {
    topicId: "17",
    title: "SVMs & Margins",
    domain: "Classical ML and Data Science",
    partA_dsaCoding: [
      {
        title: "Maximal Rectangle",
        url: "https://leetcode.com/problems/maximal-rectangle/",
        rationale: "",
      },
      {
        title: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring/",
        rationale: "",
      },
      {
        title: "Largest Rectangle in Histogram",
        url: "https://leetcode.com/problems/largest-rectangle-in-histogram/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt: "Show that maximizing the margin is equivalent to minimizing ||w||^2.",
      },
      {
        title: "Mathematical Proof",
        prompt: "State and prove the KKT conditions for the SVM dual optimization problem.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "Why is the kernel trick so computationally powerful for SVMs compared to explicitly projecting features?",
      },
      {
        title: "Systems Question",
        prompt:
          "How is Sequential Minimal Optimization (SMO) used to solve the SVM dual problem efficiently?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Linearly inseparable data without soft margin (leads to no solution).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Data points collinear along the decision boundary.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-17",
      title: "Executable Contract for SVMs & Margins",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def linear_svm_decision_function(X, weights, bias):\n    """\n    Calculates the decision function values for an SVM.\n    """\n    if not X:\n        return []\n        \n    n_samples = len(X)\n    n_features = len(weights)\n    \n    decisions = []\n    for i in range(n_samples):\n        val = sum(X[i][j] * weights[j] for j in range(n_features)) + bias\n        decisions.append(val)\n        \n    return decisions',
    },
  },
  {
    topicId: "18",
    title: "Recommender Systems / Matrix Factorization",
    domain: "Classical ML and Data Science",
    partA_dsaCoding: [
      {
        title: "Design Search Autocomplete System",
        url: "https://leetcode.com/problems/design-search-autocomplete-system/",
        rationale: "",
      },
      {
        title: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache/",
        rationale: "",
      },
      {
        title: "LFU Cache",
        url: "https://leetcode.com/problems/lfu-cache/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the singular value decomposition (SVD) provides the best low-rank approximation of a matrix in terms of Frobenius norm.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Derive the update rule for Alternating Least Squares (ALS) by taking the derivative of the regularized loss function with respect to user latent factors.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How do you serve recommendations from matrix factorization models with extremely low latency?",
      },
      {
        title: "Systems Question",
        prompt:
          "What are the advantages of Implicit ALS versus Explicit ALS in real-world scenarios?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "User with no rated items (cold start problem).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario:
          "Matrix with extreme sparsity and only uninformative ratings (e.g., all 5 stars).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-18",
      title: "Executable Contract for Recommender Systems / Matrix Factorization",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        'def als_explicit_step(R, num_factors, num_iterations, reg):\n    """\n    Performs ALS steps for explicit matrix factorization.\n    """\n    if not R or not R[0]:\n        return [], []\n        \n    n_users = len(R)\n    n_items = len(R[0])\n    \n    U = [[0.1] * num_factors for _ in range(n_users)]\n    V = [[0.1] * num_factors for _ in range(n_items)]\n    \n    lr = 0.01\n    for _ in range(num_iterations):\n        for u in range(n_users):\n            for i in range(n_items):\n                if R[u][i] > 0:\n                    pred = sum(U[u][k] * V[i][k] for k in range(num_factors))\n                    err = R[u][i] - pred\n                    \n                    for k in range(num_factors):\n                        grad_U = -err * V[i][k] + reg * U[u][k]\n                        grad_V = -err * U[u][k] + reg * V[i][k]\n                        \n                        U[u][k] -= lr * grad_U\n                        V[i][k] -= lr * grad_V\n                        \n    return U, V',
    },
  },
  {
    topicId: "19",
    title: "Multi-Layer Perceptron (MLP) Forward and Backward Pass",
    domain: "Deep Learning and Activations",
    partA_dsaCoding: [
      {
        title: "LeetCode 120: Triangle",
        url: "https://leetcode.com/problems/triangle/",
        rationale: "",
      },
      {
        title: "LeetCode 198: House Robber",
        url: "https://leetcode.com/problems/house-robber/",
        rationale: "",
      },
      {
        title: "LeetCode 256: Paint House",
        url: "https://leetcode.com/problems/paint-house/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt: "Prove the chain rule applied to a 2-layer MLP with ReLU activation.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that gradient descent with a sufficiently small learning rate decreases the loss for convex functions.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "How does batched matrix multiplication improve hardware utilization compared to unbatched?",
      },
      {
        title: "Systems Question",
        prompt: "What are the memory bandwidth implications of large linear layers in LLMs?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Learning rate set too high (gradient explosion).",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Zero initialization of weights (symmetry breaking failure).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-19",
      title: "Executable Contract for Multi-Layer Perceptron (MLP) Forward and Backward Pass",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        "import numpy as np\n\ndef mlp_forward_backward_step(x, W, target, lr):\n    # x: (1, D_in), W: (D_in, D_out), target: (1, D_out)\n    # Simple linear layer without bias, MSE loss\n    out = np.dot(x, W)\n    loss = np.sum((out - target) ** 2)\n    grad_out = 2 * (out - target)\n    grad_W = np.dot(x.T, grad_out)\n    W_new = W - lr * grad_W\n    return W_new, loss",
    },
  },
  {
    topicId: "20",
    title: "Online Softmax",
    domain: "Deep Learning and Activations",
    partA_dsaCoding: [
      {
        title: "LeetCode 384: Shuffle an Array",
        url: "https://leetcode.com/problems/shuffle-an-array/",
        rationale: "",
      },
      {
        title: "LeetCode 398: Random Pick Index",
        url: "https://leetcode.com/problems/random-pick-index/",
        rationale: "",
      },
      {
        title: "LeetCode 528: Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the online softmax algorithm computes the exact same probability distribution as standard softmax.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show that subtracting the maximum value before exponentiation does not change the softmax output, preventing numerical overflow.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt: "How does online softmax help in FlashAttention?",
      },
      {
        title: "Systems Question",
        prompt:
          "Why is numerical stability critical in FP16/BF16 matrix multiplications for attention?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Inputs containing large positive and negative numbers.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Empty or single-element blocks.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-20",
      title: "Executable Contract for Online Softmax",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        "import numpy as np\n\ndef online_softmax(blocks):\n    # blocks: list of arrays\n    global_max = -np.inf\n    global_sum = 0.0\n    \n    for block in blocks:\n        block_max = np.max(block)\n        new_max = max(global_max, block_max)\n        global_sum = global_sum * np.exp(global_max - new_max) + np.sum(np.exp(block - new_max))\n        global_max = new_max\n        \n    probabilities = []\n    for block in blocks:\n        probabilities.append(np.exp(block - global_max) / global_sum)\n        \n    return probabilities",
    },
  },
  {
    topicId: "21",
    title: "RMSNorm",
    domain: "Deep Learning and Activations",
    partA_dsaCoding: [
      {
        title: "LeetCode 238: Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self/",
        rationale: "",
      },
      {
        title: "LeetCode 415: Add Strings",
        url: "https://leetcode.com/problems/add-strings/",
        rationale: "",
      },
      {
        title: "LeetCode 2125: Number of Laser Beams in a Bank",
        url: "https://leetcode.com/problems/number-of-laser-beams-in-a-bank/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt: "Prove that RMSNorm is invariant to scaling of the input features.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Show mathematically why RMSNorm is computationally cheaper than LayerNorm.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt: "Why is RMSNorm preferred over LayerNorm in modern LLMs like LLaMA?",
      },
      {
        title: "Systems Question",
        prompt:
          "How does the choice of `eps` affect numerical stability in mixed-precision training?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Inputs with all zeros.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Inputs with very large variance (testing `eps` effectiveness).",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-21",
      title: "Executable Contract for RMSNorm",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        "import numpy as np\n\ndef rmsnorm_forward(x, gamma, eps):\n    # x: (N, D), gamma: (D,)\n    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)\n    return (x / rms) * gamma",
    },
  },
  {
    topicId: "22",
    title: "Image to Column (Im2Col)",
    domain: "Deep Learning and Activations",
    partA_dsaCoding: [
      {
        title: "LeetCode 54: Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "",
      },
      {
        title: "LeetCode 73: Set Matrix Zeroes",
        url: "https://leetcode.com/problems/set-matrix-zeroes/",
        rationale: "",
      },
      {
        title: "LeetCode 48: Rotate Image",
        url: "https://leetcode.com/problems/rotate-image/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that the im2col transformation correctly maps 2D convolution to matrix multiplication.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Derive the memory complexity of the im2col operation.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt: "Why do deep learning frameworks use im2col despite its high memory consumption?",
      },
      {
        title: "Systems Question",
        prompt:
          "What are the memory optimization strategies (like implicit GEMM) to avoid materializing the im2col matrix?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Convolution kernel size equal to image size.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "Rectangular images and kernels.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-22",
      title: "Executable Contract for Image to Column (Im2Col)",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        "import numpy as np\n\ndef im2col(image, K):\n    # image: (H, W), K: kernel size (scalar, assuming KxK)\n    H, W = image.shape\n    out_H = H - K + 1\n    out_W = W - K + 1\n    col = np.zeros((K * K, out_H * out_W))\n    \n    col_idx = 0\n    for i in range(out_H):\n        for j in range(out_W):\n            col[:, col_idx] = image[i:i+K, j:j+K].reshape(-1)\n            col_idx += 1\n    return col",
    },
  },
  {
    topicId: "23",
    title: "LSTM Cell",
    domain: "Deep Learning and Activations",
    partA_dsaCoding: [
      {
        title: "LeetCode 70: Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs/",
        rationale: "",
      },
      {
        title: "LeetCode 322: Coin Change",
        url: "https://leetcode.com/problems/coin-change/",
        rationale: "",
      },
      {
        title: "LeetCode 1143: Longest Common Subsequence",
        url: "https://leetcode.com/problems/longest-common-subsequence/",
        rationale: "",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt: "Prove that the forget gate in LSTM helps mitigate the vanishing gradient problem.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Derive the backpropagation through time (BPTT) equations for an LSTM cell.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Question",
        prompt:
          "Why is LSTM execution generally slower and harder to parallelize than Transformers?",
      },
      {
        title: "Systems Question",
        prompt: "How can we fuse LSTM operations to improve GPU memory bandwidth utilization?",
      },
    ],
    partD_stressTests: [
      {
        title: "Stress Test",
        scenario: "Extremely long sequences causing exploding gradients.",
        failureMode: "Identify potential failure",
      },
      {
        title: "Stress Test",
        scenario: "All-zero inputs and initial hidden states.",
        failureMode: "Identify potential failure",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-23",
      title: "Executable Contract for LSTM Cell",
      referenceUrl: "",
      prompt: "Implement the following function correctly.",
      inputSchema: "",
      outputSchema: "",
      constraints: [],
      tolerances: "",
      workedExamples: [],
      pythonCode:
        "import numpy as np\n\ndef sigmoid(x):\n    return 1 / (1 + np.exp(-x))\n\ndef lstm_cell_forward(x, h_prev, c_prev, W, U, b):\n    # W, U, b contain concatenated weights/biases for i, f, o, g\n    D_h = h_prev.shape[0]\n    z = np.dot(W, x) + np.dot(U, h_prev) + b\n    \n    i = sigmoid(z[0:D_h])\n    f = sigmoid(z[D_h:2*D_h])\n    o = sigmoid(z[2*D_h:3*D_h])\n    g = np.tanh(z[3*D_h:4*D_h])\n    \n    c_next = f * c_prev + i * g\n    h_next = o * np.tanh(c_next)\n    \n    return h_next, c_next",
    },
  },
];
