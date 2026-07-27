import React, { useState, useMemo, useRef } from "react";
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

export const TOPIC_CLUSTERS: TopicClusterNode[] = [
  {
    id: "ml_tensor_algebra",
    title: "Tensor Algebra & Memory Layout",
    shortLabel: "Tensor Algebra & Layout",
    description: "Multi-dimensional tensor indexing, strided memory layouts, NCHW/NHWC offsets, and contiguity validation.",
    tier: "Tier 1: Foundations",
    tierNum: 1,
    prerequisites: [],
    x: 350,
    y: 100,
    questions: [
      {
        id: "array-matrix-traversal",
        title: "2D Matrix Memory Traversal",
        algorithmId: "array-matrix-traversal",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "Sequential row-major vs column-major memory access patterns and cache line locality.",
      },
      {
        id: "strided-index-arithmetic",
        title: "Strided Index Arithmetic",
        algorithmId: "strided-index-arithmetic",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "Mapping N-dimensional tensor coordinates to 1D flat buffer offsets using stride dot products.",
      },
      {
        id: "tensor-stride-offset",
        title: "Tensor Stride & Offset Layout",
        algorithmId: "tensor-stride-offset",
        difficulty: "Easy",
        type: "ML Systems Implementation",
        description: "Multi-dimensional tensor memory stride calculation, 1D flat buffer layout, and NCHW/NHWC offsets.",
      },
      {
        id: "tensor-contiguity-reshape",
        title: "Tensor Contiguity & Zero-Copy Reshape",
        algorithmId: "tensor-contiguity-reshape",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Non-contiguous view stride validation, zero-copy transpose vs eager contiguous memory clone.",
      },
    ],
  },
  {
    id: "ml_tokenization",
    title: "Tokenization & Subword Tries",
    shortLabel: "Tokenization & Tries",
    description: "Subword text tokenization, Byte-Pair Encoding (BPE), and Viterbi dynamic programming lattice decoding.",
    tier: "Tier 1: Foundations",
    tierNum: 1,
    prerequisites: [],
    x: 1050,
    y: 100,
    questions: [
      {
        id: "trie-prefix-tree-search",
        title: "Trie Prefix Tree Insert & Search",
        algorithmId: "trie-prefix-tree-search",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "Prefix trie structure for fast dictionary lookup and character transition routing.",
      },
      {
        id: "bpe-tokenizer",
        title: "Byte-Pair Encoding (BPE)",
        algorithmId: "bpe-tokenizer",
        difficulty: "Easy",
        type: "ML Systems Implementation",
        description: "Greedy subword tokenization, adjacent symbol frequency table counting, and iterative pair merging.",
      },
      {
        id: "viterbi-subword-segmenter",
        title: "Viterbi Subword Segmenter",
        algorithmId: "viterbi-subword-segmenter",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Unigram language model tokenization via Viterbi dynamic programming shortest-path lattice decoding.",
      },
    ],
  },
  {
    id: "ml_gemm_roofline",
    title: "GEMM & Roofline Model",
    shortLabel: "GEMM & Roofline",
    description: "High-performance matrix multiplication tiling, SRAM shared memory access, and arithmetic intensity classification.",
    tier: "Tier 2: Core Math",
    tierNum: 2,
    prerequisites: ["ml_tensor_algebra"],
    x: 250,
    y: 260,
    questions: [
      {
        id: "matrix-multiplication-naive",
        title: "Naive Matrix Multiplication O(N^3)",
        algorithmId: "matrix-multiplication-naive",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "Standard triple-loop matrix multiplication baseline and memory access bottlenecks.",
      },
      {
        id: "sram-gemm-tiling",
        title: "SRAM GEMM Tiling",
        algorithmId: "sram-gemm-tiling",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Block matrix multiplication loading sub-tiles into high-speed GPU SRAM / shared memory.",
      },
      {
        id: "roofline-intensity-classifier",
        title: "Roofline Arithmetic Intensity",
        algorithmId: "roofline-intensity-classifier",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Classification of kernels as memory-bound or compute-bound based on FLOPs per byte transferred.",
      },
    ],
  },
  {
    id: "ml_autograd_dags",
    title: "Autograd & Computational DAGs",
    shortLabel: "Autograd & DAGs",
    description: "Reverse-mode automatic differentiation, Vector-Jacobian Products (VJP), and memory activation checkpointing.",
    tier: "Tier 2: Core Math",
    tierNum: 2,
    prerequisites: ["ml_tensor_algebra"],
    x: 550,
    y: 260,
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
        description: "Reverse-mode automatic differentiation computing Vector-Jacobian Products via topological DAG traversal.",
      },
      {
        id: "activation-checkpointing",
        title: "Activation Checkpointing",
        algorithmId: "activation-checkpointing",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Trading compute for memory by saving a subset of activations and recomputing during backward pass.",
      },
    ],
  },
  {
    id: "ml_convolutions",
    title: "Convolutional Tiling & im2col",
    shortLabel: "Convolutions & im2col",
    description: "Spatial 2D filter convolutions lowered into matrix multiplication via im2col memory unrolling.",
    tier: "Tier 2: Core Math",
    tierNum: 2,
    prerequisites: ["ml_tensor_algebra"],
    x: 850,
    y: 260,
    questions: [
      {
        id: "conv2d-sliding-window",
        title: "2D Sliding Window Stride Convolution",
        algorithmId: "conv2d-sliding-window",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "Direct sliding window cross-correlation computation over 2D input grids.",
      },
      {
        id: "im2col-conv-tiling",
        title: "im2col Conv Tiling",
        algorithmId: "im2col-conv-tiling",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Unrolling 2D image receptive fields into matrix columns for high-throughput GEMM execution.",
      },
    ],
  },
  {
    id: "ml_recurrent_gates",
    title: "Recurrent Gates & Sequences",
    shortLabel: "Recurrent Gates",
    description: "Recurrent sequence unrolling, Backpropagation Through Time (BPTT), and LSTM Constant Error Carousels.",
    tier: "Tier 2: Core Math",
    tierNum: 2,
    prerequisites: ["ml_autograd_dags"],
    x: 1150,
    y: 260,
    questions: [
      {
        id: "recurrent-unrolling-bptt",
        title: "Recurrent Sequence Unrolling & BPTT",
        algorithmId: "recurrent-unrolling-bptt",
        difficulty: "Medium",
        type: "Foundational Math & DSA",
        description: "Unrolling recurrent network transitions over time steps for gradient propagation.",
      },
      {
        id: "lstm-constant-error-carousel",
        title: "LSTM Error Carousel",
        algorithmId: "lstm-constant-error-carousel",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Gated cell state updates maintaining constant error carousel to prevent vanishing gradients.",
      },
    ],
  },
  {
    id: "ml_precision_quantization",
    title: "Precision & Quantization",
    shortLabel: "Precision & Quantization",
    description: "Numeric representation bounds, uniform scale/zero-point INT8 quantization, and SmoothQuant outlier scaling.",
    tier: "Tier 3: Intermediate Systems",
    tierNum: 3,
    prerequisites: ["ml_tensor_algebra"],
    x: 200,
    y: 430,
    questions: [
      {
        id: "floating-point-overflow",
        title: "FP16 / FP32 Numeric Underflow & Overflow",
        algorithmId: "floating-point-overflow",
        difficulty: "Easy",
        type: "Foundational Math & DSA",
        description: "IEEE-754 exponent ranges, denormal numbers, and precision loss in low-bit representations.",
      },
      {
        id: "affine-quantization-sq8",
        title: "Affine INT8 Quantization",
        algorithmId: "affine-quantization-sq8",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Uniform scale and zero-point mapping between FP32 continuous values and INT8 quantized integers.",
      },
      {
        id: "smoothquant-scaling",
        title: "SmoothQuant Outlier Scaling",
        algorithmId: "smoothquant-scaling",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Mathematical migration of activation channel magnitude outliers into static weight matrices.",
      },
    ],
  },
  {
    id: "ml_vector_search",
    title: "Vector Search & Spatial Geometry",
    shortLabel: "Vector Search",
    description: "Approximate Nearest Neighbor (ANN) search via Locality-Sensitive Hashing, IVF-PQ, and HNSW skip-graphs.",
    tier: "Tier 3: Intermediate Systems",
    tierNum: 3,
    prerequisites: ["ml_tensor_algebra"],
    x: 550,
    y: 430,
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
        description: "Random hyperplane projection hashing for sub-linear approximate cosine similarity search.",
      },
      {
        id: "ivf-pq-adc-search",
        title: "IVF-PQ ADC Search",
        algorithmId: "ivf-pq-adc-search",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Inverted File Product Quantization with Asymmetric Distance Computation lookup tables.",
      },
      {
        id: "hnsw-vector-search",
        title: "HNSW Vector Search",
        algorithmId: "hnsw-vector-search",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Multi-layer skip-list graph traversal for fast high-dimensional k-NN vector search.",
      },
    ],
  },
  {
    id: "ml_tree_ensembles",
    title: "Tree Ensembles & Gradient Boosting",
    shortLabel: "Tree Ensembles",
    description: "Decision tree impurity splits, Gini index computation, and XGBoost 1st/2nd order gradient histogram splitting.",
    tier: "Tier 3: Intermediate Systems",
    tierNum: 3,
    prerequisites: ["ml_autograd_dags"],
    x: 950,
    y: 430,
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
        description: "Exact greedy and histogram-based split finding utilizing 1st and 2nd order gradient statistics.",
      },
    ],
  },
  {
    id: "ml_attention_geometry",
    title: "Attention Geometry & RoPE",
    shortLabel: "Attention & RoPE",
    description: "Scaled Dot-Product Attention, Rotary Position Embeddings (RoPE), and Grouped-Query Attention (GQA).",
    tier: "Tier 4: Advanced Kernels",
    tierNum: 4,
    prerequisites: ["ml_gemm_roofline"],
    x: 350,
    y: 600,
    questions: [
      {
        id: "scaled-dot-attention-mask",
        title: "Scaled Dot-Product Attention",
        algorithmId: "scaled-dot-attention-mask",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Query-Key-Value matrix attention with scale factor and causal lower-triangular masking.",
      },
      {
        id: "rope-rotary-position",
        title: "RoPE Rotary Position Embedding",
        algorithmId: "rope-rotary-position",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Rotational 2D complex plane matrix transformation encoding relative positional distance.",
      },
      {
        id: "grouped-query-attention",
        title: "Grouped-Query Attention (GQA)",
        algorithmId: "grouped-query-attention",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Partitioning Q heads into G groups sharing KV heads to compress KV-cache memory bandwidth.",
      },
    ],
  },
  {
    id: "ml_hardware_kernels",
    title: "Hardware Kernels & Fusion",
    shortLabel: "Hardware Kernels",
    description: "Fused softmax with Log-Sum-Exp tracking, Triton JIT block-wise compilation, and FlashAttention IO tiling.",
    tier: "Tier 4: Advanced Kernels",
    tierNum: 4,
    prerequisites: ["ml_gemm_roofline"],
    x: 1050,
    y: 600,
    questions: [
      {
        id: "fused-softmax-lse",
        title: "Fused Softmax & LSE",
        algorithmId: "fused-softmax-lse",
        difficulty: "Medium",
        type: "ML Systems Implementation",
        description: "Online single-pass softmax with Log-Sum-Exp tracking to eliminate HBM intermediate writes.",
      },
      {
        id: "triton-kernel-fusion",
        title: "Triton JIT Kernel Fusion",
        algorithmId: "triton-kernel-fusion",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Block-wise Python JIT compiler emitting fused GPU CUDA/PTX kernels without manual C++.",
      },
      {
        id: "flash-attention-tiling",
        title: "FlashAttention IO Tiling",
        algorithmId: "flash-attention-tiling",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Memory IO-aware exact attention loading Q, K, V blocks into SRAM with online softmax rescaling.",
      },
    ],
  },
  {
    id: "ml_distributed_systems",
    title: "Distributed Systems & Parallelism",
    shortLabel: "Distributed Systems",
    description: "Ring-AllReduce topology, Megatron Tensor/Sequence Parallelism, and DeepSpeed ZeRO 1-3 memory sharding.",
    tier: "Tier 5: Frontier Parallelism",
    tierNum: 5,
    prerequisites: ["ml_autograd_dags", "ml_hardware_kernels"],
    x: 400,
    y: 770,
    questions: [
      {
        id: "ring-allreduce-partition",
        title: "Ring-AllReduce Partition",
        algorithmId: "ring-allreduce-partition",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Bandwidth-optimal ring topology Scatter-Reduce and All-Gather distributed gradient synchronization.",
      },
      {
        id: "megatron-tp-sp-split",
        title: "Megatron TP/SP Parallelism",
        algorithmId: "megatron-tp-sp-split",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Column/Row parallel GEMM splitting with Sequence Parallel All-Gather and Reduce-Scatter.",
      },
      {
        id: "deepspeed-zero-sharding",
        title: "ZeRO Memory Sharding",
        algorithmId: "deepspeed-zero-sharding",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "ZeRO Stage 1-3 memory sharding of optimizer states, gradients, and model parameters across GPUs.",
      },
    ],
  },
  {
    id: "ml_llm_serving",
    title: "LLM Serving & Continuous Batching",
    shortLabel: "LLM Serving",
    description: "PagedAttention block table virtual memory allocation, iteration-level continuous batching, and speculative decoding.",
    tier: "Tier 6: Frontier LLM Serving",
    tierNum: 6,
    prerequisites: ["ml_attention_geometry", "ml_hardware_kernels"],
    x: 1000,
    y: 770,
    questions: [
      {
        id: "paged-attention-block-table",
        title: "PagedAttention Block Table",
        algorithmId: "paged-attention-block-table",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Virtual memory block allocation mapping logical sequence KV-tokens to non-contiguous physical GPU pages.",
      },
      {
        id: "continuous-batching-scheduler",
        title: "Continuous Batching Scheduler",
        algorithmId: "continuous-batching-scheduler",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Iteration-level prefill & decode scheduling dynamically inserting new requests without waiting for sequence completion.",
      },
      {
        id: "speculative-decoding-verifier",
        title: "Speculative Decoding Verifier",
        algorithmId: "speculative-decoding-verifier",
        difficulty: "Hard",
        type: "ML Systems Implementation",
        description: "Draft model speculative token generation verified in a single parallel target model forward pass.",
      },
    ],
  },
];

export const TOPIC_PILLS = [
  { id: "all", label: "All Topics" },
  ...TOPIC_CLUSTERS.map((tc) => ({ id: tc.id, label: tc.shortLabel })),
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

  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [drawerTopicId, setDrawerTopicId] = useState<string | null>(null);

  // Zoom & Pan state
  const [scale, setScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { ref, box } = useCanvasBox({ width: 1400, height: 950 });
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
    setSelectedTopic(topic.id);
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

  const getDifficultyStyles = (diff: "Easy" | "Medium" | "Hard") => {
    switch (diff) {
      case "Easy":
        return {
          border: "border-emerald-500/40",
          text: "text-emerald-400",
          stroke: "#10b981",
          bg: "bg-emerald-500/10",
        };
      case "Medium":
        return {
          border: "border-amber-500/40",
          text: "text-amber-400",
          stroke: "#f59e0b",
          bg: "bg-amber-500/10",
        };
      case "Hard":
        return {
          border: "border-rose-500/40",
          text: "text-rose-400",
          stroke: "#f43f5e",
          bg: "bg-rose-500/10",
        };
    }
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target instanceof SVGElement ||
      (e.target instanceof HTMLElement && e.target.getAttribute("data-canvas-bg"))
    ) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Check if topic matches search query or contains matching questions
  const isTopicMatchingQuery = (topic: TopicClusterNode, query: string): boolean => {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (
      topic.title.toLowerCase().includes(q) ||
      topic.description.toLowerCase().includes(q) ||
      topic.shortLabel.toLowerCase().includes(q)
    ) {
      return true;
    }
    return topic.questions.some(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.algorithmId.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  };

  return (
    <div
      role="region"
      aria-label="ML Infrastructure & AI Systems Knowledge Tree"
      className="h-[calc(100vh-3.5rem)] w-full overflow-hidden flex flex-col relative bg-[var(--bg-page)]"
    >
      {/* Top Floating Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-3 p-4 rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl transition-all">
        {/* Row 1: Title, Search, Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base md:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
              ML Infrastructure & AI Systems Knowledge Tree
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-inset)] text-[var(--accent)] border border-[var(--border-accent)]">
              13 Topic Clusters • 38 Curated Problems
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Search Input */}
            <div className="relative flex items-center min-w-[240px]">
              <input
                type="text"
                placeholder="Search 13 topics & 38 questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--border-accent)] transition-all"
                aria-label="Search ML infrastructure topics and questions"
              />
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 text-[var(--text-muted)] pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Zoom / Pan Controls */}
            <div className="flex items-center gap-1 bg-[var(--bg-inset)] p-1 rounded-xl border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(s + 0.15, 2.5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--accent)] transition-all cursor-pointer"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(s - 0.15, 0.5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--accent)] transition-all cursor-pointer"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => {
                  setScale(1.0);
                  setPan({ x: 0, y: 0 });
                  setSearchQuery("");
                  setSelectedTopic("all");
                  setDrawerTopicId(null);
                }}
                className="px-2.5 h-7 flex items-center justify-center rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
                title="Reset Zoom and Pan"
                aria-label="Reset Zoom and Pan"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Topic Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TOPIC_PILLS.map((pill) => {
            const isActive = selectedTopic === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                role="button"
                aria-pressed={isActive}
                onClick={() => {
                  setSelectedTopic(pill.id);
                  if (pill.id !== "all") {
                    setDrawerTopicId(pill.id);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "bg-[var(--accent)] text-black border-[var(--accent)] font-bold shadow-md"
                    : "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic Drawer / Detail Panel */}
      {activeDrawerTopic && (
        <div
          role="dialog"
          aria-label={`${activeDrawerTopic.title} Drawer`}
          className="absolute right-4 top-36 bottom-6 z-30 max-w-lg w-full bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-accent)] rounded-2xl p-5 shadow-2xl transition-all duration-300 flex flex-col gap-4 overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--accent)]">
                  {activeDrawerTopic.tier}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                  {activeDrawerTopic.questions.length} Questions
                </span>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {activeDrawerTopic.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {activeDrawerTopic.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerTopicId(null)}
              aria-label="Close Topic Drawer"
              className="p-1.5 rounded-xl bg-[var(--bg-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)] transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Prerequisite topics if any */}
          {activeDrawerTopic.prerequisites.length > 0 && (
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
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

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Curated Problems ({activeDrawerTopic.questions.length})
            </h3>

            {activeDrawerTopic.questions
              .filter((q) => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.trim().toLowerCase();
                return (
                  q.title.toLowerCase().includes(query) ||
                  q.algorithmId.toLowerCase().includes(query) ||
                  q.description.toLowerCase().includes(query) ||
                  q.type.toLowerCase().includes(query)
                );
              })
              .map((q) => {
                const diffStyle = getDifficultyStyles(q.difficulty);
                const isFoundational = q.type === "Foundational Math & DSA";

                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-default)] hover:border-[var(--border-accent)] transition-all flex flex-col gap-2.5"
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
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffStyle.border} ${diffStyle.text}`}
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
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-all duration-200 cursor-pointer text-center"
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
      <div
        ref={ref}
        data-canvas-bg="true"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxString}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full block relative z-0"
        >
          <defs>
            <marker
              id="topic-arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent)" />
            </marker>
            <marker
              id="topic-arrow-dim"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border-default)" />
            </marker>
          </defs>

          {/* Canvas Transform Group for Zoom & Pan */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {/* Prerequisite Connection Arrows */}
            {TOPIC_CLUSTERS.map((topic) => {
              return topic.prerequisites.map((pId) => {
                const parent = topicMap.get(pId);
                if (!parent) return null;

                const topicMatches = isTopicMatchingQuery(topic, searchQuery);
                const parentMatches = isTopicMatchingQuery(parent, searchQuery);

                const matchesTopicFilter =
                  selectedTopic === "all" ||
                  topic.id === selectedTopic ||
                  parent.id === selectedTopic;

                const isDimmed = !matchesTopicFilter || (!topicMatches && !parentMatches);

                const startY = parent.y + 30; // parent bottom
                const endY = topic.y - 30; // child top
                const midY = (startY + endY) / 2;
                const pathD = `M ${parent.x} ${startY} C ${parent.x} ${midY}, ${topic.x} ${midY}, ${topic.x} ${endY}`;

                return (
                  <path
                    key={`${pId}->${topic.id}`}
                    d={pathD}
                    fill="none"
                    stroke={isDimmed ? "var(--border-default)" : "var(--accent)"}
                    strokeWidth={isDimmed ? 1.5 : 2.5}
                    markerEnd={isDimmed ? "url(#topic-arrow-dim)" : "url(#topic-arrow-active)"}
                    className="transition-all duration-300"
                    opacity={isDimmed ? 0.2 : 0.85}
                  />
                );
              });
            })}

            {/* 13 Topic Cluster Nodes */}
            {TOPIC_CLUSTERS.map((topic) => {
              const isHovered = hoveredNodeId === topic.id;
              const isSelectedNode = drawerTopicId === topic.id || selectedTopic === topic.id;

              const matchesSearch = isTopicMatchingQuery(topic, searchQuery);
              const matchesTopicFilter = selectedTopic === "all" || topic.id === selectedTopic;
              const isDimmed = !matchesTopicFilter || !matchesSearch;

              const width = 240;
              const height = 64;
              const halfW = width / 2;
              const halfH = height / 2;

              return (
                <g
                  key={topic.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${topic.title}. ${topic.tier}. ${topic.questions.length} problems. Click to view questions drawer.`}
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
                  onFocus={() => {
                    setHoveredNodeId(topic.id);
                  }}
                  onBlur={() => setHoveredNodeId(null)}
                  style={{
                    cursor: "pointer",
                    outline: "none",
                    opacity: isDimmed ? 0.25 : 1,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {/* Outer Node Card */}
                  <rect
                    width={width}
                    height={height}
                    rx={14}
                    fill={isHovered || isSelectedNode ? "var(--bg-inset)" : "var(--bg-surface)"}
                    stroke={
                      isHovered || isSelectedNode
                        ? "var(--accent)"
                        : matchesSearch && searchQuery.trim() !== ""
                          ? "#3b82f6"
                          : "var(--border-default)"
                    }
                    strokeWidth={isHovered || isSelectedNode ? 2.5 : 1.5}
                    style={{
                      filter:
                        isHovered || isSelectedNode
                          ? "drop-shadow(0 8px 16px rgba(59, 130, 246, 0.35))"
                          : "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                    }}
                  />

                  {/* Title Text */}
                  <text
                    x={halfW}
                    y={26}
                    textAnchor="middle"
                    fill={isHovered || isSelectedNode ? "var(--text-primary)" : "var(--text-primary)"}
                    className="font-bold text-[12px]"
                  >
                    ⚡ {topic.shortLabel}
                  </text>

                  {/* Subtitle / Metadata */}
                  <text
                    x={halfW}
                    y={46}
                    textAnchor="middle"
                    fill="var(--accent)"
                    className="font-mono text-[10px] font-bold"
                  >
                    {topic.questions.length} Problems • {topic.tier.split(":")[0]}
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
