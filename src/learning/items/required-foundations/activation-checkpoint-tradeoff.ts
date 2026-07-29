import {
  arraySteps,
  defineCalculatorItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "checkpoint_tradeoff";

const code = `def checkpoint_tradeoff(record):
    layers = record["layers"]
    every = record["checkpoint_every"]
    stored = (layers + every - 1) // every
    recomputed = layers - stored
    memory_mb = stored * record["activation_mb"]
    return {
        "stored_activations": stored,
        "memory_mb": round(memory_mb, 6),
        "recomputed_layers": recomputed,
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Apply the exercise estimator: store ceil(layers/checkpoint_every) activations, recompute the rest, and return memory_mb.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Under this scoped estimator, stored=ceil(layers/checkpoint_every), memory_mb=stored*activation_mb, and recomputed_layers=layers-stored.",
  cases: [
    {
      id: "periodic-checkpoints",
      label: "Checkpoint every third layer",
      input: { layers: 12, checkpoint_every: 3, activation_mb: 8 },
      expected: { stored_activations: 4, memory_mb: 32, recomputed_layers: 8 },
      comparison: "deep-equal",
    },
    {
      id: "single-checkpoint",
      label: "One retained activation",
      input: { layers: 10, checkpoint_every: 10, activation_mb: 4 },
      expected: { stored_activations: 1, memory_mb: 4, recomputed_layers: 9 },
      comparison: "deep-equal",
    },
    {
      id: "store-every-layer",
      label: "No recomputation",
      input: { layers: 8, checkpoint_every: 1, activation_mb: 2.5 },
      expected: { stored_activations: 8, memory_mb: 20, recomputed_layers: 0 },
      comparison: "deep-equal",
    },
  ],
});

export const activationCheckpointTradeoff = defineCalculatorItem({
  id: "activation-checkpoint-tradeoff",
  title: "Activation Checkpoint Tradeoff",
  topicIds: ["ml_training_autodiff"],
  difficultyProfile: profile(2, 2, 3, 3),
  description:
    "Calculate a scoped activation-memory estimator and expose the corresponding recomputation count.",
  objective:
    "Explain activation checkpointing as an explicit memory-versus-recomputation tradeoff under stated assumptions.",
  completionEvidence:
    "Correct stored-activation, memory, and recomputation estimates for periodic and boundary policies.",
  sources: [
    verifiedSource({
      label: "PyTorch checkpoint documentation",
      url: "https://docs.pytorch.org/docs/stable/checkpoint.html",
    }),
    verifiedSource({
      label: "PyTorch performance tuning guide",
      url: "https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      arraySteps([
        {
          codeLine: 2,
          what: "Lay out twelve activation-producing layers.",
          why: "Without checkpointing, every layer activation remains available to the backward pass.",
          values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
          activeIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        },
        {
          codeLine: 4,
          what: "Retain one activation every three layers.",
          why: "Four retained boundaries reduce stored activation memory under the exercise estimator.",
          values: ["recompute", "recompute", "store", "recompute", "recompute", "store"],
          activeIndices: [2, 5],
          variables: { storedActivations: 4 },
        },
        {
          codeLine: 6,
          what: "Account for retained memory and recomputed layers.",
          why: "The memory reduction is purchased with eight additional forward-layer computations.",
          values: ["memory=32 MB", "recomputed=8"],
          completedIndices: [0, 1],
          variables: { checkpointEvery: 3, invariant: "less storage ↔ more recomputation" },
        },
      ]),
      input,
      ["layers", "checkpoint_every", "activation_mb"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "periodic-checkpoint-estimator",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Calculate retained activation memory under the representative checkpoint policy.",
    inputs: [
      { id: "stored", label: "Stored activations", defaultValue: "4" },
      { id: "activation_mb", label: "MiB per activation", unit: "MiB", defaultValue: "8" },
    ],
    result: { value: 32, unit: "MiB", tolerance: 0.000001 },
  },
});
