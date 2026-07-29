import { defineCapstoneItem, functionExecution } from "../../authoring";
import {
  CAPSTONE_DIFFICULTY,
  CAPSTONE_TOPIC_IDS,
  capstoneStarter,
  incidentResponseSource,
  incidentRubric,
  incidentTimeline,
  lifecycleGraphSteps,
} from "./shared";

const code = `def validate_incident_record(spec):
    required = [
        "incident_id",
        "detected_at",
        "affected_versions",
        "containment",
        "preserved_artifacts",
        "owner",
    ]
    missing = [field for field in required if not spec.get(field)]
    evidence_preserved = bool(spec.get("preserved_artifacts"))
    containment_declared = bool(spec.get("containment"))

    return {
        "valid": not missing,
        "missing": missing,
        "evidence_preserved": evidence_preserved,
        "containment_declared": containment_declared,
    }`;

const outputContract =
  "Return missing incident-record fields in canonical order and whether containment and evidence preservation are explicitly declared.";

const execution = functionExecution({
  entrypoint: "validate_incident_record",
  outputContract,
  cases: [
    {
      id: "complete-record",
      label: "Complete incident evidence record",
      input: {
        incident_id: "INC-42",
        detected_at: "2026-07-28T09:30:00Z",
        affected_versions: ["dataset-v17", "model-v8"],
        containment: "shift traffic to model-v7",
        preserved_artifacts: ["request-sample", "feature-snapshot", "run-manifest"],
        owner: "ml-oncall",
      },
      expected: {
        valid: true,
        missing: [],
        evidence_preserved: true,
        containment_declared: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "empty-record",
      label: "Empty incident record",
      input: {},
      expected: {
        valid: false,
        missing: [
          "incident_id",
          "detected_at",
          "affected_versions",
          "containment",
          "preserved_artifacts",
          "owner",
        ],
        evidence_preserved: false,
        containment_declared: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "evidence-gap",
      label: "Containment declared before evidence preservation",
      input: {
        incident_id: "INC-99",
        detected_at: "2026-07-28T10:00:00Z",
        affected_versions: ["feature-view-v4"],
        containment: "disable affected feature",
        preserved_artifacts: [],
        owner: "incident-commander",
      },
      expected: {
        valid: false,
        missing: ["preserved_artifacts"],
        evidence_preserved: false,
        containment_declared: true,
      },
      comparison: "deep-equal",
    },
  ],
});

export const mlIncidentCapstone = defineCapstoneItem({
  id: "ml-incident-capstone",
  title: "Compound ML Incident Capstone",
  topicIds: CAPSTONE_TOPIC_IDS,
  difficultyProfile: CAPSTONE_DIFFICULTY,
  description:
    "Operate a compound data, drift, and rollout incident from declaration and reversible containment through evidence preservation, causal diagnosis, verified recovery, and retraining decision.",
  objective:
    "Lead an ML incident without destroying evidence, confusing service recovery with model recovery, or retraining before the causal and governance conditions are understood.",
  completionEvidence:
    "A rubric-scored incident timeline plus a complete machine-checkable incident evidence record.",
  sources: [incidentResponseSource],
  prompt: {
    context:
      "After a model rollout, one customer segment experiences a prediction shift. Feature freshness is degraded, labels are delayed, service latency is normal, and a scheduled dataset deletion ran during the same window.",
    question:
      "Operate the incident: declare scope, contain harm, preserve evidence, test competing hypotheses, choose rollback/repair/replay/retraining actions, verify recovery, and install follow-up controls.",
    constraints: [
      "The previous model depends on the same feature pipeline, so model rollback alone may not contain harm.",
      "Delayed labels prevent an immediate claim that model quality recovered.",
      "Retention and deletion obligations continue during incident investigation.",
    ],
  },
  rubric: incidentRubric,
  playground: {
    code,
    starterCode: capstoneStarter("validate_incident_record", outputContract),
    execution,
    generateSteps: () => lifecycleGraphSteps(["operate", "data", "release", "operate"]),
  },
  assessmentPayload: {
    variant: "compound-feature-rollout-incident",
    changedContext: true,
    isomorphicRetest: true,
    checklist: [
      { id: "scope", label: "Declare affected decisions, segments, versions, and time window" },
      { id: "contain", label: "Choose reversible containment with owner and trigger" },
      { id: "preserve", label: "Preserve data, traffic, code, config, and artifact evidence" },
      { id: "diagnose", label: "Test service, data, model, and feedback-loop hypotheses" },
      { id: "recover", label: "Verify recovery before restoring decisions" },
    ],
    incidentTimeline,
  },
});
