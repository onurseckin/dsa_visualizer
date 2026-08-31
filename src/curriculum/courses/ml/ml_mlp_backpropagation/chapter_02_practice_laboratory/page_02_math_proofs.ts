import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_mlp_backpropagation_c2_p2",
  pageNumber: 3,
  title: "Mathematical Proofs: Matrix Calculus Adjoint Derivation & Loss Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Full Matrix Calculus Adjoint Chain Rule Derivation",
      theorem:
        "For an affine transformation $Z = X W + \\mathbf{1}_B b^T$ followed by scalar loss $\\mathcal{L}(Z)$, let the adjoint sensitivity matrix be $\\Delta = \\nabla_Z \\mathcal{L} \\in \\mathbb{R}^{B \\times D_{\\text{out}}}$. The analytical parameter and input gradients are $\\nabla_W \\mathcal{L} = X^T \\Delta$, $\\nabla_b \\mathcal{L} = \\Delta^T \\mathbf{1}_B$, and $\\nabla_X \\mathcal{L} = \\Delta W^T$.",
      proof:
        "1. Differential Formulation:\\nUsing matrix differentials $d\\mathcal{L} = \\text{Tr}\\left( (\\nabla_Z \\mathcal{L})^T dZ \\right) = \\text{Tr}(\\Delta^T dZ)$.\\n\\n2. Differential of Affine Map:\\n$$dZ = d(X W + \\mathbf{1}_B b^T) = (dX) W + X (dW) + \\mathbf{1}_B (db)^T$$\\n\\n3. Gradient w.r.t. Weights $W$:\\nSubstituting $dZ = X (dW)$ into $d\\mathcal{L}$:\\n$$d\\mathcal{L} = \\text{Tr}(\\Delta^T X dW) = \\text{Tr}\\left( (X^T \\Delta)^T dW \\right) \\implies \\nabla_W \\mathcal{L} = X^T \\Delta$$\\n\\n4. Gradient w.r.t. Inputs $X$:\\nSubstituting $dZ = (dX) W$ into $d\\mathcal{L}$:\\n$$d\\mathcal{L} = \\text{Tr}(\\Delta^T dX W) = \\text{Tr}(W \\Delta^T dX) = \\text{Tr}\\left( (\\Delta W^T)^T dX \\right) \\implies \\nabla_X \\mathcal{L} = \\Delta W^T$$\\n\\n5. Gradient w.r.t. Bias $b$:\\nSubstituting $dZ = \\mathbf{1}_B (db)^T$:\\n$$d\\mathcal{L} = \\text{Tr}(\\Delta^T \\mathbf{1}_B db^T) = \\text{Tr}(db^T \\Delta^T \\mathbf{1}_B) = (\\mathbf{1}_B^T \\Delta) db \\implies \\nabla_b \\mathcal{L} = \\Delta^T \\mathbf{1}_B$$\\nThis rigorously confirms the exact GEMM formulations utilized across all deep learning autograd engines.",
    },
    {
      type: "math_proof",
      title: "Gradient Vanishing Exponential Decay in Deep Sigmoidal Networks",
      theorem:
        "For an $L$-layer feedforward network with standard logistic sigmoid activations $\\sigma(z) = \\frac{1}{1 + e^{-z}}$, the gradient magnitude $\\|\\delta^{(1)}\\|$ decays exponentially with depth: $\\|\\delta^{(1)}\\| \\le (0.25)^L \\|W^T\\|^L \\|\\delta^{(L)}\\|$, vanishing to zero for large $L$ unless bounded by residual skip connections.",
      proof:
        "1. Derivative of Logistic Sigmoid:\\n$$\\sigma'(z) = \\sigma(z)(1 - \\sigma(z))$$\\nSince $0 < \\sigma(z) < 1$, the maximum value of $\\sigma'(z)$ occurs at $z = 0$, where $\\sigma'(0) = 0.5 \\times 0.5 = 0.25$.\\nThus, $|\\sigma'(z)| \\le \\frac{1}{4}$ for all $z \\in \\mathbb{R}$.\\n\\n2. Adjoint Recurrence:\\n$$\\delta^{(l)} = (\\delta^{(l+1)} (W^{(l+1)})^T) \\odot \\sigma'(Z^{(l)})$$\\nTaking matrix operator norms:\\n$$\\|\\delta^{(l)}\\| \\le \\|\\delta^{(l+1)}\\| \\cdot \\|W^{(l+1)}\\| \\cdot \\|\\text{diag}(\\sigma'(Z^{(l)}))\\| \\le \\frac{1}{4} \\|W^{(l+1)}\\| \\|\\delta^{(l+1)}\\|$$\\n\\n3. Unrolling Across $L$ Layers:\\n$$\\|\\delta^{(1)}\\| \\le \\left( \\prod_{l=1}^{L-1} \\frac{1}{4} \\|W^{(l+1)}\\| \\right) \\|\\delta^{(L)}\\| = \\left(\\frac{1}{4}\\right)^{L-1} \\|W\\|^{L-1} \\|\\delta^{(L)}\\|$$\\nFor $L = 30$ layers, $(1/4)^{30} \\approx 8.67 \\times 10^{-19}$, annihilating all gradient signal before reaching initial layers, proving why non-saturating activations (ReLU, GELU, SwiGLU) and residual connections are strictly necessary in deep networks.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
