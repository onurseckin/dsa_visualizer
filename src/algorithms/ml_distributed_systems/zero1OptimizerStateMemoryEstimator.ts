import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zero1OptimizerStateMemoryEstimatorInput {
  parameters: number;
  gpus: number;
}

export const ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_CODE = `def estimate_zero1_memory(parameters, num_gpus, precision_bytes=2):
    """
    Calculates memory footprint per GPU under DeepSpeed ZeRO-1 (Optimizer State Partitioning).
    
    For Adam optimizer in mixed precision training (FP16/BF16):
    - Parameters (FP16): 2 * Psi bytes (unsharded in ZeRO-1)
    - Gradients (FP16): 2 * Psi bytes (unsharded in ZeRO-1)
    - Optimizer States (FP32 master weights + momentum + variance): 12 * Psi bytes (sharded across N GPUs)

    Args:
        parameters: Total parameter count (Psi)
        num_gpus: Number of GPUs in the Data Parallel group (N)
        precision_bytes: Bytes per weight parameter (default 2 for FP16/BF16)

    Returns:
        dict containing un-sharded optimizer bytes, per-GPU sharded bytes, and VRAM savings.
    """
    if num_gpus <= 0:
        raise ValueError("Number of GPUs must be at least 1")

    bytes_per_optimizer_param = 12  # 4 bytes FP32 master weight + 4 bytes momentum + 4 bytes variance
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
    10,
    "Initialize memory estimator",
    "Prepare to compute the memory footprint of Adam optimizer states under ZeRO-1.",
    { parameters: params, gpus },
    [...elements],
  );

  const bytesPerParam = 12;
  addStep(
    23,
    "Define bytes per parameter for Adam",
    "Adam requires FP32 master weights, momentum, and variance (3 * 4 = 12 bytes per parameter).",
    { bytes_per_param: bytesPerParam },
    [...elements],
  );

  const totalOptimizerMemory = params * bytesPerParam;
  addStep(
    24,
    "Calculate total optimizer memory",
    "This is the memory required if we didn't shard the optimizer states.",
    { total_optimizer_memory: totalOptimizerMemory },
    [...elements],
  );

  const perGpuMemory = totalOptimizerMemory / gpus;
  const finalElements = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    value: `${(perGpuMemory / 1e9).toFixed(2)} GB`,
  }));

  addStep(
    25,
    "Shard memory across GPUs",
    "ZeRO-1 divides the optimizer states evenly across all GPUs in the data parallel group.",
    { per_gpu_memory: perGpuMemory },
    finalElements,
  );

  addStep(
    27,
    "Return per-GPU footprint",
    "Computation complete.",
    { per_gpu_memory: perGpuMemory },
    finalElements,
  );

  return steps;
};

const ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7],
  distractors: ["bytes_per_param = 16", "per_gpu_memory = total_optimizer_memory * gpus"],
  hints: [{ line: 23, hint: "FP32 Master Weights (4) + Momentum (4) + Variance (4) = 12." }],
  lineExplanations: {
    10: "Check for zero GPUs to prevent division by zero.",
    23: "Define the optimizer state footprint per parameter.",
    24: "Calculate un-sharded memory requirements.",
    25: "Divide the footprint evenly across the DP group.",
    27: "Return the result.",
  },
};

export const zero1OptimizerStateMemoryEstimator: AlgorithmDefinition<zero1OptimizerStateMemoryEstimatorInput> =
  {
    id: "zero1-optimizer-state-memory-estimator",
    title: "DeepSpeed ZeRO-1 Optimizer Sharding",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Calculates the per-GPU VRAM memory footprint for the Adam optimizer under DeepSpeed ZeRO-1 (Zero Redundancy Optimizer Stage 1: Optimizer State Partitioning).\n\nIn mixed-precision training (FP16/BF16) with parameter count $\\Psi$:\n- Model Weights (FP16): $2\\Psi$ bytes (unsharded on each GPU)\n- Gradients (FP16): $2\\Psi$ bytes (unsharded on each GPU)\n- Adam Optimizer States (FP32): $12\\Psi$ bytes ($4\\Psi$ master weights + $4\\Psi$ momentum + $4\\Psi$ variance)\n\nIn standard Data Parallelism (DDP), every GPU replicates all $16\\Psi$ bytes. Under ZeRO-1, the $12\\Psi$ optimizer states are sharded equally across $N$ GPUs, so each GPU stores only $\\frac{12\\Psi}{N}$ bytes of optimizer memory.\n\nTotal per-GPU memory under ZeRO-1: $M_{\\text{ZeRO-1}} = 4\\Psi + \\frac{12\\Psi}{N}$ bytes.\n\nFor a 1B parameter model ($10^9$) on $N=8$ GPUs:\n- Unsharded Optimizer Memory = $12 \\text{ GB}$\n- ZeRO-1 Sharded Memory per GPU = $12 \\text{ GB} / 8 = 1.5 \\text{ GB}$.\n\nInput Format:\n- parameters: Total parameter count $\\Psi$ of the model.\n- gpus: Total number of GPUs $N$ in the Data Parallel world size.\n\nOutput Format:\n- Returns detailed dictionary with total un-sharded memory, sharded per-GPU memory footprint, and VRAM savings.\n\nEdge Cases & Constraints:\n- Single GPU ($N=1$): Zero sharding benefit; per-GPU optimizer memory remains $12\\Psi$.\n- Extremely Large Models ($\\Psi > 100B$): ZeRO-1 alone may not prevent OOM, requiring ZeRO-2 or ZeRO-3.",
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
          body: "Instead of duplicating the $12\\Psi$ bytes of optimizer state across all $N$ ranks as in standard PyTorch DDP, ZeRO-1 partitions optimizer states so that rank $i$ stores and updates only $1/N$-th of the parameters' optimizer states. After each optimizer step, an All-Gather operation broadcasts the updated FP16 parameters to all ranks.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "ZeRO-1 incurs ZERO additional network communication overhead relative to standard DDP! Standard DDP executes an All-Reduce on gradients, which costs $2\\frac{N-1}{N}\\Psi$ bytes. ZeRO-1 replaces All-Reduce with a Reduce-Scatter on gradients ($1\\frac{N-1}{N}\\Psi$ bytes) followed by an All-Gather on updated parameters ($1\\frac{N-1}{N}\\Psi$ bytes), keeping total communication at exactly $2\\frac{N-1}{N}\\Psi$ bytes per step.",
        },
        {
          heading: "Implementation Nuances & CPU Offloading",
          body: "Frameworks like DeepSpeed and PyTorch FSDP extend ZeRO-1 with CPU Offloading (ZeRO-Offload), swapping the $12\\Psi/N$ sharded optimizer states into CPU DRAM via PCIe host-to-device transfers, enabling training of massive models on single-node GPU workstations.",
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
            "The 12 bytes per parameter required to store FP32 master weights, momentum (first moment), and variance (second moment).",
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
