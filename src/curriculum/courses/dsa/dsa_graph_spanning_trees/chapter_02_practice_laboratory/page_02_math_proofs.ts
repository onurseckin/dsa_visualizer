import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_graph_spanning_trees_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: The Cycle Property of Spanning Trees",
      theorem:
        "Let $G = (V, E)$ be an undirected connected weighted graph. Let $C \\subseteq E$ be any simple cycle in $G$. If $e \\in C$ is an edge whose weight is strictly greater than the weights of all other edges in $C$ ($w(e) > w(e')$ for all $e' \\in C \\setminus \\{e\\}$), then $e$ belongs to no Minimum Spanning Tree of $G$.",
      proof: `
**Proof by Contradiction:**
1. Assume for contradiction that $e = (u, v)$ belongs to an MST $T$ of $G$, so $e \\in T$.
2. Removing $e$ from $T$ disconnects the tree into exactly two connected components $V_1$ and $V_2$, forming a valid cut $(V_1, V_2)$ where $u \\in V_1$ and $v \\in V_2$.
3. Because $C$ is a simple cycle containing edge $e = (u, v)$, the remaining edges $C \\setminus \\{e\\}$ form an alternate simple path connecting $u \\in V_1$ and $v \\in V_2$.
4. Since this path connects a vertex in $V_1$ to a vertex in $V_2$, there must exist at least one other edge $e' = (u', v') \\in C \\setminus \\{e\\}$ that crosses the cut $(V_1, V_2)$ with $u' \\in V_1$ and $v' \\in V_2$.
5. Because $e' \\in C \\setminus \\{e\\}$, by the theorem's premise $w(e') < w(e)$.
6. Construct a new spanning tree $T' = (T \\setminus \\{e\\}) \\cup \\{e'\\}$.
7. The weight of $T'$ is:
   $$w(T') = w(T) - w(e) + w(e') < w(T)$$
8. This implies $w(T') < w(T)$, which directly contradicts the assumption that $T$ was a Minimum Spanning Tree.
9. Therefore, no MST of $G$ can ever contain the strictly heaviest edge of any simple cycle. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Inverse Ackermann Amortized Complexity of DSU",
      theorem:
        "A sequence of $m$ operations (containing at most $n$ `MakeSet` calls) on a Disjoint-Set Union data structure with Union by Rank and Path Compression executes in total time $O(m \\alpha(n))$, where $\\alpha(n)$ is the extremely slow-growing functional inverse of the Ackermann function.",
      proof: `
**Proof Outline via Potential Method:**
1. Each node $x$ has an integer rank $rank(x) \\in [0, \\lfloor \\log_2 n \\rfloor]$. The rank of a parent is strictly greater than the rank of its child ($rank(parent(x)) > rank(x)$).
2. For an integer $k \\ge 0$, define the Ackermann-level functions $A_k(x)$ where $A_0(x) = x + 1$, $A_1(x) = 2x$, and $A_{k+1}(x) = A_k^{(x)}(x)$ (iterated application).
3. The inverse Ackermann function $\\alpha(n) = \\min \\{ k \\mid A_k(1) \\ge n \\}$.
4. Define a potential function $\\Phi = \\sum_{x \\in V} \\phi(x)$, where for each node $x$:
   - If $x$ is a root or $rank(x) = rank(parent(x))$, $\\phi(x) = \\alpha(n) \\cdot rank(x)$.
   - Otherwise, let $k$ be the largest integer such that $rank(parent(x)) \\ge A_k(rank(x))$. Then $\\phi(x) = (\\alpha(n) - k) \\cdot rank(x) - rank(parent(x))$.
5. When find(x) compresses the path, the potential $\\Phi$ decreases sufficiently to pay for all traversed intermediate edges except the root and its direct child (which contribute $O(1)$ amortized cost).
6. Total amortized time across all $m$ operations is bounded by $O(m \\alpha(n))$. For all practical values ($n \\le 10^{80}$), $\\alpha(n) \\le 4$. $\\blacksquare$
      `,
    },
  ],
};
