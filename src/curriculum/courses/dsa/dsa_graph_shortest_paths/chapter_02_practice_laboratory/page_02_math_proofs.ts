import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_graph_shortest_paths_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Bellman-Ford Convergence & |V|-1 Relaxation Pass Bound",
      theorem:
        "Let $G = (V, E)$ be a weighted directed graph with no negative-weight cycles reachable from source $s$. After $|V|-1$ relaxation passes over all edges in $E$, the tentative distance $d[v] = \\delta(s, v)$ for all $v \\in V$. Furthermore, if any edge can still be relaxed on the $|V|$-th pass, $G$ contains a reachable negative-weight cycle.",
      proof: `
**Proof by Induction on Path Length:**
1. Let $v \\in V$ be any vertex reachable from $s$. Because $G$ contains no negative-weight cycles reachable from $s$, there exists a shortest path $P = (s = v_0, v_1, v_2, \\dots, v_k = v)$ that is *simple* (contains no repeated vertices).
2. Because $P$ is simple and contains at most $|V|$ vertices, the number of edges in $P$ is $k \\le |V| - 1$.
3. We prove by induction on $i$ that after pass $i$ of the Bellman-Ford algorithm ($1 \\le i \\le k$), $d[v_i] = \\delta(s, v_i)$:
   - **Base Case ($i = 0$):** $d[v_0] = d[s] = 0 = \\delta(s, s)$ before pass 1, which holds trivially.
   - **Inductive Step:** Assume that after pass $i-1$, $d[v_{i-1}] = \\delta(s, v_{i-1})$.
   - In pass $i$, edge $(v_{i-1}, v_i)$ is relaxed along with all other edges in $E$.
   - By the relaxation property: $d[v_i] \\le d[v_{i-1}] + w(v_{i-1}, v_i) = \\delta(s, v_{i-1}) + w(v_{i-1}, v_i) = \\delta(s, v_i)$.
   - Since $d[v_i]$ is always an upper bound on $\\delta(s, v_i)$ ($d[v_i] \\ge \\delta(s, v_i)$), we must have $d[v_i] = \\delta(s, v_i)$.
4. Because $k \\le |V| - 1$, after $|V| - 1$ passes, $d[v] = d[v_k] = \\delta(s, v)$ for all reachable vertices $v$.

**Negative Cycle Detection:**
1. If $G$ has no negative cycles, all shortest path distances satisfy the triangle inequality $\\delta(s, v) \\le \\delta(s, u) + w(u, v)$ for all $(u, v) \\in E$, so no edge can be relaxed on pass $|V|$.
2. If there exists an edge $(u, v)$ such that $d[u] + w(u, v) < d[v]$ on pass $|V|$, then following predecessor pointers backwards must uncover a cycle $C = (x_0, x_1, \\dots, x_m = x_0)$ where $\\sum_{i=1}^m w(x_{i-1}, x_i) < 0$. Thus, a negative cycle is rigorously proven to exist. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: A* Search Monotonicity & Optimality Theorem",
      theorem:
        "In A* graph search, let $h(u)$ be a consistent (monotonic) heuristic estimating distance to target $t$, satisfying $h(u) \\le h(v) + w(u, v)$ for all $(u, v) \\in E$ and $h(t) = 0$. Then:\n1. The $f$-values of vertices expanded by A* ($f(u) = g(u) + h(u)$) are monotonically non-decreasing over time.\n2. Whenever A* extracts a vertex $u$ from the priority queue, the exact shortest path distance from start is discovered: $g(u) = \\delta(s, u)$.",
      proof: `
**Proof:**
1. Let $u$ be expanded and let $v$ be a successor of $u$ via edge $(u, v)$.
2. The $f$-value of $v$ through $u$ is $f(v) = g(v) + h(v) = (g(u) + w(u, v)) + h(v) = g(u) + (w(u, v) + h(v))$.
3. By the consistency condition on $h$: $h(u) \\le w(u, v) + h(v)$.
4. Substituting this into the equation:
   $$f(v) = g(u) + w(u, v) + h(v) \\ge g(u) + h(u) = f(u)$$
5. Therefore, the sequence of $f$-values of vertices added to the open set and extracted from the priority queue is monotonically non-decreasing.
6. Similar to Dijkstra's induction on non-negative weights, consistency of $h$ acts as a potential function that transforms edge costs to $w'(u, v) = w(u, v) + h(v) - h(u) \\ge 0$.
7. Because transformed edge costs are non-negative, the greedy extraction of minimum $f(u)$ guarantees $g(u) = \\delta(s, u)$ upon first expansion. $\\blacksquare$
      `,
    },
  ],
};
