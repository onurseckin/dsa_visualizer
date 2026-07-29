import {
  arraySteps,
  defineDebuggingItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "stable_softmax";

const code = `import math

def stable_softmax(record):
    values = record["values"]
    if not values:
        return []
    maximum = max(values)
    exponentials = [math.exp(value - maximum) for value in values]
    total = sum(exponentials)
    return [round(value / total, 8) for value in exponentials]`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return softmax probabilities rounded to eight decimals after subtracting the maximum logit; return [] for empty input.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Subtract max(values) before exponentiation and return probabilities rounded to eight decimals; empty input returns [].",
  cases: [
    {
      id: "large-positive",
      label: "Large positive logits",
      input: { values: [1000, 1001] },
      expected: [0.26894142, 0.73105858],
      comparison: "deep-equal",
    },
    {
      id: "equal-logits",
      label: "Equal logits",
      input: { values: [5, 5, 5] },
      expected: [0.33333333, 0.33333333, 0.33333333],
      comparison: "deep-equal",
    },
    {
      id: "large-negative",
      label: "Large negative logits",
      input: { values: [-1000, -1001, -999] },
      expected: [0.24472847, 0.09003057, 0.66524096],
      comparison: "deep-equal",
    },
  ],
});

export const stableSoftmaxRepair = defineDebuggingItem({
  id: "stable-softmax-repair",
  title: "Stable Softmax Repair",
  topicIds: ["ml_numerical_tensors"],
  difficultyProfile: profile(1, 2, 2, 2),
  description:
    "Repair softmax by exploiting shift invariance so large-magnitude logits do not overflow.",
  objective:
    "Explain why subtracting the maximum preserves probabilities while bounding exponentials.",
  completionEvidence:
    "Passing probabilities for large positive, equal, and large negative logits with the max-shift invariant identified.",
  sources: [
    verifiedSource({
      label: "SciPy logsumexp",
      url: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.logsumexp.html",
    }),
    verifiedSource({
      label: "PyTorch numerical accuracy",
      url: "https://docs.pytorch.org/docs/stable/notes/numerical_accuracy.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 6,
        what: "Find the largest logit before exponentiation.",
        why: "Subtracting this constant preserves softmax ratios and caps the largest exponent at one.",
        values: [1000, 1001],
        activeIndices: [1],
        variables: { maximum: 1001 },
      },
      {
        codeLine: 7,
        what: "Exponentiate shifted logits [-1, 0].",
        why: "The bounded exponentials avoid overflow while retaining their relative weight.",
        values: [0.36787944, 1],
        activeIndices: [0, 1],
      },
      {
        codeLine: 9,
        what: "Normalize by the finite exponential sum.",
        why: "The resulting probabilities preserve order and sum to one within rounding.",
        values: [0.26894142, 0.73105858],
        completedIndices: [0, 1],
        variables: { probabilitySum: 1 },
      },
    ]),
  assessmentPayload: {
    variant: "overflowing-logits",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `import math

def stable_softmax(record):
    exponentials = [math.exp(value) for value in record["values"]]
    return [value / sum(exponentials) for value in exponentials]`,
    evidence: [
      {
        label: "Overflow",
        content: "math.exp(1000) exceeds the representable floating-point range.",
      },
      {
        label: "Invariant",
        content:
          "Adding or subtracting the same constant from every logit leaves softmax unchanged.",
      },
    ],
    failingTests: [
      "Large positive logits must produce finite probabilities.",
      "Large negative logits must preserve relative probabilities.",
    ],
    hints: [
      "Shift every logit by the same value.",
      "Choose a shift that makes every exponential argument non-positive.",
    ],
  },
});
