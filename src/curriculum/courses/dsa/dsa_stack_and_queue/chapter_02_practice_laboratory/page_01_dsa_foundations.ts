import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "dsa_stack_and_queue_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Monotonic Stack & Buffer Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "largest-rectangle-in-histogram",
      title: "Largest Rectangle in Histogram via Monotonic Increasing Stack",
      difficulty: "Hard",
      rationale:
        "Implement Largest Rectangle in Histogram in strictly $O(N)$ linear time and $O(N)$ auxiliary space. The solver maintains a monotonic increasing stack of bar indices, resolving the maximal width $[L_i + 1, R_i - 1]$ for each bar upon encountering shorter boundaries.",
      starterCode: `/**
 * Largest Rectangle in Histogram Solver
 */

export function largestRectangleArea(heights: number[]): number {
  const n = heights.length;
  if (n === 0) return 0;

  const stack: number[] = []; // Stack of indices with strictly increasing heights
  let maxArea = 0;

  // Append a virtual sentinel bar of height 0 at index n to flush all remaining bars
  for (let i = 0; i <= n; i++) {
    const currH = i === n ? 0 : heights[i];

    while (stack.length > 0 && heights[stack[stack.length - 1]] >= currH) {
      const topIdx = stack.pop()!;
      const h = heights[topIdx];
      // Left boundary is the previous element remaining on stack, or -1 if empty
      const leftBound = stack.length === 0 ? -1 : stack[stack.length - 1];
      const width = i - leftBound - 1;
      const area = h * width;
      if (area > maxArea) {
        maxArea = area;
      }
    }

    stack.push(i);
  }

  return maxArea;
}`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
