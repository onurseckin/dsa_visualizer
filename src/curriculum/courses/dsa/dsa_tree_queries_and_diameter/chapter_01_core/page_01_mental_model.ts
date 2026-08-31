import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_tree_queries_and_diameter_c1_p1",
  pageNumber: 1,
  title: "Tree Topologies, Binary Lifting & Decomposition Invariants",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Dynamic Tree Query & Scalability Crisis",
      content:
        "Trees represent the foundational topology for file systems, routing hierarchies, parse trees, and network topologies. Naively executing path queries (such as Lowest Common Ancestor, path sum, path maximum, or tree diameter) requires pointer-chasing DFS traversals taking $\\Theta(N)$ time per query. For $Q = 10^5$ queries on a tree of $N = 10^5$ nodes, naive traversal incurs $10^{10}$ operations and severe cache thrashing. Advanced tree algorithms linearize tree hierarchies into 1D sequences via Euler Tours, binary powers-of-two jump tables, Heavy-Light chain decompositions, or recursive centroid partitioning.",
    },
    {
      type: "prose",
      title: "Taxonomy of Advanced Tree Query Paradigms",
      content:
        "Tree query algorithms are categorized by their structural linearization techniques:\n\n1. **Tree Diameter Formulations:**\n   - **2-DFS / 2-BFS Method:** Finds the tree diameter $(v, w)$ by running an initial search from an arbitrary node $u$ to find its furthest node $v$, followed by a second search from $v$ to find $w$. Applicable to non-negatively weighted unrooted trees.\n   - **Tree Dynamic Programming (Post-Order DFS):** Computes subtree branch depths $d_1(u)$ (deepest) and $d_2(u)$ (second deepest) in a single $O(N)$ pass, yielding diameter $\\max_{u \\in V} (d_1(u) + d_2(u))$.\n\n2. **Lowest Common Ancestor (LCA) & Path Queries:**\n   - **Binary Lifting ($O(N \\log N)$ prep, $O(\\log N)$ query):** Maintains $2^k$-ancestor jump table $up[u][k] = up[up[u][k-1]][k-1]$. Decomposes tree distance into binary components.\n   - **Euler Tour + Sparse Table RMQ ($O(N \\log N)$ prep, $O(1)$ query):** Records the DFS visit sequence. $LCA(u, v)$ is the vertex with minimum depth in the Euler tour segment between the first occurrences of $u$ and $v$.\n\n3. **Heavy-Light Decomposition (HLD):**\n   - Decomposes tree edges into **Heavy edges** (pointing to child with largest subtree size $\\ge \\text{size}(u)/2$) and **Light edges**.\n   - Any path from root to leaf crosses at most $\\lfloor \\log_2 N \\rfloor$ light edges.\n   - Heavy chains map to contiguous intervals in a 1D Segment Tree, resolving dynamic path updates and queries in $O(\\log^2 N)$ time.\n\n4. **Centroid Decomposition (Tree Divide-and-Conquer):**\n   - Identifies a centroid vertex whose removal splits the tree into components of size $\\le N/2$.\n   - Recursively building the centroid tree yields a balanced tree of depth $\\le \\log_2 N$, answering path counting and distance queries in $O(N \\log N)$ time.",
    },
    {
      type: "mental_model",
      title: "Heavy-Light Chain & Binary Lifting Jump Mental Model",
      visualIntuition: `
=== HEAVY-LIGHT DECOMPOSITION (HLD) ===
Root [1] (size 8)
  ├── (Heavy) ──> Node [2] (size 5) ── (Heavy) ──> Node [5] (size 3) ── (Heavy) ──> Node [8] (size 1)
  │                 └── (Light) ──> Node [6] (size 1)
  └── (Light) ──> Node [3] (size 2) ── (Heavy) ──> Node [7] (size 1)
                    └── (Light) ──> Node [4] (size 1)

Heavy Chain 1: [1 -> 2 -> 5 -> 8] (Mapped to contiguous indices 0, 1, 2, 3 in Segment Tree)
Heavy Chain 2: [3 -> 7]           (Mapped to contiguous indices 4, 5 in Segment Tree)
Heavy Chain 3: [6]                (Mapped to index 6)
Heavy Chain 4: [4]                (Mapped to index 7)

Any path u -> v crosses at most log2(N) heavy chains!

=== BINARY LIFTING JUMP TABLE ===
up[u][k] = 2^k-th ancestor of node u:
  up[u][0] = 2^0 = 1st ancestor (parent)
  up[u][1] = 2^1 = 2nd ancestor (parent of parent)
  up[u][2] = 2^2 = 4th ancestor (up[up[u][1]][1])
  up[u][3] = 2^3 = 8th ancestor (up[up[u][2]][2])
      `,
      invariant:
        "Light Edge Subtree Halving Invariant: For any light edge $(u, v)$ from parent $u$ to child $v$, $\\text{size}(v) < \\text{size}(u) / 2$. Consequently, any simple path from the root to any vertex $x$ contains at most $\\lfloor \\log_2 N \\rfloor$ light edges.",
      stateTransitions:
        "Binary Lifting Table: $up[u][k] = up[up[u][k-1]][k-1]$ for $k = 1 \\dots \\lfloor \\log_2 N \\rfloor$.\nHLD Path Jump: While $\\text{head}[u] \\neq \\text{head}[v]$, jump the deeper chain head: query segment tree $[\\text{pos}[\\text{head}[u]], \\text{pos}[u]]$, then set $u \\leftarrow \\text{parent}[\\text{head}[u]]$.",
      naiveBottleneck:
        "Traversing tree edges step-by-step upward takes $\\Theta(N)$ time on degenerate linear trees (depth $10^5$), causing time limit exceeded (TLE) and stack overflow.",
      optimalInsight:
        "By partitioning tree paths into dyadic powers-of-two leaps or contiguous heavy segments on a 1D Segment Tree, path operations reduce from linear time to $O(\\log N)$ or $O(\\log^2 N)$.",
    },
  ],
};
