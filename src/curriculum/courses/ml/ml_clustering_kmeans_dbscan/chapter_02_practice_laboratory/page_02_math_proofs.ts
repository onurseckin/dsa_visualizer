import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_clustering_kmeans_dbscan_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Lloyd Monotonicity & DBSCAN Equivalence",
  subtitle: "Convergence of WCSS and Density-Connectivity Equivalence Class Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Monotonic Non-Increasing Convergence of Lloyd's K-Means Algorithm",
      theorem:
        "Lloyd's K-Means algorithm monotonically decreases or maintains the Within-Cluster Sum of Squares objective $\\mathcal{L}(C, \\mu) = \\sum_{k=1}^K \\sum_{x \\in C_k} \\|x - \\mu_k\\|_2^2$ at every assignment and update step, guaranteeing convergence to a local minimum in a finite number of iterations.",
      proof:
        "1. Let $\\mathcal{L}(C^{(t)}, \\mu^{(t)})$ be the objective at iteration $t$.\n2. **Assignment Step**:\n   Each point $x_i$ is assigned to the nearest centroid $z_i^{(t+1)} = \\arg\\min_k \\|x_i - \\mu_k^{(t)}\\|^2$.\n   Therefore, for every $i$, $\\|x_i - \\mu_{z_i^{(t+1)}}^{(t)}\\|^2 \\le \\|x_i - \\mu_{z_i^{(t)}}^{(t)}\\|^2$.\n   Summing over all $N$ data points:\n   $$\\mathcal{L}(C^{(t+1)}, \\mu^{(t)}) = \\sum_{i=1}^N \\|x_i - \\mu_{z_i^{(t+1)}}^{(t)}\\|^2 \\le \\sum_{i=1}^N \\|x_i - \\mu_{z_i^{(t)}}^{(t)}\\|^2 = \\mathcal{L}(C^{(t)}, \\mu^{(t)})$$\n3. **Update Step**:\n   For each cluster $k$, the new centroid is $\\mu_k^{(t+1)} = \\frac{1}{|C_k^{(t+1)}|} \\sum_{x \\in C_k^{(t+1)}} x$.\n   Recall that for any set of vectors $S$, the sample mean $\\bar{x} = \\frac{1}{|S|} \\sum_{x \\in S} x$ uniquely minimizes the sum of squared Euclidean distances $\\sum_{x \\in S} \\|x - c\\|^2$.\n   Therefore:\n   $$\\sum_{x \\in C_k^{(t+1)}} \\|x - \\mu_k^{(t+1)}\\|^2 \\le \\sum_{x \\in C_k^{(t+1)}} \\|x - \\mu_k^{(t)}\\|^2$$\n   Summing over all $K$ clusters:\n   $$\\mathcal{L}(C^{(t+1)}, \\mu^{(t+1)}) \\le \\mathcal{L}(C^{(t+1)}, \\mu^{(t)})$$\n4. Combining both inequalities:\n   $$\\mathcal{L}(C^{(t+1)}, \\mu^{(t+1)}) \\le \\mathcal{L}(C^{(t)}, \\mu^{(t)})$$\n5. Since there are at most $K^N$ distinct partition assignments of $N$ points into $K$ clusters, and the objective decreases strictly unless the partition is identical, the algorithm must terminate in a finite number of steps at a local minimum.",
    },
    {
      type: "math_proof",
      title: "DBSCAN Density-Connectivity Equivalence Class Theorem",
      theorem:
        "Let $D$ be a dataset and let $C_{\\text{core}} \\subseteq D$ be the set of core points with respect to $(\\epsilon, \\text{MinPts})$. The relation 'density-connected' is a reflexive, symmetric, and transitive equivalence relation on $C_{\\text{core}}$, uniquely partitioning the core points into disjoint cluster equivalence classes.",
      proof:
        "1. **Reflexivity**: For any core point $p \\in C_{\\text{core}}$, $p \\in N_\\epsilon(p)$, so $p$ is directly density-reachable from itself through path $(p, p)$. Thus $p$ is density-connected to $p$.\n2. **Symmetry**: If $p$ is density-connected to $q$, then by definition there exists a point $o \\in D$ such that both $p$ and $q$ are density-reachable from $o$. Since the condition is symmetric in $p$ and $q$, $q$ is density-connected to $p$.\n3. **Transitivity**: Suppose $p$ is density-connected to $q$ (via core point $o_1$) and $q$ is density-connected to $r$ (via core point $o_2$).\n   Because $q$ is a core point, $o_1$ is connected to $q$ and $q$ is connected to $o_2$. Concatenating the density-reachable chains from $o_1$ to $q$ and $q$ to $r$ shows that $p$ and $r$ are density-reachable from $o_1$.\n   Therefore, $p$ is density-connected to $r$.\n4. Because density-connectivity satisfies reflexivity, symmetry, and transitivity on $C_{\\text{core}}$, it defines an equivalence relation.\n5. By the Fundamental Theorem of Equivalence Relations, $C_{\\text{core}}$ is uniquely partitioned into mutually disjoint equivalence classes, each forming the core of a distinct DBSCAN cluster.",
    },
  ],
};
