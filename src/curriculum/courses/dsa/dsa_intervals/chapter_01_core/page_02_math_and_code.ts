import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_intervals_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Optimality of Earliest End Time Scheduling via Exchange Argument",
      theorem:
        "The greedy algorithm that iteratively selects the compatible interval with the earliest finish time produces a maximum-size set of mutually disjoint intervals in $O(N \\log N)$ time.",
      proof: `
**Proof via the Greedy Exchange Argument:**
1. Let $\\mathcal{G} = (g_1, g_2, \\dots, g_k)$ be the sequence of intervals selected by the greedy algorithm in chronological order of finish times ($e(g_1) \\le e(g_2) \\le \\dots \\le e(g_k)$).
2. Let $\\mathcal{O} = (o_1, o_2, \\dots, o_m)$ be an arbitrary optimal schedule sorted by finish times ($e(o_1) \\le e(o_2) \\le \\dots \\le e(o_m)$) with maximal cardinality $m$.
3. **Lemma:** For all $r \\in \\{1, 2, \\dots, k\\}$, $e(g_r) \\le e(o_r)$.
   - **Base Case ($r = 1$):**
     - The greedy algorithm selects $g_1$ as the interval with the globally minimal finish time among all candidate intervals.
     - Therefore, $e(g_1) \\le e(o_1)$. Base case holds.
   - **Inductive Step:** Assume $e(g_{r-1}) \\le e(o_{r-1})$ for some $r > 1$.
     - Since $\\mathcal{O}$ is a valid disjoint schedule, interval $o_r$ starts after $o_{r-1}$ finishes: $s(o_r) \\ge e(o_{r-1})$.
     - By the inductive hypothesis, $e(o_{r-1}) \\ge e(g_{r-1})$, which implies $s(o_r) \\ge e(g_{r-1})$.
     - Thus, interval $o_r$ is compatible with $g_{r-1}$ and was an eligible candidate when the greedy algorithm chose $g_r$.
     - Because greedy chooses the compatible interval with the earliest finish time, it must be that $e(g_r) \\le e(o_r)$.
   - The lemma is established for all $r \\le k$.
4. **Cardinality Optimality ($k = m$):**
   - Suppose for contradiction that $k < m$.
   - By the lemma for $r = k$, $e(g_k) \\le e(o_k)$.
   - Because $m > k$, there exists an interval $o_{k+1} \\in \\mathcal{O}$ with $s(o_{k+1}) \\ge e(o_k) \\ge e(g_k)$.
   - Therefore, $o_{k+1}$ is compatible with $g_k$, meaning candidate intervals remained after choosing $g_k$.
   - But the greedy algorithm only terminates when no compatible intervals remain, a contradiction.
5. Hence, $k = m$, proving that the greedy schedule $\\mathcal{G}$ has optimal maximum cardinality. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Interval Partitioning Lower Bound & Chromatic Equivalence",
      theorem:
        "The minimum number of resources (rooms) required to partition a set of intervals without overlap equals the maximum overlapping depth $D = \\max_{t} |\\{ i \\mid s_i \\le t < e_i \\}|$. Furthermore, the Greedy Start-Time algorithm with a Min-Heap allocates exactly $D$ rooms in $O(N \\log N)$ time.",
      proof: `
**Proof via Interval Graph Perfectness & Greedy Min-Heap Invariant:**
1. **Lower Bound:**
   - Let $t^*$ be the point on the timeline with maximal overlap depth $D$.
   - There exist $D$ mutually overlapping intervals covering $t^*$.
   - Since all $D$ intervals pairwise overlap at $t^*$, no two of these intervals can share the same resource.
   - Therefore, any valid schedule requires at least $D$ distinct rooms: $\\text{Rooms}_{\\min} \\ge D$.
2. **Upper Bound (Greedy Min-Heap Correctness):**
   - Sort all intervals by start time: $s_1 \\le s_2 \\le \\dots \\le s_N$.
   - Process intervals sequentially. When considering interval $i$:
     - The algorithm examines the room with the earliest ending interval currently assigned (top of Min-Heap).
     - If that earliest end time $e_{\\min} \\le s_i$, interval $i$ reuses that existing room without increasing total room count.
     - If $e_{\\min} > s_i$, every currently active room is occupied by an interval that ends after $s_i$.
   - Suppose allocating interval $i$ creates room number $k + 1$.
   - This means at time $s_i$, interval $i$ overlaps with intervals currently occupying all $k$ previously opened rooms.
   - Together with interval $i$, there are $k + 1$ intervals overlapping at time $s_i$.
   - By definition of maximal depth $D$, we must have $k + 1 \\le D$.
3. Therefore, the greedy algorithm never opens more than $D$ rooms, achieving $\\text{Rooms} = D = \\text{Rooms}_{\\min}$.
4. In graph theoretic terms, for any Interval Graph $G$, the chromatic number equals the maximum clique size: $\\chi(G) = \\omega(G) = D$, proving interval graphs are **Perfect Graphs**. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive O(N^2) Pairwise Overlap Check Baseline",
          code: `export function eraseOverlapIntervalsNaive(intervals: number[][]): number {
  const n = intervals.length;
  // Sort by start time
  intervals.sort((a, b) => a[0] - b[0]);

  // DP table: dp[i] = max non-overlapping intervals ending at i
  const dp = new Int32Array(n).fill(1);
  let maxKeep = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (intervals[j][1] <= intervals[i][0]) {
        if (dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
      }
    }
    if (dp[i] > maxKeep) maxKeep = dp[i];
  }

  return n - maxKeep;
}`,
          explanation:
            "Quadratic dynamic programming check. Comparing all pairs of intervals takes $\\Theta(N^2)$ time, failing for $N > 10^4$.",
          timeComplexity: "O(N^2)",
          spaceComplexity: "O(N)",
        },
        {
          label: "Stage 2: Greedy Earliest End Time Scheduler & Merge Intervals",
          code: `export class IntervalAlgorithms {
  // Erase Overlapping Intervals (Max Disjoint Set): O(N log N) time, O(1) space
  public static eraseOverlapIntervals(intervals: number[][]): number {
    if (intervals.length <= 1) return 0;

    // Greedy choice: Sort by END time
    intervals.sort((a, b) => a[1] - b[1]);

    let countRemoved = 0;
    let prevEnd = intervals[0][1];

    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i][0] < prevEnd) {
        countRemoved++; // Overlap detected: greedily discard interval with larger end time
      } else {
        prevEnd = intervals[i][1];
      }
    }

    return countRemoved;
  }

  // Merge Overlapping Intervals: O(N log N) time
  public static merge(intervals: number[][]): number[][] {
    if (intervals.length <= 1) return intervals;

    // Sort by START time
    intervals.sort((a, b) => a[0] - b[0]);

    const merged: number[][] = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const curr = intervals[i];
      const last = merged[merged.length - 1];

      if (curr[0] <= last[1]) {
        // Overlap: extend existing interval boundary
        if (curr[1] > last[1]) last[1] = curr[1];
      } else {
        merged.push(curr);
      }
    }

    return merged;
  }
}`,
          explanation:
            "Stage 2 demonstrates the fundamental greedy dualities: sorting by end time maximizes disjoint intervals, while sorting by start time cleanly merges overlapping continuous spans in $O(N \\log N)$ time.",
          timeComplexity: "O(N log N) from sorting",
          spaceComplexity: "O(N) for merged output",
        },
        {
          label: "Stage 3: High-Performance Flat 2-Pass Event Sweep Line Engine",
          code: `export class FastSweepLineEngine {
  // Meeting Rooms II / Interval Partitioning: Strictly O(N log N) with flat TypedArrays
  public static minMeetingRooms(intervals: number[][]): number {
    const n = intervals.length;
    if (n <= 1) return n;

    const starts = new Int32Array(n);
    const ends = new Int32Array(n);

    for (let i = 0; i < n; i++) {
      starts[i] = intervals[i][0];
      ends[i] = intervals[i][1];
    }

    // Sort starts and ends independently in contiguous L1 cache memory
    starts.sort();
    ends.sort();

    let rooms = 0;
    let endPtr = 0;

    for (let startPtr = 0; startPtr < n; startPtr++) {
      if (starts[startPtr] < ends[endPtr]) {
        // A new meeting starts before the earliest meeting finishes: allocate room
        rooms++;
      } else {
        // Meeting finishes: reuse existing room
        endPtr++;
      }
    }

    return rooms;
  }
}`,
          explanation:
            "Stage 3 extracts start and end timestamps into two flat contiguous `Int32Array` buffers. Sorting them independently enables a 2-pointer event sweep line with zero heap object allocations and hardware stream prefetching across L1 cache lines.",
          timeComplexity: "O(N log N) sorting + O(N) sweep",
          spaceComplexity: "Flat TypedArrays, zero GC allocations",
        },
      ],
      stepByStep: [
        "Select the correct sorting criterion: sort by **End Time** for maximization of disjoint intervals; sort by **Start Time** for merging/partitioning.",
        "For interval merging, maintain active boundary $[S, E]$ and extend $E = \\max(E, e_i)$ when $s_i \\le E$.",
        "For interval partitioning, deconstruct into sorted start and end arrays and sweep using two pointers to compute maximal overlapping depth $D$.",
      ],
    },
  ],
};
