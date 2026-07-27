import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zero2GradientPartitioningEngineInput {
  data: number[];
  target?: number;
}

export const ZERO2GRADIENTPARTITIONINGENGINE_CODE = `def estimate_zero2_memory(parameters, num_gpus):
    """
    Calculates per-GPU VRAM footprint under DeepSpeed ZeRO-2 (Optimizer State + Gradient Partitioning).
    
    For Adam mixed-precision training with parameter count Psi and N GPUs:
    - Model Weights (FP16): 2 * Psi bytes (unsharded)
    - Gradients (FP16): 2 * Psi / N bytes (sharded via Reduce-Scatter)
    - Optimizer States (FP32): 12 * Psi / N bytes (sharded)

    Total per-GPU memory = 2*Psi + (2*Psi / N) + (12*Psi / N) = 2*Psi + (14*Psi / N).

    Args:
        parameters: Total parameter count (Psi)
        num_gpus: Number of data parallel GPUs (N)

    Returns:
        dict of per-GPU memory allocations for weights, gradients, and optimizer states.
    """
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
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateZero2GradientPartitioningEngineSteps = (
  input: zero2GradientPartitioningEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
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
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  const N = input.data.length;
  addStep(
    1,
    "Initialize DeepSpeed ZeRO-2 Gradient Partitioning Engine",
    "Setting up data parallel ranks, Reduce-Scatter gradient buckets, and ZeRO-2 memory formulas.",
    { num_gpus: N, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const shardedGradSize = (val * 2) / N;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`GPU_${idx}`, `Grad: ${shardedGradSize.toFixed(1)}MB`],
        };
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      24,
      `Partition gradients on GPU ${idx}: payload = ${val} MB`,
      `Executing Reduce-Scatter for bucket ${idx}, retaining only 1/${N}-th of FP16 gradient tensor on GPU ${idx}.`,
      { idx, val, sharded_grad_bytes: shardedGradSize, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
  }));

  addStep(
    28,
    "Execution Complete",
    "Successfully partitioned gradients and optimizer states across all DP ranks under ZeRO-2.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ZERO2GRADIENTPARTITIONINGENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "total_per_gpu = weight_bytes * num_gpus",
    "gradient_bytes_per_gpu = weight_bytes * 2",
    "optimizer_bytes_per_gpu = weight_bytes / 12",
  ],
  hints: [
    { line: 24, hint: "ZeRO-2 shards both optimizer states (12*Psi/N) and gradients (2*Psi/N)." },
  ],
  lineExplanations: {
    1: "Defines entry point for estimate_zero2_memory.",
    21: "Computes unsharded FP16 model weight memory footprint (2 * Psi).",
    22: "Computes sharded FP16 gradient memory footprint per GPU (2 * Psi / N).",
    23: "Computes sharded FP32 optimizer state memory footprint per GPU (12 * Psi / N).",
  },
};

export const zero2GradientPartitioningEngine: AlgorithmDefinition<zero2GradientPartitioningEngineInput> =
  {
    id: "zero2-gradient-partitioning-engine",
    title: "DeepSpeed ZeRO-2 Gradient Partitioning Engine",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Calculates per-GPU VRAM memory allocation under DeepSpeed ZeRO-2 (Zero Redundancy Optimizer Stage 2: Gradient Partitioning).\n\nIn deep learning mixed-precision training (FP16/BF16) with parameter count $\\Psi$ across $N$ Data Parallel GPUs:\n- Model Weights (FP16): $2\\Psi$ bytes (unsharded, replicated across all GPUs)\n- Gradients (FP16): $\\frac{2\\Psi}{N}$ bytes (sharded using Reduce-Scatter during backward pass)\n- Adam Optimizer States (FP32): $\\frac{12\\Psi}{N}$ bytes (sharded across $N$ GPUs)\n\nTotal per-GPU memory footprint under ZeRO-2:\n$$M_{\\text{ZeRO-2}} = 2\\Psi + \\frac{2\\Psi}{N} + \\frac{12\\Psi}{N} = 2\\Psi + \\frac{14\\Psi}{N}$$\n\nKey Mechanics:\nDuring the backward pass, as each layer computes its gradients, a Reduce-Scatter operation immediately sums gradients across DP ranks and retains ONLY the $1/N$-th gradient slice corresponding to that GPU's sharded optimizer state. The remaining $(N-1)/N$ gradient buffers are released immediately, preventing full gradient accumulation VRAM spikes.\n\nInput Format:\n- data: Array representing parameter count blocks or layer payload magnitudes.\n- target: Optional target search marker.\n\nOutput Format:\n- Returns per-GPU memory allocations for weights, gradients, and optimizer states.\n\nEdge Cases & Constraints:\n- Single GPU ($N=1$): No sharding benefit; memory footprint is $16\\Psi$.\n- Gradient Accumulation: Requires retaining local gradient partitions across multiple micro-batches before optimizer steps.",
    constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "1B Parameter Model on 8 GPUs (ZeRO-2)",
        inputDisplay: "params = 1,000,000,000, GPUs = 8",
        outputDisplay: "Weights: 2GB, Gradients: 0.25GB, Optimizer: 1.5GB (Total: 3.75GB)",
        input: { data: [10, 20, 30, 40], target: 30 },
        output: "Total VRAM per GPU: 3.75 GB",
        explanation:
          "ZeRO-2 reduces 1B model memory from 16GB (DDP baseline) down to 3.75GB per GPU.",
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
        "ZeRO-2 (Zero Redundancy Optimizer Stage 2) shards both optimizer states and gradients across data-parallel GPUs, reducing memory footprint to $2\\Psi + 14\\Psi/N$ without increasing inter-GPU network traffic.",
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
          body: "Communication volume under ZeRO-2 is strictly identical to standard DDP ($2\\frac{N-1}{N}\\Psi$ bytes per step). Reduce-Scatter transfers $\\frac{N-1}{N}\\Psi$ bytes during the backward pass, and All-Gather transfers $\\frac{N-1}{N}\\Psi$ bytes during parameter synchronization post-optimizer step. Zero extra communication overhead!",
        },
        {
          heading: "Implementation Nuances & Bucket Overlapping",
          body: "To prevent launch latency bottlenecks, gradients are grouped into contiguous contiguous memory buckets (e.g. 50MB buckets). As backward CUDA streams fill a bucket, NCCL launches a Reduce-Scatter kernel in parallel with subsequent layer backward computations.",
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
