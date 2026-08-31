import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_geometry_and_sweep_line_c1_p1",
  pageNumber: 1,
  title: "Computational Geometry, Cross Products & Sweep-Line Duality",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Continuous Plane to Discrete Representation Crisis",
      content:
        "Computational geometry bridges continuous Euclidean spaces $\\mathbb{R}^2, \\mathbb{R}^3$ with discrete silicon computation. Spatial problems—such as collision detection in autonomous driving, VLSI design-rule checking, robotic motion planning, and computer graphics rendering—frequently demand pairwise evaluations across $N$ geometric primitives. Naive pairwise checking consumes $\\Theta(N^2)$ time. Computational geometry solves this by linearizing 2D/3D space via **Sweep-Line event queues**, **Voronoi Diagrams / Delaunay Triangulations**, and **Convex Hull Monotone Chains**, reducing time complexity to $O(N \\log N)$ optimal bounds.",
    },
    {
      type: "prose",
      title: "Taxonomy of Geometric Algorithms & Orientation Predicates",
      content:
        "Computational geometry is governed by exact orientation predicates and spatial dimension reduction:\n\n1. **Exact 2D Orientation Predicates (Cross Products):**\n   - Given three points $P_1(x_1, y_1), P_2(x_2, y_2), P_3(x_3, y_3)$, the signed 2D cross product of vectors $\\vec{v}_1 = P_2 - P_1$ and $\\vec{v}_2 = P_3 - P_1$ is computed via the determinant:\n     $$\\text{Cross}(P_1, P_2, P_3) = (x_2 - x_1)(y_3 - y_1) - (y_2 - y_1)(x_3 - x_1)$$\n   - **Sign Interpretation:** Positive ($>0$) $\\implies$ Counter-Clockwise (Left Turn); Negative ($<0$) $\\implies$ Clockwise (Right Turn); Zero ($=0$) $\\implies$ Collinear.\n\n2. **Convex Hull Algorithms (Minimal Convex Enclosing Polygon):**\n   - **Graham Scan / Andrew's Monotone Chain:** Sorts points lexicographically by $(x, y)$, builds the lower hull and upper hull monotonically by popping right-turning vertices in strictly $O(N \\log N)$ time.\n   - **QuickHull / Chan's Algorithm:** Chan's algorithm combines Graham scan on small sub-hulls with Jarvis march wrapping to find the convex hull of $N$ points with $H$ hull vertices in optimal $O(N \\log H)$ output-sensitive time.\n\n3. **Sweep-Line Paradigm (Dimension Reduction $2D \\to 1D + \\text{Time}$):**\n   - Moves a virtual vertical line $x = t$ from left to right across the 2D plane.\n   - Maintains an **Event Queue** of discrete geometric events (endpoints, intersections) and an **Active State Tree** (balanced BST or Segment Tree) storing objects intersecting the sweep line.\n   - **Bentley-Ottmann Algorithm:** Finds all $K$ intersections among $N$ line segments in $O((N + K) \\log N)$ time.\n   - **Klee's Measure Problem (Rectangle Area Union):** Computes the union area of $N$ axis-aligned rectangles in $O(N \\log N)$ time using Sweep-Line combined with a Segment Tree.\n\n4. **Divide-and-Conquer Spatial Partitioning (Closest Pair of Points):**\n   - Computes the minimum Euclidean distance among $N$ points in $O(N \\log N)$ time by recursively dividing the point set and bounding candidate comparisons in a central strip of width $2d$ to at most 6 points per candidate.",
    },
    {
      type: "mental_model",
      title: "Monotone Chain & Sweep-Line Event Dynamics",
      visualIntuition: `
=== 2D CROSS PRODUCT ORIENTATION (LEFT vs RIGHT TURN) ===
     P3 (Left Turn: Cross > 0)
     ^
    /
   P2 ──> P3' (Collinear: Cross == 0)
   ^ \\
  /   \\
 P1    v P3'' (Right Turn: Cross < 0)

=== ANDREW'S MONOTONE CHAIN (UPPER & LOWER HULL) ===
Points sorted lexicographically by (x, y):
  P0 ── P1 ── P2 ── P3 ── P4 ── P5

Lower Hull: Traversed Left-to-Right, enforcing strict LEFT TURNS.
Upper Hull: Traversed Right-to-Left, enforcing strict LEFT TURNS.
Pop any point that causes a RIGHT or COLLINEAR turn!

=== SWEEP LINE MOVING LEFT TO RIGHT (X = t) ===
  Event Queue: [Start L1, Start L2, Intersect(L1, L2), End L1, End L2]
  Active BST: Stores segments ordered by their Y-coordinate at current X=t.
      `,
      invariant:
        "Convexity & Sweep Line Invariant:\n1. Hull Invariant: Every consecutive triplet $(P_{i-1}, P_i, P_{i+1})$ along the lower/upper hull forms a strict counter-clockwise turn (signed cross product $> 0$).\n2. Sweep Line Invariant: Two non-intersecting geometric segments maintain the exact same vertical $y$-order in the active BST throughout the entire sweep interval.",
      stateTransitions:
        "Monotone Chain: While $|\\text{Hull}| \\ge 2$ and $\\text{Cross}(\\text{Hull}[-2], \\text{Hull}[-1], P) \\le 0$, $\\text{pop}(\\text{Hull})$; $\\text{push}(P)$.\nSweep Line: At $x = x_e$, insert/remove segment in BST; check adjacent neighbors in BST for future intersection events.",
      naiveBottleneck:
        "Pairwise intersection checks take $\\Theta(N^2)$ time. Finding the convex hull by checking whether each segment is an extreme edge takes $\\Theta(N^3)$ time.",
      optimalInsight:
        "By sorting points along one spatial dimension, geometric interactions are restricted to immediate spatial neighbors in the active sweep BST, reducing operations from quadratic to optimal $O(N \\log N)$.",
    },
  ],
};
