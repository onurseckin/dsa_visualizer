import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_normalization_rmsnorm_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Normalization Layers",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_normalization_rmsnorm",
      title: "RMSNorm & Normalization Architectures Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Triton-Style Warp Shuffle RMSNorm Kernel",
          description:
            "Implement a parallel Python-emulated warp shuffle reduction function that computes `sum(x^2)` across 32 threads in $\\log_2(32) = 5$ steps and normalizes a 1D activation vector.",
          problemStatement:
            "Given 1D float32 array, execute warp-level binary reduction and return normalized array and computed RMS value.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Epsilon Stability Invariant in Zero-Vector Inputs",
          prompt:
            "Prove that the inclusion of numerical stability constant $epsilon = 10^{-6}$ inside $\text{RMS}(x) = sqrt{\frac{1}{D} sum x_i^2 + epsilon}$ bounds the gradient magnitude $|\nabla_x mathcal{L}|$ for any arbitrary input $x \to mathbf{0}$, preventing division-by-zero runtime exceptions.",
          statement:
            "Demonstrate how epsilon regularizes the denominator in zero-activation regimes.",
          proofOutline:
            "1. When $x = mathbf{0}$, $\text{RMS}(0) = sqrt{0 + epsilon} = sqrt{epsilon} = 10^{-3}$.\\n2. The input gradient formula evaluates: $\nabla_x mathcal{L} = \frac{1}{sqrt{epsilon}} [g odot gamma - 0] = \frac{g odot gamma}{sqrt{epsilon}}$.\\n3. For finite incoming gradient $g$, the resulting gradient is bounded by $|g odot gamma| / sqrt{epsilon}$, completely preventing NaN or $infty$ hardware exceptions.",
          engineeringContext:
            "Critical for preventing unrecoverable NaN loss spikes when attention masks zero out entire token representations.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Pre-LayerNorm vs. Post-LayerNorm Gradient Flow",
          prompt:
            "Why did modern LLMs completely replace the original Attention Is All You Need 'Post-LN' architecture ($x_{l+1} = \\text{Norm}(x_l + \\text{Sublayer}(x_l))$) with 'Pre-LN' ($x_{l+1} = x_l + \\text{Sublayer}(\\text{Norm}(x_l))$)? How does Pre-LN create an unobstructed clean residual identity highway that enables training 100+ layer networks without learning rate warmups?",
          engineeringContext:
            "Governs all modern Transformer architectures (Llama, GPT-4, Mistral, Gemma).",
        },
      ],
      partD_stressTests: [
        {
          title: "Epsilon Scale Mismatch Under FP16 Precision",
          scenario:
            "A developer sets `eps = 1e-12` in FP16 mixed precision training. In FP16, the smallest positive normal number is $2^{-14} approx 6.1 \times 10^{-5}$. Because $10^{-12} < 6.1 \times 10^{-5}$, `eps` is completely flushed to zero ($0.0$). When a zero-padded padding token passes through RMSNorm, `RMS(0) = 0.0`, triggering a fatal `0.0 / 0.0 = NaN` loss explosion.",
          failureMode:
            "FP16 underflow of epsilon causing immediate NaN model collapse; resolved by clamping `eps >= 1e-6` in FP16/BF16.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
