import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_dp_1d_c1_p1",
  pageNumber: 1,
  title: "Optimal Substructure, Bellman Recurrences & Matrix Exponentiation",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Exponential Tree Explosion & State Space Memoization",
      content:
        "Naive recursive formulations of sequential optimization problems (e.g. Fibonacci, Coin Change, Longest Increasing Subsequence) branch exponentially, evaluating the exact same subproblem instances $\\Theta(2^N)$ times. **Dynamic Programming (Bellman 1957)** collapses this exponential recursion DAG into a linear topological order of states: by caching solutions to overlapping subproblems and enforcing **Optimal Substructure**, DP computes optimal answers in polynomial (often $O(N)$ or $O(N \\log N)$) time and $O(1)$ auxiliary space via rolling state arrays.",
    },
    {
      type: "prose",
      title: "Taxonomy of 1D Dynamic Programming Archetypes",
      content:
        "1D dynamic programming patterns are defined by state semantics and transition topology:\n\n1. **Prefix / Suffix State DP (Single Element Lookback):**\n   - **House Robber / Fibonacci:** $\\text{DP}[i] = \\max(\\text{DP}[i-1], \\text{DP}[i-2] + \\text{val}[i])$. Depends only on the previous 2 states, reducing memory from $O(N)$ to $O(1)$ space.\n   - **Kadane's Algorithm (Max Subarray Sum):** $\\text{DP}[i] = \\max(A[i], \\text{DP}[i-1] + A[i])$. Computes the maximum contiguous sum ending at index $i$ in strictly $O(N)$ time and $O(1)$ space.\n\n2. **Decision-Over-All-Predecessors DP ($O(N^2) \\to O(N \\log N)$):**\n   - **Longest Increasing Subsequence (LIS):** Naive recurrence $\\text{DP}[i] = 1 + \\max_{j < i, A[j] < A[i]} \\text{DP}[j]$ runs in $\\Theta(N^2)$.\n   - **Patience Sorting (Greedy Tails Array):** Maintaining array $\\text{tails}[k]$ (the minimum tail value of all increasing subsequences of length $k$) enforces a strictly monotonic increasing invariant on $\\text{tails}$. Binary searching (`lower_bound`) the insertion point for each incoming element reduces LIS to strictly $O(N \\log N)$ time.\n\n3. **Unbounded vs 0/1 Knapsack (Subsets & Coin Change):**\n   - **0/1 Knapsack (Each item used at most once):** Iterate backwards over capacity ($W \\dots w_i$) to prevent using the same item multiple times within the same transition pass: $\\text{DP}[w] = \\max(\\text{DP}[w], \\text{DP}[w - w_i] + v_i)$.\n   - **Unbounded Knapsack (Infinite item supply):** Iterate forward over capacity ($w_i \\dots W$) to allow cumulative reuse.\n\n4. **Linear Recurrences & Matrix Exponentiation:**\n   - For any linear recurrence $f(n) = c_1 f(n-1) + c_2 f(n-2) + \\dots + c_k f(n-k)$, the state transition is expressed as matrix multiplication $\\vec{v}_n = M \\cdot \\vec{v}_{n-1}$.\n   - Applying **Binary Exponentiation** to compute $M^N$ reduces computation of the $N$-th term from $O(N)$ to $O(K^3 \\log N)$ time, computing Fibonacci numbers for $N = 10^{18}$ in $< 50$ nanoseconds.",
    },
    {
      type: "mental_model",
      title: "LIS Patience Sorting & Matrix Exponentiation Invariants",
      visualIntuition: `
=== LIS PATIENCE SORTING (GREEDY TAILS ARRAY) ===
Input Sequence: [ 10, 9, 2, 5, 3, 7, 101, 18 ]

Scan 10:  tails = [ 10 ]
Scan 9:   9 < 10 -> Replace 10. tails = [ 9 ]
Scan 2:   2 < 9  -> Replace 9.  tails = [ 2 ]
Scan 5:   5 > 2  -> Append!     tails = [ 2, 5 ]
Scan 3:   3 in [2, 5] -> Replace 5. tails = [ 2, 3 ]
Scan 7:   7 > 3  -> Append!     tails = [ 2, 3, 7 ]
Scan 101: 101 > 7 -> Append!    tails = [ 2, 3, 7, 101 ]
Scan 18:  18 in [7, 101] -> Replace 101. tails = [ 2, 3, 7, 18 ]

Result: Length of LIS = len(tails) = 4! (Subsequence: [2, 3, 7, 18])

=== MATRIX EXPONENTIATION (FIBONACCI TRANSITION) ===
[ F(n+1) ]   [ 1  1 ]   [ F(n)   ]             [ 1  1 ]^n   [ F(1) ]
[ F(n)   ] = [ 1  0 ] * [ F(n-1) ]  ===> M^n = [ 1  0 ]   * [ F(0) ]

Computed in O(log N) matrix multiplications via repeated squaring!
      `,
      invariant:
        "DP & Monotonicity Invariants:\n1. Kadane's Invariant: $\\text{maxEndingHere}[i] = \\max(A[i], \\text{maxEndingHere}[i-1] + A[i])$ is the exact maximal contiguous subarray sum ending at index $i$.\n2. LIS Tails Monotonicity: For all $k$, $\\text{tails}[k]$ is strictly increasing: $\\text{tails}[0] < \\text{tails}[1] < \\dots < \\text{tails}[L-1]$, guaranteeing $O(\\log N)$ binary search insertion.",
      stateTransitions:
        "Kadane: `curr = max(x, curr + x); maxSoFar = max(maxSoFar, curr);`\nPatience LIS: For each $x$: `idx = lower_bound(tails, x)`; if `idx === tails.length` push $x$; else `tails[idx] = x`.\nMatrix Exponentiation: $M^{2k} = (M^k)^2, M^{2k+1} = M \\cdot (M^k)^2$.",
      naiveBottleneck:
        "Naive recursive tree evaluation takes $\\Theta(2^N)$ time. Standard LIS quadratic table checking takes $\\Theta(N^2)$ time.",
      optimalInsight:
        "Patience sorting turns LIS into logarithmic monotonic array bisections, while matrix exponentiation solves linear recurrences in $O(K^3 \\log N)$ time.",
    },
  ],
};
