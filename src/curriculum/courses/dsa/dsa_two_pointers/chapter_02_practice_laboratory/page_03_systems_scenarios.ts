import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_two_pointers_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_two_pointers",
      title: "Two Pointers Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "3Sum Closest (Target Minimization)",
          problemId: "3sum-closest",
          difficulty: "Medium",
          description:
            "Given an integer array nums of length $N$ and an integer target, find three integers in nums such that the sum is closest to target. Solve in $O(N^2)$ time and $O(1)$ auxiliary space using sorted pivot sweeps and opposing two-pointers.",
          rationale:
            "Evaluates continuous tracking of minimal absolute difference during monotonic inward sweeps.",
        },
        {
          title: "Sort Colors (Dutch National Flag Partitioning)",
          problemId: "sort-colors-dutch-national-flag",
          difficulty: "Medium",
          description:
            "Given an array containing $N$ objects colored red (0), white (1), or blue (2), sort them in-place in strictly a single pass using the 3-pointer Dutch National Flag algorithm.",
          rationale:
            "Tests rigorous multi-region boundary invariant maintenance (`low, mid, high`).",
        },
        {
          title: "Trapping Rain Water via Opposing Pointers",
          problemId: "trapping-rain-water-two-pointer",
          difficulty: "Hard",
          description:
            "Compute the total volume of trapped water across an elevation profile in strictly $O(N)$ time and $O(1)$ auxiliary memory by maintaining running boundary maxima with inward-converging pointers.",
          rationale:
            "Demonstrates dynamic water column height calculation on the fly without array allocations.",
        },
        {
          title: "Find the Duplicate Number via Floyd's Cycle Detection",
          problemId: "find-the-duplicate-number-floyd",
          difficulty: "Hard",
          description:
            "Given an array of $N+1$ integers where each integer is between $1$ and $N$, find the duplicate number without modifying the array and using only $O(1)$ extra space by modeling array indices as a functional graph with Floyd's cycle detection.",
          rationale:
            "Tests abstract reduction of array indexing $i \\to nums[i]$ to functional graph cycle extraction.",
        },
      ],
      partB_mathProofs: [
        {
          title: "3-SUM Hardness Reduction to Point-on-3-Lines",
          statement:
            "Prove that the 3-SUM problem ($a + b + c = 0$) is polynomial-time equivalent to the Point-on-3-Lines geometric problem (determining whether there exists a straight line intersecting three horizontal lines at $y=0, y=1, y=2$ on points from sets $A, B, C$).",
          proofOutline:
            "Map sets $A, B, C$ to points on lines $y=0, y=1, y=2$ as $(a, 0), (b, 1), (c, 2)$. Three points are collinear if and only if the midpoint of $(a, 0)$ and $(c, 2)$ is $(b, 1)$, which occurs if and only if $\\frac{a + c}{2} = b \\iff a - 2b + c = 0$. This linear mapping preserves 3-SUM structure, proving 3-SUM hardness for collinear point detection.",
          engineeringContext:
            "Proves the theoretical impossibility of sub-quadratic $O(N^{2-\\epsilon})$ algorithms for foundational geometric intersection problems.",
        },
        {
          title: "Hoare Partition Correctness & Pivot Invariant",
          statement:
            "Prove that Hoare's two-pointer partitioning algorithm terminates with index $j$ such that all elements in $A[0 \\dots j] \\le \\text{pivot}$ and all elements in $A[j+1 \\dots n-1] \\ge \\text{pivot}$ in strictly $O(N)$ time.",
          proofOutline:
            "Pointers $i$ and $j$ start at opposite ends and move toward each other. Invariant: before each swap, $A[k] \\le \\text{pivot}$ for all $k < i$, and $A[k] \\ge \\text{pivot}$ for all $k > j$. Swapping $A[i]$ and $A[j]$ restores the invariant. Pointers cross when $i \\ge j$, guaranteeing that the split point $j$ partitions the array into two valid subsets.",
          engineeringContext:
            "Forms the inner kernel of QuickSort and Quickselect in C++ `std::sort` (Introsort).",
        },
        {
          title: "Monotonic Trapping Water Envelope Invariant",
          statement:
            "Prove that the volume of water trapped above index $i$ is uniquely determined by $\\max(0, \\min(\\max_{k \\le i} H[k], \\max_{k \\ge i} H[k]) - H[i])$.",
          proofOutline:
            "Water at column $i$ cannot spill to the left as long as water level $\\le \\max_{k \\le i} H[k]$, and cannot spill to the right as long as water level $\\le \\max_{k \\ge i} H[k]$. By Pascal's principle of communicating vessels, the surface level stabilizes at $\\min(\\text{left\\_max}, \\text{right\\_max})$. Subtracting the solid terrain height $H[i]$ gives the net water column.",
          engineeringContext:
            "Applied in computer graphics hydrological terrain erosion simulators.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Dual Hardware Stream Prefetchers on Opposing Pointer Inward Sweeps",
          prompt:
            "How do modern CPU L1/L2 data stream prefetchers maintain full bandwidth saturation when processing inward-converging pointers from opposite ends of a large 100 MB array?",
          engineeringContext:
            "CPUs contain multiple hardware prefetch stream units. One prefetcher tracks the forward stride ($L \\to L+1$), while an independent unit tracks the reverse stride ($R \\to R-1$), ensuring both memory frontiers remain resident in L1 cache.",
        },
        {
          title: "Branchless Conditional Move (CMOV) in Array Partitioning",
          prompt:
            "Why does rewriting ternary branch statements into branchless conditional moves (`cmov`) accelerate two-pointer array partitioning on random data?",
          engineeringContext:
            "Random data causes branch predictors to mispredict with $\\approx 50\\%$ probability (15-20 cycle penalty per branch). CMOV executes unconditionally in 1 cycle, replacing pipeline flushes with constant-latency execution.",
        },
        {
          title: "Pointer Aliasing Barriers (`__restrict__`) in Two-Pointer Loops",
          prompt:
            "Explain how the `__restrict__` pointer qualifier in C/C++ prevents compiler reload stalls during simultaneous read/write two-pointer compaction loops.",
          engineeringContext:
            "Without `restrict`, the compiler assumes writing to `*dst++` might modify memory read by `*src++`. This forces memory reload on every step, disabling SIMD vectorization.",
        },
      ],
      partD_stressTests: [
        {
          title: "Dutch National Flag High-Swap `mid` Advancement Bug",
          scenario:
            "Executing Dutch National Flag where `mid++` is executed immediately following `swap(nums[mid], nums[high])`.",
          failureMode:
            "The unexamined element swapped from `high` into `mid` is skipped, leaving blue elements (2) stranded in the middle of the array.",
        },
        {
          title: "3-Sum Duplicate Skipping Off-by-One Infinite Loop",
          scenario:
            "Skipping duplicates via `while (nums[L] === nums[L+1]) L++` without an additional increment step when pointers match.",
          failureMode:
            "The pointer remains stuck on identical duplicate values, generating infinite execution loops or duplicate output triplets.",
        },
        {
          title: "Integer Overflow in 2-Sum Large Bounds",
          scenario:
            "Evaluating `nums[left] + nums[right] < target` where `nums[left] = -2*10^9` and `nums[right] = -2*10^9` using 32-bit signed integers.",
          failureMode:
            "Integer underflow wraps to positive numbers, corrupting the monotonic comparison and returning incorrect search directions.",
        },
      ],
    },
  ],
};
