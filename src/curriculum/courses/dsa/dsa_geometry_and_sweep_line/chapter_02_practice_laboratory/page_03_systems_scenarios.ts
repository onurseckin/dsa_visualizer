import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_geometry_and_sweep_line_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_geometry_and_sweep_line",
      title: "Computational Geometry & Sweep Line Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Erect the Fence (Convex Hull with Collinear Points)",
          problemId: "erect-the-fence-convex-hull",
          difficulty: "Hard",
          description:
            "Given $N$ tree coordinates, find all trees that lie on the perimeter of the smallest convex fence enclosing all trees, including intermediate trees on collinear hull edges. Modify Andrew's Monotone Chain to preserve collinear points on upper/lower hulls in $O(N \\log N)$ time.",
          rationale:
            "Tests careful handling of non-strict orientation inequalities (`cross < 0`) and duplicate point pruning.",
        },
        {
          title: "Rectangle Area II (Sweep-Line with Segment Tree)",
          problemId: "rectangle-area-ii-sweep-line",
          difficulty: "Hard",
          description:
            "Given $N$ axis-aligned 2D rectangles, compute the total area covered by their union modulo $10^9 + 7$. Implement a vertical sweep-line with coordinate compression and a Segment Tree tracking active 1D vertical lengths in $O(N \\log N)$ time.",
          rationale:
            "Evaluates Klee's measure reduction using sweep events and dynamic interval union maintenance.",
        },
        {
          title: "Max Points on a Line via Exact GCD Slope Hashing",
          problemId: "max-points-on-a-line",
          difficulty: "Hard",
          description:
            "Given $N$ 2D points, find the maximum number of points that lie on the same straight line. Avoid floating-point slopes by reducing $(\\Delta y, \\Delta x)$ by their greatest common divisor $\\gcd(|\\Delta y|, |\\Delta x|)$ in $O(N^2)$ time.",
          rationale:
            "Demonstrates exact discrete rational slope representation eliminating precision drift.",
        },
        {
          title: "Bentley-Ottmann Line Segment Intersection Engine",
          problemId: "bentley-ottmann-segment-intersections",
          difficulty: "Expert",
          description:
            "Given $N$ 2D line segments, output all $K$ pairwise intersection points in $O((N + K) \\log N)$ time using an active sweep-line BST and dynamic event priority queue.",
          rationale:
            "Tests active state ordering and dynamic event insertion upon neighboring segment adjacency.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Shoelace Formula Derivation from Green's Theorem",
          statement:
            "Prove that the area of a non-self-intersecting polygon with vertices $(x_0, y_0), \\dots, (x_{n-1}, y_{n-1})$ is $A = \\frac{1}{2} |\\sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i)|$.",
          proofOutline:
            "By Green's Theorem in the 2D plane, the area $A = \\iint_D dx dy = \\frac{1}{2} \\oint_{\\partial D} (x dy - y dx)$. Parameterizing the linear boundary segment between $(x_i, y_i)$ and $(x_{i+1}, y_{i+1})$ as $\\vec{r}(t) = (1-t)P_i + t P_{i+1}$ for $t \\in [0, 1]$ evaluates each line integral to $\\frac{1}{2}(x_i y_{i+1} - x_{i+1} y_i)$. Summing over all $n$ edges yields the Shoelace Formula.",
          engineeringContext:
            "Foundational for polygon area calculation in geospatial GIS systems (PostGIS, QGIS) and game engine physics hulls.",
        },
        {
          title: "Rotating Calipers Antipodal Pair Optimality Bound",
          statement:
            "Prove that a convex polygon with $N$ vertices has at most $3N/2$ antipodal pairs of vertices, and that the Rotating Calipers algorithm visits all antipodal pairs in strictly $O(N)$ linear time.",
          proofOutline:
            "An antipodal pair admits two parallel supporting lines of the polygon. As the caliper angle sweeps from $0$ to $\\pi$, each vertex is advanced when the angle of the edge exceeds the caliper slope. Because the polygon is convex, the caliper slopes increase monotonically, advancing around the $N$ edges in exactly one circular sweep with $O(N)$ comparisons.",
          engineeringContext:
            "Used to compute minimum enclosing oriented bounding boxes for 3D physics collision meshes.",
        },
        {
          title: "Bentley-Ottmann Event Locality Invariant",
          statement:
            "Prove that if two line segments $s_1$ and $s_2$ intersect at point $p = (x_p, y_p)$, there exists an $x$-coordinate $x < x_p$ at which $s_1$ and $s_2$ are consecutive neighbors in the active sweep BST.",
          proofOutline:
            "As the vertical sweep line approaches $x_p$ from the left, any segments positioned between $s_1$ and $s_2$ must terminate or diverge before $x_p$. By the Jordan curve theorem and continuous segment ordering, immediately before the intersection $x_p - \\epsilon$, no segment can remain between $s_1$ and $s_2$, ensuring they become adjacent and their intersection is detected.",
          engineeringContext:
            "Guarantees that sweeping discovers all $K$ intersections without missing non-local events.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Exact 128-Bit Integer Arithmetic vs IEEE 754 Floating-Point Invariants",
          prompt:
            "Why do high-frequency computational geometry kernels (CAD engines, ray-tracers) compute 2D cross products using 128-bit integer types (`__int128_t` / `BigInt`) rather than `double` (FP64)?",
          engineeringContext:
            "Multiplying two 32-bit coordinates ($10^9$) produces a 64-bit value ($10^{18}$). Subtracting two 64-bit products requires up to 65 bits of precision. Float64 mantissa has only 53 bits, causing bit truncation and non-transitive orientation cycles.",
        },
        {
          title: "Coordinate Compression Layout for Sweep-Line Segment Trees",
          prompt:
            "How does sorting unique $y$-coordinates into a contiguous `Float64Array` allow a static 1D Segment Tree to manage continuous intervals without dynamic node allocation?",
          engineeringContext:
            "Mapping continuous coordinates to discrete rank indices $[0, 2N-1]$ allows segment trees to be pre-allocated as a fixed $8N$ flat buffer, eliminating GC pauses and maximizing L1 data cache residency.",
        },
        {
          title: "SIMD Vectorization of Point-in-Polygon Winding Numbers",
          prompt:
            "Explain how AVX2 instructions vectorize the Winding Number algorithm to test if a query point lies inside an $N$-vertex polygon by evaluating 8 polygon edges simultaneously.",
          engineeringContext:
            "Winding number cross-product tests are data-parallel across edges. AVX2 computes 8 cross-products (`_mm256_sub_pd`, `_mm256_mul_pd`) per cycle, speeding up spatial containment queries by $8\\times$.",
        },
      ],
      partD_stressTests: [
        {
          title: "Collinear Stack Degradation in Non-Strict Monotone Chain",
          scenario:
            "Running Monotone Chain on $10^5$ collinear points on the line $y = x$ using `crossProduct < 0` without reverse endpoint pruning.",
          failureMode:
            "The upper hull and lower hull duplicate all $10^5$ points, causing stack memory blowup and returning $2 \\times 10^5$ redundant vertices.",
        },
        {
          title: "Catastrophic Cancellation on Nearly Parallel Line Intersections",
          scenario:
            "Computing the intersection of two line segments with slopes differing by $10^{-14}$ using standard 64-bit floating-point division.",
          failureMode:
            "The determinant denominator approaches floating-point zero, blowing up coordinates to $10^{16}$ and placing the intersection thousands of kilometers away from the true position.",
        },
        {
          title: "Vertical Line Division by Zero in Slope Calculation",
          scenario:
            "Calculating slope $m = (y_2 - y_1) / (x_2 - x_1)$ on vertical segments where $x_1 = x_2$.",
          failureMode:
            "Produces `Infinity` or `-Infinity`, which hash inconsistently or trigger `NaN` exceptions in standard comparator maps.",
        },
      ],
    },
  ],
};
