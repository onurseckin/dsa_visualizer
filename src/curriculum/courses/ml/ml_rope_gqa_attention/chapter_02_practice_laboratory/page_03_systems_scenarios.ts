import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_rope_gqa_attention_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: RoPE & GQA",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_rope_gqa_attention",
      title: "RoPE & Grouped-Query Attention Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Zero-Copy GQA Head Stride Mapping",
          description:
            "Implement a strided tensor indexer that performs Grouped-Query Attention dot-products without allocating repeated KV head buffers in GPU DRAM. Use explicit stride arithmetic on $H_{KV}$ and group index $g \\in [0, G-1]$.",
          problemStatement:
            "Given Query tensor of shape [H_Q, N, d] and Key tensor of shape [H_KV, N, d], compute attention scores directly using strided head indexing.",
        },
      ],
      partB_mathProofs: [
        {
          title: "YaRN (Yet another RoPE extensioN) Interpolation Ratio",
          prompt:
            "Derive the YaRN piecewise ramp function $r(\\lambda) = \\min\\left(1, \\max\\left(0, \\frac{\\lambda - \\alpha}{\\beta - \\alpha}\\right)\\right)$ and prove why smooth blending between extrapolation and interpolation eliminates high-frequency ringing artifacts.",
          proofOutline:
            "1. Define low-wavelength cutoff $\\alpha = 2\\pi \\theta_{\\text{base}}^{2 i_{\\text{low}} / d}$ and high-wavelength cutoff $\\beta = 2\\pi \\theta_{\\text{base}}^{2 i_{\\text{high}} / d}$.\\n2. For $\\lambda < \\alpha$, no interpolation is applied ($r=0$, scale=1), preserving local token syntax.\\n3. For $\\lambda > \\beta$, full interpolation is applied ($r=1$, scale=$s$), stretching global attention.\\n4. For intermediate wavelengths, smooth affine interpolation ensures $C^0$ continuity, preventing frequency domain discontinuities that disrupt attention entropy.",
          engineeringContext:
            "Permits seamless zero-shot context length extension up to 128k/1M tokens without retraining.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Decode Operational Intensity & Memory Bus Utilization",
          prompt:
            "For a model with $H_Q = 32, H_{KV} = 4, d_{\\text{head}} = 128, N = 4096$, compute the exact arithmetic intensity (FLOP/byte) of the GQA attention kernel on an H100 GPU during generation of token 4097. Compare this with MHA ($H_{KV} = 32$).",
          engineeringContext:
            "Demonstrates why GQA moves decoding closer to the GPU compute roofline knee.",
        },
      ],
      partD_stressTests: [
        {
          title: "RoPE Frequency Boundary Underflow in FP16",
          scenario:
            "When using $\\theta_{\\text{base}} = 500{,}000$ and $d = 128$, the highest dimension index $i = 63$ evaluates $\\theta_{63} = (500000)^{-126/128} \\approx 2.45 \\times 10^{-6}$. In standard FP16 (which has 10 bits of mantissa), multiplying this small angle by small position differences results in complete subnormal underflow to zero, causing all token pairs to appear at relative distance zero.",
          failureMode:
            "Loss of positional sensitivity in deep attention channels; position embeddings fail silently unless frequency calculations are computed in FP32.",
        },
      ],
    },
  ],
};
