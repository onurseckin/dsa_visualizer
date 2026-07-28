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

export const KVCACHESEQUENCEMEMORYESTIMATOR_CODE = `def kv_cache_sequence_memory_estimator(layers=32, num_kv_heads=8, head_dim=128, seq_len=4096, precision_bytes=2, batch_size=1):
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
    }`;

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

  const { layers, num_kv_heads, head_dim, seq_len, precision_bytes, batch_size } = input;

  const bytesPerTokenPerLayer = 2 * num_kv_heads * head_dim * precision_bytes;
  const bytesPerTokenAllLayers = bytesPerTokenPerLayer * layers;
  const bytesPerSequence = layers * bytesPerTokenPerLayer * seq_len;
  const totalBytes = bytesPerSequence * batch_size;
  const totalMB = totalBytes / (1024 * 1024);
  const totalGB = totalMB / 1024;

  const rawElements: Array<{ id: string; label: string; value: string | number }> = [
    { id: "comp-0", label: "Layers (L)", value: layers },
    { id: "comp-1", label: "KV Heads (H_kv)", value: num_kv_heads },
    { id: "comp-2", label: "Head Dim (D)", value: head_dim },
    { id: "comp-3", label: "Seq Len (S)", value: seq_len },
    { id: "comp-4", label: "Precision (P)", value: precision_bytes },
    { id: "comp-5", label: "Batch Size (B)", value: batch_size },
    { id: "comp-6", label: "Bytes/Token/Layer", value: `${bytesPerTokenPerLayer} B` },
    { id: "comp-7", label: "Bytes/Seq", value: `${bytesPerSequence.toLocaleString()} B` },
    { id: "comp-8", label: "Total Bytes", value: `${totalBytes.toLocaleString()} B` },
    { id: "comp-9", label: "Total MB", value: `${roundVal(totalMB, 2)} MB` },
    { id: "comp-10", label: "Total GB", value: `${roundVal(totalGB, 4)} GB` },
  ];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIndices: number[] = [],
    compareIndices: number[] = [],
    sortedIndices: number[] = [],
    pointersMap: Record<number, string[]> = {},
  ) => {
    const updatedElements: ArrayElement[] = rawElements.map((el, idx) => {
      let state: ArrayElement["state"] = "default";
      if (activeIndices.includes(idx)) state = "active";
      else if (compareIndices.includes(idx)) state = "compare";
      else if (sortedIndices.includes(idx)) state = "sorted";

      return {
        id: el.id,
        label: el.label,
        value: el.value,
        state,
        pointers: pointersMap[idx] || undefined,
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: updatedElements,
      },
      auxiliaryState: {
        customState: {
          layers: String(layers),
          num_kv_heads: String(num_kv_heads),
          head_dim: String(head_dim),
          seq_len: String(seq_len),
          precision_bytes: String(precision_bytes),
          batch_size: String(batch_size),
        },
      },
      variables,
    });
  };

  // Step 0: Function entry
  addStep(
    1,
    "Enter kv_cache_sequence_memory_estimator function",
    "Initializing KV cache estimation parameters for transformer architecture.",
    { layers, num_kv_heads, head_dim, seq_len, precision_bytes, batch_size },
    [0, 1, 2, 3, 4, 5],
  );

  // Steps 1-6: Parameter inspection
  addStep(
    1,
    `Set transformer layers L = ${layers}`,
    "Model depth determines how many layer KV caches must be stored.",
    { layers },
    [0],
    [],
    [],
    { 0: ["L"] },
  );
  addStep(
    1,
    `Set KV attention heads H_kv = ${num_kv_heads}`,
    "Grouped-Query Attention (GQA) head count.",
    { num_kv_heads },
    [1],
    [],
    [],
    { 1: ["H_kv"] },
  );
  addStep(
    1,
    `Set head dimension D_head = ${head_dim}`,
    "Dimensionality of key/value vector per head.",
    { head_dim },
    [2],
    [],
    [],
    { 2: ["D_head"] },
  );
  addStep(
    1,
    `Set sequence length S = ${seq_len} tokens`,
    "Context window size per sequence.",
    { seq_len },
    [3],
    [],
    [],
    { 3: ["S"] },
  );
  addStep(
    1,
    `Set precision P = ${precision_bytes} bytes`,
    precision_bytes === 2
      ? "FP16/BF16 16-bit precision."
      : precision_bytes === 1
        ? "FP8/INT8 8-bit quantized precision."
        : `${precision_bytes} bytes precision.`,
    { precision_bytes },
    [4],
    [],
    [],
    { 4: ["P"] },
  );
  addStep(
    1,
    `Set batch size B = ${batch_size} concurrent sequence(s)`,
    "Number of parallel requests sharing KV cache pool.",
    { batch_size },
    [5],
    [],
    [],
    { 5: ["B"] },
  );

  // Step 7: Formula inspection
  addStep(
    1,
    "KV Cache memory formula: 2 * L * H_kv * D_head * S * P * B",
    "Formula: $\\text{Memory}_{\\text{KV}} = 2 \\cdot L \\cdot H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot S \\cdot P \\cdot B$. Factor 2 counts both Key and Value matrices.",
    { formula: "2 * L * H_kv * D_head * S * P * B" },
    [0, 1, 2, 3, 4, 5],
  );

  // Line 2: bytes_per_token_per_layer = 2 * num_kv_heads * head_dim * precision_bytes
  const keyVecBytes = num_kv_heads * head_dim * precision_bytes;
  addStep(
    2,
    `Compute Key matrix size per token: ${keyVecBytes} B`,
    `Key vector per layer = $H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot P = ${num_kv_heads} \\cdot ${head_dim} \\cdot ${precision_bytes} = ${keyVecBytes}$ Bytes.`,
    { keyVecBytes },
    [6],
    [1, 2, 4],
  );

  const valVecBytes = num_kv_heads * head_dim * precision_bytes;
  addStep(
    2,
    `Compute Value matrix size per token: ${valVecBytes} B`,
    `Value vector per layer has identical dimensions = $H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot P = ${valVecBytes}$ Bytes.`,
    { valVecBytes },
    [6],
    [1, 2, 4],
  );

  addStep(
    2,
    `Calculate bytes_per_token_per_layer = ${bytesPerTokenPerLayer} B`,
    `Combining Key + Value: $2 \\cdot ${num_kv_heads} \\cdot ${head_dim} \\cdot ${precision_bytes} = ${bytesPerTokenPerLayer}$ Bytes per token per layer.`,
    { bytes_per_token_per_layer: bytesPerTokenPerLayer },
    [6],
    [1, 2, 4],
    [],
    { 6: ["K+V Layer"] },
  );

  // Line 3: bytes_per_sequence = layers * bytes_per_token_per_layer * seq_len
  addStep(
    3,
    `Scale across ${layers} layers: ${bytesPerTokenAllLayers} B/token`,
    `Multiplies single-layer KV size by $L = ${layers}$ layers: $${layers} \\cdot ${bytesPerTokenPerLayer} = ${bytesPerTokenAllLayers}$ Bytes per token across all layers.`,
    { bytesPerTokenAllLayers },
    [7],
    [0, 6],
  );

  addStep(
    3,
    `Calculate bytes_per_sequence = ${bytesPerSequence} B`,
    `Multiplies all-layer per-token memory by sequence length $S = ${seq_len}$: $${bytesPerTokenAllLayers} \\cdot ${seq_len} = ${bytesPerSequence}$ Bytes per sequence.`,
    { bytes_per_sequence: bytesPerSequence },
    [7],
    [0, 3, 6],
    [6],
    { 7: ["1 Sequence"] },
  );

  // Line 4: total_bytes = bytes_per_sequence * batch_size
  addStep(
    4,
    `Calculate total_bytes = ${totalBytes} B`,
    `Scales single-sequence memory by batch size concurrency $B = ${batch_size}$: $${bytesPerSequence} \\cdot ${batch_size} = ${totalBytes}$ Bytes total across batch.`,
    { total_bytes: totalBytes },
    [8],
    [5, 7],
    [6, 7],
    { 8: ["Batch Total"] },
  );

  // Line 6: total_mb = total_bytes / (1024 * 1024)
  const totalKB = totalBytes / 1024;
  addStep(
    6,
    `Intermediate KB conversion: ${totalKB.toFixed(2)} KB`,
    `$${totalBytes} / 1024 = ${totalKB.toFixed(2)}$ Kibibytes (KiB).`,
    { totalKB: Number(totalKB.toFixed(2)) },
    [9],
    [8],
  );

  addStep(
    6,
    `Calculate total_mb = ${totalMB.toFixed(2)} MB`,
    `$${totalBytes} / (1024^2) = ${totalMB.toFixed(2)}$ Mebibytes (MiB).`,
    { total_mb: Number(totalMB.toFixed(2)) },
    [9],
    [8],
    [6, 7, 8],
    { 9: ["MiB Footprint"] },
  );

  // Line 7: total_gb = total_mb / 1024
  addStep(
    7,
    `Calculate total_gb = ${totalGB.toFixed(4)} GB`,
    `$${totalMB.toFixed(2)} / 1024 = ${totalGB.toFixed(4)}$ Gibibytes (GiB).`,
    { total_gb: Number(totalGB.toFixed(4)) },
    [10],
    [9],
    [6, 7, 8, 9],
    { 10: ["GiB Footprint"] },
  );

  // Line 9: return {
  addStep(
    9,
    "Construct return dictionary",
    "Packaging analytical KV cache footprint metrics into result dictionary.",
    {
      total_bytes: totalBytes,
      total_mb: Number(totalMB.toFixed(2)),
      total_gb: Number(totalGB.toFixed(4)),
    },
    [],
    [],
    [6, 7, 8, 9, 10],
  );

  // Line 10: 'total_bytes': total_bytes
  addStep(
    10,
    `Set 'total_bytes': ${totalBytes}`,
    "Exact byte count stored in return dictionary.",
    { total_bytes: totalBytes },
    [8],
    [],
    [6, 7, 9, 10],
  );

  // Line 11: 'total_mb': round(total_mb, 2)
  addStep(
    11,
    `Set 'total_mb': ${roundVal(totalMB, 2)}`,
    "Rounded MB count stored in return dictionary.",
    { total_mb: roundVal(totalMB, 2) },
    [9],
    [],
    [6, 7, 8, 10],
  );

  // Line 12: 'total_gb': round(total_gb, 4)
  addStep(
    12,
    `Set 'total_gb': ${roundVal(totalGB, 4)}`,
    "Rounded GB count stored in return dictionary.",
    { total_gb: roundVal(totalGB, 4) },
    [10],
    [],
    [6, 7, 8, 9],
  );

  // Line 13: 'bytes_per_token': bytes_per_token_per_layer * layers
  addStep(
    13,
    `Set 'bytes_per_token': ${bytesPerTokenAllLayers}`,
    "Memory allocated per context token across all layers.",
    { bytes_per_token: bytesPerTokenAllLayers },
    [6],
    [],
    [7, 8, 9, 10],
  );

  // Line 14: }
  addStep(
    14,
    "Return completed estimation dictionary",
    `Final result: ${totalMB.toFixed(2)} MB (${totalGB.toFixed(4)} GB) VRAM required for KV cache storage.`,
    {
      total_bytes: totalBytes,
      total_mb: roundVal(totalMB, 2),
      total_gb: roundVal(totalGB, 4),
      bytes_per_token: bytesPerTokenAllLayers,
    },
    [],
    [],
    [6, 7, 8, 9, 10],
  );

  return steps;
};

function roundVal(val: number, decimals: number): number {
  return Number(val.toFixed(decimals));
}

const KVCACHESEQUENCEMEMORYESTIMATOR_TRIVIA: TriviaMeta = {
  skipLines: [5, 8, 9, 14],
  distractors: [
    "bytes_per_token_per_layer = num_kv_heads * head_dim * precision_bytes",
    "total_bytes = bytes_per_sequence / batch_size",
    "total_gb = total_mb * 1024",
  ],
  hints: [
    {
      line: 2,
      hint: "Factor 2 counts both Key and Value vectors: 2 * num_kv_heads * head_dim * precision_bytes.",
    },
    { line: 3, hint: "Scale per-token memory across all L layers and context tokens S." },
    { line: 4, hint: "Scale sequence memory by batch size concurrency B." },
  ],
  lineExplanations: {
    1: "Function signature for KV Cache memory footprint estimator taking layers, heads, head_dim, seq_len, precision_bytes, and batch_size.",
    2: "Compute per-token memory for Key and Value matrices in a single layer: 2 * H_kv * D_head * P.",
    3: "Scale per-token memory across all L transformer layers and sequence length S.",
    4: "Scale sequence memory by batch size concurrency B to obtain total_bytes.",
    5: "Blank line before memory unit conversions.",
    6: "Convert total_bytes to Mebibytes (MB) by dividing by 1024^2.",
    7: "Convert total_mb to Gibibytes (GB) by dividing by 1024.",
    8: "Blank line before constructing return dictionary payload.",
    9: "Start returning result dictionary containing analytical KV cache metrics.",
    10: "Return exact total_bytes metric in dictionary.",
    11: "Return total_mb rounded to 2 decimal places.",
    12: "Return total_gb rounded to 4 decimal places.",
    13: "Return bytes_per_token metric across all transformer layers.",
    14: "Complete return of dictionary to caller.",
  },
};

export const kvCacheSequenceMemoryEstimator: AlgorithmDefinition<kvCacheSequenceMemoryEstimatorInput> =
  {
    id: "kv-cache-sequence-memory-estimator",
    title: "KV-Cache Sequence Memory Footprint Calculator",
    topicIds: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Easy",
    description:
      "In Large Language Model (LLM) serving architectures, Key-Value (KV) cache GPU VRAM consumption is the primary hardware bottleneck governing maximum batch concurrency and long-context performance. During autoregressive decoding, past Key and Value activation vectors across all Transformer attention layers must be retained in GPU VRAM to avoid recomputing self-attention over historical context tokens.\n\n### Analytical Memory Formula\n$$\\text{Memory}_{\\text{KV}} = 2 \\cdot L \\cdot H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot S \\cdot P \\cdot B$$\n\nwhere:\n- $2$: Accounts for both Key ($K$) and Value ($V$) activation matrices.\n- $L$: Total count of Transformer model layers.\n- $H_{\\text{kv}}$: Number of Key-Value attention heads (accounting for Grouped-Query Attention GQA ratio).\n- $D_{\\text{head}}$: Dimension size per attention head (e.g. $128$).\n- $S$: Sequence context length in tokens.\n- $P$: Precision size in bytes ($2$ for FP16/BF16, $1$ for FP8/INT8, $0.5$ for INT4).\n- $B$: Batch size concurrency.\n\n### Input Parameters\n- `layers`: Integer count of Transformer layers $L$.\n- `num_kv_heads`: Integer count of Key-Value attention heads $H_{\\text{kv}}$.\n- `head_dim`: Dimension size per attention head $D_{\\text{head}}$.\n- `seq_len`: Sequence length in tokens $S$.\n- `precision_bytes`: Byte size per element $P$.\n- `batch_size`: Batch size concurrency $B$.\n\n### Output\n- Returns a dictionary containing `total_bytes`, `total_mb`, `total_gb`, and `bytes_per_token` metrics.",
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
      time: "$O(1)$ constant time scalar arithmetic multiplication.",
      space: "$O(1)$ memory allocation to store output metrics object.",
    },
    topicGuide: {
      overview:
        "KV-Cache Memory Estimators compute GPU VRAM requirements across Transformer architectural dimensions, context lengths, precision types, and batch sizes.",
      sections: [
        {
          heading: "Overview & Production Impact",
          body: "In high-throughput LLM serving systems, GPU VRAM is split into three main regions: model parameter weights, execution activation buffers, and the KV-cache. While model parameters remain static, the KV-cache grows dynamically with sequence length and batch size, making it the primary factor limiting throughput and concurrency.",
        },
        {
          heading: "Analytical Memory Breakdown",
          body: "The KV-cache footprint formula is:\n$$\\text{Memory}_{\\text{KV}} = 2 \\cdot L \\cdot H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot S \\cdot P \\cdot B$$\nKey components include: the 2x multiplier for storing both Key and Value matrices; Grouped-Query Attention (GQA) head reduction ($H_{\\text{kv}} = H_q / 4$ or $H_q / 8$); and FP8/INT4 precision scaling.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Accurate memory estimation allows LLM serving engines (vLLM, TGI, TensorRT-LLM) to pre-allocate maximum VRAM block pools without risking Out-Of-Memory (OOM) crashes. Quantizing KV-cache from FP16 to FP8 halves bandwidth transfers and doubles GPU batch capacity.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Engineering considerations include PagedAttention virtual block memory overhead (allocating full 16-token pages), accounting for prefix-caching block sharing, and handling multi-GPU Tensor Parallelism sharding where $H_{\\text{kv}}$ is divided across GPUs.",
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

export default kvCacheSequenceMemoryEstimator;
