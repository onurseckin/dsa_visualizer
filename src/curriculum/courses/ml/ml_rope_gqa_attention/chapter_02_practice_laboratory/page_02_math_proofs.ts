import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_rope_gqa_attention_c2_p2",
  pageNumber: 2,
  title: "First-Principles Mathematical Proofs: Context Extension & RoPE Geometry",
  sections: [
    {
      type: "math_proof",
      title: "NTK-Aware Frequency Scaling Proof for RoPE Context Extension",
      theorem:
        "When extending context length from $L$ to $L' = s L$ (scaling factor $s > 1$), naive linear position interpolation $m' = m / s$ collapses high-frequency local resolution. NTK-aware frequency scaling modifies the base frequency $\\theta_{\\text{base}}' = \\theta_{\\text{base}} \\cdot s^{\\frac{d}{d-2}}$, preserving high-frequency local attention while stretching low frequencies to accommodate long-range context.",
      proof:
        "Recall that the $i$-th frequency in RoPE is defined as $\\theta_i = \\theta_{\\text{base}}^{-\\frac{2i}{d}}$ for $i \\in \\{0, 1, \\dots, d/2 - 1\\}$. The wavelength of the $i$-th rotary component is $\\lambda_i = \\frac{2\\pi}{\\theta_i} = 2\\pi \\theta_{\\text{base}}^{\\frac{2i}{d}}$.\\n\\n1. High Frequencies ($i \\to 0$):\\nAt $i = 0$, $\\lambda_0 = 2\\pi$. If linear interpolation is applied ($m' = m / s$), the effective wavelength becomes $2\\pi s$. For small relative token distances $\\Delta m = 1$, the angle change shrinks from $\\theta_0$ to $\\theta_0 / s$, destroying the model's ability to distinguish immediately adjacent tokens.\\n\\n2. Low Frequencies ($i \\to d/2 - 1$):\\nAt $i = d/2 - 1$, the wavelength $\\lambda_{\\max} = 2\\pi \\theta_{\\text{base}}^{\\frac{d-2}{d}}$ governs global sequence-level positioning. To extend the maximum context from $L$ to $s L$, this maximum wavelength must expand by a factor of $s$:\\n$$\\lambda_{\\max}' = s \\cdot \\lambda_{\\max} \\implies 2\\pi (\\theta_{\\text{base}}')^{\\frac{d-2}{d}} = s \\cdot 2\\pi \\theta_{\\text{base}}^{\\frac{d-2}{d}}$$\\n\\n3. Solving for $\\theta_{\\text{base}}'$:\\n$$(\\theta_{\\text{base}}')^{\\frac{d-2}{d}} = s \\cdot \\theta_{\\text{base}}^{\\frac{d-2}{d}} \\implies \\theta_{\\text{base}}' = \\theta_{\\text{base}} \\cdot s^{\\frac{d}{d-2}}$$\\n\\n4. Frequency Differential:\\nFor high frequencies ($i \\approx 0$), the scale factor is $s^{\\frac{d}{d-2} \\left(-\\frac{2i}{d}\\right)} \\approx s^0 = 1$, leaving local token distinction unperturbed. For lowest frequencies ($i = d/2 - 1$), the scale factor is $s^{\\frac{d}{d-2} \\left(-\\frac{d-2}{d}\\right)} = s^{-1} = 1/s$, perfectly scaling global context without fine-tuning catastrophically degrading short-context perplexity.",
    },
    {
      type: "math_proof",
      title: "GQA Memory Bandwidth Speedup Invariant",
      theorem:
        "In single-token autoregressive decoding, the memory bandwidth speedup of Grouped-Query Attention (with group ratio $G$) over Multi-Head Attention approaches $G$ as sequence length $N \\to \\infty$.",
      proof:
        "During generation of a single token ($N_Q = 1$), the total memory traffic consists of:\\n1. Model Weights ($W_Q, W_K, W_V, W_O$): $M_{\\text{weights}} = 4 d_{\\text{model}}^2 \\times \\text{sizeof(FP16)}$ bytes.\\n2. KV Cache for previous $N$ tokens: $M_{\\text{KV}} = 2 \\times N \\times H_{KV} \\times d_{\\text{head}} \\times \\text{sizeof(FP16)}$ bytes.\\n\\nFor MHA, $H_{KV} = H_Q$, so $M_{\\text{KV}}^{\\text{MHA}} = 4 N H_Q d_{\\text{head}}$.\\nFor GQA, $H_{KV} = H_Q / G$, so $M_{\\text{KV}}^{\\text{GQA}} = \\frac{4 N H_Q d_{\\text{head}}}{G}$.\\n\\nThe memory read ratio per layer is:\\n$$\\text{Ratio}(N) = \\frac{M_{\\text{weights}} + M_{\\text{KV}}^{\\text{MHA}}}{M_{\\text{weights}} + M_{\\text{KV}}^{\\text{GQA}}} = \\frac{8 d_{\\text{model}}^2 + 4 N d_{\\text{model}}}{8 d_{\\text{model}}^2 + \\frac{4 N d_{\\text{model}}}{G}}$$\\nDividing numerator and denominator by $4 N d_{\\text{model}}$:\\n$$\\text{Ratio}(N) = \\frac{\\frac{2 d_{\\text{model}}}{N} + 1}{\\frac{2 d_{\\text{model}}}{N} + \\frac{1}{G}}$$\\nAs context length $N \\gg d_{\\text{model}}$ (e.g. $N = 32{,}768 \\gg 4{,}096$), $\\frac{2 d_{\\text{model}}}{N} \\to 0$, yielding $\\lim_{N \\to \\infty} \\text{Ratio}(N) = \\frac{1}{1/G} = G$. Thus, memory traffic decreases by exactly $G\\times$, accelerating token decode throughput proportionally.",
    },
  ],
};
