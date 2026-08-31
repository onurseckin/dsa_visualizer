import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_gradient_descent_adamw_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Optimization Systems Diagnostics & Stress Tests",
  subtitle: "Question Bank Suite: ZeRO-1 Sharding, FP16 Master Weights, and Variance Collapse",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_gradient_descent_adamw",
      title: "Gradient Descent & AdamW Optimization Systems Suite",
      partA_dsaCoding: [
        {
          title: "Multi-Tensor In-Place Fused Optimizer Update",
          difficulty: "Hard",
          description:
            "Write a Python function that executes AdamW updates on a list of arbitrary parameter tensors in a single memory pass, updating FP32 master weights and casting in-place to FP16 model parameters.",
          problemStatement:
            "def fused_multi_tensor_adamw(params_fp16: list, masters_fp32: list, grads_fp16: list, exp_avg: list, exp_avg_sq: list, step: int, lr: float, wd: float) -> None:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Polyak Heavy-Ball Acceleration on 2D Quadratics",
          statement:
            "Prove that on a quadratic function with condition number kappa, gradient descent with optimal Polyak momentum achieves convergence rate (sqrt(kappa) - 1)/(sqrt(kappa) + 1) compared to (kappa - 1)/(kappa + 1) for vanilla gradient descent.",
          proofOutline:
            "Analyze the 2x2 transition matrix of the second-order recurrence [x_{t+1}, x_t]^T = T [x_t, x_{t-1}]^T. By choosing momentum beta = ((sqrt(L) - sqrt(mu))/(sqrt(L) + sqrt(mu)))^2 and step size eta = 4/(sqrt(L) + sqrt(mu))^2, the spectral radius of T equals rho(T) = (sqrt(kappa) - 1)/(sqrt(kappa) + 1).",
          engineeringContext:
            "For kappa = 10,000, vanilla SGD requires ~10,000 iterations while momentum requires ~100 iterations, providing a 100x acceleration.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "ZeRO-1 Optimizer State Sharding Memory Scaling",
          prompt:
            "Explain why ZeRO-1 shards the 12 bytes of optimizer states (4B master weight, 4B m, 4B v) across N data-parallel GPUs while keeping FP16 parameters and gradients replicated, and compute the memory savings on 8 GPUs for a 13B parameter model.",
          engineeringContext:
            "A 13B model requires 13B * 16 bytes = 208GB total. ZeRO-1 shards the 12B optimizer states (156GB) across 8 GPUs, requiring only 156 / 8 = 19.5GB per GPU, plus 4B parameters/gradients (52GB) = 71.5GB total per GPU, fitting comfortably inside 80GB A100/H100 nodes.",
        },
      ],
      partD_stressTests: [
        {
          title: "Underflow Annihilation Without FP32 Master Weights",
          scenario:
            "A deep learning engineer runs pure FP16 AdamW training without FP32 master weights. At step 5,000, model loss completely flatlines and training stalls despite non-zero gradients.",
          failureMode:
            "In FP16, the smallest positive normal number with standard mantissa precision is 2^{-14} approx 6.1 * 10^{-5}. When learning rate lr = 10^{-4} and gradient step Delta theta = 10^{-5}, adding Delta theta to theta_fp16 = 1.0 results in 1.0 + 10^{-5} = 1.0 due to 10-bit mantissa rounding. The model parameters never update. Retaining FP32 master weights resolves this.",
        },
      ],
    },
  ],
};
