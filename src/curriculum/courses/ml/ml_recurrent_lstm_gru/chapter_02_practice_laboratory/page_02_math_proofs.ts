import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_recurrent_lstm_gru_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: LSTM Gradient Invariants & GRU Convex Combinations",
  sections: [
    {
      type: "math_proof",
      title: "LSTM Forget Gate Gradient Lower Bound Theorem",
      theorem:
        "Let the forget gate activations satisfy $f_t \\ge 1 - \\epsilon$ for all $t \\in \\{1, \\dots, T\\}$ with $0 \\le \\epsilon < 1$. The cell state gradient magnitude across $T$ timesteps is strictly bounded below by $\\left\\| \\frac{\\partial C_T}{\\partial C_0} \\right\\| \\ge (1 - \\epsilon)^T \\approx e^{-\\epsilon T} > 0$, guaranteeing non-vanishing gradient flow for small $\\epsilon$.",
      proof:
        "1. Product of Forget Gates:\\nBy the additive cell state recurrence $C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t$, the multi-step Jacobian product is:\\n$$\\frac{\\partial C_T}{\\partial C_0} = \\prod_{t=1}^T \\text{diag}(f_t)$$\\n\\n2. Lower Bounding the Diagonal Product:\\nSince each element $f_{t, j} \\ge 1 - \\epsilon$:\\n$$\\left( \\frac{\\partial C_T}{\\partial C_0} \\right)_{jj} = \\prod_{t=1}^T f_{t, j} \\ge (1 - \\epsilon)^T$$\\n\\n3. Asymptotic Taylor Expansion:\\nFor small $\\epsilon > 0$, using $\\ln(1 - \\epsilon) \\approx -\\epsilon$:\\n$$(1 - \\epsilon)^T = \\exp(T \\ln(1 - \\epsilon)) \\approx e^{-\\epsilon T}$$\\n\\n4. Comparison with Vanilla RNN:\\nIn a vanilla RNN, the gradient decays as $(\\sigma_{\\max}(W))^T$. For $\\sigma_{\\max}(W) = 0.5$, decay after 100 steps is $0.5^{100} \\approx 10^{-30}$.\\nIn an LSTM with $f_t = 0.99$ ($\\epsilon = 0.01$), $(0.99)^{100} \\approx 0.366$ (a 36.6% retention factor!), proving that the additive carousel preserves gradient signals across hundreds of timesteps.",
    },
    {
      type: "math_proof",
      title: "GRU Hidden State Convex Combination Invariant",
      theorem:
        "In a Gated Recurrent Unit (GRU), the hidden state update $h_t = (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde{h}_t$ (where $z_t \\in (0, 1)^D$) is a convex combination of previous state $h_{t-1}$ and candidate state $\\tilde{h}_t$, guaranteeing that $\\|h_t\\|_\\infty \\le \\max(\\|h_{t-1}\\|_\\infty, 1)$.",
      proof:
        "1. Elementwise Convex Combination:\\nFor each coordinate $j \\in \\{1, \\dots, D\\}$:\\n$$h_{t, j} = (1 - z_{t, j}) h_{t-1, j} + z_{t, j} \\tilde{h}_{t, j}$$\\nSince $z_{t, j} = \\sigma(\\dots) \\in (0, 1)$, the coefficients $(1 - z_{t, j})$ and $z_{t, j}$ are strictly positive and sum to $(1 - z_{t, j}) + z_{t, j} = 1$.\\n\\n2. Bounding Candidate State:\\nSince $\\tilde{h}_t = \\tanh(\\dots)$, every candidate coordinate satisfies $|\\tilde{h}_{t, j}| \\le 1$.\\n\\n3. Triangle Inequality on Convex Sum:\\n$$|h_{t, j}| \\le (1 - z_{t, j}) |h_{t-1, j}| + z_{t, j} |\\tilde{h}_{t, j}| \\le (1 - z_{t, j}) \\|h_{t-1}\\|_\\infty + z_{t, j} (1)$$\\n$$\\le \\max(\\|h_{t-1}\\|_\\infty, 1) \\cdot [(1 - z_{t, j}) + z_{t, j}] = \\max(\\|h_{t-1}\\|_\\infty, 1)$$\\n\\n4. Conclusion:\\nBy mathematical induction, if $\\|h_0\\|_\\infty \\le 1$, then $\\|h_t\\|_\\infty \\le 1$ for all $t \\ge 1$, strictly preventing hidden activation explosion without explicit normalization layers.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
