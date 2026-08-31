import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_dp_2d_c1_p1",
  pageNumber: 1,
  title: "Multi-Dimensional State Spaces, Subproblem DAGs & Optimization",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Multi-Parameter Combinatorial Explosion",
      content:
        "When optimization depends on two or more interacting discrete dimensions—such as prefixes of two strings $(i, j)$, endpoints of a subsegment $[L, R]$, an unvisited subset of vertices alongside the current terminal node $(mask, u)$, or digit positions constrained by numeric prefixes $(pos, tight)$—simple 1D dynamic programming fails to capture the state. 2D Dynamic Programming constructs a Directed Acyclic Graph (DAG) over multi-dimensional state tuples, replacing brute-force combinatorial search with topological relaxation across structured subproblems.",
    },
    {
      type: "prose",
      title: "Taxonomy of 2D Dynamic Programming Paradigms",
      content:
        "Multi-dimensional DP is categorized by the topology of its subproblem dependency graph:\n\n1. **Prefix-Prefix / Grid DP (Grid Walks, LCS, Edit Distance):**\n   - **State:** $DP[i][j]$ represents optimal score for prefix $A[0 \\dots i-1]$ and prefix $B[0 \\dots j-1]$.\n   - **Dependency:** Local transitions from $(i-1, j)$, $(i, j-1)$, and $(i-1, j-1)$.\n   - **Space Reduction:** Rolling array reduces auxiliary memory from $O(M \\times N)$ to $O(\\min(M, N))$.\n\n2. **Interval DP (Matrix Chain Multiplication, Burst Balloons, Optimal BST):**\n   - **State:** $DP[i][j]$ represents optimal cost over the contiguous subsegment $[i, j]$.\n   - **Order of Evaluation:** Evaluated in order of increasing interval length $len = 1, 2, \\dots, N$.\n   - **Transition:** $DP[i][j] = \\min_{i \\le k < j} \\{ DP[i][k] + DP[k+1][j] + \\text{cost}(i, k, j) \\}$. Baseline $O(N^3)$ complexity.\n\n3. **Bitmask DP (Traveling Salesperson, Assignment, Hamiltonian Paths):**\n   - **State:** $DP[mask][u]$ represents optimal metric over subset of visited vertices $mask \\in [0, 2^N-1]$ ending at vertex $u$.\n   - **Submask Enumeration:** Enumerating all valid submasks of all masks runs in $\\sum_{k=0}^N \\binom{N}{k} 2^k = (1 + 2)^N = 3^N$ operations rather than $4^N$.\n\n4. **Digit DP (Prefix-Constrained Integer Property Counting):**\n   - **State:** $DP[pos][tight][leadingZero][sum/rem]$ counts integers in $[0, N]$ satisfying digit constraints in $O(\\text{numDigits} \\times \\text{stateSize})$ time.\n\n5. **Speedup Optimizations (Knuth Optimization & Convex Hull Trick):**\n   - **Knuth Optimization:** Quadrangle inequality on interval costs bounds optimal split points to $opt[i][j-1] \\le opt[i][j] \\le opt[i+1][j]$, accelerating interval DP from $O(N^3)$ to $O(N^2)$.\n   - **Convex Hull Trick (CHT):** Maintains upper/lower envelope of linear transitions $y = m_j x + c_j$, accelerating 1D/2D DP from $O(N^2)$ to $O(N \\log N)$ or $O(N)$.",
    },
    {
      type: "mental_model",
      title: "Interval DAG & Bitmask Subproblem Topological Ordering",
      visualIntuition: `
=== INTERVAL DP MATRIX EVALUATION (BY LENGTH) ===
Length 1 (Diagonals):  [0,0], [1,1], [2,2], [3,3]  (Base cases)
Length 2:              [0,1], [1,2], [2,3]
Length 3:              [0,2], [1,3]
Length 4 (Final Ans):  [0,3]

   j ->  0       1       2       3
i \\
0      [base]  [len 2] [len 3] [len 4] <- TARGET DP[0][N-1]
1        -     [base]  [len 2] [len 3]
2        -       -     [base]  [len 2]
3        -       -       -     [base]

=== BITMASK STATE LATTICE (TSP on 4 Vertices) ===
Level 1 (1 bit set):   {0}
Level 2 (2 bits set):  {0,1}, {0,2}, {0,3}
Level 3 (3 bits set):  {0,1,2}, {0,1,3}, {0,2,3}
Level 4 (4 bits set):  {0,1,2,3} (All visited)
Transitions flow strictly upwards through Hamming weight levels!
      `,
      invariant:
        "Subproblem Topological Ordering Invariant: Every subproblem $DP[S]$ must be evaluated only after all constituent subproblems in its dependency set $\\text{Pred}(S)$ have reached their globally optimal value.",
      stateTransitions:
        "Interval DP: $DP[i][j] = \\min_{i \\le k < j} \\{ DP[i][k] + DP[k+1][j] + w(i, j) \\}$.\nBitmask TSP: $DP[mask \\cup \\{v\\}][v] = \\min_{u \\in mask} \\{ DP[mask][u] + \\text{dist}(u, v) \\}$.\nDigit DP: $DP[p][tight] = \\sum_{d=0}^{\\text{limit}} DP[p+1][tight \\land (d == \\text{limit})]$.",
      naiveBottleneck:
        "Naive recursive exploration without memoization re-computes overlapping combinatorial subtrees exponentially ($O(2^N)$ for grid/bitmask, $O(N!)$ for TSP, $O(4^N)$ for interval partitioning).",
      optimalInsight:
        "By identifying equivalence classes of subproblems and ordering table evaluation along topological DAG dependencies (by string length, interval width, or mask Hamming weight), redundant computation is completely eliminated.",
    },
  ],
};
