import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zero3ParameterShardingDynamicAllgatherInput {
  data: number[];
  target?: number;
}

export const ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_CODE = `def estimate_zero3_memory(parameters, num_gpus):
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
    data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
    target: 50,
  };

export const generateZero3ParameterShardingDynamicAllgatherSteps = (
  input: zero3ParameterShardingDynamicAllgatherInput,
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
    "Initialize DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine",
    `Configuring full ZeRO-3 memory breakdown for ${params.toLocaleString()} parameters across ${N} GPUs.`,
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

  const perGpuWeightBytes = (2 * params) / N;
  addStep(
    5,
    `Compute Sharded FP16 Model Weight Memory per_gpu_weight_bytes = ${(perGpuWeightBytes / 1e9).toFixed(2)} GB`,
    `Full parameter sharding: (2 * ${params.toLocaleString()}) / ${N} = ${(perGpuWeightBytes / 1e9).toFixed(2)} GB persistent VRAM per GPU.`,
    { parameters: params, num_gpus: N, per_gpu_weight_bytes: perGpuWeightBytes },
    [...elements],
  );

  const perGpuGradBytes = (2 * params) / N;
  addStep(
    6,
    `Compute Sharded FP16 Gradient Memory per_gpu_grad_bytes = ${(perGpuGradBytes / 1e9).toFixed(2)} GB`,
    `Reduce-Scatter gradient sharding: (2 * ${params.toLocaleString()}) / ${N} = ${(perGpuGradBytes / 1e9).toFixed(2)} GB per GPU.`,
    { parameters: params, num_gpus: N, per_gpu_grad_bytes: perGpuGradBytes },
    [...elements],
  );

  const perGpuOptBytes = (12 * params) / N;
  addStep(
    7,
    `Compute Sharded FP32 Optimizer State Memory per_gpu_opt_bytes = ${(perGpuOptBytes / 1e9).toFixed(2)} GB`,
    `Adam optimizer state sharding: (12 * ${params.toLocaleString()}) / ${N} = ${(perGpuOptBytes / 1e9).toFixed(2)} GB per GPU.`,
    { parameters: params, num_gpus: N, per_gpu_opt_bytes: perGpuOptBytes },
    [...elements],
  );

  const persistentPerGpu = perGpuWeightBytes + perGpuGradBytes + perGpuOptBytes;
  addStep(
    8,
    `Compute Total Persistent Per-GPU Memory persistent_per_gpu = ${(persistentPerGpu / 1e9).toFixed(2)} GB`,
    `Total persistent VRAM: weight (${(perGpuWeightBytes / 1e9).toFixed(2)}GB) + grad (${(perGpuGradBytes / 1e9).toFixed(2)}GB) + opt (${(perGpuOptBytes / 1e9).toFixed(2)}GB) = ${(persistentPerGpu / 1e9).toFixed(2)} GB per GPU.`,
    {
      per_gpu_weight_bytes: perGpuWeightBytes,
      per_gpu_grad_bytes: perGpuGradBytes,
      per_gpu_opt_bytes: perGpuOptBytes,
      persistent_per_gpu: persistentPerGpu,
    },
    [...elements],
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`GPU_${idx}`, `JIT All-Gather (${((val * 2) / N).toFixed(1)}MB)`],
        };
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      5,
      `Layer ${idx}: Dynamic All-Gather Weight Fetch (${val} MB payload)`,
      `Broadcasting sharded weight partition ${idx} across all ${N} GPUs JIT before forward/backward layer execution.`,
      { idx, layer_bytes: val, persistent_per_gpu: persistentPerGpu, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    pointers: ["ZeRO-3 Fully Sharded"],
  }));

  addStep(
    10,
    "Construct Return Memory & Communication Payload",
    "Assembling ZeRO-3 persistent memory breakdown dictionary.",
    { persistent_per_gpu: persistentPerGpu },
    finalElements,
  );

  addStep(
    11,
    `Set persistent_per_gpu = ${(persistentPerGpu / 1e9).toFixed(2)} GB`,
    "Assigning total persistent per-GPU VRAM requirement (16 * Psi / N).",
    { persistent_per_gpu: persistentPerGpu },
    finalElements,
  );

  addStep(
    12,
    `Set per_gpu_weight_bytes = ${(perGpuWeightBytes / 1e9).toFixed(2)} GB`,
    "Assigning sharded FP16 weight memory requirement (2 * Psi / N).",
    { per_gpu_weight_bytes: perGpuWeightBytes },
    finalElements,
  );

  addStep(
    13,
    `Set per_gpu_grad_bytes = ${(perGpuGradBytes / 1e9).toFixed(2)} GB`,
    "Assigning sharded FP16 gradient memory requirement (2 * Psi / N).",
    { per_gpu_grad_bytes: perGpuGradBytes },
    finalElements,
  );

  addStep(
    14,
    `Set per_gpu_opt_bytes = ${(perGpuOptBytes / 1e9).toFixed(2)} GB`,
    "Assigning sharded FP32 optimizer state memory requirement (12 * Psi / N).",
    { per_gpu_opt_bytes: perGpuOptBytes },
    finalElements,
  );

  addStep(
    15,
    "Return DeepSpeed ZeRO-3 Memory Allocation Analysis",
    `Completed ZeRO-3 memory estimation across ${N} GPUs. Total persistent per-GPU VRAM footprint = ${(persistentPerGpu / 1e9).toFixed(2)} GB.`,
    {
      completed: true,
      persistent_per_gpu: persistentPerGpu,
      per_gpu_weight_bytes: perGpuWeightBytes,
      per_gpu_grad_bytes: perGpuGradBytes,
      per_gpu_opt_bytes: perGpuOptBytes,
    },
    finalElements,
  );

  return steps;
};

const ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_TRIVIA: TriviaMeta = {
  skipLines: [4, 9],
  distractors: [
    "persistent_per_gpu = parameters * 16",
    "per_gpu_weight_bytes = parameters * num_gpus",
    "persistent_per_gpu = 2 * parameters",
    "per_gpu_opt_bytes = (12 * parameters) * num_gpus",
  ],
  hints: [
    {
      line: 5,
      hint: "FP16 weights are sharded under ZeRO-3: per_gpu_weight_bytes = (2 * parameters) / num_gpus.",
    },
    { line: 6, hint: "Gradients are sharded: per_gpu_grad_bytes = (2 * parameters) / num_gpus." },
    {
      line: 7,
      hint: "Optimizer states are sharded: per_gpu_opt_bytes = (12 * parameters) / num_gpus.",
    },
    {
      line: 8,
      hint: "Total persistent per-GPU memory = per_gpu_weight_bytes + per_gpu_grad_bytes + per_gpu_opt_bytes = 16 * Psi / N.",
    },
  ],
  lineExplanations: {
    1: "Function signature for estimate_zero3_memory taking parameters and num_gpus.",
    2: "Checks guard condition if num_gpus is less than or equal to 0.",
    3: "Raises ValueError if GPU count is invalid.",
    4: "Blank line before memory calculations.",
    5: "Calculates sharded FP16 weight memory per GPU per_gpu_weight_bytes = (2 * parameters) / num_gpus.",
    6: "Calculates sharded FP16 gradient memory per GPU per_gpu_grad_bytes = (2 * parameters) / num_gpus.",
    7: "Calculates sharded FP32 optimizer state memory per GPU per_gpu_opt_bytes = (12 * parameters) / num_gpus.",
    8: "Calculates persistent_per_gpu by summing per-GPU weight, gradient, and optimizer bytes.",
    9: "Blank line before returning dictionary payload.",
    10: "Opens return dictionary payload.",
    11: "Sets persistent_per_gpu field in return dictionary.",
    12: "Sets per_gpu_weight_bytes field in return dictionary.",
    13: "Sets per_gpu_grad_bytes field in return dictionary.",
    14: "Sets per_gpu_opt_bytes field in return dictionary.",
    15: "Closes return dictionary payload and returns result.",
  },
};

export const zero3ParameterShardingDynamicAllgather: AlgorithmDefinition<zero3ParameterShardingDynamicAllgatherInput> =
  {
    id: "zero3-parameter-sharding-dynamic-allgather",
    title: "DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine",
    topicIds: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Hard",
    description:
      "Calculates per-GPU VRAM memory footprint and dynamic inter-GPU communication requirements under DeepSpeed ZeRO-3 (Zero Redundancy Optimizer Stage 3: Parameter Partitioning / PyTorch FSDP).\n\n### Mathematical Formulation & Linear Memory Scaling\nIn deep learning mixed-precision training (FP16/BF16) with parameter count $\\Psi$ across $N$ Data Parallel GPUs:\n- **Model Weights (FP16/BF16)**: $M_{\\text{weights}} = \\frac{2\\Psi}{N}$ bytes (sharded, fetched JIT per layer)\n- **Gradients (FP16/BF16)**: $M_{\\text{grads}} = \\frac{2\\Psi}{N}$ bytes (sharded)\n- **Adam Optimizer States (FP32)**: $M_{\\text{opt}} = \\frac{12\\Psi}{N}$ bytes (sharded)\n\nTotal persistent per-GPU memory footprint under ZeRO-3:\n$$M_{\\text{ZeRO-3}} = \\frac{2\\Psi}{N} + \\frac{2\\Psi}{N} + \\frac{12\\Psi}{N} = \\frac{16\\Psi}{N} \\text{ bytes}$$\n\nNotice that memory scales linearly with the number of GPUs $N$! For $N=64$ GPUs, VRAM requirements are reduced by a factor of 64 relative to standard DDP ($16\\Psi$ bytes).\n\n### Dynamic All-Gather Mechanics\nSince model weights are sharded across all GPUs, each rank does not hold the full model in VRAM. During forward and backward execution of layer $L$:\n1. GPUs issue an All-Gather collective to fetch the unsharded FP16 weights for layer $L$.\n2. Layer $L$ forward/backward computation is executed.\n3. Unsharded weights for layer $L$ are immediately discarded from VRAM.\n\nCommunication Impact:\nZeRO-3 increases total communication volume by $1.5\\times$ relative to standard DDP ($3\\frac{N-1}{N}\\Psi$ bytes per step instead of $2\\frac{N-1}{N}\\Psi$). However, by overlapping All-Gather prefetching with computation, network overhead is hidden.\n\nInput Format:\n- `data`: Array of parameter counts or layer size metrics across transformer blocks.\n- `target`: Optional target search value.\n\nOutput Format:\n- Returns persistent per-GPU VRAM memory footprint and per-step communication metrics.",
    constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 GPUs ZeRO-3 Fully Sharded Engine",
        inputDisplay: "16 data blocks, target = 50",
        outputDisplay: "Persistent VRAM per GPU calculated",
        input: DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT,
        output: "Persistent VRAM per GPU returned",
        explanation: "Evaluates ZeRO-3 memory scaling across 16 DP ranks.",
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
