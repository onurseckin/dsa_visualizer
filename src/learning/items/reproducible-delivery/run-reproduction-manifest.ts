import {
  defineScenarioItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def validate_reproduction_manifest(record):
    required = (
        "code_revision",
        "dataset_snapshot",
        "config_digest",
        "environment_digest",
        "feature_definition",
        "metric_protocol",
        "artifact_digest",
        "started_at",
    )
    missing = [
        field
        for field in required
        if not isinstance(record.get(field), str) or not record[field].strip()
    ]
    timestamp = record.get("started_at")
    if (
        "started_at" not in missing
        and (not timestamp.endswith("Z") or "T" not in timestamp)
    ):
        missing.append("started_at")
    missing.sort()
    return {
        "run_id": record.get("run_id", "unknown"),
        "complete": not missing,
        "missing": missing,
    }`;

const execution = functionExecution({
  entrypoint: "validate_reproduction_manifest",
  outputContract:
    "Return run_id, complete, and a sorted missing list for the required reproducibility evidence fields; started_at must be an explicit UTC timestamp.",
  cases: [
    {
      id: "complete-record",
      label: "Complete immutable run evidence",
      input: {
        run_id: "run-301",
        code_revision: "8ad2f17",
        dataset_snapshot: "events@2026-07-15T00:00:00Z",
        config_digest: "sha256:config-c9",
        environment_digest: "sha256:lock-44",
        feature_definition: "fraud-features-v12",
        metric_protocol: "pr-auc:test-window-v4",
        artifact_digest: "sha256:model-17",
        started_at: "2026-07-18T09:30:00Z",
      },
      expected: { run_id: "run-301", complete: true, missing: [] },
      comparison: "deep-equal",
    },
    {
      id: "missing-data-and-environment",
      label: "Run cannot recover data or environment",
      input: {
        run_id: "run-302",
        code_revision: "8ad2f17",
        dataset_snapshot: "",
        config_digest: "sha256:config-c9",
        environment_digest: "",
        feature_definition: "fraud-features-v12",
        metric_protocol: "pr-auc:test-window-v4",
        artifact_digest: "sha256:model-18",
        started_at: "2026-07-19T09:30:00Z",
      },
      expected: {
        run_id: "run-302",
        complete: false,
        missing: ["dataset_snapshot", "environment_digest"],
      },
      comparison: "deep-equal",
    },
    {
      id: "invalid-time-and-artifact",
      label: "Mutable time and artifact evidence",
      input: {
        run_id: "run-303",
        code_revision: "b91a321",
        dataset_snapshot: "events@2026-07-20T00:00:00Z",
        config_digest: "sha256:config-d2",
        environment_digest: "sha256:lock-44",
        feature_definition: "fraud-features-v12",
        metric_protocol: "pr-auc:test-window-v4",
        artifact_digest: " ",
        started_at: "2026-07-20 09:30 local",
      },
      expected: {
        run_id: "run-303",
        complete: false,
        missing: ["artifact_digest", "started_at"],
      },
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "validate_reproduction_manifest",
  parameters: ["record"],
  contract:
    "Return run_id, complete, and sorted missing fields. Require immutable code, data, config, environment, feature, metric, artifact, and UTC-start evidence.",
});

function generateSteps(input: unknown) {
  const record =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const evidence = [
    ["code", "code_revision"],
    ["data", "dataset_snapshot"],
    ["config", "config_digest"],
    ["environment", "environment_digest"],
    ["feature", "feature_definition"],
    ["metric", "metric_protocol"],
    ["artifact", "artifact_digest"],
  ] as const;
  const nodes = [
    { id: "run", label: String(record.run_id ?? "run") },
    ...evidence.map(([id, field]) => ({
      id,
      label: `${id}: ${String(record[field] || "missing")}`,
    })),
  ];
  const edges = evidence.map(([id]) => ({ from: id, to: "run" }));
  return graphSteps([
    {
      codeLine: 2,
      what: "Open the timestamped run record.",
      why: "A run ID alone does not preserve the evidence required to reproduce it.",
      nodes,
      edges,
      activeNodeIds: ["run"],
      variables: { startedAt: String(record.started_at ?? "missing") },
    },
    {
      codeLine: 12,
      what: "Validate every immutable evidence category.",
      why: "Code, data, configuration, environment, features, metrics, and artifacts can change independently.",
      nodes,
      edges,
      activeNodeIds: evidence.filter(([, field]) => Boolean(record[field])).map(([id]) => id),
      completedNodeIds: ["run"],
      traversedEdgeIndexes: evidence
        .map(([, field], index) => (record[field] ? index : -1))
        .filter((index) => index >= 0),
    },
    {
      codeLine: 23,
      what: "Seal the manifest only when all evidence is addressable.",
      why: "Completion is evidence of reproducibility, not merely successful script execution.",
      nodes,
      edges,
      activeNodeIds: evidence.filter(([, field]) => !record[field]).map(([id]) => id),
      completedNodeIds: evidence.filter(([, field]) => Boolean(record[field])).map(([id]) => id),
      traversedEdgeIndexes: evidence.map((_, index) => index),
    },
  ]);
}

export const runReproductionManifest = defineScenarioItem({
  id: "run-reproduction-manifest",
  title: "Run reproduction manifest",
  topicIds: ["ml_experiment_lineage"],
  difficultyProfile: profile(2, 2, 2, 3),
  description:
    "Decide which immutable evidence must travel with a training run so another engineer can reproduce and audit the model-selection claim.",
  objective:
    "Separate source, data, configuration, environment, feature, metric, and artifact evidence and bind each to one timestamped run.",
  completionEvidence:
    "A rationale covers every evidence category and the executable validator accepts a complete manifest while rejecting incomplete or ambiguous records.",
  sources: [
    verifiedSource({
      label: "MLflow Tracking",
      url: "https://mlflow.org/docs/latest/ml/tracking/",
    }),
  ],
  prompt: {
    context:
      "A fraud model won an offline comparison, but the training directory and latest dataset path were overwritten two weeks later.",
    question:
      "Design the minimum immutable run manifest that lets an independent engineer reproduce and audit the selection decision.",
    constraints: [
      "Bind code, data, configuration, environment, feature, metric, and artifact evidence.",
      "Use immutable digests or versions rather than mutable latest paths.",
      "Explain which timestamps and metric protocol make the evidence comparable.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "identity",
        label: "Immutable identities",
        description:
          "Names immutable code, data, configuration, environment, and artifact identities.",
        points: 3,
        critical: true,
      },
      {
        id: "semantics",
        label: "Feature and metric semantics",
        description:
          "Records feature definitions and the metric protocol, not only numeric results.",
        points: 2,
        critical: true,
      },
      {
        id: "audit",
        label: "Audit path",
        description: "Connects timestamps and outputs back to one run and selection claim.",
        points: 2,
      },
    ],
  },
  playground: { code, starterCode, execution, generateSteps },
  assessmentPayload: {
    variant: "overwritten-run-directory",
    changedContext: true,
    isomorphicRetest: true,
    choices: [
      "Record immutable identities for every evidence category",
      "Keep only the winning metric and model file",
      "Rely on the current branch and latest dataset",
    ],
    consequences:
      "The written scenario remains rubric-scored; the playground grades only whether a concrete manifest is structurally reproducible.",
  },
});
