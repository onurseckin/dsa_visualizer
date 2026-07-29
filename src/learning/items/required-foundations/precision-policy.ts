import {
  defineScenarioItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  quantizationSteps,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "choose_precision_policy";

const code = `def choose_precision_policy(record):
    allowed = set(record["allowed"])
    policy = {}
    for operation in record["operations"]:
        requires_float32 = operation["sensitive"] or operation["dynamic_range"] > 10000
        if requires_float32 or "float16" not in allowed:
            policy[operation["name"]] = "float32"
        else:
            policy[operation["name"]] = "float16"
    return policy`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Choose float32 for sensitive or dynamic_range > 10000 operations; otherwise choose allowed float16, falling back to float32.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return an operation-name precision map using the exercise policy: sensitive or dynamic_range > 10000 requires float32; safe operations use float16 only when allowed.",
  cases: [
    {
      id: "mixed-policy",
      label: "Sensitive reduction among safe operations",
      input: {
        allowed: ["float16", "float32"],
        operations: [
          { name: "matmul", dynamic_range: 100, sensitive: false },
          { name: "normalization", dynamic_range: 20, sensitive: true },
          { name: "activation", dynamic_range: 50, sensitive: false },
        ],
      },
      expected: { matmul: "float16", normalization: "float32", activation: "float16" },
      comparison: "deep-equal",
    },
    {
      id: "large-range",
      label: "Large dynamic range",
      input: {
        allowed: ["float16", "float32"],
        operations: [
          { name: "logits", dynamic_range: 10001, sensitive: false },
          { name: "projection", dynamic_range: 500, sensitive: false },
        ],
      },
      expected: { logits: "float32", projection: "float16" },
      comparison: "deep-equal",
    },
    {
      id: "float32-only",
      label: "Runtime allows float32 only",
      input: {
        allowed: ["float32"],
        operations: [
          { name: "matmul", dynamic_range: 10, sensitive: false },
          { name: "loss", dynamic_range: 2, sensitive: true },
        ],
      },
      expected: { matmul: "float32", loss: "float32" },
      comparison: "deep-equal",
    },
  ],
});

const illustrativeBits = [
  { index: 0, value: "s", bitGroup: "sign" },
  { index: 1, value: "e", bitGroup: "exponent" },
  { index: 2, value: "m", bitGroup: "mantissa" },
] as const;

export const precisionPolicy = defineScenarioItem({
  id: "precision-policy",
  title: "Precision Policy",
  topicIds: ["ml_numerical_tensors"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Design a scoped mixed-precision policy that retains higher precision at sensitive or large-range boundaries.",
  objective:
    "Choose precision per operation from measured numerical constraints instead of applying a global dtype slogan.",
  completionEvidence:
    "A rubric-scored policy with validation gates and a passing deterministic policy checker across three changed workloads.",
  sources: [
    verifiedSource({
      label: "PyTorch numerical accuracy",
      url: "https://docs.pytorch.org/docs/stable/notes/numerical_accuracy.html",
    }),
    verifiedSource({
      label: "CUDA best practices",
      url: "https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html",
    }),
  ],
  prompt: {
    context:
      "A team wants float16 everywhere to reduce accelerator memory. Profiling shows the matmuls are stable, but a normalization reduction and large-range logits produce non-finite values.",
    question:
      "Define an operation-level precision policy, validation comparison, and rollback condition. Explain which measurements would justify a future change.",
    constraints: [
      "Do not claim one dtype is universally safe.",
      "Retain a float32 reference for numerical comparison.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "operation-boundary",
        label: "Operation boundary",
        description: "Selects precision per measured operation rather than globally.",
        points: 3,
        critical: true,
      },
      {
        id: "numerical-validation",
        label: "Numerical validation",
        description: "Compares finite outputs and task metrics with a higher-precision reference.",
        points: 2,
      },
      {
        id: "rollback",
        label: "Rollback condition",
        description: "Defines a concrete accuracy or non-finite rollback gate.",
        points: 2,
        critical: true,
      },
    ],
  },
  playground: {
    code,
    starterCode,
    execution,
    generateSteps: (input) =>
      inputEvidenceSteps(
        quantizationSteps([
          {
            codeLine: 2,
            what: "Declare the precisions the runtime actually supports.",
            why: "A policy cannot select a representation unavailable at the execution boundary.",
            originalValue: "float32 reference",
            bits: illustrativeBits,
            activeBitIndices: [0, 1, 2],
            title: "Reference precision",
          },
          {
            codeLine: 5,
            what: "Mark sensitive and large-dynamic-range operations.",
            why: "These measured boundaries retain float32 under the exercise policy.",
            originalValue: "normalization",
            quantizedValue: "float32",
            bits: illustrativeBits,
            activeBitIndices: [1, 2],
            title: "Sensitivity gate",
          },
          {
            codeLine: 9,
            what: "Assign lower precision only to operations that pass the gate.",
            why: "A mixed policy preserves explicit validation and rollback boundaries.",
            originalValue: "matmul",
            quantizedValue: "float16",
            bits: illustrativeBits,
            quantizedBitIndices: [0, 1, 2],
            title: "Scoped float16 selection",
            variables: { invariant: "precision follows measured risk" },
          },
        ]),
        input,
        ["allowed", "operations"],
        execution.cases,
      ),
  },
  assessmentPayload: {
    variant: "nonfinite-normalization",
    changedContext: true,
    isomorphicRetest: true,
    consequences:
      "A global low-precision policy can save memory while silently invalidating numerically sensitive operations.",
  },
});
