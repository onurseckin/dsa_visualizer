import { graphSteps, profile, semanticStarter, verifiedSource } from "../../authoring";
import type { CapstoneChecklistItem, CapstoneTimelinePrompt } from "../../assessment";
import type { RubricDefinition } from "../../types";

export const CAPSTONE_TOPIC_IDS = ["ml_platform_capstone"] as const;
export const CAPSTONE_DIFFICULTY = profile(3, 3, 3, 3);

export const capstoneStarter = (entrypoint: string, contract: string): string =>
  semanticStarter({ entrypoint, parameters: ["spec"], contract });

export const batchPlatformSource = verifiedSource({
  label: "Google Cloud — MLOps continuous delivery and automation pipelines",
  url: "https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning",
});

export const realtimePlatformSource = verifiedSource({
  label: "Google ML Crash Course — Static versus dynamic inference",
  url: "https://developers.google.com/machine-learning/crash-course/production-ml-systems/static-vs-dynamic-inference",
});

export const incidentResponseSource = verifiedSource({
  label: "NIST AI RMF Core — Manage",
  url: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
});

export const platformRubric: RubricDefinition = {
  criteria: [
    {
      id: "framing",
      label: "Decision and success contract",
      description: "Connects the prediction to an action, owner, metric, and guardrail.",
      points: 3,
      critical: true,
    },
    {
      id: "data",
      label: "Data and feature evidence",
      description: "Defines snapshots, labels, split policy, lineage, and consistency checks.",
      points: 3,
      critical: true,
    },
    {
      id: "execution",
      label: "Execution and capacity",
      description: "Sizes compute and explains retries, idempotence, backpressure, and recovery.",
      points: 3,
    },
    {
      id: "release",
      label: "Package and release safety",
      description:
        "Defines immutable artifacts, validation, promotion, canary, rollback, and fallback.",
      points: 3,
      critical: true,
    },
    {
      id: "operations",
      label: "Evaluation and operations",
      description:
        "Separates service, data, model, slice, and outcome signals with response actions.",
      points: 3,
    },
    {
      id: "governance",
      label: "Governance and cost",
      description: "Assigns access, retention, audit, security, privacy, and cost ownership.",
      points: 3,
    },
  ],
};

export const incidentRubric: RubricDefinition = {
  criteria: [
    {
      id: "scope",
      label: "Scope and severity",
      description: "Identifies affected decisions, users, versions, slices, and time windows.",
      points: 3,
    },
    {
      id: "containment",
      label: "Containment",
      description: "Chooses a reversible containment action and names its trigger and owner.",
      points: 3,
      critical: true,
    },
    {
      id: "evidence",
      label: "Evidence preservation",
      description: "Preserves code, data, configuration, artifacts, logs, and traffic evidence.",
      points: 3,
      critical: true,
    },
    {
      id: "diagnosis",
      label: "Causal diagnosis",
      description: "Separates service, data, model, and outcome hypotheses before remediation.",
      points: 3,
    },
    {
      id: "recovery",
      label: "Verified recovery",
      description:
        "Defines rollback, repair, replay, or retraining checks before restoring traffic.",
      points: 3,
      critical: true,
    },
    {
      id: "learning",
      label: "Follow-up controls",
      description: "Adds prevention, detection, ownership, and a delayed effectiveness check.",
      points: 3,
    },
  ],
};

export const platformChecklist: readonly CapstoneChecklistItem[] = [
  { id: "decision", label: "Prediction, action, metric, and guardrails are explicit" },
  { id: "evidence", label: "Data, code, environment, and artifact lineage are reproducible" },
  { id: "capacity", label: "Capacity and failure budgets use stated assumptions" },
  { id: "release", label: "Promotion, rollback, and fallback are testable" },
  { id: "operations", label: "Monitoring connects signals to owners and actions" },
  { id: "governance", label: "Security, privacy, retention, and cost controls have owners" },
] as const;

export const platformTimeline: readonly CapstoneTimelinePrompt[] = [
  { id: "frame", label: "Frame the decision and acceptance evidence" },
  { id: "build", label: "Build reproducible data, training, and package artifacts" },
  { id: "release", label: "Validate and promote through a reversible release" },
  { id: "operate", label: "Observe delayed outcomes and respond to failure" },
] as const;

export const incidentTimeline: readonly CapstoneTimelinePrompt[] = [
  { id: "detect", label: "Detect and declare the incident" },
  { id: "contain", label: "Contain decision impact without destroying evidence" },
  { id: "preserve", label: "Snapshot traffic, data, code, configuration, and artifacts" },
  { id: "diagnose", label: "Test service, data, model, and feedback-loop hypotheses" },
  { id: "recover", label: "Verify rollback, repair, replay, or retraining" },
  { id: "learn", label: "Install controls and schedule effectiveness review" },
] as const;

export function lifecycleGraphSteps(activeNodeIds: readonly string[]) {
  const nodes = [
    { id: "frame", label: "Frame" },
    { id: "data", label: "Data" },
    { id: "train", label: "Train" },
    { id: "release", label: "Release" },
    { id: "operate", label: "Operate" },
  ] as const;
  const edges = [
    { from: "frame", to: "data" },
    { from: "data", to: "train" },
    { from: "train", to: "release" },
    { from: "release", to: "operate" },
    { from: "operate", to: "data" },
  ] as const;

  return graphSteps(
    activeNodeIds.map((activeNodeId, index) => ({
      codeLine: Math.min(index + 2, 5),
      what: `Validate the ${activeNodeId} lifecycle boundary.`,
      why:
        activeNodeId === "operate"
          ? "Production evidence must feed the next governed data and model decision."
          : "Each downstream artifact is trustworthy only when its upstream contract is explicit.",
      nodes,
      edges,
      activeNodeIds: [activeNodeId],
      completedNodeIds: activeNodeIds.slice(0, index),
      traversedEdgeIndexes: index === 0 ? [] : [index - 1],
      variables: { phase: activeNodeId },
    })),
  );
}
