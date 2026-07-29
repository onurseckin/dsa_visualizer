import {
  defineDebuggingItem,
  functionExecution,
  graphSteps,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def resolve_data_governance(request):
    consent_valid = bool(request.get("consent_valid"))
    affected_models = sorted(request.get("lineage_models", []))
    if request.get("deletion_requested"):
        actions = ["delete-record", "revoke-feature-access", "append-audit-event"]
        if affected_models:
            actions.append("review-unlearning")
        return {"actions": actions, "retained": False, "affected_models": affected_models, "consent_valid": consent_valid}
    if request["age_days"] > request["retention_days"]:
        return {"actions": ["delete-expired-record", "append-audit-event"], "retained": False, "affected_models": affected_models, "consent_valid": consent_valid}
    if not consent_valid:
        return {"actions": ["restrict-processing", "redact-sensitive-fields", "append-audit-event"], "retained": True, "affected_models": affected_models, "consent_valid": False}
    return {"actions": ["retain-with-access-control"], "retained": True, "affected_models": affected_models, "consent_valid": True}`;

const execution = functionExecution({
  entrypoint: "resolve_data_governance",
  outputContract:
    "Return ordered lifecycle actions, retention result, sorted affected model versions, and current consent validity.",
  cases: [
    {
      id: "deletion-request",
      label: "Deletion request with downstream model lineage",
      input: {
        consent_valid: true,
        deletion_requested: true,
        age_days: 30,
        retention_days: 365,
        lineage_models: ["risk-v4", "risk-v3"],
      },
      expected: {
        actions: [
          "delete-record",
          "revoke-feature-access",
          "append-audit-event",
          "review-unlearning",
        ],
        retained: false,
        affected_models: ["risk-v3", "risk-v4"],
        consent_valid: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "retention-expired",
      label: "Record exceeds retention period",
      input: {
        consent_valid: true,
        deletion_requested: false,
        age_days: 400,
        retention_days: 365,
        lineage_models: [],
      },
      expected: {
        actions: ["delete-expired-record", "append-audit-event"],
        retained: false,
        affected_models: [],
        consent_valid: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "consent-revoked",
      label: "Consent is not valid but retention has not expired",
      input: {
        consent_valid: false,
        deletion_requested: false,
        age_days: 20,
        retention_days: 365,
        lineage_models: ["ranking-v2"],
      },
      expected: {
        actions: ["restrict-processing", "redact-sensitive-fields", "append-audit-event"],
        retained: true,
        affected_models: ["ranking-v2"],
        consent_valid: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "permitted-retention",
      label: "Valid consent and retention",
      input: {
        consent_valid: true,
        deletion_requested: false,
        age_days: 20,
        retention_days: 365,
        lineage_models: ["ranking-v2"],
      },
      expected: {
        actions: ["retain-with-access-control"],
        retained: true,
        affected_models: ["ranking-v2"],
        consent_valid: true,
      },
      comparison: "deep-equal",
    },
  ],
});

export const sensitiveDataGovernance = defineDebuggingItem({
  id: "sensitive-data-governance",
  title: "Debug Sensitive-Data Governance",
  topicIds: ["ml_governance_security_cost"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Resolve access, consent, retention, deletion, redaction, audit, lineage, and model-impact obligations for a sensitive record.",
  objective:
    "Propagate a governance event across storage, features, audit evidence, and downstream model lineage without claiming automatic unlearning.",
  completionEvidence:
    "The repair applies ordered lifecycle actions, preserves audit evidence, names affected versions, and separates deletion from unlearning review.",
  sources: [
    verifiedSource({
      label: "NIST Artificial Intelligence Risk Management Framework 1.0",
      url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "resolve_data_governance",
    parameters: ["request"],
    contract:
      "Return actions, retained, affected_models, and consent_valid for the governance event.",
  }),
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      graphSteps([
        {
          codeLine: 2,
          what: "Read consent, retention, and deletion evidence.",
          why: "Governance action starts from the applicable record-level obligation.",
          nodes: [
            { id: "record", label: "Sensitive record" },
            { id: "feature", label: "Feature access" },
            { id: "audit", label: "Audit log" },
            { id: "models", label: "Model lineage" },
          ],
          edges: [
            { from: "record", to: "feature" },
            { from: "record", to: "audit" },
            { from: "feature", to: "models" },
          ],
          activeNodeIds: ["record"],
        },
        {
          codeLine: 5,
          what: "Delete the record and revoke feature access.",
          why: "Deletion must propagate to serving access rather than only one storage table.",
          nodes: [
            { id: "record", label: "Delete record" },
            { id: "feature", label: "Revoke access" },
            { id: "audit", label: "Audit log" },
            { id: "models", label: "Model lineage" },
          ],
          edges: [
            { from: "record", to: "feature" },
            { from: "record", to: "audit" },
            { from: "feature", to: "models" },
          ],
          completedNodeIds: ["record"],
          activeNodeIds: ["feature"],
          traversedEdgeIndexes: [0],
        },
        {
          codeLine: 5,
          what: "Append an immutable audit event.",
          why: "Governance execution needs evidence without retaining the deleted payload.",
          nodes: [
            { id: "record", label: "Deleted" },
            { id: "feature", label: "Revoked" },
            { id: "audit", label: "Deletion evidence" },
            { id: "models", label: "Model lineage" },
          ],
          edges: [
            { from: "record", to: "feature" },
            { from: "record", to: "audit" },
            { from: "feature", to: "models" },
          ],
          completedNodeIds: ["record", "feature"],
          activeNodeIds: ["audit"],
          traversedEdgeIndexes: [0, 1],
        },
        {
          codeLine: 7,
          what: "Review affected model versions through lineage.",
          why: "Data deletion can require impact analysis but does not imply trivial parameter removal.",
          nodes: [
            { id: "record", label: "Deleted" },
            { id: "feature", label: "Revoked" },
            { id: "audit", label: "Deletion evidence" },
            { id: "models", label: "Unlearning review" },
          ],
          edges: [
            { from: "record", to: "feature" },
            { from: "record", to: "audit" },
            { from: "feature", to: "models" },
          ],
          completedNodeIds: ["record", "feature", "audit"],
          activeNodeIds: ["models"],
          traversedEdgeIndexes: [0, 1, 2],
        },
      ]),
      input,
      ["deletion_requested", "age_days", "lineage_models"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "changed-deletion-and-lineage",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def resolve_data_governance(request):
    if request.get("deletion_requested"):
        return {"actions": ["delete-row"], "retained": False}
    return {"actions": [], "retained": True}`,
    evidence: [
      {
        label: "Deletion request",
        content:
          "The record was materialized into an online feature and two trained model versions.",
      },
      {
        label: "Audit finding",
        content: "The storage row was removed, but feature access and lineage review were omitted.",
      },
    ],
    failingTests: [
      "Deletion propagates to feature access and audit evidence.",
      "Affected models trigger review without claiming automatic unlearning.",
    ],
    hints: [
      "Trace every downstream artifact and access path.",
      "Separate evidence deletion from audit evidence about the action.",
    ],
  },
});
