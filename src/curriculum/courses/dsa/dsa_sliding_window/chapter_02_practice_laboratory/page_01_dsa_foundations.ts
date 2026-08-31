import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_sliding_window_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Sliding Window & Monotonic Deque Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "subarrays-with-k-different-integers",
      title: "Subarrays with K Different Integers via AtMost Reduction",
      difficulty: "Hard",
      rationale:
        "Implement a sliding window counter that computes the exact number of contiguous subarrays containing precisely $K$ distinct integers. The solver must apply the algebraic decomposition $\\text{Exactly}(K) = \\text{AtMost}(K) - \\text{AtMost}(K - 1)$ using two linear sliding window passes in strictly $O(N)$ time and $O(N)$ space.",
      starterCode: `/**
 * Subarrays with K Different Integers Solver
 */

export function subarraysWithKDistinct(nums: number[], k: number): number {
  // Helper function to count subarrays with at most k distinct integers in O(N)
  function atMostK(maxDistinct: number): number {
    if (maxDistinct <= 0) return 0;

    const n = nums.length;
    const freq = new Int32Array(n + 1);
    let distinctCount = 0;
    let left = 0;
    let totalSubarrays = 0;

    for (let right = 0; right < n; right++) {
      const val = nums[right];
      if (freq[val] === 0) {
        distinctCount++;
      }
      freq[val]++;

      // Contract left pointer until distinctCount <= maxDistinct
      while (distinctCount > maxDistinct) {
        const leftVal = nums[left];
        freq[leftVal]--;
        if (freq[leftVal] === 0) {
          distinctCount--;
        }
        left++;
      }

      // Add all valid subarrays ending at right index: (right - left + 1)
      totalSubarrays += right - left + 1;
    }

    return totalSubarrays;
  }

  // Exactly(K) = AtMost(K) - AtMost(K - 1)
  return atMostK(k) - atMostK(k - 1);
}`,
    },
  ],
};
