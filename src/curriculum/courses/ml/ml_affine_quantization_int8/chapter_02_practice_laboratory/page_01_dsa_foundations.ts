import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_affine_quantization_int8_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Uniform Affine Quantizer & Integer GEMM Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_affine_quantization_int8",
      title: "Implement INT8 Affine Quantizer & Integer Matrix Engine",
      difficulty: "Hard",
      rationale:
        "Implement a complete uniform affine quantizer and low-level integer matrix multiplication engine with zero-point correction and scale factor propagation.",
      starterCode: `import numpy as np
from typing import Dict, Any, Tuple

class Solution:
    """
    Uniform Affine Quantization and Low-Level Integer GEMM Engine.
    Implements scale/zero-point calibration, discrete uint8 clamping,
    INT32 accumulator GEMM, and zero-point mathematical correction.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "X": np.ndarray of shape [M, K] in float32 (activation matrix)
                - "W": np.ndarray of shape [K, N] in float32 (weight matrix)
                - "qmin": int (e.g. 0)
                - "qmax": int (e.g. 255)
        Returns:
            Dictionary containing:
                - "Q_X": np.ndarray of shape [M, K] in uint8
                - "Q_W": np.ndarray of shape [K, N] in uint8
                - "scale_X": float
                - "zero_point_X": int
                - "scale_W": float
                - "zero_point_W": int
                - "output_reconstructed": np.ndarray of shape [M, N] in float32
                - "max_absolute_error": float (difference vs exact float32 GEMM X @ W)
        """
        X = inputs["X"].astype(np.float32)
        W = inputs["W"].astype(np.float32)
        qmin = int(inputs.get("qmin", 0))
        qmax = int(inputs.get("qmax", 255))

        M, K = X.shape
        _, N = W.shape

        # 1. Calibrate X (activations)
        alpha_x = float(np.min(X))
        beta_x = float(np.max(X))
        scale_x = max((beta_x - alpha_x) / float(qmax - qmin), 1e-8)
        zp_x = int(np.clip(np.round(qmin - alpha_x / scale_x), qmin, qmax))
        Q_X = np.clip(np.round(X / scale_x) + zp_x, qmin, qmax).astype(np.uint8)

        # 2. Calibrate W (weights)
        alpha_w = float(np.min(W))
        beta_w = float(np.max(W))
        scale_w = max((beta_w - alpha_w) / float(qmax - qmin), 1e-8)
        zp_w = int(np.clip(np.round(qmin - alpha_w / scale_w), qmin, qmax))
        Q_W = np.clip(np.round(W / scale_w) + zp_w, qmin, qmax).astype(np.uint8)

        # 3. Low-Level Integer GEMM in INT32
        int32_gemm = np.matmul(Q_X.astype(np.int32), Q_W.astype(np.int32))
        x_row_sums = np.sum(Q_X.astype(np.int32), axis=1, keepdims=True)
        w_col_sums = np.sum(Q_W.astype(np.int32), axis=0, keepdims=True)

        # 4. Zero-point algebraic correction
        corrected_int32 = int32_gemm - (zp_w * x_row_sums) - (zp_x * w_col_sums) + (K * zp_x * zp_w)
        output_reconstructed = (scale_x * scale_w) * corrected_int32.astype(np.float32)

        # 5. True float32 GEMM reference
        true_output = np.matmul(X, W)
        max_abs_err = float(np.max(np.abs(output_reconstructed - true_output)))

        return {
            "Q_X": Q_X,
            "Q_W": Q_W,
            "scale_X": scale_x,
            "zero_point_X": zp_x,
            "scale_W": scale_w,
            "zero_point_W": zp_w,
            "output_reconstructed": output_reconstructed,
            "max_absolute_error": max_abs_err,
        }`,
    },
  ],
};

export const page = page1;
