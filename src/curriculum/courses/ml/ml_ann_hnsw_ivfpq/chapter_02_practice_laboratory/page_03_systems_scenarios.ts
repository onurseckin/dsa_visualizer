import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_ann_hnsw_ivfpq_c2_p3",
  pageNumber: 4,
  title: "4-Part Socratic Diagnostic Suite: Approximate Vector Search",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_ann_hnsw_ivfpq",
      title: "HNSW & IVF-PQ Vector Database Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "SIMD-Accelerated ADC Lookup Table Kernel",
          description:
            "Implement a low-level vectorized ADC distance evaluation kernel using numpy/C++ intrinsics that scans $N=100,000$ 96-byte quantized vector codes against an L1-resident $96 \\times 256$ float32 lookup table in under 2 milliseconds.",
          problemStatement:
            "Given ADC lookup table and matrix of uint8 PQ codes, evaluate approximate top-k nearest neighbors with zero allocations inside the inner loop.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Recall Degradation under Quantization Noise Bound",
          prompt:
            "Prove that if the distance gap between the true nearest neighbor $x_{(1)}$ and the $(k+1)$-th neighbor $x_{(k+1)}$ satisfies $\\|q - x_{(k+1)}\\|^2 - \\|q - x_{(1)}\\|^2 > 4 \\sqrt{\\text{MSE}_{\\text{PQ}}} \\|q\\|$, the Product Quantization ADC ranking is guaranteed to preserve the true top-1 nearest neighbor with zero ranking inversion.",
          statement:
            "Derive the minimum vector margin required for 100% Top-1 Recall under PQ noise.",
          proofOutline:
            "1. By the ADC error theorem, maximum distance distortion for any vector is $|\\Delta d| \\le 2 \\|q\\| \\sqrt{\\text{MSE}_{\\text{PQ}}}$.\\n2. The worst-case perturbed distance for true nearest neighbor is $d(x_{(1)}) + 2 \\|q\\| \\sqrt{\\text{MSE}}$.\\n3. The worst-case perturbed distance for competitor $x_{(k+1)}$ is $d(x_{(k+1)}) - 2 \\|q\\| \\sqrt{\\text{MSE}}$.\\n4. Ranking inversion is impossible if $d(x_{(1)}) + 2 \\|q\\| \\sqrt{\\text{MSE}} < d(x_{(k+1)}) - 2 \\|q\\| \\sqrt{\\text{MSE}} \\implies d(x_{(k+1)}) - d(x_{(1)}) > 4 \\|q\\| \\sqrt{\\text{MSE}}$.",
          engineeringContext:
            "Explains why RAG retrieval accuracy remains high even when vectors are compressed by 64x.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "HNSW Lock-Free Concurrent Insertion & Memory Bloat",
          prompt:
            "In real-time streaming vector databases (e.g. Pinecone, Milvus), how does HNSW handle high-throughput concurrent insertions without locking the entire graph? Why does storing bidirectional graph edges (`M=32` edges per node = $32 \\times 2 \\times 4\\text{ bytes} = 256\\text{ bytes}$ per vector) consume more RAM than the raw vectors themselves for low-dimensional data?",
          engineeringContext:
            "Governs vector database memory capacity planning and garbage collection policies.",
        },
      ],
      partD_stressTests: [
        {
          title: "Disconnected Island Graph Collapse in Incremental HNSW",
          scenario:
            "A vector database ingests embeddings in sorted temporal batches. Because all points in batch $t$ are distant from batch $t-1$, the HNSW heuristic edge selection algorithm fails to connect the new cluster to the global entry point. Queries for recent documents fall into local minima in older clusters, dropping search recall from 98% down to 12%.",
          failureMode:
            "Graph disconnection and local minima trapping in dynamically indexed vector collections.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
