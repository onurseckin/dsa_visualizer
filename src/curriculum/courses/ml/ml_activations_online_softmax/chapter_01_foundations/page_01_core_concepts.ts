import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_activations_online_softmax_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: Modern Activation Zoo & Special Function Units (SFU)",
  sections: [
    {
      type: "prose",
      title: "The Modern Activation Zoo: GELU, SiLU, and SwiGLU",
      content:
        "Standard ReLU non-linearities suffer from a non-differentiable sharp corner at $x = 0$ and the 'Dying ReLU' problem. Modern foundation models adopt smooth probabilistic and gated activations:\\n\\n1. **GELU (Gaussian Error Linear Unit, Hendrycks & Gimpel, 2016)**:\\n$$\\text{GELU}(x) = x \\cdot \\Phi(x) = x \\cdot P(X \\le x) = \\frac{1}{2} x \\left[ 1 + \\text{erf}\\left( \\frac{x}{\\sqrt{2}} \\right) \\right]$$\\nFast tanh approximation: $\\text{GELU}(x) \\approx 0.5 x \\left( 1 + \\tanh\\left( \\sqrt{\\frac{2}{\\pi}} (x + 0.044715 x^3) \\right) \\right)$.\\n\\n2. **SiLU / Swish (Ramachandran et al., 2017)**: $\\text{SiLU}(x) = x \\cdot \\sigma(x) = \\frac{x}{1 + e^{-x}}$.\\n\\n3. **SwiGLU (Swish-Gated Linear Unit, Shazeer, 2020)**: Decomposes FFN into two parallel projections that are multiplicatively gated: $\\text{SwiGLU}(x) = (\\text{SiLU}(x W_{\\text{gate}}) \\odot (x W_{\\text{up}})) W_{\\text{down}}$. SwiGLU provides superior gradient flow and higher representational capacity per parameter.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Hardware Special Function Units (SFU) vs Tensor Cores",
      visualIntuition:
        "Tensor Cores: 128 FP16 FMA (Multiply-Accumulate) operations per cycle! (Blazing fast)\\nSpecial Function Units (SFU): Only 16 SFU units per SM on NVIDIA GPUs! (Compute exp, log, sin, sqrt)\\nExecuting complex transcendental functions (erf, exp, tanh) can cause SFU instruction stalls, bottlenecking Tensor Cores unless fused into polynomial approximations.",
      invariant:
        "Softmax Shift Invariance: For any scalar constant c in R, Softmax(x + c) = Softmax(x) identically. Setting c = -max(x) guarantees that the largest exponent is e^0 = 1.0, strictly eliminating floating-point overflow.",
      stateTransitions:
        "Input Logits x -> Compute m = max(x) -> Subtract m: shifted = x - m (all elements <= 0) -> Fast SFU evaluation of e^shifted -> Reduction sum -> Division normalization.",
      naiveBottleneck:
        "Evaluating un-shifted exp(x) in FP16 causes immediate +inf overflow for any logit x > 11.089 (since e^11.089 > 65,504).",
      optimalInsight:
        "Subtracting the row maximum guarantees numerical stability, and fusing the operation into online softmax eliminates all DRAM roundtrips.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Analytical Derivative of GELU Activation",
      theorem:
        "The analytical derivative of the Gaussian Error Linear Unit $\\text{GELU}(x) = x \\Phi(x)$ with standard normal CDF $\\Phi(x) = \\frac{1}{\\sqrt{2\\pi}} \\int_{-\\infty}^x e^{-t^2/2} dt$ is $\\text{GELU}'(x) = \\Phi(x) + x \\phi(x) = \\Phi(x) + \\frac{x}{\\sqrt{2\\pi}} e^{-x^2/2}$.",
      proof:
        "1. Product Rule of Differentiation:\\n$$\\frac{d}{dx} \\text{GELU}(x) = \\frac{d}{dx} [x \\cdot \\Phi(x)] = \\left( \\frac{d}{dx} x \\right) \\Phi(x) + x \\left( \\frac{d}{dx} \\Phi(x) \\right)$$\\n\\n2. Fundamental Theorem of Calculus on Standard Normal CDF:\\n$$\\frac{d}{dx} \\Phi(x) = \\frac{d}{dx} \\left( \\frac{1}{\\sqrt{2\\pi}} \\int_{-\\infty}^x e^{-t^2 / 2} dt \\right) = \\frac{1}{\\sqrt{2\\pi}} e^{-x^2 / 2} = \\phi(x)$$\\nwhere $\\phi(x)$ is the standard normal probability density function (PDF).\\n\\n3. Combining Terms:\\n$$\\text{GELU}'(x) = 1 \\cdot \\Phi(x) + x \\cdot \\phi(x) = \\Phi(x) + \\frac{x}{\\sqrt{2\\pi}} e^{-x^2 / 2}$$\\nFor large positive $x$, $\\Phi(x) \\to 1$ and $x \\phi(x) \\to 0$, so $\\text{GELU}'(x) \\to 1$ (acting like linear identity).\\nFor large negative $x$, $\\Phi(x) \\to 0$ and $x \\phi(x) \\to 0$, so $\\text{GELU}'(x) \\to 0$ (acting like ReLU).\\nNear zero, $\\text{GELU}'(0) = 0.5 + 0 = 0.5$, providing a smooth, non-zero gradient flow through the origin.",
    },
  ],
};
