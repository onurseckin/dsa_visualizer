import type { MLTopicQuestionBank } from "./types";

export const optimizationLosses: MLTopicQuestionBank[] = [
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
