import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_normalization_rmsnorm_c1_p1",
  pageNumber: 1,
  title: "Normalization Architectures: LayerNorm to RMSNorm Mechanics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Gradient Scale Explosion: Why Modern LLMs Replaced LayerNorm with RMSNorm",
      content:
        "Deep Transformer architectures (32 to 128 layers) suffer from catastrophic gradient explosion or vanishing without normalization layers. Classical **LayerNorm (Ba et al., 2016)** normalizes activations across the hidden dimension $D$ by re-centering to zero mean and scaling to unit variance: $y = \\frac{x - \\mu}{\\sigma} \\odot \\gamma + \\beta$. However, empirical and theoretical analysis (Zhang & Sennrich, 2019) demonstrated that the mean-centering step ($\\mu = 0$) contributes negligible regularization or representational value, while imposing significant computational overhead (two reduction passes per token). **Root Mean Square Normalization (RMSNorm)** replaces LayerNorm by scaling strictly by the root mean square of activation energies:\\n$$\\bar{x}_i = \\frac{x_i}{\\text{RMS}(x)} \\gamma_i, \\quad \\text{where } \\text{RMS}(x) = \\sqrt{\\frac{1}{D} \\sum_{j=1}^D x_j^2 + \\epsilon}$$\\nBy eliminating mean centering and learnable bias $\\beta$, RMSNorm reduces memory traffic by **30-50%**, becoming the standard normalization primitive across all modern LLMs (Llama-3, Mistral, Gemma, Qwen-2.5).",
    },
    {
      type: "mental_model",
      title: "Mental Model: Energy Normalization on the Hypersphere",
      visualIntuition:
        "Activation Vector x in R^D (length ||x|| varies wildly from 1.0 to 150.0 across layers)\\nRMSNorm: Projects vector x onto a fixed-radius hypersphere of radius sqrt(D), followed by channel-wise gain scaling gamma:\\n  x_norm = x / (||x|| / sqrt(D)) * gamma\\nPreserves directional angle while strictly bounding activation magnitude variance across 100+ deep layers!",
      invariant:
        "Scale Invariance Invariant: For any positive scalar multiplier alpha > 0, RMSNorm(alpha * x, gamma) = RMSNorm(x, gamma) identically, stabilizing training against fluctuating parameter norms.",
      stateTransitions:
        "Input Hidden States x -> Compute Sum of Squares sum(x_i^2) -> Multiply by 1/D and Add epsilon -> Square Root to obtain RMS(x) -> Scale Elements x_i / RMS(x) -> Multiply Learnable Gain gamma_i -> Output Normalized State.",
      naiveBottleneck:
        "Unfused LayerNorm executes 2 sequential global reductions (mean, then variance) followed by 2 elementwise passes, thrashing GPU DRAM bandwidth.",
      optimalInsight:
        "RMSNorm computes a single sum-of-squares reduction inside fast GPU registers/shared memory, executing in a single memory-coalesced fused pass.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: RMSNorm Scale Invariance & Gradient Dynamics",
      theorem:
        "Let $f(x) = \\text{RMSNorm}(x, \\gamma) = \\frac{x}{\\sqrt{\\frac{1}{D} \\|x\\|^2 + \\epsilon}} \\odot \\gamma$. For any scalar $\\alpha > 0$ (ignoring negligible $\\epsilon$), the forward output satisfies $f(\\alpha x) = f(x)$, and the analytical input Jacobian satisfies $\\nabla_x f(\\alpha x) = \\frac{1}{\\alpha} \\nabla_x f(x)$.",
      proof:
        "1. Forward Scale Invariance:\\n$$\\text{RMS}(\\alpha x) = \\sqrt{\\frac{1}{D} \\sum_{i=1}^D (\\alpha x_i)^2} = \\sqrt{\\alpha^2 \\left( \\frac{1}{D} \\sum_{i=1}^D x_i^2 \\right)} = \\alpha \\cdot \\text{RMS}(x)$$\\nTherefore:\\n$$f(\\alpha x) = \\frac{\\alpha x}{\\text{RMS}(\\alpha x)} \\odot \\gamma = \\frac{\\alpha x}{\\alpha \\cdot \\text{RMS}(x)} \\odot \\gamma = \\frac{x}{\\text{RMS}(x)} \\odot \\gamma = f(x)$$\\n\\n2. Gradient Homogeneity:\\nDifferentiating both sides of the identity $f(\\alpha x) = f(x)$ with respect to $x$ using the chain rule:\\n$$\\frac{\\partial}{\\partial x} [f(\\alpha x)] = \\alpha \\cdot \\nabla_x f(\\alpha x)$$\\nSince the right-hand side is $f(x)$ with derivative $\\nabla_x f(x)$:\\n$$\\alpha \\cdot \\nabla_x f(\\alpha x) = \\nabla_x f(x) \\implies \\nabla_x f(\\alpha x) = \\frac{1}{\\alpha} \\nabla_x f(x)$$\\n\\n3. Implication for Optimization:\\nIf weight updates cause activation scale $\\|x\\|$ to grow by factor $\\alpha$, the effective learning rate is automatically throttled by $1/\\alpha$, creating an inherent self-stabilizing negative feedback loop during gradient descent.",
    },
  ],
};

export const page_01_core = page1;
