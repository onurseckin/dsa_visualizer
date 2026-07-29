import {
  defineScenarioItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def threat_model_ml_system(request):
    threats = []
    controls = []
    if request.get("credentials_long_lived"):
        threats.append("credential-theft")
        controls.append("short-lived-identity")
    if not request.get("data_provenance_valid", True):
        threats.append("data-poisoning")
        controls.append("data-provenance-validation")
    if not request.get("artifact_signed", True):
        threats.append("artifact-tampering")
        controls.append("signed-artifact-verification")
    if request.get("endpoint_public"):
        threats.append("endpoint-abuse")
        controls.append("authentication-rate-limits")
    return {"threats": threats, "controls": controls, "risk_score": 3 * len(threats)}`;

const execution = functionExecution({
  entrypoint: "threat_model_ml_system",
  outputContract:
    "Return ordered lifecycle threats, one matched control for each threat, and a three-point-per-open-threat risk score.",
  cases: [
    {
      id: "exposed-supply-chain",
      label: "Open threats across the ML lifecycle",
      input: {
        credentials_long_lived: true,
        data_provenance_valid: false,
        artifact_signed: false,
        endpoint_public: true,
      },
      expected: {
        threats: ["credential-theft", "data-poisoning", "artifact-tampering", "endpoint-abuse"],
        controls: [
          "short-lived-identity",
          "data-provenance-validation",
          "signed-artifact-verification",
          "authentication-rate-limits",
        ],
        risk_score: 12,
      },
      comparison: "deep-equal",
    },
    {
      id: "controlled-lifecycle",
      label: "All modeled controls present",
      input: {
        credentials_long_lived: false,
        data_provenance_valid: true,
        artifact_signed: true,
        endpoint_public: false,
      },
      expected: { threats: [], controls: [], risk_score: 0 },
      comparison: "deep-equal",
    },
    {
      id: "artifact-only",
      label: "Unsigned registry artifact",
      input: {
        credentials_long_lived: false,
        data_provenance_valid: true,
        artifact_signed: false,
        endpoint_public: false,
      },
      expected: {
        threats: ["artifact-tampering"],
        controls: ["signed-artifact-verification"],
        risk_score: 3,
      },
      comparison: "deep-equal",
    },
  ],
});

export const mlSystemThreatModel = defineScenarioItem({
  id: "ml-system-threat-model",
  title: "Threat-Model an ML System",
  topicIds: ["ml_governance_security_cost"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Map threats and controls across training data, pipeline identity, artifact supply chain, feature access, and inference endpoints.",
  objective:
    "Build a lifecycle threat model that attaches a concrete preventive or detective control and owner to each trust boundary.",
  completionEvidence:
    "The response covers data, identity, artifact, and endpoint boundaries, prioritizes open threats, and names verifiable controls.",
  sources: [
    verifiedSource({
      label: "NIST Artificial Intelligence Risk Management Framework 1.0",
      url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    }),
  ],
  prompt: {
    context:
      "A training pipeline uses long-lived credentials, accepts weakly traced data, publishes unsigned artifacts, and exposes a public prediction endpoint.",
    question:
      "Which lifecycle threats matter, which controls reduce them, who owns verification, and what evidence closes each threat?",
    constraints: [
      "Cover data, credentials, artifacts, and endpoints rather than only the model file.",
      "A policy statement is not evidence that a control runs.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "boundaries",
        label: "Trust boundaries",
        description: "Identifies data, identity, artifact, and endpoint threat surfaces.",
        points: 3,
        critical: true,
      },
      {
        id: "controls",
        label: "Matched controls",
        description: "Maps each open threat to a testable preventive or detective control.",
        points: 2,
        critical: true,
      },
      {
        id: "ownership",
        label: "Ownership and evidence",
        description: "Assigns owners and closure evidence rather than relying on policy prose.",
        points: 1,
      },
    ],
  },
  playground: {
    code,
    starterCode: semanticStarter({
      entrypoint: "threat_model_ml_system",
      parameters: ["request"],
      contract: "Return ordered threats, matched controls, and risk_score across the lifecycle.",
    }),
    execution,
    generateSteps: () =>
      graphSteps([
        {
          codeLine: 4,
          what: "Inspect the pipeline identity boundary.",
          why: "Long-lived credentials increase replay and theft exposure.",
          nodes: [
            { id: "data", label: "Training data" },
            { id: "pipeline", label: "Pipeline identity" },
            { id: "artifact", label: "Model artifact" },
            { id: "endpoint", label: "Endpoint" },
          ],
          edges: [
            { from: "data", to: "pipeline" },
            { from: "pipeline", to: "artifact" },
            { from: "artifact", to: "endpoint" },
          ],
          activeNodeIds: ["pipeline"],
        },
        {
          codeLine: 7,
          what: "Verify training-data provenance.",
          why: "Untrusted data can alter model behavior before packaging controls run.",
          nodes: [
            { id: "data", label: "Unverified data" },
            { id: "pipeline", label: "Short-lived identity" },
            { id: "artifact", label: "Model artifact" },
            { id: "endpoint", label: "Endpoint" },
          ],
          edges: [
            { from: "data", to: "pipeline" },
            { from: "pipeline", to: "artifact" },
            { from: "artifact", to: "endpoint" },
          ],
          completedNodeIds: ["pipeline"],
          activeNodeIds: ["data"],
          traversedEdgeIndexes: [0],
        },
        {
          codeLine: 10,
          what: "Verify the artifact supply chain.",
          why: "Signing binds the reviewed artifact to what serving loads.",
          nodes: [
            { id: "data", label: "Verified data" },
            { id: "pipeline", label: "Short-lived identity" },
            { id: "artifact", label: "Unsigned artifact" },
            { id: "endpoint", label: "Endpoint" },
          ],
          edges: [
            { from: "data", to: "pipeline" },
            { from: "pipeline", to: "artifact" },
            { from: "artifact", to: "endpoint" },
          ],
          completedNodeIds: ["data", "pipeline"],
          activeNodeIds: ["artifact"],
          traversedEdgeIndexes: [0, 1],
        },
        {
          codeLine: 13,
          what: "Protect the public endpoint.",
          why: "Authentication and rate limits constrain abuse at the final boundary.",
          nodes: [
            { id: "data", label: "Verified data" },
            { id: "pipeline", label: "Short-lived identity" },
            { id: "artifact", label: "Signed artifact" },
            { id: "endpoint", label: "Protected endpoint" },
          ],
          edges: [
            { from: "data", to: "pipeline" },
            { from: "pipeline", to: "artifact" },
            { from: "artifact", to: "endpoint" },
          ],
          completedNodeIds: ["data", "pipeline", "artifact"],
          activeNodeIds: ["endpoint"],
          traversedEdgeIndexes: [0, 1, 2],
        },
      ]),
  },
  assessmentPayload: {
    variant: "changed-trust-boundaries",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["model-file-only", "full-lifecycle-threat-model", "endpoint-firewall-only"],
    consequences:
      "Securing only the endpoint leaves training data, credentials, and model artifacts vulnerable upstream.",
  },
});
