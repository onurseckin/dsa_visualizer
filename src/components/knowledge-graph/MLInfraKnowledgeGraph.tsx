import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCanvasBox, boxViewBox, viewBoxAttr } from "../primitives/vizGeometry";

export interface QuestionItem {
  id: string;
  title: string;
  algorithmId: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "Foundational Math & DSA" | "ML Systems Implementation";
  description: string;
}

export interface TopicClusterNode {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  tier: string;
  tierNum: number;
  prerequisites: string[];
  x: number;
  y: number;
  questions: QuestionItem[];
}

export function getTopicDifficulty(topic: TopicClusterNode): "Easy" | "Medium" | "Hard" {
  const diffs = new Set(topic.questions.map((q) => q.difficulty));
  if (diffs.has("Hard")) return "Hard";
  if (diffs.has("Medium")) return "Medium";
  return "Easy";
}

export const TOPIC_CLUSTERS: TopicClusterNode[] = [
  {
    id: "ml_tensor_algebra",
    title: "Tensor Algebra & Memory Layout",
    shortLabel: "Tensor Algebra & Layout",
    description:
      "Multi-dimensional tensor indexing, strided memory layouts, NCHW/NHWC offsets, and contiguity validation.",
    tier: "Tier 1: Foundations",
    tierNum: 1,
    prerequisites: [],
    x: 550,
    y: 1200,
    questions: [
      {
        id: "2d-array-matrix-traversal",
        title: "2D Matrix Memory Traversal",
        algorithmId: "2d-array-matrix-traversal",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description:
          "Sequential row-major vs column-major memory access patterns and cache line locality.",
      },
      {
        id: "strided-index-arithmetic",
        title: "Strided Index Arithmetic",
        algorithmId: "strided-index-arithmetic",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description:
          "Mapping N-dimensional tensor coordinates to 1D flat buffer offsets using stride dot products.",
      },
      {
        id: "tensor-stride-offset",
        title: "Tensor Stride & Offset Layout",
        algorithmId: "tensor-stride-offset",
        difficulty: "Easy",
        type: "ML Systems Implementation",
        description:
          "Multi-dimensional tensor memory stride calculation, 1D flat buffer layout, and NCHW/NHWC offsets.",
      },
      {
        id: "tensor-contiguity-reshape",
        title: "Tensor Contiguity & Zero-Copy Reshape",
        algorithmId: "tensor-contiguity-reshape",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Non-contiguous view stride validation, zero-copy transpose vs eager contiguous memory clone.",
      },
    ],
  },
  {
    id: "ml_tokenization",
    title: "Tokenization & Subword Tries",
    shortLabel: "Tokenization & Tries",
    description:
      "Subword text tokenization, Byte-Pair Encoding (BPE), and Viterbi dynamic programming lattice decoding.",
    tier: "Tier 1: Foundations",
    tierNum: 1,
    prerequisites: [],
    x: 1050,
    y: 1200,
    questions: [
      {
        id: "trie-prefix-tree-search",
        title: "Trie Prefix Tree Insert & Search",
        algorithmId: "trie-prefix-tree-search",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description:
          "Prefix trie structure for fast dictionary lookup and character transition routing.",
      },
      {
        id: "bpe-tokenizer",
        title: "Byte-Pair Encoding (BPE)",
        algorithmId: "bpe-tokenizer",
        difficulty: "Easy",
        type: "ML Systems Implementation",
        description:
          "Greedy subword tokenization, adjacent symbol frequency table counting, and iterative pair merging.",
      },
      {
        id: "viterbi-subword-segmenter",
        title: "Viterbi Subword Segmenter",
        algorithmId: "viterbi-subword-segmenter",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Unigram language model tokenization via Viterbi dynamic programming shortest-path lattice decoding.",
      },
    ],
  },
  {
    id: "ml_gemm_roofline",
    title: "GEMM & Roofline Model",
    shortLabel: "GEMM & Roofline",
    description:
      "High-performance matrix multiplication tiling, SRAM shared memory access, and arithmetic intensity classification.",
    tier: "Tier 2: Core Math",
    tierNum: 2,
    prerequisites: ["ml_tensor_algebra"],
    x: 400,
    y: 990,
    questions: [
      {
        id: "matrix-multiplication-naive",
        title: "Naive Matrix Multiplication O(N^3)",
        algorithmId: "matrix-multiplication-naive",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description:
          "Standard triple-loop matrix multiplication baseline and memory access bottlenecks.",
      },
      {
        id: "sram-gemm-tiling",
        title: "SRAM GEMM Tiling",
        algorithmId: "sram-gemm-tiling",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Block matrix multiplication loading sub-tiles into high-speed GPU SRAM / shared memory.",
      },
      {
        id: "roofline-intensity-classifier",
        title: "Roofline Arithmetic Intensity",
        algorithmId: "roofline-intensity-classifier",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Classification of kernels as memory-bound or compute-bound based on FLOPs per byte transferred.",
      },
    ],
  },
  {
    id: "ml_autograd_dags",
    title: "Autograd & Computational DAGs",
    shortLabel: "Autograd & DAGs",
    description:
      "Reverse-mode automatic differentiation, Vector-Jacobian Products (VJP), and memory activation checkpointing.",
    tier: "Tier 2: Core Math",
    tierNum: 2,
    prerequisites: ["ml_tensor_algebra"],
    x: 800,
    y: 990,
    questions: [
      {
        id: "topological-sort-dag",
        title: "Topological Sort for DAG Execution",
        algorithmId: "topological-sort-dag",
        difficulty: "Medium",
        type: "Foundational Math & DSA",
        description: "Ordering computational graph nodes based on dependency edge constraints.",
      },
      {
        id: "autograd-vjp-dag",
        title: "Autograd VJP DAG",
        algorithmId: "autograd-vjp-dag",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Reverse-mode automatic differentiation computing Vector-Jacobian Products via topological DAG traversal.",
      },
      {
        id: "activation-checkpointing",
        title: "Activation Checkpointing",
        algorithmId: "activation-checkpointing",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Trading compute for memory by saving a subset of activations and recomputing during backward pass.",
      },
    ],
  },
  {
    id: "ml_convolutions",
    title: "Convolutional Tiling & im2col",
    shortLabel: "Convolutions & im2col",
    description:
      "Spatial 2D filter convolutions lowered into matrix multiplication via im2col memory unrolling.",
    tier: "Tier 2: Core Math",
    tierNum: 2,
    prerequisites: ["ml_tensor_algebra"],
    x: 1200,
    y: 990,
    questions: [
      {
        id: "conv2d-sliding-window",
        title: "2D Sliding Window Stride Convolution",
        algorithmId: "conv2d-sliding-window",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description:
          "Direct sliding window cross-correlation computation over 2D input grids.",
      },
      {
        id: "im2col-conv-tiling",
        title: "im2col Conv Tiling",
        algorithmId: "im2col-conv-tiling",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Unrolling 2D image receptive fields into matrix columns for high-throughput GEMM execution.",
      },
    ],
  },
  {
    id: "ml_precision_quantization",
    title: "Precision & Quantization",
    shortLabel: "Precision & Quantization",
    description:
      "Numeric representation bounds, uniform scale/zero-point INT8 quantization, and SmoothQuant outlier scaling.",
    tier: "Tier 3: Intermediate Systems",
    tierNum: 3,
    prerequisites: ["ml_tensor_algebra"],
    x: 320,
    y: 780,
    questions: [
      {
        id: "floating-point-overflow",
        title: "FP16 / FP32 Numeric Underflow & Overflow",
        algorithmId: "floating-point-overflow",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description:
          "IEEE-754 exponent ranges, denormal numbers, and precision loss in low-bit representations.",
      },
      {
        id: "affine-quantization-sq8",
        title: "Affine INT8 Quantization",
        algorithmId: "affine-quantization-sq8",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Uniform scale and zero-point mapping between FP32 continuous values and INT8 quantized integers.",
      },
      {
        id: "smoothquant-scaling",
        title: "SmoothQuant Outlier Scaling",
        algorithmId: "smoothquant-scaling",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Mathematical migration of activation channel magnitude outliers into static weight matrices.",
      },
    ],
  },
  {
    id: "ml_recurrent_gates",
    title: "Recurrent Gates & Sequences",
    shortLabel: "Recurrent Gates",
    description:
      "Recurrent sequence unrolling, Backpropagation Through Time (BPTT), and LSTM Constant Error Carousels.",
    tier: "Tier 3: Intermediate Systems",
    tierNum: 3,
    prerequisites: ["ml_autograd_dags"],
    x: 640,
    y: 780,
    questions: [
      {
        id: "recurrent-unrolling-bptt",
        title: "Recurrent Sequence Unrolling & BPTT",
        algorithmId: "recurrent-unrolling-bptt",
        difficulty: "Medium",
        type: "Foundational Math & DSA",
        description:
          "Unrolling recurrent network transitions over time steps for gradient propagation.",
      },
      {
        id: "lstm-constant-error-carousel",
        title: "LSTM Error Carousel",
        algorithmId: "lstm-constant-error-carousel",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Gated cell state updates maintaining constant error carousel to prevent vanishing gradients.",
      },
    ],
  },
  {
    id: "ml_vector_search",
    title: "Vector Search & Spatial Geometry",
    shortLabel: "Vector Search",
    description:
      "Approximate Nearest Neighbor (ANN) search via Locality-Sensitive Hashing, IVF-PQ, and HNSW skip-graphs.",
    tier: "Tier 3: Intermediate Systems",
    tierNum: 3,
    prerequisites: ["ml_tensor_algebra"],
    x: 960,
    y: 780,
    questions: [
      {
        id: "distance-metrics-knn",
        title: "Euclidean & Cosine Distance Metrics",
        algorithmId: "distance-metrics-knn",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "Exact pairwise vector norm distances and cosine similarity metrics.",
      },
      {
        id: "lsh-vector-hashing",
        title: "LSH Vector Hashing",
        algorithmId: "lsh-vector-hashing",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Random hyperplane projection hashing for sub-linear approximate cosine similarity search.",
      },
      {
        id: "ivf-pq-adc-search",
        title: "IVF-PQ ADC Search",
        algorithmId: "ivf-pq-adc-search",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Inverted File Product Quantization with Asymmetric Distance Computation lookup tables.",
      },
      {
        id: "hnsw-vector-search",
        title: "HNSW Vector Search",
        algorithmId: "hnsw-vector-search",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Multi-layer skip-list graph traversal for fast high-dimensional k-NN vector search.",
      },
    ],
  },
  {
    id: "ml_tree_ensembles",
    title: "Tree Ensembles & Gradient Boosting",
    shortLabel: "Tree Ensembles",
    description:
      "Decision tree impurity splits, Gini index computation, and XGBoost 1st/2nd order gradient histogram splitting.",
    tier: "Tier 3: Intermediate Systems",
    tierNum: 3,
    prerequisites: ["ml_autograd_dags"],
    x: 1280,
    y: 780,
    questions: [
      {
        id: "decision-tree-gini-split",
        title: "Decision Tree Impurity & Split",
        algorithmId: "decision-tree-gini-split",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "Gini impurity reduction calculation for optimal feature threshold partitioning.",
      },
      {
        id: "xgboost-gradient-split",
        title: "XGBoost Gradient Split",
        algorithmId: "xgboost-gradient-split",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Exact greedy and histogram-based split finding utilizing 1st and 2nd order gradient statistics.",
      },
    ],
  },
  {
    id: "ml_attention_geometry",
    title: "Attention Geometry & RoPE",
    shortLabel: "Attention & RoPE",
    description:
      "Scaled Dot-Product Attention, Rotary Position Embeddings (RoPE), and Grouped-Query Attention (GQA).",
    tier: "Tier 4: Advanced Kernels",
    tierNum: 4,
    prerequisites: ["ml_gemm_roofline"],
    x: 550,
    y: 570,
    questions: [
      {
        id: "scaled-dot-attention-mask",
        title: "Scaled Dot-Product Attention",
        algorithmId: "scaled-dot-attention-mask",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Query-Key-Value matrix attention with scale factor and causal lower-triangular masking.",
      },
      {
        id: "rope-rotary-position",
        title: "RoPE Rotary Position Embedding",
        algorithmId: "rope-rotary-position",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Rotational 2D complex plane matrix transformation encoding relative positional distance.",
      },
      {
        id: "grouped-query-attention",
        title: "Grouped-Query Attention (GQA)",
        algorithmId: "grouped-query-attention",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Partitioning Q heads into G groups sharing KV heads to compress KV-cache memory bandwidth.",
      },
    ],
  },
  {
    id: "ml_hardware_kernels",
    title: "Hardware Kernels & Fusion",
    shortLabel: "Hardware Kernels",
    description:
      "Fused softmax with Log-Sum-Exp tracking, Triton JIT block-wise compilation, and FlashAttention IO tiling.",
    tier: "Tier 4: Advanced Kernels",
    tierNum: 4,
    prerequisites: ["ml_gemm_roofline"],
    x: 1050,
    y: 570,
    questions: [
      {
        id: "fused-softmax-lse",
        title: "Fused Softmax & LSE",
        algorithmId: "fused-softmax-lse",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description:
          "Online single-pass softmax with Log-Sum-Exp tracking to eliminate HBM intermediate writes.",
      },
      {
        id: "triton-kernel-fusion",
        title: "Triton JIT Kernel Fusion",
        algorithmId: "triton-kernel-fusion",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Block-wise Python JIT compiler emitting fused GPU CUDA/PTX kernels without manual C++.",
      },
      {
        id: "flash-attention-tiling",
        title: "FlashAttention IO Tiling",
        algorithmId: "flash-attention-tiling",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Memory IO-aware exact attention loading Q, K, V blocks into SRAM with online softmax rescaling.",
      },
    ],
  },
  {
    id: "ml_distributed_systems",
    title: "Distributed Systems & Parallelism",
    shortLabel: "Distributed Systems",
    description:
      "Ring-AllReduce topology, Megatron Tensor/Sequence Parallelism, and DeepSpeed ZeRO 1-3 memory sharding.",
    tier: "Tier 5: Frontier Parallelism",
    tierNum: 5,
    prerequisites: ["ml_autograd_dags", "ml_hardware_kernels"],
    x: 800,
    y: 360,
    questions: [
      {
        id: "ring-allreduce-partition",
        title: "Ring-AllReduce Partition",
        algorithmId: "ring-allreduce-partition",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Bandwidth-optimal ring topology Scatter-Reduce and All-Gather distributed gradient synchronization.",
      },
      {
        id: "megatron-tp-sp-split",
        title: "Megatron TP/SP Parallelism",
        algorithmId: "megatron-tp-sp-split",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Column/Row parallel GEMM splitting with Sequence Parallel All-Gather and Reduce-Scatter.",
      },
      {
        id: "deepspeed-zero-sharding",
        title: "ZeRO Memory Sharding",
        algorithmId: "deepspeed-zero-sharding",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "ZeRO Stage 1-3 memory sharding of optimizer states, gradients, and model parameters across GPUs.",
      },
    ],
  },
  {
    id: "ml_llm_serving",
    title: "LLM Serving & Continuous Batching",
    shortLabel: "LLM Serving",
    description:
      "PagedAttention block table virtual memory allocation, iteration-level continuous batching, and speculative decoding.",
    tier: "Tier 6: Frontier LLM Serving",
    tierNum: 6,
    prerequisites: ["ml_attention_geometry", "ml_hardware_kernels"],
    x: 800,
    y: 140,
    questions: [
      {
        id: "paged-attention-block-table",
        title: "PagedAttention Block Table",
        algorithmId: "paged-attention-block-table",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Virtual memory block allocation mapping logical sequence KV-tokens to non-contiguous physical GPU pages.",
      },
      {
        id: "continuous-batching-scheduler",
        title: "Continuous Batching Scheduler",
        algorithmId: "continuous-batching-scheduler",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Iteration-level prefill & decode scheduling dynamically inserting new requests without waiting for sequence completion.",
      },
      {
        id: "speculative-decoding-verifier",
        title: "Speculative Decoding Verifier",
        algorithmId: "speculative-decoding-verifier",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description:
          "Draft model speculative token generation verified in a single parallel target model forward pass.",
      },
    ],
  },
];

export interface MLInfraKnowledgeGraphProps {
  onSelectCategoryFolder?: (folder: string) => void;
  onNavigateToAlgorithm?: (algorithmId: string) => void;
}

export const MLInfraKnowledgeGraph: React.FC<MLInfraKnowledgeGraphProps> = ({
  onSelectCategoryFolder,
  onNavigateToAlgorithm,
}) => {
  let navigate: ((opts: { to: string; params?: Record<string, string> }) => void) | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [drawerTopicId, setDrawerTopicId] = useState<string | null>(null);

  const { ref, box } = useCanvasBox({ width: 1600, height: 1400 });
  const viewBox = boxViewBox(box);
  const viewBoxString = viewBoxAttr(viewBox);

  const topicMap = useMemo(() => {
    const map = new Map<string, TopicClusterNode>();
    TOPIC_CLUSTERS.forEach((tc) => map.set(tc.id, tc));
    return map;
  }, []);

  const activeDrawerTopic = drawerTopicId ? topicMap.get(drawerTopicId) || null : null;

  const handleSelectTopicNode = (topic: TopicClusterNode) => {
    setDrawerTopicId(topic.id);
    if (onSelectCategoryFolder) {
      onSelectCategoryFolder(topic.id);
    }
  };

  const handleNavigateQuestion = (algorithmId: string) => {
    if (onNavigateToAlgorithm) {
      onNavigateToAlgorithm(algorithmId);
    } else if (navigate) {
      navigate({ to: "/workspace/$algorithmId", params: { algorithmId } });
    } else if (typeof window !== "undefined") {
      window.location.href = `/workspace/${algorithmId}`;
    }
  };

  const nodeWidth = 250;
  const nodeHeight = 64;
  const halfW = nodeWidth / 2;
  const halfH = nodeHeight / 2;

  return (
    <div
      role="region"
      aria-label="ML Infrastructure Knowledge Tree"
      className="h-[calc(100vh-3.5rem)] w-full overflow-hidden flex flex-col relative bg-[var(--bg-page)]"
    >
      {/* Slide-Over Topic Sidebar Drawer */}
      {activeDrawerTopic && (
        <div
          role="dialog"
          aria-label={`${activeDrawerTopic.title} Drawer`}
          className="absolute right-0 top-0 bottom-0 z-30 w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-default)] p-6 shadow-2xl overflow-y-auto flex flex-col gap-5"
        >
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {activeDrawerTopic.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                {activeDrawerTopic.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerTopicId(null)}
              aria-label="Close Topic Drawer"
              className="p-1.5 rounded-lg bg-[var(--bg-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)] transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Prerequisite Topics if any */}
          {activeDrawerTopic.prerequisites.length > 0 && (
            <div className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[var(--text-secondary)]">Prerequisites:</span>
              {activeDrawerTopic.prerequisites.map((pId) => {
                const pTopic = topicMap.get(pId);
                return (
                  <span
                    key={pId}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-inset)] text-[var(--accent)] border border-[var(--border-default)]"
                  >
                    {pTopic?.shortLabel || pId}
                  </span>
                );
              })}
            </div>
          )}

          {/* Curated Questions List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Curated Problems ({activeDrawerTopic.questions.length})
            </h3>

            {activeDrawerTopic.questions.map((q) => {
              const isFoundational = q.type === "Foundational Math & DSA";

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-default)] hover:border-[var(--border-accent)] transition-all flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        isFoundational
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {q.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.difficulty === "Easy"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : q.difficulty === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">{q.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {q.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(q.algorithmId)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer text-center"
                  >
                    Visualize {q.algorithmId} in Workspace →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Canvas following Canvas Law */}
      <div ref={ref} className="w-full h-full flex-1 relative overflow-hidden select-none">
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxString}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full block relative z-0"
        >
          <defs>
            <marker
              id="topic-arrow-dim"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border-default)" />
            </marker>
            <marker
              id="topic-arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Orthogonal 4-Directional Connector Lines */}
          <g className="connectors">
            {TOPIC_CLUSTERS.map((topic) => {
              return topic.prerequisites.map((pId) => {
                const parent = topicMap.get(pId);
                if (!parent) return null;

                const isConnectedToDrawer =
                  drawerTopicId === topic.id || drawerTopicId === parent.id;
                const isHovered = hoveredNodeId === topic.id || hoveredNodeId === parent.id;
                const isHighlight = isConnectedToDrawer || isHovered;

                const startX = parent.x;
                const startY = parent.y - halfH;
                const endX = topic.x;
                const endY = topic.y + halfH;
                const midY = (startY + endY) / 2;

                const pathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;

                return (
                  <path
                    key={`${pId}->${topic.id}`}
                    d={pathD}
                    fill="none"
                    stroke={isHighlight ? "var(--accent)" : "var(--border-default)"}
                    strokeWidth={isHighlight ? 2.5 : 1.5}
                    markerEnd={isHighlight ? "url(#topic-arrow-active)" : "url(#topic-arrow-dim)"}
                    className="transition-all duration-300"
                    opacity={isHighlight ? 1 : 0.6}
                  />
                );
              });
            })}
          </g>

          {/* 13 Topic Cluster Nodes */}
          <g className="nodes">
            {TOPIC_CLUSTERS.map((topic) => {
              const isHovered = hoveredNodeId === topic.id;
              const isSelectedNode = drawerTopicId === topic.id;

              return (
                <g
                  key={topic.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${topic.title}. ${topic.questions.length} problems. Click to view questions drawer.`}
                  transform={`translate(${topic.x - halfW}, ${topic.y - halfH})`}
                  onClick={() => handleSelectTopicNode(topic)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectTopicNode(topic);
                    }
                  }}
                  onMouseEnter={() => setHoveredNodeId(topic.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onFocus={() => setHoveredNodeId(topic.id)}
                  onBlur={() => setHoveredNodeId(null)}
                  style={{
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {/* Clean Outer Node Rect */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={12}
                    fill={isSelectedNode || isHovered ? "var(--bg-inset)" : "var(--bg-surface)"}
                    stroke={isSelectedNode || isHovered ? "var(--accent)" : "var(--border-default)"}
                    strokeWidth={isSelectedNode || isHovered ? 2 : 1.5}
                    className="transition-all duration-200"
                  />

                  {/* Clean Title Text */}
                  <text
                    x={halfW}
                    y={26}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    className="font-bold text-[13px] select-none"
                  >
                    {topic.title}
                  </text>

                  {/* Clean Subtitle Text */}
                  <text
                    x={halfW}
                    y={46}
                    textAnchor="middle"
                    fill="var(--accent)"
                    className="font-mono text-[11px] font-semibold select-none"
                  >
                    {topic.questions.length} Problems • {getTopicDifficulty(topic)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MLInfraKnowledgeGraph;
