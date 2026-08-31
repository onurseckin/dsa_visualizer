import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_flows_and_cuts_c1_p1",
  pageNumber: 1,
  title: "Flow Networks, Residual Capacities & Cut Duality",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Network Flow Crisis & Duality of Bottlenecks",
      content:
        "Consider a directed graph $G=(V, E)$ where each directed edge $(u, v)$ has a non-negative capacity $c(u, v) \\ge 0$, a designated source $s$, and a sink $t$. We must route maximum commodity volume from $s$ to $t$ without violating edge capacity bounds or vertex flow conservation. Max-Flow Min-Cut duality reveals a fundamental law of networks: the maximal throughput of any network is strictly constrained by the total capacity of its most restrictive bottleneck cut $(S, T)$. Flow optimization algorithms provide exact, polynomial-time solutions to resource allocation, bipartite matching, project selection, and min-cut graph partitioning.",
    },
    {
      type: "prose",
      title: "Mathematical Taxonomy of Flow Algorithms",
      content:
        "Flow algorithms are classified into two major theoretical paradigms:\n\n1. **Augmenting Path Methods (Maintains Flow Conservation throughout):**\n   - **Ford-Fulkerson:** Finds arbitrary augmenting paths in the residual graph $G_f$ via DFS. Runtime: $O(E \\cdot |f^*|)$. Vulnerable to non-terminating irrational capacities and exponential execution on high-capacity paths.\n   - **Edmonds-Karp:** Finds shortest augmenting paths (in unweighted edge count) via BFS. Guaranteed strongly polynomial runtime: $O(V E^2)$.\n   - **Dinic's Algorithm:** Builds a BFS-layered Level Graph where edges only point from layer $d$ to $d+1$, then pushes a **blocking flow** using multi-path DFS with a current-arc pointer. Runtime: $O(V^2 E)$ on general networks, and $O(E \\sqrt{V})$ on unit networks (e.g., Hopcroft-Karp bipartite matching).\n\n2. **Preflow-Push / Push-Relabel Methods (Relaxes Conservation, Enforces Capacity):**\n   - **Goldberg-Tarjan Push-Relabel:** Maintains a *preflow* where incoming flow can exceed outgoing flow ($e(u) \\ge 0$, excess flow). Vertices have height labels $h(u)$ representing virtual slopes. Excess flow is pushed downhill along admissible edges ($h(u) = h(v) + 1$), and overflowing nodes are relabeled. Runtime: $O(V^2 E)$, reducible to $O(V^3)$ or $O(V^2 \\sqrt{E})$ with highest-label selection / gap heuristics.",
    },
    {
      type: "mental_model",
      title: "The Residual Graph & Cancellation Symmetry Mental Model",
      visualIntuition: `
=== ORIGINAL CAPACITY GRAPH ===
     (10)       (10)
  s -------> u -------> t
   \\         ^         /
(10)\\       |(1)      /(10)
     v------>v-------> 
        (10)     (10)

=== INITIAL SUBOPTIMAL AUGMENTATION (s -> v -> u -> t, flow = 1) ===
Residual Graph G_f:
  s -> v: cap 9,  v -> s: cap 1 (reverse residual)
  v -> u: cap 0,  u -> v: cap 1 (reverse residual - CANCEL PATH)
  u -> t: cap 9,  t -> u: cap 1 (reverse residual)

=== SECOND AUGMENTATION (s -> u -> v -> t, uses reverse edge u -> v, flow = 9) ===
Net result: Total flow = 10 (Full saturation of network without getting trapped).

=== CUT PARTITION (S, T) ===
  S = {nodes reachable from s in G_f}
  T = V \\ S
  Capacity(S, T) = Sum of original c(u, v) for u in S, v in T == Max Flow
      `,
      invariant:
        "Flow Conservation & Skew Symmetry Invariant: For all $u \\in V \\setminus \\{s, t\\}$, $\\sum_{(v, u) \\in E} f(v, u) = \\sum_{(u, w) \\in E} f(u, w)$. In the residual graph $G_f$, residual capacity $c_f(u, v) = c(u, v) - f(u, v)$ and $c_f(v, u) = f(u, v)$.",
      stateTransitions:
        "Augmenting Path: $\\Delta = \\min_{(u, v) \\in P} c_f(u, v)$. For all $(u, v) \\in P$, update $c_f(u, v) \\leftarrow c_f(u, v) - \\Delta$ and $c_f(v, u) \\leftarrow c_f(v, u) + \\Delta$.\nPush-Relabel: Push $\\min(e(u), c_f(u, v))$ downhill to $v$; Relabel $h(u) \\leftarrow 1 + \\min_{(u, v) \\in E_f} h(v)$ when no admissible downhill edges exist.",
      naiveBottleneck:
        "Greedy flow routing without residual backward cancellation becomes trapped in local capacity deadlocks, producing sub-optimal throughput far below network capacity.",
      optimalInsight:
        "Reverse edges in the residual graph provide a mathematical 'undo' mechanism: sending flow along a reverse edge $(v, u)$ is mathematically identical to canceling previously routed forward flow along $(u, v)$, unlocking global network optimality.",
    },
  ],
};
