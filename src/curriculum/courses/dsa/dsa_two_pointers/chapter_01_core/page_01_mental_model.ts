import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_two_pointers_c1_p1",
  pageNumber: 1,
  title: "Monotonicity Invariants, Search-Space Pruning & Pointer Topologies",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The $\\Theta(N^2)$ Pairwise Combinatorial Explosion",
      content:
        "Evaluating all pairs $(i, j)$ from an array of size $N$ requires examining $\\binom{N}{2} = \\frac{N(N-1)}{2} = \\Theta(N^2)$ states. In high-throughput stream processing, genomics, and real-time physics engines, quadratic algorithms create severe CPU pipeline stalls and thermal throttling. The Two-Pointer technique exploits monotonic invariants in sorted or topologically structured arrays. By proving that advancing a pointer permanently eliminates an entire row or column of candidate pairs, the search space collapses from a 2D matrix of $N \\times N$ evaluations into a 1D linear trajectory of strictly $O(N)$ operations.",
    },
    {
      type: "prose",
      title: "Taxonomy of Two-Pointer Topologies",
      content:
        "Two-pointer techniques operate across three distinct geometric and topological paradigms:\n\n1. **Opposing (Inward-Converging) Pointers:**\n   - **2-Sum on Sorted Arrays:** Pointer $L=0$ and $R=N-1$ track the current sum $S = A[L] + A[R]$. If $S < \\text{Target}$, no pair involving $L$ can reach the target (since $A[R]$ is maximal), allowing $L \\leftarrow L + 1$. If $S > \\text{Target}$, $R \\leftarrow R - 1$. Each comparison eliminates a full candidate slice in $O(N)$ total steps.\n   - **Container With Most Water:** Area is bounded by $\\min(H[L], H[R]) \\times (R - L)$. Discarding the shorter wall preserves the maximum volume candidate subset, proving optimality in $N-1$ comparisons.\n   - **Trapping Rain Water:** Tracks running prefix maximum `left_max` and suffix maximum `right_max`, computing water trapped above slot $i$ via $\\min(\\text{left\\_max}, \\text{right\\_max}) - H[i]$ without auxiliary arrays.\n\n2. **Co-Directional (Fast / Slow) Pointers:**\n   - **Floyd's Tortoise and Hare Cycle Detection:** Fast pointer moves at speed $2v$, slow pointer moves at speed $v$. If a cycle of length $\\lambda$ exists after tail $\\mu$, they collide inside the cycle in $\\le \\mu + \\lambda$ steps. Advancing one pointer to head and marching both at speed $1$ identifies the exact cycle entry node in $O(N)$ time and $O(1)$ space.\n   - **In-Place Array Compaction / Partitioning:** Fast pointer scans every element; slow pointer writes valid elements in-place (e.g. Remove Duplicates, Move Zeroes).\n\n3. **Multi-Pointer Partitioning (Dutch National Flag):**\n   - Maintains three pointers `(low, mid, high)` partitioning an array into 4 invariant regions: $[0, \\text{low}-1] = 0$, $[\\text{low}, \\text{mid}-1] = 1$, $[\\text{mid}, \\text{high}] = \\text{unexamined}$, $[\\text{high}+1, N-1] = 2$. Executes in a single pass with $O(1)$ auxiliary memory.",
    },
    {
      type: "mental_model",
      title: "Search-Space Matrix Slicing & Container Invariant",
      visualIntuition: `
=== SEARCH-SPACE MATRIX SLICING (2-SUM ON SORTED ARRAY) ===
Pairs (L, R) where L < R. Total matrix of size N x N:

        R=0   R=1   R=2   R=3   R=4 (Max)
L=0     [ - ] [ . ] [ . ] [ . ] [ L=0, R=4: Sum > Target ] -> ELIMINATE COLUMN R=4!
L=1     [ - ] [ - ] [ . ] [ . ] [ X ] (All pairs (L, 4) are > Target)
L=2     [ - ] [ - ] [ - ] [ . ] [ X ]
L=3     [ - ] [ - ] [ - ] [ - ] [ X ]

Next: Check (L=0, R=3). Sum < Target -> ELIMINATE ROW L=0!
Every single comparison removes an entire ROW or COLUMN from the 2D grid!

=== CONTAINER WITH MOST WATER INVARIANT ===
L ────────────────────────────────────────── R
|                   Volume                  |
|                   = min(H[L], H[R]) * (R - L) |
|___________________________________________|
If H[L] < H[R]:
Any pair (L, k) with k < R has width (k - L) < (R - L) and height <= H[L].
Therefore: Area(L, k) <= H[L] * (k - L) < Area(L, R).
==> Index L can NEVER be part of a larger container. We safely advance L++!
      `,
      invariant:
        "Safe Elimination Invariant:\n1. 2-Sum Invariant: If $A[L] + A[R] < \\text{Target}$, then $\\forall k \\le R, A[L] + A[k] \\le A[L] + A[R] < \\text{Target}$. Discarding $L$ discards zero solution pairs.\n2. Container Invariant: If $H[L] \\le H[R]$, $\\forall k < R, \\text{Area}(L, k) < \\text{Area}(L, R)$. Discarding index $L$ preserves the optimal container.",
      stateTransitions:
        "Opposing: If predicate indicates current left boundary is suboptimal, $L \\leftarrow L + 1$; else $R \\leftarrow R - 1$.\nFast/Slow: If $P(A[\\text{fast}])$ holds, $A[\\text{slow}++] \\leftarrow A[\\text{fast}]$; $\\text{fast}++$.",
      naiveBottleneck:
        "Checking all pairs with nested loops requires $\\Theta(N^2)$ evaluations, stalling execution pipelines on memory loads.",
      optimalInsight:
        "Monotonicity allows each step to discard an entire slice of size $O(N)$ candidate solutions in $O(1)$ time, achieving guaranteed linear $O(N)$ convergence.",
    },
  ],
};
