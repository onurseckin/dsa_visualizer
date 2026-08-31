import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_recurrent_lstm_gru_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Recurrent Networks & Sequence Models",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_recurrent_lstm_gru",
      title: "Recurrent Networks, LSTM & GRU Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Blelloch Parallel Associative Scan Linear Recurrence",
          description:
            "Implement a parallel associative prefix scan (Blelloch scan) in Python that computes a linear recurrence $h_t = a_t h_{t-1} + x_t$ across $T=1024$ timesteps in $O(\\log_2 T)$ sequential parallel steps.",
          problemStatement:
            "Given 1D arrays of scalar multipliers a and inputs x, evaluate parallel prefix scan using associative operator (a1, x1) * (a2, x2) = (a1 * a2, a2 * x1 + x2).",
        },
      ],
      partB_mathProofs: [
        {
          title: "Associativity of Linear Recurrence State Transition Operators",
          prompt:
            "Prove that the binary operator $\\otimes$ defined on pairs $(A_t, b_t)$ as $(A_2, b_2) \\otimes (A_1, b_1) = (A_2 A_1, A_2 b_1 + b_2)$ satisfies strict mathematical associativity: $((A_3, b_3) \\otimes (A_2, b_2)) \\otimes (A_1, b_1) = (A_3, b_3) \\otimes ((A_2, b_2) \\otimes (A_1, b_1))$.",
          statement:
            "Derive the algebraic group property that enables parallel scans in Mamba and Linear RNNs.",
          proofOutline:
            "1. Evaluate LHS: $(A_3 A_2, A_3 b_2 + b_3) \\otimes (A_1, b_1) = ((A_3 A_2) A_1, (A_3 A_2) b_1 + (A_3 b_2 + b_3)) = (A_3 A_2 A_1, A_3 A_2 b_1 + A_3 b_2 + b_3)$.\\n2. Evaluate RHS: $(A_3, b_3) \\otimes (A_2 A_1, A_2 b_1 + b_2) = (A_3 (A_2 A_1), A_3 (A_2 b_1 + b_2) + b_3) = (A_3 A_2 A_1, A_3 A_2 b_1 + A_3 b_2 + b_3)$.\\n3. Since LHS = RHS identically, the operator is associative, enabling $O(\\log T)$ parallel reduction trees.",
          engineeringContext:
            "The mathematical core of modern State Space Models (Mamba, S4, Linear Transformers).",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Forget Gate Positive Bias Initialization Invariant",
          prompt:
            "Why do all production LSTM implementations initialize the forget gate bias to $b_f = 1.0$ or $2.0$ instead of standard zero initialization? How does this prevent catastrophic amnesia during early training steps?",
          engineeringContext:
            "Standard requirement discovered by Jozefowicz et al. (ICML 2015) to preserve gradient flow.",
        },
      ],
      partD_stressTests: [
        {
          title: "Gradient Explosion in Unconstrained RNN Weight Matrices",
          scenario:
            "An engineer trains an unregularized RNN on sequences of length $T = 200$. At step 50, maximum singular value $\\sigma_{\\max}(W_{hh}) = 1.25$. The backpropagation gradient explodes by factor $(1.25)^{200} \\approx 3.2 \\times 10^{19}$, causing immediate `NaN` floating-point overflow across all optimizer parameter buffers.",
          failureMode:
            "Unbounded exponential gradient explosion; solved by gradient clipping (`torch.nn.utils.clip_grad_norm_`) or switching to LSTM/GRU architectures.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
