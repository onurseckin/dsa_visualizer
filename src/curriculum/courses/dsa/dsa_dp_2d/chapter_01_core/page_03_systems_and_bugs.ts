import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_dp_2d_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Memory Strides, Cache Lines & The 32KB L1 Boundary",
      content:
        "The physical layout of multi-dimensional state spaces in RAM dictates practical execution speed:\n\n1. **Row-Major vs Column-Major Striding:** In row-major layouts (C/C++, JavaScript TypedArrays), cell $(i, j)$ is adjacent to $(i, j+1)$ at byte offset $(i \\times N + j) \\times 8$. Iterating row-first traverses contiguous cache lines. Conversely, iterating column-first (`for j: for i: dp[i][j]`) creates a stride of $N \\times 8$ bytes, thrashing the 64-byte L1 cache line on every single access and degrading performance by up to $12\\times$.\n2. **The 32KB L1 Data Cache Residency:** A 2D table of size $1000 \\times 1000$ doubles consumes $8$ MB of RAM, spilling completely out of L1 (32KB) and L2 (512KB) caches into slow L3/DRAM. By compressing the state space using rolling arrays (`curr` and `prev` rows), the memory footprint shrinks from $8$ MB to $16$ KB, keeping the entire working set pinned inside ultra-fast 1-cycle L1 cache.\n3. **Submask Iteration Bitwise Branch Elimination:** Enumerating submasks via `sub = (sub - 1) & mask` compiles to a single `sub` and `and` CPU instruction, running directly inside hardware registers without conditional branch mispredictions.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Topological Hazards & State Invalidation",
      content:
        "1. **Interval DP Loop Order Inversion:** Iterating `for i in 0..N: for j in i..N:` violates topological DAG dependencies. Subproblems $DP[i][k]$ and $DP[k+1][j]$ will be uninitialized garbage. Interval DP *must* be structured with outer loop `for len in 2..N:` or reverse $i$ loop `for i in N-1 down to 0: for j in i+1 to N-1:`.\n2. **Bitwise Operator Precedence Pitfall:** In C/C++ and JavaScript, addition `+` and comparison `==` have higher precedence than bitwise shifts `<<` and bitwise AND `&`. Writing `if (mask & 1 << u != 0)` parses as `mask & (1 << (u != 0))`. Always explicitly parenthesize bitwise expressions: `if ((mask & (1 << u)) !== 0)`.\n3. **Digit DP Leading Zero Ghost Counts:** Failing to track `leadingZero` as a boolean state flag causes prefix `0` to be treated as digit zero, falsifying digit sum parity, GCD properties, and palindrome symmetry.\n4. **Memory Allocation Limit for Bitmasks:** $2^N$ states for $N=24$ is $16,777,216$ elements. Storing an array of size $2^{24} \\times 24$ floats requires $>3.2$ GB of RAM, causing immediate Out-of-Memory (OOM) termination. Bitmask DP is strictly applicable only for $N \\le 22$.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Advanced DP Speedups: Convex Hull Trick & WQS / Aliens Optimization",
      content:
        "When standard 2D state spaces exceed time/space budgets, advanced acceleration theorems reduce polynomial degrees:\n- **Convex Hull Trick (CHT):** Optimizes recurrences $DP[i] = \\min_{j < i} \\{ DP[j] + m_j x_i + c_j \\}$. By maintaining the lower convex envelope of lines $y = m_j x + c_j$ using a monotonic deque or Li Chao Segment Tree, each state transition evaluates in $O(\\log N)$ or $O(1)$ amortized time, reducing overall runtime from $O(N^2)$ to $O(N \\log N)$ or $O(N)$.\n- **Aliens Trick / WQS Binary Search:** When finding optimal cost with *exactly* $K$ operations (normally requiring 2D state $DP[i][k]$ taking $O(K \\cdot N^2)$ time), if the optimal cost is convex with respect to $k$, introducing a Lagrange multiplier penalty $\\lambda$ converts the problem to an unconstrained 1D DP $DP[i]$ with binary search on $\\lambda$, achieving $O(N \\log(\\text{MaxCost}))$ runtime.",
    },
    {
      type: "prose",
      title: "DP Acceleration Paradigm Comparison Matrix",
      content: `
| Optimization Technique | Applicable Recurrence Pattern | Condition Required | Baseline Complexity | Accelerated Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Rolling 1D Array** | $DP[i][j] = f(DP[i-1][j], DP[i][j-1])$ | Markovian 1-step dependency | $O(M \\times N)$ space | $O(\\min(M, N))$ space |
| **Knuth Optimization** | $DP[i][j] = \\min_k (DP[i][k] + DP[k+1][j]) + w$ | Quadrangle Inequality on $w$ | $O(N^3)$ time | $O(N^2)$ time |
| **Divide and Conquer DP** | $DP[i][j] = \\min_k (DP[i-1][k] + w(k, j))$ | Monotonicity: $opt[i][j] \\le opt[i][j+1]$ | $O(K \\cdot N^2)$ time | $O(K \\cdot N \\log N)$ time |
| **Convex Hull Trick** | $DP[i] = \\min_j (DP[j] + m_j x_i + c_j)$ | Linear slope-intercept form | $O(N^2)$ time | $O(N \\log N)$ or $O(N)$ |
| **Aliens / WQS Binary Search** | $\\min \\text{cost}$ subject to exactly $K$ partitions | Convexity / Concavity in $K$ | $O(K \\cdot N^2)$ time | $O(N \\log(\\text{Range}))$ |
      `,
    },
  ],
};
