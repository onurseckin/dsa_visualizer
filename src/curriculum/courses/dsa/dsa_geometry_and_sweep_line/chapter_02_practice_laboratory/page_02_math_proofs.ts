import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_geometry_and_sweep_line_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Closest Pair Box Packing Lemma",
      theorem:
        "In the divide-and-conquer Closest Pair algorithm with minimum subproblem distance $\\delta$, let a vertical strip of width $2\\delta$ be centered around the dividing line $x = x_{\\text{mid}}$. For any point $P = (x, y)$ in the strip, any candidate point $Q = (x', y')$ with $y \\le y' < y + \\delta$ that satisfies $\\text{dist}(P, Q) < \\delta$ lies within a rectangle of size $2\\delta \\times \\delta$. This rectangle can contain at most 6 (and at most 7) points pairwise separated by at least $\\delta$.",
      proof: `
**Proof via Geometric Pigeonhole Principle:**
1. Consider the candidate search region $R = [x_{\\text{mid}} - \\delta, x_{\\text{mid}} + \\delta] \\times [y, y + \\delta]$.
2. The width of rectangle $R$ is $2\\delta$ and its height is $\\delta$.
3. Divide rectangle $R$ into two squares $S_{\\text{left}} = [x_{\\text{mid}} - \\delta, x_{\\text{mid}}] \\times [y, y + \\delta]$ and $S_{\\text{right}} = [x_{\\text{mid}}, x_{\\text{mid}} + \\delta] \\times [y, y + \\delta]$, each of size $\\delta \\times \\delta$.
4. All points in $S_{\\text{left}}$ belong to the left subproblem $P_{\\text{left}}$, and all points in $S_{\\text{right}}$ belong to the right subproblem $P_{\\text{right}}$.
5. By the inductive hypothesis, any two distinct points in $P_{\\text{left}}$ are separated by distance at least $\\delta$, and any two distinct points in $P_{\\text{right}}$ are separated by distance at least $\\delta$.
6. In a square of side length $\\delta$, the maximum number of points that can be placed such that every pair is separated by distance $\\ge \\delta$ is at most 4 (one at each of the 4 corners: distance between adjacent corners is $\\delta$, diagonal distance is $\\delta \\sqrt{2} > \\delta$).
7. If 4 points are placed in $S_{\\text{left}}$ and 4 points in $S_{\\text{right}}$, two points would have to share the boundary line $x = x_{\\text{mid}}$ at the same corner, which would violate the pairwise separation $\\ge \\delta$.
8. More rigorously, packing circles of radius $\\delta/2$ into the $2\\delta \\times \\delta$ box shows that at most 6 points can reside strictly in the candidate region.
9. Therefore, when scanning points sorted by $y$-coordinate in the strip, for each point $P$, checking at most 6 (or 7) subsequent points in $y$-order is mathematically guaranteed to find any pair with distance $< \\delta$.
10. This bounds the strip comparison work to $O(N)$, ensuring total divide-and-conquer runtime $T(N) = 2T(N/2) + O(N) = O(N \\log N)$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Pick's Theorem for Lattice Polygons",
      theorem:
        "Let $P$ be a simple polygon whose vertices all lie on a discrete 2D integer lattice $\\mathbb{Z}^2$. The area of $P$ is given by $A = i + \\frac{b}{2} - 1$, where $i$ is the number of strictly interior lattice points and $b$ is the number of boundary lattice points.",
      proof: `
**Proof via Triangulation & Euler Characteristic:**
1. Any simple polygon $P$ with $V$ vertices and $b$ boundary points can be triangulated into primitive triangles with vertices in $\\mathbb{Z}^2$ containing zero interior lattice points ($i = 0$) and exactly $3$ boundary points ($b = 3$).
2. By Pick's formula, a primitive triangle has area $A_{\\text{prim}} = 0 + 3/2 - 1 = 1/2$.
3. We compute the total sum of interior angles of all $m$ primitive triangles in two ways:
   - Interior lattice points ($i$ points): each contributes $2\\pi$ to the angle sum, giving $2\\pi i$.
   - Boundary lattice points ($b$ points): the $V$ polygon vertices have interior angle sum $(V - 2)\\pi$. The $b - V$ strictly boundary edge points each contribute $\\pi$, giving $(b - V)\\pi$.
   - Total angle sum $= 2\\pi i + (V - 2)\\pi + (b - V)\\pi = \\pi(2i + b - 2)$.
4. Since every primitive triangle has angle sum $\\pi$, the number of primitive triangles is $m = 2i + b - 2$.
5. Because each primitive triangle has area $1/2$, the total area of polygon $P$ is:
   $$A = m \\cdot \\frac{1}{2} = \\frac{2i + b - 2}{2} = i + \\frac{b}{2} - 1$$
6. Combined with the Shoelace Formula $A = \\frac{1}{2} |\\sum (x_i y_{i+1} - x_{i+1} y_i)|$, Pick's theorem allows counting interior points via $i = A - \\frac{b}{2} + 1$ where boundary points on edge $(u, v)$ are $b_{u, v} = \\gcd(|x_u - x_v|, |y_u - y_v|)$. $\\blacksquare$
      `,
    },
  ],
};
