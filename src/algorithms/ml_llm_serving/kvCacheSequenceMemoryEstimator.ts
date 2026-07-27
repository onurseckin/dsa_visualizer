import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface kvCacheSequenceMemoryEstimatorInput {
  layers: number;
  num_kv_heads: number;
  head_dim: number;
  seq_len: number;
  precision_bytes: number;
  batch_size: number;
}

export const KVCACHESEQUENCEMEMORYESTIMATOR_CODE = `
def kv_cache_sequence_memory_estimator(layers=32, num_kv_heads=8, head_dim=128, seq_len=4096, precision_bytes=2, batch_size=1):
    """
    Calculates total VRAM required for Key-Value cache storage across transformer layers, heads, sequence lengths, and precision.
    Formula: Total Bytes = 2 * layers * num_kv_heads * head_dim * seq_len * precision_bytes * batch_size
    """
    bytes_per_token_per_layer = 2 * num_kv_heads * head_dim * precision_bytes
    bytes_per_sequence = layers * bytes_per_token_per_layer * seq_len
    total_bytes = bytes_per_sequence * batch_size

    total_mb = total_bytes / (1024 * 1024)
    total_gb = total_mb / 1024

    return {
        'total_bytes': total_bytes,
        'total_mb': round(total_mb, 2),
        'total_gb': round(total_gb, 4),
        'bytes_per_token': bytes_per_token_per_layer * layers
    }
`;

export const DEFAULT_KVCACHESEQUENCEMEMORYESTIMATOR_INPUT: kvCacheSequenceMemoryEstimatorInput = {
  layers: 32,
  num_kv_heads: 8,
  head_dim: 128,
  seq_len: 4096,
  precision_bytes: 2,
  batch_size: 1,
};

export const generateKvCacheSequenceMemoryEstimatorSteps = (
  input: kvCacheSequenceMemoryEstimatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const components = [
    { label: "Transformer Layers", val: input.layers },
    { label: "KV Heads (GQA)", val: input.num_kv_heads },
    { label: "Head Dimension", val: input.head_dim },
    { label: "Sequence Length", val: input.seq_len },
    { label: "Precision Bytes", val: input.precision_bytes },
    { label: "Batch Concurrency", val: input.batch_size },
  ];

  const elements: ArrayElement[] = components.map((comp, idx) => ({
    id: `comp-${idx}`,
    value: `${comp.label}: ${comp.val}`,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          layers: String(input.layers),
          num_kv_heads: String(input.num_kv_heads),
          head_dim: String(input.head_dim),
          seq_len: String(input.seq_len),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize KV-Cache Sequence Memory Footprint Calculator",
    "Setting up model architectural dimensions: layers, KV heads, head dim, context sequence length, precision, and batch size.",
    {
      layers: input.layers,
      num_kv_heads: input.num_kv_heads,
      head_dim: input.head_dim,
      seq_len: input.seq_len,
    },
  );

  const bytesPerTokenPerLayer = 2 * input.num_kv_heads * input.head_dim * input.precision_bytes;
  const currentElements = elements.map((el) => ({ ...el }));
  currentElements[1] = { ...currentElements[1], state: "active", pointers: ["GQA heads"] };
  currentElements[2] = { ...currentElements[2], state: "active", pointers: ["head_dim"] };

  addStep(
    8,
    `Calculate per-layer token KV memory: ${bytesPerTokenPerLayer} Bytes`,
    `Formula: 2 (K & V) * ${input.num_kv_heads} heads * ${input.head_dim} dim * ${input.precision_bytes} bytes = ${bytesPerTokenPerLayer} Bytes/token/layer.`,
    { bytes_per_token_per_layer: bytesPerTokenPerLayer },
    currentElements,
  );

  const bytesPerSeq = input.layers * bytesPerTokenPerLayer * input.seq_len;
  currentElements[0] = {
    ...currentElements[0],
    state: "visited",
    pointers: [`${input.layers} layers`],
  };
  currentElements[3] = {
    ...currentElements[3],
    state: "visited",
    pointers: [`seq_len=${input.seq_len}`],
  };

  addStep(
    9,
    `Calculate single sequence KV memory: ${(bytesPerSeq / (1024 * 1024)).toFixed(2)} MB`,
    `Multiplying across all ${input.layers} layers and ${input.seq_len} tokens yields ${(bytesPerSeq / (1024 * 1024)).toFixed(2)} MB per sequence.`,
    { bytes_per_sequence_mb: Number((bytesPerSeq / (1024 * 1024)).toFixed(2)) },
    currentElements,
  );

  const totalBytes = bytesPerSeq * input.batch_size;
  const totalMB = totalBytes / (1024 * 1024);
  const totalGB = totalMB / 1024;

  const finalElements = currentElements.map((el) => ({
    ...el,
    state: "sorted" as const,
  }));

  addStep(
    14,
    "Execution Complete",
    `Total KV-cache memory estimated: ${totalMB.toFixed(2)} MB (${totalGB.toFixed(4)} GB) across batch size ${input.batch_size}.`,
    {
      total_bytes: totalBytes,
      total_mb: Number(totalMB.toFixed(2)),
      total_gb: Number(totalGB.toFixed(4)),
    },
    finalElements,
  );

  return steps;
};

const KVCACHESEQUENCEMEMORYESTIMATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "bytes_per_token = num_kv_heads * head_dim # missing factor of 2 for both K and V tensors",
    "total_mb = total_bytes / 1000000 # decimal vs binary Mebibyte calculation",
    "bytes_per_sequence = layers + seq_len",
  ],
  hints: [
    {
      line: 8,
      hint: "Include factor of 2 for Key and Value tensors: 2 * heads * head_dim * bytes.",
    },
  ],
  lineExplanations: {
    1: "Entry point for KV-Cache Sequence Memory Footprint Calculator.",
    8: "Calculates per-token memory for K and V tensors in 1 layer.",
    9: "Scales per-token memory across all transformer layers and sequence length S.",
    10: "Scales sequence memory by batch size concurrency B.",
    14: "Returns dictionary containing total memory footprint in Bytes, MB, and GB.",
  },
};

export const kvCacheSequenceMemoryEstimator: AlgorithmDefinition<kvCacheSequenceMemoryEstimatorInput> =
  {
    id: "kv-cache-sequence-memory-estimator",
    title: "KV-Cache Sequence Memory Footprint Calculator",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "In Large Language Model serving, Key-Value (KV) cache VRAM consumption is the dominant bottleneck governing maximum batch concurrency and long-context performance. During autoregressive decoding, past Key and Value activation vectors across all Transformer attention layers must be retained in GPU VRAM to avoid recomputing attention over historical tokens.\n\nThis algorithm calculates the exact VRAM memory footprint for KV-cache tensors using the analytical formula:\n  Memory_KV = 2 * L * H_kv * D_head * S * P * B\nwhere 2 accounts for both Key and Value tensors, L is the number of transformer layers, H_kv is the number of KV attention heads (accounting for Grouped-Query Attention GQA ratio), D_head is the head dimension, S is the sequence length in tokens, P is precision size in bytes (2 for FP16/BF16, 1 for FP8/INT8, 0.5 for INT4), and B is batch size concurrency.\n\nInput Format:\n- layers: Integer count of Transformer model layers L (e.g. 32 for LLaMA-7B).\n- num_kv_heads: Integer count of Key-Value attention heads H_kv.\n- head_dim: Dimension size per attention head D_head (e.g. 128).\n- seq_len: Integer sequence length in tokens S (e.g. 4096).\n- precision_bytes: Numeric byte size per tensor element P (e.g. 2 for FP16, 1 for INT8).\n- batch_size: Integer batch size concurrency B.\n\nOutput Format:\n- Returns a dictionary with total_bytes, total_mb, total_gb, and bytes_per_token calculations.\n\nEdge Cases & Constraints:\n- GQA vs MHA: Grouped-Query Attention (GQA) reduces H_kv by 4x-8x relative to query heads, drastically shrinking KV memory.\n- Quantized KV Cache: FP8 (1 byte) halves memory footprint compared to FP16 (2 bytes), doubling maximum serving batch capacity.",
    constraints: [
      "1 <= layers <= 128",
      "1 <= num_kv_heads <= 128",
      "16 <= head_dim <= 256",
      "1 <= seq_len <= 1048576",
      "1 <= precision_bytes <= 4",
      "1 <= batch_size <= 1024",
    ],
    examples: [
      {
        kind: "basic",
        title: "LLaMA-7B 4k Context FP16 KV Memory",
        inputDisplay: "layers=32, num_kv_heads=8, head_dim=128, seq_len=4096, precision=2, batch=1",
        outputDisplay: "Total Memory: 536,870,912 Bytes (512.00 MB, 0.5000 GB)",
        input: {
          layers: 32,
          num_kv_heads: 8,
          head_dim: 128,
          seq_len: 4096,
          precision_bytes: 2,
          batch_size: 1,
        },
        output: "512.00 MB",
        explanation:
          "2 * 32 layers * 8 heads * 128 dim * 4096 tokens * 2 bytes = 512 MB per active sequence.",
      },
      {
        kind: "complex",
        title: "FP8 Quantization Doubling Concurrency",
        inputDisplay: "layers=32, num_kv_heads=8, head_dim=128, seq_len=4096, precision=1, batch=2",
        outputDisplay: "Total Memory: 536,870,912 Bytes (512.00 MB, 0.5000 GB)",
        input: {
          layers: 32,
          num_kv_heads: 8,
          head_dim: 128,
          seq_len: 4096,
          precision_bytes: 1,
          batch_size: 2,
        },
        output: "512.00 MB",
        explanation:
          "FP8 quantization (1 byte) allows serving 2 concurrent sequences within the same 512 MB VRAM footprint.",
      },
    ],
    code: KVCACHESEQUENCEMEMORYESTIMATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) constant time scalar arithmetic multiplication.",
      space: "O(1) memory allocation to store output metrics object.",
    },
    topicGuide: {
      overview:
        "KV-Cache Memory Estimators compute GPU VRAM requirements across Transformer architectural dimensions, context lengths, precision types, and batch sizes.",
      sections: [
        {
          heading: "Overview",
          body: "In high-throughput LLM serving systems, GPU VRAM is split into three main regions: model parameter weights, execution activation buffers, and the KV-cache. While model parameters remain static, the KV-cache grows dynamically with sequence length and batch size, making it the primary factor limiting throughput and concurrency.",
        },
        {
          heading: "Core Concepts",
          body: "The KV-cache footprint formula is: Memory_KV = 2 * L * H_kv * D_head * S * P * B. Key components include: the 2x multiplier for storing both Key and Value matrices; Grouped-Query Attention (GQA) head reduction; and FP8/INT4 precision scaling.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Accurate memory estimation allows LLM serving engines (vLLM, TGI, TensorRT-LLM) to pre-allocate maximum VRAM block pools without risking Out-Of-Memory (OOM) crashes. Quantizing KV-cache from FP16 to FP8 halves bandwidth transfers and doubles GPU batch capacity.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Engineering considerations include PagedAttention virtual block memory overhead (allocating full 16-token pages), accounting for prefix-caching block sharing, and handling multi-GPU Tensor Parallelism sharding where H_kv is divided across GPUs.",
        },
      ],
      keyTerms: [
        {
          term: "KV Cache Footprint",
          definition:
            "Total GPU VRAM allocated to store historical Key and Value vectors for attention calculations.",
        },
        {
          term: "Grouped-Query Attention (GQA)",
          definition:
            "Architecture sharing KV heads across multiple query heads to reduce KV memory footprint.",
        },
        {
          term: "Precision Quantization",
          definition:
            "Compressing KV cache vectors from 16-bit float to 8-bit or 4-bit integer types.",
        },
        {
          term: "Context Concurrency Capacity",
          definition:
            "Maximum number of simultaneous active sequences GPU VRAM can host without OOM.",
        },
      ],
    },
    trivia: KVCACHESEQUENCEMEMORYESTIMATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_KVCACHESEQUENCEMEMORYESTIMATOR_INPUT,
    generateSteps: generateKvCacheSequenceMemoryEstimatorSteps,
  };
