import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_flows_and_cuts_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Memory Hierarchy, Forward-Star Arrays & The XOR Residual Trick",
      content:
        "Modern high-throughput graph processing is dominated by memory latency rather than raw ALU arithmetic:\n\n1. **Forward-Star Flattened Layout:** Traditional adjacency lists (`vector<Edge*>` or `Array<{ v, cap, rev }>` store pointers that scatter graph nodes across discontinuous heap addresses, inducing TLB thrashing and cache-line misses on every edge relaxation. By packaging edges into parallel contiguous typed arrays (`head`, `next`, `to`, `cap`), edge scanning traverses contiguous memory with full hardware prefetching.\n2. **The XOR Symmetry Invariant (`edge ^ 1`):** By allocating forward edge $e$ at an even index $2k$ and its reverse residual edge at odd index $2k + 1$, the reverse edge index is computed via `e ^ 1` in 0 clock cycles (folded into load displacement). This completely eliminates the need for 8-byte `reverse_pointer` references, saving $50\\%$ of memory traffic during DFS augmentation pushes.\n3. **Branch Elimination via Current-Arc `ptr`:** Without the `ptr[u]` optimization, the DFS in Dinic's algorithm repeatedly re-examines saturated edges from `head[u]`, causing up to $\\Theta(V \\cdot E)$ branch tests per phase. The current-arc pointer ensures each saturated edge is discarded exactly once per phase.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Floating-Point Leaks & Algorithmic Hazards",
      content:
        "1. **Residual Epsilon Leak in Floating-Point Networks:** If capacities are real numbers (`double`), subtraction `cap -= flow` can leave residual amounts like $10^{-17}$. Checking `cap > 0` causes infinite loops as BFS repeatedly attempts to route vanishingly small epsilons. Always use an explicit tolerance `cap > 1e-9`.\n2. **Omitting Current-Arc Pointer Resets:** The current-arc array `ptr` must be reset to `head` at the start of *every* new BFS phase. Failing to reset `ptr` leads to premature termination before reaching a true blocking flow.\n3. **Undirected vs Directed Edge Initialization:** When adding an undirected network edge $(u, v)$ with capacity $C$, both forward edge $(u, v)$ and reverse edge $(v, u)$ must be initialized with capacity $C$. In a directed network, reverse edge $(v, u)$ must be initialized with capacity $0$.\n4. **Integer Overflow on Max-Flow Accumulation:** On large flow networks where individual capacities fit in 32-bit signed integers, total accumulated flow $\\sum f$ can exceed $2^{31}-1$. The total flow accumulator must always be typed as 64-bit integer (`int64_t` or `bigint`).",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Push-Relabel (Goldberg-Tarjan) & The Gap Relabeling Heuristic",
      content:
        "While augmenting path algorithms push flow end-to-end from $s$ to $t$, the **Push-Relabel** algorithm operates locally by maintaining a *preflow* with non-negative vertex excesses $e(u) = f_{in}(u) - f_{out}(u) \\ge 0$ and valid distance labels $h(u) \\le h(v) + 1$ for all $(u, v) \\in E_f$:\n- **Push Operation:** If $e(u) > 0$, $c_f(u, v) > 0$, and $h(u) = h(v) + 1$, push $\\min(e(u), c_f(u, v))$ from $u$ to $v$.\n- **Relabel Operation:** If $e(u) > 0$ and for all residual edges $(u, v)$, $h(u) \\le h(v)$, set $h(u) \\leftarrow 1 + \\min_{(u, v) \\in E_f} h(v)$.\n- **The Gap Heuristic Optimization:** If there exists a height level $g \\in [1, |V|-1]$ containing zero vertices, then any vertex $u$ with $h(u) > g$ is completely disconnected from $t$ in $G_f$. Immediately relabeling all such vertices to $h(u) = \\max(h(u), |V| + 1)$ prevents millions of useless pushes, accelerating Push-Relabel by up to $100\\times$ on dense benchmarks.",
    },
    {
      type: "prose",
      title: "Algorithm Selection & Asymptotic Complexity Matrix",
      content: `
| Algorithm | Time Complexity | Network Type | Augmentation Strategy | Practical Domain |
| :--- | :--- | :--- | :--- | :--- |
| **Ford-Fulkerson** | $O(E \\cdot |f^*|)$ | Small integer capacities | Arbitrary DFS augmenting paths | Theoretical baseline only |
| **Edmonds-Karp** | $O(V E^2)$ | General networks | Shortest path via BFS | Educational reference |
| **Dinic's Algorithm** | $O(V^2 E)$ | General networks | Level Graph BFS + Blocking Flow DFS | Competitive programming, real-time routing |
| **Dinic (Unit Networks)** | $O(E \\sqrt{V})$ | Unit capacity / Bipartite | Level Graph BFS + Blocking Flow DFS | Bipartite matching, job assignments |
| **Push-Relabel (FIFO)** | $O(V^3)$ | Dense general networks | Local push/relabel with queue | Large dense graphs |
| **Push-Relabel (Highest-Label + Gap)** | $O(V^2 \\sqrt{E})$ | Extremely dense networks | Highest active label discharge | Industrial vision, image segmentation |
      `,
    },
  ],
};
