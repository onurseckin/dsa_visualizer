import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_advanced_range_queries_c1_p1",
  pageNumber: 1,
  title: "Algebraic Monoids & Range Query Foundations",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Static vs Dynamic Range Query Crisis",
      content:
        "Given an array $A[0 \\dots N-1]$, we seek to execute updates and aggregate queries over arbitrary contiguous sub-arrays $A[L \\dots R]$ under an associative operator $\\oplus$. A standard prefix sum array allows $O(1)$ static range queries but incurs catastrophic $O(N)$ write amplification per point update. Conversely, raw array writes are $O(1)$ but force $O(N)$ sequential reductions per query. Advanced range query data structures resolve this fundamental tension by organizing partial reductions along dyadic or hierarchical intervals, achieving $O(\\log N)$ dynamic operations or $O(1)$ static queries.",
    },
    {
      type: "prose",
      title: "Algebraic Classification of Range Query Structures",
      content:
        "The selection of the optimal range query structure is strictly governed by the algebraic properties of the operator $(S, \\oplus)$:\n\n1. **Abelian Groups $(S, \\oplus, e, ^{-1})$** (Associative, Commutative, Invertible e.g., Addition $\\mathbb{Z}, +$):\n   - Compatible with **Fenwick Trees (Binary Indexed Trees)**.\n   - Invertibility ($a - b$) allows prefix difference $Q(L, R) = P(R) - P(L-1)$.\n\n2. **Monoids $(S, \\oplus, e)$** (Associative with Identity, Non-Invertible e.g., $\\min, \\max, \\gcd$, Matrix Multiplication):\n   - Requires **Segment Trees**.\n   - Does not require inverses; canonical node decomposition partitions any range $[L, R]$ into $\\le 2 \\lceil \\log_2 N \\rceil$ disjoint sub-intervals.\n\n3. **Idempotent Semilattices / Idempotent Monoids** ($x \\oplus x = x$ e.g., $\\min, \\max, \\gcd$, Bitwise OR/AND):\n   - Admits **Sparse Tables**.\n   - Idempotence allows overlapping intervals: $Q(L, R) = f(A[L \\dots L+2^k-1], A[R-2^k+1 \\dots R])$, yielding $O(1)$ worst-case query time after $O(N \\log N)$ preprocessing.\n\n4. **Dynamic Index Orderings & Non-Commutative Sequences**:\n   - Requires **Randomized Cartesian Trees (Treaps / Split-Merge Trees)** for range split, concatenation, dynamic key re-indexing, and implicit range reversals in $O(\\log N)$ expected time.",
    },
    {
      type: "mental_model",
      title: "Hierarchical Decomposition & Binary Dyadic Intervals",
      visualIntuition: `
=== SEGMENT TREE (CANONICAL COVERING OF [1, 6]) ===
                 [0..7]
            /              \\
       [0..3]              [4..7]
      /      \\            /      \\
   [0..1]   [2..3]     [4..5]   [6..7]
   /    \\   /    \\     /    \\   /    \\
  [0]  [1] [2]  [3]   [4]  [5] [6]  [7]

Query [1..6] decomposes into 4 disjoint canonical nodes:
  Node [1] + Node [2..3] + Node [4..5] + Node [6]

=== FENWICK TREE (DYADIC INTERVALS via lowbit(x) = x & -x) ===
Index 1 (0001_2): [1..1]
Index 2 (0010_2): [1..2]  (covers 2 intervals)
Index 3 (0011_2): [3..3]
Index 4 (0100_2): [1..4]  (covers 4 intervals)
Index 5 (0101_2): [5..5]
Index 6 (0110_2): [5..6]  (covers 2 intervals)
Index 7 (0111_2): [7..7]
Index 8 (1000_2): [1..8]  (covers 8 intervals)
      `,
      invariant:
        "Canonical Node Invariant: Any contiguous range $[L, R] \\subseteq [0, N-1]$ can be uniquely represented as the disjoint union of at most $2 \\lceil \\log_2 N \\rceil$ canonical nodes in a balanced segment tree, and as at most $\\log_2 N$ dyadic prefix sums in a Fenwick tree.",
      stateTransitions:
        "Fenwick Point Update: $i \\leftarrow i + (i \\ \\& \\ -i)$ until $i > N$.\nFenwick Prefix Query: $i \\leftarrow i - (i \\ \\& \\ -i)$ accumulating partial sums until $i = 0$.\nSegment Tree Lazy Push: $\\text{node.left.lazy} \\leftarrow \\text{node.left.lazy} \\circ \\text{node.lazy}$, $\\text{node.right.lazy} \\leftarrow \\text{node.right.lazy} \\circ \\text{node.lazy}$, $\\text{node.lazy} \\leftarrow \\text{identity}$.",
      naiveBottleneck:
        "Iterative linear reduction over $[L, R]$ requires $\\Theta(R - L + 1) = O(N)$ time per query. Point updates across a cumulative prefix array require cascading $\\Theta(N)$ writes across the entire suffix.",
      optimalInsight:
        "By decomposing continuous intervals into powers-of-two dyadic segments or balanced binary tree levels, updates propagate along path heights of length $O(\\log N)$, and range queries combine pre-aggregated canonical sub-solutions in $O(\\log N)$ (or $O(1)$ for idempotent structures).",
    },
  ],
};
