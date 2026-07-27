import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface twoGpuParameterSplitterInput {
  data: number[];
  target?: number;
}

export const TWOGPUPARAMETERSPLITTER_CODE = `def split_model_parameters_2gpu(layer_weights, split_ratio=0.5):
    """
    Splits neural network layers across 2 GPUs for pipeline parallelism or model sharding.

    Args:
        layer_weights: List of layer parameter counts or weight sizes
        split_ratio: Target fraction of parameters allocated to GPU 0 (default 0.5)

    Returns:
        Tuple (gpu0_layers, gpu1_layers) containing parameter lists for each device.
    """
    total_layers = len(layer_weights)
    if total_layers == 0:
        return ([], [])

    split_idx = max(1, min(total_layers - 1, int(total_layers * split_ratio)))
    gpu0_params = layer_weights[:split_idx]
    gpu1_params = layer_weights[split_idx:]
    return (gpu0_params, gpu1_params)
`;

export const DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT: twoGpuParameterSplitterInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateTwoGpuParameterSplitterSteps = (
  input: twoGpuParameterSplitterInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `layer-${idx}`,
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

  const totalLayers = input.data.length;
  const splitIdx = Math.max(1, Math.min(totalLayers - 1, Math.floor(totalLayers / 2)));

  addStep(
    1,
    "Initialize 2-GPU Model Layer Pipeline Splitter",
    "Setting up layer weight array, target split boundary, and pipeline stage targets (GPU 0 vs GPU 1).",
    { total_layers: totalLayers, split_idx: splitIdx, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isGpu0 = idx < splitIdx;
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`Layer_${idx}`, isGpu0 ? "GPU 0" : "GPU 1"],
        };
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      15,
      `Assign Layer ${idx} (${val} MB parameters) to GPU ${isGpu0 ? 0 : 1}`,
      `Evaluating pipeline layer placement index ${idx} relative to split pivot ${splitIdx}.`,
      { idx, layer_size: val, assigned_gpu: isGpu0 ? 0 : 1, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el, idx) => ({
    ...el,
    state: idx < splitIdx ? ("sorted" as const) : ("active" as const),
    pointers: [idx < splitIdx ? "GPU 0 Stage" : "GPU 1 Stage"],
  }));

  addStep(
    18,
    "Execution Complete",
    `Pipeline splitting complete. Layers [0..${splitIdx - 1}] assigned to GPU 0; Layers [${splitIdx}..${totalLayers - 1}] assigned to GPU 1.`,
    { completed: true, gpu0_layers: splitIdx, gpu1_layers: totalLayers - splitIdx },
    finalElements,
  );

  return steps;
};

const TWOGPUPARAMETERSPLITTER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "split_idx = total_layers * 2",
    "gpu0_params = layer_weights",
    "return gpu0_params + gpu1_params",
  ],
  hints: [{ line: 15, hint: "Split layers into contiguous blocks for GPU 0 and GPU 1." }],
  lineExplanations: {
    1: "Defines entry point for split_model_parameters_2gpu.",
    11: "Handles empty layer weight array edge case.",
    15: "Calculates split pivot index while bounding within [1, total_layers-1].",
    16: "Slices parameter list into GPU 0 and GPU 1 pipeline stages.",
  },
};

export const twoGpuParameterSplitter: AlgorithmDefinition<twoGpuParameterSplitterInput> = {
  id: "two-gpu-parameter-splitter",
  title: "2-GPU Model Layer Pipeline Splitter",
  category: "ml_distributed_systems",
  categories: ["ml_distributed_systems", "ml_hardware_kernels"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 11,
  mlInfraCategory: "ml_distributed_systems",
  description:
    "Partitions neural network transformer layers across a 2-GPU pipeline parallel cluster to balance memory footprint and compute workload.\n\nWhen a deep learning model's memory requirements exceed the VRAM capacity of a single GPU, Pipeline Parallelism (PP) partitions the model sequentially across multiple devices:\n1. Stage 0 (GPU 0): Holds embedding layers and initial transformer layers $L_0 \\dots L_{k-1}$.\n2. Stage 1 (GPU 1): Holds subsequent transformer layers $L_k \\dots L_{M-1}$ and the language model output head.\n\nTo minimize pipeline bubbles (idle GPU time) and balance VRAM usage, the layer partition index $k$ is calculated based on cumulative parameter counts or floating-point computational complexity.\n\nIn a 1F1B (One Forward, One Backward) pipeline schedule, intermediate activation tensors computed at stage boundary $L_{k-1}$ are transferred across NVLink or PCIe from GPU 0 to GPU 1 during the forward pass, and activation gradients are passed back during the backward pass.\n\nInput Format:\n- data: Array of parameter counts or weight memory sizes per layer in MB/GB.\n- target: Optional target layer size or search marker.\n\nOutput Format:\n- Returns partitioned layer lists assigned to GPU 0 (Pipeline Stage 0) and GPU 1 (Pipeline Stage 1).\n\nEdge Cases & Constraints:\n- Single Layer ($M=1$): Cannot be split; retained on GPU 0.\n- Uneven layer sizes: Embedding + Output Head layers often carry extra parameters, requiring custom split ratios beyond 50/50.",
  constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "4 Transformer Layers Split across 2 GPUs",
      inputDisplay: "layer_weights = [10, 20, 30, 40] (total 100 MB), target = 30",
      outputDisplay: "GPU 0: [10, 20], GPU 1: [30, 40]",
      input: { data: [10, 20, 30, 40], target: 30 },
      output: "GPU 0: [10, 20], GPU 1: [30, 40]",
      explanation: "Splits 4 layers evenly: GPU 0 gets layers 0-1, GPU 1 gets layers 2-3.",
    },
    {
      kind: "complex",
      title: "5 Layer Model Pipeline Assignment",
      inputDisplay: "layer_weights = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "GPU 0: [1, 2], GPU 1: [3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "GPU 0: [1, 2], GPU 1: [3, 4, 5]",
      explanation: "Splits 5 layers at index 2 (floor(5/2) = 2).",
    },
    {
      kind: "negative",
      title: "Single Layer Edge Case",
      inputDisplay: "layer_weights = [50], target = 50",
      outputDisplay: "GPU 0: [50], GPU 1: []",
      input: { data: [50], target: 50 },
      output: "GPU 0: [50], GPU 1: []",
      explanation: "Single layer cannot be further split across 2 pipeline stages.",
    },
  ],
  code: TWOGPUPARAMETERSPLITTER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) slicing of the layer weight parameter list.",
    space: "O(N) memory allocation for GPU 0 and GPU 1 layer assignment arrays.",
  },
  topicGuide: {
    overview:
      "2-GPU Model Layer Pipeline Splitter demonstrates layer-wise model partitioning for Pipeline Parallelism (GPipe, Megatron 1F1B) in multi-GPU distributed deep learning systems.",
    sections: [
      {
        heading: "Overview & Pipeline Parallelism Context",
        body: "Large transformer models like LLaMA-70B or DeepSeek-V3 cannot fit into a single GPU's VRAM even with mixed precision. Pipeline Parallelism breaks the model depth-wise into stages, placing consecutive blocks of layers on separate GPUs.",
      },
      {
        heading: "Core Concepts & 1F1B Scheduling",
        body: "To prevent GPUs from sitting idle while waiting for activations (the 'pipeline bubble'), pipeline schedulers split mini-batches into micro-batches. Under the 1F1B (One Forward, One Backward) schedule, each GPU alternates between executing one micro-batch forward pass and one micro-batch backward pass, capping peak activation memory.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Inter-stage communication sends activation tensors across stage boundaries. When GPU 0 and GPU 1 reside on the same server, transfers utilize NVLink (up to 900 GB/s on H100). When crossing server nodes, transfers use InfiniBand Remote Direct Memory Access (RDMA), requiring careful activation compression or chunking.",
      },
      {
        heading: "Implementation Nuances & Load Balancing",
        body: "Naively splitting layers by count ($M/2$) often results in memory imbalance because layer 0 contains token embeddings and layer $M-1$ contains output LM heads. Production pipeline splitters run dynamic programming algorithms to balance parameter memory + peak activation VRAM across all stages.",
      },
    ],
    keyTerms: [
      {
        term: "Pipeline Parallelism (PP)",
        definition:
          "Partitioning neural network layers sequentially across multiple GPUs, passing activation tensors between stages.",
      },
      {
        term: "1F1B Schedule",
        definition:
          "One Forward, One Backward micro-batch pipeline schedule that minimizes peak activation memory footprint.",
      },
      {
        term: "Pipeline Bubble",
        definition:
          "Idle time experienced by GPUs at the start and end of a pipeline step while waiting for micro-batches to arrive.",
      },
      {
        term: "Activation Transfer",
        definition:
          "Inter-GPU communication of forward intermediate hidden states and backward activation gradients across pipeline stage boundaries.",
      },
    ],
  },
  trivia: TWOGPUPARAMETERSPLITTER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
  defaultInput: DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT,
  generateSteps: generateTwoGpuParameterSplitterSteps,
};
