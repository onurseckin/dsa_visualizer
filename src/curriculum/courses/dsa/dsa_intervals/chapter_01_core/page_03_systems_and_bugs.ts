import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_intervals_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Contiguous Memory vs Array-of-Arrays & Radix Sort Speedups",
      content:
        "High-performance spatial indices, OS schedulers, and calendar servers optimize interval processing under hardware constraints:\n\n1. **Array-of-Arrays Pointer Chasing:** Representing intervals as `number[][]` allocates $N + 1$ distinct heap objects. Iterating through `intervals[i][0]` triggers cache misses on every access. Storing intervals in **Struct-of-Arrays (SoA)** flat buffers (`starts: Int32Array`, `ends: Int32Array`) packs 16 timestamps per 64-byte L1 cache line, eliminating memory allocator overhead.\n2. **Linear-Time Radix Sort for Integer Timestamps:** When interval coordinates represent discrete epoch timestamps or millisecond ticks, standard comparison-based quicksort/timsort ($O(N \\log N)$) can be replaced by 32-bit **Radix Sort** (4 passes of 8-bit counting sort), sorting millions of intervals in strictly $O(N)$ linear time.\n3. **Branchless Interval Overlap Predicates:** Testing if intervals $A$ and $B$ overlap evaluates as $\\max(s_A, s_B) \\le \\min(e_A, e_B)$. Compiling to SIMD/CMOV instructions evaluates overlaps in 1 CPU cycle without branch mispredictions.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Sorting Inversions & Boundary Ambiguities",
      content:
        "1. **The Start vs End Sorting Inversion Fallacy:** Sorting by Start Time in Interval Scheduling Maximization fails catastrophically on instances like `[1, 100], [2, 3], [4, 5]` (greedy picks `[1, 100]` and achieves count 1 instead of optimal 2). Disjoint maximization *must* sort by **End Time**; interval merging *must* sort by **Start Time**.\n2. **Inclusive vs Exclusive Boundary Collisions:** In meeting room scheduling with half-open intervals $[s_i, e_i)$, a meeting ending at 10 and a meeting starting at 10 do *not* overlap ($s_j < e_i$). In event sweep lines, tie-breaking must process **END events before START events** at identical timestamps to prevent allocating an extra room.\n3. **JavaScript Default Lexicographical `sort()` Bug:** Calling `intervals.sort()` without a numerical comparator `(a, b) => a[0] - b[0]` converts numbers to ASCII strings, placing `100` before `20` and completely destroying timeline invariants.\n4. **In-Place Array Mutation Side Effects:** Mutating elements of the input interval array directly during merge operations creates unexpected bugs in calling modules.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Geometric Frontiers: Klee's Measure Problem & LexBFS Interval Graphs",
      content:
        "Advanced interval algorithms generalize to multi-dimensional geometry:\n- **Klee's Measure Problem (Klee 1977):** Given $N$ intervals on a line, compute the total measure (length) of their union. Solved in $O(N \\log N)$ time by sweeping a line and maintaining active interval counts with a Segment Tree. Extends to $d$-dimensional hyper-rectangles in $O(N^{d-1} \\log N)$ time.\n- **Lexicographic BFS (LexBFS / Rose, Tarjan & Lueker 1976):** An undirected graph is an interval graph if and only if its vertices have an intersection representation on a 1D line. LexBFS verifies interval graph chordality and constructs valid interval embeddings in strictly $O(V + E)$ time.",
    },
    {
      type: "prose",
      title: "Interval Algorithmic Archetype Selection Matrix",
      content: `
| Problem Archetype | Primary Goal | Required Sort Order | Optimal Algorithm | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Merge Intervals** | Union overlapping continuous spans | Sort by **Start Time** | 1-Pass Linear Scan | $O(N \\log N)$ |
| **Interval Scheduling Max** | Maximize count of disjoint tasks | Sort by **End Time** | Greedy Earliest Finish | $O(N \\log N)$ |
| **Meeting Rooms II** | Find minimum rooms (max overlap depth) | Sort **Starts** & **Ends** independently | 2-Pointer Event Sweep | $O(N \\log N)$ |
| **Insert Interval** | Insert and merge into sorted list | Pre-sorted by Start | 3-Stage Linear Partition | $O(N)$ strictly |
| **Point Overlap Query** | Find all intervals containing point $x$ | Augmented BST (Interval Tree) | Binary Search Tree Range Query | $O(K + \\log N)$ |
| **Non-Overlapping Count** | Minimum removals to make disjoint | Sort by **End Time** | Greedy Earliest Finish | $O(N \\log N)$ |
      `,
    },
  ],
};
