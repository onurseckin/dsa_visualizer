import { vizSlotBg, vizSlotColor } from "../../primitives/vizPalette";

export type MLInfraFamilyId =
  | "foundations"
  | "core-math"
  | "intermediate-systems"
  | "advanced-kernels"
  | "distributed-systems"
  | "llm-serving";

export interface MLInfraFamily {
  id: MLInfraFamilyId;
  label: string;
  slot: number;
}

export const ML_INFRA_FAMILIES: MLInfraFamily[] = [
  { id: "foundations", label: "Foundations", slot: 0 },
  { id: "core-math", label: "Core Math & DAGs", slot: 1 },
  { id: "intermediate-systems", label: "Intermediate Systems", slot: 2 },
  { id: "advanced-kernels", label: "Advanced Kernels", slot: 3 },
  { id: "distributed-systems", label: "Distributed Parallelism", slot: 4 },
  { id: "llm-serving", label: "LLM Serving", slot: 5 },
];

const FAMILY_BY_ID: Record<MLInfraFamilyId, MLInfraFamily> = ML_INFRA_FAMILIES.reduce(
  (acc, family) => {
    acc[family.id] = family;
    return acc;
  },
  {} as Record<MLInfraFamilyId, MLInfraFamily>,
);

export const mlInfraFamilyColor = (family: MLInfraFamilyId): string =>
  vizSlotColor(FAMILY_BY_ID[family]?.slot ?? 0);

export const mlInfraFamilyLabel = (family: MLInfraFamilyId): string =>
  FAMILY_BY_ID[family]?.label ?? "";

export const mlInfraFamilyFill = (family: MLInfraFamilyId): string =>
  vizSlotBg(FAMILY_BY_ID[family]?.slot ?? 0, 26, "var(--bg-elevated)");

export const mlInfraFamilyFillHover = (family: MLInfraFamilyId): string =>
  vizSlotBg(FAMILY_BY_ID[family]?.slot ?? 0, 40, "var(--bg-elevated)");

export interface MLInfraQuestionItem {
  id: string;
  title: string;
  algorithmId: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "Foundational Math & DSA" | "ML Systems Implementation";
  description: string;
}

export interface MLInfraNode {
  id: string;
  title: string;
  description: string;
  family: MLInfraFamilyId;
  difficulty: "Easy" | "Medium" | "Hard";
  prerequisites: string[];
  x: number;
  y: number;
  algorithmCount: number;
  questions: MLInfraQuestionItem[];
}

export const ML_INFRA_NODES: MLInfraNode[] = [
  {
    id: "ml_tensor_algebra",
    title: "Tensor Algebra & Memory Layout",
    description:
      "Multi-dimensional tensor indexing, strided memory layouts, NCHW/NHWC offsets, and contiguity validation.",
    family: "foundations",
    difficulty: "Medium",
    prerequisites: [],
    x: 415,
    y: 60,
    algorithmCount: 4,
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
    description:
      "Subword text tokenization, Byte-Pair Encoding (BPE), and Viterbi dynamic programming lattice decoding.",
    family: "foundations",
    difficulty: "Medium",
    prerequisites: [],
    x: 935,
    y: 60,
    algorithmCount: 3,
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
    description:
      "High-performance matrix multiplication tiling, SRAM shared memory access, and arithmetic intensity classification.",
    family: "core-math",
    difficulty: "Medium",
    prerequisites: ["ml_tensor_algebra"],
    x: 275,
    y: 200,
    algorithmCount: 3,
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
    description:
      "Reverse-mode automatic differentiation, Vector-Jacobian Products (VJP), and memory activation checkpointing.",
    family: "core-math",
    difficulty: "Medium",
    prerequisites: ["ml_tensor_algebra"],
    x: 675,
    y: 200,
    algorithmCount: 3,
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
    description:
      "Spatial 2D filter convolutions lowered into matrix multiplication via im2col memory unrolling.",
    family: "core-math",
    difficulty: "Medium",
    prerequisites: ["ml_tensor_algebra"],
    x: 1075,
    y: 200,
    algorithmCount: 2,
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
    description:
      "Numeric representation bounds, uniform scale/zero-point INT8 quantization, and SmoothQuant outlier scaling.",
    family: "intermediate-systems",
    difficulty: "Hard",
    prerequisites: ["ml_tensor_algebra"],
    x: 200,
    y: 380,
    algorithmCount: 3,
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
    description:
      "Recurrent sequence unrolling, Backpropagation Through Time (BPTT), and LSTM Constant Error Carousels.",
    family: "intermediate-systems",
    difficulty: "Medium",
    prerequisites: ["ml_autograd_dags"],
    x: 520,
    y: 380,
    algorithmCount: 2,
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
    description:
      "Approximate Nearest Neighbor (ANN) search via Locality-Sensitive Hashing, IVF-PQ, and HNSW skip-graphs.",
    family: "intermediate-systems",
    difficulty: "Hard",
    prerequisites: ["ml_tensor_algebra"],
    x: 840,
    y: 380,
    algorithmCount: 4,
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
    description:
      "Decision tree impurity splits, Gini index computation, and XGBoost 1st/2nd order gradient histogram splitting.",
    family: "intermediate-systems",
    difficulty: "Medium",
    prerequisites: ["ml_autograd_dags"],
    x: 1150,
    y: 380,
    algorithmCount: 2,
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
    description:
      "Scaled Dot-Product Attention, Rotary Position Embeddings (RoPE), and Grouped-Query Attention (GQA).",
    family: "advanced-kernels",
    difficulty: "Hard",
    prerequisites: ["ml_gemm_roofline"],
    x: 415,
    y: 560,
    algorithmCount: 3,
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
    description:
      "Fused softmax with Log-Sum-Exp tracking, Triton JIT block-wise compilation, and FlashAttention IO tiling.",
    family: "advanced-kernels",
    difficulty: "Hard",
    prerequisites: ["ml_gemm_roofline"],
    x: 935,
    y: 560,
    algorithmCount: 3,
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
    description:
      "Ring-AllReduce topology, Megatron Tensor/Sequence Parallelism, and DeepSpeed ZeRO 1-3 memory sharding.",
    family: "distributed-systems",
    difficulty: "Hard",
    prerequisites: ["ml_autograd_dags", "ml_hardware_kernels"],
    x: 675,
    y: 740,
    algorithmCount: 3,
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
    description:
      "PagedAttention block table virtual memory allocation, iteration-level continuous batching, and speculative decoding.",
    family: "llm-serving",
    difficulty: "Hard",
    prerequisites: ["ml_attention_geometry", "ml_hardware_kernels"],
    x: 675,
    y: 920,
    algorithmCount: 3,
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

export const ML_INFRA_NODE_MAP = new Map<string, MLInfraNode>(
  ML_INFRA_NODES.map((n) => [n.id, n]),
);
