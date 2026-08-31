import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_dp_2d_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Multi-Dimensional Optimization Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "burst-balloons-interval-dp",
      title: "Burst Balloons: Optimal Interval Factorization",
      difficulty: "Hard",
      rationale:
        "Implement optimal interval dynamic programming to solve the Burst Balloons problem: Given $N$ balloons with values $nums$, bursting balloon $k$ yields $nums[left] \\times nums[k] \\times nums[right]$ coins. Find the maximum total coins achievable. Crucial insight: reverse the thinking to choose the *last* balloon to burst in interval $[i, j]$ rather than the first.",
      starterCode: `/**
 * Burst Balloons Optimal Interval DP
 * @param nums Array of balloon values
 * @returns Maximum coins obtainable
 */

export function maxCoins(nums: number[]): number {
  const rawN = nums.length;
  if (rawN === 0) return 0;

  // Pad array with boundary 1s: A = [1, nums[0], ..., nums[N-1], 1]
  const n = rawN + 2;
  const val = new Int32Array(n);
  val[0] = 1;
  val[n - 1] = 1;
  for (let i = 0; i < rawN; i++) {
    val[i + 1] = nums[i];
  }

  // Flattened 1D array for dp[i * n + j]
  // dp[i][j]: max coins bursting all balloons strictly between index i and j
  const dp = new Int32Array(n * n);

  // Iterate over interval length from 3 (subsegment of 1 balloon) to n (all balloons)
  for (let len = 3; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      const cellIdx = i * n + j;
      let maxCoinsForInterval = 0;
      const boundaryProduct = val[i] * val[j];

      // Choose k as the LAST balloon burst in open interval (i, j)
      for (let k = i + 1; k < j; k++) {
        const total =
          dp[i * n + k] +
          dp[k * n + j] +
          boundaryProduct * val[k];

        if (total > maxCoinsForInterval) {
          maxCoinsForInterval = total;
        }
      }
      dp[cellIdx] = maxCoinsForInterval;
    }
  }

  // Answer is strictly between padded boundaries 0 and n-1
  return dp[0 * n + (n - 1)];
}`,
    },
  ],
};
