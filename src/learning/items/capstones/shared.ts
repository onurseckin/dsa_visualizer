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

export const batchPlatformRubric: RubricDefinition = {
  criteria: [
    {
      id: "decision",
      label: "Decision and batch success contract",
      description:
        "Connects each scheduled prediction to an action, owner, freshness target, metric, and guardrail.",
      points: 3,
    },
    {
      id: "snapshot",
      label: "Point-in-time data snapshot",
      description:
        "Defines immutable inputs, labels, split policy, event-time cutoffs, lineage, and consistency checks.",
      points: 3,
      critical: true,
    },
    {
      id: "training-backfill",
      label: "Training and backfill execution",
      description:
        "Sizes scheduled compute and explains retry, idempotence, checkpoint, replay, and backfill behavior.",
      points: 3,
    },
    {
      id: "publication",
      label: "Artifact and prediction publication",
      description:
        "Defines immutable artifacts, validation, atomic prediction publication, promotion, rollback, and fallback.",
      points: 3,
      critical: true,
    },
    {
      id: "delayed-evaluation",
      label: "Delayed outcome evaluation",
      description:
        "Joins predictions to delayed labels and separates pipeline, data, model, slice, and outcome signals.",
      points: 3,
    },
    {
      id: "governance-cost",
      label: "Batch governance and cost",
      description:
        "Assigns access, retention, audit, security, privacy, storage, and scheduled-compute cost ownership.",
      points: 3,
    },
  ],
};

export const realtimePlatformRubric: RubricDefinition = {
  criteria: [
    {
      id: "decision-slo",
      label: "Decision and online SLO",
      description:
        "Connects each request-time prediction to an action, owner, latency and availability targets, metric, and guardrail.",
      points: 3,
    },
    {
      id: "feature-consistency",
      label: "Online feature consistency",
      description:
        "Defines event-time semantics, freshness, offline-online parity, lineage, validation, and safe missing-feature behavior.",
      points: 3,
      critical: true,
    },
    {
      id: "capacity-overload",
      label: "Capacity and overload control",
      description:
        "Sizes concurrency and explains admission control, backpressure, autoscaling, retry budgets, and recovery.",
      points: 3,
    },
    {
      id: "canary-compatibility",
      label: "Canary and compatibility safety",
      description:
        "Defines immutable artifacts, schema and runtime compatibility, traffic canaries, promotion evidence, and abort criteria.",
      points: 3,
      critical: true,
    },
    {
      id: "rollback-fallback",
      label: "Rollback and prediction fallback",
      description:
        "Defines fast rollback, last-known-good routing, degraded-mode decisions, and verification before traffic restoration.",
      points: 3,
      critical: true,
    },
    {
      id: "delayed-evaluation",
      label: "Delayed outcome evaluation",
      description:
        "Joins online decisions to delayed outcomes and separates service, data, model, slice, and business signals.",
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
      traversedEdgeIndexes:
        index === 0
          ? []
          : edges.flatMap((edge, edgeIndex) =>
              edge.from === activeNodeIds[index - 1] && edge.to === activeNodeId ? [edgeIndex] : [],
            ),
      variables: { phase: activeNodeId },
    })),
  );
}

export function incidentGraphSteps() {
  const nodes = [
    { id: "detect", label: "Detect" },
    { id: "contain", label: "Contain" },
    { id: "preserve", label: "Preserve" },
    { id: "diagnose", label: "Diagnose" },
    { id: "recover", label: "Recover" },
    { id: "learn", label: "Learn" },
  ] as const;
  const edges = nodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: nodes[index + 1]!.id,
  }));

  return graphSteps(
    nodes.map((node, index) => ({
      codeLine: Math.min(index + 2, 7),
      what: incidentTimeline[index]!.label,
      why:
        node.id === "contain"
          ? "Containment must reduce decision harm while preserving evidence for diagnosis."
          : node.id === "recover"
            ? "Recovery requires outcome-aware verification, not only healthy service telemetry."
            : "An auditable incident response advances only after the current evidence gate is met.",
      nodes,
      edges,
      activeNodeIds: [node.id],
      completedNodeIds: nodes.slice(0, index).map(({ id }) => id),
      traversedEdgeIndexes: index === 0 ? [] : [index - 1],
      variables: { phase: node.id },
    })),
  );
}
