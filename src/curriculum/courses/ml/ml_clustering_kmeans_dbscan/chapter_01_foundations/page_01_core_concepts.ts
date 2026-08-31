import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_clustering_kmeans_dbscan_c1_p1",
  pageNumber: 1,
  title: "Clustering Algorithms: K-Means++, DBSCAN, & Density Connectivity",
  subtitle:
    "Lloyd's Objective, Arthur-Vassilvitskii K-Means++ Bounds, and Non-Convex Spatial Manifolds",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Mathematical Taxonomy of Unsupervised Clustering",
      content:
        "Clustering partitions an unlabeled dataset $X = \\{x_1, \\dots, x_N\\} \\subset \\mathbb{R}^D$ into meaningful clusters based on geometric proximity or density connectivity (Stanford CS229 / MIT 18.065).\n\nKey clustering paradigms:\n1. **K-Means Partitioning & Lloyd's Algorithm**:\n   Minimizes Within-Cluster Sum of Squares (WCSS / Inertia):\n   $$\\mathcal{L}(\\mu_1, \\dots, \\mu_K) = \\sum_{i=1}^N \\min_{k=1}^K \\|x_i - \\mu_k\\|_2^2$$\n   Alternates two steps until convergence:\n   - **Assignment Step**: $z_i^{(t)} = \\arg\\min_{k} \\|x_i - \\mu_k^{(t)}\\|_2^2$.\n   - **Update Step**: $\\mu_k^{(t+1)} = \\frac{1}{|C_k|} \\sum_{i \\in C_k} x_i$.\n   Every step strictly decreases or maintains $\\mathcal{L}$, guaranteeing convergence to a local minimum in a finite number of iterations.\n\n2. **K-Means++ Initialization (Arthur & Vassilvitskii, 2007)**:\n   Standard random initialization often converges to poor local minima with arbitrarily bad WCSS. K-Means++ samples initial centers sequentially with probability proportional to the squared Euclidean distance from the nearest selected center:\n   $$P(x_i) = \\frac{D(x_i)^2}{\\sum_{j=1}^N D(x_j)^2} \\quad \\text{where } D(x_i) = \\min_{c \\in C} \\|x_i - c\\|_2$$\n   Guarantees an expected approximation ratio $\\mathbb{E}[\\phi] \\le 8(\\ln K + 2) \\phi_{\\text{OPT}}$.\n\n3. **DBSCAN (Density-Based Spatial Clustering of Applications with Noise)**:\n   Overcomes K-Means' spherical cluster assumption by discovering arbitrary non-convex geometries (spirals, rings, concentric manifolds) using neighborhood density parameters $(\\epsilon, \\text{MinPts})$:\n   - **$\\epsilon$-Neighborhood**: $N_\\epsilon(p) = \\{q \\in X \\mid \\|p - q\\|_2 \\le \\epsilon\\}$.\n   - **Core Point**: $|N_\\epsilon(p)| \\ge \\text{MinPts}$.\n   - **Border Point**: $|N_\\epsilon(p)| < \\text{MinPts}$, but $p \\in N_\\epsilon(q)$ for some core point $q$.\n   - **Noise Point**: Neither core nor border.\n   - **Density-Connected Clusters**: Maximal sets of density-connected points, isolating noise points without forcing them into artificial clusters.",
    },
    {
      type: "mental_model",
      title: "Voronoi Tessellations vs Density-Connected Flood Fill",
      visualIntuition:
        "K-Means Voronoi Tessellation (Assumes convex, spherical clusters):\n     +---------------+---------------+  Linear decision boundaries\n     |       * mu_1  |       * mu_2  |  between cluster centroids.\n     |  (Cluster 1)  |  (Cluster 2)  |  Fails on concentric rings!\n     +---------------+---------------+\n\nDBSCAN Non-Convex Density Clustering:\n     Inner Ring:   ******* (All Core Points connected via epsilon-paths)\n     Empty Gap:    . . . . (Density < MinPts -> Noise Boundary)\n     Outer Ring:   ******* (Separate Cluster without centroid distortion!)\n\nK-Means++ D^2 Sampling Dispersion:\n  Center 1 Selected: (c_1)\n  Next Center Probability: P(x) proportional to dist(x, c_1)^2\n  --> Forces centers to spread as far apart across the data manifold as possible!",
      invariant:
        "Lloyd's Monotonicity Invariant: L(mu^{(t+1)}) <= L(mu^{(t)}). DBSCAN Invariant: Density-connectivity is an equivalence relation on core points.",
      stateTransitions:
        "Choose Center 1 Randomly -> Sample Centers 2..K with D^2 Distribution -> Assign Points to Nearest Centroid -> Recalculate Centroids -> Terminate at Convergence.",
      naiveBottleneck:
        "Pairwise N x N distance matrices in DBSCAN consume O(N^2) memory (80 GB for N=100K), crashing RAM.",
      optimalInsight:
        "Use spatial indexing structures (K-D Trees, Ball Trees) to evaluate epsilon-neighborhood queries in O(log N) time, dropping total complexity from O(N^2) to O(N log N).",
    },
    {
      type: "math_proof",
      title: "Arthur-Vassilvitskii K-Means++ Expected Potential Bound Proof",
      theorem:
        "Let $\\phi$ denote the K-Means clustering potential $\\sum_{i=1}^N \\min_{c \\in C} \\|x_i - c\\|_2^2$, and let $\\phi_{\\text{OPT}}$ be the optimal potential. The K-Means++ initialization algorithm selects a set of $K$ centers such that the expected potential satisfies:\n$$\\mathbb{E}[\\phi] \\le 8(\\ln K + 2) \\phi_{\\text{OPT}}$$",
      proof:
        "1. Let $C_1^*, \\dots, C_K^*$ denote the optimal clusters in the global optimum solution, and let $\\phi(C_k^*) = \\sum_{x \\in C_k^*} \\|x - \\mu(C_k^*)\\|_2^2$.\n2. Consider a single optimal cluster $C^*$. If center $c$ is sampled from $C^*$ according to distribution $P(x) = \\frac{D(x)^2}{\\sum_{y \\in C^*} D(y)^2}$:\n3. By the triangle inequality and properties of Euclidean dispersion:\n   $$\\mathbb{E}_{c \\sim C^*}[\\phi(C^*, c)] = \\sum_{x \\in C^*} \\mathbb{E}[\\|x - c\\|^2] = 2 \\phi(C^*)$$\n4. When centers are chosen sequentially with probability proportional to $D(x)^2$, the algorithm covers un-sampled optimal clusters $C_k^*$ with high probability.\n5. Let $u$ be the number of uncovered clusters. The probability of choosing a center from an uncovered cluster $C_k^*$ is at least $\\frac{\\phi(C_k^*)}{\\phi}$.\n6. Summing the expected potentials across all $K$ selection stages using harmonic series recurrence $\\sum_{k=1}^K \\frac{1}{k} \\le 1 + \\ln K$:\n   $$\\mathbb{E}[\\phi] \\le 2 \\phi_{\\text{OPT}} \\left( 1 + \\sum_{k=1}^{K-1} \\frac{1}{k} + 2 \\right) \\le 8(\\ln K + 2) \\phi_{\\text{OPT}}$$\n7. This proves that $D^2$-sampling prevents worst-case initialization divergence, guaranteeing an $O(\\log K)$ competitive ratio in polynomial time.",
    },
  ],
};
