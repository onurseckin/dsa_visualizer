import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_sliding_window_c1_p1",
  pageNumber: 1,
  title: "Continuous Subarrays, Monotonic Deques & Window Algebra",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Subarray Recomputation Crisis & Stream Processing",
      content:
        "Analyzing contiguous data streams—such as moving averages in stock market tickers, packet rate limiters in networking, and genome window scans—requires tracking summary statistics over $O(N)$ contiguous subarrays. Recomputing window aggregates from scratch on each shift takes $\\Theta(N \\cdot K)$ time. The Sliding Window paradigm maintains window state dynamically via incremental updates: adding the incoming element $A[R]$ and subtracting the outgoing element $A[L-1]$ in $O(1)$ time. Combined with Monotonic Deques, arbitrary non-invertible operations (e.g. range maximum/minimum) are tracked in strictly $O(N)$ amortized time.",
    },
    {
      type: "prose",
      title: "Taxonomy of Sliding Window Paradigms",
      content:
        "Sliding window algorithms operate across three core mathematical formulations:\n\n1. **Fixed-Size Sliding Windows (Constant Width $K$):**\n   - The window maintains constant span $R - L + 1 = K$. In each step, the window shifts right by 1 position ($L \\leftarrow L+1, R \\leftarrow R+1$).\n   - **Invertible Aggregates:** Sum, average, XOR, and bitwise counts update in $O(1)$ via $\\text{State} \\leftarrow \\text{State} + A[R] - A[L-1]$.\n   - **Non-Invertible Aggregates (Monotonic Deque):** Tracking the minimum or maximum over a fixed window cannot be inverted by subtraction. A **Monotonic Deque** maintains indices of elements in strictly decreasing order of value. The front of the deque always holds the current window maximum.\n\n2. **Variable-Size Dynamic Windows (Constraint Satisficing):**\n   - Right pointer $R$ expands the window to incorporate new elements until a constraint is violated (e.g. Longest Substring Without Repeating Characters, Minimum Window Substring).\n   - Left pointer $L$ contracts the window until the invariant is restored. Because both $L$ and $R$ advance monotonically from $0$ to $N$, the total number of pointer advances is bounded by $2N$, running in strictly $O(N)$ time.\n\n3. **Subarray Counting Algebra (The AtMost Reduction):**\n   - Directly counting contiguous subarrays satisfying an exact constraint (e.g. Subarrays with *exactly* $K$ distinct elements) is non-monotonic (expanding the window can cause valid subarrays to become invalid, preventing greedy contraction).\n   - **The AtMost Identity:** Count subarrays with *at most* $K$ elements (which is monotonically contractible), and compute:\n     $$\\text{Count}(\\text{Exactly } K) = \\text{Count}(\\text{AtMost } K) - \\text{Count}(\\text{AtMost } K - 1)$$\n     For any valid window $[L, R]$ where condition holds, the number of valid subarrays ending at $R$ is exactly $(R - L + 1)$.",
    },
    {
      type: "mental_model",
      title: "Monotonic Deque Window Squeeze & AtMost Geometry",
      visualIntuition: `
=== MONOTONIC DEQUE SLIDING WINDOW MAXIMUM (Window K = 3) ===
Array: [ 1, 3, -1, -3, 5, 3, 6, 7 ]

Step 1 (val=1):  Deque: [1]
Step 2 (val=3):  3 > 1 -> Pop 1! Deque: [3]
Step 3 (val=-1): -1 < 3 -> Push -1. Deque: [3, -1]  ==> Max = 3 (Front)
Step 4 (val=-3): -3 < -1 -> Push -3. Deque: [3, -1, -3] ==> Max = 3
Step 5 (val=5):  5 > -3, -1, 3 -> Pop ALL! Deque: [5]  ==> Max = 5
Step 6 (val=3):  3 < 5 -> Push 3. Deque: [5, 3]  ==> Max = 5
Step 7 (val=6):  6 > 3, 5 -> Pop ALL! Deque: [6]  ==> Max = 6
Step 8 (val=7):  7 > 6 -> Pop 6! Deque: [7]  ==> Max = 7

Deque Invariant: Values are strictly decreasing from Front to Back!

=== AT-MOST(K) SUBARRAY COUNTING GEOMETRY ===
Valid window [ L ... R ] satisfies condition (e.g. <= K distinct characters):
All subarrays ending at R with start index in [L, R] are also valid:
  [ L ... R ] (len = R - L + 1)
  [ L+1 ... R ]
  ...
  [ R ... R ]
==> Add (R - L + 1) to total count!
      `,
      invariant:
        "Monotonic Deque & Window Counting Invariant:\n1. Deque Monotonicity: For any indices $i < j$ in the deque, $A[i] > A[j]$. The front index $\\text{deque}[0]$ is always the global extremum in window $[R-K+1, R]$.\n2. Subarray Counting: In a monotonic valid window $[L, R]$, the number of valid subarrays ending at $R$ is uniquely given by $(R - L + 1)$.",
      stateTransitions:
        "Expand: Advance $R$; add $A[R]$ to frequency map / monotonic deque.\nContract: While window violates invariant, remove $A[L]$ from state; advance $L \\leftarrow L + 1$.\nRecord: Compute aggregate or add $(R - L + 1)$ to count.",
      naiveBottleneck:
        "Scanning all elements within every window takes $\\Theta(N \\cdot K)$. Re-evaluating all $O(N^2)$ candidate subarrays creates quadratic CPU overhead.",
      optimalInsight:
        "Incremental state maintenance and monotonic deque queue pruning eliminate redundant interior element scans, achieving strict $O(N)$ execution time.",
    },
  ],
};
