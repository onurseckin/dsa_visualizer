import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCanvasBox, boxViewBox, viewBoxAttr } from "../primitives/vizGeometry";

export interface MLInfraNode {
  id: string;
  title: string;
  categoryFolder: string;
  categoryLabel: string;
  topicId: string;
  algorithmId: string;
  description: string;
  prerequisites: string[];
  keyEquations: string[];
  concepts: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  level: number;
  x: number;
  y: number;
}

export const ML_INFRA_NODES: MLInfraNode[] = [
  // Tier 1: Foundations (y = 1120)
  {
    id: "tensor-stride-offset",
    title: "Tensor Stride & Offset Layout",
    categoryFolder: "ml_tensor_algebra",
    categoryLabel: "Tensor Memory & Strides",
    topicId: "ml_tensor_algebra",
    algorithmId: "tensor-stride-offset",
    description: "Multi-dimensional tensor memory stride calculation, 1D flat buffer layout, and NCHW/NHWC offsets.",
    prerequisites: [],
    keyEquations: ["Offset = \\sum_{d=0}^{D-1} i_d \\cdot s_d", "s_d = \\prod_{k=d+1}^{D-1} \\text{shape}[k]"],
    concepts: ["Row-Major Strides", "Linear Memory Offset", "NCHW vs NHWC Layout"],
    difficulty: "Easy",
    level: 1,
    x: 200,
    y: 1120,
  },
  {
    id: "tensor-contiguity-reshape",
    title: "Tensor Contiguity & Reshape",
    categoryFolder: "ml_tensor_algebra",
    categoryLabel: "Tensor Memory & Strides",
    topicId: "ml_tensor_algebra",
    algorithmId: "tensor-contiguity-reshape",
    description: "Non-contiguous view stride validation, zero-copy transpose vs eager contiguous memory clone.",
    prerequisites: ["tensor-stride-offset"],
    keyEquations: ["s_d^{contiguous} = s_{d+1} \\cdot \\text{shape}[d+1]", "\\text{IsContiguous} \\iff s_d = \\prod_{k=d+1}^{D-1} \\text{shape}[k]"],
    concepts: ["Memory Contiguity Check", "Zero-Copy View Slicing", "Eager Memory Allocation"],
    difficulty: "Easy",
    level: 1,
    x: 550,
    y: 1120,
  },
  {
    id: "bpe-tokenizer",
    title: "Byte-Pair Encoding (BPE)",
    categoryFolder: "ml_tokenization",
    categoryLabel: "Subword Tokenization & Tries",
    topicId: "ml_tokenization",
    algorithmId: "bpe-tokenizer",
    description: "Greedy subword tokenization, adjacent symbol frequency table counting, and iterative pair merging.",
    prerequisites: [],
    keyEquations: ["(p^*, q^*) = \\arg\\max_{(p,q)} \\text{freq}(p, q)", "V_{new} = V_{old} \\cup \\{p^*q^*\\}"],
    concepts: ["Subword Vocabulary", "Frequency Counting", "Iterative Merging"],
    difficulty: "Easy",
    level: 1,
    x: 1050,
    y: 1120,
  },
  {
    id: "viterbi-subword-segmenter",
    title: "Viterbi Subword Segmenter",
    categoryFolder: "ml_tokenization",
    categoryLabel: "Subword Tokenization & Tries",
    topicId: "ml_tokenization",
    algorithmId: "viterbi-subword-segmenter",
    description: "Unigram language model tokenization via Viterbi dynamic programming shortest-path lattice decoding.",
    prerequisites: ["bpe-tokenizer"],
    keyEquations: ["P(S) = \\prod_{i=1}^k P(x_i)", "dp[i] = \\max_{j < i} (dp[j] + \\log P(w_{j:i}))"],
    concepts: ["Unigram Language Model", "Lattice Viterbi Decoding", "Log-Probability Path"],
    difficulty: "Medium",
    level: 1,
    x: 1400,
    y: 1120,
  },

  // Tier 2: Core Math & Building Blocks (y = 940)
  {
    id: "sram-gemm-tiling",
    title: "SRAM GEMM Tiling",
    categoryFolder: "ml_gemm_roofline",
    categoryLabel: "GEMM & Roofline Model",
    topicId: "ml_gemm_roofline",
    algorithmId: "sram-gemm-tiling",
    description: "Block matrix multiplication loading sub-tiles into high-speed GPU SRAM / shared memory.",
    prerequisites: ["tensor-contiguity-reshape"],
    keyEquations: ["C_{i,j} = \\sum_{k=0}^{K-1} A_{i,k} B_{k,j}", "\\text{Tile\\_Size} \\le \\frac{\\text{SRAM\\_Capacity}}{3 \\times \\text{sizeof}(float)}"],
    concepts: ["Shared Memory Tiling", "Memory Access Reuse", "HBM Bandwidth Reduction"],
    difficulty: "Medium",
    level: 2,
    x: 200,
    y: 940,
  },
  {
    id: "roofline-intensity-classifier",
    title: "Roofline Arithmetic Intensity",
    categoryFolder: "ml_gemm_roofline",
    categoryLabel: "GEMM & Roofline Model",
    topicId: "ml_gemm_roofline",
    algorithmId: "roofline-intensity-classifier",
    description: "Classification of kernels as memory-bound or compute-bound based on FLOPs per byte transferred.",
    prerequisites: ["sram-gemm-tiling"],
    keyEquations: ["I = \\frac{\\text{FLOPs}}{\\text{Bytes Transferred}}", "P = \\min(P_{peak}, I \\times \\text{BW}_{HBM})"],
    concepts: ["Arithmetic Intensity", "Memory Bound vs Compute Bound", "Peak TFLOPs Ceiling"],
    difficulty: "Medium",
    level: 2,
    x: 550,
    y: 940,
  },
  {
    id: "autograd-vjp-dag",
    title: "Autograd VJP DAG",
    categoryFolder: "ml_autograd_dags",
    categoryLabel: "Autograd & Computational Graphs",
    topicId: "ml_autograd_dags",
    algorithmId: "autograd-vjp-dag",
    description: "Reverse-mode automatic differentiation computing Vector-Jacobian Products via topological DAG traversal.",
    prerequisites: ["tensor-stride-offset"],
    keyEquations: ["v_x = J_f^T \\cdot v_y", "\\bar{x}_i = \\sum_{j \\in \\text{children}} \\bar{y}_j \\frac{\\partial f_j}{\\partial x_i}"],
    concepts: ["Vector-Jacobian Product", "Reverse-Mode AD", "Topological Accumulation"],
    difficulty: "Medium",
    level: 2,
    x: 900,
    y: 940,
  },
  {
    id: "im2col-conv-tiling",
    title: "im2col Conv Tiling",
    categoryFolder: "ml_convolutions",
    categoryLabel: "Convolutional Tiling & im2col",
    topicId: "ml_convolutions",
    algorithmId: "im2col-conv-tiling",
    description: "Unrolling 2D image receptive fields into matrix columns for high-throughput GEMM execution.",
    prerequisites: ["tensor-stride-offset"],
    keyEquations: ["X_{col} \\in \\mathbb{R}^{(C \\cdot K_h \\cdot K_w) \\times (H_{out} \\cdot W_{out})}", "Y = W_{mat} \\cdot X_{col}"],
    concepts: ["Image-to-Column Lowering", "GEMM Kernel Reuse", "Receptive Field Unrolling"],
    difficulty: "Medium",
    level: 2,
    x: 1200,
    y: 940,
  },
  {
    id: "lstm-constant-error-carousel",
    title: "LSTM Error Carousel",
    categoryFolder: "ml_recurrent_gates",
    categoryLabel: "Recurrent Gates & Sequences",
    topicId: "ml_recurrent_gates",
    algorithmId: "lstm-constant-error-carousel",
    description: "Gated cell state updates maintaining constant error carousel to prevent vanishing gradients.",
    prerequisites: ["autograd-vjp-dag"],
    keyEquations: ["c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t", "h_t = o_t \\odot \\tanh(c_t)"],
    concepts: ["Constant Error Carousel", "Forget & Input Gates", "Vanishing Gradient Fix"],
    difficulty: "Medium",
    level: 2,
    x: 1480,
    y: 940,
  },

  // Tier 3: Intermediate Systems & Search (y = 760)
  {
    id: "activation-checkpointing",
    title: "Activation Checkpointing",
    categoryFolder: "ml_autograd_dags",
    categoryLabel: "Autograd & Computational Graphs",
    topicId: "ml_autograd_dags",
    algorithmId: "activation-checkpointing",
    description: "Trading compute for memory by saving subset of activations and recomputing during backward pass.",
    prerequisites: ["autograd-vjp-dag"],
    keyEquations: ["M_{saved} = O(\\sqrt{N}) \\quad \\text{vs} \\quad O(N)", "T_{compute} = T_{fwd} + T_{bwd} + T_{recompute}"],
    concepts: ["Recomputation Tradeoff", "Memory Footprint Reduction", "Checkpoint Segmenting"],
    difficulty: "Medium",
    level: 3,
    x: 150,
    y: 760,
  },
  {
    id: "affine-quantization-sq8",
    title: "Affine INT8 Quantization",
    categoryFolder: "ml_precision_quantization",
    categoryLabel: "Precision Math & Quantization",
    topicId: "ml_precision_quantization",
    algorithmId: "affine-quantization-sq8",
    description: "Uniform scale and zero-point mapping between FP32 continuous values and INT8 quantized integers.",
    prerequisites: ["tensor-contiguity-reshape"],
    keyEquations: ["q = \\text{clamp}\\left(\\text{round}\\left(\\frac{x}{S}\\right) + Z, -128, 127\\right)", "\\hat{x} = S \\cdot (q - Z)"],
    concepts: ["Scale & Zero-Point", "Uniform Quantization", "Int8 Tensor Core GEMM"],
    difficulty: "Medium",
    level: 3,
    x: 450,
    y: 760,
  },
  {
    id: "lsh-vector-hashing",
    title: "LSH Vector Hashing",
    categoryFolder: "ml_vector_search",
    categoryLabel: "Vector Search & Spatial Geometry",
    topicId: "ml_vector_search",
    algorithmId: "lsh-vector-hashing",
    description: "Random hyperplane projection hashing for sub-linear approximate cosine similarity search.",
    prerequisites: ["tensor-stride-offset"],
    keyEquations: ["h_r(v) = \\text{sign}(r^T v)", "P(h(u) = h(v)) = 1 - \\frac{\\theta(u,v)}{\\pi}"],
    concepts: ["Random Hyperplane Projection", "Locality-Sensitive Hash", "Sub-linear ANN Bucket Search"],
    difficulty: "Medium",
    level: 3,
    x: 750,
    y: 760,
  },
  {
    id: "ivf-pq-adc-search",
    title: "IVF-PQ ADC Search",
    categoryFolder: "ml_vector_search",
    categoryLabel: "Vector Search & Spatial Geometry",
    topicId: "ml_vector_search",
    algorithmId: "ivf-pq-adc-search",
    description: "Inverted File Product Quantization with Asymmetric Distance Computation lookup tables.",
    prerequisites: ["lsh-vector-hashing", "affine-quantization-sq8"],
    keyEquations: ["d(q, x) \\approx \\sum_{m=1}^M d(q_m, C_m[q_{x,m}])", "\\text{Compress} = d \\times 32 \\to M \\times 8 \\text{ bits}"],
    concepts: ["Product Quantization Codebooks", "Inverted File Ingress", "Asymmetric Distance Lookup"],
    difficulty: "Hard",
    level: 3,
    x: 1050,
    y: 760,
  },
  {
    id: "hnsw-vector-search",
    title: "HNSW Vector Search",
    categoryFolder: "ml_vector_search",
    categoryLabel: "Vector Search & Spatial Geometry",
    topicId: "ml_vector_search",
    algorithmId: "hnsw-vector-search",
    description: "Multi-layer skip-list graph traversal for fast high-dimensional k-NN vector search.",
    prerequisites: ["ivf-pq-adc-search"],
    keyEquations: ["P(l) = \\lfloor -\\ln(\\text{unif}) \\cdot m_L \\rfloor", "v_{next} = \\arg\\min_{u \\in N(v)} d(q, u)"],
    concepts: ["Hierarchical Skip-Graphs", "Greedy Beam Search", "Small World Connectivity"],
    difficulty: "Hard",
    level: 3,
    x: 1350,
    y: 760,
  },
  {
    id: "xgboost-gradient-split",
    title: "XGBoost Gradient Split",
    categoryFolder: "ml_tree_ensembles",
    categoryLabel: "Tree Ensembles & XGBoost",
    topicId: "ml_tree_ensembles",
    algorithmId: "xgboost-gradient-split",
    description: "Exact greedy and histogram-based split finding utilizing 1st and 2nd order gradient statistics.",
    prerequisites: ["autograd-vjp-dag"],
    keyEquations: ["L_{split} = \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L+G_R)^2}{H_L+H_R+\\lambda} \\right] - \\gamma", "w^* = -\\frac{G}{H + \\lambda}"],
    concepts: ["1st & 2nd Order Gradients", "Histogram Split Finding", "Tree Regularization"],
    difficulty: "Medium",
    level: 3,
    x: 1550,
    y: 760,
  },

  // Tier 4: Advanced Kernels & Attention (y = 580)
  {
    id: "fused-softmax-lse",
    title: "Fused Softmax & LSE",
    categoryFolder: "ml_hardware_kernels",
    categoryLabel: "Hardware Kernels & Fusion",
    topicId: "ml_hardware_kernels",
    algorithmId: "fused-softmax-lse",
    description: "Online single-pass softmax with Log-Sum-Exp tracking to eliminate HBM intermediate writes.",
    prerequisites: ["roofline-intensity-classifier", "sram-gemm-tiling"],
    keyEquations: ["m_{new} = \\max(m_{old}, x_i)", "l_{new} = l_{old} e^{m_{old}-m_{new}} + e^{x_i-m_{new}}"],
    concepts: ["Online Softmax Rescaling", "Log-Sum-Exp Trick", "Single-Pass Kernel Fusion"],
    difficulty: "Medium",
    level: 4,
    x: 200,
    y: 580,
  },
  {
    id: "triton-kernel-fusion",
    title: "Triton JIT Kernel Fusion",
    categoryFolder: "ml_hardware_kernels",
    categoryLabel: "Hardware Kernels & Fusion",
    topicId: "ml_hardware_kernels",
    algorithmId: "triton-kernel-fusion",
    description: "Block-wise Python JIT compiler emitting fused GPU Cuda/PTX kernels without manual C++.",
    prerequisites: ["fused-softmax-lse"],
    keyEquations: ["tl.load(ptr + offsets, mask)", "tl.store(out_ptr + offsets, val, mask)"],
    concepts: ["Block Program Paradigm", "Automatic Vectorization", "Coalesced Memory Access"],
    difficulty: "Hard",
    level: 4,
    x: 500,
    y: 580,
  },
  {
    id: "scaled-dot-attention-mask",
    title: "Scaled Dot-Product Attention",
    categoryFolder: "ml_attention_geometry",
    categoryLabel: "Attention Geometry & RoPE",
    topicId: "ml_attention_geometry",
    algorithmId: "scaled-dot-attention-mask",
    description: "Query-Key-Value matrix attention with \\sqrt{d_k} scaling and causal lower-triangular masking.",
    prerequisites: ["sram-gemm-tiling"],
    keyEquations: ["\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}} + M\\right) V", "M_{ij} = 0 \\text{ if } i \\ge j \\text{ else } -\\infty"],
    concepts: ["Query-Key-Value Projections", "Causal Masking", "Scale Variance Control"],
    difficulty: "Medium",
    level: 4,
    x: 800,
    y: 580,
  },
  {
    id: "rope-rotary-position",
    title: "RoPE Rotary Position Embedding",
    categoryFolder: "ml_attention_geometry",
    categoryLabel: "Attention Geometry & RoPE",
    topicId: "ml_attention_geometry",
    algorithmId: "rope-rotary-position",
    description: "Rotational 2D complex plane matrix transformation encoding relative positional distance.",
    prerequisites: ["scaled-dot-attention-mask"],
    keyEquations: ["R_{\\Theta, m}^d x_m = \\begin{pmatrix} \\cos m\\theta & -\\sin m\\theta \\\\ \\sin m\\theta & \\cos m\\theta \\end{pmatrix} \\begin{pmatrix} x_1 \\\\ x_2 \\end{pmatrix}", "\\langle R_m q, R_n k \\rangle = g(q, k, m-n)"],
    concepts: ["Rotational Matrix Operator", "Relative Position Invariance", "Complex Inner Product"],
    difficulty: "Hard",
    level: 4,
    x: 1100,
    y: 580,
  },
  {
    id: "grouped-query-attention",
    title: "Grouped-Query Attention (GQA)",
    categoryFolder: "ml_attention_geometry",
    categoryLabel: "Attention Geometry & RoPE",
    topicId: "ml_attention_geometry",
    algorithmId: "grouped-query-attention",
    description: "Partitioning Q heads into G groups sharing KV heads to compress KV-cache memory bandwidth.",
    prerequisites: ["scaled-dot-attention-mask"],
    keyEquations: ["G = \\frac{H_Q}{H_{KV}}", "\\text{Cache\\_Saved} = 1 - \\frac{H_{KV}}{H_Q}"],
    concepts: ["Multi-Query Sharing", "KV Cache Bandwidth Reduction", "Head Group Broadcast"],
    difficulty: "Medium",
    level: 4,
    x: 1350,
    y: 580,
  },
  {
    id: "smoothquant-scaling",
    title: "SmoothQuant Outlier Scaling",
    categoryFolder: "ml_precision_quantization",
    categoryLabel: "Precision Math & Quantization",
    topicId: "ml_precision_quantization",
    algorithmId: "smoothquant-scaling",
    description: "Mathematical migration of activation channel magnitude outliers into static weight matrices.",
    prerequisites: ["affine-quantization-sq8"],
    keyEquations: ["Y = (X \\cdot \\text{diag}(s)^{-1}) \\cdot (\\text{diag}(s) \\cdot W)", "s_j = \\frac{\\max_i |X_{ij}|^\\alpha}{\\max_k |W_{jk}|^{1-\\alpha}}"],
    concepts: ["Activation Outlier Migration", "Per-Channel Smoothing Scale", "W8A8 INT8 Tensor Cores"],
    difficulty: "Hard",
    level: 4,
    x: 1550,
    y: 580,
  },

  // Tier 5: Frontier Attention & Systems (y = 400)
  {
    id: "flash-attention-tiling",
    title: "FlashAttention IO Tiling",
    categoryFolder: "ml_attention_geometry",
    categoryLabel: "Attention Geometry & RoPE",
    topicId: "ml_attention_geometry",
    algorithmId: "flash-attention-tiling",
    description: "Memory IO-aware exact attention loading Q, K, V blocks into SRAM with online softmax rescaling.",
    prerequisites: ["grouped-query-attention", "fused-softmax-lse"],
    keyEquations: ["O_i^{(j)} = \\frac{l_i^{(j-1)} O_i^{(j-1)} + e^{S_{ij} - m_i^{(j)}} V_j}{l_i^{(j)}}", "m_i^{(j)} = \\max(m_i^{(j-1)}, \\max(S_{ij}))"],
    concepts: ["IO-Aware SRAM Tiling", "Zero HBM Intermediate Write", "Recomputation in Backward Pass"],
    difficulty: "Hard",
    level: 5,
    x: 350,
    y: 400,
  },
  {
    id: "ring-allreduce-partition",
    title: "Ring-AllReduce Partition",
    categoryFolder: "ml_distributed_systems",
    categoryLabel: "Distributed ML & Interconnects",
    topicId: "ml_distributed_systems",
    algorithmId: "ring-allreduce-partition",
    description: "Bandwidth-optimal ring topology Scatter-Reduce and All-Gather distributed gradient synchronization.",
    prerequisites: ["activation-checkpointing"],
    keyEquations: ["T_{comm} = 2 \\cdot \\frac{N-1}{N} \\cdot \\frac{M}{\\text{BW}}", "V_{chunk} = \\frac{V_{total}}{N}"],
    concepts: ["Scatter-Reduce Phase", "All-Gather Phase", "Ring Interconnect Bandwidth"],
    difficulty: "Hard",
    level: 5,
    x: 750,
    y: 400,
  },
  {
    id: "megatron-tp-sp-split",
    title: "Megatron TP/SP Parallelism",
    categoryFolder: "ml_distributed_systems",
    categoryLabel: "Distributed ML & Interconnects",
    topicId: "ml_distributed_systems",
    algorithmId: "megatron-tp-sp-split",
    description: "Column/Row parallel GEMM splitting with Sequence Parallel All-Gather and Reduce-Scatter.",
    prerequisites: ["ring-allreduce-partition"],
    keyEquations: ["Y_1 = X W_1 \\quad (\\text{ColParallel})", "Y = Y_1 W_2 \\quad (\\text{RowParallel with AllReduce})"],
    concepts: ["Tensor Parallel GEMM Split", "Sequence Parallel Activation", "All-Reduce Communication"],
    difficulty: "Hard",
    level: 5,
    x: 1100,
    y: 400,
  },
  {
    id: "deepspeed-zero-sharding",
    title: "ZeRO Memory Sharding",
    categoryFolder: "ml_distributed_systems",
    categoryLabel: "Distributed ML & Interconnects",
    topicId: "ml_distributed_systems",
    algorithmId: "deepspeed-zero-sharding",
    description: "ZeRO Stage 1-3 memory sharding of optimizer states, gradients, and model parameters across GPUs.",
    prerequisites: ["megatron-tp-sp-split"],
    keyEquations: ["M_{ZeRO-3} = \\frac{2\\Phi + 2\\Phi + 12\\Phi}{N_{GPUs}}", "\\Delta M_{comm} = 1.5 \\times \\text{Standard AllReduce}"],
    concepts: ["Optimizer State Sharding", "Gradient Sharding", "Parameter Partitioning"],
    difficulty: "Hard",
    level: 5,
    x: 1450,
    y: 400,
  },

  // Tier 6: Frontier LLM Serving at Top (y = 220)
  {
    id: "paged-attention-block-table",
    title: "PagedAttention Block Table",
    categoryFolder: "ml_llm_serving",
    categoryLabel: "LLM Serving & Continuous Batching",
    topicId: "ml_llm_serving",
    algorithmId: "paged-attention-block-table",
    description: "Virtual memory block allocation mapping logical sequence KV-tokens to non-contiguous physical GPU pages.",
    prerequisites: ["flash-attention-tiling"],
    keyEquations: ["Physical\\_Addr = Block\\_Table[Logical\\_Block] \\times Block\\_Size + Offset", "\\text{Fragmentation} < 4\\%"],
    concepts: ["Virtual Memory Block Table", "Non-Contiguous KV Cache", "Zero Memory Waste"],
    difficulty: "Hard",
    level: 6,
    x: 400,
    y: 220,
  },
  {
    id: "continuous-batching-scheduler",
    title: "Continuous Batching Scheduler",
    categoryFolder: "ml_llm_serving",
    categoryLabel: "LLM Serving & Continuous Batching",
    topicId: "ml_llm_serving",
    algorithmId: "continuous-batching-scheduler",
    description: "Iteration-level prefill & decode scheduling dynamically inserting new requests without waiting for sequence completion.",
    prerequisites: ["paged-attention-block-table"],
    keyEquations: ["Throughput = \\frac{\\sum T_{tokens}}{\\sum T_{step}}", "\\text{Batch}_{step} = \\{r \\in \\text{Queue} \\mid \\text{FreeBlocks}(r) \\ge 1\\}"],
    concepts: ["Iteration-Level Scheduling", "Prefill & Decode Co-scheduling", "GPU Memory Utilization"],
    difficulty: "Hard",
    level: 6,
    x: 800,
    y: 220,
  },
  {
    id: "speculative-decoding-verifier",
    title: "Speculative Decoding Verifier",
    categoryFolder: "ml_llm_serving",
    categoryLabel: "LLM Serving & Continuous Batching",
    topicId: "ml_llm_serving",
    algorithmId: "speculative-decoding-verifier",
    description: "Draft model speculative token generation verified in a single parallel target model forward pass.",
    prerequisites: ["continuous-batching-scheduler"],
    keyEquations: ["P(\\text{accept}) = \\min\\left(1, \\frac{P_{target}(x)}{P_{draft}(x)}\\right)", "E[\\text{tokens/step}] = \\frac{1 - \\alpha^{\\gamma+1}}{1 - \\alpha}"],
    concepts: ["Draft Model Speculation", "Target Parallel Verification", "Rejection Sampling Acceptance"],
    difficulty: "Hard",
    level: 6,
    x: 1250,
    y: 220,
  },
];

export const TOPIC_PILLS = [
  { id: "all", label: "All Topics" },
  { id: "ml_tensor_algebra", label: "Tensor Algebra & Strides" },
  { id: "ml_gemm_roofline", label: "GEMM & Roofline" },
  { id: "ml_autograd_dags", label: "Autograd & DAGs" },
  { id: "ml_precision_quantization", label: "Precision & Quantization" },
  { id: "ml_vector_search", label: "Vector Search" },
  { id: "ml_tokenization", label: "Tokenization & Tries" },
  { id: "ml_tree_ensembles", label: "Tree Ensembles" },
  { id: "ml_convolutions", label: "Convolutions & im2col" },
  { id: "ml_recurrent_gates", label: "Recurrent Gates" },
  { id: "ml_attention_geometry", label: "Attention & RoPE" },
  { id: "ml_hardware_kernels", label: "Hardware Kernels" },
  { id: "ml_distributed_systems", label: "Distributed Systems" },
  { id: "ml_llm_serving", label: "LLM Serving" },
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Zoom & Pan state
  const [scale, setScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { ref, box } = useCanvasBox({ width: 1700, height: 1350 });
  const viewBox = boxViewBox(box);
  const viewBoxString = viewBoxAttr(viewBox);

  const nodeMap = useMemo(() => {
    const map = new Map<string, MLInfraNode>();
    ML_INFRA_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const activeInspectId = hoveredNodeId || selectedNodeId;
  const currentInspectNode = activeInspectId ? nodeMap.get(activeInspectId) : null;

  const handleNodeClick = (node: MLInfraNode) => {
    setSelectedNodeId(node.id);
    if (onNavigateToAlgorithm && node.algorithmId) {
      onNavigateToAlgorithm(node.algorithmId);
    } else if (navigate && node.algorithmId) {
      navigate({ to: "/workspace/$algorithmId", params: { algorithmId: node.algorithmId } });
    } else if (onSelectCategoryFolder && node.categoryFolder) {
      onSelectCategoryFolder(node.categoryFolder);
    } else if (typeof window !== "undefined" && node.algorithmId) {
      window.location.href = `/workspace/${node.algorithmId}`;
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
    // Only drag if clicking on canvas background or SVG
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

  return (
    <div
      role="region"
      aria-label="ML Infrastructure & AI Systems Knowledge Tree"
      className="h-[calc(100vh-3.5rem)] w-full overflow-hidden flex flex-col relative bg-[var(--bg-page)]"
    >
      {/* Floating Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-3 p-4 rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl transition-all">
        {/* Row 1: Title, Search, Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base md:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
              ML Infrastructure & AI Systems Knowledge Tree
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-inset)] text-[var(--accent)] border border-[var(--border-accent)]">
              28 Topics & Algorithms
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Search Input */}
            <div className="relative flex items-center min-w-[220px]">
              <input
                type="text"
                placeholder="Search 28 ML infra topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--border-accent)] transition-all"
                aria-label="Search ML infrastructure topics and algorithms"
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
                onClick={() => setSelectedTopic(pill.id)}
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

      {/* Node Hover Overlay Card */}
      {currentInspectNode && (
        <div className="absolute bottom-6 right-6 z-30 max-w-md w-full bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-accent)] rounded-2xl p-4 shadow-2xl transition-all duration-300 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--accent)]">
                Tier {currentInspectNode.level}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                {currentInspectNode.categoryLabel}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                getDifficultyStyles(currentInspectNode.difficulty).border
              } ${getDifficultyStyles(currentInspectNode.difficulty).text}`}
            >
              {currentInspectNode.difficulty}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {currentInspectNode.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              {currentInspectNode.description}
            </p>
          </div>

          {currentInspectNode.prerequisites.length > 0 && (
            <div className="text-[11px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-secondary)]">Prerequisites: </span>
              {currentInspectNode.prerequisites
                .map((pId) => nodeMap.get(pId)?.title || pId)
                .join(" → ")}
            </div>
          )}

          <div className="bg-[var(--bg-inset)] p-3 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <div className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Core Concepts
            </div>
            <div className="flex flex-wrap gap-1">
              {currentInspectNode.concepts.map((concept) => (
                <span
                  key={concept}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)]"
                >
                  {concept}
                </span>
              ))}
            </div>

            {currentInspectNode.keyEquations.length > 0 && (
              <div className="mt-1 space-y-1">
                <div className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Key Equations
                </div>
                {currentInspectNode.keyEquations.map((eq, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] font-mono bg-[var(--bg-surface)] text-[var(--accent)] px-2.5 py-1 rounded border border-[var(--border-default)] overflow-x-auto"
                  >
                    {eq}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNodeClick(currentInspectNode)}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-all duration-200 cursor-pointer text-center"
          >
            Visualize {currentInspectNode.algorithmId} in Workspace →
          </button>
        </div>
      )}

      {/* Interactive SVG Canvas following Canvas Law */}
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
              id="ml-arrow-active"
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
              id="ml-arrow-dim"
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
            {ML_INFRA_NODES.map((node) => {
              return node.prerequisites.map((pId) => {
                const parent = nodeMap.get(pId);
                if (!parent) return null;

                const query = searchQuery.trim().toLowerCase();
                const nodeMatchesSearch =
                  !query ||
                  node.title.toLowerCase().includes(query) ||
                  node.description.toLowerCase().includes(query) ||
                  node.algorithmId.toLowerCase().includes(query) ||
                  node.concepts.some((c) => c.toLowerCase().includes(query));

                const parentMatchesSearch =
                  !query ||
                  parent.title.toLowerCase().includes(query) ||
                  parent.description.toLowerCase().includes(query) ||
                  parent.algorithmId.toLowerCase().includes(query) ||
                  parent.concepts.some((c) => c.toLowerCase().includes(query));

                const matchesTopic =
                  selectedTopic === "all" ||
                  node.topicId === selectedTopic ||
                  parent.topicId === selectedTopic;

                const isDimmed = !matchesTopic || (query !== "" && !nodeMatchesSearch && !parentMatchesSearch);

                // Curved path connecting parent bottom (or top) to node
                const startY = parent.y - 28; // parent top
                const endY = node.y + 28; // child bottom
                const midY = (startY + endY) / 2;
                const pathD = `M ${parent.x} ${startY} C ${parent.x} ${midY}, ${node.x} ${midY}, ${node.x} ${endY}`;

                return (
                  <path
                    key={`${pId}->${node.id}`}
                    d={pathD}
                    fill="none"
                    stroke={isDimmed ? "var(--border-default)" : "var(--accent)"}
                    strokeWidth={isDimmed ? 1.5 : 2.5}
                    markerEnd={isDimmed ? "url(#ml-arrow-dim)" : "url(#ml-arrow-active)"}
                    className="transition-all duration-300"
                    opacity={isDimmed ? 0.2 : 0.85}
                  />
                );
              });
            })}

            {/* 28 Algorithm Nodes */}
            {ML_INFRA_NODES.map((node) => {
              const isHovered = hoveredNodeId === node.id;
              const isSelectedNode = selectedNodeId === node.id;

              const query = searchQuery.trim().toLowerCase();
              const matchesSearch =
                !query ||
                node.title.toLowerCase().includes(query) ||
                node.description.toLowerCase().includes(query) ||
                node.algorithmId.toLowerCase().includes(query) ||
                node.concepts.some((c) => c.toLowerCase().includes(query)) ||
                node.categoryLabel.toLowerCase().includes(query);

              const matchesTopic = selectedTopic === "all" || node.topicId === selectedTopic;
              const isDimmed = !matchesTopic || (query !== "" && !matchesSearch);

              const diffStyles = getDifficultyStyles(node.difficulty);

              const width = 220;
              const height = 56;
              const halfW = width / 2;
              const halfH = height / 2;

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.title}. Topic: ${node.categoryLabel}. Difficulty: ${node.difficulty}. Click to inspect and navigate.`}
                  transform={`translate(${node.x - halfW}, ${node.y - halfH})`}
                  onClick={() => handleNodeClick(node)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNodeClick(node);
                    }
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onFocus={() => {
                    setHoveredNodeId(node.id);
                    setSelectedNodeId(node.id);
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
                    rx={12}
                    fill={isHovered || isSelectedNode ? "var(--bg-inset)" : "var(--bg-surface)"}
                    stroke={
                      isHovered || isSelectedNode
                        ? "var(--accent)"
                        : matchesSearch && query !== ""
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
                    y={22}
                    textAnchor="middle"
                    fill={isHovered || isSelectedNode ? "var(--text-primary)" : "var(--text-secondary)"}
                    className="font-bold text-[12px]"
                  >
                    ⚡ {node.title}
                  </text>

                  {/* Subtitle / Metadata */}
                  <text
                    x={halfW}
                    y={40}
                    textAnchor="middle"
                    fill={diffStyles.stroke}
                    className="font-mono text-[10px] font-bold"
                  >
                    {node.algorithmId} • {node.difficulty}
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
