import {
  defineDebuggingItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def compare_experiment_runs(record):
    baseline = record["baseline"]
    candidate = record["candidate"]
    dimensions = (
        "code_revision",
        "dataset_snapshot",
        "config_digest",
        "environment_digest",
        "feature_digest",
        "seed",
    )
    changed = sorted(
        dimension
        for dimension in dimensions
        if baseline.get(dimension) != candidate.get(dimension)
    )
    metric_fields = ("name", "split", "label_window")
    comparable = (
        baseline.get("dataset_snapshot") == candidate.get("dataset_snapshot")
        and all(
            baseline["metric"].get(field) == candidate["metric"].get(field)
            for field in metric_fields
        )
    )
    if not comparable:
        conclusion = "incomparable"
    elif len(changed) > 1:
        conclusion = "confounded"
    elif len(changed) == 1:
        conclusion = "comparable-single-change"
    else:
        conclusion = "no-controlled-change"
    return {
        "comparable": comparable,
        "changed": changed,
        "conclusion": conclusion,
    }`;

const execution = functionExecution({
  entrypoint: "compare_experiment_runs",
  outputContract:
    "Return metric comparability, the sorted changed run dimensions, and a conclusion that distinguishes one controlled change, confounding, incomparability, or no change.",
  cases: [
    {
      id: "controlled-config-change",
      label: "One controlled hyperparameter configuration change",
      input: {
        baseline: {
          code_revision: "8ad2f17",
          dataset_snapshot: "events@2026-07-15T00:00:00Z",
          config_digest: "sha256:lr-001",
          environment_digest: "sha256:lock-44",
          feature_digest: "sha256:features-12",
          seed: 17,
          metric: { name: "pr_auc", split: "test", label_window: "30d" },
        },
        candidate: {
          code_revision: "8ad2f17",
          dataset_snapshot: "events@2026-07-15T00:00:00Z",
          config_digest: "sha256:lr-002",
          environment_digest: "sha256:lock-44",
          feature_digest: "sha256:features-12",
          seed: 17,
          metric: { name: "pr_auc", split: "test", label_window: "30d" },
        },
      },
      expected: {
        comparable: true,
        changed: ["config_digest"],
        conclusion: "comparable-single-change",
      },
      comparison: "deep-equal",
    },
    {
      id: "metric-protocol-mismatch",
      label: "Candidate uses a different evaluation split",
      input: {
        baseline: {
          code_revision: "8ad2f17",
          dataset_snapshot: "events@2026-07-15T00:00:00Z",
          config_digest: "sha256:lr-001",
          environment_digest: "sha256:lock-44",
          feature_digest: "sha256:features-12",
          seed: 17,
          metric: { name: "pr_auc", split: "test", label_window: "30d" },
        },
        candidate: {
          code_revision: "8ad2f17",
          dataset_snapshot: "events@2026-07-15T00:00:00Z",
          config_digest: "sha256:lr-001",
          environment_digest: "sha256:lock-44",
          feature_digest: "sha256:features-12",
          seed: 17,
          metric: { name: "pr_auc", split: "validation", label_window: "30d" },
        },
      },
      expected: { comparable: false, changed: [], conclusion: "incomparable" },
      comparison: "deep-equal",
    },
    {
      id: "confounded-run",
      label: "Code, features, and seed all changed",
      input: {
        baseline: {
          code_revision: "8ad2f17",
          dataset_snapshot: "events@2026-07-15T00:00:00Z",
          config_digest: "sha256:lr-001",
          environment_digest: "sha256:lock-44",
          feature_digest: "sha256:features-12",
          seed: 17,
          metric: { name: "pr_auc", split: "test", label_window: "30d" },
        },
        candidate: {
          code_revision: "b91a321",
          dataset_snapshot: "events@2026-07-15T00:00:00Z",
          config_digest: "sha256:lr-001",
          environment_digest: "sha256:lock-44",
          feature_digest: "sha256:features-13",
          seed: 91,
          metric: { name: "pr_auc", split: "test", label_window: "30d" },
        },
      },
      expected: {
        comparable: true,
        changed: ["code_revision", "feature_digest", "seed"],
        conclusion: "confounded",
      },
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "compare_experiment_runs",
  parameters: ["record"],
  contract:
    "Compare run identities and metric protocol; return comparable, sorted changed dimensions, and the causal conclusion.",
});

function generateSteps(input: unknown) {
  const record = input as {
    baseline?: Record<string, unknown>;
    candidate?: Record<string, unknown>;
  };
  const baseline = record?.baseline ?? {};
  const candidate = record?.candidate ?? {};
  const dimensions = [
    "code_revision",
    "dataset_snapshot",
    "config_digest",
    "environment_digest",
    "feature_digest",
    "seed",
  ] as const;
  const values = dimensions.map((dimension) => [
    dimension,
    String(baseline[dimension] ?? "missing"),
    String(candidate[dimension] ?? "missing"),
    baseline[dimension] === candidate[dimension] ? "same" : "changed",
  ]);
  return matrixSteps([
    {
      codeLine: 2,
      what: "Align the two immutable run records by comparison dimension.",
      why: "A metric delta is interpretable only after its inputs and protocol are aligned.",
      values: values.map((row) => [row[0], row[1], row[2], "unchecked"]),
      rowHeaders: dimensions,
      colHeaders: ["dimension", "baseline", "candidate", "status"],
      activeCells: [
        [0, 1],
        [0, 2],
      ],
    },
    {
      codeLine: 11,
      what: "Mark every changed experimental dimension.",
      why: "More than one changed cause confounds attribution even when the metric protocol matches.",
      values,
      rowHeaders: dimensions,
      colHeaders: ["dimension", "baseline", "candidate", "status"],
      activeCells: values.flatMap((row, rowIndex) =>
        row[3] === "changed" ? [[rowIndex, 3] as const] : [],
      ),
    },
    {
      codeLine: 18,
      what: "Check metric name, split, label window, and dataset comparability.",
      why: "A causal conclusion is invalid when runs do not measure the same outcome on the same evidence.",
      values: [
        ...values,
        [
          "metric_protocol",
          JSON.stringify(baseline.metric ?? {}),
          JSON.stringify(candidate.metric ?? {}),
          JSON.stringify(baseline.metric) === JSON.stringify(candidate.metric)
            ? "same"
            : "incomparable",
        ],
      ],
      colHeaders: ["dimension", "baseline", "candidate", "status"],
      activeCells: [[values.length, 3]],
    },
  ]);
}

export const experimentComparisonDebugging = defineDebuggingItem({
  id: "experiment-comparison-debugging",
  title: "Experiment comparison debugging",
  topicIds: ["ml_experiment_lineage"],
  difficultyProfile: profile(2, 3, 2, 3),
  description:
    "Debug model-selection claims by aligning immutable run records, metric protocols, and every changed experimental dimension.",
  objective:
    "Reject incomparable metrics and distinguish a controlled single change from a confounded multi-change experiment.",
  completionEvidence:
    "The diagnosis names all confounders, rejects split/dataset/protocol mismatches, and passes controlled, incomparable, and confounded typed cases.",
  sources: [
    verifiedSource({
      label: "MLflow Tracking",
      url: "https://mlflow.org/docs/latest/ml/tracking/",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps,
  assessmentPayload: {
    variant: "changed-run-records",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def compare_experiment_runs(record):
    baseline_score = record["baseline"]["metric"]["value"]
    candidate_score = record["candidate"]["metric"]["value"]
    return {"winner": "candidate" if candidate_score > baseline_score else "baseline"}`,
    evidence: [
      {
        label: "Baseline run",
        content:
          "Run 301 used test/30d PR-AUC, dataset events@2026-07-15, code 8ad2f17, and feature digest 12.",
      },
      {
        label: "Candidate run",
        content:
          "Run 302 reports a larger number but changed the split, code revision, and feature digest.",
      },
    ],
    failingTests: [
      "Reject a comparison when metric protocol or dataset snapshot differs.",
      "Flag multiple changed dimensions as confounded.",
      "Accept exactly one controlled change under a shared protocol.",
    ],
    hints: [
      "Compare metric identity before comparing metric values.",
      "Enumerate code, data, config, environment, feature, and seed changes.",
    ],
  },
});
