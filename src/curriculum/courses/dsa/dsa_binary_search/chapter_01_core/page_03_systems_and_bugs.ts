import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_binary_search_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Branch Predictor Penalty, Eytzinger Layout & Hardware Prefetching",
      content:
        "High-performance search engines and in-memory database indices (e.g. Postgres B-tree leaf scans, RocksDB MemTable) optimize binary search for CPU instruction pipelines:\n\n1. **The 50% Branch Misprediction Penalty:** In standard binary search on randomly distributed targets, the condition `if (arr[mid] < target)` has an entropy of 1 bit (50% probability of either branch). Modern branch predictors fail on half of all bisection decisions, incurring a 15-20 cycle pipeline flush per step (totaling 300-500 wasted cycles per search). **Branchless Eytzinger layout** replaces conditional branches with 1-cycle bitwise arithmetic (`k = (k << 1) | (arr[k] < target)`), eliminating 100% of pipeline flushes.\n2. **Eytzinger Cache Line Prefetching:** In classical sorted arrays, index jumps jump across distant memory pages. In an Eytzinger tree layout, the child of node $k$ resides at $2k$. By issuing an explicit software prefetch instruction (`prefetch(&eytzinger[k * 16])`), child nodes are loaded into L1 cache before the CPU reaches the next tree layer.\n3. **Integer Overflow Prevention:** The classical midpoint formula `mid = (L + R) / 2` overflows signed 32-bit integers when $L + R > 2^{31} - 1$, producing negative indices (a bug that survived in Java's standard library for 9 years). Always use `mid = L + ((R - L) >> 1)` or unsigned bit shift `(L + R) >>> 1`.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Floating-Point Precision & Infinite Loops",
      content:
        "1. **Continuous Domain Precision Lockup:** When binary searching over real numbers $\\mathbb{R}$, evaluating `while (left < right)` causes an infinite loop because floating-point precision cannot distinguish $L$ from $L + \\epsilon$ for very small intervals. Always use a fixed iteration loop (`for (let iter = 0; iter < 80; iter++)`), which guarantees precision to $\\approx (B - A) \\times 2^{-80} \\approx 10^{-24}$.\n2. **Boundary Parity Inversion & Infinite Loops:** In search templates using `left <= right`, updating `left = mid` (instead of `left = mid + 1`) when `mid = left` creates an endless cycle where the interval never shrinks.\n3. **Rotated Sorted Array Duplicate Breakdown:** In rotated sorted arrays with duplicates (e.g. `[1, 0, 1, 1, 1]`), when `nums[left] === nums[mid] === nums[right]`, monotonicity is destroyed. Binary search must fall back to linear boundary contraction (`left++; right--`), degrading worst-case time to $O(N)$.\n4. **Unimodal Condition Violations in Ternary Search:** If function $f(x)$ contains flat plateaus ($f(x) = c$ on an interval), ternary search can discard the sub-interval containing the true optimum.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Search Optimizations: Galloping Search & Interpolation Search",
      content:
        "Specialized search distributions unlock sub-logarithmic speeds:\n- **Galloping / Exponential Search (Bentley & Yao 1976):** Useful when searching unbounded streams or when targets reside near the start. Probes indices $1, 2, 4, 8, \\dots, 2^k$ until $A[2^k] \\ge \\text{Target}$, then binary searches in $[2^{k-1}, 2^k]$. Takes $O(\\log(\\text{rank}))$ time instead of $O(\\log N)$.\n- **Interpolation Search:** When data is uniformly distributed across numerical range $[A[L], A[R]]$, estimates midpoint by linear interpolation:\n  $$\\text{mid} = L + \\left\\lfloor \\frac{\\text{Target} - A[L]}{A[R] - A[L]} (R - L) \\right\\rfloor$$\n  Achieving optimal $O(\\log \\log N)$ expected search time on uniformly distributed datasets.",
    },
    {
      type: "prose",
      title: "Binary Search Strategy Comparison Matrix",
      content: `
| Algorithm | Domain Type | Time Complexity | Branch Predictor Behavior | Optimal Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Semi-Open Lower Bound** | Discrete Array | $O(\\log N)$ | Branchy (50% penalty) | Standard index search, insertion point |
| **Binary Search on Answer** | Monotonic Function | $O(\\text{Cost} \\cdot \\log(\\text{Range}))$ | Dependent on predicate | Minimax capacity, scheduling bounds |
| **Branchless Eytzinger** | Static Array | $O(\\log N)$ | 100% Branchless | In-memory search engines, high-QPS lookups |
| **Exponential / Galloping** | Unbounded Stream | $O(\\log(\\text{rank}))$ | High early predictability | B-Tree index leaf seeking, sorted list merge |
| **Interpolation Search** | Uniform Numeric | $O(\\log \\log N)$ avg | Arithmetic-heavy | Large uniform tables, phonebook scans |
| **Ternary Search** | Unimodal Convex | $O(\\log_{1.5}(N))$ | 2-Point evaluation | Convex optimization, parabolic extremum |
      `,
    },
  ],
};
