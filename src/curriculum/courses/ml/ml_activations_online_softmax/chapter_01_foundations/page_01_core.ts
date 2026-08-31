import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_activations_online_softmax_c1_p1",
  pageNumber: 1,
  title: "Activation Functions & Online Softmax: Mathematical Foundations & Streaming Rescaling",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title:
        "The Activation & Normalization Wall: From 3-Pass HBM Thrashing to Fused SRAM Streaming",
      content:
        "Non-linear activation functions (GELU, SwiGLU, SiLU) and categorical normalizers (Softmax) are essential to prevent deep neural networks from collapsing into trivial linear maps. In modern Transformer architectures (Llama-3, DeepSeek-V3), **SwiGLU** (Swish-Gated Linear Unit) improves empirical perplexity over ReLU by gating linear representations: $\\text{SwiGLU}(x) = (x W \\cdot \\sigma(x W)) \\odot (x V) W_2$. Meanwhile, in attention mechanisms, computing Softmax naively requires **3 separate passes over global HBM**: (1) Find row max $m$, (2) Compute exponential denominator $d$, and (3) Normalize elements. For sequence length $S = 8192$, this 3-pass roundtrip wastes 85% of GPU memory bandwidth. **Online Softmax (Milakov & Gimelshtein, 2018; FlashAttention)** solves this by maintaining running maximums and dynamically rescaling partial sums on-the-fly inside fast SRAM in a single pass!",
    },
    {
      type: "mental_model",
      title: "Mental Model: Online Softmax Running Rescaling Invariant",
      visualIntuition:
        "Chunk 1: [ 2.0, 4.0 ]  --> Local max m_1 = 4.0,  local sum d_1 = e^(2-4) + e^(4-4) = e^-2 + 1 = 1.135\\nIncoming Chunk 2: [ 6.0 ]\\nNew global max m_new = max(4.0, 6.0) = 6.0\\nDynamic Rescaling: d_new = d_1 * e^(m_1 - m_new) + e^(6 - 6) = 1.135 * e^(4-6) + 1 = 1.135 * e^-2 + 1 = 1.153\\nLocal accumulator values are multiplied by e^(m_1 - m_new) = e^-2 without re-reading Chunk 1 from DRAM!",
      invariant:
        "Online Softmax Conservation Invariant: At every stream iteration, d_new = d_old * exp(m_old - m_new) + exp(x_i - m_new) mathematically equals the exact un-normalized exponential sum sum_{j=1}^i exp(x_j - m_new) with zero precision degradation.",
      stateTransitions:
        "Stream Token Logits -> Read Tile into SRAM -> Update Running Max m_new = max(m_old, tile_max) -> Rescale Running Denominator d_new = d_old * exp(m_old - m_new) + sum(exp(tile - m_new)) -> Rescale Output Accumulator O_new = O_old * exp(m_old - m_new) + (exp(tile - m_new) x V_tile) -> Final normalization O / d.",
      naiveBottleneck:
        "Standard 3-pass softmax writes intermediate un-normalized exponentials to slow DRAM, incurring 3 memory reads and 2 memory writes per element.",
      optimalInsight:
        "Online Softmax streams elements sequentially or in blocks, maintaining numerical stability and calculating normalized outputs entirely inside registers/SRAM.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Online Softmax Exact Equivalence Theorem",
      theorem:
        "Let $X = (x_1, x_2, \\dots, x_N)$ be a sequence of real numbers. Let $m_k = \\max_{1 \\le i \\le k} x_i$ and $d_k = \\sum_{i=1}^k e^{x_i - m_k}$. The recursive online update $m_k = \\max(m_{k-1}, x_k)$ and $d_k = d_{k-1} e^{m_{k-1} - m_k} + e^{x_k - m_k}$ (with $m_1 = x_1, d_1 = 1$) computes $d_N = \\sum_{i=1}^N e^{x_i - m_N}$ identically with exact numerical equality.",
      proof:
        "1. Base Case ($k = 1$):\\n$m_1 = x_1$, $d_1 = e^{x_1 - x_1} = 1 = \\sum_{i=1}^1 e^{x_i - m_1}$. Holds.\\n\\n2. Inductive Step:\\nAssume the invariant holds for $k - 1$:\\n$$d_{k-1} = \\sum_{i=1}^{k-1} e^{x_i - m_{k-1}}$$\\n\\n3. Applying Online Update at Step $k$:\\n$$d_k = d_{k-1} e^{m_{k-1} - m_k} + e^{x_k - m_k}$$\\nSubstituting the induction hypothesis for $d_{k-1}$:\\n$$d_k = \\left( \\sum_{i=1}^{k-1} e^{x_i - m_{k-1}} \\right) e^{m_{k-1} - m_k} + e^{x_k - m_k}$$\\nDistributing $e^{m_{k-1} - m_k}$ into the summation:\\n$$d_k = \\sum_{i=1}^{k-1} e^{(x_i - m_{k-1}) + (m_{k-1} - m_k)} + e^{x_k - m_k} = \\sum_{i=1}^{k-1} e^{x_i - m_k} + e^{x_k - m_k} = \\sum_{i=1}^k e^{x_i - m_k}$$\\n\\n4. Conclusion:\\nBy mathematical induction, $d_N = \\sum_{i=1}^N e^{x_i - m_N}$ holds identically for all $N$. Furthermore, since $x_i - m_N \\le 0$ for all $i$, every exponent is $\\le 0$, strictly preventing floating-point overflow ($e^{x_i - m_N} \\in (0, 1]$).",
    },
  ],
};

export const page_01_core = page1;
