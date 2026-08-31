import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_speculative_decoding_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Expected Acceptance Length & Optimal Lookahead",
  sections: [
    {
      type: "math_proof",
      title: "Expected Number of Accepted Tokens Formula",
      theorem:
        "Assume independent draft token acceptance with constant probability $\\alpha = \\sum_x \\min(p(x), q(x)) \\in (0, 1)$ across $\\gamma$ speculative steps. The expected number of emitted tokens per target model forward pass is $\\mathbb{E}[M] = \\frac{1 - \\alpha^{\\gamma+1}}{1 - \\alpha}$.",
      proof:
        "1. Let $K$ be the number of accepted draft tokens before the first rejection ($0 \\le K \\le \\gamma$).\\n- For $k < \\gamma$, exactly $k$ draft tokens are accepted and the $(k+1)$-th token is rejected. This event occurs with probability:\\n$$\\mathbb{P}(K = k) = \\alpha^k (1 - \\alpha)$$\\nIn this case, 1 replacement token is sampled from the residual distribution $p'$, yielding $M = k + 1$ total emitted tokens.\\n\\n- For $k = \\gamma$, all $\\gamma$ draft tokens are accepted. This event occurs with probability:\\n$$\\mathbb{P}(K = \\gamma) = \\alpha^\\gamma$$\\nIn this case, 1 bonus token is sampled from $p(x_{\\gamma+1})$, yielding $M = \\gamma + 1$ total emitted tokens.\\n\\n2. Computing Expected Value $\\mathbb{E}[M]$:\\n$$\\begin{aligned} \\mathbb{E}[M] &= \\sum_{k=0}^{\\gamma - 1} (k + 1) \\mathbb{P}(K = k) + (\\gamma + 1) \\mathbb{P}(K = \\gamma) \\\\ &= \\sum_{k=0}^{\\gamma - 1} (k + 1) \\alpha^k (1 - \\alpha) + (\\gamma + 1) \\alpha^\\gamma \\\\ &= (1 - \\alpha) \\sum_{k=0}^{\\gamma - 1} (k + 1) \\alpha^k + (\\gamma + 1) \\alpha^\\gamma \\end{aligned}$$\\n\\n3. Using the derivative of geometric series $\\sum_{j=1}^n j x^{j-1} = \\frac{1 - (n+1)x^n + n x^{n+1}}{(1 - x)^2}$:\\n$$\\sum_{k=0}^{\\gamma - 1} (k + 1) \\alpha^k = \\frac{1 - (\\gamma + 1)\\alpha^\\gamma + \\gamma \\alpha^{\\gamma + 1}}{(1 - \\alpha)^2}$$\\nMultiplying by $(1 - \\alpha)$ and adding $(\\gamma + 1)\\alpha^\\gamma$:\\n$$\\mathbb{E}[M] = \\frac{1 - (\\gamma + 1)\\alpha^\\gamma + \\gamma \\alpha^{\\gamma + 1}}{1 - \\alpha} + \\frac{(\\gamma + 1)\\alpha^\\gamma (1 - \\alpha)}{1 - \\alpha} = \\frac{1 - \\alpha^{\\gamma + 1}}{1 - \\alpha}$$\\nThis completes the formal proof.",
    },
    {
      type: "math_proof",
      title: "Optimal Speculation Depth $\\gamma^*$ Derivation",
      theorem:
        "Let $c = \\frac{t_{\\text{draft}}}{t_{\\text{target}}} \\in (0, 1)$ be the cost ratio between draft and target models. The theoretical speculation depth $\\gamma^*$ that maximizes wall-clock speedup $S(\\gamma) = \\frac{1 - \\alpha^{\\gamma+1}}{(1 - \\alpha)(1 + c \\gamma)}$ satisfies the transcendental equation: $\\alpha^{\\gamma^* + 1} \\left(1 - \\ln(\\alpha)(\\gamma^* + 1/c)\\right) = 1$.",
      proof:
        "1. Define the objective function $f(\\gamma) = \\frac{1 - \\alpha^{\\gamma+1}}{1 + c \\gamma}$.\\n\\n2. Taking the continuous derivative with respect to $\\gamma$ and setting to zero:\\n$$\\frac{d}{d\\gamma} f(\\gamma) = \\frac{-\\alpha^{\\gamma+1} \\ln(\\alpha)(1 + c \\gamma) - c(1 - \\alpha^{\\gamma+1})}{(1 + c \\gamma)^2} = 0$$\\n\\n3. Equating numerator to zero:\\n$$-\\alpha^{\\gamma+1} \\ln(\\alpha)(1 + c \\gamma) - c + c \\alpha^{\\gamma+1} = 0$$\\n$$\\alpha^{\\gamma+1} \\left( c - \\ln(\\alpha)(1 + c \\gamma) \\right) = c$$\\nDividing through by $c$:\\n$$\\alpha^{\\gamma+1} \\left( 1 - \\ln(\\alpha) \\left( \\gamma + \\frac{1}{c} \\right) \\right) = 1$$\\nThis determines the unique maximum of the speedup curve. For $c = 0.05$ (very fast draft model) and $\\alpha = 0.8$, solving yields $\\gamma^* \\approx 6\\text{-}7$ lookahead tokens.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
