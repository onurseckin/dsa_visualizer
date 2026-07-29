import {
  arraySteps,
  defineDebuggingItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "advance_training_state";

const code = `def advance_training_state(record):
    state = record["state"]
    velocity = (
        record["momentum"] * state["velocity"]
        + record["gradient"]
    )
    parameter = state["parameter"] - record["learning_rate"] * velocity
    return {
        "parameter": round(parameter, 8),
        "velocity": round(velocity, 8),
        "step": state["step"] + 1,
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Advance momentum SGD state once and return parameter, velocity, and incremented step rounded to eight decimals.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Use velocity=momentum*old_velocity+gradient and parameter=old_parameter-learning_rate*velocity; increment step once and round floats to eight decimals.",
  cases: [
    {
      id: "first-step",
      label: "First momentum step",
      input: {
        state: { parameter: 1, velocity: 0, step: 0 },
        gradient: 0.5,
        learning_rate: 0.1,
        momentum: 0.9,
      },
      expected: { parameter: 0.95, velocity: 0.5, step: 1 },
      comparison: "deep-equal",
    },
    {
      id: "velocity-cancels",
      label: "Gradient cancels carried velocity",
      input: {
        state: { parameter: 0.5, velocity: 0.2, step: 4 },
        gradient: -0.1,
        learning_rate: 0.01,
        momentum: 0.5,
      },
      expected: { parameter: 0.5, velocity: 0, step: 5 },
      comparison: "deep-equal",
    },
    {
      id: "resumed-step",
      label: "Resumed state carries momentum and step",
      input: {
        state: { parameter: 2, velocity: 1, step: 10 },
        gradient: 0.5,
        learning_rate: 0.2,
        momentum: 0.9,
      },
      expected: { parameter: 1.72, velocity: 1.4, step: 11 },
      comparison: "deep-equal",
    },
  ],
});

export const trainingLoopState = defineDebuggingItem({
  id: "training-loop-state",
  title: "Training Loop State",
  topicIds: ["ml_training_autodiff"],
  difficultyProfile: profile(2, 2, 3, 2),
  description:
    "Repair a one-step training transition so parameter, optimizer velocity, and global step resume together.",
  objective:
    "Treat optimizer and progress values as one checkpointed state transition rather than independent counters.",
  completionEvidence:
    "Passing first-step, cancellation, and resumed-state transitions plus a completed state-update scaffold.",
  sources: [
    verifiedSource({
      label: "PyTorch performance tuning guide",
      url: "https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html",
    }),
    verifiedSource({
      label: "PyTorch checkpoint documentation",
      url: "https://docs.pytorch.org/docs/stable/checkpoint.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 2,
        what: "Load parameter, optimizer velocity, and global step together.",
        why: "A resumed optimizer update depends on all three prior-state values.",
        values: ["parameter=2", "velocity=1", "step=10"],
        activeIndices: [0, 1, 2],
      },
      {
        codeLine: 3,
        what: "Combine carried velocity with the current gradient.",
        why: "Resetting velocity changes the optimization trajectory after resume.",
        values: ["0.9·1", "+0.5", "velocity=1.4"],
        activeIndices: [0, 1, 2],
      },
      {
        codeLine: 8,
        what: "Update the parameter and advance the global step exactly once.",
        why: "The transition remains atomic and replayable from the prior checkpoint.",
        values: ["parameter=1.72", "velocity=1.4", "step=11"],
        completedIndices: [0, 1, 2],
        variables: { invariant: "parameter + optimizer + progress advance together" },
      },
    ]),
  assessmentPayload: {
    variant: "resume-with-reset-optimizer",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def advance_training_state(record):
    parameter = record["state"]["parameter"] - record["learning_rate"] * record["gradient"]
    return {"parameter": parameter, "velocity": 0, "step": 0}`,
    evidence: [
      {
        label: "Resume divergence",
        content: "The first post-resume update differs from uninterrupted training.",
      },
      {
        label: "Checkpoint contents",
        content: "Parameter state exists, but optimizer velocity and global step were reset.",
      },
    ],
    failingTests: [
      "A resumed step must use the carried optimizer velocity.",
      "The global step must increment from the checkpoint value.",
    ],
    hints: [
      "Compute new velocity before the parameter update.",
      "Restore progress state as part of the same transition.",
    ],
    completion: {
      variant: "optimizer-state-completion",
      changedContext: true,
      isomorphicRetest: true,
      prompt: "Complete the missing momentum and progress-state transition.",
      context: "A checkpoint resumes from parameter=2, velocity=1, step=10.",
      requiredConcepts: ["carried momentum", "parameter update", "single step increment"],
      consequencePrompt:
        "Explain how resetting either velocity or step changes training behavior and evidence.",
    },
  },
});
