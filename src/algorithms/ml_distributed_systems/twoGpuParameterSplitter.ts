import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface twoGpuParameterSplitterInput {
  data: number[];
  target?: number;
}

export const TWOGPUPARAMETERSPLITTER_CODE = `def split_model_parameters_2gpu(layer_weights, split_ratio=0.5):
    total_layers = len(layer_weights)
    if total_layers == 0:
        return ([], [])

    split_idx = max(1, min(total_layers - 1, int(total_layers * split_ratio)))
    gpu0_params = layer_weights[:split_idx]
    gpu1_params = layer_weights[split_idx:]
    return (gpu0_params, gpu1_params)
`;

export const DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT: twoGpuParameterSplitterInput = {
  data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
  target: 50,
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
  const splitRatio = 0.5;

  addStep(
    1,
    "Initialize 2-GPU Model Layer Pipeline Splitter",
    "Setting up layer weight array, target split boundary, and pipeline stage targets (GPU 0 vs GPU 1).",
    { total_layers: totalLayers, split_ratio: splitRatio, target: input.target ?? 0 },
  );

  addStep(
    2,
    `Compute Total Layers count = ${totalLayers}`,
    `Loaded ${totalLayers} neural network layers for pipeline stage assignment.`,
    { total_layers: totalLayers },
  );

  addStep(
    3,
    `Check Empty Layers Guard (total_layers == 0)`,
    totalLayers === 0
      ? "Total layers = 0, taking empty return path."
      : `Total layers = ${totalLayers} > 0, continuing execution.`,
    { total_layers: totalLayers, is_empty: totalLayers === 0 },
  );

  if (totalLayers === 0) {
    addStep(
      4,
      "Return Empty Partitions ([], [])",
      "No layers provided; returning empty parameter sublists for both GPUs.",
      { total_layers: 0, completed: true },
    );
    return steps;
  }

  const splitIdx = Math.max(1, Math.min(totalLayers - 1, Math.floor(totalLayers * splitRatio)));

  addStep(
    6,
    `Calculate Split Index split_idx = ${splitIdx}`,
    `Applying split_ratio = 0.5 to total_layers = ${totalLayers}: split_idx = max(1, min(${totalLayers - 1}, int(${totalLayers} * 0.5))) = ${splitIdx}.`,
    { split_idx: splitIdx, total_layers: totalLayers, split_ratio: splitRatio },
  );

  let gpu0Sum = 0;
  for (let idx = 0; idx < splitIdx; idx++) {
    const val = input.data[idx];
    gpu0Sum += val;
    const isTarget = val === input.target;

    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) {
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("visited" as const),
          pointers: [`Layer_${idx}`, "GPU 0"],
        };
      }
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      7,
      `Assign Layer ${idx} (${val} MB parameters) to GPU 0`,
      `Evaluating pipeline layer placement index ${idx} (< split_idx ${splitIdx}). Running GPU 0 parameter sum: ${gpu0Sum} MB.`,
      { idx, layer_size: val, assigned_gpu: 0, isTarget, gpu0Sum },
      currentElements,
    );
  }

  addStep(
    7,
    `Slice GPU 0 Parameter Sublist [0..${splitIdx - 1}]`,
    `Extracted ${splitIdx} layers containing total parameter payload of ${gpu0Sum} MB for GPU 0.`,
    { split_idx: splitIdx, gpu0_layers_count: splitIdx, gpu0_total_mb: gpu0Sum },
  );

  let gpu1Sum = 0;
  for (let idx = splitIdx; idx < totalLayers; idx++) {
    const val = input.data[idx];
    gpu1Sum += val;
    const isTarget = val === input.target;

    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i < splitIdx) return { ...el, state: "visited" as const, pointers: ["GPU 0"] };
      if (i === idx) {
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`Layer_${idx}`, "GPU 1"],
        };
      }
      if (i < idx) return { ...el, state: "compare" as const, pointers: ["GPU 1"] };
      return el;
    });

    addStep(
      8,
      `Assign Layer ${idx} (${val} MB parameters) to GPU 1`,
      `Evaluating pipeline layer placement index ${idx} (>= split_idx ${splitIdx}). Running GPU 1 parameter sum: ${gpu1Sum} MB.`,
      { idx, layer_size: val, assigned_gpu: 1, isTarget, gpu1Sum },
      currentElements,
    );
  }

  addStep(
    8,
    `Slice GPU 1 Parameter Sublist [${splitIdx}..${totalLayers - 1}]`,
    `Extracted ${totalLayers - splitIdx} layers containing total parameter payload of ${gpu1Sum} MB for GPU 1.`,
    { split_idx: splitIdx, gpu1_layers_count: totalLayers - splitIdx, gpu1_total_mb: gpu1Sum },
  );

  const finalElements: ArrayElement[] = elements.map((el, idx) => ({
    ...el,
    state: idx < splitIdx ? ("sorted" as const) : ("active" as const),
    pointers: [idx < splitIdx ? "GPU 0 Stage" : "GPU 1 Stage"],
  }));

  addStep(
    9,
    "Return (gpu0_params, gpu1_params)",
    `Pipeline splitting complete. GPU 0 receives ${splitIdx} layers (${gpu0Sum} MB); GPU 1 receives ${totalLayers - splitIdx} layers (${gpu1Sum} MB).`,
    {
      completed: true,
      gpu0_layers: splitIdx,
      gpu1_layers: totalLayers - splitIdx,
      gpu0Sum,
      gpu1Sum,
    },
    finalElements,
  );

  return steps;
};

const TWOGPUPARAMETERSPLITTER_TRIVIA: TriviaMeta = {
  skipLines: [5],
  distractors: [
    "split_idx = total_layers * 2",
    "gpu0_params = layer_weights",
    "return gpu0_params + gpu1_params",
    "split_idx = total_layers // 4",
  ],
  hints: [
    { line: 6, hint: "Calculate split pivot index while bounding within [1, total_layers-1]." },
    { line: 7, hint: "Slice parameter list into GPU 0 parameter sublist." },
    { line: 8, hint: "Slice parameter list into GPU 1 parameter sublist." },
    { line: 9, hint: "Return tuple containing GPU 0 and GPU 1 layer assignment lists." },
  ],
  lineExplanations: {
    1: "Defines entry point for split_model_parameters_2gpu taking layer_weights list and split_ratio.",
    2: "Calculates total number of model layers total_layers = len(layer_weights).",
    3: "Checks edge case guard for empty layer weight array.",
    4: "Returns empty tuples for both GPU devices if total_layers is 0.",
    5: "Blank line before split index computation.",
    6: "Computes split pivot index split_idx while bounding within [1, total_layers-1].",
    7: "Slices parameter list layer_weights[:split_idx] for GPU 0 stage.",
    8: "Slices parameter list layer_weights[split_idx:] for GPU 1 stage.",
    9: "Returns tuple (gpu0_params, gpu1_params) containing partitioned layer lists.",
  },
};

export const twoGpuParameterSplitter: AlgorithmDefinition<twoGpuParameterSplitterInput> = {
  id: "two-gpu-parameter-splitter",
  title: "2-GPU Model Layer Pipeline Splitter",
  topicIds: ["ml_distributed_systems", "ml_hardware_kernels"],
  difficulty: "Easy",
  description:
    "Partitions neural network transformer layers across a 2-GPU pipeline parallel cluster to balance memory footprint and compute workload.\n\n### Mathematical Formulation & Pipeline Balancing\nWhen a deep learning model's memory requirements exceed the VRAM capacity of a single GPU, Pipeline Parallelism (PP) partitions the model depth-wise across $N = 2$ devices:\n- **Stage 0 (GPU 0)**: Holds embedding layers and initial transformer layers $L_0 \\dots L_{k-1}$ with total parameter weight $M_0 = \\sum_{i=0}^{k-1} w_i$.\n- **Stage 1 (GPU 1)**: Holds subsequent transformer layers $L_k \\dots L_{N_{\\text{total}}-1}$ and output head with total weight $M_1 = \\sum_{i=k}^{N_{\\text{total}}-1} w_i$.\n\nFor a target split ratio $\\rho \\in (0, 1)$ (default $\\rho = 0.5$):\n$$k = \\max\\left(1, \\min\\left(N_{\\text{total}} - 1, \\lfloor N_{\\text{total}} \\cdot \\rho \\rfloor\\right)\\right)$$\nMemory imbalance ratio $\\Delta M$ between GPU 0 and GPU 1 is computed as:\n$$\\Delta M = \\frac{|M_0 - M_1|}{M_0 + M_1}$$\n\nIn a 1F1B (One Forward, One Backward) pipeline schedule, intermediate activation tensors $A_k \\in \\mathbb{R}^{B \\times S \\times h}$ computed at stage boundary $L_{k-1}$ are transferred across NVLink ($B_{\\text{NVLink}} \\approx 900\\text{ GB/s}$) from GPU 0 to GPU 1 during the forward pass, and activation gradients $\\frac{\\partial \\mathcal{L}}{\\partial A_k}$ are passed back during backward propagation.\n\nInput Format:\n- `data`: Array of parameter counts or weight memory sizes per layer in MB/GB.\n- `target`: Optional target layer size or search marker.\n\nOutput Format:\n- Returns partitioned layer lists assigned to GPU 0 (Pipeline Stage 0) and GPU 1 (Pipeline Stage 1).\n\nEdge Cases & Constraints:\n- Single Layer ($M=1$): Cannot be split; retained on GPU 0.\n- Uneven layer sizes: Embedding + Output Head layers often carry extra parameters, requiring custom split ratios beyond 50/50.",
  constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "18 Transformer Layers Split across 2 GPUs",
      inputDisplay: "18 layers, target = 50",
      outputDisplay: "GPU 0: 9 layers, GPU 1: 9 layers",
      input: DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT,
      output: "GPU 0: [10..50], GPU 1: [55..95]",
      explanation: "Splits 18 layers evenly: GPU 0 gets layers 0-8, GPU 1 gets layers 9-17.",
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
        body: "To prevent GPUs from sitting idle while waiting for activations (the 'pipeline bubble'), pipeline schedulers split mini-batches into micro-batches ($m$). Under the 1F1B (One Forward, One Backward) schedule, each GPU alternates between executing one micro-batch forward pass and one micro-batch backward pass, capping peak activation memory to $\\mathcal{O}(P_{\\text{stages}} \\times m)$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Inter-stage communication sends activation tensors $A \\in \\mathbb{R}^{B \\times S \\times h}$ across stage boundaries. When GPU 0 and GPU 1 reside on the same server, transfers utilize NVLink ($B_{\\text{NVLink}} \\approx 900\\text{ GB/s}$ on H100). When crossing server nodes, transfers use InfiniBand Remote Direct Memory Access (RDMA), requiring careful activation compression or chunking.",
      },
      {
        heading: "Implementation Nuances & Load Balancing",
        body: "Naively splitting layers by count ($M/2$) often results in memory imbalance because layer 0 contains token embeddings and layer $M-1$ contains output LM heads. Production pipeline splitters run dynamic programming algorithms to balance parameter memory $M_0, M_1$ plus peak activation VRAM across all stages.",
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
          "Inter-GPU communication of forward intermediate hidden states ($A$) and backward activation gradients ($\\frac{\\partial \\mathcal{L}}{\\partial A}$) across pipeline stage boundaries.",
      },
    ],
  },
  trivia: TWOGPUPARAMETERSPLITTER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
  defaultInput: DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT,
  generateSteps: generateTwoGpuParameterSplitterSteps,
};
