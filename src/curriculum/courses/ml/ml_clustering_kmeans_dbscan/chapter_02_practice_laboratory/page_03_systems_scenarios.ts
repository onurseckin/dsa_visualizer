import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_clustering_kmeans_dbscan_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Clustering Systems Diagnostics & Stress Tests",
  subtitle:
    "Question Bank Suite: Elkan's Triangle Acceleration, Silhouette Bounds, and High-Dimensional Curse",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_clustering_kmeans_dbscan",
      title: "Clustering Algorithms Systems Suite",
      partA_dsaCoding: [
        {
          title: "Elkan's Triangle Inequality Accelerated K-Means",
          difficulty: "Hard",
          description:
            "Implement Elkan's K-Means algorithm using upper and lower bounds on point-to-center distances to skip up to 80% of distance calculations using the triangle inequality.",
          problemStatement: "class ElkanKMeans:\n    def __init__(self, k: int = 8):\n        pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Silhouette Coefficient Boundedness in [-1, 1]",
          statement:
            "Prove that for any data point x_i with mean intra-cluster distance a(i) and mean nearest-cluster distance b(i), the silhouette score s(i) = (b(i) - a(i)) / max(a(i), b(i)) is strictly bounded in [-1, 1].",
          proofOutline:
            "Since a(i) >= 0 and b(i) >= 0: If a(i) < b(i), s(i) = (b(i) - a(i)) / b(i) = 1 - a(i)/b(i) in [0, 1]. If a(i) >= b(i), s(i) = (b(i) - a(i)) / a(i) = b(i)/a(i) - 1 in [-1, 0]. In both cases, -1 <= s(i) <= 1.",
          engineeringContext:
            "Silhouette coefficients provide a normalized, metric-independent measure to determine the optimal number of clusters K without ground truth labels.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Mini-Batch K-Means Streaming Updates on High-Velocity Data",
          prompt:
            "In online recommendation systems clustering 100 million user embeddings per day, why is standard Lloyd's batch K-Means unviable, and how does Sculley's Mini-Batch K-Means achieve near-identical WCSS with O(1) streaming memory?",
          engineeringContext:
            "Mini-Batch K-Means processes micro-batches of size B (e.g. 512). Centroids are updated via an exponential moving average update mu_k <- (1 - eta) mu_k + eta x_i where learning rate eta = 1 / count(k). This streams through data in a single pass with constant O(K D) memory without storing dataset points in RAM.",
        },
      ],
      partD_stressTests: [
        {
          title: "Curse of Dimensionality in High-Dimensional DBSCAN",
          scenario:
            "DBSCAN is executed on 1024-dimensional text embeddings with eps = 0.5. Every single data point in the entire 100,000-sample dataset is labeled as -1 (Noise).",
          failureMode:
            "In high dimensions (D = 1024), distance concentration causes Euclidean distances between any two random vectors to concentrate around sqrt(2) * ||x||. The volume of an epsilon-ball drops exponentially as (eps / R)^D. For eps = 0.5, all pairwise distances exceed 1.2, so no point has >= MinPts neighbors. Performing PCA/UMAP dimension reduction to D <= 32 prior to DBSCAN restores density contrast.",
        },
      ],
    },
  ],
};
