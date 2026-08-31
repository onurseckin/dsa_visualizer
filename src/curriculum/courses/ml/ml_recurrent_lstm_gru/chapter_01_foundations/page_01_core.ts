import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_recurrent_lstm_gru_c1_p1",
  pageNumber: 1,
  title: "Recurrent Networks: BPTT, LSTM Cell State & GRU Mechanics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Vanishing Gradient Catastrophe: Why Vanilla RNNs Failed & LSTMs Conquered",
      content:
        "Standard Recurrent Neural Networks (RNN) process sequential data by updating a recurrent hidden state $h_t = \\tanh(W_{hh} h_{t-1} + W_{xh} x_t + b)$. However, during Backpropagation Through Time (BPTT), the gradient of the loss at step $T$ with respect to step $t$ involves a repeated matrix product: $\\frac{\\partial h_T}{\\partial h_t} = \\prod_{k=t+1}^T W_{hh}^T \\text{diag}(1 - h_k^2)$. Because the spectral radius $\\rho(W_{hh}) < 1$ causes gradients to vanish exponentially as $O(\\lambda^{T-t})$, vanilla RNNs cannot capture temporal dependencies beyond 10-20 steps. **Long Short-Term Memory (LSTM, Hochreiter & Schmidhuber, 1997)** solves this through the **Constant Error Carousel (CEC)**: an additive linear cell state $C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t$ whose derivative $\\frac{\\partial C_t}{\\partial C_{t-1}} = f_t$ enables gradients to flow across thousands of timesteps without exponential decay.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Additive Highway & Gating Valves",
      visualIntuition:
        "Cell State Highway: [ C_{t-1} ] --( Forget Valve f_t )--> (+) --( Add Candidate i_t * C_tilde )--> [ C_t ]\\n                                                            |\\n                                                     ( tanh(C_t) )\\n                                                            |\\n                                                   ( Output Valve o_t )\\n                                                            |\\n                                                      [ Hidden State h_t ]",
      invariant:
        "Constant Error Carousel Invariant: When the forget gate is saturated at f_t = 1.0, the cell state derivative dC_t / dC_{t-1} = 1.0 identically, propagating loss error across infinite temporal horizons with zero attenuation.",
      stateTransitions:
        "Input (x_t, h_{t-1}) -> Fused 4x Gate Linear Projection -> Split into (f_t, i_t, c_tilde_t, o_t) -> Elementwise Sigmoid & Tanh Activations -> Update Cell State C_t = f_t * C_{t-1} + i_t * c_tilde_t -> Compute Hidden State h_t = o_t * tanh(C_t) -> Emit Output.",
      naiveBottleneck:
        "Computing 4 separate matrix multiplications for each gate launches 4 distinct GPU kernels per timestep, wasting 80% of execution time on kernel launch overhead.",
      optimalInsight:
        "Stacking all 4 gate weight matrices into a single contiguous weight tensor W_4x fuses the linear projection into a single large GEMM per timestep.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Vanishing Gradient Exponential Decay in Vanilla RNNs",
      theorem:
        "In a vanilla RNN with recurrence $h_t = \\sigma(W h_{t-1} + U x_t)$, the temporal Jacobian satisfies $\\left\\| \\frac{\\partial h_T}{\\partial h_t} \\right\\| \\le (\\gamma \\|W\\|)^{T - t}$, where $\\gamma = \\sup_z |\\sigma'(z)|$. If $\\gamma \\|W\\| < 1$, the gradient vanishes exponentially to 0 as sequence length $(T - t) \\to \\infty$.",
      proof:
        "1. Single Step Jacobian Formulation:\\nLet $z_k = W h_{k-1} + U x_k$. Then $h_k = \\sigma(z_k)$.\\nBy the chain rule:\\n$$\\frac{\\partial h_k}{\\partial h_{k-1}} = \\frac{\\partial h_k}{\\partial z_k} \\frac{\\partial z_k}{\\partial h_{k-1}} = \\text{diag}(\\sigma'(z_k)) W$$\\n\\n2. Multi-Step Chain Rule Across Sequence (BPTT):\\n$$\\frac{\\partial h_T}{\\partial h_t} = \\prod_{k=t+1}^T \\frac{\\partial h_k}{\\partial h_{k-1}} = \\prod_{k=t+1}^T \\text{diag}(\\sigma'(z_k)) W$$\\n\\n3. Matrix Operator Norm Upper Bound:\\nTaking the matrix 2-norm and applying sub-multiplicativity:\\n$$\\left\\| \\frac{\\partial h_T}{\\partial h_t} \\right\\| \\le \\prod_{k=t+1}^T \\|\\text{diag}(\\sigma'(z_k))\\| \\cdot \\|W\\|$$\\nSince $\\|\\text{diag}(\\sigma'(z_k))\\| = \\max_j |\\sigma'(z_{k, j})| \\le \\gamma$:\\n$$\\left\\| \\frac{\\partial h_T}{\\partial h_t} \\right\\| \\le \\prod_{k=t+1}^T (\\gamma \\|W\\|) = (\\gamma \\|W\\|)^{T - t}$$\\n\\n4. Conclusion:\\nFor $\\tanh$, $\\gamma = 1$. If maximum singular value $\\sigma_{\\max}(W) < 1$, then $(\\sigma_{\\max}(W))^{T-t} \\to 0$ exponentially fast, proving that error signals cannot bridge long temporal horizons.",
    },
  ],
};

export const page_01_core = page1;
