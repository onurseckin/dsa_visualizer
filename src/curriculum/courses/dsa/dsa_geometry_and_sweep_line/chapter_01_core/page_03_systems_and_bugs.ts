import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_geometry_and_sweep_line_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "IEEE 754 Precision Failure & Shewchuk's Exact Robust Predicates",
      content:
        "Geometric software (CAD, GIS, autonomous perception) suffers from catastrophic non-robustness when using standard 64-bit IEEE 754 floating-point arithmetic:\n\n1. **The Inconsistent Orientation Trap:** For nearly collinear points, floating-point rounding errors cause non-transitive orientation predicates. A geometric solver can evaluate $\\text{Orient}(A, B, C) > 0$, $\\text{Orient}(B, C, A) > 0$, and $\\text{Orient}(C, A, B) > 0$ simultaneously, producing impossible geometric topologies and crashing Delaunay triangulators.\n2. **Shewchuk's Adaptive Precision Floating-Point Arithmetic:** Industry-standard geometry engines (CGAL, GEOS) utilize adaptive precision floating-point filters. Orientation determinants are computed in fast hardware FP64 with dynamic error bounding; if the result falls within the floating-point uncertainty epsilon $\\epsilon = 2^{-52} \\cdot |\\vec{u}| |\\vec{v}|$, the calculation dynamically switches to exact multi-precision arithmetic (`BigInt` / 128-bit integers).\n3. **Sweep-Line Tree Memory Locality:** Segment Trees over coordinate-compressed endpoints pack active sweep intervals into contiguous arrays, eliminating the random pointer-chasing overhead of dynamic Red-Black trees.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Collinear Degeneracies & Vertical Line Slopes",
      content:
        "1. **Collinear Boundary Retention vs Pruning:** In Andrew's Monotone Chain, checking `crossProduct <= 0` strictly prunes all intermediate collinear points, leaving only extreme corner vertices. If intermediate points along hull edges are required (e.g. for perimeter coverage), change condition to `crossProduct < 0`, but reverse the upper hull sorting on identical points.\n2. **The Slope-Intercept Division by Zero Bug:** Representing line segments via $y = m x + c$ fails fatally on vertical segments ($m = \\Delta y / 0 = \\infty$). Production line intersection engines must *never* compute slopes; always evaluate intersection using cross-product parametric bounding boxes.\n3. **Closest Pair Strip Re-Sorting Regression:** Failing to merge $y$-sorted sublists in $O(N)$ during divide-and-conquer forces an explicit sort `strip.sort()` inside every recursion step, degrading runtime from $O(N \\log N)$ to $O(N \\log^2 N)$ or $\\Theta(N^2)$.\n4. **Non-General Position Degeneracies:** Coincident points (duplicate coordinates) and multiple concurrent intersection events at a single coordinate must be handled atomically in sweep event queues.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Advanced Geometric Frontiers: Rotating Calipers & Fortune's Voronoi Sweep",
      content:
        "Advanced computational geometry unlocks linear and near-linear spatial optimizations:\n- **Rotating Calipers (Shamos 1978):** Once the convex hull of $N$ points is computed, antipodal pairs of vertices (pairs supporting parallel tangent lines) are tracked by rotating calipers around the hull perimeter in strictly $O(N)$ linear time. Computes polygon diameter, maximum distance between two polygons, and minimum-area bounding boxes.\n- **Fortune's Sweep-Line Algorithm for Voronoi Diagrams:** Moves a sweep line across $\\mathbb{R}^2$ while maintaining a parabolic **Beach Line** of equidistant points in an active balanced BST. Computes the Voronoi Diagram and Delaunay Triangulation of $N$ sites in strictly $O(N \\log N)$ optimal time.",
    },
    {
      type: "prose",
      title: "Geometric Algorithm Selection Matrix",
      content: `
| Algorithm | Time Complexity | Space Complexity | Input Dimension | Numerical Robustness Requirement | Application Domain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Andrew's Monotone Chain** | $O(N \\log N)$ | $O(N)$ | 2D | Exact integer cross product | 2D Convex Hull, Bounding polygons |
| **Chan's Algorithm** | $O(N \\log H)$ | $O(N)$ | 2D / 3D | Exact predicates | Output-sensitive 2D/3D hulls |
| **Closest Pair (D&C)** | $O(N \\log N)$ | $O(N)$ | 2D | Squared integer distance | Collision warning, point clustering |
| **Bentley-Ottmann** | $O((N + K) \\log N)$ | $O(N + K)$ | 2D Segments | Parametric cross products | VLSI circuit design-rule checking |
| **Klee's Rectangle Union** | $O(N \\log N)$ | $O(N)$ | 2D Axis-Aligned | Coordinate compression | Chip mask layout area calculation |
| **Fortune's Algorithm** | $O(N \\log N)$ | $O(N)$ | 2D Points | Parabolic circle events | Voronoi diagrams, nearest neighbor mesh |
| **Rotating Calipers** | $O(N)$ post-hull | $O(1)$ | Convex Polygon | Area determinants | Minimum bounding box, polygon diameter |
      `,
    },
  ],
};
