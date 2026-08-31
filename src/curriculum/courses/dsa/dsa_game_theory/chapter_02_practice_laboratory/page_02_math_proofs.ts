import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_game_theory_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Alpha-Beta Pruning Invariant & Search Equivalence Theorem",
      theorem:
        "For any game tree $T$, let $V_{\\text{minimax}}(u)$ be the exact minimax value of node $u$. The Alpha-Beta pruning procedure with window $[\\alpha, \\beta]$ returns a value $v$ such that:\n1. If $\\alpha < V_{\\text{minimax}}(u) < \\beta$, then $v = V_{\\text{minimax}}(u)$ (Exact value).\n2. If $V_{\\text{minimax}}(u) \\le \\alpha$, then $v \\le \\alpha$ (Upper bound failure).\n3. If $V_{\\text{minimax}}(u) \\ge \\beta$, then $v \\ge \\beta$ (Lower bound failure / Beta Cutoff).\nConsequently, when called at the root with $[-\\infty, +\\infty]$, Alpha-Beta pruning provably computes the exact Minimax root value.",
      proof: `
**Proof by Structural Induction on Game Tree Height:**
1. **Base Case (Leaf Node):** If node $u$ is a leaf at height 0, the static evaluation $e(u) = V_{\\text{minimax}}(u)$ is computed directly. The claims hold trivially.
2. **Inductive Step (Max Node $u$ with children $c_1, c_2, \\dots, c_k$):**
   - The exact minimax value is $V(u) = \\max_{i=1}^k V(c_i)$.
   - Alpha-Beta evaluates children sequentially, maintaining the best score found so far: $\\alpha_i = \\max(\\alpha, v_1, \\dots, v_{i-1})$.
   - When evaluating child $c_i$, we pass window $[\\alpha_i, \\beta]$.
   - If for some child $c_m$, the returned value $v_m \\ge \\beta$, then $V(u) \\ge v_m \\ge \\beta$.
   - Because $u$'s parent is a minimizing node that already has an alternative move guaranteeing score $\\le \\beta$, the parent will never choose node $u$ over its existing alternative.
   - Therefore, the exact value of $V(u)$ beyond $\\beta$ cannot influence the decision at the parent or root.
   - Pruning the remaining children $c_{m+1}, \\dots, c_k$ (Beta Cutoff) preserves the invariant $v \\ge \\beta$.
3. Symmetric logic applies to Min nodes triggering Alpha Cutoffs ($v \\le \\alpha$).
4. At the root, calling with $[-\\infty, +\\infty]$ ensures the true root value $V_{\\text{minimax}}(\\text{root})$ lies strictly within the initial window.
5. Thus, no cutoff can ever prune the optimal principal variation path, guaranteeing exact mathematical equivalence to full Minimax. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Subtraction Game Grundy Value Periodicity Theorem",
      theorem:
        "Let $S = \\{s_1, s_2, \\dots, s_m\\}$ be a finite set of positive integer moves with $s_m = \\max(S)$. The sequence of Grundy values $(G(0), G(1), G(2), \\dots)$ for the subtraction game with move set $S$ is eventually periodic, with period length $P \\le (m + 1)^{s_m}$.",
      proof: `
**Proof via Finite State Pigeonhole Principle:**
1. The Grundy value for state $n$ is defined by $G(n) = \\text{mex}(\\{ G(n - s) \\mid s \\in S \\text{ and } s \\le n \\})$.
2. The maximum number of elements in the set $\\{ G(n - s) \\mid s \\in S \\}$ is $|S| = m$.
3. By definition of $\\text{mex}$, the minimum excluded integer from a set of size $m$ cannot exceed $m$:
   $$0 \\le G(n) \\le m \\quad \\forall n \\ge 0$$
4. Therefore, every Grundy value $G(n)$ takes one of $m + 1$ discrete integer values from $\\{0, 1, \\dots, m\\}$.
5. Notice that $G(n)$ depends solely on the preceding $s_m$ values: $(G(n - s_m), G(n - s_m + 1), \\dots, G(n - 1))$.
6. Consider the sequence of state vectors $\\vec{V}_n = (G(n), G(n+1), \\dots, G(n + s_m - 1)) \\in \\{0, 1, \\dots, m\\}^{s_m}$.
7. The total number of distinct state vectors is finite, bounded by $(m + 1)^{s_m}$.
8. By the Pigeonhole Principle, in any sequence of $(m + 1)^{s_m} + 1$ consecutive vectors, there must exist two identical vectors: $\\vec{V}_{n_1} = \\vec{V}_{n_2}$ with $n_1 < n_2$.
9. Because $G(n)$ is deterministically computed from the preceding $s_m$ values, once $\\vec{V}_{n_1} = \\vec{V}_{n_2}$, the entire subsequent sequence repeats indefinitely with period $P = n_2 - n_1$.
10. Thus, any finite subtraction game is strictly periodic, enabling $O(1)$ evaluation for arbitrarily large $N = 10^{18}$ via modular reduction $G(N) = G((N - n_1) \\pmod P + n_1)$. $\\blacksquare$
      `,
    },
  ],
};
