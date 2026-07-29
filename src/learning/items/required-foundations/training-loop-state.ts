import {
  arraySteps,
  defineDebuggingItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "execute_training_schedule";

const code = `def execute_training_schedule(record):
    checkpoint = record["checkpoint"]
    parameter = float(checkpoint["parameter"])
    velocity = float(checkpoint["velocity"])
    optimizer_step = int(checkpoint["optimizer_step"])
    accumulated_gradient = float(checkpoint["accumulated_gradient"])
    accumulation_count = int(checkpoint["accumulation_count"])
    mode = record["mode"]
    events = [f"{mode}_mode"]
    if mode == "train" and accumulation_count == 0:
        events.append("zero_grad")
    losses = []
    for batch in record["batches"]:
        prediction = parameter * batch["input"]
        loss = (prediction - batch["target"]) ** 2
        losses.append(round(loss, 8))
        events.extend(["forward", "loss"])
        if mode == "eval":
            continue
        gradient = 2 * (prediction - batch["target"]) * batch["input"]
        accumulated_gradient += gradient
        accumulation_count += 1
        events.extend(["backward", "accumulated_gradient"])
        if accumulation_count == record["accumulate_steps"]:
            averaged_gradient = accumulated_gradient / accumulation_count
            velocity = record["momentum"] * velocity + averaged_gradient
            parameter -= record["learning_rate"] * velocity
            optimizer_step += 1
            events.append("optimizer_step")
            accumulated_gradient = 0.0
            accumulation_count = 0
            events.append("zero_grad")
    return {
        "losses": losses,
        "events": events,
        "checkpoint": {
            "parameter": round(parameter, 8),
            "velocity": round(velocity, 8),
            "optimizer_step": optimizer_step,
            "accumulated_gradient": round(accumulated_gradient, 8),
            "accumulation_count": accumulation_count,
            "mode": mode,
        },
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Execute train/eval mode, forward, loss, backward, accumulated_gradient, optimizer_step, zero_grad ordering and return the resumable checkpoint.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return {losses, events, checkpoint}. Training events are train_mode, optional cycle-opening zero_grad, then forward, loss, backward, accumulated_gradient per batch; at accumulate_steps apply optimizer_step then zero_grad. Eval emits eval_mode, forward, loss only. Checkpoint preserves parameter, velocity, optimizer_step, partial accumulated_gradient/count, and mode.",
  cases: [
    {
      id: "single-train-step",
      label: "One complete training step",
      input: {
        checkpoint: {
          parameter: 1,
          velocity: 0,
          optimizer_step: 0,
          accumulated_gradient: 0,
          accumulation_count: 0,
          mode: "train",
        },
        mode: "train",
        batches: [{ input: 2, target: 0 }],
        accumulate_steps: 1,
        learning_rate: 0.1,
        momentum: 0,
      },
      expected: {
        losses: [4],
        events: [
          "train_mode",
          "zero_grad",
          "forward",
          "loss",
          "backward",
          "accumulated_gradient",
          "optimizer_step",
          "zero_grad",
        ],
        checkpoint: {
          parameter: 0.2,
          velocity: 8,
          optimizer_step: 1,
          accumulated_gradient: 0,
          accumulation_count: 0,
          mode: "train",
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "gradient-accumulation",
      label: "Two microbatches form one optimizer step",
      input: {
        checkpoint: {
          parameter: 1,
          velocity: 0,
          optimizer_step: 0,
          accumulated_gradient: 0,
          accumulation_count: 0,
          mode: "train",
        },
        mode: "train",
        batches: [
          { input: 1, target: 0 },
          { input: 2, target: 0 },
        ],
        accumulate_steps: 2,
        learning_rate: 0.1,
        momentum: 0,
      },
      expected: {
        losses: [1, 4],
        events: [
          "train_mode",
          "zero_grad",
          "forward",
          "loss",
          "backward",
          "accumulated_gradient",
          "forward",
          "loss",
          "backward",
          "accumulated_gradient",
          "optimizer_step",
          "zero_grad",
        ],
        checkpoint: {
          parameter: 0.5,
          velocity: 5,
          optimizer_step: 1,
          accumulated_gradient: 0,
          accumulation_count: 0,
          mode: "train",
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "resume-partial-accumulation",
      label: "Checkpoint resumes partial gradient accumulation",
      input: {
        checkpoint: {
          parameter: 1,
          velocity: 0,
          optimizer_step: 5,
          accumulated_gradient: 2,
          accumulation_count: 1,
          mode: "train",
        },
        mode: "train",
        batches: [{ input: 1, target: 0 }],
        accumulate_steps: 2,
        learning_rate: 0.1,
        momentum: 0,
      },
      expected: {
        losses: [1],
        events: [
          "train_mode",
          "forward",
          "loss",
          "backward",
          "accumulated_gradient",
          "optimizer_step",
          "zero_grad",
        ],
        checkpoint: {
          parameter: 0.8,
          velocity: 2,
          optimizer_step: 6,
          accumulated_gradient: 0,
          accumulation_count: 0,
          mode: "train",
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "evaluation-mode",
      label: "Evaluation performs no backward or optimizer mutation",
      input: {
        checkpoint: {
          parameter: 2,
          velocity: 0.5,
          optimizer_step: 3,
          accumulated_gradient: 1.25,
          accumulation_count: 1,
          mode: "train",
        },
        mode: "eval",
        batches: [{ input: 3, target: 5 }],
        accumulate_steps: 2,
        learning_rate: 0.1,
        momentum: 0.9,
      },
      expected: {
        losses: [1],
        events: ["eval_mode", "forward", "loss"],
        checkpoint: {
          parameter: 2,
          velocity: 0.5,
          optimizer_step: 3,
          accumulated_gradient: 1.25,
          accumulation_count: 1,
          mode: "eval",
        },
      },
      comparison: "deep-equal",
    },
  ],
});

export const trainingLoopState = defineDebuggingItem({
  id: "training-loop-state",
  title: "Training Loop State",
  topicIds: ["ml_training_autodiff"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Repair an ordered train/eval state machine spanning forward, loss, backward, gradient accumulation, optimizer updates, gradient reset, and resumable checkpoints.",
  objective:
    "Preserve the ordering and state boundaries that distinguish training microbatches, optimizer steps, evaluation, and checkpoint resume.",
  completionEvidence:
    "Passing single-step, accumulated, partially resumed, and evaluation schedules with every state transition justified.",
  sources: [
    verifiedSource({
      label: "PyTorch autograd mechanics",
      url: "https://docs.pytorch.org/docs/main/notes/autograd.html",
    }),
    verifiedSource({
      label: "PyTorch zeroing gradients recipe",
      url: "https://docs.pytorch.org/tutorials/recipes/recipes/zeroing_out_gradients.html",
    }),
    verifiedSource({
      label: "PyTorch Module train and eval modes",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.Module.html",
    }),
    verifiedSource({
      label: "PyTorch saving and loading models",
      url: "https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      arraySteps([
        {
          codeLine: 8,
          what: "Enter train mode from the checkpointed execution state.",
          why: "Mode controls whether this schedule records gradients and updates parameters.",
          values: ["train_mode", "parameter=1", "optimizer_step=0"],
          activeIndices: [0],
        },
        {
          codeLine: 10,
          what: "Zero gradients before a fresh accumulation cycle.",
          why: "A new cycle must not inherit stale gradients, while a partial resumed cycle must.",
          values: ["zero_grad", "accumulated=0", "count=0"],
          activeIndices: [0, 1, 2],
        },
        {
          codeLine: 14,
          what: "Run the forward pass for the current microbatch.",
          why: "The prediction uses the parameter version active before any optimizer update.",
          values: ["input=2", "parameter=1", "prediction=2"],
          activeIndices: [0, 1, 2],
        },
        {
          codeLine: 15,
          what: "Compute the loss from prediction and target.",
          why: "Backward differentiates this scalar loss with respect to the active parameter.",
          values: ["prediction=2", "target=0", "loss=4"],
          activeIndices: [2],
        },
        {
          codeLine: 20,
          what: "Run backward to obtain the microbatch gradient.",
          why: "Training mode propagates the loss derivative; evaluation mode stops before this step.",
          values: ["loss=4", "backward", "gradient=8"],
          activeIndices: [1, 2],
        },
        {
          codeLine: 21,
          what: "Accumulate the gradient and microbatch count.",
          why: "The optimizer must wait until the configured accumulation boundary is reached.",
          values: ["accumulated_gradient=8", "count=1", "target=1"],
          activeIndices: [0, 1, 2],
        },
        {
          codeLine: 27,
          what: "Apply the optimizer step and then clear gradients.",
          why: "Updating before backward or clearing before the step would use the wrong gradient state.",
          values: ["optimizer_step=1", "parameter=0.2", "zero_grad"],
          completedIndices: [0, 1, 2],
        },
        {
          codeLine: 34,
          what: "Return the complete resumable checkpoint.",
          why: "Parameter, optimizer velocity, step, partial accumulation, count, and mode must resume together.",
          values: [
            "parameter",
            "velocity",
            "optimizer_step",
            "accumulated_gradient",
            "accumulation_count",
            "mode",
          ],
          completedIndices: [0, 1, 2, 3, 4, 5],
          variables: { invariant: "ordered events + complete checkpoint state" },
        },
      ]),
      input,
      ["mode", "batches", "accumulate_steps"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "misordered-accumulation-and-eval",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def execute_training_schedule(record):
    checkpoint = record["checkpoint"]
    parameter = checkpoint["parameter"]
    for batch in record["batches"]:
        parameter -= record["learning_rate"]
    return {"checkpoint": {"parameter": parameter, "mode": "train"}}`,
    evidence: [
      {
        label: "Misordered update",
        content:
          "The optimizer mutates parameters before forward, loss, and backward produce a gradient.",
      },
      {
        label: "Accumulation reset",
        content:
          "Every microbatch clears gradients, so no configured accumulation boundary is reached.",
      },
      {
        label: "Evaluation mutation",
        content: "Evaluation batches incorrectly execute backward and optimizer updates.",
      },
      {
        label: "Incomplete checkpoint",
        content: "Velocity, optimizer step, partial gradient/count, and mode disappear on resume.",
      },
    ],
    failingTests: [
      "A fresh train cycle orders zero_grad before forward/loss/backward and optimizer_step.",
      "Multiple microbatches accumulate before one averaged optimizer step.",
      "A partial accumulated_gradient checkpoint resumes without an opening zero_grad.",
      "eval_mode performs forward and loss only.",
      "The returned checkpoint preserves every optimizer, accumulation, progress, and mode field.",
    ],
    hints: [
      "Treat train/eval as distinct transition paths.",
      "Clear gradients at cycle boundaries, not between accumulating microbatches.",
      "Checkpoint the state needed to produce the same next optimizer step after resume.",
    ],
    completion: {
      variant: "training-state-machine-completion",
      changedContext: true,
      isomorphicRetest: true,
      prompt:
        "Complete the missing forward, loss, backward, accumulation, optimizer, reset, and checkpoint transitions.",
      context:
        "A run may resume mid-accumulation and may switch to evaluation without changing optimizer state.",
      requiredConcepts: [
        "train_mode and eval_mode",
        "forward then loss then backward",
        "gradient accumulation boundary",
        "optimizer_step then zero_grad",
        "complete checkpoint state",
      ],
      consequencePrompt:
        "Explain how each ordering or checkpoint omission changes the next parameter update.",
    },
  },
});
