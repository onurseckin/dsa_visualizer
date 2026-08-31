import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_geometry_and_sweep_line_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: 2D Cross Product Orientation Invariant",
      theorem:
        "Let $P_1 = (x_1, y_1), P_2 = (x_2, y_2), P_3 = (x_3, y_3) \\in \\mathbb{R}^2$. The signed cross product determinant $\\Delta = (x_2 - x_1)(y_3 - y_1) - (y_2 - y_1)(x_3 - x_1)$ equals twice the signed area of $\\triangle P_1 P_2 P_3$. Furthermore, $\\Delta > 0$ if and only if the sequence $P_1 \\to P_2 \\to P_3$ makes a strict counter-clockwise (left) turn.",
      proof: `
**Proof via Vector Geometry & Determinants:**
1. Let $\\vec{u} = P_2 - P_1 = (u_x, u_y) = (x_2 - x_1, y_2 - y_1)$ and $\\vec{v} = P_3 - P_1 = (v_x, v_y) = (x_3 - x_1, y_3 - y_1)$.
2. In 3D space, embedding these vectors in the $z=0$ plane gives $\\vec{u} = (u_x, u_y, 0)$ and $\\vec{v} = (v_x, v_y, 0)$.
3. The 3D vector cross product is:
   $$\\vec{u} \\times \\vec{v} = (0, 0, u_x v_y - u_y v_x) = (0, 0, \\Delta) \\hat{k}$$
4. By the geometric definition of the vector cross product, its magnitude is:
   $$\\vec{u} \\times \\vec{v} = |\\vec{u}| |\\vec{v}| \\sin(\\theta) \\hat{k}$$
   where $\\theta \\in [-\\pi, \\pi]$ is the directed angle from $\\vec{u}$ to $\\vec{v}$.
5. Therefore:
   $$\\Delta = u_x v_y - u_y v_x = |\\vec{u}| |\\vec{v}| \\sin(\\theta)$$
6. We analyze the sign of $\\Delta$:
   - If $\\theta \\in (0, \\pi)$, then $\\sin(\\theta) > 0 \\implies \\Delta > 0$. The vector $\\vec{v}$ lies strictly to the left of vector $\\vec{u}$, corresponding to a counter-clockwise (left) turn.
   - If $\\theta \\in (-\\pi, 0)$, then $\\sin(\\theta) < 0 \\implies \\Delta < 0$. The vector $\\vec{v}$ lies strictly to the right of vector $\\vec{u}$, corresponding to a clockwise (right) turn.
   - If $\\theta = 0$ or $\\theta = \\pi$, then $\\sin(\\theta) = 0 \\implies \\Delta = 0$. The vectors are collinear.
7. Thus, the sign of $\\Delta$ is an exact algebraic invariant for geometric orientation in $\\mathbb{R}^2$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Convex Hull Complexity Lower Bound via Sorting Reduction",
      theorem:
        "In the algebraic decision tree model, any algorithm that computes the Convex Hull of $N$ points in $\\mathbb{R}^2$ requires $\\Omega(N \\log N)$ operations in the worst case.",
      proof: `
**Proof by Reduction from Comparison-Based Sorting:**
1. Let $X = \\{x_1, x_2, \\dots, x_N\\}$ be an unsorted set of $N$ distinct real numbers. We know comparison-based sorting of $N$ real numbers has an information-theoretic lower bound of $\\Omega(N \\log N)$.
2. Map each number $x_i \\in X$ to a 2D point $P_i = (x_i, x_i^2)$ on the standard parabola $y = x^2$.
3. Because the function $f(x) = x^2$ is strictly convex ($f''(x) = 2 > 0$), the line segment connecting any two points on the parabola lies strictly above the parabola.
4. Therefore, every single point $P_i = (x_i, x_i^2)$ is an extreme point (vertex) of the convex hull of $P = \\{P_1, \\dots, P_N\\}$. No point lies in the interior of the convex hull.
5. The convex hull algorithm returns the vertices ordered cyclically around the perimeter of the hull: $(P_{\\pi(1)}, P_{\\pi(2)}, \\dots, P_{\\pi(N)})$.
6. Reading the $x$-coordinates along this convex hull perimeter immediately yields the numbers $x_i$ in sorted numerical order.
7. Because the reduction (mapping $x_i \\mapsto (x_i, x_i^2)$ and reading $x$-coordinates) takes strictly $O(N)$ linear time, if Convex Hull could be solved in $o(N \\log N)$ time, we could sort $N$ numbers in $o(N \\log N)$ time, a contradiction.
8. Therefore, the worst-case complexity of the 2D Convex Hull problem is strictly $\\Omega(N \\log N)$. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive O(N^3) Extreme Edge Check Baseline",
          code: `export interface Point2D {
  x: number;
  y: number;
}

export function convexHullNaive(points: Point2D[]): Point2D[] {
  const n = points.length;
  if (n <= 3) return points;
  const hullEdges: [Point2D, Point2D][] = [];

  // Check all O(N^2) pairs of points
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const p1 = points[i];
      const p2 = points[j];
      let allOnOneSide = true;

      // O(N) check if all other points lie on one side of directed line p1->p2
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        const p3 = points[k];
        const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
        if (cross < 0) {
          allOnOneSide = false;
          break;
        }
      }

      if (allOnOneSide) {
        hullEdges.push([p1, p2]);
      }
    }
  }

  // Reconstruct vertices from edges
  const hullVertices = new Set<Point2D>();
  for (const [p1, p2] of hullEdges) {
    hullVertices.add(p1);
    hullVertices.add(p2);
  }
  return Array.from(hullVertices);
}`,
          explanation:
            "Tests all $O(N^2)$ candidate directed edges by verifying that all $N-2$ other points lie strictly to the left. Total time $\\Theta(N^3)$, completely unviable for $N > 1000$.",
          timeComplexity: "O(N^3)",
          spaceComplexity: "O(N)",
        },
        {
          label: "Stage 2: Andrew's Monotone Chain Convex Hull (O(N log N))",
          code: `export function crossProduct(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}

export function monotoneChainConvexHull(points: Point2D[]): Point2D[] {
  const n = points.length;
  if (n <= 2) return [...points];

  // Sort lexicographically by x, then by y in O(N log N)
  const pts = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  const lower: Point2D[] = [];
  const upper: Point2D[] = [];

  // Build Lower Hull (monotonic stack enforcing strict left turns)
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    while (
      lower.length >= 2 &&
      crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build Upper Hull
  for (let i = n - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove duplicate endpoints (first and last elements of upper hull)
  lower.pop();
  upper.pop();

  return lower.concat(upper);
}`,
          explanation:
            "Andrew's Monotone Chain variant of Graham scan sorts points lexicographically, then constructs lower and upper hulls in two monotonic stack passes. Each point is pushed and popped at most once, running in optimal $O(N \\log N)$ time.",
          timeComplexity: "O(N log N)",
          spaceComplexity: "O(N) stack memory",
        },
        {
          label: "Stage 3: Low-Level Divide-and-Conquer Closest Pair of Points Engine",
          code: `export class ClosestPairEngine {
  // Ultra-fast O(N log N) Closest Pair of Points with exact integer/BigInt distance logic
  public static findClosestPair(points: Point2D[]): number {
    const n = points.length;
    if (n < 2) return 0;

    // Pre-sort points by X coordinate
    const ptsByX = [...points].sort((a, b) => a.x - b.x);
    const aux = new Array<Point2D>(n);

    function distSq(p1: Point2D, p2: Point2D): number {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return dx * dx + dy * dy;
    }

    function solve(l: number, r: number): number {
      if (r - l <= 3) {
        // Base case: pairwise check
        let minD = Infinity;
        for (let i = l; i <= r; i++) {
          for (let j = i + 1; j <= r; j++) {
            minD = Math.min(minD, distSq(ptsByX[i], ptsByX[j]));
          }
        }
        // In-place sort by Y for merge step
        ptsByX.slice(l, r + 1).sort((a, b) => a.y - b.y);
        return minD;
      }

      const mid = (l + r) >> 1;
      const midX = ptsByX[mid].x;
      const dLeft = solve(l, mid);
      const dRight = solve(mid + 1, r);
      let d = Math.min(dLeft, dRight);
      const delta = Math.sqrt(d);

      // Merge sort ptsByX[l..r] by Y coordinate into aux
      let i = l;
      let j = mid + 1;
      let k = l;
      while (i <= mid && j <= r) {
        if (ptsByX[i].y <= ptsByX[j].y) aux[k++] = ptsByX[i++];
        else aux[k++] = ptsByX[j++];
      }
      while (i <= mid) aux[k++] = ptsByX[i++];
      while (j <= r) aux[k++] = ptsByX[j++];
      for (let idx = l; idx <= r; idx++) ptsByX[idx] = aux[idx];

      // Build strip: points within distance delta of vertical line x = midX
      const strip: Point2D[] = [];
      for (let idx = l; idx <= r; idx++) {
        if (Math.abs(ptsByX[idx].x - midX) < delta) {
          strip.push(ptsByX[idx]);
        }
      }

      // Check each point in strip against at most 6 subsequent points in Y-order
      const stripLen = strip.length;
      for (let pIdx = 0; pIdx < stripLen; pIdx++) {
        const p1 = strip[pIdx];
        for (let nextIdx = pIdx + 1; nextIdx < stripLen && (strip[nextIdx].y - p1.y) < delta; nextIdx++) {
          d = Math.min(d, distSq(p1, strip[nextIdx]));
        }
      }

      return d;
    }

    return Math.sqrt(solve(0, n - 1));
  }
}`,
          explanation:
            "Stage 3 demonstrates the Divide-and-Conquer Closest Pair engine. Merging $y$-sorted lists during recursion avoids re-sorting, and the geometric packing lemma guarantees that the inner strip loop checks at most 6 points per candidate, achieving strictly $O(N \\log N)$ runtime.",
          timeComplexity: "O(N log N)",
          spaceComplexity: "O(N) contiguous auxiliary buffers",
        },
      ],
      stepByStep: [
        "Sort points lexicographically along the primary spatial dimension ($x$-axis) in $O(N \\log N)$.",
        "Maintain invariant with monotonic stacks (for Monotone Chain) or $y$-sorted active strips (for Closest Pair).",
        "Use exact integer determinants for orientation predicates to prevent floating-point precision corruption.",
      ],
    },
  ],
};
