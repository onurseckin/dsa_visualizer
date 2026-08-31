import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_binary_search_c1_p1",
  pageNumber: 1,
  title: "Predicate Monotonicity, Bisection Invariants & Solution Spaces",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Linear Scanning Collapse & Exponential Bisection",
      content:
        "Scanning an array of size $N = 10^9$ takes $10^9$ operations (several seconds on modern hardware). Binary search reduces this search space logarithmically: in each step, evaluating a single midpoint halves the candidate interval, solving the search in $\\lceil \\log_2(10^9) \\rceil \\approx 30$ iterations ($< 20$ nanoseconds). Beyond sorted arrays, Binary Search is a general mathematical tool for finding the exact transition boundary of any monotonic boolean predicate $P: \\mathcal{X} \\to \\{0, 1\\}$, enabling optimal decision thresholds across discrete, fractional, and minimax solution spaces.",
    },
    {
      type: "prose",
      title: "Taxonomy of Binary Search Domains",
      content:
        "Binary search algorithms operate across three distinct functional domains:\n\n1. **Discrete Index Search (Sorted Arrays & Lower/Upper Bounds):**\n   - **Lower Bound (`std::lower_bound`):** Finds the first index $i$ such that $A[i] \\ge \\text{Target}$. Monotonic predicate: $P(x) = (A[x] \\ge \\text{Target})$.\n   - **Upper Bound (`std::upper_bound`):** Finds the first index $i$ such that $A[i] > \\text{Target}$. Monotonic predicate: $P(x) = (A[x] > \\text{Target})$.\n   - Invariant: Maintain semi-open interval $[L, R)$ where $P(L-1) = 0$ and $P(R) = 1$. The search terminates when $L = R$.\n\n2. **Binary Search on the Answer Space (Minimax Optimization):**\n   - Rather than searching an array, we search the range of possible answers $[\\text{low}, \\text{high}]$ (e.g. Koko Eating Bananas, Capacity To Ship Packages Within D Days, Split Array Largest Sum).\n   - **Feasibility Predicate:** Define monotonic function $\\text{isPossible}(\\text{mid}): \\mathbb{R} \\to \\{\\text{true}, \\text{false}\\}$. If answer $\\text{mid}$ is feasible, all values $> \\text{mid}$ are also feasible ($0 \\dots 0 1 1 \\dots 1$). We search for the minimal feasible parameter in $O(\\text{Cost}(\\text{isPossible}) \\cdot \\log(\\text{Range}))$.\n\n3. **Continuous & Fractional Binary Search:**\n   - Operates on real-valued domains $\\mathbb{R}$ with stopping criterion $|R - L| < \\epsilon$ or a fixed loop count (e.g. 60-100 iterations for 64-bit IEEE 754 precision $\\approx 10^{-18}$).\n\n4. **Ternary Search on Unimodal Functions:**\n   - For strictly convex/unimodal functions $f(x)$ with a unique minimum/maximum over $[L, R]$, evaluate two midpoints $m_1 = L + (R-L)/3$ and $m_2 = R - (R-L)/3$. Comparing $f(m_1)$ and $f(m_2)$ discards $1/3$ of the search space per iteration.",
    },
    {
      type: "mental_model",
      title: "The Semi-Open Bisection Invariant & Eytzinger Array Layout",
      visualIntuition: `
=== SEMI-OPEN PREDICATE BISECTION INVARIANT [L, R) ===
Predicate P(x):  [ 0,  0,  0,  0,  1,  1,  1,  1 ]
                     ^               ^
             L (Invariant: P(L-1)=0)  R (Invariant: P(R)=1)

Step: mid = L + ((R - L) >> 1)
If P(mid) == 0: L = mid + 1 (L maintains P(L-1)=0)
If P(mid) == 1: R = mid     (R maintains P(R)=1)
Termination: When L == R, L is the EXACT FIRST INDEX WHERE P(L) == 1!

=== EYTZINGER (ARRAY AS 1-BASED IMPLICIT TREE) ===
Standard Sorted Array: [ 1,  2,  3,  4,  5,  6,  7 ] (Linear index, random jumps)
Eytzinger Heap Layout: [ 4,  2,  6,  1,  3,  5,  7 ]
                         ^
                    Root at idx 1
                   /              \\
             Left Child (2)    Right Child (6) (idx 3)
              (idx 2 = 1*2)      (idx 3 = 1*2 + 1)

Eytzinger Step: k = 2*k + (A[k] < target)
Branchless search! Next node is always at contiguous cache line!
      `,
      invariant:
        "Semi-Open Invariant & Predicate Preservation:\n1. Predicate Invariant: At every iteration, all indices $< L$ satisfy $P(x) = 0$, and all indices $\\ge R$ satisfy $P(x) = 1$.\n2. Strict Contraction: In each step, the search span $R - L$ strictly decreases by at least $\\lfloor (R - L) / 2 \\rfloor$, guaranteeing termination in $\\lfloor \\log_2(N) \\rfloor + 1$ iterations.",
      stateTransitions:
        "Discrete: $\\text{mid} = L + ((R - L) \\gg 1)$; If $P(\\text{mid})$, $R \\leftarrow \\text{mid}$; else $L \\leftarrow \\text{mid} + 1$.\nFractional: If $P(\\text{mid})$, $R \\leftarrow \\text{mid}$; else $L \\leftarrow \\text{mid}$.",
      naiveBottleneck:
        "Linear testing of candidate parameters takes $\\Theta(N)$ evaluations. Naive midpoint calculation `(L + R) / 2` causes integer overflow.",
      optimalInsight:
        "Monotonicity allows logarithmic bisection of arbitrary decision problems, while Eytzinger memory layouts convert random binary search cache misses into predictable linear prefetch streams.",
    },
  ],
};
