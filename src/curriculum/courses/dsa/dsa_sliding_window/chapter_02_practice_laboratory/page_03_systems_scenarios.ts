import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_sliding_window_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_sliding_window",
      title: "Sliding Window Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Sliding Window Maximum via Monotonic Deque",
          problemId: "sliding-window-maximum-deque",
          difficulty: "Hard",
          description:
            "Given an array of integers and a sliding window of size $K$, return the max sliding window values in strictly $O(N)$ time and $O(K)$ auxiliary space using a Monotonic Double-Ended Queue.",
          rationale:
            "Evaluates mastery over non-invertible window extrema tracking and monotonic pruning.",
        },
        {
          title: "Minimum Window Substring",
          problemId: "minimum-window-substring-exact",
          difficulty: "Hard",
          description:
            "Given strings $S$ and $T$, find the minimum window in $S$ which contains all the characters in $T$ in $O(|S| + |T|)$ time and $O(1)$ auxiliary memory using variable-size sliding windows and a 128-byte ASCII table.",
          rationale: "Tests two-pointer constraint satisficing and window contraction logic.",
        },
        {
          title: "Subarrays with K Different Integers",
          problemId: "subarrays-with-k-different-integers",
          difficulty: "Hard",
          description:
            "Count the exact number of contiguous subarrays containing exactly $K$ distinct integers by decomposing into two monotonic sliding window passes: $\\text{AtMost}(K) - \\text{AtMost}(K-1)$ in $O(N)$ time.",
          rationale:
            "Demonstrates transformation of non-monotonic exact constraints into monotonic difference evaluations.",
        },
        {
          title: "Longest Repeating Character Replacement",
          problemId: "longest-repeating-character-replacement",
          difficulty: "Medium",
          description:
            "Given a string $S$ and an integer $K$, find the length of the longest substring containing the same letter after replacing at most $K$ characters. Solve in $O(N)$ time by maintaining the max frequency character in the active window.",
          rationale:
            "Tests non-shrinking window invariant maintenance where window size only increases.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Prefix-Suffix Block Decomposition Correctness Invariant",
          statement:
            "Prove that for any array $A$ partitioned into blocks of size $K$, the maximum in any window $[i, i + K - 1]$ is $\\max(\\text{suffix\\_max}[i], \\text{prefix\\_max}[i + K - 1])$.",
          proofOutline:
            "Any window of length $K$ starting at index $i$ either aligns with a block boundary or spans the boundary between block $B_m$ and $B_{m+1}$. The elements in block $B_m$ covered by the window are $A[i \\dots (m+1)K - 1]$, whose maximum is precisely $\\text{suffix\\_max}[i]$. The elements in block $B_{m+1}$ covered by the window are $A[(m+1)K \\dots i + K - 1]$, whose maximum is precisely $\\text{prefix\\_max}[i + K - 1]$. The overall window maximum is the maximum of these two disjoint segments.",
          engineeringContext:
            "Used in SIMD/GPU shader kernels where dynamic deque branch divergence is forbidden.",
        },
        {
          title: "Monotonic Deque Front-Extremum Invariant",
          statement:
            "Prove that in a Monotonic Deque maintaining strictly decreasing element values ($A[d_1] > A[d_2] > \\dots$), the front element $d_1$ is guaranteed to be the maximum element in the active window $[R - K + 1, R]$.",
          proofOutline:
            "Induction on right endpoint $R$. Any element $A[j]$ ($j < R$) smaller than $A[R]$ can never be the maximum of any future window containing $A[R]$ (since $A[R]$ is both larger and expires later than $A[j]$). Pruning all elements $\\le A[R]$ preserves all potential future maxima. Expiring elements older than $R - K + 1$ ensures all remaining indices belong to the window, with the front index being the maximal value.",
          engineeringContext:
            "Foundational for $O(N)$ convex hull trick optimizations and moving extrema filters.",
        },
        {
          title: "Sliding Window Median Dual-Heap Balancing Invariant",
          statement:
            "Prove that maintaining two balanced heaps (max-heap for lower half, min-heap for upper half) with lazy deletion preserves exact median queries in $O(\\log K)$ time per window slide.",
          proofOutline:
            "The heaps maintain size invariant $|\\text{low}| = |\\text{high}|$ or $|\\text{low}| = |\\text{high}| + 1$, and order invariant $\\max(\\text{low}) \\le \\min(\\text{high})$. Incoming elements are inserted into the appropriate heap. Outgoing elements are recorded in a lazy deletion hash map. Whenever an expired element reaches the top of either heap, it is popped, restoring the true active top.",
          engineeringContext:
            "Critical for real-time anomaly detection in network latency monitoring pipelines.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Circular Ring Buffer Memory Layout on 64-Byte Cache Lines",
          prompt:
            "Why does implementing a monotonic deque using a power-of-two circular buffer array execute with zero cache misses for window sizes $K \\le 16$?",
          engineeringContext:
            "A ring buffer of 16 32-bit integer indices consumes exactly $16 \\times 4 = 64$ bytes, fitting perfectly into a single L1 data cache line. Bitwise masking (`head & (cap - 1)`) eliminates division instructions.",
        },
        {
          title: "AVX2 SIMD Vectorization of Fixed-Window Moving Averages",
          prompt:
            "Explain how AVX2 instructions vectorize moving average calculations across 8 parallel data streams simultaneously.",
          engineeringContext:
            "Sliding sum updates ($S_{t+1} = S_t + X_{t+1} - X_{t-K+1}$) are data-parallel across independent channels. AVX2 computes 8 stream updates per cycle using `_mm256_add_ps` and `_mm256_sub_ps`.",
        },
        {
          title: "Zero-Allocation Flat ASCII Frequency Maps vs Heap Maps",
          prompt:
            "Why does a static `Int32Array(128)` outperform a hash map (`Map<string, number>`) by over $1000\\%$ in sliding window substring searches?",
          engineeringContext:
            "A static array requires zero heap allocation, zero hashing, and zero garbage collection. Indexing by character code (`s.charCodeAt(i)`) compiles to a direct memory offset read in 1 cycle.",
        },
      ],
      partD_stressTests: [
        {
          title: "Monotonic Deque Memory Bloat on Strict Inequality",
          scenario:
            "Using strict `<` instead of `<=` in monotonic deque back pruning (`while (nums[back] < val)`) on an array of $10^5$ identical elements.",
          failureMode:
            "Identical elements are never pruned from the back, causing the deque to grow to size $10^5$ and consuming $O(N)$ memory instead of $O(K)$.",
        },
        {
          title: "Frequency Map Negative Drift on Out-of-Target Characters",
          scenario:
            "Decrementing frequency map counts during window contraction without verifying whether the character is part of target string $T$.",
          failureMode:
            "Frequency counters become negative, corrupting the match completion indicator (`formed === required`) and missing valid windows.",
        },
        {
          title: "Empty Window Negative Count Off-by-One",
          scenario:
            "Calculating valid subarrays via $(R - L + 1)$ when no valid window exists ($L > R$) without bounding by zero.",
          failureMode:
            "Adds negative numbers to the cumulative subarray count, corrupting the final answer.",
        },
      ],
    },
  ],
};
