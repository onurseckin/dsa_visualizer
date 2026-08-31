import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_shortest_paths_c1_p1",
  pageNumber: 1,
  title: "Shortest Path Metric Spaces, Relaxation & Potential Invariants",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Routing Crisis & Metric Space Foundations",
      content:
        "Let $G = (V, E)$ be a directed weighted graph with weight function $w: E \\to \\mathbb{R}$. The single-source shortest path (SSSP) problem seeks the minimum-weight path from source $s$ to all $v \\in V$, defined as $\\delta(s, v) = \\min_{P \\in \\mathcal{P}(s, v)} \\sum_{e \\in P} w(e)$. If $G$ contains a negative-weight cycle reachable from $s$, $\\delta(s, v)$ diverges to $-\\infty$. Shortest path algorithms are physical relaxation systems that iteratively tighten upper bounds $d[v]$ until the triangle inequality $d[v] \\le d[u] + w(u, v)$ holds across all edges.",
    },
    {
      type: "prose",
      title: "Taxonomy of Shortest Path Theoretical Paradigms",
      content:
        "Shortest path algorithms are distinguished by edge weight assumptions, graph density, and relaxation orders:\n\n1. **Non-Negative Weights (Greedy Metric Lock-In):**\n   - **Dijkstra's Algorithm:** Greedily fixes the unvisited vertex with minimum tentative distance $d[u] = \\min_{x \\notin S} d[x]$. Runs in $O(V^2)$ with flat arrays (optimal for dense graphs where $E = \\Theta(V^2)$) or $O((V + E) \\log V)$ with binary min-heaps ($O(E + V \\log V)$ with Fibonacci heaps).\n   - **0-1 BFS / Dial's Algorithm:** For integer weights $w \\in \\{0, 1\\}$, a double-ended queue (deque) processes 0-cost transitions at the front and 1-cost transitions at the back in exact $\\Theta(V + E)$ linear time.\n\n2. **General Weights / Negative Edges (Dynamic Programming & Bellman-Ford):**\n   - **Bellman-Ford Algorithm:** Systematically relaxes all $|E|$ edges $|V|-1$ times. Guaranteed to find shortest paths in $O(V \\cdot E)$ or detect negative-weight cycles if an edge can still be relaxed on the $|V|$-th pass.\n   - **Shortest Path Faster Algorithm (SPFA):** Queue-optimized Bellman-Ford that only relaxes outgoing edges from vertices whose distances changed. Average time $O(E)$, but worst-case $\\Theta(V \\cdot E)$ on adversarial grid graphs.\n\n3. **All-Pairs Shortest Paths (APSP) & Johnson's Reweighting:**\n   - **Floyd-Warshall:** 3D Dynamic programming over intermediate vertex subsets $k \\in [1, V]$ in $\\Theta(V^3)$ time and $\\Theta(V^2)$ space.\n   - **Johnson's Algorithm:** Computes a potential function $h: V \\to \\mathbb{R}$ via a single run of Bellman-Ford from an augmented source, reweights all edges to $w'(u, v) = w(u, v) + h(u) - h(v) \\ge 0$, and runs Dijkstra from every vertex $v \\in V$, solving APSP in $O(V E + V^2 \\log V)$ time.",
    },
    {
      type: "mental_model",
      title: "The String-Taut Relaxation & Dual Potential Landscape",
      visualIntuition: `
=== DIJKSTRA TAUT STRING EXPANSION (GREEDY METRIC BALL) ===
Wavefront at distance D:
  [S] ──(2)──> [A] (D=2, LOCKED)
   │            │
  (5)          (1)
   ↓            ↓
  [B] <──(2)── [C] (D=3, LOCKED)
   │
   └──> Dist to B: min(5, 3+2) = 5 (LOCKED next)

=== JOHNSON'S POTENTIAL REWEIGHTING LANDSCAPE ===
Original Edge:  u ────( w(u, v) = -3 )────> v
Potentials:    h(u) = 5,                 h(v) = 1
Reweighted:    w'(u, v) = w(u, v) + h(u) - h(v) = -3 + 5 - 1 = +1 >= 0!

Telescoping Cancellation along Path P = (s -> v1 -> v2 -> t):
w'(P) = (w1 + h(s) - h1) + (w2 + h1 - h2) + (w3 + h2 - h(t))
      = w(P) + h(s) - h(t)  (Intermediate potentials vanish!)
      `,
      invariant:
        "Upper-Bound & Triangle Inequality Invariant: At all steps, tentative distance $d[v] \\ge \\delta(s, v)$. Once relaxed, $d[v] \\le d[u] + w(u, v)$. Convergence is reached if and only if no edge violates the triangle inequality.",
      stateTransitions:
        "Relaxation Step: If $d[u] + w(u, v) < d[v]$, set $d[v] \\leftarrow d[u] + w(u, v)$ and $\\pi[v] \\leftarrow u$.\nJohnson Reweighting: $w'(u, v) \\leftarrow w(u, v) + h(u) - h(v)$ where $h(u) = \\delta(s_0, u)$.",
      naiveBottleneck:
        "Exploring all simple path permutations between source and destination takes $\\Theta(V!)$ factorial time.",
      optimalInsight:
        "By enforcing optimal substructure (subpaths of shortest paths are shortest paths) and applying monotonic wavefront expansion or dual potential transformations, convergence is attained in polynomial time.",
    },
  ],
};
