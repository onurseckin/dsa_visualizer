import {
  defineCalculatorItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "calibration_slices";

const code = `def calibration_slices(record):
    threshold = record["threshold"]
    grouped = {"__all__": list(record["rows"])}
    for row in record["rows"]:
        grouped.setdefault(row["slice"], []).append(row)

    result = {}
    for name in sorted(grouped):
        rows = grouped[name]
        if not rows:
            result[name] = {"count": 0, "accuracy": 0.0, "brier": 0.0}
            continue
        correct = sum((row["probability"] >= threshold) == (row["label"] == 1) for row in rows)
        brier = sum((row["probability"] - row["label"]) ** 2 for row in rows) / len(rows)
        result[name] = {
            "count": len(rows),
            "accuracy": round(correct / len(rows), 6),
            "brier": round(brier, 6),
        }
    return result`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return count, threshold accuracy, and Brier score rounded to six decimals for __all__ and each named slice.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return metrics for __all__ and every slice: count, accuracy at probability >= threshold, and mean Brier score, with rates rounded to six decimals.",
  cases: [
    {
      id: "slice-gap",
      label: "One slice is inaccurate and miscalibrated",
      input: {
        threshold: 0.5,
        rows: [
          { slice: "a", label: 1, probability: 0.8 },
          { slice: "a", label: 0, probability: 0.4 },
          { slice: "b", label: 1, probability: 0.3 },
        ],
      },
      expected: {
        __all__: { count: 3, accuracy: 0.666667, brier: 0.23 },
        a: { count: 2, accuracy: 1, brier: 0.1 },
        b: { count: 1, accuracy: 0, brier: 0.49 },
      },
      comparison: "deep-equal",
    },
    {
      id: "confident-correct",
      label: "Confident correct predictions",
      input: {
        threshold: 0.5,
        rows: [
          { slice: "x", label: 1, probability: 0.9 },
          { slice: "x", label: 0, probability: 0.1 },
        ],
      },
      expected: {
        __all__: { count: 2, accuracy: 1, brier: 0.01 },
        x: { count: 2, accuracy: 1, brier: 0.01 },
      },
      comparison: "deep-equal",
    },
    {
      id: "empty-evaluation",
      label: "No evaluation rows",
      input: { threshold: 0.6, rows: [] },
      expected: { __all__: { count: 0, accuracy: 0, brier: 0 } },
      comparison: "deep-equal",
    },
  ],
});

export const evaluationCalibrationSlices = defineCalculatorItem({
  id: "evaluation-calibration-slices",
  title: "Evaluation, Calibration, and Slices",
  topicIds: ["ml_model_evaluation"],
  difficultyProfile: profile(2, 3, 3, 2),
  description:
    "Calculate threshold accuracy and probability calibration error for the full set and named slices.",
  objective:
    "Detect slice failures hidden by an aggregate metric and distinguish classification correctness from probability calibration.",
  completionEvidence:
    "Correct count, accuracy, and Brier evidence for aggregate, failing-slice, confident, and empty boundaries.",
  sources: [
    verifiedSource({
      label: "Scikit-learn probability calibration",
      url: "https://scikit-learn.org/stable/modules/calibration.html",
    }),
    verifiedSource({
      label: "Scikit-learn model evaluation",
      url: "https://scikit-learn.org/stable/modules/model_evaluation.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: () =>
    matrixSteps([
      {
        codeLine: 3,
        what: "Partition predictions into the aggregate set and named slices.",
        why: "Every row contributes to both global and slice-specific evidence.",
        values: [
          ["a", 1, 0.8],
          ["a", 0, 0.4],
          ["b", 1, 0.3],
        ],
        colHeaders: ["slice", "label", "probability"],
        activeCells: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      },
      {
        codeLine: 13,
        what: "Compute correctness and squared probability error per slice.",
        why: "Accuracy and calibration answer different questions about the prediction.",
        values: [
          ["a", 1, 0.1],
          ["b", 0, 0.49],
        ],
        colHeaders: ["slice", "accuracy", "Brier"],
        activeCells: [
          [0, 1],
          [0, 2],
          [1, 1],
          [1, 2],
        ],
      },
      {
        codeLine: 19,
        what: "Compare aggregate evidence with the failing slice.",
        why: "The aggregate accuracy of 0.667 hides slice b accuracy of zero.",
        values: [
          ["__all__", 0.666667, 0.23],
          ["a", 1, 0.1],
          ["b", 0, 0.49],
        ],
        colHeaders: ["scope", "accuracy", "Brier"],
        completedCells: [
          [0, 1],
          [0, 2],
          [1, 1],
          [1, 2],
          [2, 1],
          [2, 2],
        ],
      },
    ]),
  assessmentPayload: {
    variant: "aggregate-hides-slice",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Calculate the representative aggregate Brier score and identify the failing slice.",
    inputs: [
      { id: "sum_squared_error", label: "Sum squared probability error", defaultValue: "0.69" },
      { id: "count", label: "Prediction count", defaultValue: "3" },
    ],
    result: { value: 0.23, unit: "Brier score", tolerance: 0.000001 },
  },
});
