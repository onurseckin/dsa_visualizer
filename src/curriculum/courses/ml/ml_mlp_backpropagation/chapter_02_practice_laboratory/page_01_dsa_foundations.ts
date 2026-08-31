import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_mlp_backpropagation_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Multi-Layer Perceptron Forward & Backward Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_mlp_backpropagation",
      title: "Implement Multi-Layer Perceptron Forward and Backward Passes",
      difficulty: "Hard",
      rationale:
        "Implement a complete 2-layer MLP engine with forward activation caching, ReLU non-linearities, Mean Squared Error / Cross-Entropy loss, and analytical backward gradient evaluations.",
      starterCode: `import numpy as np
from typing import Dict, Any, Tuple

class Solution:
    """
    2-Layer Multi-Layer Perceptron (MLP) Forward and Backward Engine.
    Executes matrix multiplications, ReLU activations, MSE loss,
    and exact backpropagation gradient derivations.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "X": np.ndarray of shape [B, D_in] (input features, float32)
                - "W1": np.ndarray of shape [D_in, D_hidden] (layer 1 weights)
                - "b1": np.ndarray of shape [D_hidden] (layer 1 bias)
                - "W2": np.ndarray of shape [D_hidden, D_out] (layer 2 weights)
                - "b2": np.ndarray of shape [D_out] (layer 2 bias)
                - "targets": np.ndarray of shape [B, D_out] (ground truth labels)
        Returns:
            Dictionary containing:
                - "loss": float (Mean Squared Error: (1 / 2B) * sum((Y_pred - targets)^2))
                - "grad_W1": np.ndarray of shape [D_in, D_hidden]
                - "grad_b1": np.ndarray of shape [D_hidden]
                - "grad_W2": np.ndarray of shape [D_hidden, D_out]
                - "grad_b2": np.ndarray of shape [D_out]
                - "grad_X": np.ndarray of shape [B, D_in]
        """
        X = inputs["X"].astype(np.float32)
        W1 = inputs["W1"].astype(np.float32)
        b1 = inputs["b1"].astype(np.float32)
        W2 = inputs["W2"].astype(np.float32)
        b2 = inputs["b2"].astype(np.float32)
        targets = inputs["targets"].astype(np.float32)

        B, D_in = X.shape

        # 1. Forward Pass
        # Layer 1
        Z1 = np.matmul(X, W1) + b1  # [B, D_hidden]
        A1 = np.maximum(0.0, Z1)    # [B, D_hidden]

        # Layer 2 (Linear output)
        Y_pred = np.matmul(A1, W2) + b2  # [B, D_out]

        # MSE Loss: (1 / 2B) * sum((Y_pred - targets)^2)
        diff = Y_pred - targets
        loss = float(np.sum(diff ** 2) / (2.0 * B))

        # 2. Backward Pass
        # Output gradient: dL/dY_pred = diff / B
        dY = diff / float(B)  # [B, D_out]

        # Layer 2 Gradients
        grad_W2 = np.matmul(A1.T, dY)        # [D_hidden, D_out]
        grad_b2 = np.sum(dY, axis=0)         # [D_out]
        dA1 = np.matmul(dY, W2.T)            # [B, D_hidden]

        # Backprop through ReLU
        dZ1 = dA1 * (Z1 > 0.0).astype(np.float32)  # [B, D_hidden]

        # Layer 1 Gradients
        grad_W1 = np.matmul(X.T, dZ1)        # [D_in, D_hidden]
        grad_b1 = np.sum(dZ1, axis=0)        # [D_hidden]
        grad_X = np.matmul(dZ1, W1.T)        # [B, D_in]

        return {
            "loss": loss,
            "grad_W1": grad_W1,
            "grad_b1": grad_b1,
            "grad_W2": grad_W2,
            "grad_b2": grad_b2,
            "grad_X": grad_X,
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
