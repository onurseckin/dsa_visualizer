import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_spanning_trees_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_graph_spanning_trees",
      title: "Graph Spanning Trees Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Min Cost to Connect All Points (Manhattan Distance MST)",
          problemId: "min-cost-to-connect-all-points",
          difficulty: "Medium",
          description:
            "Given 2D coordinates of $N$ points, find the minimum cost to make all points connected where cost between points $(x_i, y_i)$ and $(x_j, y_j)$ is $|x_i - x_j| + |y_i - y_j|$. Implement in $O(N^2)$ using Dense Prim or in $O(N \\log N)$ using Manhattan sweep-line candidate edge filtering.",
          rationale: "Tests dense MST optimization avoiding $O(N^2)$ edge sorting overhead.",
        },
        {
          title: "Critical and Pseudo-Critical Edges in Minimum Spanning Tree",
          problemId: "critical-pseudo-critical-edges-mst",
          difficulty: "Hard",
          description:
            "Classify every edge in a weighted undirected graph as: (1) Critical (deleting it strictly increases MST weight or disconnects graph), (2) Pseudo-Critical (can appear in at least one MST), or (3) Redundant (never appears in any MST). Solve in $O(E^2)$ or $O(E \\log V)$ time using Kruskal and bridge detection.",
          rationale:
            "Evaluates structural understanding of alternative MST bases and bridge edges.",
        },
        {
          title: "Optimize Water Distribution in a Village (Virtual Source)",
          problemId: "optimize-water-distribution-village",
          difficulty: "Hard",
          description:
            "Given costs to build wells at individual houses and costs to lay pipes between houses, find the minimum cost to supply water to all houses. Reduce by creating a virtual water reservoir node 0 connected to each house with edge weight equal to the well cost.",
          rationale:
            "Demonstrates transformation of node-cost + edge-cost hybrid optimization into pure MST on an augmented graph.",
        },
        {
          title: "Minimum Spanning Tree on Dynamic Dynamic Metric Spaces",
          problemId: "dynamic-mst-edge-weight-updates",
          difficulty: "Expert",
          description:
            "Maintain the MST total weight under online edge weight updates using Link-Cut Trees in $O(\\log V)$ amortized time per update.",
          rationale:
            "Tests state-of-the-art dynamic graph tree maintenance eliminating full rebuilds.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Unique Minimum Spanning Tree Theorem",
          statement:
            "Prove that if all edge weights in a connected undirected graph $G = (V, E)$ are distinct ($w(e_1) \\neq w(e_2)$ for all $e_1 \\neq e_2$), then $G$ possesses exactly one unique Minimum Spanning Tree.",
          proofOutline:
            "Suppose for contradiction there exist two distinct MSTs $T_1 \\neq T_2$. Let $e$ be the minimum-weight edge in the symmetric difference $(T_1 \\setminus T_2) \\cup (T_2 \\setminus T_1)$. Without loss of generality, assume $e \\in T_1 \\setminus T_2$. Adding $e$ to $T_2$ creates a cycle $C$. There must exist an edge $e' \\in C \\setminus T_1$ crossing the cut formed by removing $e$ from $T_1$. Since all weights are distinct and $e$ is the minimal difference edge, $w(e') > w(e)$. Swapping $e'$ for $e$ in $T_2$ creates a spanning tree with strictly lower weight than $T_2$, contradicting $T_2$'s minimality.",
          engineeringContext:
            "Guarantees deterministic, reproducible network routing configurations in software-defined networks (SDN).",
        },
        {
          title: "Cayley's Tree Formula via Prüfer Sequences",
          statement:
            "Prove Cayley's formula: The number of distinct labeled spanning trees on a complete graph $K_n$ is exactly $n^{n-2}$.",
          proofOutline:
            "Construct a bijective mapping between labeled trees on $n$ vertices and Prüfer sequences of length $n-2$ with symbols from $\\{1, 2, \\dots, n\\}$. In each step, record the neighbor of the lowest-degree leaf and remove the leaf. Since each of the $n-2$ positions can independently take any of the $n$ vertex labels, the total number of trees is exactly $n^{n-2}$.",
          engineeringContext:
            "Foundational for random graph generation, statistical physics spanning percolation, and network reliability bounds.",
        },
        {
          title: "Matroid Duality & Red-Blue Cycle-Cut Invariant",
          statement:
            "Prove that the greedy step of color-marking cut-crossing light edges blue and cycle-contained heavy edges red terminates with all $n-1$ blue edges forming the exact unique MST without any graph searches.",
          proofOutline:
            "By matroid duality, the cut space and cycle space of a graph are orthogonal vector spaces over $GF(2)$. The Cut Property colors safe edges blue, while the Cycle Property colors redundant edges red. Invariant preservation ensures no blue cycle and no red cut can ever form, guaranteeing convergence to the unique basis.",
          engineeringContext:
            "Used by VLSI circuit layout synthesis engines for parasitic capacitance wire routing.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Flat Array Disjoint-Set Union Performance on 64-Byte L1 Cache Lines",
          prompt:
            "Why does storing DSU state in two contiguous arrays (`parent: Int32Array`, `rank: Uint8Array`) execute over $400\\%$ faster than an object-based disjoint-set (`class Node { parent: Node; rank: number }`) in large-scale Kruskal runs?",
          engineeringContext:
            "Object-based DSU scatters memory across heap references, incurring random cache-line evictions and GC overhead. Flat typed arrays pack 16 parent integers per 64-byte L1 cache line, keeping traversal inside high-speed CPU registers.",
        },
        {
          title: "Parallel Borůvka Synchronization & Race-Free Component Merging",
          prompt:
            "In GPU/multicore implementations of Borůvka's algorithm, how do atomic compare-and-swap (CAS) loops on 64-bit integer bit-packed `(weight, edgeIndex)` values prevent race conditions when multiple threads concurrently contract adjacent components?",
          engineeringContext:
            "Packing 32-bit weight and 32-bit edge index into a single `uint64_t` allows atomic min-reduction (`atomicMin`) without mutex locks, enabling 100,000 components to be merged in parallel per GPU kernel pass.",
        },
        {
          title: "Four-Pass Radix Sort Vectorization for 32-Bit Edge Lists",
          prompt:
            "Analyze how an 8-bit Radix Sort with 4 linear passes over $E = 10^7$ edges outperforms quicksort/mergesort by eliminating branch mispredictions in CPU instruction pipelines.",
          engineeringContext:
            "Radix Sort computes fixed histogram prefix buckets, iterating with zero conditional branches (`if (a < b)`). The CPU branch predictor achieves $100\\%$ accuracy, doubling instruction retirement rates.",
        },
      ],
      partD_stressTests: [
        {
          title: "Adversarial Linear Degeneracy in Unranked DSU",
          scenario:
            "Executing $10^5$ union operations on an unranked DSU implementation where `parent[find(u)] = find(v)` is called sequentially for $u=i, v=i+1$.",
          failureMode:
            "The tree degenerates into a linear linked list of depth $10^5$, increasing subsequent query latency to $\\Theta(N)$ and causing catastrophic timeouts or stack overflow.",
        },
        {
          title: "Silent Disconnected Graph Partial Forest Failure",
          scenario:
            "Running Kruskal's algorithm on a graph with 3 disconnected components without verifying `edgesAdded === n - 1`.",
          failureMode:
            "Algorithm returns the sum of a spanning forest containing $N - 3$ edges, silently reporting an invalid partial network as a complete spanning tree.",
        },
        {
          title: "64-Bit Float Subtraction Underflow in Edge Sorting",
          scenario:
            "Sorting an edge list where weights are extreme 64-bit values (e.g. $10^{18}$ and $-10^{18}$) using `(a.w - b.w)`.",
          failureMode:
            "Floating-point subtraction overflows to `+Infinity` or `-Infinity`, producing invalid comparator outputs and corrupted MST edges.",
        },
      ],
    },
  ],
};
