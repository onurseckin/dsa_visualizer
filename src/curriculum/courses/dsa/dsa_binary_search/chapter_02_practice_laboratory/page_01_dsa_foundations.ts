import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_binary_search_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Binary Search & Bisection Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "split-array-largest-sum",
      title: "Split Array Largest Sum via Binary Search on Answer Space",
      difficulty: "Hard",
      rationale:
        "Implement a Minimax optimization engine: Given an integer array nums and an integer $K$, split the array into $K$ non-empty contiguous subarrays such that the largest sum of any subarray is minimized. Solve in $O(N \\log(\\sum A))$ time by binary searching the monotonic feasibility predicate.",
      starterCode: `/**
 * Split Array Largest Sum Solver
 */

export function splitArray(nums: number[], k: number): number {
  let low = 0;
  let high = 0;

  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > low) low = nums[i]; // Max individual element
    high += nums[i]; // Sum of all elements
  }

  // Monotonic feasibility predicate: Can we partition nums into <= k subarrays with max sum <= targetMax?
  function isPossible(targetMax: number): boolean {
    let subArrayCount = 1;
    let currentSum = 0;

    for (let i = 0; i < nums.length; i++) {
      if (currentSum + nums[i] > targetMax) {
        subArrayCount++;
        currentSum = nums[i];
        if (subArrayCount > k) return false;
      } else {
        currentSum += nums[i];
      }
    }

    return true;
  }

  // Binary search over the answer space [low, high]
  while (low < high) {
    const mid = low + ((high - low) >> 1);
    if (isPossible(mid)) {
      high = mid; // Feasible: try to find a smaller maximum
    } else {
      low = mid + 1; // Infeasible: must increase threshold
    }
  }

  return low;
}`,
    },
  ],
};
