import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_sliding_window_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Ring Buffer L1 Cache Residence & Zero-Allocation Packet Processing",
      content:
        "High-throughput packet filtering and high-frequency trading (HFT) stream analytics evaluate sliding window filters across gigabytes of streaming data per second:\n\n1. **Ring Buffer L1 Cache Pinning:** Storing monotonic deque indices in a power-of-two circular ring buffer (`buffer[head & (cap - 1)]`) confines all active deque operations within a single 64-byte L1 cache line for window sizes $K \\le 16$. Memory reads and writes execute with zero TLB misses.\n2. **Flat ASCII Frequency Arrays vs Dynamic Hash Maps:** Using `Map<string, number>` in JavaScript or `std::unordered_map` in C++ incurs hash computation overhead, heap allocation, and pointer chasing on every window shift. Replacing hash maps with a flat `Int32Array(128)` or `Int32Array(256)` executes frequency updates in 1 CPU cycle.\n3. **SIMD Vectorized Window Aggregations:** In fixed-size window summations (e.g. moving averages), AVX2 SIMD instructions process 8 floating-point channels simultaneously using sliding subtract-and-add intrinsics (`_mm256_sub_ps`, `_mm256_add_ps`), quadrupling window evaluation throughput.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Inequality Semantics & Negative Frequency Drift",
      content:
        "1. **Monotonic Deque Back-Popping Inequality Bug:** Using strict `<` instead of non-strict `<=` (`while (nums[deque[tail-1]] < val)`) fails to pop older elements with *identical* values. If an array contains $10^5$ identical elements, the deque grows to size $10^5$, defeating memory bounding.\n2. **Frequency Map Underflow / Negative Drift:** Decrementing a frequency map counter without checking if the character is in the target set causes negative values, corrupting match count indicators (`formed === required`).\n3. **Subarray Counting Off-by-One on Empty Intervals:** When computing $(R - L + 1)$, if no valid window exists (e.g. $L > R$), failing to clamp the calculation to $\\max(0, R - L + 1)$ yields negative counts.\n4. **Expired Index Pop Omission:** Forgetting to pop the front index when `deque[head] < i - k + 1` allows stale maxima from previous windows to persist indefinitely.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Deque-Free Sliding Window Extrema: Block Suffix-Prefix Decomposition",
      content:
        "When hardware environments do not support dynamic deques (e.g. GPU compute shaders or SIMD registers):\n- **Block Partitioning (K-Block Decomposition):** Partition the array into contiguous blocks of size $K$: $[0, K-1], [K, 2K-1], \\dots$. For each block, precompute prefix maximums `prefix_max` (from start to end of block) and suffix maximums `suffix_max` (from end to start of block) in $O(N)$ total time.\n- **O(1) Static Query:** Any window $[i, i + K - 1]$ spans at most two adjacent blocks. The window maximum is computed in **one single comparison**: $\\max(\\text{suffix\\_max}[i], \\text{prefix\\_max}[i + K - 1])$. Requires zero deque queues or branchy while loops.",
    },
    {
      type: "prose",
      title: "Sliding Window Algorithm Selection Matrix",
      content: `
| Window Type | Constraint Nature | Aggregation Mechanism | Time Complexity | Auxiliary Space | Key Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fixed Invertible** | Exact width $K$ | Invertible subtraction | $O(N)$ | $O(1)$ | Moving average, window sum |
| **Monotonic Deque** | Exact width $K$ | Non-invertible extrema | $O(N)$ (amortized) | $O(K)$ | Sliding window max/min |
| **Variable Greedy** | Monotonic constraint | Two-pointer expansion | $O(N)$ | $O(|\\Sigma|)$ | Minimum window substring |
| **AtMost Decomposition** | Non-monotonic exact $K$ | Difference of 2 windows | $O(N)$ | $O(|\\Sigma|)$ | Subarrays with $K$ distinct keys |
| **Two-Stack Queue** | Arbitrary FIFO stream | In/Out monotonic stacks | $O(1)$ amortized | $O(K)$ | Streaming Min/Max queue |
| **Block Decomposition** | Fixed width $K$ | Prefix/Suffix arrays | $O(N)$ prep, $O(1)$ query | $O(N)$ | GPU SIMD window filtering |
      `,
    },
  ],
};
