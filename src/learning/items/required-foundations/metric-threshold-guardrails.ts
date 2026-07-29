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
    def summarize(rows, threshold):
        predictions = [row["score"] >= threshold for row in rows]
        tp = sum(prediction and row["label"] == 1 for prediction, row in zip(predictions, rows))
        fp = sum(prediction and row["label"] == 0 for prediction, row in zip(predictions, rows))
        tn = sum(not prediction and row["label"] == 0 for prediction, row in zip(predictions, rows))
        fn = sum(not prediction and row["label"] == 1 for prediction, row in zip(predictions, rows))
        return {"tp": tp, "fp": fp, "tn": tn, "fn": fn,
                "recall": round(tp / (tp + fn), 6) if tp + fn else 0.0,
                "flag_rate": round(sum(predictions) / len(rows), 6) if rows else 0.0}

    candidates = []
    for threshold in sorted(record["thresholds"]):
        overall = summarize(record["rows"], threshold)
        segments = {}
        segment_guardrail_met = True
        for name in sorted({row["segment"] for row in record["rows"]}):
            segment = summarize([row for row in record["rows"] if row["segment"] == name], threshold)
            limits = record["segment_guardrails"].get(name, {"min_recall": 0, "max_flag_rate": 1})
            segment["guardrail_met"] = segment["recall"] >= limits["min_recall"] and segment["flag_rate"] <= limits["max_flag_rate"]
            segments[name] = segment
            segment_guardrail_met = segment_guardrail_met and segment["guardrail_met"]
        uncertain_count = sum(row["lower_score"] < threshold <= row["upper_score"] for row in record["rows"])
        candidates.append({
            "selected_threshold": threshold,
            **overall,
            "cost_matrix": {"false_positive": record["false_positive_cost"], "false_negative": record["false_negative_cost"]},
            "expected_cost": overall["fp"] * record["false_positive_cost"] + overall["fn"] * record["false_negative_cost"],
            "uncertain_count": uncertain_count,
            "segment_guardrail_met": segment_guardrail_met,
            "segments": segments,
        })
    best = min(candidates, key=lambda candidate: (not candidate["segment_guardrail_met"], candidate["expected_cost"], -candidate["selected_threshold"]))
    return best`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Evaluate candidate thresholds with a false-positive/false-negative cost matrix, uncertainty count, and per-segment recall/flag-rate guardrails; return the least-cost feasible selection.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return the selected threshold with tp/fp/tn/fn, recall, flag_rate, cost_matrix, expected_cost, uncertain_count, segment_guardrail_met, and per-segment metrics. Select feasible segment guardrails before minimizing cost; uncertain_count flags scores whose stated interval crosses the threshold.",
  cases: [
    {
      id: "cost-aware-segments",
      label: "Segment capacity guardrail selects a safer cost-aware threshold",
      input: {
        thresholds: [0.5, 0.7],
        false_positive_cost: 1,
        false_negative_cost: 5,
        segment_guardrails: {
          a: { min_recall: 1, max_flag_rate: 0.5 },
          b: { min_recall: 1, max_flag_rate: 1 },
        },
        rows: [
          { segment: "a", label: 1, score: 0.9, lower_score: 0.85, upper_score: 0.95 },
          { segment: "a", label: 0, score: 0.69, lower_score: 0.65, upper_score: 0.72 },
          { segment: "b", label: 1, score: 0.8, lower_score: 0.75, upper_score: 0.85 },
          { segment: "b", label: 0, score: 0.4, lower_score: 0.35, upper_score: 0.45 },
        ],
      },
      expected: {
        selected_threshold: 0.7,
        tp: 2,
        fp: 0,
        tn: 2,
        fn: 0,
        recall: 1,
        flag_rate: 0.5,
        cost_matrix: { false_positive: 1, false_negative: 5 },
        expected_cost: 0,
        uncertain_count: 1,
        segment_guardrail_met: true,
        segments: {
          a: { tp: 1, fp: 0, tn: 1, fn: 0, recall: 1, flag_rate: 0.5, guardrail_met: true },
          b: { tp: 1, fp: 0, tn: 1, fn: 0, recall: 1, flag_rate: 0.5, guardrail_met: true },
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "false-negative-expensive",
      label: "High false-negative cost prefers the lower feasible threshold",
      input: {
        thresholds: [0.4, 0.8],
        false_positive_cost: 1,
        false_negative_cost: 10,
        segment_guardrails: { core: { min_recall: 1, max_flag_rate: 1 } },
        rows: [
          { segment: "core", label: 1, score: 0.6, lower_score: 0.55, upper_score: 0.65 },
          { segment: "core", label: 0, score: 0.5, lower_score: 0.45, upper_score: 0.55 },
        ],
      },
      expected: {
        selected_threshold: 0.4,
        tp: 1,
        fp: 1,
        tn: 0,
        fn: 0,
        recall: 1,
        flag_rate: 1,
        cost_matrix: { false_positive: 1, false_negative: 10 },
        expected_cost: 1,
        uncertain_count: 0,
        segment_guardrail_met: true,
        segments: {
          core: { tp: 1, fp: 1, tn: 0, fn: 0, recall: 1, flag_rate: 1, guardrail_met: true },
        },
      },
      comparison: "deep-equal",
    },
    {
      id: "no-feasible-segment",
      label: "When no threshold is feasible, expose the least-cost guardrail breach",
      input: {
        thresholds: [0.5],
        false_positive_cost: 2,
        false_negative_cost: 3,
        segment_guardrails: { rare: { min_recall: 1, max_flag_rate: 0 } },
        rows: [{ segment: "rare", label: 1, score: 0.9, lower_score: 0.8, upper_score: 0.95 }],
      },
      expected: {
        selected_threshold: 0.5,
        tp: 1,
        fp: 0,
        tn: 0,
        fn: 0,
        recall: 1,
        flag_rate: 1,
        cost_matrix: { false_positive: 2, false_negative: 3 },
        expected_cost: 0,
        uncertain_count: 0,
        segment_guardrail_met: false,
        segments: {
          rare: { tp: 1, fp: 0, tn: 0, fn: 0, recall: 1, flag_rate: 1, guardrail_met: false },
        },
      },
      comparison: "deep-equal",
    },
  ],
});

export const metricThresholdGuardrails = defineCalculatorItem({
  id: "metric-threshold-guardrails",
  title: "Metric Threshold Guardrails",
  topicIds: ["ml_problem_framing"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Select a threshold with explicit false-positive/false-negative cost, uncertainty around score boundaries, and per-segment recall and capacity guardrails.",
  objective:
    "Relate threshold movement to confusion counts, decision cost, uncertain boundary decisions, and segment-specific safeguards rather than optimizing an aggregate metric alone.",
  completionEvidence:
    "Correctly selects the least-cost threshold that satisfies segment guardrails, or explicitly returns a guardrail breach when none is feasible.",
  sources: [
    verifiedSource({
      label: "Google ML Crash Course — Classification thresholds",
      url: "https://developers.google.com/machine-learning/crash-course/classification/thresholding",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (value) => {
    const record = value as {
      thresholds: readonly number[];
      false_positive_cost: number;
      false_negative_cost: number;
      rows: readonly unknown[];
    };
    return matrixSteps([
      {
        codeLine: 3,
        what: "Evaluate the supplied candidate thresholds against the labelled rows.",
        why: "A threshold is a decision rule that changes each confusion-matrix cell.",
        values: record.thresholds.map((threshold) => ["threshold", threshold]),
        colHeaders: ["candidate", "value"],
        activeCells: record.thresholds.map((_, index) => [index, 1] as const),
      },
      {
        codeLine: 22,
        what: "Apply the stated false-positive and false-negative costs.",
        why: "The cost matrix makes the decision tradeoff auditable rather than implicit.",
        values: [
          ["false positive", record.false_positive_cost],
          ["false negative", record.false_negative_cost],
        ],
        colHeaders: ["outcome", "cost"],
        activeCells: [
          [0, 1],
          [1, 1],
        ],
      },
      {
        codeLine: 26,
        what: "Reject candidates that breach a segment guardrail before selecting by cost.",
        why: "Aggregate cost cannot justify an unsafe recall or review-load outcome for a segment.",
        values: [
          ["evaluation rows", record.rows.length],
          ["selection", "feasible guardrails then minimum cost"],
        ],
        colHeaders: ["gate", "evidence"],
        completedCells: [
          [0, 1],
          [1, 1],
        ],
      },
    ]);
  },
  assessmentPayload: {
    variant: "cost-aware-segment-threshold",
    changedContext: true,
    isomorphicRetest: true,
    prompt:
      "Select a feasible threshold, show its confusion cost, and identify any segment guardrail breach.",
    inputs: [{ id: "threshold", label: "Candidate threshold", defaultValue: "0.7" }],
    result: { value: 0.7, unit: "threshold", tolerance: 0.000001 },
  },
});
