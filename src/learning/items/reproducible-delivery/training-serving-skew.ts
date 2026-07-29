import {
  defineDebuggingItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def diagnose_training_serving_skew(record):
    training = record["training"]
    serving = record["serving"]
    skew = []
    dimensions = (
        ("transform", "transform_digest"),
        ("schema", "schema_version"),
        ("default", "default_policy"),
        ("clock", "clock_basis"),
    )
    for label, field in dimensions:
        if training.get(field) != serving.get(field):
            skew.append(label)
    if serving["feature_age_seconds"] > serving["max_age_seconds"]:
        skew.append("freshness")
    skew.sort()
    return {"consistent": not skew, "skew": skew}`;

const execution = functionExecution({
  entrypoint: "diagnose_training_serving_skew",
  outputContract:
    "Return consistent and a sorted list drawn from clock, default, freshness, schema, and transform whenever online evidence differs from training semantics or exceeds its freshness bound.",
  cases: [
    {
      id: "consistent-contract",
      label: "Shared transform and fresh online value",
      input: {
        training: {
          transform_digest: "sha256:transform-v8",
          schema_version: "customer-v5",
          default_policy: "median-from-train-snapshot",
          clock_basis: "event-time-utc",
        },
        serving: {
          transform_digest: "sha256:transform-v8",
          schema_version: "customer-v5",
          default_policy: "median-from-train-snapshot",
          clock_basis: "event-time-utc",
          feature_age_seconds: 35,
          max_age_seconds: 300,
        },
      },
      expected: { consistent: true, skew: [] },
      comparison: "deep-equal",
    },
    {
      id: "duplicated-transform-default",
      label: "Serving copied an old transform and a new default",
      input: {
        training: {
          transform_digest: "sha256:transform-v8",
          schema_version: "customer-v5",
          default_policy: "median-from-train-snapshot",
          clock_basis: "event-time-utc",
        },
        serving: {
          transform_digest: "sha256:transform-v7",
          schema_version: "customer-v5",
          default_policy: "zero",
          clock_basis: "event-time-utc",
          feature_age_seconds: 42,
          max_age_seconds: 300,
        },
      },
      expected: { consistent: false, skew: ["default", "transform"] },
      comparison: "deep-equal",
    },
    {
      id: "schema-clock-freshness",
      label: "Online request has stale data under a different schema and clock",
      input: {
        training: {
          transform_digest: "sha256:transform-v8",
          schema_version: "customer-v5",
          default_policy: "median-from-train-snapshot",
          clock_basis: "event-time-utc",
        },
        serving: {
          transform_digest: "sha256:transform-v8",
          schema_version: "customer-v6",
          default_policy: "median-from-train-snapshot",
          clock_basis: "processing-time-local",
          feature_age_seconds: 901,
          max_age_seconds: 300,
        },
      },
      expected: { consistent: false, skew: ["clock", "freshness", "schema"] },
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "diagnose_training_serving_skew",
  parameters: ["record"],
  contract:
    "Compare training and serving transform, schema, default, and clock semantics; also enforce the serving freshness bound.",
});

function generateSteps(input: unknown) {
  const record = input as {
    training?: Record<string, unknown>;
    serving?: Record<string, unknown>;
  };
  const training = record?.training ?? {};
  const serving = record?.serving ?? {};
  const fields = [
    ["transform", "transform_digest"],
    ["schema", "schema_version"],
    ["default", "default_policy"],
    ["clock", "clock_basis"],
  ] as const;
  const compared = fields.map(([label, field]) => [
    label,
    String(training[field] ?? "missing"),
    String(serving[field] ?? "missing"),
    training[field] === serving[field] ? "match" : "skew",
  ]);
  const freshnessSkew =
    Number(serving.feature_age_seconds ?? 0) > Number(serving.max_age_seconds ?? 0);
  return matrixSteps([
    {
      codeLine: 2,
      what: "Place offline and online feature contracts side by side.",
      why: "Skew is a semantic mismatch across execution paths, not merely a model-score symptom.",
      values: compared.map((row) => [row[0], row[1], row[2], "unchecked"]),
      colHeaders: ["dimension", "training", "serving", "status"],
      activeCells: [
        [0, 1],
        [0, 2],
      ],
    },
    {
      codeLine: 10,
      what: "Compare transformation, schema, default, and clock identities.",
      why: "Duplicated implementations and time bases can silently produce different feature values.",
      values: compared,
      colHeaders: ["dimension", "training", "serving", "status"],
      activeCells: compared.flatMap((row, index) =>
        row[3] === "skew" ? [[index, 3] as const] : [],
      ),
    },
    {
      codeLine: 13,
      what: "Apply the online freshness contract.",
      why: "Matching code and schema still yield skew when serving reads data older than training assumptions permit.",
      values: [
        ...compared,
        [
          "freshness",
          `max ${String(serving.max_age_seconds ?? "missing")}s`,
          `age ${String(serving.feature_age_seconds ?? "missing")}s`,
          freshnessSkew ? "skew" : "match",
        ],
      ],
      colHeaders: ["dimension", "training", "serving", "status"],
      activeCells: [[compared.length, 3]],
    },
  ]);
}

export const trainingServingSkew = defineDebuggingItem({
  id: "training-serving-skew",
  title: "Training-serving skew",
  topicIds: ["ml_feature_pipelines"],
  difficultyProfile: profile(2, 3, 2, 3),
  description:
    "Diagnose offline/online semantic divergence across transformations, schemas, defaults, clocks, and feature freshness.",
  objective:
    "Use contract evidence to identify the exact skew dimensions instead of attributing every prediction regression to the model.",
  completionEvidence:
    "The diagnosis distinguishes a consistent path from duplicated-transform/default skew and schema/clock/freshness skew across typed cases.",
  sources: [
    verifiedSource({
      label: "Google ML production data transformations",
      url: "https://developers.google.com/machine-learning/crash-course/production-ml-systems/transforming-data",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps,
  assessmentPayload: {
    variant: "changed-online-contract",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def diagnose_training_serving_skew(record):
    return {"consistent": record["training"]["schema_version"] == record["serving"]["schema_version"], "skew": []}`,
    evidence: [
      {
        label: "Training snapshot",
        content:
          "Transform v8, schema customer-v5, a snapshot-derived median default, and UTC event time produced the offline features.",
      },
      {
        label: "Online request",
        content:
          "The request records transform/schema/default/clock identities plus feature age and the serving freshness bound.",
      },
    ],
    failingTests: [
      "Detect duplicated transformation and default-policy differences.",
      "Detect clock and schema changes independently.",
      "Reject online feature values older than their freshness contract.",
    ],
    hints: [
      "Compare semantic identities, not only field names.",
      "Freshness is a separate invariant even when transformations match.",
    ],
  },
});
