import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_gradients_jacobians_hessians_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Gradients & Curvature Systems Diagnostics",
  subtitle:
    "Question Bank Suite: Matrix-Free Optimizers, Saddle Point Escapes, and Catastrophic Cancellation",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_gradients_jacobians_hessians",
      title: "Gradients, Jacobians & Second-Order Systems Suite",
      partA_dsaCoding: [
        {
          title: "Softmax + Cross-Entropy Jacobian-Vector Product",
          difficulty: "Hard",
          description:
            "Implement a memory-fused JVP function that computes J_softmax(z) @ v in O(D) time without forming the D x D softmax Jacobian matrix.",
          problemStatement:
            'def softmax_jvp(logits: np.ndarray, v: np.ndarray) -> np.ndarray:\n    """Compute J_softmax(logits) @ v in O(D) time."""\n    # p = softmax(logits)\n    # J @ v = p * (v - <p, v>)\n    pass',
        },
      ],
      partB_mathProofs: [
        {
          title: "Derivation of the Softmax Jacobian Matrix",
          statement:
            "Prove that for softmax function s(z) where s_i(z) = exp(z_i) / sum_k exp(z_k), the Jacobian matrix entries are given by J_{ij} = s_i(z) (delta_{ij} - s_j(z)), which in matrix notation is J_s(z) = diag(s) - s s^T.",
          proofOutline:
            "Case i = j: d/dz_i [exp(z_i) / S] = (exp(z_i) S - exp(z_i)^2) / S^2 = s_i - s_i^2 = s_i(1 - s_i). Case i != j: d/dz_j [exp(z_i) / S] = - exp(z_i) exp(z_j) / S^2 = - s_i s_j. Combining both gives s_i (delta_{ij} - s_j).",
          engineeringContext:
            "The low-rank perturbation structure diag(s) - s s^T enables matrix-vector products in O(D) time rather than O(D^2), which is essential in transformer attention heads.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Kronecker-Factored Approximate Curvature (K-FAC) Memory Scaling",
          prompt:
            "For a linear layer W in R^{d_out x d_in}, why is the exact Hessian in R^{(d_out d_in) x (d_out d_in)} impossible to invert, and how does K-FAC approximate it as A (x) G with Kronecker inversion (A (x) G)^{-1} = A^{-1} (x) G^{-1}?",
          engineeringContext:
            "For d_in = d_out = 4096, dim(W) = 16.7M parameters. The exact Hessian has (16.7M)^2 = 2.8 * 10^{14} elements (1.1 Petabytes). K-FAC factorizes H approx A (x) G where A in R^{4096 x 4096} and G in R^{4096 x 4096}. Inverting two 4096 x 4096 matrices takes < 10 milliseconds, making second-order optimization practical.",
        },
      ],
      partD_stressTests: [
        {
          title: "Catastrophic Cancellation in Numerical Finite Difference Gradient",
          scenario:
            "A test engineer validates PyTorch autograd gradients against finite differences using eps = 1e-12 in single-precision FP32. The relative error check fails catastrophically with 100% relative error.",
          failureMode:
            "In FP32 (24-bit mantissa, eps_mach ~ 1.19e-7), setting eps = 1e-12 is far smaller than machine precision. Evaluating f(x + 1e-12) rounds to f(x) identically due to mantissa absorption, yielding (f(x) - f(x))/eps = 0.0, completely destroying the gradient signal.",
        },
      ],
    },
  ],
};
