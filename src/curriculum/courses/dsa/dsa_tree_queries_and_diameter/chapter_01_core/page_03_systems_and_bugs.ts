import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_tree_queries_and_diameter_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Call Stack Exhaustion, Memory Hierarchy & Euler Linearization",
      content:
        "Modern execution environments impose strict architectural constraints on deep hierarchical tree traversals:\n\n1. **Call-Stack Overflow on Degenerate Trees:** In Python and V8 (Node.js/Chromium), the call-stack is capped at 1,000 to 10,000 frames. On a linear tree of $N = 10^5$ nodes, naive recursive DFS crashes immediately with a stack overflow. Production tree engines must either utilize explicit heap-allocated array stacks for iterative DFS or balance the tree.\n2. **Euler Tour & HLD Memory Linearization:** Node structures scattered across random heap pointers (`Node* left, Node* right`) induce severe DRAM latency stalls ($>200$ cycles per tree level). By assigning DFS in-time timestamps (`pos[u]`), subtrees and heavy chains map directly into contiguous array slices. Hardware prefetchers detect linear memory access patterns and stream data directly into 64-byte L1 cache lines.\n3. **Binary Lifting Branch Predictor Predictability:** Unlike binary search on irregular arrays, binary lifting executes fixed loop counts ($k = \\lfloor \\log_2 N \\rfloor$ down to 0). The loop branch is statically predicted as taken $100\\%$ of the time until the final iteration.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Degenerate Centroids & Boundary Invariants",
      content:
        "1. **HLD Same-Chain Residual Range Omission:** When `head[u] === head[v]`, traversal loops terminate, but the path segment between $u$ and $v$ within that final heavy chain remains unqueried. Failing to execute `querySeg(pos[min(u, v)], pos[max(u, v)])` drops the path segment containing the LCA.\n2. **2-DFS Diameter Failure on Negative Edge Weights:** The 2-DFS diameter algorithm strictly relies on the triangle inequality and non-negative metric spaces. If any edge has negative weight, 2-DFS produces completely incorrect results (requires Tree DP or Floyd-Warshall).\n3. **Centroid Component Size Recomputation Trap:** During Centroid Decomposition, the subtree sizes must be recalculated *within the currently isolated component* before searching for the centroid. Using global original tree sizes causes the search to pick non-centroid boundary nodes, degenerating the decomposition height from $O(\\log N)$ to $\\Theta(N)$ ($O(N^2)$ total work).\n4. **Binary Lifting Root Over-Jump:** If $2^k$-th ancestor jumps extend past the root node, `up[root][k]` must be clamped to `root` (or 0). Allowing uninitialized `-1` indices to propagate leads to out-of-bounds segmentation faults.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Centroid Decomposition Theorem & Link-Cut Tree Duality",
      content:
        "Advanced tree algorithms provide foundational primitives for dynamic distributed networks:\n- **Centroid Existence Theorem (Jordan 1869):** Every tree $T$ with $N$ vertices contains a vertex $c$ (the centroid) whose removal partitions $T$ into connected components each having size at most $\\lfloor N/2 \\rfloor$. By recursively splitting at centroids, the depth of the resulting Centroid Tree is strictly bounded by $\\lfloor \\log_2 N \\rfloor$, enabling divide-and-conquer path counting in $O(N \\log N)$ time.\n- **Tarjan's Offline LCA via Disjoint-Set Union (DSU):** Answers all $Q$ offline LCA queries in $O(N + Q \\alpha(N))$ time using a single post-order DFS combined with Union-Find path compression.\n- **Link-Cut Trees (Sleator-Tarjan):** Maintains a forest of dynamic trees under arbitrary `link(u, v)` and `cut(u, v)` operations in $O(\\log N)$ amortized time per operation using preferred path splay trees.",
    },
    {
      type: "prose",
      title: "Tree Query Paradigm Selection Matrix",
      content: `
| Technique | Preprocessing Time | Query Latency | Dynamic Edge Updates | Memory Complexity | Best Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Binary Lifting LCA** | $O(N \\log N)$ | $O(\\log N)$ | No (Static Tree) | $O(N \\log N)$ | General LCA & $k$-th ancestor queries |
| **Euler Tour + RMQ** | $O(N \\log N)$ | $O(1)$ | No (Static Tree) | $O(N \\log N)$ | Ultra-high query volume LCA |
| **Heavy-Light Decomp** | $O(N)$ | $O(\\log^2 N)$ | Node/Edge mutations | $O(N)$ | Dynamic path/subtree aggregate updates |
| **Centroid Decomp** | $O(N \\log N)$ | $O(\\log N)$ | No (Static Tree) | $O(N \\log N)$ | All-pairs path length / distance counting |
| **Link-Cut Tree** | $O(1)$ | $O(\\log N)$ amortized | Yes (Link & Cut) | $O(N)$ | Dynamic forest connectivity & maximums |
| **Tarjan Offline LCA** | $O(N + Q \\alpha(N))$ | $O(1)$ batch | No (Offline) | $O(N + Q)$ | Batch processing static logs |
      `,
    },
  ],
};
