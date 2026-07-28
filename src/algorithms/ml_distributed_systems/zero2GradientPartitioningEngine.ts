import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zero2GradientPartitioningEngineInput {
  data: number[];
  target?: number;
}

export const ZERO2GRADIENTPARTITIONINGENGINE_CODE = `def estimate_zero2_memory(parameters, num_gpus):
    if num_gpus <= 0:
        raise ValueError("Number of GPUs must be at least 1")

    weight_bytes = 2 * parameters
    gradient_bytes_per_gpu = (2 * parameters) / num_gpus
    optimizer_bytes_per_gpu = (12 * parameters) / num_gpus
    total_per_gpu = weight_bytes + gradient_bytes_per_gpu + optimizer_bytes_per_gpu

    return {
        "weight_bytes": weight_bytes,
        "gradient_bytes_per_gpu": gradient_bytes_per_gpu,
        "optimizer_bytes_per_gpu": optimizer_bytes_per_gpu,
        "total_per_gpu": total_per_gpu
    }
`;

export const DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT: zero2GradientPartitioningEngineInput = {
  data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
  target: 50,
};

export const generateZero2GradientPartitioningEngineSteps = (
  input: zero2GradientPartitioningEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const N = input.data.length;
  const params = input.data.reduce((sum, val) => sum + val, 0) * 10_000_000;

  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `gpu-${idx}`,
    value: val,
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
          num_gpus: String(N),
          parameters: params.toLocaleString(),
          data: `[${input.data.join(", ")}]`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize DeepSpeed ZeRO-2 Gradient Partitioning Estimator",
    `Configuring ZeRO-2 memory breakdown for ${params.toLocaleString()} parameters across ${N} GPUs.`,
    { parameters: params, num_gpus: N },
    [...elements],
  );

  addStep(
    2,
    "Check Number of GPUs Guard (num_gpus <= 0)",
    `Validating GPU count: ${N} >= 1. Guard check passed.`,
    { num_gpus: N, valid: true },
    [...elements],
  );

  const weightBytes = 2 * params;
  addStep(
    5,
    `Compute Unsharded FP16 Model Weight Memory weight_bytes = ${(weightBytes / 1e9).toFixed(2)} GB`,
    `Unsharded model weights: 2 bytes/param * ${params.toLocaleString()} = ${(weightBytes / 1e9).toFixed(2)} GB per GPU.`,
    { parameters: params, weight_bytes: weightBytes },
    [...elements],
  );

  const gradientBytesPerGpu = (2 * params) / N;
  addStep(
    6,
    `Compute Sharded FP16 Gradient Memory gradient_bytes_per_gpu = ${(gradientBytesPerGpu / 1e9).toFixed(2)} GB`,
    `Reduce-Scatter gradient sharding: (2 * ${params.toLocaleString()}) / ${N} = ${(gradientBytesPerGpu / 1e9).toFixed(2)} GB per GPU.`,
    { parameters: params, num_gpus: N, gradient_bytes_per_gpu: gradientBytesPerGpu },
    [...elements],
  );

  const optimizerBytesPerGpu = (12 * params) / N;
  addStep(
    7,
    `Compute Sharded FP32 Optimizer Memory optimizer_bytes_per_gpu = ${(optimizerBytesPerGpu / 1e9).toFixed(2)} GB`,
    `Adam optimizer state sharding: (12 * ${params.toLocaleString()}) / ${N} = ${(optimizerBytesPerGpu / 1e9).toFixed(2)} GB per GPU.`,
    { parameters: params, num_gpus: N, optimizer_bytes_per_gpu: optimizerBytesPerGpu },
    [...elements],
  );

  const totalPerGpu = weightBytes + gradientBytesPerGpu + optimizerBytesPerGpu;
  addStep(
    8,
    `Compute Total Per-GPU VRAM Footprint total_per_gpu = ${(totalPerGpu / 1e9).toFixed(2)} GB`,
    `Total per-GPU memory: weight (${(weightBytes / 1e9).toFixed(2)}GB) + grad (${(gradientBytesPerGpu / 1e9).toFixed(2)}GB) + opt (${(optimizerBytesPerGpu / 1e9).toFixed(2)}GB) = ${(totalPerGpu / 1e9).toFixed(2)} GB.`,
    {
      weight_bytes: weightBytes,
      gradient_bytes_per_gpu: gradientBytesPerGpu,
      optimizer_bytes_per_gpu: optimizerBytesPerGpu,
      total_per_gpu: totalPerGpu,
    },
    [...elements],
  );

  input.data.forEach((val, idx) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: "active" as const,
          pointers: [`GPU_${idx}`, `Grad: ${(gradientBytesPerGpu / 1e9).toFixed(2)}GB`],
        };
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      6,
      `Execute Reduce-Scatter & Partition Gradient for GPU Rank ${idx} (Payload = ${val} MB)`,
      `GPU ${idx} retains 1/${N}-th gradient partition (${(gradientBytesPerGpu / 1e9).toFixed(2)} GB) and sharded optimizer state (${(optimizerBytesPerGpu / 1e9).toFixed(2)} GB), releasing remaining $(N-1)/N$ gradient buffers.`,
      { idx, val, total_per_gpu: totalPerGpu, gradient_bytes_per_gpu: gradientBytesPerGpu },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    pointers: ["ZeRO-2 Sharded"],
  }));

  addStep(
    10,
    "Construct Return Dictionary Payload",
    "Assembling ZeRO-2 memory breakdown dictionary.",
    { total_per_gpu: totalPerGpu },
    finalElements,
  );

  addStep(
    11,
    `Set weight_bytes = ${(weightBytes / 1e9).toFixed(2)} GB`,
    "Assigning FP16 unsharded weight memory footprint.",
    { weight_bytes: weightBytes },
    finalElements,
  );

  addStep(
    12,
    `Set gradient_bytes_per_gpu = ${(gradientBytesPerGpu / 1e9).toFixed(2)} GB`,
    "Assigning FP16 Reduce-Scatter sharded gradient memory requirement.",
    { gradient_bytes_per_gpu: gradientBytesPerGpu },
    finalElements,
  );

  addStep(
    13,
    `Set optimizer_bytes_per_gpu = ${(optimizerBytesPerGpu / 1e9).toFixed(2)} GB`,
    "Assigning FP32 Adam sharded optimizer state memory requirement.",
    { optimizer_bytes_per_gpu: optimizerBytesPerGpu },
    finalElements,
  );

  addStep(
    14,
    `Set total_per_gpu = ${(totalPerGpu / 1e9).toFixed(2)} GB`,
    "Assigning total per-GPU VRAM memory footprint.",
    { total_per_gpu: totalPerGpu },
    finalElements,
  );

  addStep(
    15,
    "Return DeepSpeed ZeRO-2 Memory Allocation Analysis",
    `Completed ZeRO-2 memory estimation across ${N} GPUs. Total per-GPU VRAM footprint = ${(totalPerGpu / 1e9).toFixed(2)} GB.`,
    {
      completed: true,
      weight_bytes: weightBytes,
      gradient_bytes_per_gpu: gradientBytesPerGpu,
      optimizer_bytes_per_gpu: optimizerBytesPerGpu,
      total_per_gpu: totalPerGpu,
    },
    finalElements,
  );

  return steps;
};

const ZERO2GRADIENTPARTITIONINGENGINE_TRIVIA: TriviaMeta = {
  skipLines: [4, 9],
  distractors: [
    "total_per_gpu = weight_bytes * num_gpus",
    "gradient_bytes_per_gpu = weight_bytes * 2",
    "optimizer_bytes_per_gpu = weight_bytes / 12",
    "total_per_gpu = weight_bytes + gradient_bytes_per_gpu",
  ],
  hints: [
    { line: 5, hint: "FP16 model weights are unsharded: weight_bytes = 2 * parameters." },
    {
      line: 6,
      hint: "Gradients are sharded via Reduce-Scatter: gradient_bytes_per_gpu = (2 * parameters) / num_gpus.",
    },
    {
      line: 7,
      hint: "Adam optimizer states are sharded: optimizer_bytes_per_gpu = (12 * parameters) / num_gpus.",
    },
    {
      line: 8,
      hint: "Total per-GPU memory = weight_bytes + gradient_bytes_per_gpu + optimizer_bytes_per_gpu.",
    },
  ],
  lineExplanations: {
    1: "Function signature for estimate_zero2_memory taking parameters and num_gpus.",
    2: "Checks guard condition if num_gpus is less than or equal to 0.",
    3: "Raises ValueError if GPU count is invalid.",
    4: "Blank line separating guard clause from memory calculations.",
    5: "Calculates unsharded FP16 weight memory weight_bytes = 2 * parameters.",
    6: "Calculates sharded gradient memory per GPU gradient_bytes_per_gpu = (2 * parameters) / num_gpus.",
    7: "Calculates sharded optimizer memory per GPU optimizer_bytes_per_gpu = (12 * parameters) / num_gpus.",
    8: "Calculates total_per_gpu by summing weight_bytes, gradient_bytes_per_gpu, and optimizer_bytes_per_gpu.",
    9: "Blank line before returning dictionary payload.",
    10: "Opens return dictionary payload.",
    11: "Sets weight_bytes field in return dictionary.",
    12: "Sets gradient_bytes_per_gpu field in return dictionary.",
    13: "Sets optimizer_bytes_per_gpu field in return dictionary.",
    14: "Sets total_per_gpu field in return dictionary.",
    15: "Closes return dictionary payload and returns result.",
  },
};

export const zero2GradientPartitioningEngine: AlgorithmDefinition<zero2GradientPartitioningEngineInput> =
  {
    id: "zero2-gradient-partitioning-engine",
    title: "DeepSpeed ZeRO-2 Gradient Partitioning Engine",
    topicIds: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Medium",
    description:
      "Calculates per-GPU VRAM memory allocation under DeepSpeed ZeRO-2 (Zero Redundancy Optimizer Stage 2: Gradient Partitioning).\n\n### Mathematical Formulation & Memory Breakdown\nIn deep learning mixed-precision training (FP16/BF16) with parameter count $\\Psi$ across $N$ Data Parallel GPUs:\n- **Model Weights (FP16/BF16)**: $M_{\\text{weights}} = 2\\Psi$ bytes (unsharded, replicated across all GPUs)\n- **Gradients (FP16/BF16)**: $M_{\\text{grads}} = \\frac{2\\Psi}{N}$ bytes (sharded using Reduce-Scatter during backward pass)\n- **Adam Optimizer States (FP32)**: $M_{\\text{opt}} = \\frac{12\\Psi}{N}$ bytes (sharded across $N$ GPUs)\n\nTotal per-GPU memory footprint under ZeRO-2:\n$$M_{\\text{ZeRO-2}} = 2\\Psi + \\frac{2\\Psi}{N} + \\frac{12\\Psi}{N} = 2\\Psi + \\frac{14\\Psi}{N} \\text{ bytes}$$\nPer-GPU memory savings compared to baseline DDP ($16\\Psi$ bytes) is:\n$$\\Delta M = 16\\Psi - \\left(2\\Psi + \\frac{14\\Psi}{N}\\right) = 14\\Psi \\left(1 - \\frac{1}{N}\\right) \\text{ bytes}$$\n\nKey Mechanics:\nDuring the backward pass, as each layer computes its gradients, a Reduce-Scatter operation immediately sums gradients across DP ranks and retains ONLY the $1/N$-th gradient slice corresponding to that GPU's sharded optimizer state. The remaining $(N-1)/N$ gradient buffers are released immediately, preventing full gradient accumulation VRAM spikes.\n\nInput Format:\n- `data`: Array representing parameter count blocks or layer payload magnitudes.\n- `target`: Optional target search marker.\n\nOutput Format:\n- Returns per-GPU memory allocations for weights, gradients, and optimizer states.\n\nEdge Cases & Constraints:\n- Single GPU ($N=1$): No sharding benefit; memory footprint is $16\\Psi$.\n- Gradient Accumulation: Requires retaining local gradient partitions across multiple micro-batches before optimizer steps.",
    constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 GPUs ZeRO-2 Partitioning Engine",
        inputDisplay: "16 data blocks, target = 50",
        outputDisplay: "Total VRAM per GPU calculated",
        input: DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT,
        output: "Per-GPU VRAM breakdown returned",
        explanation: "Evaluates ZeRO-2 memory scaling across 16 DP ranks.",
      },
      {
        kind: "complex",
        title: "10B Model on 64 GPUs",
        inputDisplay: "params = 10,000,000,000, GPUs = 64",
        outputDisplay: "Total VRAM per GPU: 22.18 GB",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "Total VRAM per GPU: 22.18 GB",
        explanation: "Evaluates ZeRO-2 memory scaling across 64 DP ranks.",
      },
      {
        kind: "negative",
        title: "Single GPU Baseline",
        inputDisplay: "params = 100,000,000, GPUs = 1",
        outputDisplay: "Total VRAM per GPU: 1.6 GB",
        input: { data: [50], target: 50 },
        output: "Total VRAM per GPU: 1.6 GB",
        explanation: "With 1 GPU, memory requires full 16 bytes per parameter (2W + 2G + 12O).",
      },
    ],
    code: ZERO2GRADIENTPARTITIONINGENGINE_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) closed-form formula evaluation.",
      space: "O(1) auxiliary space for memory allocation metrics.",
    },
    topicGuide: {
      overview:
        "ZeRO-2 (Zero Redundancy Optimizer Stage 2) shards both optimizer states and gradients across data-parallel GPUs, reducing memory footprint to $M_{\\text{ZeRO-2}} = 2\\Psi + 14\\Psi/N$ without increasing inter-GPU network traffic.",
      sections: [
        {
          heading: "Overview & Problem Context",
          body: "While ZeRO-1 shards the $12\\Psi$ optimizer states, GPUs still hold $2\\Psi$ bytes of FP16 model weights and $2\\Psi$ bytes of FP16 gradients. For massive models, holding $2\\Psi$ gradients on every GPU during backward graph traversal causes severe out-of-memory errors.",
        },
        {
          heading: "Core Concepts & Reduce-Scatter Integration",
          body: "ZeRO-2 eliminates gradient memory redundancy by replacing standard gradient All-Reduce with Reduce-Scatter during the backward pass. As each layer completes its backward kernel, its FP16 gradients are reduced across ranks via Reduce-Scatter. Rank $i$ stores only its assigned $1/N$-th gradient slice and immediately frees the remaining $N-1$ slices.",
        },
        {
          heading: "Systems & Interconnect Bandwidth Efficiency",
          body: "Communication volume under ZeRO-2 is identical to standard DDP ($2\\frac{N-1}{N}\\Psi$ bytes per step). Reduce-Scatter transfers $\\frac{N-1}{N}\\Psi$ bytes during the backward pass, and All-Gather transfers $\\frac{N-1}{N}\\Psi$ bytes during parameter synchronization post-optimizer step. Zero extra communication overhead!",
        },
        {
          heading: "Implementation Nuances & Bucket Overlapping",
          body: "To prevent launch latency bottlenecks, gradients are grouped into contiguous memory buckets (e.g. 50MB buckets). As backward CUDA streams fill a bucket, NCCL launches a Reduce-Scatter kernel in parallel with subsequent layer backward computations.",
        },
      ],
      keyTerms: [
        {
          term: "ZeRO-2",
          definition:
            "Stage 2 of DeepSpeed Zero Redundancy Optimizer that shards both optimizer states and gradients across data-parallel ranks.",
        },
        {
          term: "Reduce-Scatter",
          definition:
            "Collective operation that reduces partial input vectors across ranks and scatters the reduced blocks evenly across nodes.",
        },
        {
          term: "Gradient Memory Spike",
          definition:
            "The peak VRAM allocation occurring during backward pass when un-sharded gradient buffers are accumulated in memory.",
        },
        {
          term: "Gradient Bucketing",
          definition:
            "Grouping layer gradients into contiguous memory blocks to maximize NCCL communication ring throughput.",
        },
      ],
    },
    trivia: ZERO2GRADIENTPARTITIONINGENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT,
    generateSteps: generateZero2GradientPartitioningEngineSteps,
  };
