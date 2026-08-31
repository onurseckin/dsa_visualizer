import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_normalization_rmsnorm_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: High-Performance RMSNorm Forward & Backward Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_normalization_rmsnorm",
      title: "Implement RMSNorm Forward Pass and Analytical Backward Gradients",
      difficulty: "Hard",
      rationale:
        "Implement a complete RMSNorm layer with forward root-mean-square normalization, learnable gain scaling, and exact analytical backward gradient propagation.",
      starterCode: `import numpy as np
from typing import Dict, Any, Tuple

class Solution:
    """
    Root Mean Square Normalization (RMSNorm) Forward and Backward Engine.
    Executes forward energy scaling and analytical adjoint gradient propagation.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "X": np.ndarray of shape [B, D] (input tensor, float32)
                - "gamma": np.ndarray of shape [D] (learnable gain parameter)
                - "grad_out": np.ndarray of shape [B, D] (incoming loss gradient dL/dY)
                - "eps": float (numerical stability constant, e.g. 1e-6)
        Returns:
            Dictionary containing:
                - "output": np.ndarray of shape [B, D] (forward normalized tensor)
                - "grad_X": np.ndarray of shape [B, D] (input gradient dL/dX)
                - "grad_gamma": np.ndarray of shape [D] (parameter gradient dL/dgamma)
                - "rms_values": np.ndarray of shape [B, 1] (computed RMS values)
        """
        X = inputs["X"].astype(np.float32)
        gamma = inputs["gamma"].astype(np.float32)
        grad_out = inputs["grad_out"].astype(np.float32)
        eps = float(inputs.get("eps", 1e-6))

        B, D = X.shape

        # 1. Forward Pass
        # RMS = sqrt(mean(X^2) + eps)
        mean_sq = np.mean(X ** 2, axis=-1, keepdims=True)  # [B, 1]
        rms = np.sqrt(mean_sq + eps)                       # [B, 1]
        X_norm = X / rms                                  # [B, D]
        Y = X_norm * gamma                                # [B, D]

        # 2. Backward Pass
        # Gradient w.r.t gamma: sum(grad_out * X_norm, axis=0)
        grad_gamma = np.sum(grad_out * X_norm, axis=0)    # [D]

        # Gradient w.r.t X:
        # grad_X = (1 / RMS) * (g * gamma - (X / (RMS^2 * D)) * sum(g * gamma * X))
        g_gamma = grad_out * gamma                         # [B, D]
        dot_term = np.sum(g_gamma * X, axis=-1, keepdims=True)  # [B, 1]
        grad_X = (1.0 / rms) * (g_gamma - (X / (rms ** 2 * D)) * dot_term)  # [B, D]

        return {
            "output": Y,
            "grad_X": grad_X,
            "grad_gamma": grad_gamma,
            "rms_values": rms,
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
