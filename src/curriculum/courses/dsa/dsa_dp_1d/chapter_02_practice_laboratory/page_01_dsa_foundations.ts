import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_dp_1d_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: 1D Dynamic Programming Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "longest-increasing-subsequence-patience",
      title: "Longest Increasing Subsequence via Patience Sorting",
      difficulty: "Medium",
      rationale:
        "Implement Longest Increasing Subsequence (LIS) in strictly $O(N \\log N)$ time and $O(N)$ space. The algorithm maintains a monotonic increasing tails array, finding the insertion pile for each element via binary search.",
      starterCode: `/**
 * Longest Increasing Subsequence (Patience Sorting) Solver
 */

export function lengthOfLIS(nums: number[]): number {
  const n = nums.length;
  if (n === 0) return 0;

  // tails[i] stores the smallest tail of all increasing subsequences of length i + 1
  const tails: number[] = [];

  for (let i = 0; i < n; i++) {
    const x = nums[i];
    let left = 0;
    let right = tails.length;

    // Binary search lower_bound: find first element in tails >= x
    while (left < right) {
      const mid = (left + right) >> 1;
      if (tails[mid] >= x) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    // If x is greater than all existing tails, create a new pile
    if (left === tails.length) {
      tails.push(x);
    } else {
      tails[left] = x; // Greedily decrease the tail value of length (left + 1)
    }
  }

  return tails.length;
}`,
    },
  ],
};
