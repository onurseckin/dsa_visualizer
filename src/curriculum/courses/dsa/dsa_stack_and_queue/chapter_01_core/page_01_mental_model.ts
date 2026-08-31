import type { CoursePage } from "../../../../courseTypes";

export const page_01_mental_model: CoursePage = {
  id: "dsa_stack_and_queue_c1_p1",
  pageNumber: 1,
  title: "LIFO & FIFO Topologies, Monotonic Invariants & Buffer Dynamics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Temporal Scheduling Crisis & Monotonic State Pruning",
      content:
        "Sequential computation requires strict temporal ordering protocols: **Last-In, First-Out (LIFO)** for recursive execution call frames, syntax parsing, and backtrack search; and **First-In, First-Out (FIFO)** for asynchronous event buffering and breadth-first search. While naive array operations suffer $O(N)$ shift penalties during head removals, contiguous Circular Ring Buffers provide strictly $O(1)$ push/pop execution. Furthermore, **Monotonic Stacks** exploit monotonicity invariants to bound search spaces, solving complex nearest-extrema problems (e.g. Next Greater Element, Largest Rectangle in Histogram) in strictly $O(N)$ linear time.",
    },
    {
      type: "prose",
      title: "Taxonomy of Stack & Queue Data Structures",
      content:
        "Sequential abstract data types are classified by access constraints and invariant tracking:\n\n1. **Fundamental Temporal Topologies:**\n   - **Stack (LIFO):** Supports `push(x)` and `pop()` from the top of an array stack pointer (`top++` / `top--`). Natively mirrors CPU hardware call-stack execution.\n   - **Circular Queue (FIFO):** Maintains `head` and `tail` indices in a power-of-two flat array (`(tail + 1) & mask`). Eliminates dynamic allocation and memory shifting.\n   - **Double-Ended Queue (Deque):** Supports $O(1)$ push and pop operations at both boundaries.\n\n2. **Auxiliary State & Extrema Tracking:**\n   - **Min/Max Stack in $O(1)$:** Storing element-minimum pairs `(val, currentMin)` or tracking differences `diff = val - min` guarantees $O(1)$ retrieval of the running minimum alongside standard stack operations.\n   - **Two-Stack Queue:** Implements a FIFO queue using two LIFO stacks ($S_{\\text{in}}$ for enqueue, $S_{\\text{out}}$ for dequeue). Batch flipping elements from $S_{\\text{in}}$ to $S_{\\text{out}}$ only when $S_{\\text{out}}$ is empty achieves $O(1)$ amortized cost via the Potential Method.\n\n3. **Monotonic Stacks & Boundary Extent Bounds:**\n   - **Next Greater / Smaller Element (NGE / NSE):** Maintains a stack of indices with strictly decreasing (or increasing) element values. When a larger element arrives, it resolves the next greater element for all smaller values currently on the stack.\n   - **Largest Rectangle in Histogram:** Maintains an increasing stack of bar heights. Popping an element $h_i$ upon encountering a shorter bar establishes that bar $i$ is bounded on the right by the current index and bounded on the left by the preceding element on the stack, computing the maximal rectangle in $O(N)$ total operations.",
    },
    {
      type: "mental_model",
      title: "Largest Rectangle in Histogram Monotonic Stack Mechanics",
      visualIntuition: `
=== MONOTONIC INCREASING STACK (HISTOGRAM AREA) ===
Heights: [ 2, 1, 5, 6, 2, 3 ]

Index 0 (h=2): Push index 0. Stack: [0 (h=2)]
Index 1 (h=1): 1 < 2! Pop 0!
  - Popped bar height = 2
  - Right boundary = 1 (current index)
  - Left boundary = -1 (stack is now empty)
  - Width = right - left - 1 = 1 - (-1) - 1 = 1
  - Area = 2 * 1 = 2. Push index 1. Stack: [1 (h=1)]
Index 2 (h=5): 5 > 1 -> Push 2. Stack: [1(h=1), 2(h=5)]
Index 3 (h=6): 6 > 5 -> Push 3. Stack: [1(h=1), 2(h=5), 3(h=6)]
Index 4 (h=2): 2 < 6! Pop 3 (h=6)!
  - Popped bar height = 6. Width = 4 - 2 - 1 = 1. Area = 6 * 1 = 6.
  - 2 < 5! Pop 2 (h=5)!
  - Popped bar height = 5. Width = 4 - 1 - 1 = 2. Area = 5 * 2 = 10! (MAX AREA)
  - Push index 4. Stack: [1(h=1), 4(h=2)]
Index 5 (h=3): Push 5. Stack: [1(h=1), 4(h=2), 5(h=3)]

Flush remaining elements at index N=6:
  - Pop 5 (h=3): Width = 6 - 4 - 1 = 1. Area = 3.
  - Pop 4 (h=2): Width = 6 - 1 - 1 = 4. Area = 2 * 4 = 8.
  - Pop 1 (h=1): Width = 6 - (-1) - 1 = 6. Area = 1 * 6 = 6.

Result: Global Maximum Area = 10. Every bar is pushed/popped at most once!
      `,
      invariant:
        "Monotonic Stack Invariant:\n1. Strict Monotonicity: Elements in the stack maintain strictly increasing heights: $H[S[0]] < H[S[1]] < \\dots < H[S[\\text{top}]]$.\n2. Bounded Extent: When element $i$ is popped by smaller element $j$, $j$ is the exact first smaller bar to the right, and $S[\\text{top}-1]$ is the exact first smaller bar to the left.",
      stateTransitions:
        "Push: While stack non-empty and $H[\\text{top}] \\ge H[i]$, pop top and process resolved boundary rectangle; push $i$.\nQueue Flip: If $S_{\\text{out}}$ empty, pop all from $S_{\\text{in}}$ and push to $S_{\\text{out}}$.",
      naiveBottleneck:
        "Expanding left and right boundaries from each histogram bar takes $\\Theta(N^2)$ worst-case time on monotonically sorted arrays.",
      optimalInsight:
        "By enforcing a monotonic stack order, each element is pushed once and popped once, discovering the maximal rectangle bounds for all $N$ bars in strictly $O(N)$ operations.",
    },
  ],
};

export const page1 = page_01_mental_model;
