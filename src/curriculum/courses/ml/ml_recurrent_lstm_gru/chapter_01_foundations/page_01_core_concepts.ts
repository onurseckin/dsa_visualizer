import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_recurrent_lstm_gru_c1_p1_concepts",
  pageNumber: 1,
  title: "Core Concepts: LSTM Cell State, GRU Architecture & Temporal Barriers",
  sections: [
    {
      type: "prose",
      title: "LSTM vs. GRU: Gating Equations & Architectural Comparison",
      content:
        "Modern recurrent architectures regulate information flow through multiplicative gating vectors:\\n\\n1. **Long Short-Term Memory (LSTM)**:\\n- Forget Gate: $f_t = \\sigma(W_f [h_{t-1}, x_t] + b_f)$\\n- Input Gate: $i_t = \\sigma(W_i [h_{t-1}, x_t] + b_i)$\\n- Candidate Cell State: $\\tilde{C}_t = \\tanh(W_c [h_{t-1}, x_t] + b_c)$\\n- Cell State Update: $C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t$\\n- Output Gate: $o_t = \\sigma(W_o [h_{t-1}, x_t] + b_o)$\\n- Hidden State: $h_t = o_t \\odot \\tanh(C_t)$\\n\\n2. **Gated Recurrent Unit (GRU, Cho et al., 2014)**:\\nMerges cell state and hidden state, using only 2 gates (Reset $r_t$ and Update $z_t$):\\n- Reset Gate: $r_t = \\sigma(W_r [h_{t-1}, x_t] + b_r)$\\n- Update Gate: $z_t = \\sigma(W_z [h_{t-1}, x_t] + b_z)$\\n- Candidate Hidden: $\\tilde{h}_t = \\tanh(W_h [r_t \\odot h_{t-1}, x_t] + b_h)$\\n- Hidden State Update: $h_t = (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde{h}_t$\\nGRU eliminates 25% of parameter matrices while matching LSTM performance on most sequence modeling tasks.",
    },
    {
      type: "mental_model",
      title: "Mental Model: The Sequential Dependency Barrier (Why Transformers Won)",
      visualIntuition:
        "Recurrent RNN/LSTM/GRU: Step 1 ----> Step 2 ----> Step 3 ----> ... ----> Step 4096\\n  (Strictly sequential! Cannot compute Step 100 without waiting for Steps 1..99! GPU utilization < 15%)\\nTransformer Self-Attention: [ Step 1, Step 2, Step 3, ..., Step 4096 ] --( Parallel GEMM Q x K^T )--> All attention scores computed simultaneously! (100% GPU Tensor Core utilization!)",
      invariant:
        "Temporal Serialization Invariant: The hidden state dependency h_t = f(h_{t-1}, x_t) fundamentally forbids intra-sequence parallelization during training, bounding training throughput to O(T) serial steps.",
      stateTransitions:
        "Timestep 1 (Compute h_1, C_1) -> Timestep 2 (Wait for h_1, compute h_2, C_2) -> ... -> Timestep T (Wait for h_{T-1}, compute h_T, C_T).",
      naiveBottleneck:
        "Sequential kernel launches per timestep under-utilize massive parallel GPU thread arrays.",
      optimalInsight:
        "Linear attention and Selective State Space Models (Mamba / S4) circumvent this barrier by reformulating recurrence as parallel associative scans ($O(\\log T)$ span).",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: LSTM Constant Error Carousel (CEC) Gradient Preservation",
      theorem:
        "In an LSTM cell, the partial derivative of cell state $C_t$ with respect to prior state $C_{t-1}$ is $\\frac{\\partial C_t}{\\partial C_{t-1}} = \\text{diag}(f_t) + \\frac{\\partial f_t}{\\partial C_{t-1}} C_{t-1} + \\frac{\\partial i_t}{\\partial C_{t-1}} \\tilde{C}_t + i_t \\frac{\\partial \\tilde{C}_t}{\\partial C_{t-1}}$. When gating changes slowly, $\\frac{\\partial C_t}{\\partial C_{t-1}} \\approx \\text{diag}(f_t)$, enabling constant error propagation across arbitrary horizons when $f_t \\approx \\mathbf{1}$.",
      proof:
        "1. Differentiating the Additive Recurrence $C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t$:\\nBy the product rule on vectors:\\n$$\\frac{\\partial C_t}{\\partial C_{t-1}} = \\text{diag}(f_t) + \\left( \\frac{\\partial f_t}{\\partial C_{t-1}} \\right) C_{t-1} + \\left( \\frac{\\partial i_t}{\\partial C_{t-1}} \\right) \\tilde{C}_t + \\text{diag}(i_t) \\left( \\frac{\\partial \\tilde{C}_t}{\\partial C_{t-1}} \\right)$$\\n\\n2. Multi-Step Cell State Gradient Flow:\\n$$\\frac{\\partial \\mathcal{L}}{\\partial C_t} = \\frac{\\partial \\mathcal{L}}{\\partial C_T} \\prod_{k=t+1}^T \\frac{\\partial C_k}{\\partial C_{k-1}} \\approx \\frac{\\partial \\mathcal{L}}{\\partial C_T} \\prod_{k=t+1}^T \\text{diag}(f_k)$$\\n\\n3. Forget Gate Bias Initialization Invariant (Jozefowicz et al., 2015):\\nIf the forget gate bias is initialized to a positive value (e.g. $b_f = 1.0$ or $2.0$), then $\\sigma(b_f) \\approx 1.0$.\\nThus, $\\prod_{k=t+1}^T f_k \\approx \\mathbf{1}^{T-t} = \\mathbf{1}$, completely eliminating the exponential decay factor $(\\gamma \\|W\\|)^{T-t}$ of vanilla RNNs.",
    },
  ],
};
