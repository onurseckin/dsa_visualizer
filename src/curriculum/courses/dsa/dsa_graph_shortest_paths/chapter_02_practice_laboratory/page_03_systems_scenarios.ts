import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_shortest_paths_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_graph_shortest_paths",
      title: "Graph Shortest Paths Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Foreign Currency Arbitrage Detection",
          problemId: "currency-arbitrage-negative-cycle",
          difficulty: "Hard",
          description:
            "Given an $N \\times N$ matrix of currency exchange rates $R[i][j]$, determine if there exists a sequence of trades $c_1 \\to c_2 \\to \\dots \\to c_k \\to c_1$ such that $\\prod R > 1$. Transform rates using negative logarithms $w(i, j) = -\\ln(R[i][j])$ and find negative-weight cycles using Bellman-Ford in $O(N^3)$ time.",
          rationale:
            "Tests transformation of multiplicative gain cycles into additive negative-weight graph cycles.",
        },
        {
          title: "Minimum Obstacle Removal in 2D Matrix (0-1 BFS)",
          problemId: "minimum-obstacle-removal-grid",
          difficulty: "Hard",
          description:
            "Given an $M \\times N$ grid where empty cells have cost 0 and obstacle cells have cost 1, find the minimum obstacles to remove to travel from $(0, 0)$ to $(M-1, N-1)$ in strictly $\\Theta(M \\cdot N)$ time using a 0-1 BFS double-ended queue.",
          rationale:
            "Evaluates linear-time 0-1 BFS implementations eliminating priority queue logarithmic overhead.",
        },
        {
          title: "Path with Minimum Effort (Minimax Dijkstra)",
          problemId: "path-with-minimum-effort",
          difficulty: "Medium",
          description:
            "Given a 2D height grid, find a path from top-left to bottom-right minimizing the maximum absolute height difference $|h_1 - h_2|$ between consecutive cells. Solve using modified Dijkstra relaxation in $O(M N \\log(MN))$ time.",
          rationale:
            "Demonstrates adaptation of shortest path algorithms to bottleneck/minimax algebraic semirings.",
        },
        {
          title: "All-Pairs Shortest Path via Johnson's Algorithm",
          problemId: "johnsons-apsp-implementation",
          difficulty: "Hard",
          description:
            "Implement Johnson's Algorithm for sparse graphs with positive and negative weights, outputting the $N \\times N$ distance matrix or reporting negative cycles in $O(V E + V^2 \\log V)$ time.",
          rationale:
            "Evaluates potential reweighting, Bellman-Ford feasibility checking, and multi-source Dijkstra.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Floyd-Warshall Intermediate Vertex Poset Invariant",
          statement:
            "Prove that in the Floyd-Warshall recurrence $D^{(k)}[i][j] = \\min(D^{(k-1)}[i][j], D^{(k-1)}[i][k] + D^{(k-1)}[k][j])$, $D^{(k)}[i][j]$ accurately represents the shortest path weight from $i$ to $j$ using only intermediate vertices from the prefix set $\\{1, 2, \\dots, k\\}$.",
          proofOutline:
            "Induction on $k$. For base case $k=0$, intermediate set is empty (direct edges). For step $k$, a shortest path using intermediate vertices from $\\{1, \\dots, k\\}$ either does not use vertex $k$ (cost $D^{(k-1)}[i][j]$) or uses $k$ at most once (since no negative cycles exist), decomposing into path $i \\rightsquigarrow k$ and $k \\rightsquigarrow j$ with intermediate vertices in $\\{1, \\dots, k-1\\}$, establishing the recurrence.",
          engineeringContext:
            "Foundational for transitivity closures, compiler dataflow reachability, and network distance vector routing.",
        },
        {
          title: "Dial's Algorithm Bucket Queue Monotonicity Invariant",
          statement:
            "Prove that if edge weights are bounded integers $w \\in \\{0, 1, \\dots, W\\}$, maintaining an array of buckets $B[0 \\dots W]$ allows Dial's algorithm to extract the minimum distance node in $O(1)$ amortized time, achieving total runtime $O(V \\cdot W + E)$.",
          proofOutline:
            "Because edge weights are non-negative, the current distance index monotonically advances. Relaxing edge $(u, v)$ from current distance $d[u]$ places $v$ into bucket $d[u] + w \\le d[u] + W$. The bucket pointer advances at most $V \\cdot W$ times across the entire algorithm, yielding $O(1)$ amortized extraction.",
          engineeringContext:
            "Used in game pathfinding and robotics navigation on uniform discrete grids with bounded costs.",
        },
        {
          title: "Bidirectional Search Meeting Point Optimality Bound",
          statement:
            "Prove that in Bidirectional Dijkstra, when the forward search and backward search first select the same vertex $u$ to expand, the shortest path distance is bounded by $\\min_{x \\in S_F \\cap S_B} (d_F[x] + d_B[x])$, and continuing until $\\min d_F + \\min d_B \\ge \\mu$ guarantees global optimality.",
          proofOutline:
            "Let $P$ be the true shortest path between $s$ and $t$. Since $P$ connects the forward visited set and backward visited set, there must exist an edge on $P$ crossing between them. The termination condition $\\min_{u \\notin S_F} d_F[u] + \\min_{v \\notin S_B} d_B[v] \\ge \\mu$ guarantees no unexplored path can achieve cost smaller than $\\mu$.",
          engineeringContext:
            "Essential for enterprise mapping platforms (Google Maps, OSRM) to achieve sub-second cross-country route queries.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Compressed Sparse Row (CSR) Memory Bandwidth Optimization",
          prompt:
            "How does converting pointer-based adjacency lists into a two-array CSR format (`offsets: Int32Array`, `edges: Int32Array`) double Dijkstra throughput by eliminating TLB misses and maximizing L1 data cache utilization?",
          engineeringContext:
            "Pointer adjacency lists incur pointer chasing and heap fragmentation. CSR packs all destination nodes sequentially into contiguous 64-byte cache lines, enabling hardware stream prefetchers to operate at peak memory bus bandwidth.",
        },
        {
          title: "Indexed Binary Heap (Address-Mapped `decreaseKey`) vs Stale Heap Push",
          prompt:
            "Analyze the memory and runtime trade-offs between an Indexed Binary Heap with an inverse position array `pos[node]` supporting $O(\\log V)$ `decreaseKey` versus standard binary heap with stale entries on graph networks with high edge density ($E = 100 V$).",
          engineeringContext:
            "In dense graphs, standard heaps push $|E|$ entries, ballooning memory to gigabytes. Indexed binary heaps maintain exactly $|V|$ elements in contiguous memory, preventing cache eviction of critical routing tables.",
        },
        {
          title: "SIMD Vectorization of Floyd-Warshall Row-Major Relaxations",
          prompt:
            "Explain how arranging Floyd-Warshall DP in the loop order `for k: for i: for j:` allows AVX-512 vector units to execute 16 floating-point distance relaxations (`_mm512_min_ps`) per CPU clock cycle.",
          engineeringContext:
            "With loop order $k-i-j$, the inner loop across $j$ accesses `D[i][j]` and `D[k][j]` with stride 1 (contiguous memory). Compilers automatically vectorize this into SIMD vector registers, achieving a $16\\times$ speedup.",
        },
      ],
      partD_stressTests: [
        {
          title: "SPFA Worst-Case Exponential Degeneracy on Layered DAGs",
          scenario:
            "A layered DAG where path weights double at each level is submitted to an SPFA solver without SLF/LLL optimizations.",
          failureMode:
            "SPFA re-adds vertices to the queue $2^{V/2}$ times, taking exponential time and triggering extreme timeouts (TLE).",
        },
        {
          title: "Integer Wrap-Around on `INT_MAX` Infinity Sentinels",
          scenario:
            "Initializing distance arrays to `0x7fffffff` and executing `dist[u] + weight` when weight is positive.",
          failureMode:
            "Signed 32-bit addition overflows to negative values (e.g. $-2147483648$), leading Dijkstra to falsely accept overflowed negative numbers as valid paths.",
        },
        {
          title: "Floating-Point Underflow in Logarithmic Currency Arbitrage",
          scenario:
            "Multiplying raw fractional currency exchange rates directly over long trade paths without converting to negative logarithms.",
          failureMode:
            "Floating-point values underflow to zero or experience severe rounding cancellation, hiding valid arbitrage opportunities.",
        },
      ],
    },
  ],
};
