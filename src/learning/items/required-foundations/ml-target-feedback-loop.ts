import {
  arraySteps,
  defineScenarioItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "audit_ml_target";

const code = `def audit_ml_target(record):
    checks = [
        ("prediction", bool(record.get("prediction"))),
        ("decision", bool(record.get("decision"))),
        ("success_metric", bool(record.get("success_metric"))),
        ("non_ml_baseline", bool(record.get("non_ml_baseline"))),
        ("feedback_source", bool(record.get("feedback_source"))),
        ("feedback_delay_days", isinstance(record.get("feedback_delay_days"), (int, float))),
        ("guardrail_metric", bool(record.get("guardrail_metric"))),
    ]
    return [name for name, present in checks if not present]`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return missing ML target-contract fields in prediction, decision, metric, baseline, feedback, delay, guardrail order.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return missing target-contract field names in canonical order; feedback_delay_days is present only when numeric.",
  cases: [
    {
      id: "complete-target",
      label: "Complete decision target",
      input: {
        prediction: "risk score",
        decision: "route for manual review",
        success_metric: "recall at fixed review capacity",
        non_ml_baseline: "review all high-value transactions",
        feedback_source: "confirmed investigation outcome",
        feedback_delay_days: 21,
        guardrail_metric: "false-positive rate",
      },
      expected: [],
      comparison: "deep-equal",
    },
    {
      id: "metric-only",
      label: "Metric without decision or feedback",
      input: {
        prediction: "churn probability",
        success_metric: "AUC",
        non_ml_baseline: "no intervention",
        feedback_delay_days: "unknown",
      },
      expected: ["decision", "feedback_source", "feedback_delay_days", "guardrail_metric"],
      comparison: "deep-equal",
    },
    {
      id: "missing-baseline",
      label: "Target missing baseline and success metric",
      input: {
        prediction: "failure within seven days",
        decision: "schedule preventive maintenance",
        feedback_source: "maintenance work order",
        feedback_delay_days: 7,
        guardrail_metric: "unnecessary maintenance rate",
      },
      expected: ["success_metric", "non_ml_baseline"],
      comparison: "deep-equal",
    },
  ],
});

const targetFields = [
  "prediction",
  "decision",
  "success metric",
  "baseline",
  "feedback",
  "delay",
  "guardrail",
] as const;

export const mlTargetFeedbackLoop = defineScenarioItem({
  id: "ml-target-feedback-loop",
  title: "ML Target and Feedback Loop",
  topicIds: ["ml_problem_framing"],
  difficultyProfile: profile(2, 2, 3, 3),
  description:
    "Frame a prediction as one component of a decision system, with an explicit baseline, delayed feedback, and guardrail.",
  objective:
    "Decide whether ML is justified and connect prediction output to an observable action and feedback loop.",
  completionEvidence:
    "A rubric-scored target contract and a passing deterministic validator for three changed product frames.",
  sources: [
    verifiedSource({
      label: "Google ML problem framing",
      url: "https://developers.google.com/machine-learning/problem-framing/problem-framing",
    }),
    verifiedSource({
      label: "Rules of Machine Learning",
      url: "https://developers.google.com/machine-learning/guides/rules-of-ml/",
    }),
  ],
  prompt: {
    context:
      "A support team asks for a model that predicts which tickets are important. Review capacity is fixed, labels arrive after resolution, and the current rules already route priority customers.",
    question:
      "Define the prediction, downstream decision, non-ML baseline, success metric, feedback source, and one guardrail. Explain when the feedback loop would bias future training data.",
    constraints: [
      "The metric must be tied to the fixed review capacity.",
      "The baseline must be deployable without a learned model.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "decision-contract",
        label: "Decision contract",
        description: "Connects a precisely defined prediction to an operational decision.",
        points: 3,
        critical: true,
      },
      {
        id: "baseline-and-metric",
        label: "Baseline and metric",
        description: "Compares against a non-ML baseline with a capacity-aware success metric.",
        points: 2,
      },
      {
        id: "feedback-risk",
        label: "Feedback risk",
        description: "Explains label delay and how the decision can change future observations.",
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
        arraySteps([
          {
            codeLine: 2,
            what: "Enumerate the prediction-to-decision contract.",
            why: "A model output has no product value until it changes an explicit action.",
            values: targetFields,
            activeIndices: [0, 1, 2, 3],
          },
          {
            codeLine: 6,
            what: "Attach feedback source, delay, and guardrail.",
            why: "Delayed and selectively observed outcomes shape what can be learned next.",
            values: targetFields,
            activeIndices: [4, 5, 6],
            completedIndices: [0, 1, 2, 3],
          },
          {
            codeLine: 10,
            what: "Emit every missing field as an actionable framing gap.",
            why: "Promotion should stop until the full decision and feedback boundary is observable.",
            values: targetFields,
            completedIndices: [0, 1, 2, 3, 4, 5, 6],
            variables: { invariant: "prediction → decision → feedback" },
          },
        ]),
        input,
        ["prediction", "decision", "feedback_delay_days"],
        execution.cases,
      ),
  },
  assessmentPayload: {
    variant: "capacity-constrained-support-routing",
    changedContext: true,
    isomorphicRetest: true,
    consequences:
      "Optimizing an untethered offline metric can consume review capacity without improving resolved outcomes.",
  },
});
