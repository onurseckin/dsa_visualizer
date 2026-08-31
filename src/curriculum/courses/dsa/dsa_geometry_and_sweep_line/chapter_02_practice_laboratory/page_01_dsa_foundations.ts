import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_geometry_and_sweep_line_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Computational Geometry & Sweep Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "convex-hull-monotone-chain",
      title: "Andrew's Monotone Chain 2D Convex Hull Implementation",
      difficulty: "Hard",
      rationale:
        "Implement Andrew's Monotone Chain Convex Hull algorithm using exact 64-bit integer cross products. Given $N$ 2D integer coordinates, sort lexicographically, construct the lower and upper hulls via monotonic stacks, and return the vertices ordered counter-clockwise along the perimeter in $O(N \\log N)$ time.",
      starterCode: `/**
 * 2D Convex Hull via Andrew's Monotone Chain
 */

export interface Point2D {
  x: number;
  y: number;
}

export function solveConvexHull(points: Point2D[]): Point2D[] {
  const n = points.length;
  if (n <= 3) return [...points];

  // Step 1: Sort points lexicographically by x, then by y
  const pts = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  // Cross product of vectors (p2 - p1) and (p3 - p1)
  // Positive -> Left Turn (Counter-Clockwise)
  // Zero -> Collinear
  // Negative -> Right Turn (Clockwise)
  function cross(p1: Point2D, p2: Point2D, p3: Point2D): number {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  const lower: Point2D[] = [];
  const upper: Point2D[] = [];

  // Step 2: Build Lower Hull (left to right)
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  // Step 3: Build Upper Hull (right to left)
  for (let i = n - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  // Step 4: Concatenate hulls (omit duplicate endpoints)
  lower.pop();
  upper.pop();

  return lower.concat(upper);
}`,
    },
  ],
};
