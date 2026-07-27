import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ActivationCheckpointingInput {
  numLayers: number;
  checkpointInterval: number;
  activationSizePerLayerMb: number;
  recomputeFlopsPerLayerGflop: number;
}

export const ACTIVATION_CHECKPOINTING_CODE = `def activation_checkpointing(num_layers: int, interval: int, act_size_mb: float, flop_per_layer: float) -> dict:
    if num_layers <= 0 or interval <= 0:
        return {"checkpoints": [], "vram_saved_mb": 0.0, "recomputed_flops_gflop": 0.0}
        
    checkpoints = [i for i in range(0, num_layers, interval)]
    saved_activations = len(checkpoints)
    omitted_activations = num_layers - saved_activations
    
    vram_without_cp_mb = num_layers * act_size_mb
    vram_with_cp_mb = saved_activations * act_size_mb
    vram_saved_mb = vram_without_cp_mb - vram_with_cp_mb
    vram_saved_pct = (vram_saved_mb / max(1.0, vram_without_cp_mb)) * 100.0
    
    recomputed_flops_gflop = omitted_activations * flop_per_layer
    
    return {
        "checkpoints": checkpoints,
        "vram_without_cp_mb": vram_without_cp_mb,
        "vram_with_cp_mb": vram_with_cp_mb,
        "vram_saved_mb": vram_saved_mb,
        "vram_saved_pct": round(vram_saved_pct, 1),
        "recomputed_flops_gflop": recomputed_flops_gflop
    }`;

export const DEFAULT_ACTIVATION_CHECKPOINTING_INPUT: ActivationCheckpointingInput = {
  numLayers: 8,
  checkpointInterval: 2,
  activationSizePerLayerMb: 500,
  recomputeFlopsPerLayerGflop: 2.0,
};

export const generateActivationCheckpointingSteps = (
  input: ActivationCheckpointingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numLayers, checkpointInterval, activationSizePerLayerMb, recomputeFlopsPerLayerGflop } =
    input;

  const elements: ArrayElement[] = Array.from({ length: Math.max(0, numLayers) }, (_, idx) => ({
    id: `layer-${idx}`,
    value: idx,
    state: "default",
    pointers: [`L${idx}`],
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
        customState: customState || {
          config: `${numLayers} Layers | Interval ${checkpointInterval}`,
          actSizePerLayer: `${activationSizePerLayerMb} MB`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Activation Checkpointing Schedule",
    `Analyzing ${numLayers} transformer/neural net layers with checkpoint interval ${checkpointInterval}.`,
    { numLayers, checkpointInterval },
  );

  if (numLayers <= 0 || checkpointInterval <= 0) {
    addStep(
      2,
      "Invalid Layer Configuration — early return",
      "Layer count or interval must be strictly positive.",
      { vram_saved_mb: 0, recomputed_flops_gflop: 0 },
      [],
      { error: "Invalid configuration" },
    );
    return steps;
  }

  const checkpoints: number[] = [];
  for (let i = 0; i < numLayers; i += checkpointInterval) {
    checkpoints.push(i);
  }

  const cpSet = new Set(checkpoints);
  const scheduledElements: ArrayElement[] = elements.map((el, idx) => {
    const isCp = cpSet.has(idx);
    return {
      ...el,
      state: isCp ? "pivot" : "visited",
      pointers: [isCp ? `SAVE (L${idx})` : `DISCARD (L${idx})`],
    };
  });

  addStep(
    5,
    `Identify Checkpoint Layer Indices: [${checkpoints.join(", ")}]`,
    `Saving activations only at layer boundaries [${checkpoints.join(
      ", ",
    )}]. Intermediate ${numLayers - checkpoints.length} layer activations will be freed.`,
    { checkpoints: checkpoints.join(","), numSaved: checkpoints.length },
    scheduledElements,
    { checkpoints: `[${checkpoints.join(", ")}]` },
  );

  const vramWithoutCpMb = numLayers * activationSizePerLayerMb;
  const vramWithCpMb = checkpoints.length * activationSizePerLayerMb;
  const vramSavedMb = vramWithoutCpMb - vramWithCpMb;
  const vramSavedPct = (vramSavedMb / Math.max(1, vramWithoutCpMb)) * 100.0;

  addStep(
    9,
    `Calculate GPU VRAM Savings: ${vramSavedMb} MB (${vramSavedPct.toFixed(1)}% memory reduction)`,
    `Standard forward pass requires ${vramWithoutCpMb} MB VRAM. Checkpointed forward pass requires only ${vramWithCpMb} MB VRAM.`,
    { vramWithoutCpMb, vramWithCpMb, vramSavedMb, vramSavedPct: Number(vramSavedPct.toFixed(1)) },
    scheduledElements.map((el) => ({ ...el, state: "sorted" })),
    {
      vramWithoutCpMb: `${vramWithoutCpMb} MB`,
      vramWithCpMb: `${vramWithCpMb} MB`,
      vramSavedMb: `${vramSavedMb} MB`,
    },
  );

  const omittedActivations = numLayers - checkpoints.length;
  const recomputedFlopsGflop = omittedActivations * recomputeFlopsPerLayerGflop;

  addStep(
    14,
    `Compute recomputed_flops_gflop = ${omittedActivations} × ${recomputeFlopsPerLayerGflop} = ${recomputedFlopsGflop.toFixed(1)} GFLOPs`,
    `Backward pass will recompute activations for ${omittedActivations} omitted layers, incurring +${recomputedFlopsGflop.toFixed(1)} GFLOPs compute overhead.`,
    {
      omittedActivations,
      recomputedFlopsGflop,
      vram_saved_mb: vramSavedMb,
    },
    scheduledElements.map((el) => ({ ...el, state: "sorted", pointers: ["CHECKPOINT READY"] })),
    {
      omittedLayers: omittedActivations,
      recomputedFlops: `${recomputedFlopsGflop.toFixed(1)} GFLOPs`,
    },
  );

  addStep(
    16,
    `return {checkpoints, vram_saved_mb=${vramSavedMb}MB, recomputed_flops_gflop=${recomputedFlopsGflop.toFixed(1)}}`,
    `Activation checkpointing complete. Saved ${vramSavedMb}MB VRAM at the cost of ${recomputedFlopsGflop.toFixed(1)} GFLOPs recomputation overhead.`,
    { vram_saved_mb: vramSavedMb, recomputed_flops_gflop: recomputedFlopsGflop, checkpoints_count: checkpoints.length },
    scheduledElements.map((el) => ({ ...el, state: "sorted", pointers: ["CHECKPOINT READY"] })),
    { vramSavedMb: `${vramSavedMb} MB`, recomputedFlops: `${recomputedFlopsGflop.toFixed(1)} GFLOPs` },
  );

  return steps;
};

const ACTIVATION_CHECKPOINTING_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "checkpoints = [i for i in range(num_layers)]",
    "vram_saved_mb = vram_with_cp_mb - vram_without_cp_mb",
    "recomputed_flops_gflop = num_layers * flop_per_layer",
    "saved_activations = num_layers // interval",
  ],
  hints: [
    {
      line: 5,
      hint: "Generate checkpoint layer indices by stepping through layers with the specified interval.",
    },
    {
      line: 9,
      hint: "VRAM savings equal the difference between storing all layer activations versus storing only checkpointed activations.",
    },
    {
      line: 14,
      hint: "Recomputation compute overhead scales linearly with the count of discarded non-checkpointed layers.",
    },
  ],
  lineExplanations: {
    1: "Defines activation checkpointing and recomputation schedule planner.",
    5: "Generates list of layer indices where forward activation tensors are retained in VRAM.",
    9: "Computes total GPU memory saved by discarding non-checkpoint layer activations.",
    14: "Derives extra FLOP compute overhead required to re-run forward pass during backpropagation.",
  },
};

export const activationCheckpointing: AlgorithmDefinition<ActivationCheckpointingInput> = {
  id: "activation-checkpointing",
  title: "Activation Checkpointing & Recomputation Scheduler",
  category: "ml_autograd_dags",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  description:
    "Trades FLOP compute for GPU VRAM by storing forward activations only at designated checkpoint layers and recomputing omitted activations on-the-fly during the backward pass.",
  constraints: [
    "numLayers > 0",
    "checkpointInterval > 0",
    "activationSizePerLayerMb >= 0",
    "recomputeFlopsPerLayerGflop >= 0",
  ],
  examples: [
    {
      kind: "basic",
      title: "Standard 8-Layer Checkpoint (Interval 2)",
      inputDisplay: "numLayers = 8, interval = 2, actSize = 500MB, flopPerLayer = 2.0 GFLOPs",
      outputDisplay:
        "checkpoints = [0, 2, 4, 6], VRAM saved = 2000MB (50.0%), recomputed = 8.0 GFLOPs",
      input: DEFAULT_ACTIVATION_CHECKPOINTING_INPUT,
      output:
        "{checkpoints: [0, 2, 4, 6], vram_saved_mb: 2000.0, vram_saved_pct: 50.0, recomputed_flops_gflop: 8.0}",
      explanation:
        "Stores activations at 4 checkpoint layers [0, 2, 4, 6]. Reduces VRAM usage from 4000MB to 2000MB, trading 8 GFLOPs recomputation.",
    },
    {
      kind: "complex",
      title: "Deep 16-Layer Model (Interval 4)",
      inputDisplay: "numLayers = 16, interval = 4, actSize = 1000MB, flopPerLayer = 5.0 GFLOPs",
      outputDisplay:
        "checkpoints = [0, 4, 8, 12], VRAM saved = 12000MB (75.0%), recomputed = 60.0 GFLOPs",
      input: {
        numLayers: 16,
        checkpointInterval: 4,
        activationSizePerLayerMb: 1000,
        recomputeFlopsPerLayerGflop: 5.0,
      },
      output:
        "{checkpoints: [0, 4, 8, 12], vram_saved_mb: 12000.0, vram_saved_pct: 75.0, recomputed_flops_gflop: 60.0}",
      explanation:
        "Interval of 4 retains only 4 out of 16 layers, yielding a 75% memory footprint reduction for large model training.",
    },
    {
      kind: "negative",
      title: "Invalid Zero Layer Input",
      inputDisplay: "numLayers = 0, interval = 2",
      outputDisplay: "checkpoints = [], VRAM saved = 0",
      input: {
        numLayers: 0,
        checkpointInterval: 2,
        activationSizePerLayerMb: 500,
        recomputeFlopsPerLayerGflop: 2.0,
      },
      output: "{checkpoints: [], vram_saved_mb: 0.0, recomputed_flops_gflop: 0.0}",
      explanation: "Zero layers provided yields empty schedule.",
    },
  ],
  code: ACTIVATION_CHECKPOINTING_CODE,
  timeComplexity: {
    best: "O(L)",
    average: "O(L)",
    worst: "O(L)",
  },
  spaceComplexity: "O(L)",
  complexityAnalysis: {
    time: "Traverses L layers to construct checkpoint schedule in O(L) time.",
    space: "Stores checkpoint index list of size O(L / interval).",
  },
  topicGuide: {
    overview:
      "Activation Checkpointing (Chen et al. 2016, PyTorch `torch.utils.checkpoint`) is a crucial VRAM optimization technique for training Large Language Models (LLMs). By storing intermediate activation tensors only at selected transformer layer boundaries during the forward pass, it avoids out-of-memory (OOM) errors at the cost of ~33% additional compute during backpropagation.",
    sections: [
      {
        heading: "Memory vs Compute Trade-off",
        body: "Standard backprop retains all forward activations in GPU memory until the corresponding layer's backward pass. For a 70B parameter model, activation VRAM far exceeds weight VRAM. Checkpointing discards inner activations, re-executing forward sub-graphs when backward gradients reach them.",
      },
      {
        heading: "Granularity Selection",
        body: "Interval 1 stores all layers (no recomputation). Selective checkpointing (checkpointing only FlashAttention / MLP layers) maximizes memory savings per extra FLOP spent.",
      },
    ],
    keyTerms: [
      {
        term: "Activation Checkpointing",
        definition:
          "Technique that drops intermediate forward activations and recomputes them during the backward pass to save VRAM.",
      },
      {
        term: "Recomputation Overhead",
        definition:
          "The extra FLOP compute spent re-executing forward passes during backpropagation.",
      },
    ],
  },
  trivia: ACTIVATION_CHECKPOINTING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra" }],
  defaultInput: DEFAULT_ACTIVATION_CHECKPOINTING_INPUT,
  generateSteps: generateActivationCheckpointingSteps,
};
