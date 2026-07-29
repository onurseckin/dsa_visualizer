import {
  arraySteps,
  defineScenarioItem,
  defineTraceItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../../authoring";

const convolutionCode = `def lower_convolution(record):
    image = record["image"]
    kernel = record["kernel"]
    stride = record.get("stride", 1)
    height, width = len(image), len(image[0])
    out_h = (height - kernel) // stride + 1
    out_w = (width - kernel) // stride + 1
    columns = []
    for row in range(out_h):
        for col in range(out_w):
            window = []
            for kr in range(kernel):
                for kc in range(kernel): window.append(image[row * stride + kr][col * stride + kc])
            columns.append(window)
    return {"output_shape": [out_h, out_w], "columns": columns, "lowered_elements": len(columns) * kernel * kernel}`;
const convolutionExecution = functionExecution({
  entrypoint: "lower_convolution",
  outputContract:
    "Return output shape, flattened im2col windows in row-major output order, and lowered element count for a valid single-channel convolution geometry.",
  cases: [
    {
      id: "two-by-two",
      label: "2x2 kernel over 3x3 image",
      input: {
        image: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        kernel: 2,
      },
      expected: {
        output_shape: [2, 2],
        columns: [
          [1, 2, 4, 5],
          [2, 3, 5, 6],
          [4, 5, 7, 8],
          [5, 6, 8, 9],
        ],
        lowered_elements: 16,
      },
      comparison: "deep-equal",
    },
    {
      id: "stride-two",
      label: "Stride changes output count",
      input: {
        image: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
        kernel: 2,
        stride: 2,
      },
      expected: {
        output_shape: [2, 2],
        columns: [
          [1, 2, 5, 6],
          [3, 4, 7, 8],
          [9, 10, 13, 14],
          [11, 12, 15, 16],
        ],
        lowered_elements: 16,
      },
      comparison: "deep-equal",
    },
    {
      id: "one-by-one",
      label: "One-by-one has one column",
      input: { image: [[7]], kernel: 1 },
      expected: { output_shape: [1, 1], columns: [[7]], lowered_elements: 1 },
      comparison: "deep-equal",
    },
  ],
});

interface ConvolutionInput {
  readonly image: readonly (readonly number[])[];
  readonly kernel: number;
  readonly stride?: number;
}

function convolutionTrace(record: ConvolutionInput) {
  const stride = record.stride ?? 1;
  const outputHeight = Math.floor((record.image.length - record.kernel) / stride) + 1;
  const outputWidth = Math.floor((record.image[0].length - record.kernel) / stride) + 1;
  const windows: { row: number; col: number; values: number[] }[] = [];
  for (let row = 0; row < outputHeight; row += 1) {
    for (let col = 0; col < outputWidth; col += 1) {
      const values: number[] = [];
      for (let kernelRow = 0; kernelRow < record.kernel; kernelRow += 1) {
        for (let kernelCol = 0; kernelCol < record.kernel; kernelCol += 1) {
          values.push(record.image[row * stride + kernelRow][col * stride + kernelCol]);
        }
      }
      windows.push({ row, col, values });
    }
  }
  return { stride, outputHeight, outputWidth, windows };
}

export const convolutionLoweringTrace = defineTraceItem({
  id: "convolution-lowering-trace",
  title: "Convolution lowering trace",
  topicIds: ["ml_vision_sequence_models"],
  difficultyProfile: profile(3, 3, 2, 3),
  description:
    "Trace valid convolution geometry and im2col lowering so output positions, receptive fields, and duplicated lowered storage are concrete.",
  objective:
    "Derive output windows and memory expansion without presenting this scalar Python trace as a tensor-library kernel or accelerator measurement.",
  completionEvidence:
    "The learner predicts output shape, receptive-field windows, and lowered element count for changing image, kernel, and stride inputs.",
  sources: [
    verifiedSource({
      label: "PyTorch Unfold API",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.Unfold.html",
    }),
    verifiedSource({
      label: "CS231n convolutional networks notes",
      url: "https://cs231n.github.io/convolutional-networks/",
    }),
  ],
  code: convolutionCode,
  starterCode: semanticStarter({
    entrypoint: "lower_convolution",
    parameters: ["record"],
    contract:
      "Compute valid convolution output geometry and row-major im2col windows using only list operations.",
  }),
  execution: convolutionExecution,
  generateSteps: (input) => {
    const record = input as ConvolutionInput;
    const trace = convolutionTrace(record);
    return arraySteps([
      {
        codeLine: 6,
        what: "Derive the valid output-grid dimensions from image, kernel, and stride.",
        why: "Output positions define which receptive fields exist before any lowering is materialized.",
        values: [
          `input=${record.image.length}x${record.image[0].length}`,
          `kernel=${record.kernel}`,
          `stride=${trace.stride}`,
          `output=${trace.outputHeight}x${trace.outputWidth}`,
        ],
        activeIndices: [3],
        completedIndices: [0, 1, 2],
      },
      {
        codeLine: 9,
        what: "Select one output position and its receptive-field origin.",
        why: "Each output coordinate maps to a specific overlapping patch of the input image.",
        values: trace.windows.map(
          (window) =>
            `out(${window.row},${window.col})->in(${window.row * trace.stride},${window.col * trace.stride})`,
        ),
        activeIndices: trace.windows.map((_, index) => index),
      },
      {
        codeLine: 12,
        what: "Flatten that receptive field into one lowered column.",
        why: "Lowering exposes duplicate values explicitly so its memory cost can be counted.",
        values: trace.windows.map(
          (window) => `(${window.row},${window.col})=[${window.values.join(",")}]`,
        ),
        activeIndices: trace.windows.map((_, index) => index),
      },
      {
        codeLine: 16,
        what: "Report all lowered elements alongside the output shape.",
        why: "The count distinguishes logical convolution output from the temporary lowered representation.",
        values: [
          `positions=${trace.windows.length}`,
          `kernel-area=${record.kernel * record.kernel}`,
          `lowered=${trace.windows.length * record.kernel * record.kernel}`,
        ],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
    ]);
  },
  assessmentPayload: {
    variant: "changed-image-kernel-stride",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace im2col windows after changing geometry.",
    currentState: "single-channel valid convolution",
    referenceNextState: "each output position owns one flattened receptive-field column",
  },
});

const bpttCode = `def trace_bptt(record):
    locals_ = record["local_gradients"]
    upstream = record.get("loss_gradient", 1.0)
    gradients = []
    current = upstream
    for local in reversed(locals_):
        current *= local
        gradients.append(round(current, 6))
    gradients.reverse()
    return {"state_gradients": gradients, "initial_state_gradient": gradients[0] if gradients else round(upstream, 6), "vanishing": abs(gradients[0]) < record.get("vanishing_threshold", 0.01) if gradients else False}`;
const bpttExecution = functionExecution({
  entrypoint: "trace_bptt",
  outputContract:
    "Return scalar state gradients through a supplied recurrent chain, the earliest-state gradient, and a threshold-based vanishing flag. This traces multiplication only; it does not train an RNN.",
  cases: [
    {
      id: "vanishing",
      label: "Repeated small local gradients vanish",
      input: { local_gradients: [0.5, 0.5, 0.5], loss_gradient: 1, vanishing_threshold: 0.2 },
      expected: {
        state_gradients: [0.125, 0.25, 0.5],
        initial_state_gradient: 0.125,
        vanishing: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "stable",
      label: "Unit chain remains stable",
      input: { local_gradients: [1, 1], loss_gradient: 2, vanishing_threshold: 0.1 },
      expected: { state_gradients: [2, 2], initial_state_gradient: 2, vanishing: false },
      comparison: "deep-equal",
    },
    {
      id: "empty",
      label: "No recurrent steps preserve upstream",
      input: { local_gradients: [], loss_gradient: 3, vanishing_threshold: 0.1 },
      expected: { state_gradients: [], initial_state_gradient: 3, vanishing: false },
      comparison: "deep-equal",
    },
  ],
});

interface BpttInput {
  readonly local_gradients: readonly number[];
  readonly loss_gradient: number;
  readonly vanishing_threshold: number;
}

function bpttGradients(record: BpttInput): number[] {
  let current = record.loss_gradient;
  const reversed: number[] = [];
  for (const local of [...record.local_gradients].reverse()) {
    current *= local;
    reversed.push(Number(current.toFixed(6)));
  }
  return reversed.reverse();
}

export const recurrentBpttTrace = defineTraceItem({
  id: "recurrent-bptt-trace",
  title: "Recurrent BPTT trace",
  topicIds: ["ml_vision_sequence_models"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Trace scalar gradient multiplication backwards through an unrolled recurrent chain and make vanishing behavior inspectable.",
  objective:
    "Reason about backpropagation-through-time as a product of local derivatives without overclaiming that a scalar educational trace captures full recurrent training dynamics.",
  completionEvidence:
    "The learner calculates every earlier-state gradient and recognizes when repeated contractive local gradients cross a stated vanishing threshold.",
  sources: [
    verifiedSource({
      label: "Deep Learning Book: recurrent networks",
      url: "https://www.deeplearningbook.org/contents/rnn.html",
    }),
    verifiedSource({
      label: "Learning Long-Term Dependencies with Gradient Descent is Difficult",
      url: "https://doi.org/10.1109/72.279181",
    }),
  ],
  code: bpttCode,
  starterCode: semanticStarter({
    entrypoint: "trace_bptt",
    parameters: ["record"],
    contract:
      "Multiply supplied local derivatives backward through a recurrent chain and report state gradients.",
  }),
  execution: bpttExecution,
  generateSteps: (input) => {
    const record = input as BpttInput;
    const gradients = bpttGradients(record);
    const initial = gradients[0] ?? record.loss_gradient;
    return arraySteps([
      {
        codeLine: 2,
        what: "Read the local derivative associated with each unrolled state transition.",
        why: "BPTT carries loss sensitivity through every temporal transition in reverse order.",
        values:
          record.local_gradients.length > 0
            ? record.local_gradients.map((gradient, index) => `t${index}:local=${gradient}`)
            : ["no recurrent transitions"],
        activeIndices: record.local_gradients.map((_, index) => index),
      },
      {
        codeLine: 5,
        what: "Start from the final loss gradient.",
        why: "Reverse-mode differentiation begins with the sensitivity supplied by the loss at the end of the unroll.",
        values: [
          `loss-gradient=${record.loss_gradient}`,
          `steps=${record.local_gradients.length}`,
          `threshold=${record.vanishing_threshold}`,
        ],
        activeIndices: [1],
        completedIndices: [0, 2],
      },
      {
        codeLine: 7,
        what: "Multiply by each local derivative while walking backward.",
        why: "Repeated values below one shrink gradient magnitude across long temporal paths.",
        values:
          gradients.length > 0
            ? gradients.map((gradient, index) => `state${index}:gradient=${gradient}`)
            : [`upstream-only=${record.loss_gradient}`],
        activeIndices: gradients.map((_, index) => index),
      },
      {
        codeLine: 10,
        what: "Compare the earliest gradient with an explicit threshold.",
        why: "A threshold makes the trace's vanishing observation inspectable rather than a qualitative label.",
        values: [
          `initial=${initial}`,
          `threshold=${record.vanishing_threshold}`,
          `vanishing=${gradients.length > 0 && Math.abs(initial) < record.vanishing_threshold}`,
        ],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
    ]);
  },
  assessmentPayload: {
    variant: "changed-local-gradient-chain",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace gradients for a changed recurrent chain.",
    currentState: "scalar unrolled recurrence",
    referenceNextState: "earlier gradients are products of later local derivatives",
  },
});

const familyCode = `def validate_vision_sequence_plan(plan):
    missing = []
    if plan.get("family") not in ("convolutional", "recurrent", "transformer", "temporal-convolution"): missing.append("family")
    if plan.get("latency_ms", float("inf")) > plan.get("latency_budget_ms", -1): missing.append("latency_budget")
    if plan.get("state_requirement") not in ("stateless", "session-state", "windowed"): missing.append("state_requirement")
    if not plan.get("evaluation_slices"): missing.append("evaluation_slices")
    if not plan.get("input_contract_version"): missing.append("input_contract_version")
    missing.sort()
    return {"valid": not missing, "missing": missing, "plan_artifact": "representation-constraints"}`;
const familyExecution = functionExecution({
  entrypoint: "validate_vision_sequence_plan",
  outputContract:
    "Return whether a vision/sequence model-family plan supplies a family, latency comparison, state requirement, evaluation slices, and versioned input contract. It does not assert that one family is correct.",
  cases: [
    {
      id: "vision-plan",
      label: "Stateless vision artifact",
      input: {
        family: "convolutional",
        latency_ms: 12,
        latency_budget_ms: 20,
        state_requirement: "stateless",
        evaluation_slices: ["camera"],
        input_contract_version: "image-v3",
      },
      expected: { valid: true, missing: [], plan_artifact: "representation-constraints" },
      comparison: "deep-equal",
    },
    {
      id: "sequence-plan",
      label: "Stateful sequence artifact",
      input: {
        family: "recurrent",
        latency_ms: 4,
        latency_budget_ms: 10,
        state_requirement: "session-state",
        evaluation_slices: ["sequence-length"],
        input_contract_version: "events-v2",
      },
      expected: { valid: true, missing: [], plan_artifact: "representation-constraints" },
      comparison: "deep-equal",
    },
    {
      id: "incomplete-plan",
      label: "Unmeasured artifact",
      input: {
        family: "cnn",
        latency_ms: 50,
        latency_budget_ms: 10,
        state_requirement: "global",
        evaluation_slices: [],
        input_contract_version: "",
      },
      expected: {
        valid: false,
        missing: [
          "evaluation_slices",
          "family",
          "input_contract_version",
          "latency_budget",
          "state_requirement",
        ],
        plan_artifact: "representation-constraints",
      },
      comparison: "deep-equal",
    },
  ],
});

interface VisionSequencePlanInput {
  readonly family: string;
  readonly latency_ms: number;
  readonly latency_budget_ms: number;
  readonly state_requirement: string;
  readonly evaluation_slices: readonly string[];
  readonly input_contract_version: string;
}

function visionSequencePlanFailures(plan: VisionSequencePlanInput): string[] {
  const missing: string[] = [];
  if (
    !["convolutional", "recurrent", "transformer", "temporal-convolution"].includes(plan.family)
  ) {
    missing.push("family");
  }
  if (plan.latency_ms > plan.latency_budget_ms) missing.push("latency_budget");
  if (!["stateless", "session-state", "windowed"].includes(plan.state_requirement)) {
    missing.push("state_requirement");
  }
  if (plan.evaluation_slices.length === 0) missing.push("evaluation_slices");
  if (!plan.input_contract_version) missing.push("input_contract_version");
  return missing.sort();
}

export const visionSequenceSystemSelection = defineScenarioItem({
  id: "vision-sequence-system-selection",
  title: "Vision and sequence system selection",
  topicIds: ["ml_vision_sequence_models"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Choose a vision or sequence representation/model family from data, accuracy, latency, state, and serving constraints.",
  objective:
    "Make an evidence-backed representation decision while separating system requirements from assumptions about architecture popularity or vendor execution.",
  completionEvidence:
    "The rubric assesses the proposed model-family tradeoff; the scratchpad validates only measurable plan fields and never claims a unique design answer.",
  sources: [
    verifiedSource({
      label: "PyTorch convolution documentation",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html",
    }),
    verifiedSource({
      label: "Deep Learning Book: recurrent networks",
      url: "https://www.deeplearningbook.org/contents/rnn.html",
    }),
  ],
  prompt: {
    context:
      "A product team must choose between image classification and irregular event-sequence detection while working within a tail-latency budget and explicit state-retention limits.",
    question:
      "Choose a representation/model family and serving boundary, then explain which data or operating evidence would change the decision.",
    constraints: [
      "Address input versioning, state, tail latency, and slice evaluation.",
      "Compare at least one viable alternative.",
      "Treat the executable scratchpad as a structural artifact validator, not a model benchmark.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "representation",
        label: "Representation choice",
        description:
          "Connects input structure and task signal to the proposed family and an alternative.",
        points: 3,
        critical: true,
      },
      {
        id: "serving",
        label: "Serving boundary",
        description: "Addresses state, latency, and input-version handling.",
        points: 3,
        critical: true,
      },
      {
        id: "evaluation",
        label: "Evaluation plan",
        description: "Names accuracy and operational slices that could disconfirm the proposal.",
        points: 2,
      },
    ],
  },
  playground: {
    code: familyCode,
    starterCode: semanticStarter({
      entrypoint: "validate_vision_sequence_plan",
      parameters: ["plan"],
      contract:
        "Validate measurable representation-plan fields while leaving the qualitative family choice to the rubric.",
    }),
    execution: familyExecution,
    generateSteps: (input) => {
      const plan = input as VisionSequencePlanInput;
      const failures = visionSequencePlanFailures(plan);
      return arraySteps([
        {
          codeLine: 3,
          what: "Check that the plan names a model-family alternative.",
          why: "An engineering decision cannot be reviewed when the representation is left implicit.",
          values: [
            `family=${plan.family}`,
            `supported=${["convolutional", "recurrent", "transformer", "temporal-convolution"].includes(plan.family)}`,
            `input=${plan.input_contract_version || "missing"}`,
          ],
          activeIndices: [0],
        },
        {
          codeLine: 4,
          what: "Compare measured latency against the serving budget.",
          why: "Architecture quality must be evaluated at the boundary where the product has a response-time obligation.",
          values: [
            `measured=${plan.latency_ms}ms`,
            `budget=${plan.latency_budget_ms}ms`,
            `feasible=${plan.latency_ms <= plan.latency_budget_ms}`,
          ],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
        {
          codeLine: 5,
          what: "Declare whether state is stateless, session-scoped, or windowed.",
          why: "State ownership determines recovery, privacy, and scaling behavior for sequence workloads.",
          values: [
            `state=${plan.state_requirement}`,
            `slices=${plan.evaluation_slices.join(",") || "none"}`,
            `input=${plan.input_contract_version || "missing"}`,
          ],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
        {
          codeLine: 9,
          what: "Return a structural plan result instead of an architecture verdict.",
          why: "The rubric evaluates the changed-context rationale and the scratchpad validates its quantifiable artifacts.",
          values: [
            `valid=${failures.length === 0}`,
            `missing=${failures.join(",") || "none"}`,
            `family=${plan.family}`,
          ],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
      ]);
    },
  },
  assessmentPayload: {
    variant: "changed-input-state-latency",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["Convolutional", "Recurrent", "Transformer", "Temporal convolution"],
    consequences:
      "No family is automatically correct; the scenario is rubric-scored and the executable validator checks only explicit plan constraints.",
  },
});
