import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_affine_quantization_int8_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: INT8 Quantization",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_affine_quantization_int8",
      title: "INT8 Quantization & Systems Acceleration Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Block-Wise (Group Size 64) Symmetric Quantizer",
          description:
            "Implement a memory-coalesced block-wise quantizer that partitions hidden dimension $K$ into contiguous blocks of size $G = 64$, computing a dedicated FP16 scale factor per block to isolate local outliers.",
          problemStatement:
            "Given weight matrix W of shape [K, N], divide rows into blocks of size 64 and output packed INT8 weights and FP16 scale factors.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Signal-to-Quantization-Noise Ratio (SQNR) 6dB Rule",
          prompt:
            "Prove that each additional bit in uniform quantization increases the theoretical Signal-to-Quantization-Noise Ratio by approximately 6.02 dB: $\\text{SQNR} \\approx 6.02 b + 1.76 \\text{ dB}$.",
          statement:
            "Derive the fundamental relationship between bit-depth $b$ and dynamic range fidelity.",
          proofOutline:
            "1. Define full-scale sinusoidal power $P_{\\text{signal}} = \\frac{V_{\\text{peak}}^2}{2}$.\\n2. Quantization noise variance $P_{\\text{noise}} = \\frac{\\Delta^2}{12}$ where $\\Delta = \\frac{2 V_{\\text{peak}}}{2^b}$.\\n3. $\\text{SQNR} = 10 \\log_{10}\\left(\\frac{P_{\\text{signal}}}{P_{\\text{noise}}}\\right) = 10 \\log_{10}\\left(\\frac{3}{2} \\cdot 2^{2b}\\right) = 20 b \\log_{10}(2) + 10 \\log_{10}(1.5) \\approx 6.02 b + 1.76 \\text{ dB}$.",
          engineeringContext:
            "Quantifies why dropping from FP16 (16-bit) to INT8 (8-bit) incurs a theoretical ~48 dB drop in dynamic range if dynamic scaling is absent.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Weight-Only (W4A16 / W8A16) vs. Weight-Activation (W8A8) Serving",
          prompt:
            "In single-batch LLM decoding, why does Weight-Only Quantization (W4A16 with on-the-fly FP16 dequantization) provide nearly the same latency speedup as INT8 Tensor Core GEMM (W8A8)? At what batch size $B$ does W8A8 become strictly faster?",
          engineeringContext:
            "Single-batch decode is bounded by memory bandwidth (streaming weights), while large batches become compute-bound where INT8 Tensor Cores deliver $2\\times$ TOPS.",
        },
      ],
      partD_stressTests: [
        {
          title: "Zero-Point Shift Register Overflow in Accumulators",
          scenario:
            "When computing integer GEMM with $K = 8192$, two uint8 values can multiply to $255 \\times 255 = 65{,}025$. Accumulating over $K = 8192$ elements yields a maximum sum of $8192 \\times 65025 = 532{,}684{,}800$. If accumulators use 16-bit signed integers (int16 max = 32,767) instead of 32-bit registers, accumulators wrap around into negative values after only 1 element!",
          failureMode:
            "Catastrophic integer register overflow causing chaotic garbage output and all-NaN logits after softmax.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
