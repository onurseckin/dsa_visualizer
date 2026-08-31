import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_spanning_trees_c1_p1",
  pageNumber: 1,
  title: "Matroid Theory, Cut/Cycle Dualities & Spanning Forest Invariants",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Infrastructure Crisis & Matroid Foundations",
      content:
        "Connecting $N$ distributed compute nodes, power transmission substations, or fiber-optic endpoints into a fully connected network with minimal total construction cost requires computing a Minimum Spanning Tree (MST). Cayley's formula proves that an undirected complete graph $K_n$ contains $N^{N-2}$ distinct spanning trees. Brute force enumeration is mathematically impossible. The Minimum Spanning Tree problem is governed by **Matroid Theory** (specifically Graphic Matroids $(E, \\mathcal{I})$), which proves that greedy edge selection under cut/cycle invariants is mathematically guaranteed to achieve global optimality.",
    },
    {
      type: "prose",
      title: "Taxonomy of Spanning Tree Algorithmic Paradigms",
      content:
        "MST algorithms are classified by their edge selection invariants and tree growth mechanics:\n\n1. **Kruskal's Algorithm (Global Edge Sorting + Graphic Matroid Greedy):**\n   - Sorts all $E$ edges globally by weight.\n   - Iteratively adds the minimum-weight edge that does not form a cycle, using Disjoint-Set Union (DSU) with Union by Rank and Path Compression.\n   - Runtime: $O(E \\log E) = O(E \\log V)$, dominated by the initial sort.\n\n2. **Prim's Algorithm (Vertex-Centric Cut Growing):**\n   - Starts at an arbitrary root and greedily grows a single connected tree component $S$.\n   - At each step, adds the light edge crossing the cut $(S, V \\setminus S)$ using a priority queue.\n   - Runtime: $O(V^2)$ with flat arrays (optimal for dense graphs $E = \\Theta(V^2)$) or $O(E \\log V)$ with binary heaps ($O(E + V \\log V)$ with Fibonacci heaps).\n\n3. **Borůvka's Algorithm (Parallel Component Contraction):**\n   - In each phase, every connected component simultaneously selects its minimum-weight outgoing incident edge.\n   - All selected edges are contracted. The number of components halves in every phase (at most $\\lceil \\log_2 V \\rceil$ phases).\n   - Runtime: $O(E \\log V)$, highly parallelizable across distributed SIMD hardware / GPU thread blocks.\n\n4. **Linear-Time Randomized & Near-Linear Algorithms (Karger-Klein-Tarjan & Chazelle):**\n   - Karger-Klein-Tarjan randomized algorithm finds MST in $O(V + E)$ expected time using random edge sampling and linear-time MST verification.\n   - Chazelle's deterministic algorithm using Soft Heaps runs in $O(E \\alpha(V) \\log \\alpha(V))$.",
    },
    {
      type: "mental_model",
      title: "Cut Property & Cycle Property Dual Invariants",
      visualIntuition: `
=== THE CUT PROPERTY (MIN-CROSSING LIGHT EDGE IS SAFE) ===
 Partition S                       Partition V \\ S
┌─────────────────────┐           ┌─────────────────────┐
│      Node A         │           │      Node C         │
│         │           │   (w=2)   │         │           │
│         │ (w=7)     ├───────────┤ (w=5)   │           │
│         ↓           │           │         ↓           │
│      Node B         │   (w=9)   │      Node D         │
│                     ├───────────┤                     │
└─────────────────────┘           └─────────────────────┘
Cut-crossing edges: (A-C: 2), (B-D: 9).
Light edge is (A-C: 2) -> Mathematically MUST belong to an MST.

=== THE CYCLE PROPERTY (MAX-CYCLE HEAVY EDGE IS EXCLUDED) ===
     (w=3)
  A ─────── B
  │         │ (w=4)
(w=2)       │
  │         │
  D ─────── C
     (w=8)  <-- Heavy edge (w=8) is strictly the max on cycle A-B-C-D.
                It can NEVER belong to any MST!
      `,
      invariant:
        "Fundamental Cut & Cycle Invariants:\n1. Cut Property: For any partition $(S, V \\setminus S)$, the minimum-weight edge crossing the cut belongs to some MST.\n2. Cycle Property: For any simple cycle $C \\subseteq E$, the strictly heaviest edge on $C$ belongs to no MST.",
      stateTransitions:
        "Kruskal: For sorted $(u, v, w)$, if $\\text{Find}(u) \\neq \\text{Find}(v)$, add $(u, v)$ to MST and $\\text{Union}(u, v)$.\nBorůvka: For each component $c$, identify $\\arg\\min_{e \\in \\delta(c)} w(e)$, contract components, repeat until 1 component remains.",
      naiveBottleneck:
        "Brute force enumeration of all $N^{N-2}$ spanning trees takes super-exponential time ($10^{98}$ trees for $N=100$).",
      optimalInsight:
        "Graphic matroids satisfy the greedy exchange property: local greedy choices based on the Cut Property never compromise global tree optimality.",
    },
  ],
};
