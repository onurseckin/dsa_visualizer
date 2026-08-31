import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_mlp_backpropagation_c1_p1",
  pageNumber: 1,
  title: "Multi-Layer Perceptrons: Matrix Calculus & Backpropagation Mechanics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Computational Graph Calculus: Forward Activations to Adjoint Sensitivity",
      content:
        "The Multi-Layer Perceptron (**MLP**) is the canonical dense building block of deep learning architectures (Transformers, ConvNets, Mamba). An $L$-layer network transforms an input batch $X = A^{(0)} \\in \\mathbb{R}^{B \\times D_0}$ via alternating affine projections and non-linear activation functions:\\n$$Z^{(l)} = A^{(l-1)} W^{(l)} + \\mathbf{1}_B (b^{(l)})^T, \\quad A^{(l)} = \\sigma(Z^{(l)}) \\quad \\text{for } l = 1, \\dots, L$$\\nwhere $W^{(l)} \\in \\mathbb{R}^{D_{l-1} \\times D_l}$. During the backward pass, backpropagation computes the exact Jacobian-vector products (adjoint error matrices) using the chain rule: $\\delta^{(l)} = \\frac{\\partial \\mathcal{L}}{\\partial Z^{(l)}} = (\\delta^{(l+1)} (W^{(l+1)})^T) \\odot \\sigma'(Z^{(l)})$. Parameter gradients are then evaluated via outer matrix products: $\\nabla_{W^{(l)}} \\mathcal{L} = (A^{(l-1)})^T \\delta^{(l)}$ and $\\nabla_{b^{(l)}} \\mathcal{L} = \\mathbf{1}_B^T \\delta^{(l)}$.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Forward Activation Stashing & Backward Adjoint Flow",
      visualIntuition:
        "Forward Pass:   [ A^(l-1) ] --( GEMM x W^(l) + b )--> [ Z^(l) ] --( Activation sigma )--> [ A^(l) ]\\n                 | (Saved in HBM/SRAM for Backward Pass)\\nBackward Pass:  [ dL/dA^(l) ] <--( sigma'(Z^(l)) )-- [ delta^(l) ] <--( GEMM x (W^(l+1))^T )-- [ delta^(l+1) ]\\n                     |\\n                     \\--( GEMM: (A^(l-1))^T x delta^(l) )--> [ dL/dW^(l) ]",
      invariant:
        "Gradient Conservation Invariant: At every layer l, the adjoint sensitivity matrix delta^(l) = dL/dZ^(l) exactly represents the marginal sensitivity of the scalar loss L to the pre-activation tensor Z^(l), preserving exact energy conservation across the autograd chain.",
      stateTransitions:
        "Batch Input X -> Forward Layer 1 (Stash A^(0)) -> Forward Layer 2 (Stash A^(1)) -> Loss Compute -> Backward Layer 2 (Compute dW^(2), db^(2), delta^(1)) -> Backward Layer 1 (Compute dW^(1), db^(1), delta^(0)) -> Free Stashed Activations.",
      naiveBottleneck:
        "Scalar elementwise backpropagation calculates partial derivatives individually, suffering from 99% GPU warp divergence and failing to utilize Tensor Core matrix engines.",
      optimalInsight:
        "Formulating both forward activations and backward error propagation as dense matrix-matrix multiplications (GEMM) transforms training into peak-throughput BLAS operations.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Xavier/Glorot & He/Kaiming Variance Preservation",
      theorem:
        "Let a linear layer have $n_{\\text{in}}$ inputs with independent zero-mean activations $x_i$ (variance $\\sigma_x^2$) and weights $w_{ij}$ (variance $\\sigma_w^2$). For linear/tanh activations, preserving activation and gradient variance ($\\text{Var}(y) = \\text{Var}(x)$) requires $\\sigma_w^2 = \\frac{2}{n_{\\text{in}} + n_{\\text{out}}}$ (Glorot). For ReLU non-linearities, preserving forward variance requires $\\sigma_w^2 = \\frac{2}{n_{\\text{in}}}$ (He/Kaiming).",
      proof:
        "1. Forward Variance Formulation:\\nLet $y = \\sum_{i=1}^{n_{\\text{in}}} w_i x_i$. Because weights and inputs are independent with mean 0:\\n$$\\mathbb{E}[y] = \\sum_{i=1}^{n_{\\text{in}}} \\mathbb{E}[w_i] \\mathbb{E}[x_i] = 0$$\\n$$\\text{Var}(y) = \\mathbb{E}[y^2] = \\sum_{i=1}^{n_{\\text{in}}} \\mathbb{E}[w_i^2 x_i^2] = \\sum_{i=1}^{n_{\\text{in}}} \\mathbb{E}[w_i^2] \\mathbb{E}[x_i^2] = n_{\\text{in}} \\sigma_w^2 \\sigma_x^2$$\\n\\n2. Linear/Tanh Xavier Initialization:\\nTo prevent activations from exploding or vanishing across $L$ layers, we enforce $\\text{Var}(y) = \\text{Var}(x) \\implies n_{\\text{in}} \\sigma_w^2 = 1 \\implies \\sigma_w^2 = \\frac{1}{n_{\\text{in}}}$.\\nEnforcing variance preservation on backward gradients yields $n_{\\text{out}} \\sigma_w^2 = 1 \\implies \\sigma_w^2 = \\frac{1}{n_{\\text{out}}}$.\\nHarmonic mean compromise yields the Xavier/Glorot variance: $\\sigma_w^2 = \\frac{2}{n_{\\text{in}} + n_{\\text{out}}}$.\\n\\n3. ReLU Non-Linearity (He/Kaiming Initialization):\\nFor $\\text{ReLU}(z) = \\max(0, z)$, since $z$ has symmetric distribution around 0, exactly 50% of activations are zeroed out: $\\mathbb{E}[x^2] = \\frac{1}{2} \\text{Var}(z)$.\\n$$\\text{Var}(y) = n_{\\text{in}} \\sigma_w^2 \\left( \\frac{1}{2} \\text{Var}(z) \\right) = \\frac{1}{2} n_{\\text{in}} \\sigma_w^2 \\text{Var}(z)$$\\nSetting $\\text{Var}(y) = \\text{Var}(z)$ requires $\\frac{1}{2} n_{\\text{in}} \\sigma_w^2 = 1 \\implies \\sigma_w^2 = \\frac{2}{n_{\\text{in}}}$, proving the fundamental Kaiming He initialization invariant for deep rectified networks.",
    },
  ],
};

export const page_01_core = page1;
