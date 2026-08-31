import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_spanning_trees_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Memory Hierarchy, Radix Sorting & Disjoint-Set Cache Compression",
      content:
        "Practical execution speed in Minimum Spanning Tree engines is governed by memory subsystem dynamics:\n\n1. **Path Compression as Cache Alignment:** Without path compression, uncompressed DSU trees degenerate into $O(N)$-depth pointer chains. Traversing these chains forces random memory reads across DRAM ($>200$ cycles per jump). Full two-pass path compression (`parent[curr] = root`) collapses the tree into depth 1, ensuring all future `find` operations hit L1 cache in 1 CPU cycle.\n2. **Linear-Time Radix Sort on Edge Lists:** Standard comparison sorts (`std::sort`, Array.prototype.sort) consume $O(E \\log E)$ instructions with frequent branch mispredictions. For 32-bit integer weights, an 8-bit 4-pass Radix Sort sorts $10^7$ edges in strictly $O(E)$ linear time with zero branch mispredictions, cutting Kruskal preprocessing time by $3.5\\times$.\n3. **Dense Prim Matrix Locality:** In dense graphs ($E \\approx V^2$), Prim's algorithm on a contiguous flat matrix reads memory sequentially row-by-row. Hardware stream prefetchers keep memory pipelines saturated, outperforming binary heap Dijkstra-style Prim by $500\\%$.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Degenerate DSU & Floating-Point Hazards",
      content:
        "1. **Omitting Union-by-Rank or Union-by-Size:** Using naive `parent[find(u)] = find(v)` without rank tracking degrades tree balance. Even with path compression, worst-case operations can spike to $O(\\log N)$ per query instead of $\\alpha(N)$.\n2. **Floating-Point Comparator Subtraction Bug:** In JavaScript/C++, sorting via `(a.w - b.w)` produces NaN on non-finite values and integer overflow when comparing large signed numbers. Always use explicit comparisons `a.w < b.w ? -1 : a.w > b.w ? 1 : 0`.\n3. **Parallel Borůvka Edge Duplication Race:** In multithreaded Borůvka implementations, if component $A$ selects edge $e = (A, B)$ and component $B$ simultaneously selects the same edge $e = (B, A)$, atomic synchronization is mandatory to ensure edge $e$ is added to the MST exactly once.\n4. **Disconnected Graph Failure Mode:** If the graph has $C > 1$ disconnected components, Kruskal will terminate with fewer than $N-1$ edges. MST algorithms must verify that `edgesAdded === n - 1` before declaring success.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Inverse Ackermann Complexity & Second-Best Spanning Tree",
      content:
        "Advanced theoretical frontiers in spanning tree theory:\n- **Tarjan's Inverse Ackermann $\\alpha(N)$ Bound:** The Ackermann function $A(i, j)$ grows extraordinarily fast ($A(4, 2) = 2^{65536} \\approx 10^{19728}$). Its functional inverse $\\alpha(N) = \\min \\{ k \\mid A(k, 1) \\ge N \\}$ is strictly $\\le 4$ for any input size $N$ that can physically exist in the universe. Tarjan's potential method proof guarantees that $m$ DSU operations on $n$ elements execute in strictly $O(m \\alpha(n))$ time.\n- **Second-Best Minimum Spanning Tree:** Find the MST $T$ first. For every non-tree edge $e = (u, v) \\notin T$, adding $e$ creates a cycle; we remove the maximum-weight edge on the tree path between $u$ and $v$ (queried in $O(\\log V)$ via Binary Lifting). The second-best MST is $\\min_{e \\notin T} (w(T) + w(e) - \\text{maxEdge}(u, v))$, computed in $O(E \\log V)$ time.",
    },
    {
      type: "prose",
      title: "MST Algorithm Selection Matrix",
      content: `
| Algorithm | Time Complexity | Space Complexity | Best Graph Density | Parallelism Capability | Hardware Suitability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kruskal (with DSU)** | $O(E \\log V)$ | $O(V + E)$ | Sparse ($E = O(V)$) | Low (global edge sort) | General CPUs, clean code |
| **Kruskal + Radix Sort** | $O(E \\alpha(V))$ | $O(V + E)$ | Sparse / Integer weights | Low | High-throughput packet switches |
| **Prim (Dense Array)** | $\\Theta(V^2)$ | $\\Theta(V^2)$ | Dense ($E = \\Theta(V^2)$) | Medium (inner row scan) | SIMD vectorized L1 cache |
| **Prim (Binary Heap)** | $O(E \\log V)$ | $O(V + E)$ | Sparse / General | Low | General sparse graphs |
| **Borůvka** | $O(E \\log V)$ | $O(V + E)$ | Any density | High (independent components) | Multi-core GPUs / Distributed clusters |
| **Chazelle (Soft Heap)** | $O(E \\alpha(V) \\log \\alpha(V))$ | $O(V + E)$ | Theoretical benchmark | Very Low | Theoretical research |
      `,
    },
  ],
};
