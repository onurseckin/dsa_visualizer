import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_intervals_c1_p1",
  pageNumber: 1,
  title: "1D Temporal Geometry, Greedy Exchange Arguments & Event Sweeps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Continuous Temporal Resource Allocation Crisis",
      content:
        "Concurrent computing systems (OS thread scheduling, network packet reservation, database transaction locks, cloud server capacity allocation) model temporal activities as 1D intervals $[s_i, e_i) \\subset \\mathbb{R}$. Testing pairwise interval collisions naively takes $\\Theta(N^2)$ time. By transforming intervals into a 1D coordinate timeline, **Greedy Sorting** and **Event-Driven Sweep Lines** reduce interval merging, disjoint scheduling, and resource depth partitioning to strictly $O(N \\log N)$ (or $O(N)$ with integer coordinates).",
    },
    {
      type: "prose",
      title: "Taxonomy of 1D Interval Algorithmic Archetypes",
      content:
        "1D interval problems are categorized by sorting criterion and structural invariant:\n\n1. **Interval Scheduling Maximization (Greedy Earliest Finish Time):**\n   - Goal: Select the maximum number of mutually non-overlapping intervals from a candidate pool.\n   - **Greedy Strategy:** Sort intervals by **End Time** ($e_1 \\le e_2 \\le \\dots \\le e_N$). Greedily select the interval that finishes earliest and starts after the previous selection's finish time.\n   - **Exchange Argument:** Choosing the earliest end time leaves the maximal remaining contiguous timeline available for subsequent allocations, provably achieving global optimality.\n\n2. **Interval Partitioning / Meeting Rooms II (Minimum Resource Depth):**\n   - Goal: Allocate the minimum number of resources (e.g. conference rooms, CPU cores) such that no two overlapping intervals share the same resource.\n   - **Event Sweep Line Strategy:** Deconstruct each interval $[s_i, e_i)$ into two distinct discrete events: `(start, +1)` and `(end, -1)`. Sort all $2N$ events chronologically. The running prefix sum of weights tracks active resource concurrency, where the global peak equals the exact chromatic number / clique size of the interval graph: $K = \\max_t |\\{ i \\mid s_i \\le t < e_i \\}|$.\n\n3. **Interval Union & Merging (Sorted by Start Time):**\n   - Goal: Merge all overlapping or adjacent continuous segments into disjoint intervals.\n   - **Strategy:** Sort intervals by **Start Time** ($s_1 \\le s_2 \\le \\dots \\le s_N$). Maintain a running merged interval $[S, E]$. If the next interval satisfies $s_i \\le E$, extend $E = \\max(E, e_i)$; otherwise, seal $[S, E]$ and initialize a new interval.\n\n4. **Point Enclosure & Interval Trees:**\n   - Augmented Red-Black Trees (Interval Trees) where each node stores $[s_i, e_i]$ and $\\text{maxSubtreeEnd} = \\max(e_i, \\text{left.max}, \\text{right.max})$, querying all overlapping intervals for a given point $x$ in strictly $O(K + \\log N)$ time.",
    },
    {
      type: "mental_model",
      title: "Event Sweep Line & Interval Merge Timeline Mechanics",
      visualIntuition: `
=== EVENT SWEEP LINE (MEETING ROOMS CONCURRENCY) ===
Intervals: [0, 30], [5, 10], [15, 20]

Events Array:
  Time 0:  START (+1) -> Active Rooms = 1
  Time 5:  START (+1) -> Active Rooms = 2 (Peak!)
  Time 10: END   (-1) -> Active Rooms = 1
  Time 15: START (+1) -> Active Rooms = 2 (Peak!)
  Time 20: END   (-1) -> Active Rooms = 1
  Time 30: END   (-1) -> Active Rooms = 0

Result: Maximum Rooms Needed = Peak Active = 2!

=== MERGE INTERVALS TIMELINE INVARIANT (SORT BY START) ===
Intervals: [1, 3], [2, 6], [8, 10], [15, 18]

Step 1: Current = [1, 3]
Step 2: Inspect [2, 6]. Since 2 <= 3 -> Overlap! Merge: Current = [1, max(3, 6)] = [1, 6]
Step 3: Inspect [8, 10]. Since 8 > 6 -> Disjoint! Output [1, 6]. New Current = [8, 10]
Step 4: Inspect [15, 18]. Since 15 > 10 -> Disjoint! Output [8, 10]. New Current = [15, 18]
Final Output: [ [1, 6], [8, 10], [15, 18] ]
      `,
      invariant:
        "Timeline Ordering Invariants:\n1. Merge Invariant: Sorting by start time guarantees that interval $i$ can only ever overlap with the active merged prefix interval, eliminating the need to compare against older merged segments.\n2. Sweep Line Invariant: The running prefix sum of start (+1) and end (-1) events precisely tracks the exact physical interval overlap depth at every point along the timeline.",
      stateTransitions:
        "Merge Step: If $s_i \\le E_{\\text{curr}} \\implies E_{\\text{curr}} = \\max(E_{\\text{curr}}, e_i)$; else emit $[S_{\\text{curr}}, E_{\\text{curr}}]$ and set $[S_{\\text{curr}}, E_{\\text{curr}}] = [s_i, e_i]$.\nSweep Step: For each event $(t, \\Delta)$: $\\text{active} += \\Delta; \\text{maxDepth} = \\max(\\text{maxDepth}, \\text{active})$.",
      naiveBottleneck:
        "Pairwise intersection testing requires $\\Theta(N^2)$ comparisons and cannot determine the global maximal overlap depth efficiently.",
      optimalInsight:
        "Sorting coordinates by start time or event timestamp establishes 1D timeline monotonicity, reducing interval operations to $O(N \\log N)$ linear scans.",
    },
  ],
};
