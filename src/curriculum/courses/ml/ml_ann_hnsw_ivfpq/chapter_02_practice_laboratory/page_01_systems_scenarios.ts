import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_ann_hnsw_ivfpq_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: Billion-Scale Vector DB Sizing & Memory Capacity Planning",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Production System Scenario: Multi-Billion Embedding RAG Cluster Sizing",
      content:
        "An enterprise search platform indexes $10^9$ document chunks using 1536-dimensional embeddings. Storing vectors raw in FP32 requires 6.14 TB of RAM, requiring a cluster of 16 expensive 512GB RAM server nodes ($50,000/month). By deploying an IVF-PQ index ($M = 96$, $K = 256$) combined with an on-disk memory-mapped graph (DiskANN/SPTAG), total RAM consumption drops to **96 GB for PQ codes + 32 GB for Voronoi centroids**, enabling the entire 1 Billion vector index to run on a single commodity 256GB server node with sub-15ms 99th-percentile latency.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_ann_hnsw_memory_sizer",
      title: "Vector DB Capacity & Bandwidth Calculator",
      difficulty: "Hard",
      rationale:
        "Compute exact memory footprints and search QPS limits for Flat, HNSW, and IVF-PQ indexing schemes across billion-scale vector datasets.",
      starterCode: `def calculate_vector_index_metrics(
    num_vectors: int,
    dim: int,
    index_type: str, # "flat", "hnsw", "ivf_pq"
    hnsw_M: int = 32,
    pq_M: int = 96
) -> dict:
    """
    Computes exact byte footprint and theoretical QPS bounds.
    """
    if index_type == "flat":
        raw_bytes = num_vectors * dim * 4
        return {"total_ram_gb": raw_bytes / 1e9, "bytes_per_vector": dim * 4}
    elif index_type == "hnsw":
        raw_bytes = num_vectors * dim * 4
        graph_bytes = num_vectors * hnsw_M * 2 * 4  # Bidirectional graph edges
        return {"total_ram_gb": (raw_bytes + graph_bytes) / 1e9, "bytes_per_vector": dim * 4 + hnsw_M * 8}
    elif index_type == "ivf_pq":
        pq_bytes = num_vectors * pq_M * 1  # 1 byte per sub-vector
        return {"total_ram_gb": pq_bytes / 1e9, "bytes_per_vector": pq_M}
    return {}`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
