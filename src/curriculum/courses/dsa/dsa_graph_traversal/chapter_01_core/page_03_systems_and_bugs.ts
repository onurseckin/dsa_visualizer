import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_traversal_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "CSR Cache Line Locality & Hardware Call-Stack Limits",
      content:
        "High-performance graph frameworks (GraphBLAS, Ligra, cuGraph) structure graph traversals around hardware memory hierarchies:\n\n1. **Adjacency Lists vs Compressed Sparse Row (CSR):** Storing a graph as an array of JavaScript arrays (`adj[u] = [v1, v2]`) allocates $|V|$ distinct heap objects. Traversing neighbors causes pointer dereferencing cache misses. **Compressed Sparse Row (Forward-Star)** stores all $|E|$ edge targets contiguously in an `Int32Array`, allowing the CPU hardware prefetcher to stream 16 consecutive edge destinations into a single 64-byte L1 cache line at 1 cycle per edge.\n2. **Hardware Call-Stack Exhaustion:** Recursive DFS on a linear chain graph of depth $10^5$ allocates $10^5$ activation frames, exceeding the standard thread stack limit ($1-8$ MB) and triggering a fatal `StackOverflowError`. Production engines rewrite DFS using explicit heap-allocated `Int32Array` simulation stacks.\n3. **Queue Shift $O(V^2)$ Performance Trap:** In JavaScript/V8, using `queue.shift()` inside a BFS loop copies all remaining elements left by 1 position on every dequeue, degrading BFS from $O(V + E)$ to disastrous $\\Theta(V^2)$. Always use an advancing index pointer (`let head = 0; queue[head++]`) or a ring buffer.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Tarjan Low-Link Inversions & In-Stack Omissions",
      content:
        "1. **The Tarjan Low-Link Cross-Edge Bug:** When visiting an already-discovered neighbor $v$ that is currently on the stack, updating `low[u] = Math.min(low[u], low[v])` instead of `low[u] = Math.min(low[u], dfn[v])` incorrectly pulls $low[v]$ from deeper subtrees, falsely merging disjoint SCCs.\n2. **Missing `inStack` Verification:** In Tarjan's algorithm, checking only `dfn[v] !== 0` without verifying `inStack[v]` connects $u$ via cross-edges to previously closed and popped SCCs, corrupting the component partition.\n3. **Eulerian Path Disconnected Component False Positive:** Verifying degree balance (all vertices have $\\text{in} = \\text{out}$ or exactly two vertices differ by 1) is necessary but *not sufficient* for an Eulerian path; the non-zero degree vertices must also belong to a single connected component.\n4. **Directed Cycle Detection False Positives:** In directed graphs, encountering an already visited node (`visited[v] === true`) does *not* imply a cycle unless $v$ is on the active recursion stack (`onStack[v] === true`), distinguishing back edges from cross edges.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Algorithmic Frontiers: 2-SAT Solvability & Hierholzer's Eulerian Paths",
      content:
        "Graph traversal invariants solve classical NP-complete boundary problems:\n- **2-SAT Solvability via SCC Condensation (Aspvall, Plass & Tarjan 1979):** A 2-Satisfiability boolean formula $(x_1 \\lor x_2) \\land (\\neg x_1 \\lor x_3)$ is converted into an implication graph where $(A \\lor B)$ becomes $(\\neg A \\to B)$ and $(\\neg B \\to A)$. The formula is satisfiable if and only if no variable $x_i$ and its negation $\\neg x_i$ belong to the same SCC. Topological sorting of the condensed DAG yields a valid truth assignment in $O(V + E)$ time.\n- **Hierholzer's Algorithm (1873):** Finds an Eulerian circuit in $O(E)$ time by maintaining an active traversal stack and splicing sub-tours upon backtracking.",
    },
    {
      type: "prose",
      title: "Graph Traversal Algorithm Selection Matrix",
      content: `
| Algorithm | Graph Type | Target Output | Time Complexity | Auxiliary Space | Key Advantage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Breadth-First Search (BFS)** | Unweighted / Direct | Shortest path hops, level order | $O(V + E)$ | $O(V)$ queue | Optimal unweighted distance |
| **Depth-First Search (DFS)** | Directed / Undirected | Edge classification, connected components | $O(V + E)$ | $O(V)$ stack | Topological properties, back-edges |
| **Kahn's Algorithm** | Directed Acyclic (DAG) | Topological sequence, cycle detection | $O(V + E)$ | $O(V)$ in-degree | Simple iterative queue processing |
| **Tarjan's SCC** | Directed Cyclic | Strongly Connected Components DAG | $O(V + E)$ | $O(V)$ stack | Single-pass linear condensation |
| **Kosaraju-Sharir SCC** | Directed Cyclic | Strongly Connected Components DAG | $O(V + E)$ | $O(V + E)$ transposed | Conceptual simplicity (2-pass DFS) |
| **Hierholzer's Algorithm** | Eulerian Directed / Undir | Eulerian Trail (visit each edge once) | $O(E)$ | $O(E)$ edge stack | Optimal circuit reconstruction |
      `,
    },
  ],
};
