import fs from "fs";
import path from "path";

interface QuestionSpec {
  id: string;
  varName: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  primaryCategory: string;
  categories: string[];
  leetcodeId?: number;
  type: "Foundational Math & DSA" | "ML Systems Implementation";
  description: string;
  overview: string;
  keyTerms: { term: string; definition: string }[];
}

const nodeConfigs = [
  {
    id: "ml_tensor_algebra",
    categoryFolder: "ml_tensor_algebra",
    title: "Tensor Algebra & Memory Layout",
    description: "Multi-dimensional tensor indexing, strided memory layouts, NCHW/NHWC offsets, and contiguity validation.",
    family: "foundations",
    difficulty: "Easy",
    prerequisites: [],
    x: 450,
    y: 80,
  },
  {
    id: "ml_gemm_roofline",
    categoryFolder: "ml_gemm_roofline",
    title: "GEMM & Roofline Modeling",
    description: "High-performance matrix multiplication, L1/L2/SRAM cache tiling, operational intensity, and hardware roofline bounds.",
    family: "foundations",
    difficulty: "Medium",
    prerequisites: ["ml_tensor_algebra"],
    x: 200,
    y: 220,
  },
  {
    id: "ml_autograd_dags",
    categoryFolder: "ml_autograd_dags",
    title: "Autograd & Computational DAGs",
    description: "Automatic differentiation, topological sorting over computational DAGs, reverse-mode VJPs, and activation checkpointing.",
    family: "core-math",
    difficulty: "Medium",
    prerequisites: ["ml_tensor_algebra"],
    x: 700,
    y: 220,
  },
  {
    id: "ml_precision_quantization",
    categoryFolder: "ml_precision_quantization",
    title: "Numeric Precision & Quantization",
    description: "IEEE 754 bit representations, FP16/FP8 overflow handling, INT8 uniform/affine quantization, and online softmax stability.",
    family: "core-math",
    difficulty: "Medium",
    prerequisites: ["ml_gemm_roofline"],
    x: 120,
    y: 380,
  },
  {
    id: "ml_vector_search",
    categoryFolder: "ml_vector_search",
    title: "Vector Search & Indexing",
    description: "Nearest neighbor search, Locality Sensitive Hashing (LSH), Product Quantization (PQ), and HNSW graph indexing.",
    family: "intermediate-systems",
    difficulty: "Hard",
    prerequisites: ["ml_precision_quantization"],
    x: 450,
    y: 380,
  },
  {
    id: "ml_tokenization",
    categoryFolder: "ml_tokenization",
    title: "Subword Tokenization & Tries",
    description: "BPE, WordPiece, and Unigram tokenization algorithms, prefix tries, and Viterbi dynamic programming segmentation.",
    family: "intermediate-systems",
    difficulty: "Medium",
    prerequisites: ["ml_autograd_dags"],
    x: 780,
    y: 380,
  },
  {
    id: "ml_attention_geometry",
    categoryFolder: "ml_attention_geometry",
    title: "Attention Geometry & RoPE",
    description: "Scaled dot-product attention, multi-head/multi-query grouping, Rotary Position Embeddings (RoPE), and KV-cache math.",
    family: "intermediate-systems",
    difficulty: "Hard",
    prerequisites: ["ml_gemm_roofline", "ml_autograd_dags"],
    x: 250,
    y: 540,
  },
  {
    id: "ml_convolutions",
    categoryFolder: "ml_convolutions",
    title: "Convolutional Lowering & im2col",
    description: "Spatial 2D convolutions, im2col GEMM unrolling, Winograd minimal filtering, and depthwise separable operators.",
    family: "advanced-kernels",
    difficulty: "Hard",
    prerequisites: ["ml_gemm_roofline"],
    x: 650,
    y: 540,
  },
  {
    id: "ml_tree_ensembles",
    categoryFolder: "ml_tree_ensembles",
    title: "Decision Trees & XGBoost 2nd-Order Boosting",
    description: "Gini/Entropy splits, XGBoost 1st & 2nd order Taylor expansion split search, quantile sketches, and histogram building.",
    family: "advanced-kernels",
    difficulty: "Medium",
    prerequisites: ["ml_precision_quantization"],
    x: 150,
    y: 700,
  },
  {
    id: "ml_hardware_kernels",
    categoryFolder: "ml_hardware_kernels",
    title: "FlashAttention & Triton Hardware Kernels",
    description: "SRAM block tiling, FlashAttention-1/2/3 online softmax normalization, and Triton SPMD block pointer compilation.",
    family: "advanced-kernels",
    difficulty: "Hard",
    prerequisites: ["ml_attention_geometry"],
    x: 450,
    y: 700,
  },
  {
    id: "ml_distributed_systems",
    categoryFolder: "ml_distributed_systems",
    title: "Distributed Interconnects & Parallelism",
    description: "Ring-AllReduce collective communications, Tensor Parallelism (Megatron-LM), and DeepSpeed ZeRO-1/2/3 memory sharding.",
    family: "distributed-systems",
    difficulty: "Hard",
    prerequisites: ["ml_hardware_kernels"],
    x: 750,
    y: 700,
  },
  {
    id: "ml_llm_serving",
    categoryFolder: "ml_llm_serving",
    title: "LLM Serving, PagedAttention & Speculative Decoding",
    description: "vLLM PagedAttention virtual memory block allocation, continuous batching iteration scheduling, and speculative decoding.",
    family: "llm-serving",
    difficulty: "Hard",
    prerequisites: ["ml_hardware_kernels", "ml_distributed_systems"],
    x: 450,
    y: 860,
  },
];

const nodesData: any[] = [];

for (const nodeConfig of nodeConfigs) {
  const folderPath = path.join(process.cwd(), "src", "algorithms", nodeConfig.categoryFolder);
  if (!fs.existsSync(folderPath)) continue;

  const questions: any[] = [];
  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "index.ts");

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const content = fs.readFileSync(filePath, "utf8");

    const idMatch = content.match(/id: ["']([^"']+)["']/);
    const titleMatch = content.match(/title: ["']([^"']+)["']/);
    const diffMatch = content.match(/difficulty: ["']([^"']+)["']/);
    const descMatch = content.match(/description: ["']([^"']+)["']/);

    if (idMatch && titleMatch && diffMatch && descMatch) {
      const algId = idMatch[1];
      const title = titleMatch[1];
      const difficulty = diffMatch[1];
      const description = descMatch[1];
      const type = difficulty === "Easy" ? "Foundational Math & DSA" : "ML Systems Implementation";

      questions.push({
        id: algId,
        title,
        algorithmId: algId,
        difficulty,
        type,
        description,
      });
    }
  }

  nodesData.push({
    ...nodeConfig,
    algorithmCount: questions.length,
    questions,
  });
}

console.log(`Prepared ${nodesData.length} ML Infra graph nodes with total ${nodesData.reduce((sum, n) => sum + n.algorithmCount, 0)} questions.`);

const graphDataPath = path.join(process.cwd(), "src", "components", "knowledge-graph", "mlInfraGraphData.ts");
const graphDataContent = fs.readFileSync(graphDataPath, "utf8");

const nodesStartIdx = graphDataContent.indexOf("export const ML_INFRA_NODES: MLInfraNode[] = [");
const nodesEndIdx = graphDataContent.indexOf("];", nodesStartIdx);

const updatedContent = graphDataContent.slice(0, nodesStartIdx) + `export const ML_INFRA_NODES: MLInfraNode[] = ${JSON.stringify(nodesData, null, 2)};` + graphDataContent.slice(nodesEndIdx + 2);

fs.writeFileSync(graphDataPath, updatedContent, "utf8");
console.log("Successfully updated mlInfraGraphData.ts!");
