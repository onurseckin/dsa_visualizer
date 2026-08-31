import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_dp_2d_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_dp_2d",
      title: "2D Dynamic Programming Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Minimum Cost to Merge Stones (K-Stones Interval DP)",
          problemId: "minimum-cost-to-merge-stones",
          difficulty: "Hard",
          description:
            "Given $N$ piles of stones, merge exactly $K$ consecutive piles into one pile in each move with cost equal to the sum of stones merged. Find the minimum total cost to reduce the array to 1 pile (or return -1 if impossible) in $O(N^3 / K)$ time.",
          rationale:
            "Tests modular arithmetic feasibility checks combined with 3D interval state compression $DP[i][j][m]$.",
        },
        {
          title: "Shortest Superstring & Tour Reconstruction (Bitmask DP)",
          problemId: "find-shortest-superstring",
          difficulty: "Hard",
          description:
            "Given an array of strings, find the shortest string that contains each string in the array as a substring. Formulate as Asymmetric TSP on string overlap lengths and reconstruct the complete string in $O(N^2 2^N)$ time.",
          rationale:
            "Evaluates bitmask state transition graph creation and predecessor pointer back-tracing.",
        },
        {
          title: "Digit DP: Count Palindromic Integers in Range [L, R]",
          problemId: "digit-dp-palindromic-integers",
          difficulty: "Hard",
          description:
            "Count how many integers $X \\in [L, R]$ have digits that form a palindrome and whose digit sum is divisible by $K$, where $1 \\le L \\le R \\le 10^{18}$. Must execute in $O(\\log_{10}(R) \\times K)$ time.",
          rationale:
            "Tests prefix digit boundary propagation with multi-attribute constraint verification.",
        },
        {
          title: "Convex Hull Trick: Machine Batch Scheduling",
          problemId: "convex-hull-batch-scheduling",
          difficulty: "Expert",
          description:
            "Given $N$ jobs with processing times and cost coefficients, partition jobs into contiguous batches where starting a batch incur startup penalty $S$. Solve in $O(N)$ time using dynamic lower envelope line maintenance.",
          rationale:
            "Demonstrates practical mastery of linear slope relaxation eliminating quadratic DP loops.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Divide and Conquer Optimization Runtime Derivation",
          statement:
            "Prove that for the recurrence $DP[i][j] = \\min_{k < j} \\{ DP[i-1][k] + w(k, j) \\}$, if $opt[i][j] \\le opt[i][j+1]$, evaluating the state table using Divide and Conquer DP runs in $O(K \\cdot N \\log N)$ time.",
          proofOutline:
            "At each tier of DP row $i$, compute $mid = (L + R) / 2$ and search for $opt[i][mid]$ strictly within $[optL, optR]$. Divide into subproblems $[L, mid-1]$ with range $[optL, opt[i][mid]]$ and $[mid+1, R]$ with range $[opt[i][mid], optR]$. By Master Theorem / recurrence tree analysis, each level of recursion does $\\sum (optR - optL + 1) = O(N)$ total work across $\\log N$ depth, yielding $O(N \\log N)$ per row.",
          engineeringContext:
            "Foundational for optimal $K$-means 1D data binning, video bitrate chunk partitioning, and database histogram buckets.",
        },
        {
          title: "Aliens Trick (Lagrangian Relaxation) Convexity Theorem",
          statement:
            "Prove that if the function $f(k)$ representing the optimal value with exactly $k$ choices is strictly convex, then for any target $k^*$, there exists a penalty $\\lambda$ such that the unconstrained optimum $\\min_k \\{ f(k) - \\lambda k \\}$ is attained at $k = k^*$.",
          proofOutline:
            "By convexity of $f(k)$, the discrete derivative $\\Delta f(k) = f(k+1) - f(k)$ is non-decreasing. Setting $\\lambda = \\Delta f(k^*-1)$ ensures that the supporting hyperplane (tangent line) with slope $\\lambda$ touches the lower convex hull of $f$ exactly at $k^*$.",
          engineeringContext:
            "Enables real-time resource allocation under hard cardinality constraints in cloud server placement.",
        },
        {
          title: "Subproblem DAG Topological Invariant in High Dimensions",
          statement:
            "Prove that in any $D$-dimensional Dynamic Programming table, every valid topological ordering corresponds to a linear extension of the partial order defined by coordinate component-wise dominance: $\\vec{u} \\prec \\vec{v} \\iff u_d \\le v_d \\; \\forall d$ and $\\vec{u} \\neq \\vec{v}$.",
          proofOutline:
            "Every state transition draws values only from $\\vec{u} \\prec \\vec{v}$. Because component-wise dominance is a strict poset (reflexive, antisymmetric, transitive), the subproblem dependency graph is strictly acyclic. By Szpilrajn's extension theorem, every poset has a linear extension, which guarantees existence of a valid nested loop order.",
          engineeringContext:
            "Used by optimizing compilers (e.g. LLVM polyhedral loop transformations) to vectorize and tile multi-nested DP loops.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Row-Major Cache Locality vs Matrix Transposition",
          prompt:
            "When computing 2D Longest Common Subsequence between strings of length $10^5$ with limited memory, why does transposing the inner loop order or caching adjacent cells into SIMD registers reduce memory bus traffic by over $80\\%$?",
          engineeringContext:
            "Row-major memory traversal loads 8 64-bit values per cache line. Column-major strides waste 7 out of 8 fetched words, saturating memory controller bandwidth on multi-core servers.",
        },
        {
          title: "State Space Packing: Encoding 4-Tuple DP States into 64-Bit Integers",
          prompt:
            "In high-scale Digit and Bitmask DP, how does bitwise packing of $(pos, tight, mask, rem)$ into a single `uint64_t` hash key eliminate object pointer overhead and maximize hash table bucket density?",
          engineeringContext:
            "Node objects in V8/JVM incur 16-24 bytes of object header overhead and garbage collector tracking. Packed 64-bit integers fit into hardware registers, enabling zero-allocation memoization.",
        },
        {
          title: "Branchless State Transitions via Conditional Move (`cmov`)",
          prompt:
            "Analyze how replacing `if (candidate < dp[i][j]) dp[i][j] = candidate` with branchless intrinsics or ternary operators prevents branch misprediction pipeline flushes in tight interval DP inner loops.",
          engineeringContext:
            "A branch misprediction costs 15-20 CPU cycles. In an $O(N^3)$ loop with $10^8$ iterations, eliminating branches via `cmov` instructions can double execution throughput.",
        },
      ],
      partD_stressTests: [
        {
          title: "Bitmask Out-of-Memory Crash on $N=24$",
          scenario:
            "A developer runs a bitmask DP solver on an array of size $N=24$ with 64-bit float states.",
          failureMode:
            "$2^{24} \\times 24 \\times 8 \\text{ bytes} \\approx 3.22 \\text{ GB}$. Allocating this contiguous buffer exceeds the default node.js heap memory limit (1.4 GB), triggering fatal heap OOM crash.",
        },
        {
          title: "Call-Stack Overflow on Deep Recursive Interval DP",
          scenario:
            "A recursive memoized implementation of Matrix Chain Multiplication is executed on $N = 10,000$ matrices without tail-call optimization.",
          failureMode:
            "Recursion depth reaches $10,000$, exceeding the default V8 call-stack limit (10,000 frames) and throwing `RangeError: Maximum call stack size exceeded`.",
        },
        {
          title: "Precision Loss in Log-Probability Hidden Markov DP",
          scenario:
            "Calculating probabilities of long sequences of length $10^5$ by multiplying raw probabilities $P \\in [0, 1]$ directly in float64.",
          failureMode:
            "Values underflow below $10^{-308}$, becoming exact zero ($0.0$) and corrupting Viterbi optimal path back-tracking.",
        },
      ],
    },
  ],
};
