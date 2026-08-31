import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_arrays_and_hashing_c1_p1",
  pageNumber: 1,
  title: "First Principles: Arrays and Hashing",
  sections: [
    {
      type: "math_proof",
      title: "Mathematical Precision",
      theorem: "Fundamental theory of Arrays and Hashing",
      proof:
        "Robin Hood hashing reduces the variance of probe lengths. If expected probe length is bounded, lookup approaches exact O(1) mathematically.",
    },
    {
      type: "mental_model",
      title: "Concrete Traces",
      visualIntuition: "Step-by-step memory pointer trace.",
      invariant:
        "Linear probing keeps data dense (high L1 cache hit rate) but risks clustering. Quadratic probing reduces primary clustering but increases cache misses.",
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
          code: "def robin_hood_insert():\n    # Steal from the rich, give to the poor\n    pass",
          explanation: "Algorithmic Optimal logic.",
        },
      ],
    },
  ],
};
