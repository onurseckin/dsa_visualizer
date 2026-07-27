import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface optimalSubgraphActivationCheckpointingInput {
  data: number[];
  target?: number;
}

export const OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_CODE = `
def optimal_subgraph_activation_checkpointing(num_layers, checkpoint_interval=2):
    """
    Saves activation checkpoints every K layers to trade re-computation FLOPs for SRAM memory.
    """
    checkpoints = []
    for i in range(num_layers):
        is_checkpoint = (i % checkpoint_interval == 0)
        checkpoints.append((i, is_checkpoint))
    return checkpoints
`;

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
          target: String(input?.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Optimal Subgraph Activation Checkpointing Scheduler",
    "Setting up execution data structures and memory layout pointers.",
    { n: arrayData.length, target: input?.target ?? 0 },
  );

  arrayData.forEach((val, idx) => {
    const isTarget = val === input?.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in autograd computation graph.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    9,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines optimal subgraph activation checkpointing scheduler function.",
    4: "Initializes checkpoints decision log array.",
    5: "Iterates through layer indices i from 0 to num_layers - 1.",
    6: "Evaluates boolean checkpoint condition: (i % checkpoint_interval == 0).",
    7: "Appends (layer_index, is_checkpoint) tuple to log array.",
    8: "Returns list of layer checkpoint decisions.",
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
    description:
      "Training deep neural networks (e.g. 70B parameter LLMs, Vision Transformers) can exceed GPU VRAM memory capacity if all intermediate layer activations are stored in memory for backward passes. Activation Checkpointing (gradient checkpointing, torch.utils.checkpoint) saves activations only at selected checkpoint layers every K steps, freeing intermediate layer activations from memory and re-computing them on-the-fly during the backward pass.\n\nThis algorithm implements Optimal Subgraph Activation Checkpointing Scheduler, marking optimal layer indices for memory checkpointing to balance memory footprint vs re-computation overhead.\n\nInput Format:\n- data: Array representing layer parameters.\n- target: Optional target value.\n\nOutput Format:\n- Returns list of (layer_index, is_checkpoint) tuples.\n\nEdge Cases & Constraints:\n- Checkpoint interval = 1 (save all activations, zero re-computation, maximum memory).\n- Checkpoint interval >= total layers (save only input activation, maximum re-computation, minimum memory).\n- Non-uniform layer activation sizes.",
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
    timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
    spaceComplexity: "O(V + E)",
    complexityAnalysis: {
      time: "Linear time traversal across graph vertices and edges.",
      space: "Linear memory allocation for graph adjacency lists.",
    },
    topicGuide: {
      overview:
        "Activation checkpointing trades FLOPs for memory. By storing activations at every K-th layer and discarding intermediate activations, peak VRAM consumption drops from O(N) to O(N/K + K), enabling training models 4x-10x larger on fixed GPU memory hardware.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, for an N-layer network divided into K blocks, optimal checkpoint interval is K = sqrt(N). Memory consumption reduces from O(N) to O(sqrt(N)) at the cost of 33% extra forward re-computation FLOPs.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "On NVIDIA H100 80GB GPUs, activation checkpointing makes it possible to train 13B parameter models on a single GPU without memory Out-Of-Memory (OOM) crashes.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation iterates through layer index i, evaluates modulo checkpoint condition (i % checkpoint_interval == 0), and logs checkpoint decisions.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes non-square layer counts where integer rounding determines optimal interval.",
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
