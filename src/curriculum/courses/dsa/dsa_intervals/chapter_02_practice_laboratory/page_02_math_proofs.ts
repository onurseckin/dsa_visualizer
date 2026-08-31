import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_intervals_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Optimality of Earliest End Time Scheduling via Exchange Argument",
      theorem:
        "The greedy algorithm that iteratively selects the compatible interval with the earliest finish time produces a maximum-size set of mutually disjoint intervals in $O(N \\log N)$ time.",
      proof: `
**Proof via the Greedy Exchange Argument:**
1. Let $\\mathcal{G} = (g_1, g_2, \\dots, g_k)$ be the sequence of intervals selected by the greedy algorithm in chronological order of finish times ($e(g_1) \\le e(g_2) \\le \\dots \\le e(g_k)$).
2. Let $\\mathcal{O} = (o_1, o_2, \\dots, o_m)$ be an arbitrary optimal schedule sorted by finish times ($e(o_1) \\le e(o_2) \\le \\dots \\le e(o_m)$) with maximal cardinality $m$.
3. **Lemma:** For all $r \\in \\{1, 2, \\dots, k\\}$, $e(g_r) \\le e(o_r)$.
   - **Base Case ($r = 1$):**
     - The greedy algorithm selects $g_1$ as the interval with the globally minimal finish time among all candidate intervals.
     - Therefore, $e(g_1) \\le e(o_1)$. Base case holds.
   - **Inductive Step:** Assume $e(g_{r-1}) \\le e(o_{r-1})$ for some $r > 1$.
     - Since $\\mathcal{O}$ is a valid disjoint schedule, interval $o_r$ starts after $o_{r-1}$ finishes: $s(o_r) \\ge e(o_{r-1})$.
     - By the inductive hypothesis, $e(o_{r-1}) \\ge e(g_{r-1})$, which implies $s(o_r) \\ge e(g_{r-1})$.
     - Thus, interval $o_r$ is compatible with $g_{r-1}$ and was an eligible candidate when the greedy algorithm chose $g_r$.
     - Because greedy chooses the compatible interval with the earliest finish time, it must be that $e(g_r) \\le e(o_r)$.
   - The lemma is established for all $r \\le k$.
4. **Cardinality Optimality ($k = m$):**
   - Suppose for contradiction that $k < m$.
   - By the lemma for $r = k$, $e(g_k) \\le e(o_k)$.
   - Because $m > k$, there exists an interval $o_{k+1} \\in \\mathcal{O}$ with $s(o_{k+1}) \\ge e(o_k) \\ge e(g_k)$.
   - Therefore, $o_{k+1}$ is compatible with $g_k$, meaning candidate intervals remained after choosing $g_k$.
   - But the greedy algorithm only terminates when no compatible intervals remain, a contradiction.
5. Hence, $k = m$, proving that the greedy schedule $\\mathcal{G}$ has optimal maximum cardinality. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Interval Partitioning Lower Bound & Chromatic Equivalence",
      theorem:
        "The minimum number of resources (rooms) required to partition a set of intervals without overlap equals the maximum overlapping depth $D = \\max_{t} |\\{ i \\mid s_i \\le t < e_i \\}|$. Furthermore, the Greedy Start-Time algorithm with a Min-Heap allocates exactly $D$ rooms in $O(N \\log N)$ time.",
      proof: `
**Proof via Interval Graph Perfectness & Greedy Min-Heap Invariant:**
1. **Lower Bound:**
   - Let $t^*$ be the point on the timeline with maximal overlap depth $D$.
   - There exist $D$ mutually overlapping intervals covering $t^*$.
   - Since all $D$ intervals pairwise overlap at $t^*$, no two of these intervals can share the same resource.
   - Therefore, any valid schedule requires at least $D$ distinct rooms: $\\text{Rooms}_{\\min} \\ge D$.
2. **Upper Bound (Greedy Min-Heap Correctness):**
   - Sort all intervals by start time: $s_1 \\le s_2 \\le \\dots \\le s_N$.
   - Process intervals sequentially. When considering interval $i$:
     - The algorithm examines the room with the earliest ending interval currently assigned (top of Min-Heap).
     - If that earliest end time $e_{\\min} \\le s_i$, interval $i$ reuses that existing room without increasing total room count.
     - If $e_{\\min} > s_i$, every currently active room is occupied by an interval that ends after $s_i$.
   - Suppose allocating interval $i$ creates room number $k + 1$.
   - This means at time $s_i$, interval $i$ overlaps with intervals currently occupying all $k$ previously opened rooms.
   - Together with interval $i$, there are $k + 1$ intervals overlapping at time $s_i$.
   - By definition of maximal depth $D$, we must have $k + 1 \\le D$.
3. Therefore, the greedy algorithm never opens more than $D$ rooms, achieving $\\text{Rooms} = D = \\text{Rooms}_{\\min}$.
4. In graph theoretic terms, for any Interval Graph $G$, the chromatic number equals the maximum clique size: $\\chi(G) = \\omega(G) = D$, proving interval graphs are **Perfect Graphs**. $\\blacksquare$
      `,
    },
  ],
};
