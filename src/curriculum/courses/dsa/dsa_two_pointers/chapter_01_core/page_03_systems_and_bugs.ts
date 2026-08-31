import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_two_pointers_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Hardware Stream Prefetchers, Branch Predictors & CMOV Optimization",
      content:
        "High-speed data streaming kernels (video encoders, search filters) rely on CPU pipeline behavior during two-pointer sweeps:\n\n1. **Dual Hardware Stream Prefetching:** Inward-converging two-pointer scans stream through memory from both ends ($0 \\to N/2$ and $N-1 \\to N/2$). Modern CPU L1/L2 data prefetchers track up to 16 independent forward and backward stream strides simultaneously, pre-loading 64-byte cache lines before instructions execute.\n2. **Branch Predictor Penalties in Partitioning:** Conditional branches (`if (nums[mid] == 0)`) on unsorted data have unpredictable branch outcomes, causing up to $50\\%$ mispredictions (each incurring a 15-20 cycle pipeline flush). High-performance compilers lower ternary pointer increments to branchless **Conditional Move (CMOV)** and bitwise arithmetic instructions.\n3. **Pointer Aliasing & Restricted Pointers:** When processing two separate arrays (`src` and `dst`), declaring pointers as `restrict` in C/C++ or using separate non-overlapping TypedArrays in JavaScript prevents the compiler from assuming memory aliasing, unlocking automatic SIMD vectorization.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Aliasing Bugs & Premature Index Increments",
      content:
        "1. **Dutch National Flag High-Swap `mid` Advancement Bug:** Swapping `nums[mid]` with `nums[high]` brings an *unexamined* element into index `mid`. Advancing `mid++` immediately after this swap skips inspecting the newly placed element, causing unsorted arrays.\n2. **3-Sum Duplicate Skipping Off-by-One:** When skipping duplicates (`while (nums[L] === nums[L+1]) L++`), forgetting the trailing `L++` outside the loop leaves the pointer on the last duplicate, triggering infinite loops or duplicate triplet outputs.\n3. **Integer Overflow in Sum Evaluation:** In 2-Sum with large 32-bit signed integers ($> 10^9$), computing `nums[L] + nums[R]` can exceed `2^31 - 1`, causing integer wraparound to negative values. Always use 64-bit integers or rewrite `nums[L] + nums[R] == Target` as `nums[L] == Target - nums[R]`.\n4. **Strict vs Non-Strict Termination Boundaries:** In binary-search-like two-pointer scans, using `left <= right` when finding distinct pairs permits $L = R$, erroneously evaluating the same array element twice.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "The 3-SUM Conjecture & Fine-Grained Complexity",
      content:
        "In fine-grained computational complexity:\n- **The 3-SUM Conjecture (Gajentaan & Overmars 1995):** Postulates that no algorithm can solve the 3-SUM problem (deciding if there exist $a, b, c \\in S$ such that $a + b + c = 0$) in $O(N^{2 - \\epsilon})$ time for any $\\epsilon > 0$.\n- **3-SUM Hardness Reductions:** Hundreds of fundamental geometric and graph problems—including polygon containment, collinear point detection, and dynamic shortest paths—have been proven to be **3-SUM-hard**. The two-pointer $O(N^2)$ algorithm is provably optimal under standard computational complexity assumptions.",
    },
    {
      type: "prose",
      title: "Two-Pointer Strategy Comparison Matrix",
      content: `
| Technique | Direction | Precondition | Time Complexity | Auxiliary Space | Key Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Opposing 2-Sum** | Inward ($L \\to, \\leftarrow R$) | Sorted array | $O(N)$ | $O(1)$ | Pair sum search, Container With Most Water |
| **Co-Directional (Fast/Slow)** | Same ($F \\to, S \\to$) | Topology/Graph | $O(N)$ | $O(1)$ | Floyd's cycle detection, in-place removal |
| **3-Pointer Partition (DNF)** | Inward + Forward | Categorical keys | $O(N)$ (1 pass) | $O(1)$ | Dutch National Flag, QuickSort 3-way partition |
| **Opposing Trapping Water** | Inward ($L \\to, \\leftarrow R$) | Unsorted heights | $O(N)$ | $O(1)$ | Elevation profile water capacity |
| **Sorted 3-Sum** | Pivot + Opposing | Sorted array | $O(N^2)$ | $O(1)$ | Triplet sum target finding |
| **Quickselect** | Randomized Partition | Unsorted array | $O(N)$ average | $O(1)$ | $K$-th Order Statistic selection |
      `,
    },
  ],
};
