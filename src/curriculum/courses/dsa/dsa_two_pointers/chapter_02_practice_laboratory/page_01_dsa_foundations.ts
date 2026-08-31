import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_two_pointers_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Two-Pointer Convergence & Partition Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "trapping-rain-water-two-pointer",
      title: "Trapping Rain Water via Opposing Inward Pointers",
      difficulty: "Hard",
      rationale:
        "Implement Trapping Rain Water in strictly $O(N)$ linear time and $O(1)$ auxiliary space. The algorithm tracks `left_max` and `right_max` boundaries using two inward-converging pointers, computing the trapped water volume above each cell dynamically without allocating prefix/suffix arrays.",
      starterCode: `/**
 * Trapping Rain Water via Two Pointers
 */

export function trapRainWater(height: number[]): number {
  const n = height.length;
  if (n <= 2) return 0;

  let left = 0;
  let right = n - 1;
  let leftMax = 0;
  let rightMax = 0;
  let totalWater = 0;

  while (left < right) {
    if (height[left] <= height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        totalWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        totalWater += rightMax - height[right];
      }
      right--;
    }
  }

  return totalWater;
}`,
    },
  ],
};
