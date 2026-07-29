import {
  defineCalculatorItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "threshold_metrics";

const code = `def threshold_metrics(record):
    scores = record["scores"]
    labels = record["labels"]
    threshold = record["threshold"]
    predictions = [score >= threshold for score in scores]
    tp = sum(prediction and label == 1 for prediction, label in zip(predictions, labels))
    fp = sum(prediction and label == 0 for prediction, label in zip(predictions, labels))
    tn = sum(not prediction and label == 0 for prediction, label in zip(predictions, labels))
    fn = sum(not prediction and label == 1 for prediction, label in zip(predictions, labels))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    flag_rate = sum(predictions) / len(predictions) if predictions else 0.0
    return {
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "flag_rate": round(flag_rate, 6),
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Apply score >= threshold and return confusion counts, precision, recall, and flag_rate rounded to six decimals.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Apply score >= threshold; return {tp, fp, tn, fn, precision, recall, flag_rate}, rounding rates to six decimals and using 0 for undefined rates.",
  cases: [
    {
      id: "balanced-errors",
      label: "Balanced false positives and negatives",
      input: { scores: [0.9, 0.7, 0.4, 0.2], labels: [1, 0, 1, 0], threshold: 0.5 },
      expected: { tp: 1, fp: 1, tn: 1, fn: 1, precision: 0.5, recall: 0.5, flag_rate: 0.5 },
      comparison: "deep-equal",
    },
    {
      id: "no-flags",
      label: "No predicted positives",
      input: { scores: [0.1, 0.2], labels: [0, 0], threshold: 0.5 },
      expected: { tp: 0, fp: 0, tn: 2, fn: 0, precision: 0, recall: 0, flag_rate: 0 },
      comparison: "deep-equal",
    },
    {
      id: "capacity-pressure",
      label: "High flag rate at inclusive threshold",
      input: { scores: [0.8, 0.6, 0.55, 0.1], labels: [1, 1, 0, 0], threshold: 0.55 },
      expected: {
        tp: 2,
        fp: 1,
        tn: 1,
        fn: 0,
        precision: 0.666667,
        recall: 1,
        flag_rate: 0.75,
      },
      comparison: "deep-equal",
    },
  ],
});

export const metricThresholdGuardrails = defineCalculatorItem({
  id: "metric-threshold-guardrails",
  title: "Metric Threshold Guardrails",
  topicIds: ["ml_problem_framing"],
  difficultyProfile: profile(1, 2, 2, 2),
  description:
    "Calculate threshold-dependent classification metrics and expose the operational flag-rate guardrail.",
  objective:
    "Relate threshold movement to false-positive, false-negative, precision, recall, and capacity consequences.",
  completionEvidence:
    "Correct confusion counts and rates for ordinary, zero-denominator, and capacity-pressure cases.",
  sources: [
    verifiedSource({
      label: "Classification accuracy, precision, and recall",
      url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: () =>
    matrixSteps([
      {
        codeLine: 5,
        what: "Apply the inclusive threshold to each score.",
        why: "Every downstream count depends on the exact score >= threshold rule.",
        values: [
          ["0.9 → +", "0.7 → +"],
          ["0.4 → −", "0.2 → −"],
        ],
        activeCells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
        title: "Threshold 0.5",
      },
      {
        codeLine: 6,
        what: "Accumulate the confusion matrix.",
        why: "Precision and recall separate predicted-positive and actual-positive denominators.",
        values: [
          [1, 1],
          [1, 1],
        ],
        rowHeaders: ["actual +", "actual −"],
        colHeaders: ["predicted +", "predicted −"],
        activeCells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
      },
      {
        codeLine: 13,
        what: "Derive precision, recall, and flag rate from explicit counts.",
        why: "The flag rate connects offline classification to review capacity.",
        values: [
          ["precision", 0.5],
          ["recall", 0.5],
          ["flag rate", 0.5],
        ],
        completedCells: [
          [0, 1],
          [1, 1],
          [2, 1],
        ],
        variables: { threshold: 0.5 },
      },
    ]),
  assessmentPayload: {
    variant: "inclusive-threshold-capacity",
    changedContext: true,
    isomorphicRetest: true,
    prompt:
      "Compute recall for the representative threshold, then explain whether the flag rate violates capacity.",
    inputs: [
      { id: "tp", label: "True positives", defaultValue: "1" },
      { id: "fn", label: "False negatives", defaultValue: "1" },
    ],
    result: { value: 0.5, unit: "recall", tolerance: 0.000001 },
  },
});
