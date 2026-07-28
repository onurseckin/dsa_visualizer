import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zero1OptimizerStateMemoryEstimatorInput {
  parameters: number;
  gpus: number;
}

export const ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_CODE = `def estimate_zero1_memory(parameters, num_gpus, precision_bytes=2):
    if num_gpus <= 0:
        raise ValueError("Number of GPUs must be at least 1")

    bytes_per_optimizer_param = 12
    total_optimizer_bytes = parameters * bytes_per_optimizer_param
    per_gpu_optimizer_bytes = total_optimizer_bytes / num_gpus

    return {
        "total_optimizer_bytes": total_optimizer_bytes,
        "per_gpu_optimizer_bytes": per_gpu_optimizer_bytes,
        "memory_saved_per_gpu": total_optimizer_bytes - per_gpu_optimizer_bytes
    }
`;

export const DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT: zero1OptimizerStateMemoryEstimatorInput =
  {
    parameters: 1_000_000_000,
    gpus: 8,
  };

export const generateZero1OptimizerStateMemoryEstimatorSteps = (
  input: zero1OptimizerStateMemoryEstimatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const gpus = input.gpus;
  const params = input.parameters;

  const elements: ArrayElement[] = Array.from({ length: Math.min(gpus, 8) }).map((_, idx) => ({
    id: `gpu-${idx}`,
    value: `GPU ${idx}`,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: customElements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          parameters: params.toLocaleString(),
          gpus: String(gpus),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize DeepSpeed ZeRO-1 Memory Estimator",
    `Configuring estimator for model with ${params.toLocaleString()} parameters across ${gpus} GPUs.`,
    { parameters: params, num_gpus: gpus, precision_bytes: 2 },
    [...elements],
  );

  addStep(
    2,
    "Check Number of GPUs Guard (num_gpus <= 0)",
    `Validating GPU count: ${gpus} >= 1. Guard check passed.`,
    { num_gpus: gpus, valid: true },
    [...elements],
  );

  const bytesPerParam = 12;
  addStep(
    5,
    "Define Bytes per Optimizer Parameter (12 Bytes)",
    "Adam mixed precision requires 4 bytes FP32 master weight + 4 bytes momentum + 4 bytes variance = 12 bytes per parameter.",
    { bytes_per_optimizer_param: bytesPerParam, fp32_master: 4, momentum: 4, variance: 4 },
    [...elements],
  );

  const totalOptimizerBytes = params * bytesPerParam;
  addStep(
    6,
    `Calculate Total Un-sharded Optimizer Memory (${(totalOptimizerBytes / 1e9).toFixed(2)} GB)`,
    `Total baseline un-sharded Adam optimizer memory: ${params.toLocaleString()} parameters * 12 bytes = ${(totalOptimizerBytes / 1e9).toFixed(2)} GB.`,
    {
      parameters: params,
      bytes_per_param: bytesPerParam,
      total_optimizer_bytes: totalOptimizerBytes,
    },
    [...elements],
  );

  const perGpuOptimizerBytes = totalOptimizerBytes / gpus;
  const memorySavedPerGpu = totalOptimizerBytes - perGpuOptimizerBytes;

  addStep(
    7,
    `Partition Optimizer Memory Across ${gpus} GPUs (${(perGpuOptimizerBytes / 1e9).toFixed(2)} GB / GPU)`,
    `ZeRO-1 shards total ${totalOptimizerBytes.toLocaleString()} bytes into ${gpus} equal partitions: ${(perGpuOptimizerBytes / 1e9).toFixed(2)} GB per GPU.`,
    {
      num_gpus: gpus,
      total_optimizer_bytes: totalOptimizerBytes,
      per_gpu_optimizer_bytes: perGpuOptimizerBytes,
    },
    [...elements],
  );

  // Detail step-by-step per GPU rank
  const displayGpuCount = Math.min(gpus, 8);
  for (let rank = 0; rank < displayGpuCount; rank++) {
    const startParam = Math.floor((rank * params) / gpus);
    const endParam = Math.floor(((rank + 1) * params) / gpus);
    const rankBytes = (endParam - startParam) * bytesPerParam;

    const rankElements = elements.map((el, idx) => {
      if (idx === rank) {
        return {
          ...el,
          state: "active" as const,
          value: `${(rankBytes / 1e9).toFixed(2)} GB`,
          pointers: [`Rank_${rank}`, `Params ${rank * (100 / gpus)}%`],
        };
      }
      if (idx < rank) {
        return {
          ...el,
          state: "sorted" as const,
          value: `${(perGpuOptimizerBytes / 1e9).toFixed(2)} GB`,
        };
      }
      return el;
    });

    addStep(
      7,
      `Allocate ZeRO-1 Partition for GPU Rank ${rank}`,
      `Rank ${rank} stores master weights/momentum/variance for parameters [${startParam.toLocaleString()} .. ${endParam.toLocaleString()}]. Sharded VRAM footprint = ${(rankBytes / 1e9).toFixed(2)} GB.`,
      { rank, start_param: startParam, end_param: endParam, rank_bytes: rankBytes },
      rankElements,
    );

    addStep(
      7,
      `Compute VRAM Savings for GPU Rank ${rank}`,
      `Rank ${rank} saves ${(memorySavedPerGpu / 1e9).toFixed(2)} GB VRAM compared to un-sharded DDP replication.`,
      { rank, saved_bytes: memorySavedPerGpu },
      rankElements,
    );
  }

  const finalElements = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    value: `${(perGpuOptimizerBytes / 1e9).toFixed(2)} GB`,
    pointers: ["ZeRO-1 Sharded"],
  }));

  addStep(
    9,
    "Construct Return Memory Footprint Payload",
    `Assembling memory metrics dictionary: total_optimizer_bytes, per_gpu_optimizer_bytes, and memory_saved_per_gpu.`,
    {
      total_optimizer_bytes: totalOptimizerBytes,
      per_gpu_optimizer_bytes: perGpuOptimizerBytes,
      memory_saved_per_gpu: memorySavedPerGpu,
    },
    finalElements,
  );

  addStep(
    10,
    `Set total_optimizer_bytes = ${(totalOptimizerBytes / 1e9).toFixed(2)} GB`,
    "Assigning un-sharded baseline optimizer state memory.",
    { total_optimizer_bytes: totalOptimizerBytes },
    finalElements,
  );

  addStep(
    11,
    `Set per_gpu_optimizer_bytes = ${(perGpuOptimizerBytes / 1e9).toFixed(2)} GB`,
    "Assigning ZeRO-1 sharded per-GPU VRAM requirement.",
    { per_gpu_optimizer_bytes: perGpuOptimizerBytes },
    finalElements,
  );

  addStep(
    12,
    `Set memory_saved_per_gpu = ${(memorySavedPerGpu / 1e9).toFixed(2)} GB`,
    "Assigning calculated per-GPU VRAM memory savings.",
    { memory_saved_per_gpu: memorySavedPerGpu },
    finalElements,
  );

  addStep(
    13,
    "Return DeepSpeed ZeRO-1 Memory Footprint Analysis",
    `Completed ZeRO-1 memory estimation. Reduced per-GPU optimizer VRAM from ${(totalOptimizerBytes / 1e9).toFixed(2)} GB down to ${(perGpuOptimizerBytes / 1e9).toFixed(2)} GB (${(memorySavedPerGpu / 1e9).toFixed(2)} GB saved per GPU).`,
    {
      completed: true,
      total_optimizer_bytes: totalOptimizerBytes,
      per_gpu_optimizer_bytes: perGpuOptimizerBytes,
      memory_saved_per_gpu: memorySavedPerGpu,
    },
    finalElements,
  );

  return steps;
};

const ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_TRIVIA: TriviaMeta = {
  skipLines: [4, 8],
  distractors: [
    "bytes_per_optimizer_param = 16",
    "per_gpu_optimizer_bytes = total_optimizer_bytes * num_gpus",
    "total_optimizer_bytes = parameters * 4",
    "memory_saved_per_gpu = total_optimizer_bytes / num_gpus",
  ],
  hints: [
    {
      line: 5,
      hint: "FP32 Master Weights (4) + Momentum (4) + Variance (4) = 12 bytes per param.",
    },
    { line: 6, hint: "Total un-sharded optimizer bytes = parameters * bytes_per_optimizer_param." },
    {
      line: 7,
      hint: "Divide total optimizer bytes by num_gpus to compute per-GPU sharded footprint.",
    },
    { line: 9, hint: "Return dictionary payload with total, per-GPU, and saved memory metrics." },
  ],
  lineExplanations: {
    1: "Function signature for estimate_zero1_memory taking parameters, num_gpus, and precision_bytes.",
    2: "Checks guard condition if num_gpus is less than or equal to 0.",
    3: "Raises ValueError if GPU count is invalid.",
    4: "Blank line before memory calculations.",
    5: "Sets bytes_per_optimizer_param to 12 (4 bytes FP32 master weight + 4 momentum + 4 variance).",
    6: "Calculates total_optimizer_bytes by multiplying parameters by 12.",
    7: "Computes per_gpu_optimizer_bytes by dividing total_optimizer_bytes by num_gpus.",
    8: "Blank line before returning output payload.",
    9: "Opens return dictionary payload.",
    10: "Sets total_optimizer_bytes field in return dictionary.",
    11: "Sets per_gpu_optimizer_bytes field in return dictionary.",
    12: "Calculates memory_saved_per_gpu by subtracting per-GPU bytes from total bytes.",
    13: "Closes return dictionary payload and returns result.",
  },
};

export const zero1OptimizerStateMemoryEstimator: AlgorithmDefinition<zero1OptimizerStateMemoryEstimatorInput> =
  {
    id: "zero1-optimizer-state-memory-estimator",
    title: "DeepSpeed ZeRO-1 Optimizer Sharding",
    topicIds: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Medium",
    description:
      "Calculates the per-GPU VRAM memory footprint for the Adam optimizer under DeepSpeed ZeRO-1 (Zero Redundancy Optimizer Stage 1: Optimizer State Partitioning).\n\n### Mathematical Formulation & Memory Sharding\nIn mixed-precision training (FP16/BF16) with model parameter count $\\Psi$:\n- **Model Weights (FP16/BF16)**: $M_{\\text{weights}} = 2\\Psi$ bytes (unsharded on each GPU)\n- **Gradients (FP16/BF16)**: $M_{\\text{grads}} = 2\\Psi$ bytes (unsharded on each GPU)\n- **Adam Optimizer States (FP32)**: $M_{\\text{opt}} = 12\\Psi$ bytes, comprising:\n  $$\\text{FP32 Master Weights: } 4\\Psi, \\quad \\text{Momentum (1st moment): } 4\\Psi, \\quad \\text{Variance (2nd moment): } 4\\Psi$$\n\nIn standard PyTorch Data Parallelism (DDP), every GPU replicates all $16\\Psi$ bytes. Under ZeRO-1, the $12\\Psi$ optimizer states are sharded equally across $N$ GPUs, so each GPU stores only $\\frac{12\\Psi}{N}$ bytes of optimizer memory.\n\nTotal per-GPU memory footprint under ZeRO-1 is:\n$$M_{\\text{ZeRO-1}} = 4\\Psi + \\frac{12\\Psi}{N} \\text{ bytes}$$\nPer-GPU memory savings compared to baseline DDP is:\n$$\\Delta M = 12\\Psi - \\frac{12\\Psi}{N} = 12\\Psi \\left(1 - \\frac{1}{N}\\right) \\text{ bytes}$$\n\nFor a 1B parameter model ($\\Psi = 10^9$) on $N = 8$ GPUs:\n- Baseline Un-sharded Optimizer Memory = $12 \\text{ GB}$\n- ZeRO-1 Sharded Memory per GPU = $\\frac{12 \\text{ GB}}{8} = 1.5 \\text{ GB}$\n- Per-GPU Memory Savings = $12 - 1.5 = 10.5 \\text{ GB}$\n\nInput Format:\n- `parameters`: Total parameter count $\\Psi$ of the model.\n- `gpus`: Total number of GPUs $N$ in the Data Parallel world size.\n\nOutput Format:\n- Returns detailed dictionary with total un-sharded memory, sharded per-GPU memory footprint, and VRAM savings.\n\nEdge Cases & Constraints:\n- Single GPU ($N=1$): Zero sharding benefit; per-GPU optimizer memory remains $12\\Psi$.\n- Extremely Large Models ($\\Psi > 100B$): ZeRO-1 alone may not prevent OOM, requiring ZeRO-2 or ZeRO-3.",
    constraints: ["1 <= parameters <= 10^12", "1 <= gpus <= 1000"],
    examples: [
      {
        kind: "basic",
        title: "1B Parameter Model on 8 GPUs",
        inputDisplay: "params = 1,000,000,000, GPUs = 8",
        outputDisplay: "Per GPU Optimizer Memory = 1.5 GB",
        input: { parameters: 1000000000, gpus: 8 },
        output: "1.5 GB per GPU",
        explanation: "Total optimizer memory is 12GB. Divided by 8 GPUs, each stores 1.5GB.",
      },
      {
        kind: "complex",
        title: "70B Model on 64 GPUs",
        inputDisplay: "params = 70,000,000,000, GPUs = 64",
        outputDisplay: "Per GPU Optimizer Memory = 13.125 GB",
        input: { parameters: 70000000000, gpus: 64 },
        output: "13.125 GB per GPU",
        explanation: "70B * 12 = 840GB total. 840GB / 64 = 13.125GB per GPU.",
      },
      {
        kind: "negative",
        title: "Single GPU (No Sharding Benefit)",
        inputDisplay: "params = 100,000,000, GPUs = 1",
        outputDisplay: "Per GPU Optimizer Memory = 1.2 GB",
        input: { parameters: 100000000, gpus: 1 },
        output: "1.2 GB per GPU",
        explanation: "With 1 GPU, it must hold the entire 12 bytes/param optimizer state.",
      },
    ],
    code: ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) algebraic formula evaluation.",
      space: "O(1) auxiliary memory for output footprint metrics.",
    },
    topicGuide: {
      overview:
        "ZeRO-1 (Zero Redundancy Optimizer Stage 1) reduces GPU memory footprint by partitioning the Adam optimizer states across data-parallel GPUs without adding communication overhead.",
      sections: [
        {
          heading: "Overview & The VRAM Memory Wall",
          body: "When training billion-parameter neural networks, the optimizer state—not the model weights—dominates VRAM memory. In FP16 mixed-precision training with Adam, weights take $2\\Psi$ bytes and gradients take $2\\Psi$ bytes, but the optimizer requires $12\\Psi$ bytes ($4\\Psi$ FP32 master weights, $4\\Psi$ momentum, $4\\Psi$ variance).",
        },
        {
          heading: "Core Concepts & ZeRO-1 Partitioning",
          body: "Instead of duplicating the $12\\Psi$ bytes of optimizer state across all $N$ ranks as in standard PyTorch DDP, ZeRO-1 partitions optimizer states so that rank $i$ stores and updates only $1/N$-th of the parameters' optimizer states: $\\frac{12\\Psi}{N}$. After each optimizer step, an All-Gather operation broadcasts the updated FP16 parameters to all ranks.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "ZeRO-1 incurs ZERO additional network communication overhead relative to standard DDP! Standard DDP executes an All-Reduce on gradients, which costs $2\\frac{N-1}{N}\\Psi$ bytes. ZeRO-1 replaces All-Reduce with a Reduce-Scatter on gradients ($1\\frac{N-1}{N}\\Psi$ bytes) followed by an All-Gather on updated parameters ($1\\frac{N-1}{N}\\Psi$ bytes), keeping total communication at exactly $2\\frac{N-1}{N}\\Psi$ bytes per step.",
        },
        {
          heading: "Implementation Nuances & CPU Offloading",
          body: "Frameworks like DeepSpeed and PyTorch FSDP extend ZeRO-1 with CPU Offloading (ZeRO-Offload), swapping the $\\frac{12\\Psi}{N}$ sharded optimizer states into CPU DRAM via PCIe host-to-device transfers, enabling training of massive models on single-node GPU workstations.",
        },
      ],
      keyTerms: [
        {
          term: "ZeRO-1",
          definition:
            "Stage 1 of DeepSpeed Zero Redundancy Optimizer that shards Adam optimizer states across data-parallel GPUs.",
        },
        {
          term: "Master Weights",
          definition:
            "FP32 copy of model parameters maintained by the optimizer to prevent small weight updates from underflowing in FP16.",
        },
        {
          term: "Adam Optimizer Footprint",
          definition:
            "The 12 bytes per parameter required to store FP32 master weights ($4\\Psi$), momentum ($4\\Psi$), and variance ($4\\Psi$).",
        },
        {
          term: "ZeRO-Offload",
          definition:
            "Technique of offloading sharded optimizer state computation and memory from GPU VRAM to CPU DRAM.",
        },
      ],
    },
    trivia: ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT,
    generateSteps: generateZero1OptimizerStateMemoryEstimatorSteps,
  };
