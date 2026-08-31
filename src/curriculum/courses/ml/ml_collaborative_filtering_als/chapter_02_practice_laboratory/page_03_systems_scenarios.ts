import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_collaborative_filtering_als_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Collaborative Filtering Diagnostics & Stress Tests",
  subtitle:
    "Question Bank Suite: Faiss MIPS Serving, Cold-Start Collapse, and Dual CSR-CSC Pipelining",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_collaborative_filtering_als",
      title: "Collaborative Filtering & ALS Systems Suite",
      partA_dsaCoding: [
        {
          title: "Multi-Core Parallel ALS Partitioned Solver",
          difficulty: "Hard",
          description:
            "Write a multi-threaded Python solver using joblib or ThreadPoolExecutor that executes user updates u_u across disjoint user ID chunks in parallel using precomputed Gram matrix V^T V.",
          problemStatement:
            "def parallel_user_als_step(user_chunks: list[list[int]], CSR_matrix, V: np.ndarray, VtV: np.ndarray, alpha: float) -> np.ndarray:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Implicit Confidence Monotonic Scaling",
          statement:
            "Prove that as interaction frequency r_ui -> inf, the effective implicit loss weight c_ui = 1 + alpha * r_ui forces the inner product u_u^T v_i -> 1 with residual error bounding O(1 / (alpha * r_ui)).",
          proofOutline:
            "In the user update normal equations, the term c_ui (1 - u_u^T v_i) v_i dominates all other terms as r_ui -> inf. Setting the leading derivative to zero requires 1 - u_u^T v_i = O(lambda / (alpha * r_ui)) -> 0.",
          engineeringContext:
            "This mathematical property guarantees that repeated user interactions (e.g. listening to a song 50 times) act as asymptotically hard positive preference constraints.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Maximum Inner Product Search (MIPS) Sub-Linear Serving with Faiss / HNSW",
          prompt:
            "In a production video platform with 1 billion items, computing dot products u_u^T v_i for all items at query time takes 100ms per request. How does vector quantization (IVF-PQ) or Hierarchical Navigable Small World (HNSW) graphs reduce retrieval latency to <2ms?",
          engineeringContext:
            "MIPS search structures the item embedding space into an approximate nearest neighbor graph (HNSW) or coarse Voronoi centroids with Product Quantization (IVF-PQ). Instead of a full 1-billion GEMV scan, the query traverses log(N) graph hops to retrieve the top-100 candidates in under 2 milliseconds.",
        },
      ],
      partD_stressTests: [
        {
          title: "Cold-Start User Factor Collapse to Zero Vector",
          scenario:
            "A new user registers on a music streaming platform with 0 interaction history. The ALS solver outputs u_u = [0.0, ..., 0.0]. The dot product with all item vectors evaluates to 0.0, breaking the sorting order of the recommendation carousel.",
          failureMode:
            "When |R_u| = 0, the linear system reduces to (V^T C^u V + lambda I) u_u = 0, which has the unique solution u_u = 0. All item dot products u_u^T v_i = 0 identically. Real-world systems intercept cold users (interaction count < 3) and serve a fallback heuristic popularity / multi-armed bandit exploration carousel until sufficient interactions are collected.",
        },
      ],
    },
  ],
};
