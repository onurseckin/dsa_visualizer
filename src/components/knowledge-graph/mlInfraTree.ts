/* ML curriculum placement data. Problem metadata belongs exclusively to the
   learning registry; these records only describe how declared topics appear here. */
import { indexPlacements } from "../../curriculum/trees";
import type { MLInfraCurriculumPlacement } from "./data/mlInfraTypes";

export {
  ML_INFRA_FAMILIES,
  mlInfraFamilyColor,
  mlInfraFamilyFill,
  mlInfraFamilyFillHover,
  mlInfraFamilyLabel,
} from "./data/mlInfraTypes";
export type {
  MLInfraCurriculumPlacement,
  MLInfraFamily,
  MLInfraFamilyId,
} from "./data/mlInfraTypes";

export const ML_INFRA_TREE_PLACEMENTS: readonly MLInfraCurriculumPlacement[] = [
  {
    id: "ml_tensor_algebra",
    topicId: "ml_tensor_algebra",
    title: "Tensor Algebra & Memory Layout",
    description:
      "Multi-dimensional tensor indexing, strided memory layouts, NCHW/NHWC offsets, and contiguity validation.",
    family: "foundations",
    difficulty: "Easy",
    prerequisites: [],
    x: 840,
    y: 80,
  },
  {
    id: "ml_gemm_roofline",
    topicId: "ml_gemm_roofline",
    title: "GEMM & Roofline Modeling",
    description:
      "High-performance matrix multiplication, L1/L2/SRAM cache tiling, operational intensity, and hardware roofline bounds.",
    family: "foundations",
    difficulty: "Medium",
    prerequisites: ["ml_tensor_algebra"],
    x: 300,
    y: 270,
  },
  {
    id: "ml_autograd_dags",
    topicId: "ml_autograd_dags",
    title: "Autograd & Computational DAGs",
    description:
      "Automatic differentiation, topological sorting over computational DAGs, reverse-mode VJPs, and activation checkpointing.",
    family: "core-math",
    difficulty: "Medium",
    prerequisites: ["ml_tensor_algebra"],
    x: 840,
    y: 270,
  },
  {
    id: "ml_precision_quantization",
    topicId: "ml_precision_quantization",
    title: "Numeric Precision & Quantization",
    description:
      "IEEE 754 bit representations, FP16/FP8 overflow handling, INT8 uniform/affine quantization, and online softmax stability.",
    family: "core-math",
    difficulty: "Medium",
    prerequisites: ["ml_gemm_roofline"],
    x: 1380,
    y: 270,
  },
  {
    id: "ml_vector_search",
    topicId: "ml_vector_search",
    title: "Vector Search & Indexing",
    description:
      "Nearest neighbor search, Locality Sensitive Hashing (LSH), Product Quantization (PQ), and HNSW graph indexing.",
    family: "intermediate-systems",
    difficulty: "Hard",
    prerequisites: ["ml_precision_quantization"],
    x: 1460,
    y: 460,
  },
  {
    id: "ml_tokenization",
    topicId: "ml_tokenization",
    title: "Subword Tokenization & Tries",
    description:
      "BPE, WordPiece, and Unigram tokenization algorithms, prefix tries, and Viterbi dynamic programming segmentation.",
    family: "intermediate-systems",
    difficulty: "Medium",
    prerequisites: ["ml_autograd_dags"],
    x: 1040,
    y: 460,
  },
  {
    id: "ml_attention_geometry",
    topicId: "ml_attention_geometry",
    title: "Attention Geometry & RoPE",
    description:
      "Scaled dot-product attention, multi-head/multi-query grouping, Rotary Position Embeddings (RoPE), and KV-cache math.",
    family: "intermediate-systems",
    difficulty: "Hard",
    prerequisites: ["ml_gemm_roofline", "ml_autograd_dags"],
    x: 640,
    y: 460,
  },
  {
    id: "ml_convolutions",
    topicId: "ml_convolutions",
    title: "Convolutional Lowering & im2col",
    description:
      "Spatial 2D convolutions, im2col GEMM unrolling, Winograd minimal filtering, and depthwise separable operators.",
    family: "advanced-kernels",
    difficulty: "Hard",
    prerequisites: ["ml_gemm_roofline"],
    x: 220,
    y: 460,
  },
  {
    id: "ml_tree_ensembles",
    topicId: "ml_tree_ensembles",
    title: "Decision Trees & XGBoost 2nd-Order Boosting",
    description:
      "Gini/Entropy splits, XGBoost 1st & 2nd order Taylor expansion split search, quantile sketches, and histogram building.",
    family: "advanced-kernels",
    difficulty: "Medium",
    prerequisites: ["ml_precision_quantization"],
    x: 740,
    y: 650,
  },
  {
    id: "ml_hardware_kernels",
    topicId: "ml_hardware_kernels",
    title: "FlashAttention & Triton Hardware Kernels",
    description:
      "SRAM block tiling, FlashAttention-1/2/3 online softmax normalization, and Triton SPMD block pointer compilation.",
    family: "advanced-kernels",
    difficulty: "Hard",
    prerequisites: ["ml_attention_geometry"],
    x: 1260,
    y: 650,
  },
  {
    id: "ml_distributed_systems",
    topicId: "ml_distributed_systems",
    title: "Distributed Interconnects & Parallelism",
    description:
      "Ring-AllReduce collective communications, Tensor Parallelism (Megatron-LM), and DeepSpeed ZeRO-1/2/3 memory sharding.",
    family: "distributed-systems",
    difficulty: "Hard",
    prerequisites: ["ml_hardware_kernels"],
    x: 440,
    y: 840,
  },
  {
    id: "ml_llm_serving",
    topicId: "ml_llm_serving",
    title: "LLM Serving, PagedAttention & Speculative Decoding",
    description:
      "vLLM PagedAttention virtual memory block allocation, continuous batching iteration scheduling, and speculative decoding.",
    family: "llm-serving",
    difficulty: "Hard",
    prerequisites: ["ml_hardware_kernels"],
    x: 1240,
    y: 840,
  },
  {
    id: "ml_graph_compilers",
    topicId: "ml_graph_compilers",
    title: "Graph Compilers & IR Lowering",
    description:
      "ONNX operator fusion, TensorRT engine optimization, Apache TVM Relay graph lowering, and XLA HLO cluster fusion.",
    family: "distributed-systems",
    difficulty: "Hard",
    prerequisites: ["ml_convolutions"],
    x: 220,
    y: 650,
  },
];

export const ML_INFRA_TREE_PLACEMENT_MAP = indexPlacements(ML_INFRA_TREE_PLACEMENTS);
