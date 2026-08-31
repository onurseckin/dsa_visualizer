import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_traversal_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_graph_traversal",
      title: "Graph Traversal Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Critical Connections in a Network (Bridges)",
          problemId: "critical-connections-bridges",
          difficulty: "Hard",
          description:
            "There are $n$ servers numbered from $0$ to $n - 1$ connected by undirected server-to-server connections. Return all critical connections in the network where removing the connection disconnects servers in $O(V + E)$ time using Tarjan's low-link algorithm.",
          rationale: "Tests low-link subtree reachability invariant ($low[v] > dfn[u]$).",
        },
        {
          title: "Course Schedule II",
          problemId: "course-schedule-ii-kahn",
          difficulty: "Medium",
          description:
            "Return the ordering of courses you should take to finish all courses given prerequisite dependencies. If it is impossible to finish all courses, return an empty array. Solve in $O(V + E)$ time using Kahn's algorithm.",
          rationale: "Evaluates in-degree queue processing and directed cycle detection.",
        },
        {
          title: "Reconstruct Itinerary (Eulerian Path)",
          problemId: "reconstruct-itinerary-eulerian",
          difficulty: "Hard",
          description:
            "Given a list of airline tickets represented by pairs of departure and arrival airports, reconstruct the itinerary in lexical order that uses all tickets exactly once in $O(E \\log E)$ time using Hierholzer's algorithm.",
          rationale: "Tests post-order DFS edge-exhaustion and Eulerian path splicing.",
        },
        {
          title: "Word Ladder (Bidirectional BFS)",
          problemId: "word-ladder-bidirectional",
          difficulty: "Hard",
          description:
            "Given two words (beginWord and endWord), and a dictionary's word list, return the number of words in the shortest transformation sequence from beginWord to endWord using Bidirectional BFS.",
          rationale:
            "Tests frontier-balancing bidirectional BFS to reduce exponential branching factors from $O(B^d)$ to $O(B^{d/2})$.",
        },
      ],
      partB_mathProofs: [
        {
          title: "2-SAT Satisfiability Equivalence via SCC Condensation",
          statement:
            "Prove that a 2-CNF boolean formula $\\Phi$ is satisfiable if and only if for every variable $x_i$, $x_i$ and $\\neg x_i$ belong to distinct strongly connected components in the implication graph $G_\\Phi$.",
          proofOutline:
            "A clause $(u \\lor v)$ is equivalent to implications $(\\neg u \\to v)$ and $(\\neg v \\to u)$. If $x_i$ and $\\neg x_i$ are in the same SCC, then $x_i \\implies \\neg x_i$ and $\\neg x_i \\implies x_i$, a logical contradiction. Conversely, if no variable shares an SCC with its negation, topologically sorting the condensed SCC DAG and assigning truth values (True to the SCC that appears later in topological order) satisfies all clauses without contradiction.",
          engineeringContext:
            "Used in circuit design validation, package dependency resolution, and automated theorem provers.",
        },
        {
          title: "DAG Topological Ordering Existence $\\iff$ Acyclicity",
          statement:
            "Prove that a directed graph $G = (V, E)$ possesses a topological ordering if and only if $G$ contains no directed cycles (is a DAG).",
          proofOutline:
            "If $G$ contains a directed cycle $v_0 \\to v_1 \\to \\dots \\to v_k \\to v_0$, in any total ordering $<$, transitivity implies $v_0 < v_1 < \\dots < v_k < v_0$, impossible for a strict order. Conversely, every finite DAG contains at least one vertex with in-degree 0. Inductively removing in-degree 0 vertices (Kahn's algorithm) produces a valid total ordering of all $V$ vertices.",
          engineeringContext:
            "Core scheduling engine in Make, Bazel, and database query plan optimizers.",
        },
        {
          title: "Hopcroft-Tarjan Cut-Vertex Invariant for Biconnected Components",
          statement:
            "Prove that in a DFS tree of an undirected graph $G$, non-root vertex $u$ is an articulation point (cut-vertex) if and only if $u$ has a tree child $v$ such that $low[v] \\ge dfn[u]$.",
          proofOutline:
            "If $low[v] \\ge dfn[u]$, no vertex in the subtree rooted at $v$ has a back-edge to any strict ancestor of $u$. Removing $u$ completely disconnects $v$'s subtree from the rest of the graph. For the root node $r$, $r$ is a cut-vertex if and only if it has $\\ge 2$ children in the DFS tree.",
          engineeringContext:
            "Used in critical infrastructure network survivability analysis (power grids, telecom backbone).",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Forward-Star (CSR) Spatial Cache Locality vs Pointer Arrays",
          prompt:
            "Why does Forward-Star / CSR representation execute graph traversals up to $10\\times$ faster than an array of JavaScript arrays (`adj[u] = [v1, v2]`)?",
          engineeringContext:
            "Array of arrays allocates $|V|$ separate heap objects with pointer indirection. Forward-Star stores all $|E|$ edge targets in a contiguous `Int32Array`, loading 16 consecutive edge destinations per 64-byte L1 cache line without allocator overhead.",
        },
        {
          title: "Explicit `Int32Array` Stack vs OS Thread Call-Stack Limits",
          prompt:
            "How does rewriting recursive DFS with an explicit `Int32Array` simulation stack prevent process crashes on massive graphs with $V = 10^6$?",
          engineeringContext:
            "OS threads allocate fixed call-stack memory ($1-8$ MB), crashing with `StackOverflowError` after $10^4$ frames on linear chain graphs. Explicit arrays allocate from virtual heap memory, supporting millions of frames.",
        },
        {
          title: "Queue `shift()` $\\Theta(V^2)$ Latency Trap in BFS",
          prompt:
            "Why does using `queue.shift()` in JavaScript/V8 destroy BFS linear time complexity, and how is it resolved in $O(1)$?",
          engineeringContext:
            "`queue.shift()` copies all remaining array elements to the left by 1 index, turning an $O(V)$ queue loop into $\\Theta(V^2)$ memory copies. Using an index head pointer (`queue[head++]`) or circular ring buffer maintains strictly $O(1)$ dequeues.",
        },
      ],
      partD_stressTests: [
        {
          title: "Tarjan Low-Link Inversion Bug on Stack Cross-Edges",
          scenario:
            "Updating `low[u] = Math.min(low[u], low[v])` instead of `dfn[v]` when $v$ is already visited and in stack.",
          failureMode:
            "Pulls low-link values from deeper ancestor subtrees, corrupting SCC component boundaries and merging disjoint cycles.",
        },
        {
          title: "Missing `inStack` Verification in SCC Decomposition",
          scenario:
            "Checking `dfn[v] !== 0` without verifying `inStack[v]` when updating low-link on cross-edges.",
          failureMode:
            "Connects active components to previously closed and popped SCCs, producing corrupted components containing duplicate nodes.",
        },
        {
          title: "Fatal Call-Stack Exhaustion on $10^5$ Chain Graph",
          scenario:
            "Executing recursive DFS on a linear directed graph $0 \\to 1 \\to 2 \\to \\dots \\to 10^5$.",
          failureMode:
            "The V8 runtime exhausts its 10,000-frame recursion stack limit, crashing with an uncatchable `RangeError: Maximum call stack size exceeded`.",
        },
      ],
    },
  ],
};
