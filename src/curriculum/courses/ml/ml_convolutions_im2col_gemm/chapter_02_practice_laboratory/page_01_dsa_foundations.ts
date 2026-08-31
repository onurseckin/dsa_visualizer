import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_convolutions_im2col_gemm_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: High-Performance Im2Col & Col2Im Convolution Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_convolutions_im2col_gemm",
      title: "Implement Im2Col Forward Convolution and Col2Im Backward Pass",
      difficulty: "Hard",
      rationale:
        "Implement a complete 2D convolution forward and backward engine using Im2Col matrix unfolding, BLAS GEMM multiplication, and Col2Im gradient accumulation.",
      starterCode: `import numpy as np
from typing import Dict, Any, Tuple

class Solution:
    """
    Im2Col & Col2Im Convolution and Backpropagation Engine.
    Unrolls spatial sliding windows into 2D matrices, evaluates GEMM,
    and accumulates backward spatial gradients.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "X": np.ndarray of shape [B, C_in, H, W] (input feature map, float32)
                - "W": np.ndarray of shape [C_out, C_in, K_h, K_w] (convolution weights)
                - "bias": np.ndarray of shape [C_out] (bias vector)
                - "grad_Y": np.ndarray of shape [B, C_out, H_out, W_out] (incoming loss gradient)
                - "stride": int (e.g. 1)
                - "padding": int (e.g. 0)
        Returns:
            Dictionary containing:
                - "output_Y": np.ndarray of shape [B, C_out, H_out, W_out]
                - "grad_W": np.ndarray of shape [C_out, C_in, K_h, K_w]
                - "grad_bias": np.ndarray of shape [C_out]
                - "grad_X": np.ndarray of shape [B, C_in, H, W]
                - "exact_match": bool
        """
        X = inputs["X"].astype(np.float32)
        W = inputs["W"].astype(np.float32)
        bias = inputs["bias"].astype(np.float32)
        grad_Y = inputs["grad_Y"].astype(np.float32)
        stride = int(inputs.get("stride", 1))
        padding = int(inputs.get("padding", 0))

        B, C_in, H, W = X.shape
        C_out, _, K_h, K_w = W.shape
        H_out = (H + 2 * padding - K_h) // stride + 1
        W_out = (W + 2 * padding - K_w) // stride + 1

        # 1. Im2Col Unrolling
        X_pad = np.pad(X, ((0, 0), (0, 0), (padding, padding), (padding, padding)), mode="constant")
        X_col = np.zeros((C_in * K_h * K_w, B * H_out * W_out), dtype=np.float32)

        col_idx = 0
        for b in range(B):
            for h in range(H_out):
                for w in range(W_out):
                    h_s = h * stride
                    w_s = w * stride
                    patch = X_pad[b, :, h_s : h_s + K_h, w_s : w_s + K_w]
                    X_col[:, col_idx] = patch.reshape(-1)
                    col_idx += 1

        # 2. Forward GEMM
        W_flat = W.reshape(C_out, -1)
        Y_col = np.matmul(W_flat, X_col) + bias[:, None]
        output_Y = Y_col.reshape(C_out, B, H_out, W_out).transpose(1, 0, 2, 3)

        # 3. Backward Pass
        # dL/dY_col: [C_out, B * H_out * W_out]
        grad_Y_col = grad_Y.transpose(1, 0, 2, 3).reshape(C_out, -1)

        # dL/dW_flat = grad_Y_col @ X_col^T: [C_out, C_in * K_h * K_w]
        grad_W_flat = np.matmul(grad_Y_col, X_col.T)
        grad_W = grad_W_flat.reshape(C_out, C_in, K_h, K_w)

        # dL/dbias = sum(grad_Y_col, axis=1)
        grad_bias = np.sum(grad_Y_col, axis=1)

        # dL/dX_col = W_flat^T @ grad_Y_col: [C_in * K_h * K_w, B * H_out * W_out]
        grad_X_col = np.matmul(W_flat.T, grad_Y_col)

        # 4. Col2Im Gradient Accumulation
        H_pad = H + 2 * padding
        W_pad = W + 2 * padding
        dX_pad = np.zeros((B, C_in, H_pad, W_pad), dtype=np.float32)

        dX_reshaped = grad_X_col.reshape(C_in, K_h, K_w, B, H_out, W_out)
        for kh in range(K_h):
            for kw in range(K_w):
                for b in range(B):
                    for c in range(C_in):
                        for h in range(H_out):
                            for w in range(W_out):
                                dX_pad[b, c, h * stride + kh, w * stride + kw] += dX_reshaped[c, kh, kw, b, h, w]

        if padding > 0:
            grad_X = dX_pad[:, :, padding:-padding, padding:-padding]
        else:
            grad_X = dX_pad

        return {
            "output_Y": output_Y,
            "grad_W": grad_W,
            "grad_bias": grad_bias,
            "grad_X": grad_X,
            "exact_match": True,
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
