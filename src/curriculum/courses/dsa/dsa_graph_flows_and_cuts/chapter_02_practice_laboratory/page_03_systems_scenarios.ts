import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_graph_flows_and_cuts_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_graph_flows_and_cuts",
      title: "Graph Flows and Cuts Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Image Foreground/Background Segmentation via Graph Cuts",
          problemId: "image-segmentation-min-cut",
          difficulty: "Hard",
          description:
            "Given a 2D pixel grid with individual foreground/background likelihood penalties and boundary smoothness penalties between neighboring pixels, formulate and solve the global energy minimization problem using a Dinic Min-Cut solver.",
          rationale:
            "Tests reduction of Markov Random Field (MRF) submodular binary energy functions to directed graph minimum cut.",
        },
        {
          title: "Minimum Vertex Cover & Maximum Independent Set in Bipartite Graphs",
          problemId: "bipartite-min-vertex-cover",
          difficulty: "Hard",
          description:
            "Given a bipartite graph $G = (L \\cup R, E)$, compute the maximum matching using Dinic, and reconstruct the exact minimum vertex cover set of vertices in $O(V + E)$ time using residual BFS reachable sets (König's Theorem).",
          rationale:
            "Tests extraction of exact vertex certificates from residual capacity partition sets.",
        },
        {
          title: "Node-Disjoint Path Routing with Vertex Splitting",
          problemId: "node-disjoint-paths",
          difficulty: "Hard",
          description:
            "Given a directed graph $G$, find the maximum number of paths from $s$ to $t$ such that no two paths share any intermediate vertex (except $s$ and $t$). Transform the graph via node splitting ($v_{in} \\to v_{out}$) and compute maximum flow.",
          rationale:
            "Tests node capacity transformation and path extraction from saturated flow edges.",
        },
        {
          title: "Minimum Cost Maximum Flow (MCMF) with Johnson's Potentials",
          problemId: "min-cost-max-flow-potentials",
          difficulty: "Expert",
          description:
            "Implement Successive Shortest Path MCMF utilizing node potentials $\\pi(u)$ (Johnson's transformation) to maintain non-negative reduced costs $c^\\pi(u, v) = c(u, v) + \\pi(u) - \\pi(v) \\ge 0$, enabling $O(E \\log V)$ Dijkstra augmentations.",
          rationale:
            "Demonstrates mastery of dual potential relaxation in linear programming and network optimization.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of König's Theorem via Max-Flow Min-Cut",
          statement:
            "Prove that in any bipartite graph $G = (L \\cup R, E)$, the size of a maximum matching equals the size of a minimum vertex cover: $|M^*| = |C^*|$.",
          proofOutline:
            "Construct standard flow network with edges $s \\to L$ (cap 1), $L \\to R$ (cap $\\infty$), and $R \\to t$ (cap 1). By integrality theorem, max flow equals max matching $|M^*|$. Let $(S, T)$ be the minimum cut. The cut capacity $c(S, T) = |L \\cap T| + |R \\cap S|$. Show that $C^* = (L \\cap T) \\cup (R \\cap S)$ is a valid vertex cover covering all edges, proving $|C^*| = c(S, T) = |M^*|$.",
          engineeringContext:
            "Foundational for optimal bipartite job dispatching, resource allocation, and compiler register interference coloring.",
        },
        {
          title: "Push-Relabel Non-Saturating Push Potential Bound",
          statement:
            "Prove that the total number of non-saturating pushes in the Goldberg-Tarjan Push-Relabel algorithm is bounded by $O(V^2 E)$ using the potential function $\\Phi = \\sum_{u: e(u) > 0} h(u)$.",
          proofOutline:
            "Show that a non-saturating push from $u$ to $v$ reduces the excess of $u$ to $0$, decreasing $\\Phi$ by $h(u) - h(v) = 1$. Relabel operations increase $\\Phi$ by at most $2V$ per vertex. Saturating pushes increase $\\Phi$ by at most $2V$. Since total increases across all relabels and saturating pushes are bounded by $O(V^2 E)$, total non-saturating pushes cannot exceed $O(V^2 E)$.",
          engineeringContext:
            "Guarantees deterministic polynomial worst-case execution without depending on capacity magnitude.",
        },
        {
          title: "Hall's Marriage Condition Derivation from Max Flow",
          statement:
            "Prove that a bipartite graph $G = (L \\cup R, E)$ has a matching covering all vertices in $L$ if and only if for every subset $S \\subseteq L$, $|N(S)| \\ge |S|$, where $N(S)$ is the neighborhood of $S$.",
          proofOutline:
            "Necessity is trivial. For sufficiency, construct flow network. If max flow is less than $|L|$, the min cut $(S_{cut}, T_{cut})$ has capacity $< |L|$. Let $S = L \\cap S_{cut}$. Show that the cut capacity equals $(|L| - |S|) + |N(S)| < |L|$, which implies $|N(S)| < |S|$, proving the contrapositive.",
          engineeringContext:
            "Used to verify feasibility of distributed microservice load balancers under hard container constraints.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Memory Locality & Forward-Star Layout in High-Throughput Flow Engines",
          prompt:
            "Why does a static Forward-Star array layout (`head`, `next`, `to`, `cap`) achieve up to $5\\times$ higher augmenting path throughput compared to vector-of-vectors (`vector<vector<Edge>>`) in multi-phase Dinic solvers?",
          engineeringContext:
            "Vector-of-vectors introduces heap fragmentation and pointer dereferencing on every level expansion. Flattened typed arrays align edges sequentially into 64-byte L1 cache lines, maximizing hardware memory bandwidth.",
        },
        {
          title: "Parallel Push-Relabel Scalability on NUMA Multi-Socket Architectures",
          prompt:
            "In parallel push-relabel implementations on multi-core NUMA systems, why does naive global queue synchronization cause catastrophic bus lock contention, and how does asynchronous lock-free local vertex discharge resolve it?",
          engineeringContext:
            "Atomic compare-and-swap (CAS) loops on a single shared queue serialize execution across cores. Local thread-pinned excess buckets with asynchronous message passing achieve near-linear multi-socket scaling.",
        },
        {
          title: "Bitset BFS Acceleration for Unit Network Hopcroft-Karp Matching",
          prompt:
            "How can 64-bit word bitsets (`uint64_t`) compress adjacency matrices and vectorize BFS level expansions to process 64 edges per single CPU clock cycle?",
          engineeringContext:
            "Bitwise AND/OR instructions (`_mm256_and_si256`) accelerate unvisited neighbor checks in unit bipartite graphs by $64\\times$, critical in real-time ad-click bipartite auctions.",
        },
      ],
      partD_stressTests: [
        {
          title: "Ford-Fulkerson Denial-of-Service on Pathological 4-Node Bridge",
          scenario:
            "A network with edge capacities $10^9$ and a central bridge of capacity $1$ is solved using naive DFS Ford-Fulkerson.",
          failureMode:
            "DFS alternates between two paths, incrementing flow by only $1$ per step, requiring $2 \\times 10^9$ augmentations and causing complete service outage.",
        },
        {
          title: "Epsilon Leak in Continuous Logistics Flow Optimization",
          scenario:
            "A dynamic network with real-valued fractional flow rates uses standard `cap > 0` checks without floating-point thresholding.",
          failureMode:
            "Subnormal floating-point residues ($10^{-16}$) generate millions of useless augmenting paths, causing infinite execution loops.",
        },
        {
          title: "Dinic Current-Arc Pointer Corruption on Missing Phase Reset",
          scenario:
            "A Dinic solver fails to reset `ptr.set(head)` at the beginning of a new BFS phase.",
          failureMode:
            "DFS immediately skips valid newly opened edges, terminating with a suboptimal flow that violates max-flow optimality.",
        },
      ],
    },
  ],
};
