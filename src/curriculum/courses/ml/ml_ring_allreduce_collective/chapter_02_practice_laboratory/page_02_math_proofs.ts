import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_ring_allreduce_collective_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Ring Collective Optimality & Halving/Doubling",
  sections: [
    {
      type: "math_proof",
      title: "Inductive Proof of Ring-AllReduce Correctness",
      theorem:
        "For any set of $P$ processors in a ring topology holding vectors $V_0, V_1, \\dots, V_{P-1} \\in \\mathbb{R}^S$, executing $(P-1)$ Reduce-Scatter steps followed by $(P-1)$ All-Gather steps guarantees that every processor holds the exact global sum $\\sum_{r=0}^{P-1} V_r$ across all $S$ elements.",
      proof:
        "1. Let each vector $V_r$ be partitioned into $P$ disjoint chunks $V_r = [v_{r,0}, v_{r,1}, \\dots, v_{r,P-1}]$.\\n\\n2. Reduce-Scatter Phase Induction:\\nLet $c_r^{(k)}$ be the value of chunk $k$ stored on processor $r$ at step $t$.\\nAt step $t=0$, $c_r^{(k)} = v_{r,k}$.\\nIn step $t \\in \\{1, \\dots, P-1\\}$, processor $r$ sends chunk $(r - t + 1) \\bmod P$ to $(r + 1) \\bmod P$ and receives chunk $(r - t) \\bmod P$ from $(r - 1) \\bmod P$.\\nBy induction on $t$, after $t$ steps, processor $r$ contains the partial sum of chunk $(r - t) \\bmod P$ from $(t + 1)$ distinct consecutive processors: $\\sum_{i=0}^t v_{(r - i) \\bmod P, (r - t) \\bmod P}$.\\nWhen $t = P - 1$, processor $r$ holds the full sum over all $P$ processors for chunk $(r - (P-1)) \\bmod P = (r + 1) \\bmod P$:\\n$$c_r^{((r+1)\\bmod P)} = \\sum_{i=0}^{P-1} v_{i, (r+1)\\bmod P}$$\\nThus, each of the $P$ distinct chunks is fully reduced on exactly one processor.\\n\\n3. All-Gather Phase Induction:\\nIn each step $t \\in \\{1, \\dots, P-1\\}$, each processor propagates its fully reduced chunk around the ring. By an identical induction, after $(P-1)$ steps, every processor receives all remaining $(P-1)$ fully reduced chunks, completing the global reduction with zero missing terms.",
    },
    {
      type: "math_proof",
      title: "All-Reduce Lower Bound Proof on Point-to-Point Links",
      theorem:
        "Any distributed reduction algorithm on $P$ processors with bidirectional link bandwidth $B$ requires sending at least $2 \\frac{P-1}{P} S$ bytes per processor, proving that Ring-AllReduce strictly achieves the theoretical lower bound on communication volume.",
      proof:
        "1. Every processor begins with $S$ independent local data elements that must contribute to the global sum.\\n2. To compute the reduction, at least $(P-1)S$ total words must be transferred across the network to accumulate all elements, requiring an average of $\\frac{P-1}{P} S$ words sent per processor.\\n3. Once reduced, the $(P-1)S$ completed results must be redistributed back to all other processors, requiring another $\\frac{P-1}{P} S$ words sent per processor.\\n4. Summing both phases yields a theoretical minimum communication volume of $V_{\\min} = 2 \\frac{P-1}{P} S$ bytes per processor.\\n5. Since Ring-AllReduce transfers exactly $2(P-1) \\frac{S}{P} = 2 \\frac{P-1}{P} S$ bytes per processor, it meets the theoretical physical lower bound with 100% efficiency.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
