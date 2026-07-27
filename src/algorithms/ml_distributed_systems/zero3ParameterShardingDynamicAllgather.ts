import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zero3ParameterShardingDynamicAllgatherInput {
  data: number[];
  target?: number;
}

export const ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_CODE = `def estimate_zero3_memory(parameters, num_gpus):
    """
    Calculates per-GPU memory footprint under DeepSpeed ZeRO-3 (Parameter, Gradient, and Optimizer State Partitioning).
    
    Under ZeRO-3, all three model states are fully sharded across N GPUs:
    - Model Weights (FP16): 2 * Psi / N bytes (sharded, fetched JIT via All-Gather per layer)
    - Gradients (FP16): 2 * Psi / N bytes (sharded)
    - Optimizer States (FP32): 12 * Psi / N bytes (sharded)

    Total persistent VRAM memory per GPU = (2*Psi / N) + (2*Psi / N) + (12*Psi / N) = 16*Psi / N bytes.

    Args:
        parameters: Total parameter count (Psi)
        num_gpus: Number of data parallel GPUs (N)

    Returns:
        dict containing persistent per-GPU memory footprint and per-step communication metrics.
    """
    if num_gpus <= 0:
        raise ValueError("Number of GPUs must be at least 1")

    per_gpu_weight_bytes = (2 * parameters) / num_gpus
    per_gpu_grad_bytes = (2 * parameters) / num_gpus
    per_gpu_opt_bytes = (12 * parameters) / num_gpus
    persistent_per_gpu = per_gpu_weight_bytes + per_gpu_grad_bytes + per_gpu_opt_bytes

    return {
        "persistent_per_gpu": persistent_per_gpu,
        "per_gpu_weight_bytes": per_gpu_weight_bytes,
        "per_gpu_grad_bytes": per_gpu_grad_bytes,
        "per_gpu_opt_bytes": per_gpu_opt_bytes
    }
`;

export const DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT: zero3ParameterShardingDynamicAllgatherInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateZero3ParameterShardingDynamicAllgatherSteps = (
  input: zero3ParameterShardingDynamicAllgatherInput,
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
    "Initialize DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine",
    "Setting up full parameter sharding, JIT layer weight fetching buffers, and DP rank communicators.",
    { num_gpus: N, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const shardedWeightSize = (val * 2) / N;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`GPU_${idx}`, `JIT All-Gather (${shardedWeightSize.toFixed(1)}MB)`],
        };
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      22,
      `Layer ${idx}: Dynamic All-Gather Weight Fetch (${val} MB)`,
      `Broadcasting sharded weight partition ${idx} across all ${N} GPUs JIT before forward/backward layer execution.`,
      { idx, layer_bytes: val, sharded_weight_per_gpu: shardedWeightSize, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
  }));

  addStep(
    26,
    "Execution Complete",
    "Successfully simulated dynamic All-Gather layer weight prefetching and release under ZeRO-3.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "persistent_per_gpu = parameters * 16",
    "per_gpu_weight_bytes = parameters * num_gpus",
    "persistent_per_gpu = 2 * parameters",
  ],
  hints: [
    {
      line: 22,
      hint: "ZeRO-3 shards weights (2*Psi/N), grads (2*Psi/N), and optimizer states (12*Psi/N).",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for estimate_zero3_memory.",
    20: "Computes sharded FP16 model weight footprint per GPU (2 * Psi / N).",
    21: "Computes sharded FP16 gradient footprint per GPU (2 * Psi / N).",
    22: "Computes sharded FP32 optimizer state footprint per GPU (12 * Psi / N).",
    23: "Sums all persistent states to get total per-GPU memory: 16 * Psi / N.",
  },
};

export const zero3ParameterShardingDynamicAllgather: AlgorithmDefinition<zero3ParameterShardingDynamicAllgatherInput> =
  {
    id: "zero3-parameter-sharding-dynamic-allgather",
    title: "DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Calculates per-GPU VRAM memory footprint and dynamic inter-GPU communication requirements under DeepSpeed ZeRO-3 (Zero Redundancy Optimizer Stage 3: Parameter Partitioning / PyTorch FSDP).\n\nIn deep learning mixed-precision training (FP16/BF16) with parameter count $\\Psi$ across $N$ Data Parallel GPUs:\n- Model Weights (FP16): $\\frac{2\\Psi}{N}$ bytes (sharded, fetched JIT per layer)\n- Gradients (FP16): $\\frac{2\\Psi}{N}$ bytes (sharded)\n- Adam Optimizer States (FP32): $\\frac{12\\Psi}{N}$ bytes (sharded)\n\nTotal persistent per-GPU memory under ZeRO-3:\n$$M_{\\text{ZeRO-3}} = \\frac{2\\Psi}{N} + \\frac{2\\Psi}{N} + \\frac{12\\Psi}{N} = \\frac{16\\Psi}{N}$$\n\nNotice that memory scales linearly with the number of GPUs $N$! For $N=64$ GPUs, VRAM requirements are reduced by a factor of 64 relative to standard DDP.\n\nDynamic All-Gather Mechanics:\nSince model weights are sharded across all GPUs, each rank does not hold the full model in VRAM. During forward and backward execution of layer $L$:\n1. GPUs issue an All-Gather collective to fetch the unsharded FP16 weights for layer $L$.\n2. Layer $L$ forward/backward computation is executed.\n3. Unsharded weights for layer $L$ are immediately discarded from VRAM.\n\nCommunication Impact:\nZeRO-3 increases total communication volume by $1.5\\times$ relative to standard DDP (3 All-Gathers / Reduce-Scatters per step instead of 2). However, by overlapping All-Gather prefetching with computation, network overhead is hidden.\n\nInput Format:\n- data: Array of parameter counts or layer size metrics across transformer blocks.\n- target: Optional target search value.\n\nOutput Format:\n- Returns persistent per-GPU VRAM memory footprint and per-step communication metrics.",
    constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "1B Parameter Model on 8 GPUs (ZeRO-3)",
        inputDisplay: "params = 1,000,000,000, GPUs = 8",
        outputDisplay: "Persistent VRAM per GPU = 2.0 GB (vs 16.0 GB baseline DDP)",
        input: { data: [10, 20, 30, 40], target: 30 },
        output: "Persistent VRAM per GPU: 2.0 GB",
        explanation: "16GB total model states divided by 8 GPUs = 2.0GB persistent VRAM per GPU.",
      },
      {
        kind: "complex",
        title: "100B Parameter Model on 128 GPUs",
        inputDisplay: "params = 100,000,000,000, GPUs = 128",
        outputDisplay: "Persistent VRAM per GPU = 12.5 GB",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "Persistent VRAM per GPU: 12.5 GB",
        explanation: "1600GB total model states divided by 128 GPUs = 12.5GB per GPU.",
      },
      {
        kind: "negative",
        title: "Single GPU Standalone",
        inputDisplay: "params = 100,000,000, GPUs = 1",
        outputDisplay: "Persistent VRAM per GPU = 1.6 GB",
        input: { data: [50], target: 50 },
        output: "Persistent VRAM per GPU: 1.6 GB",
        explanation: "Single GPU holds full 16 bytes/param model states.",
      },
    ],
    code: ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) closed-form algebraic formula evaluation.",
      space: "O(1) scalar memory for persistent VRAM tracking.",
    },
    topicGuide: {
      overview:
        "ZeRO-3 (Zero Redundancy Optimizer Stage 3) complete parameter sharding enables training multi-hundred-billion parameter neural networks by eliminating memory redundancy entirely across data-parallel clusters.",
      sections: [
        {
          heading: "Overview & Linear Memory Scaling",
          body: "ZeRO-3 partitions parameters, gradients, and optimizer states across all data-parallel GPUs. Total per-GPU persistent memory drops from $16\\Psi$ to $\\frac{16\\Psi}{N}$. This linear memory scaling makes it possible to train 100B+ LLMs without needing intra-layer tensor parallelism across nodes.",
        },
        {
          heading: "Core Concepts & Just-In-Time (JIT) Weight Fetching",
          body: "Because weights are sharded, GPU $r$ holds only $W/N$. Before executing layer $L$ in forward pass, an All-Gather collects weights from all $N$ ranks into a temporary layer buffer. Once layer $L$ computation completes, the temporary buffer is immediately freed. The same All-Gather process repeats in backward pass.",
        },
        {
          heading: "Systems & Interconnect Bandwidth Tradeoffs",
          body: "ZeRO-3 increases per-step communication from $2\\frac{N-1}{N}\\Psi$ bytes to $3\\frac{N-1}{N}\\Psi$ bytes (1 All-Gather in forward, 1 All-Gather in backward, 1 Reduce-Scatter for gradients). To prevent GPU stall, frameworks implement CUDA Stream Prefetching: while layer $L$ computes on stream 0, layer $L+1$ weights are All-Gathered in background stream 1 across NVLink/InfiniBand.",
        },
        {
          heading: "Implementation Nuances & FSDP Equivalence",
          body: "PyTorch Fully Sharded Data Parallel (FSDP) is PyTorch's native implementation of DeepSpeed ZeRO-3. FSDP wraps sub-modules into `FullyShardedDataParallel` units and supports activation checkpointing and CPU offloading to further optimize VRAM memory pressure.",
        },
      ],
      keyTerms: [
        {
          term: "ZeRO-3",
          definition:
            "Stage 3 of DeepSpeed Zero Redundancy Optimizer that shards model weights, gradients, and optimizer states across all DP ranks.",
        },
        {
          term: "Just-In-Time (JIT) All-Gather",
          definition:
            "On-demand collective communication that fetches layer weights right before computation and discards them immediately afterward.",
        },
        {
          term: "Fully Sharded Data Parallel (FSDP)",
          definition:
            "PyTorch's native implementation of ZeRO-3 parameter sharding for large model training.",
        },
        {
          term: "CUDA Stream Prefetching",
          definition:
            "Overlapping compute of current layer with background All-Gather transfer of next layer weights using separate CUDA streams.",
        },
      ],
    },
    trivia: ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT,
    generateSteps: generateZero3ParameterShardingDynamicAllgatherSteps,
  };
