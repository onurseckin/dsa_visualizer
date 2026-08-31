import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_ann_hnsw_ivfpq_c1_p1",
  pageNumber: 1,
  title: "Approximate Vector Search: HNSW Graphs & IVF-PQ Quantization",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Billion-Scale Vector Memory Wall: 6 TB Down to 96 GB",
      content:
        "In modern Retrieval-Augmented Generation (RAG), multimodal search, and recommendation systems, vector databases (Milvus, Pinecone, Qdrant, FAISS) index billions of dense embeddings ($D = 768$ to $1536$). Storing 1 Billion 1536-dimensional FP32 vectors raw requires **$10^9 \\times 1536 \\times 4\\text{ bytes} = 6.14\\text{ Terabytes}$ of GPU/Host RAM**. Furthermore, scanning 6 TB of memory per query is physically impossible at sub-10ms latencies. **Hierarchical Navigable Small World (HNSW, Malkov & Yashunin, 2018)** and **Inverted File with Product Quantization (IVF-PQ, Jégou et al., 2011)** solve this crisis: HNSW navigates geometric proximity graphs in logarithmic **$O(\\log N)$ hops**, while Product Quantization compresses each vector from 6144 bytes down to **96 bytes ($64\\times$ compression)**, enabling single-node multi-billion vector retrieval with **Asymmetric Distance Computation (ADC)** lookup tables.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Multi-Layer Skip-Graph & Sub-Vector Codebooks",
      visualIntuition:
        "HNSW Multi-Layer Graph:\\nLayer 2 (Express Links):  [ Node A ] --------------------------> [ Node Z ] (Long-distance zoom)\\nLayer 1 (Medium Links):   [ Node A ] --------> [ Node M ] --------> [ Node Z ]\\nLayer 0 (Dense k-NN):     [ Node A ] -> [ B ] -> [ C ] -> [ D ] ... -> [ Z ] (Local precision search)\\n\\nProduct Quantization (IVF-PQ):\\n1536-D Vector -> Split into M=96 Sub-vectors of 16-D each\\nEach sub-vector -> Quantized to nearest of 256 Centroids (1 byte ID)\\nTotal footprint: Exactly 96 bytes per vector!",
      invariant:
        "ADC Asymmetric Distance Invariant: In ADC, the query vector Q is kept in full high-precision FP32. Sub-vector distances to all 256 codebook centroids are pre-computed ONCE into a tiny 1KB lookup table in L1 cache, evaluating any database vector's distance using M=96 table lookups and integer additions.",
      stateTransitions:
        "Raw Query Q -> Compute ADC Lookup Table T[m, centroid_id] (256 * M floats in L1) -> Coarse Quantizer (probe nearest IVF Voronoi centroids) -> Scan Inverted Lists -> For each candidate vector: dist = sum(T[m, code[m]]) -> Maintain Top-K Min-Heap -> Return nearest IDs.",
      naiveBottleneck:
        "Raw FP32 brute-force scanning requires streaming 6 TB from DRAM for every query, bottlenecking query throughput to < 5 QPS.",
      optimalInsight:
        "HNSW skips 99.9% of vertices via logarithmic graph layers, while IVF-PQ evaluates 10,000 candidate distances in < 50 microseconds using L1-resident lookup tables.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: HNSW Logarithmic Small-World Search Complexity",
      theorem:
        "In an HNSW graph constructed with level multiplier $m_L = 1 / \\ln(M)$, the maximum layer assigned to a node follows an exponential distribution $l = \\lfloor -\\ln(\\text{uniform}(0,1)) \\cdot m_L \\rfloor$. The expected number of greedy routing hops from top layer to bottom layer is bounded by $O(\\log N)$.",
      proof:
        "1. Layer Probability Distribution:\\nThe probability that a node is present at layer $l$ is $P(\\text{level} \\ge l) = \\exp(-l / m_L) = M^{-l}$.\\n\\n2. Layer Density and Skip Multiplier:\\nAt layer $l$, the expected number of nodes is $N_l = N \\cdot M^{-l}$.\\nSetting $m_L = 1 / \\ln(M)$ ensures that the density of nodes decreases geometrically by factor $M$ between consecutive layers (analogous to a Skip List with branching factor $M$).\\n\\n3. Top Layer Bound:\\nThe maximum layer $L_{\\max}$ satisfies $N \\cdot M^{-L_{\\max}} \\approx 1 \\implies L_{\\max} = O(\\log_M N) = O(\\log N)$.\\n\\n4. Hops per Layer:\\nAt each layer $l$, greedy routing traverses Delaunay-like small-world edges. By Kleinberg's Small-World Routing Theorem, greedy routing on a navigable small-world graph with power-law clustering traverses an expected constant number of hops $O(1)$ (or $O(\\log M)$) before reaching the local minimum entry point for layer $l - 1$.\\n\\n5. Total Search Complexity:\\nSumming across all $L_{\\max}$ layers:\\n$$T_{\\text{HNSW}} = \\sum_{l=0}^{L_{\\max}} O(1) = O(L_{\\max}) = O(\\log N)$$\\nThis establishes that HNSW traverses billion-scale datasets in logarithmic steps.",
    },
  ],
};

export const page_01_core = page1;
