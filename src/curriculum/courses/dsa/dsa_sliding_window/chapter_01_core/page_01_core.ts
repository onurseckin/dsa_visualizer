import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_sliding_window_c1_p1",
  pageNumber: 1,
  title: "First Principles: Sliding Window",
  sections: [
    {
      type: "math_proof",
      title: "Mathematical Precision",
      theorem: "Fundamental theory of Sliding Window",
      proof:
        "Let W_i be the window at step i. The state S(W_{i+1}) = S(W_i) + f(x_{i+k}) - f(x_i). This mathematically proves the incremental window delta invariant, reducing O(k) work to O(1).",
    },
    {
      type: "mental_model",
      title: "Concrete Traces",
      visualIntuition: "Step-by-step memory pointer trace.",
      invariant:
        "Incremental window delta invariant maintains the aggregate state strictly via boundary additions and removals.",
      stateTransitions: "State transitions maintain the invariant incrementally.",
      naiveBottleneck: "Recomputing overlapping subproblems scales poorly.",
      optimalInsight: "Incremental state updates yield O(1) transitions.",
    },
    {
      type: "code_progression",
      title: "Code Progression",
      language: "python",
      stages: [
        { label: "Naive", code: "def naive(): pass", explanation: "Naive implementation." },
        {
          label: "Algorithmic Optimal",
          code: "def optimal():\n    # O(N) by applying the incremental window delta invariant\n    pass",
          explanation: "Algorithmic Optimal logic.",
        },
      ],
    },
  ],
};
