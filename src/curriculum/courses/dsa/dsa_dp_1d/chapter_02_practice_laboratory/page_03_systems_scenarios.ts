import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_dp_1d_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_dp_1d",
      title: "1D Dynamic Programming Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Longest Increasing Subsequence",
          problemId: "longest-increasing-subsequence",
          difficulty: "Medium",
          description:
            "Given an integer array nums, return the length of the longest strictly increasing subsequence in $O(N \\log N)$ time and $O(N)$ space using Patience Sorting tails array.",
          rationale: "Tests binary search optimization of dynamic programming transitions.",
        },
        {
          title: "Coin Change II (Combinations)",
          problemId: "coin-change-ii-combinations",
          difficulty: "Medium",
          description:
            "You are given an integer array coins representing coins of different denominations and an integer amount. Return the number of combinations that make up that amount in $O(N \\cdot W)$ time and $O(W)$ space.",
          rationale: "Tests outer-coin loop placement to prevent duplicate permutation counting.",
        },
        {
          title: "House Robber II (Circular Topology)",
          problemId: "house-robber-ii-circular",
          difficulty: "Medium",
          description:
            "All houses at this place are arranged in a circle. Determine the maximum amount of money you can rob tonight without alerting the police in $O(N)$ time and $O(1)$ space by splitting into two linear subproblems: $[0, n-2]$ and $[1, n-1]$.",
          rationale:
            "Evaluates circular state boundary partitioning into independent linear DP passes.",
        },
        {
          title: "Word Break",
          problemId: "word-break-dp",
          difficulty: "Medium",
          description:
            "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words. Solve in $O(N^2)$ time and $O(N)$ space.",
          rationale: "Tests boolean prefix reachability DP and substring hashing.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Companion Matrix Recurrence Invariant for $N$-th Tribonacci",
          statement:
            "Prove that the $3 \\times 3$ companion matrix $M = \\begin{pmatrix} 1 & 1 & 1 \\\\ 1 & 0 & 0 \\\\ 0 & 1 & 0 \\end{pmatrix}$ satisfies $M^n \\begin{pmatrix} T_2 \\\\ T_1 \\\\ T_0 \\end{pmatrix} = \\begin{pmatrix} T_{n+2} \\\\ T_{n+1} \\\\ T_n \\end{pmatrix}$, computing $T_n$ in $O(\\log N)$ operations.",
          proofOutline:
            "By definition of Tribonacci $T_{n+3} = T_{n+2} + T_{n+1} + T_n$. Matrix multiplication gives $M \\begin{pmatrix} T_{k+2} \\\\ T_{k+1} \\\\ T_k \\end{pmatrix} = \\begin{pmatrix} T_{k+2} + T_{k+1} + T_k \\\\ T_{k+2} \\\\ T_{k+1} \\end{pmatrix} = \\begin{pmatrix} T_{k+3} \\\\ T_{k+2} \\\\ T_{k+1} \\end{pmatrix}$. Inductively applying $M$ for $n$ steps yields $M^n \\vec{v}_0 = \\vec{v}_n$. Repeated squaring computes $M^n$ in $\\lceil \\log_2 n \\rceil$ matrix multiplications, each taking $3^3 = 27$ scalar operations.",
          engineeringContext:
            "Core method for computing linear dynamical system states and Markov transition powers.",
        },
        {
          title: "0/1 Knapsack Backward Induction Invariant",
          statement:
            "Prove that in the 1D space-optimized 0/1 Knapsack, iterating backwards over capacity $w$ from $W$ down to $w_i$ ensures that $\\text{DP}[w]$ depends exclusively on states computed in the previous item's pass.",
          proofOutline:
            "When updating $\\text{DP}[w]$ using $\\text{DP}[w - w_i]$, the value $\\text{DP}[w - w_i]$ has not yet been overwritten in the current item's loop because $w - w_i < w$. Thus, $\\text{DP}[w - w_i]$ strictly reflects the optimal value considering only the first $i-1$ items, ensuring item $i$ is included at most once.",
          engineeringContext:
            "Compresses $O(N \\cdot W)$ 2D dynamic programming matrices into compact 1D cache-friendly arrays.",
        },
        {
          title: "Space Complexity Reduction via State Lookback Bounding",
          statement:
            "Prove that if a DP state transition satisfies $\\text{DP}[i] = f(\\text{DP}[i-1], \\text{DP}[i-2], \\dots, \\text{DP}[i-k])$, the auxiliary memory requirement can be reduced from $O(N)$ to $O(k)$ using a rolling array buffer.",
          proofOutline:
            "At any step $i$, states $\\text{DP}[j]$ for $j < i - k$ are never referenced again. Storing elements in a circular buffer of size $k$ indexed by $i \\bmod k$ satisfies all transition dependencies while bounding memory to $\\Theta(k)$.",
          engineeringContext:
            "Allows processing unbounded telemetry data streams in constant embedded memory.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Zero-Memory Register Allocation in Kadane's Algorithm",
          prompt:
            "Why does the compiler allocate Kadane's algorithm variables directly to CPU registers (`RAX`, `RDX`), and how does this achieve single-cycle throughput?",
          engineeringContext:
            "Kadane's algorithm requires only two scalar accumulation variables. The compiler keeps both in hardware registers throughout the entire loop, eliminating DRAM read/write instructions and auto-vectorizing across SIMD units.",
        },
        {
          title: "Branchless Conditional Moves (`cmovg`) in DP Transitions",
          prompt:
            "How does replacing `if (dp[i-1] > 0)` with branchless conditional moves (`cmovg`) eliminate branch misprediction pipeline flushes?",
          engineeringContext:
            "Conditional branches on alternating positive/negative data fail branch prediction on 50% of iterations (15-20 cycle penalty). `cmovg` evaluates the condition as a single ALU cycle operation without branching.",
        },
        {
          title: "Matrix Multiplication Cache Line Transposition",
          prompt:
            "Why does transposing matrix $B$ before computing $A \\times B$ accelerate matrix exponentiation by $8\\times$ in linear recurrences?",
          engineeringContext:
            "Multiplying row $A[i]$ by column $B[:, j]$ reads $B$ with a column stride of $K \\times 4$ bytes, triggering a cache miss on every element. Transposing $B$ converts column reads into contiguous row reads along 64-byte L1 cache lines.",
        },
      ],
      partD_stressTests: [
        {
          title: "0/1 Knapsack Forward Loop Item Duplication Bug",
          scenario:
            "Iterating forward `for (let w = weight; w <= capacity; w++)` in 0/1 knapsack on item with weight 3 and value 10.",
          failureMode:
            "The same item is added repeatedly at capacity 3, 6, 9, 12, converting the problem into Unbounded Knapsack and producing corrupted values.",
        },
        {
          title: "Kadane All-Negative Array Zero Return Fallacy",
          scenario: "Running Kadane's algorithm with `maxSum = 0` on array `[-5, -8, -3, -10]`.",
          failureMode:
            "The algorithm returns 0 instead of the true maximum single-element subarray sum `-3`.",
        },
        {
          title: "IEEE 754 Floating-Point DP Combination Precision Loss",
          scenario:
            "Computing combination counts for $N = 100$ using standard JavaScript 64-bit float numbers without `BigInt`.",
          failureMode:
            "Values exceed $2^{53} - 1$ ($9 \\times 10^{15}$), silently losing lower-order bits and producing incorrect modulo remainders.",
        },
      ],
    },
  ],
};
