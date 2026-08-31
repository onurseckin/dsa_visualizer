import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_advanced_range_queries_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_advanced_range_queries",
      title: "Advanced Range Queries Rigorous Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Range Sum Query 2D Mutable",
          problemId: "range-sum-query-2d-mutable",
          difficulty: "Hard",
          description:
            "Design a 2D Binary Indexed Tree (or 2D Segment Tree) supporting 2D point updates `update(row, col, val)` and 2D subgrid sum queries `sumRegion(row1, col1, row2, col2)` in $O(\\log R \\cdot \\log C)$ time with $O(R \\cdot C)$ memory.",
          rationale:
            "Evaluates multi-dimensional dyadic tree nesting and 2D inclusion-exclusion prefix sum properties.",
        },
        {
          title: "Segment Tree Beats: Range Chmin/Chmax & Range Sum",
          problemId: "segment-tree-beats",
          difficulty: "Expert",
          description:
            "Implement a Segment Tree maintaining the maximum element, second maximum element, count of maximums, and sum across $[L, R]$. Support range operation $A[i] \\leftarrow \\min(A[i], v)$ and range sum query in amortized $O((N + Q) \\log N)$ time.",
          rationale:
            "Demonstrates mastery of condition-breaking amortized segment tree tag recursion (Ji Driver Segment Tree Beats).",
        },
        {
          title: "Count of Smaller Numbers After Self (Inversion Index)",
          problemId: "count-of-smaller-numbers-after-self",
          difficulty: "Hard",
          description:
            "Given an integer array `nums`, return an array `counts` where `counts[i]` is the number of smaller elements to the right of `nums[i]`. Must run in $O(N \\log N)$ time using coordinate compression and a Fenwick Tree.",
          rationale:
            "Tests coordinate compression mapping followed by dynamic cumulative frequency scanning.",
        },
        {
          title: "Implicit Treap: Dynamic Sequence Reversals",
          problemId: "implicit-treap-reversals",
          difficulty: "Hard",
          description:
            "Implement an implicit Cartesian Tree (Treap) that supports dynamic range reversals `reverse(L, R)` and element lookups by current index `get(index)` in $O(\\log N)$ expected time using lazy swap propagation on sub-tree pointers.",
          rationale:
            "Tests randomized heap priority invariants combined with deferred subtree swapping.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Amortized Analysis of Segment Tree Lazy Tag Clears",
          statement:
            "Prove that the total amortized cost of clearing and propagating lazy tags in a segment tree across $M$ range updates on an array of size $N$ is strictly bounded by $O(M \\log N)$.",
          proofOutline:
            "Define a potential function $\\Phi(T) = \\sum_{v \\in T} c_v$ where $c_v$ is the number of active lazy tags in the subtree of $v$. Show that every pushDown operation decreases the potential of the parent while increasing children by at most a constant, bounding total amortized work to $O(\\log N)$ per operation.",
          engineeringContext:
            "Critical for guaranteeing real-time bounds in game physics engines and financial order-book ladder indexing.",
        },
        {
          title: "Treap Expected Depth via Harmonic Analysis",
          statement:
            "Prove that for any sequence of $N$ elements inserted into a randomized Treap with independent uniform priorities, the expected depth of any element is $2 H_N - O(1) \\le 2 \\ln N + 2$.",
          proofOutline:
            "Let $I_{i,j}$ be the indicator variable that node $j$ is an ancestor of node $i$. By the Cartesian property, $j$ is an ancestor of $i$ iff $j$ has the minimum priority among all elements in the interval between $i$ and $j$. The probability is $1 / (|i - j| + 1)$. Summing over all $j \\neq i$ yields the harmonic sum $H_{i} + H_{N-i+1} \\le 2 \\ln N$.",
          engineeringContext:
            "Guarantees that without explicit rebalancing rotations like AVL or Red-Black trees, randomization provides optimal logarithmic search latency.",
        },
        {
          title: "Sparse Table 2D Extension RMQ Complexity",
          statement:
            "Prove that a 2D Sparse Table for submatrix minimum queries on an $N \\times M$ grid requires $O(N M \\log N \\log M)$ precomputation space and answers any submatrix minimum in exactly 4 table lookups ($O(1)$ time).",
          proofOutline:
            "Construct 4D table $\\text{ST}[k_r][k_c][r][c]$ covering subgrids of size $2^{k_r} \\times 2^{k_c}$. Any query $[r_1, r_2] \\times [c_1, c_2]$ is covered by the union of four overlapping $2^{k_r} \\times 2^{k_c}$ subgrids at the four corners.",
          engineeringContext:
            "Used in image processing for real-time bounding box depth filters and geospatial terrain elevation maps.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Cache Line Alignment & Struct-of-Arrays (SoA) vs Array-of-Structs (AoS)",
          prompt:
            "In high-frequency trading (HFT) order-matching, why does storing segment tree nodes as separate parallel typed arrays (`Float64Array` for sums, `Float64Array` for tags) outperform an array of node objects (`Array<{ sum: number, lazy: number }>` by over $400\\%$?",
          engineeringContext:
            "Object arrays introduce pointer indirection and GC overhead. Flat parallel typed arrays ensure SIMD lane vectorization and maximum cache-line packing without memory padding.",
        },
        {
          title: "Branch Misprediction Penalties during Recursive Segment Tree Queries",
          prompt:
            "How does standard recursive tree bisection (`if (ql <= mid) ...; if (qr > mid) ...`) trigger branch mispredictions on random query distributions, and how can iterative bottom-up segment trees (Z-Tree / Fenwick) eliminate branch mispredicts?",
          engineeringContext:
            "Iterative bottom-up trees traverse fixed bitwise paths (`l >>= 1; r >>= 1`) with loop counters known at compile time, eliminating data-dependent branch hazards in pipeline execution units.",
        },
        {
          title: "Hardware Count-Leading-Zeros (CLZ) in Real-Time Sparse Table RMQ",
          prompt:
            "Analyze how the single-instruction intrinsic `__builtin_clz` (or `BSR` on x86, `CLZ` on ARM) computes $\\lfloor \\log_2(R - L + 1) \\rfloor$ in 1 CPU clock cycle versus floating-point `Math.log2()`, which consumes $>20$ cycles.",
          engineeringContext:
            "In latency-critical game engines and physical ray-tracers, replacing floating-point logarithms with integer bit manipulation reduces query latency from nanoseconds to picoseconds.",
        },
      ],
      partD_stressTests: [
        {
          title: "Catastrophic Cancellation in 64-Bit Floating-Point Range Sums",
          scenario:
            "An array with values $10^{16}$, $-10^{16}$, and $1$ is queried repeatedly using a standard Float64 Segment tree without Kahan summation.",
          failureMode:
            "Double precision floating-point numbers have 53 bits of mantissa. Adding $1$ to $10^{16}$ loses the unit bit, producing false $0$ query results.",
        },
        {
          title: "Buffer Overflow on Segment Tree Non-Power-of-Two Sizing",
          scenario:
            "Allocating $2N$ array slots for a Segment Tree when $N = 65,537$ ($2^{16} + 1$).",
          failureMode:
            "Tree height becomes 17, and leaf nodes reach index $2^{17} - 1 = 131,071 > 2N = 131,074$. Traversal attempts to read index $262,143$, causing out-of-bounds segfault.",
        },
        {
          title: "Degenerate Cartesian Tree Stack Overflow on Monotonic Priority Collision",
          scenario:
            "A deterministic pseudo-random generator with low entropy seeds generates identical priorities for all elements inserted into a Treap.",
          failureMode:
            "The Treap degenerates into a linear linked list of depth $N = 10^5$, causing call-stack exhaustion on recursive split/merge.",
        },
      ],
    },
  ],
};
