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

  const components = [
    { label: "Layers (L)", val: layers },
    { label: "KV Heads (H_kv)", val: num_kv_heads },
    { label: "Head Dim (D)", val: head_dim },
    { label: "Sequence Len (S)", val: seq_len },
    { label: "Precision Bytes (P)", val: precision_bytes },
    { label: "Batch Size (B)", val: batch_size },
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
    activeIndices: number[] = [],
    pointersMap: Record<number, string[]> = {},
  ) => {
    const updatedElements: ArrayElement[] = elements.map((el, idx) => {
      let state: ArrayElement["state"] = "default";
      if (activeIndices.includes(idx)) state = "active";
      return {
        ...el,
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

  // Step 1: Function entry
  addStep(
    1,
    "Enter kv_cache_sequence_memory_estimator function",
    "Initializing KV cache estimation parameters for transformer architecture.",
    { layers, num_kv_heads, head_dim, seq_len, precision_bytes, batch_size },
    [0, 1, 2, 3, 4, 5],
  );

  // Step 2-7: Parameter parsing
  addStep(1, `Set transformer layers L = ${layers}`, "Model depth determines how many layer KV caches must be stored.", { layers }, [0], { 0: ["L"] });
  addStep(1, `Set KV attention heads H_kv = ${num_kv_heads}`, "Grouped-Query Attention (GQA) head count.", { num_kv_heads }, [1], { 1: ["H_kv"] });
  addStep(1, `Set head dimension D_head = ${head_dim}`, "Dimensionality of key/value vector per head.", { head_dim }, [2], { 2: ["D_head"] });
  addStep(1, `Set sequence length S = ${seq_len} tokens`, "Context window size per sequence.", { seq_len }, [3], { 3: ["S"] });
  addStep(1, `Set precision P = ${precision_bytes} bytes`, precision_bytes === 2 ? "FP16/BF16 16-bit precision." : precision_bytes === 1 ? "FP8/INT8 8-bit quantized precision." : `${precision_bytes} bytes precision.`, { precision_bytes }, [4], { 4: ["P"] });
  addStep(1, `Set batch size B = ${batch_size} concurrent sequence(s)`, "Number of parallel requests sharing KV cache pool.", { batch_size }, [5], { 5: ["B"] });

  // Step 8: Docstring
  addStep(
    2,
    "Inspect KV-Cache Memory Formula",
    "Formula: $\\text{Memory}_{\\text{KV}} = 2 \\cdot L \\cdot H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot S \\cdot P \\cdot B$. Factor 2 counts both Key and Value matrices.",
    { formula: "2 * L * H_kv * D_head * S * P * B" },
  );

  // Step 9: Key vector size
  const keyVecBytes = num_kv_heads * head_dim * precision_bytes;
  addStep(
    6,
    `Calculate Key vector size: ${keyVecBytes} Bytes/token/layer`,
    `$H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot P = ${num_kv_heads} \\cdot ${head_dim} \\cdot ${precision_bytes} = ${keyVecBytes}$ Bytes.`,
    { keyVecBytes },
    [1, 2, 4],
  );

  // Step 10: Value vector size
  const valVecBytes = num_kv_heads * head_dim * precision_bytes;
  addStep(
    6,
    `Calculate Value vector size: ${valVecBytes} Bytes/token/layer`,
    `Value matrix has identical dimensions: $H_{\\text{kv}} \\cdot D_{\\text{head}} \\cdot P = ${valVecBytes}$ Bytes.`,
    { valVecBytes },
    [1, 2, 4],
  );

  // Step 11: Combined K+V per token per layer
  const bytesPerTokenPerLayer = 2 * num_kv_heads * head_dim * precision_bytes;
  addStep(
    6,
    `Calculate bytes_per_token_per_layer = ${bytesPerTokenPerLayer} Bytes`,
    `$2 \\cdot ${num_kv_heads} \\cdot ${head_dim} \\cdot ${precision_bytes} = ${bytesPerTokenPerLayer}$ Bytes per token per layer.`,
    { bytes_per_token_per_layer: bytesPerTokenPerLayer },
    [1, 2, 4],
    { 1: ["2x K&V"] },
  );

  // Step 12: Scaled across layers
  const bytesPerTokenAllLayers = bytesPerTokenPerLayer * layers;
  addStep(
    7,
    `Scale across ${layers} layers: ${bytesPerTokenAllLayers} Bytes/token`,
    `$L \\cdot \\text{bytes\\_per\\_token\\_per\\_layer} = ${layers} \\cdot ${bytesPerTokenPerLayer} = ${bytesPerTokenAllLayers}$ Bytes/token across all layers.`,
    { bytesPerTokenAllLayers },
    [0, 1, 2, 4],
    { 0: [`${layers} layers`] },
  );

  // Step 13: Scaled across sequence length
  const bytesPerSequence = layers * bytesPerTokenPerLayer * seq_len;
  addStep(
    7,
    `Calculate bytes_per_sequence = ${bytesPerSequence} Bytes`,
    `$${bytesPerTokenAllLayers} \\text{ Bytes/token} \\cdot ${seq_len} \\text{ tokens} = ${bytesPerSequence}$ Bytes per single sequence.`,
    { bytes_per_sequence: bytesPerSequence },
    [0, 1, 2, 3, 4],
    { 3: [`${seq_len} tokens`] },
  );

  // Step 14: Scaled across batch size
  const totalBytes = bytesPerSequence * batch_size;
  addStep(
    8,
    `Calculate total_bytes = ${totalBytes} Bytes`,
    `$\\text{bytes\\_per\\_sequence} \\cdot B = ${bytesPerSequence} \\cdot ${batch_size} = ${totalBytes}$ Bytes total across batch.`,
    { total_bytes: totalBytes },
    [0, 1, 2, 3, 4, 5],
    { 5: [`batch=${batch_size}`] },
  );

  // Step 15: Convert to KB
  const totalKB = totalBytes / 1024;
  addStep(
    10,
    `Convert total_bytes to KB: ${totalKB.toFixed(2)} KB`,
    `$${totalBytes} / 1024 = ${totalKB.toFixed(2)}$ Kibibytes (KiB).`,
    { totalKB: Number(totalKB.toFixed(2)) },
  );

  // Step 16: Convert to MB
  const totalMB = totalBytes / (1024 * 1024);
  addStep(
    10,
    `Calculate total_mb = ${totalMB.toFixed(2)} MB`,
    `$${totalBytes} / (1024^2) = ${totalMB.toFixed(2)}$ Mebibytes (MiB).`,
    { total_mb: Number(totalMB.toFixed(2)) },
  );

  // Step 17: Convert to GB
  const totalGB = totalMB / 1024;
  addStep(
    11,
    `Calculate total_gb = ${totalGB.toFixed(4)} GB`,
    `$${totalMB.toFixed(2)} / 1024 = ${totalGB.toFixed(4)}$ Gibibytes (GiB).`,
    { total_gb: Number(totalGB.toFixed(4)) },
  );

  // Step 18: Build return dictionary start
  addStep(
    13,
    "Construct return dictionary",
    "Packaging analytical KV cache footprint metrics into result dictionary.",
    { total_bytes: totalBytes, total_mb: Number(totalMB.toFixed(2)), total_gb: Number(totalGB.toFixed(4)) },
  );

  // Step 19: Return total_bytes
  addStep(14, `Set 'total_bytes': ${totalBytes}`, "Exact byte count stored in return dictionary.", { total_bytes: totalBytes });

  // Step 20: Return total_mb
  addStep(15, `Set 'total_mb': ${roundVal(totalMB, 2)} MB`, "Rounded MB count stored in return dictionary.", { total_mb: roundVal(totalMB, 2) });

  // Step 21: Return total_gb
  addStep(16, `Set 'total_gb': ${roundVal(totalGB, 4)} GB`, "Rounded GB count stored in return dictionary.", { total_gb: roundVal(totalGB, 4) });

  // Step 22: Return bytes_per_token
  addStep(17, `Set 'bytes_per_token': ${bytesPerTokenAllLayers} Bytes`, "Memory allocated per context token across all layers.", { bytes_per_token: bytesPerTokenAllLayers });

  // Step 23: Final return
  addStep(
    18,
    "Return completed estimation dictionary",
    `Final result: ${totalMB.toFixed(2)} MB (${totalGB.toFixed(4)} GB) VRAM required for KV cache storage.`,
    {
      total_bytes: totalBytes,
      total_mb: roundVal(totalMB, 2),
      total_gb: roundVal(totalGB, 4),
      bytes_per_token: bytesPerTokenAllLayers,
    },
    [0, 1, 2, 3, 4, 5],
  );

  return steps;
};

function roundVal(val: number, decimals: number): number {
  return Number(val.toFixed(decimals));
}

const KVCACHESEQUENCEMEMORYESTIMATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 9, 12],
  distractors: [
    "bytes_per_token_per_layer = num_kv_heads * head_dim * precision_bytes",
    "total_bytes = bytes_per_sequence / batch_size",
    "total_gb = total_mb * 1024",
  ],
  hints: [
    { line: 6, hint: "Factor 2 counts both Key and Value vectors: 2 * num_kv_heads * head_dim * precision_bytes." },
    { line: 7, hint: "Scale per-token memory across all L layers and context tokens S." },
    { line: 8, hint: "Scale sequence memory by batch size concurrency B." },
  ],
  lineExplanations: {
    1: "Function signature for KV Cache memory footprint estimator taking layers, heads, head_dim, seq_len, precision_bytes, and batch_size.",
    2: "Begin docstring describing KV Cache memory calculation.",
    3: "Docstring line explaining VRAM requirements across Transformer layers and heads.",
    4: "Docstring line detailing analytical formula: 2 * L * H_kv * D * S * P * B.",
    5: "End docstring.",
    6: "Compute per-token memory for Key and Value matrices in a single layer: 2 * H_kv * D_head * P.",
    7: "Scale per-token memory across all L transformer layers and sequence length S.",
    8: "Scale sequence memory by batch size concurrency B to obtain total_bytes.",
    9: "Blank line before memory unit conversions.",
    10: "Convert total_bytes to Mebibytes (MB) by dividing by 1024^2.",
    11: "Convert total_mb to Gibibytes (GB) by dividing by 1024.",
    12: "Blank line before constructing return dictionary payload.",
    13: "Start returning result dictionary containing analytical KV cache metrics.",
    14: "Return exact total_bytes metric in dictionary.",
    15: "Return total_mb rounded to 2 decimal places.",
    16: "Return total_gb rounded to 4 decimal places.",
    17: "Return bytes_per_token metric across all transformer layers.",
    18: "Complete return of dictionary to caller.",
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
