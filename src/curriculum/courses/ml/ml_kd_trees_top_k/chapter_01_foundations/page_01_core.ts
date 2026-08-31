import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_kd_trees_top_k_c1_p1",
  pageNumber: 1,
  title: "K-D Trees & Top-K Search: Geometric Partitioning & Dimensionality Limits",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Vector Search Frontier: Exact Geometric Pruning vs. The Curse of Dimensionality",
      content:
        "Exact Nearest Neighbor search ($k$-NN) is a foundational primitive across computational geometry, robotics, clustering, and embedding search. In low-dimensional spaces ($D \\le 10$), exhaustive linear scanning ($O(N \\cdot D)$) is computationally prohibitive for large datasets ($N > 10^7$). **K-D Trees (k-Dimensional Trees, Bentley, 1975)** recursively partition continuous $D$-dimensional Euclidean space using axis-aligned hyperplanes centered at the median. By maintaining a bounding hyper-rectangle for each subtree and pruning entire branches when the query ball does not intersect the bounding box, K-D Trees achieve average search times of **$O(\\log N)$**. However, as dimension $D$ increases beyond $D \\approx 20$, geometry undergoes a phase transition—the **Curse of Dimensionality**—where the query hypersphere intersects nearly all hyper-rectangles, causing tree search to collapse into an exhaustive linear scan that is slower than a flat contiguous array!",
    },
    {
      type: "mental_model",
      title: "Mental Model: Recursive Axis Splitting & Hypersphere Pruning",
      visualIntuition:
        "2D Space: [Root: Split x=5.0] --> Left Subtree (x < 5.0, split y=3.0) and Right Subtree (x >= 5.0, split y=8.0)\\nQuery Point q = (4.0, 7.0), current best distance r = 1.5\\nHypersphere Pruning Test: |q_x - split_x| = |4.0 - 5.0| = 1.0 < 1.5 --> Boundary intersects query sphere! Must backtrack and explore right subtree.\\nIf |q_x - split_x| = 2.5 >= 1.5 --> Prune entire right subtree completely (Zero distance computations for 50% of the dataset)!",
      invariant:
        "Branch Pruning Invariant: If the orthogonal distance from query point q to the splitting hyperplane |q_d - x_d| exceeds the current k-th nearest neighbor distance r_k, no point in the opposite subtree can possibly be closer than r_k, allowing safe mathematical branch pruning.",
      stateTransitions:
        "Query q -> Traverse tree down to leaf along split axes -> Insert leaf points into Max-Heap (size k) -> Unwind recursion stack -> Evaluate orthogonal split plane distance -> If |q_d - split_d| < heap.max(), recursively search opposite child -> Final Top-K result.",
      naiveBottleneck:
        "Pointer-based K-D trees allocate individual nodes across the heap, incurring cache misses on every branch comparison during backtracking.",
      optimalInsight:
        "In low dimensions (D <= 10), K-D trees achieve logarithmic O(log N) search; in high dimensions (D > 50), modern vector systems transition to approximate graph indexes (HNSW) and product quantization (IVF-PQ).",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: K-D Tree Logarithmic Search Complexity",
      theorem:
        "In a balanced K-D Tree storing $N$ points in $D$-dimensional space with independent uniform coordinates, the expected time to find the exact nearest neighbor when dimension $D \\ll \\log N$ is $O(2^D \\log N) = O(\\log N)$.",
      proof:
        "1. Tree Depth and Partitioning:\\nSince points are split at the median along alternating axes $d = \\text{depth} \\bmod D$, a tree with $N$ points has depth $h = \\lceil \\log_2 N \\rceil$, partitioning the space into $2^h = N$ hyper-rectangular cells.\\n\\n2. Volume and Radius of Nearest Neighbor Ball:\\nLet $B(q, r)$ be the smallest hypersphere centered at query $q$ containing the nearest neighbor. For uniformly distributed points in unit hypercube $[0, 1]^D$, the expected distance to the nearest neighbor scales as $r \\sim N^{-1/D}$.\\n\\n3. Number of Intersecting Cells:\\nEach tree cell at depth $h$ has side length approximately $s \\approx N^{-1/D}$.\\nThe number of cells intersected by the query hypersphere of radius $r$ is proportional to the surface area of the hypersphere divided by cell volume:\\n$$K_{\\text{intersect}} = O\\left( \\left( 1 + \\frac{2r}{s} \\right)^D \\right) = O(2^D)$$\\n\\n4. Total Traversal Cost:\\nFor each of the $O(2^D)$ intersecting leaves, traversing from the root to the leaf requires $O(\\log N)$ steps.\\nTotal expected search complexity is:\\n$$T(N, D) = O(2^D \\log N)$$\\nFor fixed low dimension $D$, $2^D$ is a constant, yielding strictly $O(\\log N)$ search time.",
    },
  ],
};

export const page_01_core = page1;
