import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_tree_queries_and_diameter_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_tree_queries_and_diameter",
      title: "Tree Queries and Diameter Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Dynamic Path Aggregate Queries via Heavy-Light Decomposition",
          problemId: "dynamic-path-aggregate-hld",
          difficulty: "Hard",
          description:
            "Design a data structure for a tree of $N = 10^5$ nodes supporting dynamic point updates `update(node, val)` and path maximum queries `queryMax(u, v)` in $O(\\log^2 N)$ worst-case time using Heavy-Light Decomposition and a 1D Segment Tree.",
          rationale:
            "Tests heavy chain path decomposition, head jumping, and 1D interval segment tree mapping.",
        },
        {
          title: "Centroid Decomposition: Count Path Pairs of Length K",
          problemId: "centroid-decomposition-length-k",
          difficulty: "Expert",
          description:
            "Given an unweighted tree with $N = 10^5$ vertices and an integer $K$, compute the total number of unordered pairs of vertices $(u, v)$ such that the simple path distance between $u$ and $v$ is exactly $K$, running in $O(N \\log N)$ time.",
          rationale:
            "Evaluates tree divide-and-conquer, subtree contribution subtraction, and centroid tree construction.",
        },
        {
          title: "Tree Center, Radius & Diameter Reconstitution",
          problemId: "tree-center-diameter-radius",
          difficulty: "Medium",
          description:
            "Given an unrooted tree with $N$ nodes, compute the exact diameter length, the tree radius ($R = \\lceil D/2 \\rceil$), and return the list of 1 or 2 center nodes that minimize the maximum distance to any other node.",
          rationale: "Tests 2-DFS diameter endpoint extraction and path center identification.",
        },
        {
          title: "Euler Tour RMQ: Constant Time O(1) LCA Engine",
          problemId: "euler-tour-rmq-lca",
          difficulty: "Hard",
          description:
            "Implement an LCA solver that records the $2N-1$ length Euler tour visit sequence and answers subsequent LCA queries in absolute $\\Theta(1)$ time per query using a Sparse Table RMQ over node depths.",
          rationale:
            "Demonstrates transformation of tree hierarchical queries into array static range minimum queries.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Euler Tour Depth RMQ to LCA Reduction Correctness",
          statement:
            "Prove that if $E$ is the Euler tour traversal array recording vertices as they are visited and backtracked during DFS, and $D[i]$ is the tree depth of vertex $E[i]$, then for any two vertices $u$ and $v$ with first visit indices $first[u] \\le first[v]$, the vertex $E[\\arg\\min_{i \\in [first[u], first[v]]} D[i]]$ is the unique Lowest Common Ancestor $\\text{LCA}(u, v)$.",
          proofOutline:
            "During DFS, the traversal leaves $u$'s subtree, backtracks up through ancestors until reaching $\\text{LCA}(u, v)$, and then descends into $v$'s subtree. Every vertex visited strictly between $first[u]$ and $first[v]$ belongs to the subtree of $\\text{LCA}(u, v)$, meaning their depths are $\\ge \\text{depth}(\\text{LCA}(u, v))$. Because $\\text{LCA}(u, v)$ is visited during the backtrack to transition into $v$'s branch, its depth is strictly the minimum in this interval.",
          engineeringContext:
            "Provides ultra-low-latency LCA lookups for high-throughput network routing engines.",
        },
        {
          title: "Tree Center Uniqueness Theorem (Jordan 1869)",
          statement:
            "Prove that the center of any finite tree $T$ (the set of vertices minimizing the maximum distance to any other vertex) consists of either a single vertex or two adjacent vertices.",
          proofOutline:
            "Pruning all leaves of $T$ simultaneously decreases the eccentricity (maximum distance to any leaf) of every remaining vertex by exactly 1. Repeating this leaf-removal procedure preserves the set of centers. Because the tree is finite and connected, the process terminates at either a single vertex (diameter is even) or two adjacent vertices joined by an edge (diameter is odd).",
          engineeringContext:
            "Used to place central cluster coordinators and master nodes in distributed topologies to minimize maximum RPC latency.",
        },
        {
          title: "Tarjan's Offline LCA DSU Invariant Proof",
          statement:
            "Prove that in Tarjan's Offline LCA algorithm with Disjoint-Set Union (DSU), at the moment vertex $u$ finishes its post-order DFS and queries pair $(u, v)$ where $v$ has already been visited, $\\text{Find}(v)$ returns the exact Lowest Common Ancestor $\\text{LCA}(u, v)$.",
          proofOutline:
            "When a subtree at vertex $w$ completes DFS, all its nodes are unioned into $w$'s parent. Therefore, for any already-visited node $v$, its current DSU set representative points to the highest ancestor of $v$ whose entire subtree has not yet finished DFS, which by definition of the DFS call stack is the deepest common ancestor shared with the currently active node $u$.",
          engineeringContext:
            "Enables batch processing of $10^7$ phylogenetic evolutionary tree queries in linear time.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Contiguous In-Order Flattening & Hardware Stream Prefetching",
          prompt:
            "Why does flattening a tree into DFS entry timestamps (`pos[u]`) boost HLD query performance by $300\\%$ compared to pointer-chased tree node traversal on modern x86/ARM CPUs?",
          engineeringContext:
            "Pointer-chased trees incur random memory dereferencing with 150-cycle DRAM latencies. Contiguous DFS indexing allows CPU hardware stream prefetchers to anticipate sequential memory access and pre-load cache lines into L1.",
        },
        {
          title: "Iterative Explicit-Stack DFS for Deep Line Graphs ($N=10^5$)",
          prompt:
            "Analyze how an iterative DFS engine using an explicit `Int32Array` heap stack prevents V8 call-stack exhaustion while avoiding heap allocation overhead inside traversal loops.",
          engineeringContext:
            "Native JavaScript/C++ stack frames allocate 128-512 bytes per call. An explicit flat `Int32Array` stores only the vertex index (4 bytes per node), fitting $10^5$ frames into 400KB of memory.",
        },
        {
          title: "Branch Predictability in Binary Lifting vs Dynamic Pointer Trees",
          prompt:
            "Explain why the fixed power-of-2 loop in Binary Lifting (`for (int k = maxK-1; k >= 0; k--)`) yields nearly zero branch mispredictions in CPU instruction pipelines.",
          engineeringContext:
            "Static loop iteration counts allow the branch target buffer (BTB) to predict branches with near $100\\%$ accuracy, preventing expensive 20-cycle pipeline flushes.",
        },
      ],
      partD_stressTests: [
        {
          title: "Bamboo Tree Call-Stack Overflow ($N=100,000$)",
          scenario:
            "A degenerate linear tree where each node $i$ has child $i+1$ is traversed using standard recursive DFS.",
          failureMode:
            "V8 call stack exceeds maximum limit (10,000 frames), throwing fatal `RangeError: Maximum call stack size exceeded`.",
        },
        {
          title: "Star Graph Centroid Recursion Degeneration on Incorrect Subtree Sizing",
          scenario:
            "A star graph with central hub connected to $N-1$ leaves is decomposed without updating component subtree sizes before centroid searches.",
          failureMode:
            "Algorithm repeatedly selects leaf nodes as pseudo-centroids, degenerating recursion depth to $\\Theta(N)$ and total runtime to $\\Theta(N^2)$ (TLE).",
        },
        {
          title: "2-DFS Diameter Failure on Negative Edge Weights",
          scenario:
            "A tree containing negative edge weights is evaluated for diameter using the standard 2-DFS algorithm.",
          failureMode:
            "The furthest node from $u$ in terms of path weight is not necessarily an endpoint of the true longest simple path, returning an incorrect suboptimal diameter.",
        },
      ],
    },
  ],
};
