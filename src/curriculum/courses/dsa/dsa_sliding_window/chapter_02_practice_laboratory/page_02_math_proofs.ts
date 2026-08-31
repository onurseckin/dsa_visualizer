import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_sliding_window_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Monotonic Deque Linear Time Bound via Potential Method",
      theorem:
        "The Monotonic Deque algorithm for sliding window maximum over an array of size $N$ with window size $K$ executes in strictly at most $2N$ element push/pop operations, running in $\\Theta(N)$ total time.",
      proof: `
**Proof via Potential Method:**
1. Let $D_i$ denote the state of the double-ended queue after processing element $A[i]$ ($0 \\le i < N$).
2. Define the potential function $\\Phi_i = |D_i|$ (the number of elements currently stored in the deque).
3. We observe that $0 \\le \\Phi_i \\le K$ for all $i$, and $\\Phi_{-1} = 0$ (initially empty deque).
4. When processing index $i$:
   - **Step 1 (Expire old front):** If the front element index is older than $i - K + 1$, pop it from the front ($p_{\\text{front}} \\in \\{0, 1\\}$).
   - **Step 2 (Prune back):** While the deque is non-empty and $A[\\text{back}] \\le A[i]$, pop from the back ($p_{\\text{back}} \\ge 0$ times).
   - **Step 3 (Push new):** Push index $i$ onto the back (1 operation).
5. The actual cost of step $i$ is $c_i = 1 + p_{\\text{front}} + p_{\\text{back}}$.
6. The change in potential is:
   $$\\Delta \\Phi = \\Phi_i - \\Phi_{i-1} = 1 - p_{\\text{front}} - p_{\\text{back}}$$
7. The amortized cost $\\hat{c}_i$ is:
   $$\\hat{c}_i = c_i + \\Delta \\Phi = (1 + p_{\\text{front}} + p_{\\text{back}}) + (1 - p_{\\text{front}} - p_{\\text{back}}) = 2$$
8. The amortized cost of processing each element is strictly $2 = O(1)$.
9. Summing across all $N$ elements:
   $$\\sum_{i=0}^{N-1} c_i = \\sum_{i=0}^{N-1} \\hat{c}_i - \\Phi_{N-1} + \\Phi_{-1} = 2N - |D_{N-1}| \\le 2N$$
Thus, total queue operations cannot exceed $2N$, guaranteeing strictly linear $O(N)$ execution time. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Subarray Counting Decomposition Identity",
      theorem:
        "Let $f: \\mathcal{S} \\to \\mathbb{N}_0$ be a monotonic property on contiguous subarrays (i.e. if $S_1 \\subseteq S_2$, then $f(S_1) \\le f(S_2)$). The number of contiguous subarrays having property value exactly equal to $K$ satisfies:\n$$\\text{Count}(f(S) = K) = \\text{Count}(f(S) \\le K) - \\text{Count}(f(S) \\le K - 1)$$\nFurthermore, for any monotonic predicate $f(A[L \\dots R]) \\le K$, if $L$ is the minimal valid left boundary for right endpoint $R$, the number of valid subarrays ending at $R$ is exactly $(R - L + 1)$.",
      proof: `
**Proof via Set Partitioning & Indicator Decomposition:**
1. Let $\\Omega$ be the set of all $\\binom{N+1}{2}$ contiguous subarrays of array $A$.
2. For any non-negative integer $K$, define the subset $A_K = \\{ S \\in \\Omega \\mid f(S) \\le K \\}$.
3. Because $f(S)$ takes discrete non-negative integer values, $A_{K-1} \\subseteq A_K$.
4. The set of subarrays with property exactly equal to $K$ is the set difference:
   $$\\{ S \\in \\Omega \\mid f(S) = K \\} = A_K \\setminus A_{K-1}$$
5. Since $A_{K-1} \\subseteq A_K$, by the additive property of finite cardinality:
   $$|A_K \\setminus A_{K-1}| = |A_K| - |A_{K-1}|$$
6. **Counting Subarrays Ending at $R$:**
   - Fix right endpoint $R$. By monotonicity of $f$, if $f(A[L \\dots R]) \\le K$, then for any start index $j$ where $L \\le j \\le R$, the subarray $A[j \\dots R] \\subseteq A[L \\dots R]$, which implies $f(A[j \\dots R]) \\le f(A[L \\dots R]) \\le K$.
   - Conversely, for any start index $j < L$, by minimality of $L$, $f(A[j \\dots R]) > K$.
   - Therefore, the valid start indices for subarrays ending at $R$ are precisely $\\{ L, L+1, \\dots, R \\}$.
   - The cardinality of this contiguous integer range is $(R - L + 1)$.
7. Summing over all right endpoints $R \\in [0, N-1]$ computes $|A_K| = \\sum_{R=0}^{N-1} (R - L_R + 1)$ in strictly $O(N)$ time. $\\blacksquare$
      `,
    },
  ],
};
