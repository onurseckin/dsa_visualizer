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
    def summarize(rows, threshold):
        if not rows:
            return {"count": 0, "tp": 0, "fp": 0, "tn": 0, "fn": 0, "accuracy": 0.0, "brier": 0.0, "average_precision": 0.0}
        predictions = [row["probability"] >= threshold for row in rows]
        tp = sum(prediction and row["label"] == 1 for prediction, row in zip(predictions, rows))
        fp = sum(prediction and row["label"] == 0 for prediction, row in zip(predictions, rows))
        tn = sum(not prediction and row["label"] == 0 for prediction, row in zip(predictions, rows))
        fn = sum(not prediction and row["label"] == 1 for prediction, row in zip(predictions, rows))
        ranked = sorted(rows, key=lambda row: row["probability"], reverse=True)
        positives = sum(row["label"] == 1 for row in ranked)
        seen_positive = 0
        seen = 0
        precision_sum = 0.0
        index = 0
        while index < len(ranked):
            score = ranked[index]["probability"]
            end = index
            while end < len(ranked) and ranked[end]["probability"] == score:
                end += 1
            group = ranked[index:end]
            group_positive = sum(row["label"] == 1 for row in group)
            seen += len(group)
            seen_positive += group_positive
            if group_positive:
                precision_sum += group_positive * (seen_positive / seen)
            index = end
        brier = sum((row["probability"] - row["label"]) ** 2 for row in rows) / len(rows)
        return {"count": len(rows), "tp": tp, "fp": fp, "tn": tn, "fn": fn,
                "accuracy": round((tp + tn) / len(rows), 6), "brier": round(brier, 6),
                "average_precision": round(precision_sum / positives, 6) if positives else 0.0}

    grouped = {"__all__": list(record["rows"])}
    for row in record["rows"]:
        grouped.setdefault(row["slice"], []).append(row)
    result = {name: summarize(grouped[name], record["threshold"]) for name in sorted(grouped)}
    threshold_curve = []
    for threshold in record.get("curve_thresholds", [record["threshold"]]):
        metrics = summarize(record["rows"], threshold)
        threshold_curve.append({
            "threshold": threshold,
            "tp": metrics["tp"], "fp": metrics["fp"], "tn": metrics["tn"], "fn": metrics["fn"],
            "precision": round(metrics["tp"] / (metrics["tp"] + metrics["fp"]), 6) if metrics["tp"] + metrics["fp"] else 0.0,
            "recall": round(metrics["tp"] / (metrics["tp"] + metrics["fn"]), 6) if metrics["tp"] + metrics["fn"] else 0.0,
        })
    result["__all__"]["threshold_curve"] = threshold_curve
    return result`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return count, threshold confusion cells, accuracy, Brier calibration score, and score-threshold-grouped average precision for __all__ and each named slice, plus __all__.threshold_curve for supplied candidate thresholds.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return metrics for __all__ and every slice: count, tp, fp, tn, fn at probability >= threshold, accuracy, mean Brier calibration score, and average_precision grouped at equal-score thresholds. Add __all__.threshold_curve with per-candidate threshold confusion, precision, and recall; round rates to six decimals.",
  cases: [
    {
      id: "slice-gap",
      label: "Aggregate evidence hides threshold and calibration failure in one slice",
      input: {
        threshold: 0.5,
        curve_thresholds: [0.3, 0.5],
        rows: [
          { slice: "a", label: 1, probability: 0.8 },
          { slice: "a", label: 0, probability: 0.4 },
          { slice: "b", label: 1, probability: 0.3 },
        ],
      },
      expected: {
        __all__: {
          count: 3,
          tp: 1,
          fp: 0,
          tn: 1,
          fn: 1,
          accuracy: 0.666667,
          brier: 0.23,
          average_precision: 0.833333,
          threshold_curve: [
            { threshold: 0.3, tp: 2, fp: 1, tn: 0, fn: 0, precision: 0.666667, recall: 1 },
            { threshold: 0.5, tp: 1, fp: 0, tn: 1, fn: 1, precision: 1, recall: 0.5 },
          ],
        },
        a: { count: 2, tp: 1, fp: 0, tn: 1, fn: 0, accuracy: 1, brier: 0.1, average_precision: 1 },
        b: { count: 1, tp: 0, fp: 0, tn: 0, fn: 1, accuracy: 0, brier: 0.49, average_precision: 1 },
      },
      comparison: "deep-equal",
    },
    {
      id: "ranking-error",
      label: "A high-scoring negative harms ranking despite threshold accuracy",
      input: {
        threshold: 0.5,
        curve_thresholds: [0.5],
        rows: [
          { slice: "core", label: 0, probability: 0.9 },
          { slice: "core", label: 1, probability: 0.8 },
          { slice: "core", label: 0, probability: 0.1 },
        ],
      },
      expected: {
        __all__: {
          count: 3,
          tp: 1,
          fp: 1,
          tn: 1,
          fn: 0,
          accuracy: 0.666667,
          brier: 0.286667,
          average_precision: 0.5,
          threshold_curve: [
            { threshold: 0.5, tp: 1, fp: 1, tn: 1, fn: 0, precision: 0.5, recall: 1 },
          ],
        },
        core: {
          count: 3,
          tp: 1,
          fp: 1,
          tn: 1,
          fn: 0,
          accuracy: 0.666667,
          brier: 0.286667,
          average_precision: 0.5,
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "empty-evaluation",
      label: "No evaluation rows has zeroed metrics",
      input: { threshold: 0.6, curve_thresholds: [0.6], rows: [] },
      expected: {
        __all__: {
          count: 0,
          tp: 0,
          fp: 0,
          tn: 0,
          fn: 0,
          accuracy: 0,
          brier: 0,
          average_precision: 0,
          threshold_curve: [
            { threshold: 0.6, tp: 0, fp: 0, tn: 0, fn: 0, precision: 0, recall: 0 },
          ],
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "tied-score-positive-first",
      label: "Equal-score positive appears before its tied negative",
      input: {
        threshold: 0.5,
        curve_thresholds: [0.5],
        rows: [
          { slice: "core", label: 1, probability: 0.8 },
          { slice: "core", label: 0, probability: 0.8 },
          { slice: "core", label: 1, probability: 0.2 },
          { slice: "core", label: 0, probability: 0.1 },
        ],
      },
      expected: {
        __all__: {
          count: 4,
          tp: 1,
          fp: 1,
          tn: 1,
          fn: 1,
          accuracy: 0.5,
          brier: 0.3325,
          average_precision: 0.583333,
          threshold_curve: [
            { threshold: 0.5, tp: 1, fp: 1, tn: 1, fn: 1, precision: 0.5, recall: 0.5 },
          ],
        },
        core: {
          count: 4,
          tp: 1,
          fp: 1,
          tn: 1,
          fn: 1,
          accuracy: 0.5,
          brier: 0.3325,
          average_precision: 0.583333,
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "tied-score-negative-first",
      label: "Equal-score negative appears before its tied positive",
      input: {
        threshold: 0.5,
        curve_thresholds: [0.5],
        rows: [
          { slice: "core", label: 0, probability: 0.8 },
          { slice: "core", label: 1, probability: 0.8 },
          { slice: "core", label: 1, probability: 0.2 },
          { slice: "core", label: 0, probability: 0.1 },
        ],
      },
      expected: {
        __all__: {
          count: 4,
          tp: 1,
          fp: 1,
          tn: 1,
          fn: 1,
          accuracy: 0.5,
          brier: 0.3325,
          average_precision: 0.583333,
          threshold_curve: [
            { threshold: 0.5, tp: 1, fp: 1, tn: 1, fn: 1, precision: 0.5, recall: 0.5 },
          ],
        },
        core: {
          count: 4,
          tp: 1,
          fp: 1,
          tn: 1,
          fn: 1,
          accuracy: 0.5,
          brier: 0.3325,
          average_precision: 0.583333,
        },
      },
      comparison: "deep-equal",
    },
  ],
});

export const evaluationCalibrationSlices = defineCalculatorItem({
  id: "evaluation-calibration-slices",
  title: "Evaluation, Calibration, and Slices",
  topicIds: ["ml_model_evaluation"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Evaluate a candidate threshold curve, operating-threshold confusion behavior, probability calibration, ranking quality, and slice performance from the same labelled predictions.",
  objective:
    "Distinguish candidate threshold-curve behavior, operating-threshold confusion, Brier calibration, average-precision ranking, and slice evidence instead of allowing a single aggregate accuracy to stand in for all four.",
  completionEvidence:
    "Correct aggregate and slice-level confusion counts, a candidate threshold curve, calibration, and ranking metrics for failing, ranking-error, and empty evaluation boundaries.",
  sources: [
    verifiedSource({
      label: "Scikit-learn probability calibration",
      url: "https://scikit-learn.org/stable/modules/calibration.html",
    }),
    verifiedSource({
      label: "Scikit-learn average precision",
      url: "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.average_precision_score.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (value) => {
    const record = value as {
      threshold: number;
      curve_thresholds?: readonly number[];
      rows: readonly { slice: string; label: number; probability: number }[];
    };
    return matrixSteps([
      {
        codeLine: 6,
        what: "Apply the supplied decision threshold before counting confusion outcomes.",
        why: "Threshold accuracy answers a different question from ranking and calibration.",
        values: record.rows.map((row) => [row.slice, row.probability, row.label]),
        colHeaders: ["slice", "probability", "label"],
        activeCells: record.rows.map((_, index) => [index, 1] as const),
        variables: { threshold: record.threshold },
      },
      {
        codeLine: 12,
        what: "Rank rows by probability and accumulate average precision only after each equal-score group.",
        why: "A score threshold admits tied examples together, so AP must not depend on their incidental input order.",
        values: [
          ["rows", record.rows.length],
          ["ranking metric", "average precision"],
        ],
        colHeaders: ["calculation", "value"],
        activeCells: [
          [0, 1],
          [1, 1],
        ],
      },
      {
        codeLine: 23,
        what: "Compare candidate threshold behavior with aggregate and slice evidence.",
        why: "A global score can conceal a slice whose threshold behavior or calibration is unsafe.",
        values: [
          ["candidate thresholds", JSON.stringify(record.curve_thresholds ?? [record.threshold])],
          ["slices", new Set(record.rows.map((row) => row.slice)).size],
          ["calibration", "Brier score"],
        ],
        colHeaders: ["scope", "evidence"],
        completedCells: [
          [0, 1],
          [1, 1],
          [2, 1],
        ],
      },
    ]);
  },
  assessmentPayload: {
    variant: "threshold-calibration-ranking-slice",
    changedContext: true,
    isomorphicRetest: true,
    prompt:
      "Report the threshold confusion behavior, calibration, ranking quality, and the slice that needs investigation.",
    inputs: [{ id: "threshold", label: "Decision threshold", defaultValue: "0.5" }],
    result: { value: 0.833333, unit: "average precision", tolerance: 0.000001 },
  },
});
