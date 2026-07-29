import {
  defineDebuggingItem,
  functionExecution,
  graphSteps,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def diagnose_rollout(request):
    if request["baseline_schema"] != request["canary_schema"]:
        return {"diagnosis": "schema-mismatch", "action": "halt-rollout-and-restore-compatible-schema", "layer": "request-contract", "rollback": True}
    if request.get("dependency_healthy") is False:
        return {"diagnosis": "dependency-failure", "action": "shift-traffic-or-use-fallback", "layer": "dependency", "rollback": False}
    if request.get("cold_start_p95_ms", 0) > request["timeout_ms"]:
        return {"diagnosis": "cold-start-timeout", "action": "prewarm-and-hold-rollout", "layer": "runtime", "rollback": False}
    if request.get("canary_utilization", 0) >= 0.95:
        return {"diagnosis": "resource-saturation", "action": "add-capacity-and-retest", "layer": "runtime", "rollback": False}
    if request.get("canary_quality", 1) < request.get("minimum_quality", 0):
        return {"diagnosis": "model-regression", "action": "rollback-model-version", "layer": "model", "rollback": True}
    return {"diagnosis": "no-regression", "action": "continue-observation", "layer": "none", "rollback": False}`;

const execution = functionExecution({
  entrypoint: "diagnose_rollout",
  outputContract:
    "Return the highest-confidence rollout diagnosis, targeted action, failing layer, and whether model/schema rollback is required.",
  cases: [
    {
      id: "schema-mismatch",
      label: "Canary expects a new schema",
      input: {
        baseline_schema: "v2",
        canary_schema: "v3",
        dependency_healthy: true,
        timeout_ms: 200,
        canary_quality: 0.95,
        minimum_quality: 0.9,
      },
      expected: {
        diagnosis: "schema-mismatch",
        action: "halt-rollout-and-restore-compatible-schema",
        layer: "request-contract",
        rollback: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "cold-start",
      label: "Canary cold start exceeds timeout",
      input: {
        baseline_schema: "v2",
        canary_schema: "v2",
        dependency_healthy: true,
        cold_start_p95_ms: 900,
        timeout_ms: 500,
        canary_quality: 0.94,
        minimum_quality: 0.9,
      },
      expected: {
        diagnosis: "cold-start-timeout",
        action: "prewarm-and-hold-rollout",
        layer: "runtime",
        rollback: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "bad-model",
      label: "Model quality regresses with healthy service",
      input: {
        baseline_schema: "v2",
        canary_schema: "v2",
        dependency_healthy: true,
        cold_start_p95_ms: 100,
        timeout_ms: 500,
        canary_utilization: 0.6,
        canary_quality: 0.82,
        minimum_quality: 0.9,
      },
      expected: {
        diagnosis: "model-regression",
        action: "rollback-model-version",
        layer: "model",
        rollback: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "dependency",
      label: "Canary dependency fails",
      input: {
        baseline_schema: "v2",
        canary_schema: "v2",
        dependency_healthy: false,
        timeout_ms: 500,
        canary_quality: 0.94,
        minimum_quality: 0.9,
      },
      expected: {
        diagnosis: "dependency-failure",
        action: "shift-traffic-or-use-fallback",
        layer: "dependency",
        rollback: false,
      },
      comparison: "deep-equal",
    },
  ],
});

export const rolloutRegressionDebugging = defineDebuggingItem({
  id: "rollout-regression-debugging",
  title: "Debug an Inference Rollout Regression",
  topicIds: ["ml_inference_serving"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Use baseline/canary evidence to separate request schema, dependency, cold-start, saturation, and model-quality regressions.",
  objective:
    "Localize a rollout failure to the earliest incompatible layer and choose rollback, hold, capacity repair, or traffic shift accordingly.",
  completionEvidence:
    "The diagnosis cites comparative evidence, identifies the failing layer, and chooses a containment action narrower than reflexive rollback.",
  sources: [
    verifiedSource({
      label: "KServe control plane architecture",
      url: "https://kserve.github.io/website/docs/concepts/architecture/control-plane",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "diagnose_rollout",
    parameters: ["request"],
    contract: "Return diagnosis, action, layer, and rollback from baseline/canary evidence.",
  }),
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      graphSteps([
        {
          codeLine: 2,
          what: "Compare the request contract before runtime metrics.",
          why: "An incompatible schema invalidates downstream comparisons.",
          nodes: [
            { id: "schema", label: "Schema" },
            { id: "dependency", label: "Dependency" },
            { id: "runtime", label: "Runtime" },
            { id: "model", label: "Model" },
            { id: "action", label: "Containment" },
          ],
          edges: [
            { from: "schema", to: "action" },
            { from: "dependency", to: "action" },
            { from: "runtime", to: "action" },
            { from: "model", to: "action" },
          ],
          activeNodeIds: ["schema"],
        },
        {
          codeLine: 4,
          what: "Check dependency health next.",
          why: "An upstream failure can mimic a model or capacity regression.",
          nodes: [
            { id: "schema", label: "Compatible" },
            { id: "dependency", label: "Dependency" },
            { id: "runtime", label: "Runtime" },
            { id: "model", label: "Model" },
            { id: "action", label: "Containment" },
          ],
          edges: [
            { from: "schema", to: "action" },
            { from: "dependency", to: "action" },
            { from: "runtime", to: "action" },
            { from: "model", to: "action" },
          ],
          completedNodeIds: ["schema"],
          activeNodeIds: ["dependency"],
          traversedEdgeIndexes: [0],
        },
        {
          codeLine: 6,
          what: "Separate cold start and saturation from model quality.",
          why: "Runtime containment differs from model-version rollback.",
          nodes: [
            { id: "schema", label: "Compatible" },
            { id: "dependency", label: "Healthy" },
            { id: "runtime", label: "Runtime evidence" },
            { id: "model", label: "Model" },
            { id: "action", label: "Containment" },
          ],
          edges: [
            { from: "schema", to: "action" },
            { from: "dependency", to: "action" },
            { from: "runtime", to: "action" },
            { from: "model", to: "action" },
          ],
          completedNodeIds: ["schema", "dependency"],
          activeNodeIds: ["runtime"],
          traversedEdgeIndexes: [0, 1],
        },
        {
          codeLine: 10,
          what: "Use quality rollback only after service layers pass.",
          why: "Comparative evidence supports the narrowest safe containment.",
          nodes: [
            { id: "schema", label: "Compatible" },
            { id: "dependency", label: "Healthy" },
            { id: "runtime", label: "Healthy" },
            { id: "model", label: "Quality regression" },
            { id: "action", label: "Rollback model" },
          ],
          edges: [
            { from: "schema", to: "action" },
            { from: "dependency", to: "action" },
            { from: "runtime", to: "action" },
            { from: "model", to: "action" },
          ],
          completedNodeIds: ["schema", "dependency", "runtime"],
          activeNodeIds: ["model", "action"],
          traversedEdgeIndexes: [0, 1, 2, 3],
        },
      ]),
      input,
      ["baseline_schema", "canary_schema", "dependency_healthy"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "changed-canary-evidence",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def diagnose_rollout(request):
    if request["canary_quality"] < request["minimum_quality"]:
        return {"diagnosis": "bad-model", "action": "rollback"}
    return {"diagnosis": "healthy"}`,
    evidence: [
      {
        label: "Canary request",
        content: "Baseline accepts schema v2 while the canary requires a new field from v3.",
      },
      {
        label: "Model evaluation",
        content: "Offline quality remains above the release threshold.",
      },
    ],
    failingTests: [
      "Schema mismatch must be detected before model quality.",
      "Cold start does not require model-version rollback.",
    ],
    hints: ["Compare contract layers in dependency order.", "Choose the narrowest containment."],
  },
});
