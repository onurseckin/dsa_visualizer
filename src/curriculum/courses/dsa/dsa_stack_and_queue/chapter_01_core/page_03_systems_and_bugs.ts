import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_and_bugs: CoursePage = {
  id: "dsa_stack_and_queue_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Contiguous Memory vs Node Allocations & Call Stack Exhaustion",
      content:
        "High-performance systems software (database query engines, OS kernel schedulers) enforces strict stack and queue memory layouts:\n\n1. **Contiguous Flat Buffer vs Linked-List Nodes:** A node-based stack (`class Node { val: number; next: Node }`) allocates $24-32$ bytes per node on the heap. Pushing and popping creates memory fragmentation and triggers CPU cache misses ($100-300$ cycles per DRAM access). A contiguous array stack packs 16 32-bit integers into a single 64-byte L1 cache line, executing push/pop operations in 1 CPU cycle.\n2. **Hardware Call-Stack Limits & Recursion Elimination:** Modern OS threads allocate fixed call-stack memory (typically 1 MB in Linux or 8 MB in Windows). Deep recursive algorithms (e.g. DFS on deep trees of depth $10^5$) trigger fatal `StackOverflowError` crashes. Production algorithms rewrite recursive calls into iterative loops using explicit pre-allocated `Int32Array` heap stacks.\n3. **Power-of-Two Ring Buffer Branch Elimination:** Circular queue head and tail pointers advance via `(ptr + 1) & (capacity - 1)`, replacing slow 30-cycle hardware division instructions (`idiv`) with 1-cycle bitwise operations.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Sentinel Omissions & Circular Queue Aliasing",
      content:
        "1. **Histogram Sentinel Omission Bug:** In Largest Rectangle in Histogram, failing to append a final zero-height sentinel bar ($h_n = 0$) leaves remaining increasing bars un-popped on the stack, missing the global maximal rectangle.\n2. **Empty Stack Left Boundary Error:** When popping bar $i$, if the stack becomes empty, the left boundary must be $-1$ (all previous bars to index 0 were $\\ge h_i$). Using index 0 instead of $-1$ truncates the rectangle width by 1.\n3. **Full vs Empty Ambiguity in Circular Queues:** In an $N$-element circular buffer, when `head === tail`, the buffer could be completely empty or completely full. Always maintain an explicit `size` counter or reserve 1 empty sentinel slot.\n4. **Monotonic Stack Strict Inequality Mismatch:** Using `<` vs `<=` when popping determines whether duplicate equal-height bars are merged immediately or flushed in the final pass.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Algebraic Applications: Shunting-Yard & Tarjan's SCC Stack Invariant",
      content:
        "Stacks serve as the fundamental machinery in algebraic compilation and graph theory:\n- **Dijkstra's Shunting-Yard Algorithm:** Converts human-readable infix expressions ($3 + 4 \\times 2 / (1 - 5)$) into postfix Reverse Polish Notation (RPN) using an operator stack and precedence comparisons in strictly $O(N)$ linear time.\n- **Tarjan's SCC Stack Invariant:** In graph theory, Tarjan's algorithm uses a DFS recursion stack to track active exploration subtrees. When a vertex $u$ with `lowlink[u] === dfn[u]` is identified, popping nodes from the stack until $u$ is removed extracts the exact maximal Strongly Connected Component in $O(V + E)$ time.",
    },
    {
      type: "prose",
      title: "Stack & Queue Data Structure Selection Matrix",
      content: `
| Structure | Allocation Strategy | Push / Enqueue | Pop / Dequeue | Cache Locality | Application Domain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Array Stack** | Contiguous Dynamic | $O(1)$ amortized | $O(1)$ strictly | Maximum (L1 cache line) | Expression parsing, undo buffers |
| **Linked Stack** | Dynamic Heap Nodes | $O(1)$ strictly | $O(1)$ strictly | Terrible (pointer chasing) | Real-time systems forbidding resize spikes |
| **Circular Ring Buffer** | Fixed Contiguous | $O(1)$ strictly | $O(1)$ strictly | Maximum | Network socket buffers, audio streaming |
| **Monotonic Stack** | Contiguous Array | $O(1)$ amortized | $O(1)$ amortized | Maximum | Histogram area, Next Greater Element |
| **Two-Stack Queue** | Dual Array Stacks | $O(1)$ strictly | $O(1)$ amortized | High | Functional programming, FIFO mapping |
| **Monotonic Deque** | Circular Ring Buffer | $O(1)$ amortized | $O(1)$ amortized | Maximum | Sliding window max/min, DP speedups |
      `,
    },
  ],
};

export const page3 = page_03_systems_and_bugs;
