import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_tree_queries_and_diameter_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Centroid Existence Theorem (Jordan 1869)",
      theorem:
        "Every tree $T = (V, E)$ with $|V| = N$ vertices contains at least one vertex $c \\in V$ (a centroid) such that if $c$ is removed from $T$, every resulting connected component has size at most $\\lfloor N/2 \\rfloor$.",
      proof: `
**Constructive Proof via Weight Descent:**
1. Root the tree $T$ arbitrarily at vertex $r$.
2. For any vertex $u \\in V$, let $\\text{size}(u)$ denote the number of vertices in the subtree rooted at $u$. Clearly $\\text{size}(r) = N$.
3. We define a deterministic descent procedure starting at $u = r$:
   - If for all children $v$ of $u$, $\\text{size}(v) \\le N/2$, and the component containing $u$'s parent has size $N - \\text{size}(u) \\le N/2$, then $u$ is a valid centroid, and we terminate.
   - Otherwise, there can be at most *one* child $w$ of $u$ such that $\\text{size}(w) > N/2$ (since two such children would require $> N/2 + N/2 = N$ total vertices, exceeding $N$).
   - In this case, move the current vertex to $w$ ($u \\leftarrow w$) and repeat the check.
4. We verify that the descent process must terminate at a valid centroid:
   - At each step of the descent, $\\text{size}(u)$ strictly decreases (since $\\text{size}(w) < \\text{size}(u)$).
   - Because $N$ is finite and strictly positive, the descent cannot continue indefinitely and must stop at some vertex $c$.
5. When the descent stops at $c$, all children $v$ of $c$ satisfy $\\text{size}(v) \\le N/2$.
6. Furthermore, the parent component of $c$ has size $N - \\text{size}(c)$. Since we stepped into $c$ from its parent $p$, we know $\\text{size}(c) > N/2$, which implies $N - \\text{size}(c) < N - N/2 = N/2$.
7. Thus, all connected components resulting from removing $c$ have size strictly $\\le \\lfloor N/2 \\rfloor$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Heavy-Light Decomposition Light-Edge Logarithmic Bound",
      theorem:
        "In a rooted tree $T = (V, E)$ of size $N$, an edge $(u, v)$ from parent $u$ to child $v$ is designated as Heavy if $\\text{size}(v) > \\text{size}(u) / 2$, and Light otherwise. Any simple path from the root to any vertex $x \\in V$ contains at most $\\lfloor \\log_2 N \\rfloor$ light edges.",
      proof: `
**Proof:**
1. Let $P = (r = v_0, v_1, v_2, \\dots, v_k = x)$ be the unique simple path from the root $r$ to target vertex $x$.
2. Suppose $(v_{i-1}, v_i)$ is a light edge on path $P$.
3. By definition of a light edge, child $v_i$ does not have strictly more than half the subtree size of its parent $v_{i-1}$:
   $$\\text{size}(v_i) \\le \\frac{\\text{size}(v_{i-1})}{2}$$
4. If the path from root $r$ to $x$ traverses $m$ light edges, then by applying the light edge inequality repeatedly across all $m$ light edges:
   $$\\text{size}(x) \\le \\left(\\frac{1}{2}\\right)^m \\cdot \\text{size}(r) = \\frac{N}{2^m}$$
5. Because every vertex has a subtree size of at least $1$ (itself), we have:
   $$1 \\le \\text{size}(x) \\le \\frac{N}{2^m} \\implies 2^m \\le N \\implies m \\le \\log_2 N$$
6. Since $m$ is an integer, $m \\le \\lfloor \\log_2 N \\rfloor$.
7. Because any path between arbitrary nodes $u$ and $v$ consists of two root-to-node paths connected at $\\text{LCA}(u, v)$, the path $u \\to v$ crosses at most $2 \\lfloor \\log_2 N \\rfloor$ heavy chains.
8. Each heavy chain corresponds to a contiguous subsegment in the flattened 1D Segment Tree. Therefore, querying or updating any tree path touches at most $O(\\log N)$ segment tree ranges, executing in $O(\\log^2 N)$ time. $\\blacksquare$
      `,
    },
  ],
};
