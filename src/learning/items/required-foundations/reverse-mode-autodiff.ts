import {
  defineTraceItem,
  functionExecution,
  graphSteps,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "reverse_mode";

const code = `def reverse_mode(record):
    x = record["x"]
    y = record["y"]
    product = x * y
    total = product + x
    loss = total * total

    grad_loss = 1
    grad_total = grad_loss * 2 * total
    grad_product = grad_total
    grad_x = grad_total + grad_product * y
    grad_y = grad_product * x
    return {
        "loss": loss,
        "gradients": {"x": grad_x, "y": grad_y},
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "For loss=(x*y+x)^2, run the forward graph and return {loss, gradients:{x,y}} from one reverse accumulation.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Evaluate loss=(x*y+x)^2 and return its value plus reverse-mode gradients with respect to x and y.",
  cases: [
    {
      id: "positive-values",
      label: "Positive inputs",
      input: { x: 2, y: 3 },
      expected: { loss: 64, gradients: { x: 64, y: 32 } },
      comparison: "deep-equal",
    },
    {
      id: "negative-x",
      label: "Negative x",
      input: { x: -1, y: 2 },
      expected: { loss: 9, gradients: { x: -18, y: 6 } },
      comparison: "deep-equal",
    },
    {
      id: "zero-x",
      label: "Zero x",
      input: { x: 0, y: 5 },
      expected: { loss: 0, gradients: { x: 0, y: 0 } },
      comparison: "deep-equal",
    },
  ],
});

const nodes = [
  { id: "x", label: "x=2" },
  { id: "y", label: "y=3" },
  { id: "product", label: "x·y=6" },
  { id: "total", label: "+x=8" },
  { id: "loss", label: "square=64" },
] as const;
const edges = [
  { from: "x", to: "product" },
  { from: "y", to: "product" },
  { from: "product", to: "total" },
  { from: "x", to: "total" },
  { from: "total", to: "loss" },
] as const;

export const reverseModeAutodiff = defineTraceItem({
  id: "reverse-mode-autodiff",
  title: "Reverse-Mode Autodiff",
  topicIds: ["ml_training_autodiff"],
  difficultyProfile: profile(2, 3, 3, 2),
  description:
    "Trace a scalar computation graph forward, seed the loss cotangent, and accumulate gradients backward at a shared input.",
  objective:
    "Apply the chain rule in reverse topological order and sum gradient contributions at fan-out nodes.",
  completionEvidence:
    "Correct loss and x/y gradients for positive, negative, and zero boundaries with the accumulation step explained.",
  sources: [
    verifiedSource({
      label: "PyTorch autograd mechanics",
      url: "https://docs.pytorch.org/docs/main/notes/autograd.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      graphSteps([
        {
          codeLine: 4,
          what: "Evaluate the computation graph in forward order.",
          why: "Reverse-mode derivatives reuse the stored local forward values.",
          nodes,
          edges,
          activeNodeIds: ["x", "y", "product", "total"],
          traversedEdgeIndexes: [0, 1, 2, 3],
        },
        {
          codeLine: 8,
          what: "Seed the scalar loss gradient with one.",
          why: "The reverse pass computes how each upstream value changes this scalar output.",
          nodes,
          edges,
          activeNodeIds: ["loss"],
          traversedEdgeIndexes: [4],
          variables: { gradLoss: 1, gradTotal: 16 },
        },
        {
          codeLine: 12,
          what: "Propagate backward and add both contributions to x.",
          why: "x influences the loss through both the product path and the direct addition path.",
          nodes,
          edges,
          completedNodeIds: ["x", "y", "product", "total", "loss"],
          traversedEdgeIndexes: [0, 1, 2, 3, 4],
          variables: { gradX: 64, gradY: 32, invariant: "fan-out gradients sum" },
        },
      ]),
      input,
      ["x", "y"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "shared-input-gradient",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict the next reverse accumulation at the shared x node.",
    currentState: "loss=64, grad_total=16, x=2, y=3",
    referenceNextState: "grad_x = 16 + 16*3 = 64; grad_y = 16*2 = 32",
  },
});
