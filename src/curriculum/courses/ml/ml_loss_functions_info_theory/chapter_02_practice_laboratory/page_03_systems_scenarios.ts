import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_loss_functions_info_theory_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Loss Functions Systems Diagnostics & Stress Tests",
  subtitle:
    "Question Bank Suite: Large-Vocabulary Softmax, Temperature Collapse, and Label Smoothing",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_loss_functions_info_theory",
      title: "Information Theory & Loss Function Systems Suite",
      partA_dsaCoding: [
        {
          title: "Vectorized Multiclass Top-K Cross-Entropy Loss",
          difficulty: "Hard",
          description:
            "Implement a batch cross-entropy loss function that handles dense probability distributions with non-uniform label smoothing in O(B * K) time.",
          problemStatement:
            "def multiclass_cross_entropy(logits: np.ndarray, target_probs: np.ndarray) -> float:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Maximum Entropy for Uniform Distribution",
          statement:
            "Prove that the discrete distribution P on K states that maximizes Shannon entropy H(P) is the uniform distribution p_i = 1/K, and the maximum entropy is ln(K).",
          proofOutline:
            "Formulate the optimization problem max -sum p_i ln(p_i) subject to sum p_i = 1. Using Lagrange multiplier lambda, the Lagrangian is L = -sum p_i ln(p_i) - lambda (sum p_i - 1). dL/dp_i = - ln(p_i) - 1 - lambda = 0 => p_i = exp(-1-lambda). Since all p_i are equal and sum to 1, p_i = 1/K for all i. Max entropy is H(P) = -sum (1/K) ln(1/K) = ln(K).",
          engineeringContext:
            "This theoretical property justifies why unconstrained machine learning models naturally default to maximum uncertainty (uniform probabilities) when given zero training signals.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Large Vocabulary Softmax VRAM Bottleneck (V = 256,000)",
          prompt:
            "In modern multi-lingual LLMs with vocabulary size V = 256,000 and batch size B * S = 8192 tokens, computing logits (8192 x 256,000 in FP32) requires 8.38 GB of VRAM per layer just for loss calculation. How does chunked cross-entropy solve this?",
          engineeringContext:
            "Chunked cross-entropy processes the 8192 tokens in micro-chunks (e.g. 512 tokens at a time), projecting the hidden states to logits, computing the Log-Sum-Exp reduction, accumulating the loss and backward gradient in-place, and discarding the logit chunk before proceeding to the next chunk. This slashes peak memory from 8.38 GB down to ~524 MB.",
        },
      ],
      partD_stressTests: [
        {
          title: "Contrastive Temperature Collapse Under Extreme Hyperparameters",
          scenario:
            "A vision-language engineer trains CLIP with initial temperature tau = 0.001. After 10 training iterations, the model embeddings collapse to identical NaN values across all batch entries.",
          failureMode:
            "When tau = 0.001, dividing cosine similarities by tau produces logits on the order of 1000. In FP16, exp(1000) immediately overflows to +inf, and subsequent gradient updates dL/dq = (p_i - y_i)/tau scale gradients by 1000x, causing catastrophic weight explosion. Initializing tau in [0.05, 0.1] and clamping tau >= 0.01 prevents collapse.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
