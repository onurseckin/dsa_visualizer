import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_sampling_top_p_c1_p1",
  pageNumber: 1,
  title: "Autoregressive Sampling: Temperature, Top-K, Top-P, & Gumbel-Max",
  subtitle:
    "Generation Dynamics, Nucleus Probability Truncation, and Categorical Sampling Derivations",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Decoding Dynamics of Autoregressive Language Models",
      content:
        "In modern generative Large Language Models (LLMs), generation proceeds autoregressively by sampling next tokens from an unnormalized logit vector $z \\in \\mathbb{R}^V$ over vocabulary $V$ ($|V| \\approx 32{,}000$ to $128{,}000$) (Stanford CS336 / CS229). The decoding strategy dictates the balance between coherence (factual precision) and diversity (creativity).\n\nKey sampling mechanisms:\n1. **Temperature Scaling ($T > 0$)**:\n   Adjusts distribution entropy by scaling logits prior to softmax:\n   $$p_i(T) = \\frac{\\exp(z_i / T)}{\\sum_{j=1}^V \\exp(z_j / T)}$$\n   - High temperature ($T > 1$): Flattens distribution toward uniform, increasing entropy and lexical diversity.\n   - Low temperature ($0 < T < 1$): Sharpens peaks, concentrating mass on highest scoring tokens.\n   - Greedy Decoding ($T \\to 0$): Deterministically selects the mode $i^* = \\arg\\max_i z_i$.\n\n2. **Top-$K$ Truncation (Fan et al., 2018)**:\n   Restricts sampling to the $K$ tokens with highest probability: $S_K = \\{i \\mid \\text{rank}(z_i) \\le K\\}$, zeroing out all others and renormalizing. While effective at removing low-probability tail artifacts, fixed $K$ fails to adapt: $K=50$ is dangerously broad for deterministic syntax completions, yet overly restrictive for diverse creative writing.\n\n3. **Top-$P$ (Nucleus) Sampling (Holtzman et al., 2019)**:\n   Dynamically adapts the candidate pool by selecting the smallest subset of tokens whose cumulative probability mass exceeds threshold $P \\in (0, 1]$:\n   $$S_P = \\arg\\min_S |S| \\quad \\text{subject to} \\quad \\sum_{i \\in S} p_i \\ge P$$\n   - High entropy context (many plausible completions): $S_P$ dynamically expands to hundreds of tokens.\n   - Low entropy context (single obvious token): $S_P$ automatically contracts to 1 or 2 tokens, eliminating gibberish hallucinations.\n\n4. **Min-$P$ Sampling**:\n   Filters out tokens whose probability is less than a dynamic threshold proportional to the leading token: $S_{\\text{Min-P}} = \\{i \\mid p_i \\ge p_{\\text{base}} \\cdot \\max_j p_j\\}$.\n\n5. **The Gumbel-Max Trick (Gumbel, 1954; Maddison et al., 2014)**:\n   Enables exact categorical sampling without explicit cumulative distribution inversion. By perturbing logits with standard Gumbel noise $g_i \\sim \\text{Gumbel}(0, 1) = -\\ln(-\\ln u_i)$ (where $u_i \\sim U(0, 1)$):\n   $$k^* = \\arg\\max_{i \\in \\{1, \\dots, V\\}} (z_i + g_i) \\sim \\text{Categorical}(\\text{Softmax}(z))$$",
    },
    {
      type: "mental_model",
      title: "Nucleus Dynamic Tail Pruning & Gumbel Noise Mechanics",
      visualIntuition:
        "Sorted Token Probabilities (Vocabulary V = 32,000):\n\nProb ^   [Token 1: 0.50]  <-- CumSum = 0.50\n     |   [Token 2: 0.25]  <-- CumSum = 0.75\n     |   [Token 3: 0.15]  <-- CumSum = 0.90  <-- Top-P Cutoff (P = 0.90)\n     |   -------------------------------------------------------------\n     |   [Token 4: 0.04]  <-- CumSum = 0.94  (PRUNED: Probability -> 0.0)\n     |   [Token 5: 0.02]  <-- CumSum = 0.96  (PRUNED: Probability -> 0.0)\n     |   [Token 6..V: ~0]                    (PRUNED: 31,995 tokens discarded!)\n     +-----------------------------------------> Tokens\n\nGumbel-Max Sampling Dynamics:\n  Logits z: [2.5, 1.8, 0.2]\n  Draw independent Gumbel noise g_i ~ -ln(-ln(U(0, 1))):\n  Perturbed z + g: [2.5 + 0.31 = 2.81,  1.8 + 1.24 = 3.04,  0.2 + (-0.4) = -0.2]\n  --> argmax selects Index 1! Exactly samples according to Softmax(z) in O(V) parallel time!",
      invariant:
        "Nucleus Renormalization Invariant: sum_{i in S_P} p'_i = 1.0. Gumbel argmax probability P(argmax(z_i + g_i) = k) = exp(z_k) / sum(exp(z_j)).",
      stateTransitions:
        "Raw Logits -> Scale by Temperature (z/T) -> Compute Softmax Probabilities -> Sort Descending -> Cumulative Sum Scan -> Threshold at P -> Sample Token.",
      naiveBottleneck:
        "Full sorting of 128,000 floats on GPU per token generated incurs massive O(V log V) memory bandwidth overhead during LLM decoding.",
      optimalInsight:
        "Use partial top-k / fused GPU scan kernels that compute softmax and nucleus thresholds in a single SRAM block without full off-chip DRAM sorting.",
    },
    {
      type: "math_proof",
      title: "Exact Derivation of the Gumbel-Max Sampling Trick",
      theorem:
        "Let $z_1, \\dots, z_V \\in \\mathbb{R}$ be unnormalized log-probabilities, and let $g_1, \\dots, g_V$ be independent and identically distributed standard Gumbel random variables with CDF $F(g) = \\exp(-\\exp(-g))$. The random index $K = \\arg\\max_{i \\in \\{1, \\dots, V\\}} (z_i + g_i)$ follows the exact Categorical distribution:\n$$P(K = k) = \\frac{\\exp(z_k)}{\\sum_{j=1}^V \\exp(z_j)}$$",
      proof:
        "1. Let $Y_i = z_i + g_i$. We determine the CDF of $Y_i$:\n   $$F_{Y_i}(y) = P(z_i + g_i \\le y) = P(g_i \\le y - z_i) = \\exp\\left( -\\exp(-(y - z_i)) \\right) = \\exp\\left( -e^{-y} e^{z_i} \\right)$$\n2. The probability density function of $Y_k$ is the derivative $f_{Y_k}(y) = \\frac{d}{dy} F_{Y_k}(y)$:\n   $$f_{Y_k}(y) = e^{-y} e^{z_k} \\exp\\left( -e^{-y} e^{z_k} \\right)$$\n3. The event $K = k$ occurs if $Y_k > Y_j$ for all $j \\ne k$. Conditioned on $Y_k = y$, by independence of the $g_j$:\n   $$P(K = k \\mid Y_k = y) = \\prod_{j \\ne k} P(Y_j < y) = \\prod_{j \\ne k} \\exp\\left( -e^{-y} e^{z_j} \\right) = \\exp\\left( -e^{-y} \\sum_{j \\ne k} e^{z_j} \\right)$$\n4. Integrate over all possible values of $y \\in (-\\infty, +\\infty)$:\n   $$P(K = k) = \\int_{-\\infty}^{+\\infty} f_{Y_k}(y) P(K = k \\mid Y_k = y) dy$$\n   $$= \\int_{-\\infty}^{+\\infty} e^{-y} e^{z_k} \\exp\\left( -e^{-y} e^{z_k} \\right) \\cdot \\exp\\left( -e^{-y} \\sum_{j \\ne k} e^{z_j} \\right) dy$$\n   $$= e^{z_k} \\int_{-\\infty}^{+\\infty} e^{-y} \\exp\\left( -e^{-y} \\sum_{j=1}^V e^{z_j} \\right) dy$$\n5. Perform substitution: let $u = e^{-y} \\sum_{j=1}^V e^{z_j}$, so $du = -e^{-y} \\sum_{j=1}^V e^{z_j} dy$:\n   $$P(K = k) = e^{z_k} \\cdot \\frac{1}{\\sum_{j=1}^V e^{z_j}} \\int_0^{\\infty} e^{-u} du = \\frac{\\exp(z_k)}{\\sum_{j=1}^V \\exp(z_j)} \\cdot \\left[ -e^{-u} \\right]_0^\\infty = \\frac{\\exp(z_k)}{\\sum_{j=1}^V \\exp(z_j)}$$\n6. This proves that taking the argmax over Gumbel-perturbed logits samples tokens exactly according to the Softmax distribution with zero mathematical distortion.",
    },
  ],
};
