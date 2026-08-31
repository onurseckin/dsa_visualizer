import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_kd_trees_top_k_c2_p3",
  pageNumber: 4,
  title: "4-Part Socratic Diagnostic Suite: K-D Trees & Spatial Systems",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_kd_trees_top_k",
      title: "K-D Trees & High-Dimensional Nearest Neighbors Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Branchless Ball-Tree Distance Evaluator",
          description:
            "Implement a Ball Tree (metric tree with hyperspherical bounding balls `(center, radius)`) that computes Euclidean distance upper/lower bounds using SIMD dot products and prunes subtrees where $\\|q - c\\| - R > r_k$.",
          problemStatement:
            "Given point dataset and queries, build a binary ball tree and execute top-k search with branchless distance bounding.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Triangle Inequality Bound in Metric Trees",
          prompt:
            "Prove that for any query point $q$, ball center $c$, ball radius $R$, and dataset point $x \\in B(c, R)$, $\\|q - x\\|_2 \\ge \\|q - c\\|_2 - R$.",
          statement: "Derive how metric spaces enable coordinate-free branch pruning.",
          proofOutline:
            "1. By the reverse triangle inequality on Euclidean norms, $\\|q - x\\| \\ge |\\|q - c\\| - \\|c - x\\||$.\\n2. For any point $x$ inside ball $B(c, R)$, $\\|c - x\\| \\le R$.\\n3. If $\\|q - c\\| > R$, then $\\|q - x\\| \\ge \\|q - c\\| - R$.\\n4. If $\\|q - c\\| - R \\ge r_k$, no point in ball $B(c, R)$ can be closer than $r_k$, allowing total subtree elimination.",
          engineeringContext:
            "Forms the theoretical foundation of Vantage Point (VP) Trees and Ball Trees.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Why FAISS and Milvus Abandoned K-D Trees for Vector Search",
          prompt:
            "Why do production vector search engines (FAISS, Milvus, Qdrant) refuse to use K-D Trees for 1536-dimensional embeddings? At what exact crossover dimension $D^*$ does a contiguous flat array linear scan become faster than a K-D Tree?",
          engineeringContext:
            "At $D > 16$, cache thrashing and 100% node exploration make flat scans faster.",
        },
      ],
      partD_stressTests: [
        {
          title: "Memory Fragmentation Disaster in Dynamically Updated K-D Trees",
          scenario:
            "A geospatial service inserts 10,000 coordinates per second into a pointer-based K-D Tree without rebalancing. Over 24 hours, single-node allocations fragment 128GB of Host RAM into millions of tiny 32-byte chunks, dropping search query rate from 50,000 QPS down to 800 QPS.",
          failureMode:
            "Severe memory fragmentation and extreme TLB (Translation Lookaside Buffer) cache thrashing.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
