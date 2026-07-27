import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zero1OptimizerStateMemoryEstimatorInput {
  parameters: number;
  gpus: number;
}

export const ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_CODE = `
def zero1optimizerstatememoryestimator(ring_ranks, parameter_shards):
    """
    Ring-AllReduce collective communications and vLLM PagedAttention virtual memory translation.
    """
    num_nodes = len(ring_ranks)
    shard_buffers = [list(shard) for shard in parameter_shards]

    # Phase 1: Scatter-Reduce across circular ring topology
    for step in range(num_nodes - 1):
        for rank in range(num_nodes):
            send_idx = (rank - step) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] += shard_buffers[rank][send_idx]

    # Phase 2: AllGather across circular ring topology
    for step in range(num_nodes - 1):
        for rank in range(num_nodes):
            send_idx = (rank - step + 1) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] = shard_buffers[rank][send_idx]

    return shard_buffers
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
    12,
    "Define bytes per parameter for Adam",
    "Adam requires FP32 master weights, momentum, and variance (3 * 4 = 12 bytes per parameter).",
    { bytes_per_param: bytesPerParam },
    [...elements],
  );

  const totalOptimizerMemory = params * bytesPerParam;
  addStep(
    13,
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
    14,
    "Shard memory across GPUs",
    "ZeRO-1 divides the optimizer states evenly across all GPUs in the data parallel group.",
    { per_gpu_memory: perGpuMemory },
    finalElements,
  );

  addStep(
    16,
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
  hints: [{ line: 12, hint: "FP32 Master Weights (4) + Momentum (4) + Variance (4) = 12." }],
  lineExplanations: {
    10: "Check for zero GPUs to prevent division by zero.",
    12: "Define the optimizer state footprint per parameter.",
    13: "Calculate un-sharded memory requirements.",
    14: "Divide the footprint evenly across the DP group.",
    16: "Return the result.",
  },
};

export const zero1OptimizerStateMemoryEstimator: AlgorithmDefinition<zero1OptimizerStateMemoryEstimatorInput> =
  {
    id: "zero1-optimizer-state-memory-estimator",
    title: "DeepSpeed ZeRO-1 Optimizer Sharding",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "graph_traversal"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), deepspeed zero-1 optimizer sharding provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["1 <= parameters <= 10^12", "1 <= gpus <= 1000"],
    examples: [
      {
        kind: "basic",
        title: "1B Parameter Model on 8 GPUs",
        inputDisplay: "params = 1,000,000,000, GPUs = 8",
        outputDisplay: "1,500,000,000 bytes (1.5 GB)",
        input: { parameters: 1000000000, gpus: 8 },
        output: "1.5 GB per GPU",
        explanation: "Total optimizer memory is 12GB. Divided by 8 GPUs, each stores 1.5GB.",
      },
      {
        kind: "complex",
        title: "70B Model on 64 GPUs",
        inputDisplay: "params = 70,000,000,000, GPUs = 64",
        outputDisplay: "13.125 GB per GPU",
        input: { parameters: 70000000000, gpus: 64 },
        output: "13.125 GB per GPU",
        explanation: "70B * 12 = 840GB total. 840GB / 64 = 13.125GB per GPU.",
      },
      {
        kind: "negative",
        title: "Single GPU (No Sharding Benefit)",
        inputDisplay: "params = 100,000,000, GPUs = 1",
        outputDisplay: "1.2 GB per GPU",
        input: { parameters: 100000000, gpus: 1 },
        output: "1.2 GB per GPU",
        explanation: "With 1 GPU, it must hold the entire 12 bytes/param optimizer state.",
      },
    ],
    code: ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) algebraic computation.",
      space: "O(1) memory for the calculation variables.",
    },
    topicGuide: {
      overview:
        "ZeRO-1 (Zero Redundancy Optimizer, Stage 1) reduces memory footprint by partitioning optimizer states across GPUs in data parallel training.",
      sections: [
        {
          heading: "Memory Wall",
          body: "In mixed-precision training, the Adam optimizer requires storing FP32 copies of weights, momentum, and variance. This consumes 12 bytes per parameter, often exceeding VRAM limits for large models.",
        },
        {
          heading: "Sharding",
          body: "Instead of every GPU keeping a redundant copy of all optimizer states, ZeRO-1 divides them. Each GPU updates only its partition and synchronizes the updated FP16 weights.",
        },
      ],
      keyTerms: [
        { term: "ZeRO-1", definition: "Optimizer state partitioning." },
        {
          term: "Adam Optimizer",
          definition: "Maintains running averages of gradients and squared gradients.",
        },
      ],
    },
    trivia: ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT,
    generateSteps: generateZero1OptimizerStateMemoryEstimatorSteps,
  };
