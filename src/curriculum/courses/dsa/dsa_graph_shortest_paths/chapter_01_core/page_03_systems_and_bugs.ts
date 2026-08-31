import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_shortest_paths_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "CSR Cache Line Alignment & Stale Heap Memory Amplification",
      content:
        "Modern memory hierarchies impose severe bottlenecks on shortest path graph traversals:\n\n1. **Compressed Sparse Row (CSR) vs Pointer Chasing:** Traditional pointer-based adjacency lists (`vector<pair<int, double>>`) fragment memory across discontinuous heap allocations, incurring 150-250 cycle DRAM latency on every neighbor expansion. A CSR representation stores two contiguous arrays: `offset[u]` (indices where edges begin) and `edges` (packed destination and weight structs). Expanding vertex $u$ streams contiguous 64-byte cache lines directly into L1 cache, increasing memory bandwidth by $4\\times$.\n2. **Stale Heap Memory Bloat:** Standard binary min-heaps do not support $O(\\log V)$ `decreaseKey` without an auxiliary node-to-index tracking array. Instead, implementations push a new `(node, newDist)` pair on every successful relaxation, causing the heap size to grow from $|V|$ to $|E|$. In dense graphs ($E \\approx 10^7$), this balloons heap memory to hundreds of megabytes and increases heap operation latency from $\\log_2(V)$ to $\\log_2(E) \\approx 2 \\log_2(V)$.\n3. **Hardware Prefetcher Stalls in Random Relaxation:** Because edge targets $v$ jump randomly across the distance array `dist[v]`, writing to `dist[v]` causes random L1 write-misses. Aligning distance buffers to 64-byte cache line boundaries reduces cache line conflicts.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Negative Cycle Hazards & Overflow Pitfalls",
      content:
        "1. **Integer Overflow on Infinity Sentinel:** Initializing distances to `INT_MAX` ($2^{31}-1$) causes signed integer overflow when executing `dist[u] + weight`, wrapping around to $-2^{31}$ (negative infinity) and corrupting all shortest path trees. Always use safe sentinels (e.g. `0x3f3f3f3f` for integers or `Infinity` in Float64).\n2. **Dijkstra on Negative Weights Fallacy:** Dijkstra assumes that once a vertex is finalized ($u \\in S$), its distance is permanent. If negative edges exist, a subsequent path through another branch might discover a shorter route to $u$, but Dijkstra will never re-examine $u$, returning false suboptimal paths.\n3. **SPFA Denial-of-Service on Adversarial Topologies:** While SPFA achieves $O(E)$ on random networks, crafted adversarial graphs (such as grid networks or layered DAGs with alternating negative weights) force vertices to re-enter the queue $\\Theta(V)$ times, degrading SPFA to $\\Theta(V \\cdot E)$ and exhausting server CPU quotas.\n4. **Negative Cycle Infinite Loops:** If a graph contains a negative-weight cycle reachable from source $s$, SPFA will cycle infinitely. Production SPFA *must* track relaxation count per vertex (`count[v] >= N`) and terminate immediately upon cycle detection.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Advanced Shortest Path Optimizations: A* Consistency & Contraction Hierarchies",
      content:
        "When real-world networks (such as continental road systems with $10^8$ vertices) exceed standard Dijkstra throughput, advanced heuristics provide sub-millisecond query latency:\n- **A* Search & Monotonic Heuristics:** Evaluates vertices by $f(u) = g(u) + h(u)$, where $g(u)$ is the exact distance from start and $h(u)$ is an admissible heuristic estimate to the target. If $h$ satisfies the **Consistency / Monotonicity condition** ($h(u) \\le h(v) + w(u, v)$ for all $(u, v)$), every vertex is visited at most once, directing search cones toward the target.\n- **Bidirectional Search:** Simultaneously runs forward search from $s$ and reverse search from $t$. Halving the search radius from $R$ to $R/2$ reduces the explored state volume by a factor of $(R/2)^2 / R^2 = 1/4$ in 2D space.\n- **Contraction Hierarchies (CH):** Preprocesses road networks by iteratively contracting vertices in order of topological importance and adding shortcut edges. Continental route queries evaluate in $< 1$ millisecond.",
    },
    {
      type: "prose",
      title: "Shortest Path Algorithm Selection Matrix",
      content: `
| Algorithm | Time Complexity | Space Complexity | Negative Edges | Negative Cycles | Best Application Domain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dijkstra (Matrix)** | $\\Theta(V^2)$ | $\\Theta(V^2)$ | No | No | Dense graphs ($E \\approx V^2$), complete matrices |
| **Dijkstra (Min-Heap)** | $O((V + E) \\log V)$ | $O(V + E)$ | No | No | General sparse networks, road maps, web graphs |
| **0-1 BFS** | $\\Theta(V + E)$ | $\\Theta(V)$ | No ($w \\in \\{0, 1\\}$) | No | Grid mazes, wire routing, state graphs with 0/1 costs |
| **Bellman-Ford** | $O(V \\cdot E)$ | $\\Theta(V)$ | Yes | Detects & Reports | Distributed routing protocols (RIP), arbitrage detection |
| **SPFA (with SLF)** | $O(E)$ avg, $O(V E)$ worst | $\\Theta(V)$ | Yes | Detects & Reports | Sparse networks with occasional negative edges |
| **Floyd-Warshall** | $\\Theta(V^3)$ | $\\Theta(V^2)$ | Yes | Detects ($D[i][i] < 0$) | Dense all-pairs shortest paths ($V \\le 500$) |
| **Johnson's APSP** | $O(V E + V^2 \\log V)$ | $\\Theta(V^2)$ | Yes | Detects via prep | Sparse all-pairs shortest paths ($V > 1000$) |
      `,
    },
  ],
};
