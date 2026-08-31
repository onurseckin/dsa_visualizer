import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_speculative_decoding_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Speculative Decoding",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_speculative_decoding",
      title: "Speculative Decoding Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "KV Cache Rewind & Rollback Management",
          description:
            "Implement the KV cache rollback logic for target and draft models. When rejection occurs at speculative token index $k < \\gamma$, ensure that all KV states corresponding to tokens $k+1 \\dots \\gamma$ are instantly invalidated and their physical blocks recycled, while the newly resampled token is committed.",
          problemStatement:
            "Given current KV cache pointers and rejection index k, rewind target and draft KV cache offsets and commit the replacement token state cleanly.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Speedup Threshold Invariant: When is Speculation Harmful?",
          prompt:
            "Prove that if the mean token acceptance rate $\\alpha < \\frac{c}{1+c}$ where $c = t_{\\text{draft}} / t_{\\text{target}}$, speculative decoding is strictly slower than naive target decoding ($S(\\gamma) < 1.0$ for all $\\gamma \\ge 1$).",
          statement:
            "Derive the critical acceptance rate boundary $\\alpha_{\\text{crit}}$ below which speculative decoding causes net regression.",
          proofOutline:
            "1. At $\\gamma = 1$, expected tokens is $\\mathbb{E}[M] = 1 + \\alpha$.\\n2. Total latency is $t_{\\text{draft}} + t_{\\text{target}} = t_{\\text{target}}(1 + c)$.\\n3. Speedup $S(1) = \\frac{1 + \\alpha}{1 + c}$.\\n4. For $S(1) > 1$, we require $1 + \\alpha > 1 + c \\implies \\alpha > c$.\\n5. Generalizing to any $\\gamma \\ge 1$ proves that if $\\alpha < c$, speculation adds latency without sufficient token yield.",
          engineeringContext:
            "Enables dynamic runtime fallback: if online moving average of $\\alpha$ drops below $c$, the serving engine automatically disables speculation.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Medusa / EAGLE Multi-Head Speculation without Draft Model Weights",
          prompt:
            "How do Medusa and EAGLE eliminate the draft model's weight-loading memory traffic entirely by appending lightweight MLP prediction heads directly onto the target model's final hidden states? What is the impact on PCIe and NVLink bandwidth?",
          engineeringContext:
            "Eliminates inter-model memory contention and achieves $3\\times$ speedup on single-GPU instances.",
        },
      ],
      partD_stressTests: [
        {
          title: "Temperature Mismatch & Vocabulary Alignment Collapse",
          scenario:
            "If the Draft model uses a different tokenizer vocabulary or is evaluated at temperature $T_{\\text{draft}} = 0.2$ while the Target model is sampled at $T_{\\text{target}} = 1.0$, the probability ratio $p(x)/q(x)$ diverges wildly. Low draft temperature causes peaky $q(x)$, causing the target model to reject almost all creative tokens and triggering catastrophic fallback to single-token generation.",
          failureMode:
            "Acceptance rate $\\alpha$ drops below 0.15, causing a 40% net slowdown in serving latency.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
