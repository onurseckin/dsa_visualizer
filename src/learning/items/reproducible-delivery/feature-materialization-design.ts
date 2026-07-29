import {
  defineScenarioItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def validate_materialization_plan(plan):
    mode = plan.get("mode")
    missing = []
    if mode not in ("batch", "streaming", "hybrid"):
        missing.append("mode")
    if not plan.get("offline_store"):
        missing.append("offline_store")
    if mode in ("streaming", "hybrid") and not plan.get("online_store"):
        missing.append("online_store")
    if plan.get("event_time_policy") != "utc-event-time":
        missing.append("event_time_policy")
    if not plan.get("late_data_policy"):
        missing.append("late_data_policy")
    if mode in ("streaming", "hybrid") and (
        plan.get("freshness_seconds", float("inf"))
        > plan.get("required_freshness_seconds", -1)
    ):
        missing.append("freshness_slo")
    missing.sort()
    return {"mode": mode, "valid": not missing, "missing": missing}`;

const execution = functionExecution({
  entrypoint: "validate_materialization_plan",
  outputContract:
    "Return mode, valid, and sorted missing plan invariants: offline storage, UTC event-time and late-data policy, plus online storage/freshness for streaming or hybrid plans.",
  cases: [
    {
      id: "daily-batch-plan",
      label: "Daily scoring can use offline materialization",
      input: {
        mode: "batch",
        offline_store: "warehouse://features/customer-v5",
        online_store: "",
        event_time_policy: "utc-event-time",
        late_data_policy: "recompute-affected-partitions",
        freshness_seconds: 86400,
        required_freshness_seconds: 86400,
      },
      expected: { mode: "batch", valid: true, missing: [] },
      comparison: "deep-equal",
    },
    {
      id: "streaming-plan",
      label: "Low-latency feature uses offline and online stores",
      input: {
        mode: "streaming",
        offline_store: "warehouse://features/risk-v8",
        online_store: "kv://features/risk-v8",
        event_time_policy: "utc-event-time",
        late_data_policy: "watermark-10m-and-reconcile",
        freshness_seconds: 20,
        required_freshness_seconds: 60,
      },
      expected: { mode: "streaming", valid: true, missing: [] },
      comparison: "deep-equal",
    },
    {
      id: "invalid-hybrid-plan",
      label: "Hybrid plan omits online destination and violates freshness",
      input: {
        mode: "hybrid",
        offline_store: "warehouse://features/risk-v9",
        online_store: "",
        event_time_policy: "processing-time-local",
        late_data_policy: "",
        freshness_seconds: 900,
        required_freshness_seconds: 120,
      },
      expected: {
        mode: "hybrid",
        valid: false,
        missing: ["event_time_policy", "freshness_slo", "late_data_policy", "online_store"],
      },
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "validate_materialization_plan",
  parameters: ["plan"],
  contract:
    "Validate plan mode, offline/online stores, UTC event time, late data handling, and streaming/hybrid freshness SLO.",
});

function generateSteps(input: unknown) {
  const plan =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const mode = String(plan.mode ?? "unselected");
  const nodes = [
    { id: "source", label: "timestamped source" },
    { id: "transform", label: "shared feature transform" },
    { id: "offline", label: String(plan.offline_store || "offline store missing") },
    { id: "online", label: String(plan.online_store || "online store not planned") },
    { id: "training", label: "historical training join" },
    { id: "serving", label: "online serving lookup" },
  ];
  const allEdges = [
    { from: "source", to: "transform" },
    { from: "transform", to: "offline" },
    { from: "offline", to: "training" },
    { from: "transform", to: "online" },
    { from: "online", to: "serving" },
  ];
  const edges = mode === "batch" ? allEdges.slice(0, 3) : allEdges;
  return graphSteps([
    {
      codeLine: 2,
      what: "Start from the product freshness and access requirements.",
      why: "Batch, streaming, and hybrid are consequences of constraints, not default architecture choices.",
      nodes,
      edges,
      activeNodeIds: ["source"],
      variables: { mode },
    },
    {
      codeLine: 6,
      what: "Bind one feature definition to its offline historical evidence.",
      why: "Training needs point-in-time retrieval from immutable or versioned history.",
      nodes,
      edges,
      activeNodeIds: ["transform", "offline", "training"],
      traversedEdgeIndexes: [0, 1, 2],
    },
    {
      codeLine: 8,
      what: "Add the online path only when the chosen mode requires it.",
      why: "A shared transform plus explicit event-time, late-data, and freshness contracts prevent offline/online divergence.",
      nodes,
      edges,
      completedNodeIds:
        mode === "batch"
          ? ["source", "transform", "offline", "training"]
          : ["source", "transform", "offline", "online", "training", "serving"],
      traversedEdgeIndexes: edges.map((_, index) => index),
    },
  ]);
}

export const featureMaterializationDesign = defineScenarioItem({
  id: "feature-materialization-design",
  title: "Feature materialization design",
  topicIds: ["ml_feature_pipelines"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Choose batch, streaming, or hybrid materialization and connect versioned offline history to any required online serving path.",
  objective:
    "Justify a materialization mode from latency, freshness, backfill, and consistency constraints and encode its artifact-level invariants.",
  completionEvidence:
    "A rubric-supported architecture explains tradeoffs, while the executable validator accepts valid batch/streaming plans and rejects an inconsistent hybrid artifact.",
  sources: [
    verifiedSource({
      label: "Feast architecture",
      url: "https://docs.feast.dev/getting-started/architecture/overview",
    }),
  ],
  prompt: {
    context:
      "A risk score needs 60-second online freshness, reproducible six-month training history, and repairable late transactions.",
    question:
      "Choose batch, streaming, or hybrid materialization and design the offline/online store plan.",
    constraints: [
      "State how event time, freshness, and late data are handled.",
      "Use one versioned feature definition across historical and online retrieval.",
      "Explain backfill and reconciliation behavior without claiming one universal architecture.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "mode",
        label: "Mode from constraints",
        description:
          "Derives batch, streaming, or hybrid mode from stated latency and freshness needs.",
        points: 2,
        critical: true,
      },
      {
        id: "consistency",
        label: "Offline/online consistency",
        description: "Shares feature semantics and names the offline and online evidence paths.",
        points: 3,
        critical: true,
      },
      {
        id: "time",
        label: "Time and repair",
        description: "Defines event time, late-data policy, backfill, and reconciliation.",
        points: 3,
      },
    ],
  },
  playground: { code, starterCode, execution, generateSteps },
  assessmentPayload: {
    variant: "changed-freshness-and-backfill",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["Batch", "Streaming", "Hybrid"],
    consequences:
      "The architecture rationale remains rubric-scored; executable cases validate only the submitted plan artifact's explicit invariants.",
  },
});
