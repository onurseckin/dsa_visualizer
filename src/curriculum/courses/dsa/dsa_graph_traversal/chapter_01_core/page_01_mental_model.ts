import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_traversal_c1_p1",
  pageNumber: 1,
  title: "Graph Topologies, DFS Edge Classifications & Strongly Connected Components",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Non-Linear Cyclical Exploration Crisis",
      content:
        "Real-world data networks (social networks, dependency graphs, internet routers, circuit netlists) possess arbitrary cyclic topologies with non-uniform degree distributions. Unsystematic exploration risks infinite loops and exponential state explosions. **Breadth-First Search (BFS)** and **Depth-First Search (DFS)** provide foundational traversal engines that process all $|V|$ vertices and $|E|$ edges in strictly $\\Theta(V + E)$ linear time, revealing shortest paths on unweighted graphs, topological orders, cut-vertices, and strongly connected components (SCCs).",
    },
    {
      type: "prose",
      title: "Taxonomy of Graph Traversals & Structural Invariants",
      content:
        "Graph exploration algorithms are classified by traversal order, edge properties, and structural condensation:\n\n1. **Graph Memory Representations:**\n   - **Adjacency Matrix ($V \\times V$):** $O(1)$ edge existence query, but consumes $O(V^2)$ memory and requires $O(V)$ to iterate over neighbors (catastrophic for sparse graphs where $E \\ll V^2$).\n   - **Adjacency List:** Array of lists consuming $O(V + E)$ memory, but incurs scattered pointer dereferencing.\n   - **Compressed Sparse Row (CSR / Forward-Star):** Two flat arrays (`head[u]` and `to[e]`) packing all edges contiguously into cache lines, maximizing hardware prefetching and minimizing memory footprint.\n\n2. **Depth-First Search (DFS) & 4 Edge Classes:**\n   - Traversal classifies every directed edge $(u, v)$ relative to the DFS exploration forest:\n     1. **Tree Edges:** Edges in the DFS forest ($v$ discovered directly from $u$).\n     2. **Back Edges:** Edges leading to an ancestor in the DFS tree ($v$ is active on the recursion stack). Indicates a **cycle** in directed graphs!\n     3. **Forward Edges:** Non-tree edges leading to a proper descendant ($d[u] < d[v] < f[v] < f[u]$).\n     4. **Cross Edges:** Edges connecting unrelated subtrees or components ($d[v] < f[v] < d[u] < f[u]$).\n   - **Parenthesis Theorem:** For any two vertices $u$ and $v$, their active discovery intervals $[d[u], f[u]]$ and $[d[v], f[v]]$ are either completely disjoint or one is strictly nested within the other.\n\n3. **Topological Sorting (Directed Acyclic Graphs):**\n   - An ordering of vertices $v_1, v_2, \\dots, v_n$ such that for every directed edge $(u, v)$, $u$ appears before $v$.\n   - **Kahn's Algorithm (BFS Queue):** Enqueues all vertices with in-degree 0; decrementing neighbor in-degrees upon node removal.\n   - **DFS Finish Times:** Reverse of DFS post-order finishing times produces a valid topological sort if and only if no back edges exist.\n\n4. **Strongly Connected Components (SCC):**\n   - In a directed graph $G$, an SCC is a maximal subset of vertices $C \\subseteq V$ where every vertex is reachable from every other vertex in $C$.\n   - **Tarjan's Single-Pass SCC Algorithm (Tarjan 1972):** Maintains DFS discovery time `dfn[u]` and lowest reachable ancestor `low[u]`. Nodes are pushed onto an exploration stack; when `low[u] === dfn[u]`, $u$ is the root of an SCC, and popping all nodes down to $u$ extracts the complete component in strictly $O(V + E)$ time.",
    },
    {
      type: "mental_model",
      title: "Tarjan's Low-Link DFS Tree & Stack Invariant",
      visualIntuition: `
=== TARJAN'S LOW-LINK DFS TREE & SCC EXTRACTION ===
DFS Tree Spanning Forest:
                 (1: dfn=1, low=1) [Root of SCC]
                /                 ^
        (Tree) /                   \\ (Back Edge)
              v                     \\
     (2: dfn=2, low=1) ──Tree──> (3: dfn=3, low=1)
            |
            | (Tree)
            v
     (4: dfn=4, low=4) [Root of SCC 2]
            |
            | (Back Edge to 4)
            v
     (5: dfn=5, low=4)

Execution Trace:
1. Visit 4 -> Visit 5 -> 5 has back-edge to 4 -> low[5] = min(5, 4) = 4.
2. Backtrack to 4: low[4] = min(4, low[5]) = 4.
   -> low[4] === dfn[4]! POP STACK until 4 is popped: Component {5, 4} extracted!
3. Backtrack to 2 -> 2 visits 3 -> 3 has back-edge to 1 -> low[3] = min(3, 1) = 1.
4. Backtrack to 2: low[2] = min(2, low[3]) = 1.
5. Backtrack to 1: low[1] = min(1, low[2]) = 1.
   -> low[1] === dfn[1]! POP STACK until 1 is popped: Component {3, 2, 1} extracted!
      `,
      invariant:
        "Low-Link & Stack Invariants:\n1. Low-Link Definition: $low[u] = \\min(\\{dfn[u]\\} \\cup \\{low[v] \\mid (u, v) \\text{ is tree edge}\\} \\cup \\{dfn[w] \\mid (u, w) \\text{ is back/cross edge to active stack}\\})$.\n2. Subtree Root Property: Vertex $u$ satisfies $low[u] = dfn[u]$ if and only if $u$ is the unique earliest discovered vertex in its strongly connected component.",
      stateTransitions:
        "DFS Advance: Push $u$ to stack; $dfn[u] = low[u] = ++timer$; For each neighbor $v$: if unvisited, recurse and $low[u] = \\min(low[u], low[v])$; else if on stack, $low[u] = \\min(low[u], dfn[v])$.\nSCC Flush: If $low[u] == dfn[u]$, pop stack until $u$ is popped to form SCC.",
      naiveBottleneck:
        "Testing pairwise reachability between all pairs of vertices takes $O(V \\cdot (V + E)) = O(V^2 + V E)$ time.",
      optimalInsight:
        "Tarjan's low-link DFS tracks cycle connectivity during a single traversal pass, condensing the graph into a DAG of SCCs in strictly $\\Theta(V + E)$ linear time.",
    },
  ],
};
