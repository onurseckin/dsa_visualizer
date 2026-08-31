import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_heap_and_priority_queue_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "4-ary Cache Line Saturation & SIMD Vectorized Child Comparisons",
      content:
        "High-performance graph routing engines and real-time event loops optimize heap layouts for CPU hardware caches:\n\n1. **4-ary Heap L1 Cache Line Density:** In a binary heap, sifting down loads 2 children (8 bytes), underutilizing the 64-byte L1 cache line fetch. A **4-ary Heap ($D=4$)** packs all 4 child values ($4i+1, 4i+2, 4i+3, 4i+4 = 16\\text{ bytes}$) into the same L1 cache line. Sifting down halves the tree height from $\\log_2 N$ to $\\log_4 N = 0.5 \\log_2 N$, cutting DRAM memory accesses by $50\\%$.\n2. **SIMD Vector Min-Reduction:** In a 4-ary heap, finding the smallest of the 4 children evaluates via a single 128-bit AVX/NEON SIMD instruction (`_mm_min_epi32`), eliminating scalar branch comparison overhead.\n3. **Stale Heap Memory Bloat in Dijkstra:** In naive Dijkstra implementations using standard priority queues, updating a node's distance pushes a duplicate entry to the heap. The heap balloons from $V$ entries to $E$ entries ($10-100\\times$ memory bloat), increasing per-operation latency to $\\log E$. **Indexed Priority Queues** enforce strict $|V|$ heap occupancy via in-place `decreaseKey`.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Build-Heap Complexity & In-Place Mutation Bugs",
      content:
        "1. **The Top-Down $O(N \\log N)$ Build Trap:** Building a heap by calling `push` sequentially on $N$ elements takes $\\sum_{i=1}^N \\log i = \\Theta(N \\log N)$ time. Always use Floyd's bottom-up `siftDown` pass from $N/2$ down to 0, which executes in strictly $O(N)$ linear time.\n2. **In-Place Mutation without Sifting:** Mutating a key value directly inside the heap array without calling `siftUp` or `siftDown` silently breaks the heap invariant, causing future `popMin` calls to return corrupted values.\n3. **0-Based D-ary Arithmetic Index Bug:** In $D$-ary heaps with 0-based indexing, the $k$-th child is at index $D \\cdot i + k + 1$, and the parent is at $\\lfloor(i - 1)/D\\rfloor$. Using 1-based indexing formulas on 0-based arrays shifts parent offsets, corrupting tree connectivity.\n4. **Stale Pop Check Omission:** Failing to verify `if (dist > minDist[u]) continue;` when popping from a standard priority queue causes duplicate vertex expansions in shortest-path algorithms.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Advanced Priority Frontiers: Pairing Heaps & Monotonic Radix Heaps",
      content:
        "Specialized priority queue variants provide near-theoretical optimal performance:\n- **Pairing Heaps (Fredman et al. 1986):** A multi-way tree structure that executes tree merges in two-pass pairing cascades. Matches Fibonacci heap practical performance without marked-node bookkeeping, achieving $O(1)$ amortized insertion and $O(\\log N)$ amortized extraction.\n- **Radix Heaps (Ahuja et al. 1990):** For integer edge weights in shortest-path algorithms, Radix Heaps partition keys into logarithmic bit-buckets based on the most significant differing bit with the current minimum. Achieves $O(1)$ amortized `decreaseKey` and $O(\\log C)$ extraction where $C$ is the maximum edge weight.",
    },
    {
      type: "prose",
      title: "Priority Queue Data Structure Selection Matrix",
      content: `
| Structure | Find-Min | Insert | Delete-Min | Decrease-Key | Cache Locality | Primary Application |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Binary Heap** | $O(1)$ | $O(\\log N)$ | $O(\\log N)$ | $O(N)$ / $O(\\log N)$ (IPQ) | Good (contiguous) | General-purpose scheduling |
| **4-ary Heap** | $O(1)$ | $O(\\log_4 N)$ | $O(4 \\log_4 N)$ | $O(\\log_4 N)$ (IPQ) | Maximum (64B cache line) | High-throughput Dijkstra / Prim |
| **Fibonacci Heap** | $O(1)$ | $O(1)$ | $O(\\log N)$ amortized | $O(1)$ amortized | Poor (pointer forest) | Asymptotic theoretical proofs |
| **Pairing Heap** | $O(1)$ | $O(1)$ | $O(\\log N)$ amortized | $O(o(\\log N))$ amortized | Medium | GNU C++ \`ext/pb_ds\` priority queue |
| **Radix Heap** | $O(1)$ | $O(1)$ amortized | $O(\\log C)$ | $O(1)$ amortized | High (bucketed) | Integer network flow & routing |
      `,
    },
  ],
};
