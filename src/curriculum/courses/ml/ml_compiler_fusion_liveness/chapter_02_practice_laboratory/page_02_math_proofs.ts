import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_compiler_fusion_liveness_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Memory I/O Reduction & Fusion Limits",
  sections: [
    {
      type: "math_proof",
      title: "Elementwise Fusion HBM Memory I/O Reduction Theorem",
      theorem:
        "For a chain of $K$ consecutive elementwise operations $f_K(f_{K-1}(\\dots f_1(X)))$ on a tensor of size $N$ elements, unfused execution requires $2K \\cdot N \\cdot \\text{sizeof}(T)$ bytes of HBM I/O. Fused execution requires strictly $2 \\cdot N \\cdot \\text{sizeof}(T)$ bytes of HBM I/O, achieving an exact $K\\times$ reduction in global memory bandwidth demand.",
      proof:
        "1. Unfused Memory Accounting:\\nEach intermediate operator $f_i$ ($i \\in \\{1, \\dots, K\\}$) is launched as an independent GPU kernel:\\n- Reads input $X_{i-1}$ from HBM: $N \\cdot \\text{sizeof}(T)$ bytes.\\n- Writes output $X_i$ to HBM: $N \\cdot \\text{sizeof}(T)$ bytes.\\nTotal HBM data transferred across all $K$ kernels is:\\n$$V_{\\text{unfused}} = \\sum_{i=1}^K 2 N \\cdot \\text{sizeof}(T) = 2 K N \\cdot \\text{sizeof}(T) \\text{ bytes}$$\\n\\n2. Fused Memory Accounting:\\nThe compiler combines all $K$ functions into a single composite kernel $F(x) = (f_K \\circ f_{K-1} \\circ \\dots \\circ f_1)(x)$.\\n- Thread loads input element $x \\in X$ from HBM into register: $N \\cdot \\text{sizeof}(T)$ bytes.\\n- Evaluates all $K$ operations entirely within on-chip register memory without writing intermediate values to HBM.\\n- Thread writes final output $y = F(x)$ back to HBM: $N \\cdot \\text{sizeof}(T)$ bytes.\\nTotal HBM data transferred is:\\n$$V_{\\text{fused}} = 2 N \\cdot \\text{sizeof}(T) \\text{ bytes}$$\\n\\n3. Reduction Factor:\\n$$\\frac{V_{\\text{unfused}}}{V_{\\text{fused}}} = \\frac{2 K N \\cdot \\text{sizeof}(T)}{2 N \\cdot \\text{sizeof}(T)} = K$$\\nThis proves that vertical elementwise fusion scales memory bandwidth efficiency linearly with operator pipeline depth $K$.",
    },
    {
      type: "math_proof",
      title: "Optimal Subgraph Partitioning for Fusion Under Register Constraints",
      theorem:
        "Let a computation DAG have $V$ operations where fusing subgraph $S \\subseteq V$ provides speedup $\\text{benefit}(S) = \\sum_{e \\in E(S)} \\text{IO}(e)$ subject to register constraint $\\text{regs}(S) \\le R_{\\max}$. If the graph is a linear chain, the optimal partition of operations into fusion clusters can be computed in $O(V^2)$ time via dynamic programming.",
      proof:
        "1. Let $C(j)$ be the maximum execution benefit of optimally partitioning the prefix chain $v_1, v_2, \\dots, v_j$.\\n\\n2. Recurrence Relation:\\nFor each step $j$, the last fusion cluster in the optimal partition must be a sub-chain $v_{i+1}, \\dots, v_j$ for some $0 \\le i < j$ satisfying $\\text{regs}(v_{i+1:j}) \\le R_{\\max}$:\\n$$C(j) = \\max_{0 \\le i < j : \\text{regs}(v_{i+1:j}) \\le R_{\\max}} \\left[ C(i) + \\text{benefit}(v_{i+1:j}) \\right]$$\\n\\n3. Optimal Substructure and Complexity:\\nBecause subproblems exhibit optimal substructure and overlapping subproblems, dynamic programming evaluates all $j \\in \\{1, \\dots, V\\}$ by checking $i < j$. Total state evaluations: $\\sum_{j=1}^V j = \\frac{V(V+1)}{2} = O(V^2)$, proving polynomial-time solvability of optimal register-constrained fusion clustering.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
