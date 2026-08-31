import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_binary_search_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_binary_search",
      title: "Binary Search Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Median of Two Sorted Arrays",
          problemId: "median-of-two-sorted-arrays",
          difficulty: "Hard",
          description:
            "Given two sorted arrays nums1 and nums2 of size $M$ and $N$ respectively, return the median of the two sorted arrays in strictly $O(\\log(\\min(M, N)))$ time using binary search on the shorter array's partition index.",
          rationale:
            "Evaluates masterclass partition invariant maintenance where left half contains $(M+N+1)/2$ elements.",
        },
        {
          title: "Split Array Largest Sum",
          problemId: "split-array-largest-sum-exact",
          difficulty: "Hard",
          description:
            "Given an integer array nums and an integer $K$, split the array into $K$ non-empty continuous subarrays such that the largest sum of any subarray is minimized. Solve in $O(N \\log(\\sum A))$ time.",
          rationale: "Tests binary search over monotonic feasibility answer spaces.",
        },
        {
          title: "Search in Rotated Sorted Array",
          problemId: "search-in-rotated-sorted-array",
          difficulty: "Medium",
          description:
            "Given an integer array nums sorted in ascending order (with distinct values) that is rotated at an unknown pivot, search for target in $O(\\log N)$ time by identifying which half is strictly sorted.",
          rationale: "Tests invariant preservation across piecewise monotonic intervals.",
        },
        {
          title: "Capacity To Ship Packages Within D Days",
          problemId: "capacity-to-ship-packages",
          difficulty: "Medium",
          description:
            "Find the least ship capacity that will result in all packages being shipped within $D$ days. Solve in $O(N \\log(\\sum W))$ time using monotonic answer-space bisection.",
          rationale: "Demonstrates greedy monotonic verification inside binary search loops.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Information-Theoretic Lower Bound for Comparison Search",
          statement:
            "Prove that any comparison-based search algorithm on a sorted array of $N$ elements requires at least $\\lceil \\log_2(N + 1) \\rceil$ comparisons in the worst case.",
          proofOutline:
            "The algorithm must distinguish between $N + 1$ possible outcomes ($N$ distinct match positions plus 1 not-found outcome). A comparison-based algorithm corresponds to a binary decision tree where each node has at most 2 children. A binary tree with $L = N + 1$ leaves must have height $h \\ge \\lceil \\log_2 L \\rceil = \\lceil \\log_2(N + 1) \\rceil$, proving the information-theoretic optimality of standard binary search.",
          engineeringContext:
            "Proves that binary search is asymptotically optimal in the comparison model.",
        },
        {
          title: "Interpolation Search $O(\\log \\log N)$ Expected Time",
          statement:
            "Prove that for independent uniformly distributed data $U(0, 1)$, Interpolation Search achieves expected time complexity $O(\\log \\log N)$ per query.",
          proofOutline:
            "By properties of uniform order statistics, the position of target $x$ in a sorted array follows a binomial distribution with standard deviation $O(\\sqrt{N})$. The interpolation formula estimates the index with error $\\delta \\le O(\\sqrt{N})$. Each step reduces the search span from $N$ to $O(\\sqrt{N})$. Recurrence $T(N) = T(\\sqrt{N}) + O(1)$ solves to $T(N) = O(\\log \\log N)$.",
          engineeringContext:
            "Used in in-memory database columnar storage scans for uniform numeric keys.",
        },
        {
          title: "Fractional Binary Search Continuous Epsilon Contraction",
          statement:
            "Prove that executing $K = \\lceil \\log_2((B - A)/\\epsilon) \\rceil$ binary search iterations over real interval $[A, B]$ guarantees final interval length $\\le \\epsilon$.",
          proofOutline:
            "In continuous binary search, the interval length after $k$ steps is exactly $(B - A) / 2^k$. Setting $(B - A) / 2^K \\le \\epsilon \\iff 2^K \\ge (B - A)/\\epsilon \\iff K \\ge \\log_2((B - A)/\\epsilon)$. For 64-bit IEEE 754 floats with $B - A = 10^9$ and $\\epsilon = 10^{-12}$, $K = \\lceil \\log_2(10^{21}) \\rceil = 70$ iterations, guaranteeing exact precision.",
          engineeringContext:
            "Critical for 0-1 fractional programming (Dinkelbach's algorithm) and parametric search.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Branchless Eytzinger Array Layout on L1 Cache Lines",
          prompt:
            "How does rearranging a sorted array into the 1-based Eytzinger tree layout eliminate $100\\%$ of CPU branch mispredictions during binary search?",
          engineeringContext:
            "In standard binary search, `if (arr[mid] < target)` mispredicts on $50\\%$ of lookups (15-20 cycle penalty). Eytzinger updates child index branchlessly (`k = (k << 1) | (arr[k] < target)`), replacing conditional jumps with 1-cycle bitwise ALU operations.",
        },
        {
          title: "Software Prefetching (`_mm_prefetch`) in B-Tree Index Seeking",
          prompt:
            "Explain how issuing a software prefetch instruction for child nodes at step $t$ accelerates B-tree index traversal in database query engines.",
          engineeringContext:
            "In an Eytzinger layout, node $k$'s left child is at $2k$. By prefetching `&arr[k * 16]` several iterations ahead, the CPU loads child nodes into L1 cache before the search loop reaches them, hiding DRAM access latency.",
        },
        {
          title: "32-Bit Signed Integer Overflow in Midpoint Formulas",
          prompt:
            "Why did the classical formula `(low + high) / 2` cause silent crashes in large Java and C++ datasets ($N > 2^{30}$), and how does `low + ((high - low) >> 1)` guarantee safety?",
          engineeringContext:
            "When `low + high` exceeds $2^{31} - 1$, 32-bit signed arithmetic wraps to negative values, producing a negative midpoint and throwing out-of-bounds exceptions. `low + ((high - low) >> 1)` guarantees all intermediate terms remain within bounds.",
        },
      ],
      partD_stressTests: [
        {
          title: "Rotated Sorted Array Duplicate Breakdown to $O(N)$",
          scenario:
            "Searching for a target in a rotated array containing $10^5$ identical elements with a single unique value (e.g. `[1, 1, ..., 0, 1]`).",
          failureMode:
            "Because `nums[low] === nums[mid] === nums[high]`, the algorithm cannot determine which half is sorted, forcing linear decrement `low++; high--` and degrading runtime to $O(N)$.",
        },
        {
          title: "Floating-Point Precision Lockup on Continuous Domain Bisection",
          scenario:
            "Using `while (low < high)` on continuous floating-point values where `high - low < 1e-16`.",
          failureMode:
            "Floating-point rounding makes `(low + high) / 2 === low`, preventing the interval from shrinking and triggering an infinite execution loop.",
        },
        {
          title: "Integer Overflow Crash on Massive Unsigned Index Bounds",
          scenario:
            "Binary searching over full unsigned 32-bit index space $[0, 2^{32}-1]$ using standard 32-bit signed integer types.",
          failureMode:
            "Midpoint overflows to negative numbers, triggering memory protection faults or incorrect bisection directions.",
        },
      ],
    },
  ],
};
