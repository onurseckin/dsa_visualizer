import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface optimalSubgraphActivationCheckpointingInput {
  data: number[];
  target?: number;
}

export const OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_CODE = `def optimal_subgraph_activation_checkpointing(num_layers, checkpoint_interval=2):
    """
    Saves activation checkpoints every K layers to trade re-computation FLOPs for SRAM memory.
    """
    checkpoints = []
    for i in range(num_layers):
        is_checkpoint = (i % checkpoint_interval == 0)
        checkpoints.append((i, is_checkpoint))
    return checkpoints`;

export const DEFAULT_OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_INPUT: optimalSubgraphActivationCheckpointingInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateOptimalSubgraphActivationCheckpointingSteps = (
  input: optimalSubgraphActivationCheckpointingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;

  const elements: ArrayElement[] = arrayData.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
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
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init Checkpointing Scheduler
  addStep(
    1,
    "Initialize Optimal Subgraph Activation Checkpointing Scheduler",
    "Setting up activation memory management pass to trade re-computation FLOPs for reduced GPU VRAM consumption.",
    { numLayers: arrayData.length, checkpointInterval: 2, phase: "INIT_SCHEDULER" },
    undefined,
    { memory_mode: "CHECKPOINTED", interval: "2" },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Saves activation checkpoints every K layers to trade re-computation FLOPs for SR",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Init checkpoints list
  addStep(
    5,
    "Allocate Checkpoint Array `checkpoints = []`",
    "Initializing list log to store per-layer (layer_index, is_checkpoint) tuple decisions.",
    { phase: "ALLOC_CHECKPOINTS_LIST" },
  );

  // Step 3: Inspect memory bounds
  addStep(
    6,
    "Calculate Optimal SRAM Memory Footprint Target",
    "Deriving peak memory bound O(sqrt(N)) for checkpoint schedule.",
    { numLayers: arrayData.length, maxVramRatio: "0.50", phase: "CALC_MEMORY_BOUND" },
  );

  // Multi-step loop per layer
  const checkpointList: { layer: number; isCkpt: boolean }[] = [];
  arrayData.forEach((val, idx) => {
    const isCkpt = idx % 2 === 0;
    checkpointList.push({ layer: idx, isCkpt });
    const isTarget = val === target;

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`Layer_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      6,
      `Inspect Layer ${idx} Activation Footprint`,
      `Iterating through neural network graph layer ${idx}. Evaluating checkpoint interval modulo rule (i % 2 == 0).`,
      { layer: idx, interval: 2, phase: "INSPECT_LAYER" },
      stateA,
      { currentLayer: `Layer_${idx}` },
    );

    addStep(
      7,
      `Evaluate Modulo Rule: (${idx} % 2 == 0) -> ${isCkpt}`,
      isCkpt
        ? `Layer ${idx} satisfies checkpoint condition. Storing activation in GPU VRAM memory!`
        : `Layer ${idx} is intermediate. Activation will be discarded during forward pass and re-computed during backward.`,
      { layer: idx, isCheckpoint: isCkpt, phase: "EVAL_MODULO" },
      stateA,
      { isCheckpoint: String(isCkpt) },
    );

    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isCkpt ? "active" : "sorted", value: isCkpt ? "CKPT" : "RECOMP", pointers: [isCkpt ? "SAVED_VRAM" : "DISCARDED"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      8,
      `Log Decision: checkpoints.append((${idx}, ${isCkpt}))`,
      `Recorded layer ${idx} decision: ${isCkpt ? "SAVED_CHECKPOINT" : "DISCARD_AND_RECOMPUTE"}.`,
      { layer: idx, isCheckpoint: isCkpt, totalCheckpointsSaved: checkpointList.filter((c) => c.isCkpt).length, phase: "LOG_DECISION" },
      stateB,
      { checkpoint_count: String(checkpointList.filter((c) => c.isCkpt).length) },
    );
  });

  // Step final-1: Verify Checkpoint Memory Schedule
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    9,
    "Verify Activation Checkpoint Schedule Topology",
    `Schedule complete: saved ${checkpointList.filter((c) => c.isCkpt).length} checkpoints across ${arrayData.length} layers. Reduced peak VRAM footprint by ~50%.`,
    { totalLayers: arrayData.length, totalCheckpoints: checkpointList.filter((c) => c.isCkpt).length },
    finalElements,
  );

  // Step final: Complete
  addStep(
    9,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "is_checkpoint = (i % checkpoint_interval != 0)",
  ],
  hints: [
    { line: 5, hint: "Initialize empty array checkpoints to log layer decisions." },
    { line: 7, hint: "Evaluate modulo rule (i % checkpoint_interval == 0) to mark saved layers." },
    { line: 8, hint: "Append (layer_index, is_checkpoint) tuple to schedule array." },
  ],
  lineExplanations: {
    1: "Defines entry point for optimal_subgraph_activation_checkpointing scheduler.",
    2: "Docstring opening: describes activation checkpointing every K layers.",
    3: "Docstring body: saves activation checkpoints to trade re-computation FLOPs for GPU SRAM/VRAM memory reduction.",
    4: "Docstring closing.",
    5: "Initializes empty list checkpoints to store (layer_index, is_checkpoint) decision tuples.",
    6: "Iterates through layer indices i from 0 to num_layers - 1.",
    7: "Evaluates boolean checkpoint condition (i % checkpoint_interval == 0).",
    8: "Appends (i, is_checkpoint) tuple to decision schedule list checkpoints.",
    9: "Returns checkpoints decision schedule list.",
  },
};

export const optimalSubgraphActivationCheckpointing: AlgorithmDefinition<optimalSubgraphActivationCheckpointingInput> =
  {
    id: "optimal-subgraph-activation-checkpointing",
    title: "Optimal Subgraph Activation Checkpointing Scheduler",
    category: "ml_autograd_dags",
    categories: ["ml_autograd_dags", "graph_traversal"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 3,
    mlInfraCategory: "ml_autograd_dags",
    description: `### Optimal Subgraph Activation Checkpointing Scheduler

In training large neural network models (**LLMs**, **Vision Transformers**, and **Deep ResNets**), storing all intermediate forward activations in High-Bandwidth Memory (HBM) for backward autograd passes easily causes **Out-Of-Memory (OOM)** crashes.

#### Why It Exists & What It Solves
For an $N$-layer deep neural network:
- Storing all intermediate activations requires $\\mathcal{O}(N)$ GPU VRAM memory.
- For a 70-billion parameter model, storing forward activations across 80 Transformer layers requires hundreds of gigabytes of VRAM.

With **Activation Checkpointing** (\`torch.utils.checkpoint\` / **Gradient Checkpointing**):
- Forward activations are saved in HBM only every $K$ layers (the **checkpoint interval**).
- Intermediate activations between checkpoints are discarded from memory.
- During the backward pass, discarded intermediate activations are **re-computed on-the-fly** by re-running forward pass execution between checkpoint boundaries.
- **Memory-FLOP Trade-Off**: Reduces peak VRAM memory footprint from $\\mathcal{O}(N)$ down to $\\mathcal{O}\\left(\\frac{N}{K} + K\\right)$ (or $\\mathcal{O}(\\sqrt{N})$ when $K = \\sqrt{N}$), in exchange for $\\sim 33\\%$ extra forward re-computation FLOPs.

#### Step-by-Step Mechanism
1. **Initialize Log**: Allocate \`checkpoints = []\`.
2. **Layer Iteration**: For each layer index $i \\in [0, N-1]$:
   - Evaluate modulo rule \`is_checkpoint = (i % checkpoint_interval == 0)\`.
   - Record tuple \`(i, is_checkpoint)\` into \`checkpoints\`.
3. **Return Schedule**: Return \`checkpoints\` schedule array.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time to compute schedule (and $\\sim 1.33 \\times$ forward compute FLOPs during backward execution).
- **Space Complexity**: Peak memory drops from $\\mathcal{O}(N)$ down to $\\mathcal{O}(\\sqrt{N})$.
- **Trade-Off**: Enables training models $4\\times - 10\\times$ larger on fixed GPU hardware at the expense of a modest increase in backward execution time.`,
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Autograd Pass",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "Evaluated Graph State",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Standard execution pass over computation graph.",
      },
      {
        kind: "complex",
        title: "Larger DAG Input",
        inputDisplay: "data = [10, 20, 30, 40, 50]",
        outputDisplay: "Evaluated Graph State",
        input: { data: [10, 20, 30, 40, 50] },
        output: "[10, 20, 30, 40, 50]",
        explanation: "Evaluates multi-node computation graph DAG.",
      },
      {
        kind: "negative",
        title: "Edge Case DAG",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "Evaluated Graph State",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Edge case handling completes safely.",
      },
    ],
    code: OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(sqrt(N))",
    complexityAnalysis: {
      time: "Linear time schedule generation; 33% extra FLOP compute during backprop.",
      space: "Peak memory footprint reduced from O(N) to O(sqrt(N)).",
    },
    topicGuide: {
      overview:
        "Activation checkpointing trades FLOPs for memory. By storing activations at every K-th layer and discarding intermediate activations, peak VRAM consumption drops from O(N) to O(N/K + K), enabling training models 4x-10x larger on fixed GPU hardware.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For an $N$-layer network divided into $K$ blocks, optimal checkpoint interval is $K = \\sqrt{N}$. Memory consumption reduces from $\\mathcal{O}(N)$ to $\\mathcal{O}(\\sqrt{N})$ at the cost of 33% extra forward re-computation FLOPs.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "On NVIDIA H100 GPUs, activation checkpointing allows training 70B parameter LLMs without Out-Of-Memory (OOM) memory faults.",
        },
        {
          heading: "Implementation Details & Modulo Scheduling",
          body: "Implementation evaluates modulo condition (\`i % checkpoint_interval == 0\`) to designate saved layer boundary checkpoints.",
        },
        {
          heading: "Edge Case Analysis & Interval Selection",
          body: "Edge cases include $K=1$ (save all activations, zero re-computation, maximum memory) vs $K=N$ (save only input activation, maximum re-computation).",
        },
      ],
      keyTerms: [
        {
          term: "Activation Checkpointing",
          definition:
            "Technique saving select layer activations and re-computing intermediate activations during backward pass.",
        },
        {
          term: "Memory-FLOP Tradeoff",
          definition: "Sacrificing extra compute FLOPs to reduce peak GPU VRAM memory consumption.",
        },
        {
          term: "Re-computation Pass",
          definition: "Re-executing forward pass layer calculations during backward propagation.",
        },
      ],
    },
    trivia: OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
    defaultInput: DEFAULT_OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_INPUT,
    generateSteps: generateOptimalSubgraphActivationCheckpointingSteps,
  };
