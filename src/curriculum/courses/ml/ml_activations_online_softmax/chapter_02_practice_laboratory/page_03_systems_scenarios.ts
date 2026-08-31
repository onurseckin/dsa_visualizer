import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_activations_online_softmax_c2_p3",
  pageNumber: 4,
  title: "4-Part Socratic Diagnostic Suite: Activations & Online Softmax",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_activations_online_softmax",
      title: "Activations & Online Softmax Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Numerically Stable Cross-Entropy with Fused Log-Sum-Exp",
          description:
            "Implement a fused forward-backward kernel for cross-entropy loss that computes $\\mathcal{L} = -z_{\\text{target}} + \\text{LSE}(z)$ and analytical gradient $\\nabla_z \\mathcal{L} = p - \\mathbf{1}_{\\text{target}}$ without instantiating full exponent arrays.",
          problemStatement:
            "Given logits of shape [B, K] and integer target class array, return scalar loss and (B, K) gradient matrix.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Temperature Scaling Entropy Asymptotics",
          prompt:
            "Prove that for any non-degenerate logit vector $z$, $\\lim_{T \\to 0^+} \\text{Softmax}(z / T) = e_{\\arg\\max z}$ (one-hot indicator) and $\\lim_{T \\to \\infty} \\text{Softmax}(z / T) = \\frac{1}{N} \\mathbf{1}$ (uniform distribution).",
          statement: "Derive the extreme thermodynamic limits of temperature sampling.",
          proofOutline:
            "1. Let $m = \\max_i z_i$. Then $p_i(T) = \\frac{e^{(z_i - m)/T}}{\\sum_k e^{(z_k - m)/T}}$.\\n2. For $i = \\arg\\max z$, $z_i - m = 0 \\implies e^0 = 1$. For $j \\ne \\arg\\max z$, $z_j - m < 0 \\implies \\lim_{T \\to 0^+} e^{(z_j - m)/T} = e^{-\\infty} = 0$. Hence $p_i(0^+) = 1 / (1 + 0) = 1$.\\n3. As $T \\to \\infty$, $z_i / T \\to 0 \\implies e^{z_i / T} \\to 1$. Hence $p_i(\\infty) = 1 / \\sum_{k=1}^N 1 = 1 / N$.",
          engineeringContext:
            "Controls the exploration vs exploitation behavior in LLM sampling and RLHF algorithms.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "SwiGLU Intermediate Tensor Footprint vs. Standard MLP",
          prompt:
            "Why does SwiGLU use hidden expansion $d_{\\text{ffn}} = \\frac{8}{3} d_{\\text{model}}$ rather than $4 d_{\\text{model}}$ (used in standard ReLU MLPs)? How does this ensure identical total parameter count and FLOPs while providing 3 separate weight matrices ($W_{\\text{gate}}, W_{\\text{up}}, W_{\\text{down}}$)?",
          engineeringContext:
            "Standard architectural invariant in Llama-2, Llama-3, Mistral, and Gemma models.",
        },
      ],
      partD_stressTests: [
        {
          title: "Underflow Annihilation in Log-Softmax Subtraction",
          scenario:
            "A developer computes log-probabilities naively as `torch.log(torch.softmax(logits, dim=-1))`. When logits contain extreme negative values (e.g. attention causal mask with -10,000), `softmax` underflows to 0.0, and `log(0.0)` produces `-inf` or `NaN`, crashing loss backpropagation.",
          failureMode:
            "Unrecoverable NaN gradient explosion; solved by using fused `log_softmax(z) = z - LSE(z)`.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
