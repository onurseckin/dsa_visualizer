import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_heap_and_priority_queue_c1_p1",
  pageNumber: 1,
  title: "Complete Binary Tree Topologies, D-ary Heaps & Priority Queues",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Priority Extraction vs Total Sorting Bottleneck",
      content:
        "Full sorting of $N$ items requires $\\Omega(N \\log N)$ comparisons. However, real-time operating systems (process schedulers), event-driven physics simulators, and shortest-path graph algorithms (Dijkstra, Prim) do not need fully sorted data—they only require continuous, dynamic access to the single global extremum (minimum or maximum). Priority queues solve this by organizing keys into an implicit Complete Binary Tree inside a contiguous 1D array. Binary heaps achieve $O(1)$ peak retrieval, $O(\\log N)$ insertion/deletion, and $O(N)$ linear bottom-up construction.",
    },
    {
      type: "prose",
      title: "Taxonomy of Heap Data Structures & Branching Factors",
      content:
        "Priority queues span implicit flat arrays and multi-root amortized pointer forests:\n\n1. **Implicit Binary Heaps (Flat 1D Memory Layout):**\n   - A complete binary tree packed into a 0-indexed array without node pointers:\n     $$\\text{Parent}(i) = \\left\\lfloor \\frac{i - 1}{2} \\right\\rfloor, \\quad \\text{Left}(i) = 2i + 1, \\quad \\text{Right}(i) = 2i + 2$$\n   - **The Min-Heap Invariant:** For every node $i > 0$, $A[\\text{Parent}(i)] \\le A[i]$. The root $A[0]$ is always the global minimum.\n   - **Sift-Up:** Restores invariant after insertion by bubbling up to parent in $O(\\log N)$ time.\n   - **Sift-Down:** Restores invariant after root deletion by swapping with the smaller child in $O(\\log N)$ time.\n   - **Floyd's Linear Build-Heap:** Bottom-up sift-down across all internal nodes executes in strictly $O(N)$ linear time.\n\n2. **D-ary Heaps (3-ary & 4-ary Cache Line Optimization):**\n   - Generalizes binary heaps to branching factor $D$:\n     $$\\text{Parent}(i) = \\left\\lfloor \\frac{i - 1}{D} \\right\\rfloor, \\quad \\text{Child}_k(i) = D \\cdot i + k + 1 \\quad (0 \\le k < D)$$\n   - **Height Reduction:** Tree height shrinks to $\\log_D N$. For $D = 4$, tree height is halved ($\\\\approx 0.5 \\log_2 N$).\n   - **L1 Cache Line Saturation:** In a 4-ary heap, all 4 child values (16 bytes each for 4-byte integers = 16 bytes) reside in the **same 64-byte L1 cache line**, allowing single-instruction vector comparisons to find the minimal child.\n\n3. **Indexed Priority Queues (IPQ / Dynamic Update-Key):**\n   - Standard heaps cannot locate an arbitrary key $k$ in $O(1)$ time (searching requires $O(N)$ scan). An Indexed Priority Queue maintains a bidirectional mapping:\n     - `pm[k]`: Position Map (where key $k$ resides in the heap array).\n     - `im[i]`: Inverse Map (which key resides at heap position $i$).\n   - Enables `decreaseKey(k, newVal)` and `delete(k)` in strictly $O(\\log N)$ time, accelerating Dijkstra's algorithm from $O(E \\log E)$ to optimal $O(E + V \\log V)$.\n\n4. **Fibonacci Heaps (Fredman & Tarjan 1987):**\n   - A forest of min-heap-ordered trees utilizing lazy consolidation and cascading cuts. Achieves $O(1)$ amortized `insert`, `findMin`, and `decreaseKey`, with $O(\\log V)$ `deleteMin`.",
    },
    {
      type: "mental_model",
      title: "Implicit Array Heap Tree & Indexed Position Mapping",
      visualIntuition: `
=== IMPLICIT 1D ARRAY HEAP TREE MAPPING ===
Array Indices:  [ 0,  1,  2,  3,  4,  5,  6 ]
Array Values:   [ 2,  4,  3,  8,  7,  6,  5 ]

Implicit Tree Structure:
                    (0: val=2)
                   /          \\
            (1: val=4)      (2: val=3)
            /        \\      /        \\
       (3: val=8) (4: val=7)(5: val=6)(6: val=5)

=== INDEXED PRIORITY QUEUE (IPQ) BIDIRECTIONAL MAPPING ===
Keys: 0 (Node A), 1 (Node B), 2 (Node C)
Heap Array:        heap[0] = B (weight 10), heap[1] = A (weight 25)
Inverse Map (im):  im[0] = 1,              im[1] = 0
Position Map (pm): pm[0] = 1 (A is at pos 1), pm[1] = 0 (B is at pos 0)

To Decrease Key of Node A:
  1. Lookup position: pos = pm[0] -> 1 in O(1)!
  2. Update weight: vals[0] = 5
  3. Sift-Up from pos 1 to pos 0 in O(log N)!
      `,
      invariant:
        "Heap Order & Position Bijectivity Invariants:\n1. Min-Heap Order: $A[\\text{Parent}(i)] \\le A[i]$ for all $i \\in [1, N-1]$.\n2. IPQ Bijectivity: For all valid keys $k$ and heap slots $i$, $\\text{im}[\\text{pm}[k]] = k$ and $\\text{pm}[\\text{im}[i]] = i$.",
      stateTransitions:
        "Sift-Up: While $i > 0$ and $A[i] < A[\\text{Parent}(i)]$, swap $(A[i], A[\\text{Parent}(i)])$ and update position maps $\\text{pm}$; $i \\leftarrow \\text{Parent}(i)$.\nSift-Down: While $i$ has children, find $\\min(\\text{Children}(i))$; if smaller than $A[i]$, swap and descend.",
      naiveBottleneck:
        "Unsorted array priority queues require $\\Theta(N)$ scanning on every `popMin`. Performing `decreaseKey` in standard heaps requires $O(N)$ linear searching to find the element.",
      optimalInsight:
        "Implicit array indexing eliminates pointer dereferencing, while Indexed Priority Queue position maps enable $O(\\log N)$ key updates for high-performance network routing.",
    },
  ],
};
