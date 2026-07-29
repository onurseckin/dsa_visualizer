import {
  defineDebuggingItem,
  functionExecution,
  graphSteps,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def respond_to_ml_incident(request):
    timeline = sorted(request["events"], key=lambda event: event["timestamp"])
    signal_types = [event["type"] for event in timeline]
    first_signal = signal_types[0] if signal_types else "none"
    if "schema_error" in signal_types:
        return {"first_signal": first_signal, "action": "fallback-and-repair-data", "preserve": ["request-sample", "schema-version", "model-version"], "retrain": False}
    if "canary_quality_drop" in signal_types:
        return {"first_signal": first_signal, "action": "rollback-model", "preserve": ["canary-metrics", "model-version", "feature-snapshot"], "retrain": False}
    if "dependency_error" in signal_types:
        return {"first_signal": first_signal, "action": "shift-traffic-to-fallback", "preserve": ["trace", "dependency-version"], "retrain": False}
    if "drift" in signal_types:
        return {"first_signal": first_signal, "action": "investigate-with-labels", "preserve": ["reference-window", "current-window"], "retrain": False}
    return {"first_signal": first_signal, "action": "continue-investigation", "preserve": ["timeline"], "retrain": False}`;

const execution = functionExecution({
  entrypoint: "respond_to_ml_incident",
  outputContract:
    "Sort the incident timeline and return first signal, evidence-backed containment, evidence to preserve, and whether immediate retraining is justified.",
  cases: [
    {
      id: "schema-break",
      label: "Upstream schema change breaks requests",
      input: {
        events: [
          { timestamp: 20, type: "latency_alarm" },
          { timestamp: 10, type: "schema_error" },
          { timestamp: 30, type: "drift" },
        ],
      },
      expected: {
        first_signal: "schema_error",
        action: "fallback-and-repair-data",
        preserve: ["request-sample", "schema-version", "model-version"],
        retrain: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "canary-model",
      label: "Canary quality drops after release",
      input: {
        events: [
          { timestamp: 100, type: "release" },
          { timestamp: 120, type: "canary_quality_drop" },
        ],
      },
      expected: {
        first_signal: "release",
        action: "rollback-model",
        preserve: ["canary-metrics", "model-version", "feature-snapshot"],
        retrain: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "drift-only",
      label: "Distribution shift without outcome evidence",
      input: {
        events: [
          { timestamp: 5, type: "drift" },
          { timestamp: 7, type: "service_healthy" },
        ],
      },
      expected: {
        first_signal: "drift",
        action: "investigate-with-labels",
        preserve: ["reference-window", "current-window"],
        retrain: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "dependency-outage",
      label: "Feature dependency outage",
      input: {
        events: [
          { timestamp: 1, type: "dependency_error" },
          { timestamp: 2, type: "error_rate_alarm" },
        ],
      },
      expected: {
        first_signal: "dependency_error",
        action: "shift-traffic-to-fallback",
        preserve: ["trace", "dependency-version"],
        retrain: false,
      },
      comparison: "deep-equal",
    },
  ],
});

export const mlIncidentResponse = defineDebuggingItem({
  id: "ml-incident-response",
  title: "Reconstruct an ML Incident",
  topicIds: ["ml_observability_incidents"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Reconstruct a timestamped incident and choose among rollback, fallback, traffic shift, data repair, retraining, and investigation.",
  objective:
    "Contain the earliest evidence-backed failure while preserving the artifacts needed for causal analysis and a later retraining decision.",
  completionEvidence:
    "The response orders the timeline, separates containment from remediation, preserves named evidence, and avoids unsupported retraining.",
  sources: [
    verifiedSource({
      label: "NIST AI RMF Core",
      url: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "respond_to_ml_incident",
    parameters: ["request"],
    contract: "Return first_signal, action, preserve, and retrain from ordered incident evidence.",
  }),
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      graphSteps([
        {
          codeLine: 2,
          what: "Order the evidence by timestamp.",
          why: "The first observable break constrains plausible causes.",
          nodes: [
            { id: "detect", label: "Detect" },
            { id: "contain", label: "Contain" },
            { id: "preserve", label: "Preserve" },
            { id: "remediate", label: "Remediate" },
          ],
          edges: [
            { from: "detect", to: "contain" },
            { from: "contain", to: "preserve" },
            { from: "preserve", to: "remediate" },
          ],
          activeNodeIds: ["detect"],
        },
        {
          codeLine: 6,
          what: "Choose containment for the failing layer.",
          why: "Fallback limits harm while keeping the causal hypothesis testable.",
          nodes: [
            { id: "detect", label: "Schema error" },
            { id: "contain", label: "Fallback" },
            { id: "preserve", label: "Preserve" },
            { id: "remediate", label: "Remediate" },
          ],
          edges: [
            { from: "detect", to: "contain" },
            { from: "contain", to: "preserve" },
            { from: "preserve", to: "remediate" },
          ],
          completedNodeIds: ["detect"],
          activeNodeIds: ["contain"],
          traversedEdgeIndexes: [0],
        },
        {
          codeLine: 6,
          what: "Preserve request, schema, and model versions.",
          why: "Evidence loss prevents reconstruction after service recovery.",
          nodes: [
            { id: "detect", label: "Schema error" },
            { id: "contain", label: "Fallback" },
            { id: "preserve", label: "Versioned evidence" },
            { id: "remediate", label: "Remediate" },
          ],
          edges: [
            { from: "detect", to: "contain" },
            { from: "contain", to: "preserve" },
            { from: "preserve", to: "remediate" },
          ],
          completedNodeIds: ["detect", "contain"],
          activeNodeIds: ["preserve"],
          traversedEdgeIndexes: [0, 1],
        },
        {
          codeLine: 6,
          what: "Repair the data contract before considering retraining.",
          why: "A schema break is not evidence that model parameters are stale.",
          nodes: [
            { id: "detect", label: "Schema error" },
            { id: "contain", label: "Fallback" },
            { id: "preserve", label: "Versioned evidence" },
            { id: "remediate", label: "Repair data" },
          ],
          edges: [
            { from: "detect", to: "contain" },
            { from: "contain", to: "preserve" },
            { from: "preserve", to: "remediate" },
          ],
          completedNodeIds: ["detect", "contain", "preserve"],
          activeNodeIds: ["remediate"],
          traversedEdgeIndexes: [0, 1, 2],
        },
      ]),
      input,
      ["events"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "changed-incident-timeline",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def respond_to_ml_incident(request):
    return {"action": "retrain", "preserve": [], "retrain": True}`,
    evidence: [
      {
        label: "Timeline",
        content: "Schema errors begin before latency and drift alerts.",
      },
      {
        label: "Deployment",
        content: "The model version did not change during the incident.",
      },
    ],
    failingTests: [
      "Schema break chooses fallback and data repair.",
      "Every containment preserves reconstructable evidence.",
    ],
    hints: ["Order evidence before choosing action.", "Containment is not root-cause repair."],
  },
});
