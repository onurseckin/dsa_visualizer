import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_floating_point_kahan_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Floating Point & Kahan Summation",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_floating_point_kahan",
      title: "Floating-Point & Numerical Stability Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Hardware Bit-Level FP8 E4M3 vs E5M2 Encoder",
          description:
            "Implement a low-level bitwise converter from FP32 to NVIDIA FP8 formats (E4M3 with 1 sign, 4 exp, 3 mantissa, bias=7 and E5M2 with 1 sign, 5 exp, 2 mantissa, bias=15), handling saturating clamping, subnormals, and NaN bit patterns.",
          problemStatement:
            "Convert an array of FP32 floats to exact uint8 representations of E4M3 and E5M2 according to OCP (Open Compute Project) specifications.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Loss Scaling Invariant for FP16 Mixed Precision",
          prompt:
            "Prove that multiplying the loss by scale factor $S = 2^{16}$ before backpropagation shifts gradient magnitudes $\\nabla_W \\mathcal{L}$ into the normal FP16 range $[2^{-14}, 65504]$, and prove that un-scaling gradients in FP32 prior to optimizer updates incurs zero precision penalty.",
          statement:
            "Demonstrate how dynamic loss scaling prevents underflow without inducing numerical bias.",
          proofOutline:
            "1. By linearity of differentiation, $\\nabla_W (S \\cdot \\mathcal{L}) = S \\cdot \\nabla_W \\mathcal{L}$.\\n2. For small gradients $g \\sim 10^{-7}$, $S \\cdot g = 2^{16} \\cdot 10^{-7} \\approx 6.55 \\times 10^{-3} > 2^{-14}$, avoiding the FP16 subnormal/FTZ boundary.\\n3. In FP32 master weight updates, dividing by $S$ is an exact base-2 bit-shift on the exponent ($e' = e - 16$), introducing zero mantissa roundoff error.",
          engineeringContext:
            "Essential for stable training of multi-billion parameter LLMs under FP16/BF16 mixed precision.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "FP8 Block Scaling Factors (NVFP8 / DeepSeek-V3)",
          prompt:
            "Why does DeepSeek-V3 use fine-grained block-wise FP8 scaling (group size 128 elements with a dedicated FP8/FP32 scale factor per tile) rather than per-tensor scaling? How does block scaling prevent activation outlier channels from destroying the precision of normal tokens?",
          engineeringContext:
            "Enables training 671B parameter MoE models directly in FP8 with zero loss divergence.",
        },
      ],
      partD_stressTests: [
        {
          title: "Catastrophic Optimizer Weight Freezing under Subnormals",
          scenario:
            "During 100k-step pretraining in FP16 without master weights or Kahan compensation, weight $W = 12.0$ has gradient update $\\Delta W = 5.0 \\times 10^{-6}$. Because $\\text{ULP}(12.0) = 2^{-7} \\approx 0.0078125$, adding $\\Delta W$ evaluates $12.0 + 0.000005 = 12.0$, completely freezing weight updates and causing training loss to plateau permanently.",
          failureMode:
            "Model ceases learning completely despite non-zero gradient backpropagation; gradients are silently annihilated by floating-point mantissa alignment.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
