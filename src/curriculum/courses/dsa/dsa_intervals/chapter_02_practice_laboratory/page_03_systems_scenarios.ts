import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_intervals_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_intervals",
      title: "Intervals Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Meeting Rooms II (Interval Partitioning)",
          problemId: "meeting-rooms-ii",
          difficulty: "Medium",
          description:
            "Given an array of meeting time intervals intervals where intervals[i] = [start_i, end_i], return the minimum number of conference rooms required in $O(N \\log N)$ time using a 2-pointer event sweep line.",
          rationale: "Evaluates sweep-line event decomposition and maximum depth tracking.",
        },
        {
          title: "Non-overlapping Intervals",
          problemId: "non-overlapping-intervals",
          difficulty: "Medium",
          description:
            "Given an array of intervals, find the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping. Solve in $O(N \\log N)$ time using Greedy Earliest Finish Time.",
          rationale: "Tests greedy exchange choice by sorting by end times.",
        },
        {
          title: "Merge Intervals",
          problemId: "merge-intervals-standard",
          difficulty: "Medium",
          description:
            "Given an array of intervals, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input in $O(N \\log N)$ time.",
          rationale: "Tests timeline continuity extension by sorting by start times.",
        },
        {
          title: "Insert Interval",
          problemId: "insert-interval-sorted",
          difficulty: "Medium",
          description:
            "Insert newInterval into intervals (sorted by start time in ascending order) such that intervals is still sorted and non-overlapping. Solve in strictly $O(N)$ linear time without re-sorting.",
          rationale:
            "Tests 3-phase linear interval scanning: strictly left, overlapping merge, strictly right.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Interval Graph Perfectness ($\\chi(G) = \\omega(G)$)",
          statement:
            "Prove that every Interval Graph $G$ (an intersection graph of 1D intervals) is a Perfect Graph, meaning the chromatic number $\\chi(H)$ equals the maximum clique size $\\omega(H)$ for every induced subgraph $H \\subseteq G$.",
          proofOutline:
            "Greedy coloring of intervals sorted by start time assigns each interval the lowest available color not used by overlapping predecessors. At the step an interval is assigned color $k$, it overlaps with $k - 1$ intervals assigned colors $1, \\dots, k-1$. All $k$ intervals pairwise overlap at the start timestamp, forming a clique of size $k$. Thus, total colors used $\\chi(G) \\le \\omega(G)$. Since $\\chi(G) \\ge \\omega(G)$ always, $\\chi(G) = \\omega(G)$, proving perfectness.",
          engineeringContext:
            "Guarantees that register allocation in compilers (Chaitin's algorithm) is exact on basic blocks.",
        },
        {
          title: "Klee's Measure Segment Tree Complexity Bound",
          statement:
            "Prove that Klee's Measure problem in 1D (length of the union of $N$ intervals) is solved in $O(N \\log N)$ time via sweep-line and $O(N)$ with integer coordinates.",
          proofOutline:
            "Deconstruct intervals into $2N$ start and end events. Sorting all events takes $O(N \\log N)$. Sweeping across the timeline, maintain a counter $C$ of active intervals covering the current segment. If $C > 0$, add $(t_{i+1} - t_i)$ to total measure. Total sweep time is $\\Theta(N)$, yielding total runtime $\\Theta(N \\log N)$.",
          engineeringContext:
            "Core algorithm in VLSI design rule checking (DRC) and CAD geometric analysis.",
        },
        {
          title: "Interval Boundary Overlap Transitivity Invariants",
          statement:
            "Prove that for any three intervals $A = [s_A, e_A], B = [s_B, e_B], C = [s_C, e_C]$ sorted by start time ($s_A \\le s_B \\le s_C$), if $A$ does not overlap with $B$ ($e_A < s_B$), then $A$ cannot overlap with $C$.",
          proofOutline:
            "Because intervals are sorted by start time, $s_B \\le s_C$. If $A$ does not overlap with $B$, then $e_A < s_B$. By transitivity of real inequality, $e_A < s_B \\le s_C \\implies e_A < s_C$, meaning $A$ and $C$ are disjoint. This proves that once an interval is disjoint from the current merged interval, all subsequent intervals are also disjoint.",
          engineeringContext:
            "Enables 1-pass linear scanning after sorting, eliminating quadratic back-checking.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Struct-of-Arrays (SoA) vs Array-of-Arrays Memory Layout",
          prompt:
            "Why does representing $10^6$ intervals as two `Int32Array` buffers execute $4\\times$ faster than an array of JavaScript arrays (`number[][]`)?",
          engineeringContext:
            "`number[][]` allocates $10^6$ distinct heap objects with pointer indirection and GC tracking. Two flat `Int32Array` buffers pack 16 timestamps per 64-byte L1 cache line, streaming coordinates directly through hardware memory controllers.",
        },
        {
          title: "Linear-Time Radix Sort on Discrete Millisecond Timestamps",
          prompt:
            "How does using Radix Sort on discrete 32-bit integer timestamps reduce interval sorting time from $O(N \\log N)$ to $O(N)$ in financial trade matching engines?",
          engineeringContext:
            "Comparison-based quicksort has $\\Omega(N \\log N)$ lower bound. Radix sort performs 4 passes of 8-bit counting sort in flat contiguous memory, sorting $10^7$ trade intervals in $< 15$ milliseconds.",
        },
        {
          title: "End-Before-Start Sweep Event Sorting Invariant",
          prompt:
            "In half-open intervals $[s_i, e_i)$, why must sweep line tie-breaking process END events before START events at identical timestamps?",
          engineeringContext:
            "If meeting A ends at 10 and meeting B starts at 10, processing START first temporarily increases active room count to 2 before dropping to 1. Processing END first decrements room count to 0, correctly reusing the room.",
        },
      ],
      partD_stressTests: [
        {
          title: "Start vs End Sorting Inversion Fallacy in Interval Scheduling",
          scenario:
            "Sorting by Start Time in Non-overlapping Intervals on input `[[1, 100], [2, 3], [4, 5]]`.",
          failureMode:
            "The greedy algorithm chooses `[1, 100]`, forcing the removal of 2 intervals instead of the optimal 1 interval removal.",
        },
        {
          title: "Inclusive vs Exclusive Boundary Timestamp Collision",
          scenario:
            "Processing closed intervals `[1, 5]` and `[5, 10]` using half-open comparator logic.",
          failureMode:
            "The algorithm assumes meetings ending at 5 and starting at 5 do not overlap, failing to detect collision in closed temporal models.",
        },
        {
          title: "Default JavaScript String Lexicographical Sorting Bug",
          scenario:
            "Sorting intervals using `intervals.sort()` without a numerical comparator `(a, b) => a[0] - b[0]` on `[[10, 20], [2, 5]]`.",
          failureMode:
            'V8 sorts lexicographically: `"10" < "2"`, placing `[10, 20]` before `[2, 5]` and destroying interval timeline invariants.',
        },
      ],
    },
  ],
};
