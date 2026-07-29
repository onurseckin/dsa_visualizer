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
    {
      id: "tradeoff-reasoning",
      label: "Batch tradeoff reasoning",
      description:
        "Justifies explicit freshness, cost, quality, replay, and delivery-window tradeoffs with the evidence that would change the choice.",
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
    {
      id: "governance-security-cost",
      label: "Online governance, privacy, security, and cost",
      description:
        "Assigns privacy purpose and retention limits, access control, secrets and dependency security, audit evidence, and request-time infrastructure cost ownership.",
      points: 3,
      critical: true,
    },
    {
      id: "tradeoff-reasoning",
      label: "Online tradeoff reasoning",
      description:
        "Defends latency, freshness, availability, quality, privacy, security, and cost tradeoffs with abort conditions and evidence that would change the decision.",
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

export function lifecycleGraphSteps(activeNodeIds: readonly string[], input: unknown = {}) {
  const record = input as Record<string, unknown>;
  const isRealtime =
    typeof record.peak_rps === "number" &&
    typeof record.replica_capacity_rps === "number" &&
    typeof record.target_utilization === "number" &&
    typeof record.predicted_p99_ms === "number" &&
    typeof record.slo_p99_ms === "number";
  const isBatch =
    typeof record.daily_records === "number" &&
    typeof record.bytes_per_record === "number" &&
    typeof record.shards === "number" &&
    typeof record.worker_records_per_second === "number" &&
    typeof record.window_seconds === "number" &&
    typeof record.backfill_days === "number";
  const round4 = (value: number) => Math.round(value * 10_000) / 10_000;

  let frameLabel = "Frame";
  let dataLabel = "Data";
  let trainLabel = "Train";
  let releaseLabel = "Release";
  let operateLabel = "Operate";
  let computedEvidence: Record<string, number | boolean> = {};

  if (isRealtime) {
    const peakRps = record.peak_rps as number;
    const replicaCapacityRps = record.replica_capacity_rps as number;
    const targetUtilization = record.target_utilization as number;
    const predictedP99Ms = record.predicted_p99_ms as number;
    const sloP99Ms = record.slo_p99_ms as number;
    const requiredReplicas = Math.max(
      1,
      Math.ceil(peakRps / (replicaCapacityRps * targetUtilization)),
    );
    const provisionedCapacityRps = round4(requiredReplicas * replicaCapacityRps);
    const observedUtilization = peakRps === 0 ? 0 : round4(peakRps / provisionedCapacityRps);
    const latencyHeadroomMs = round4(sloP99Ms - predictedP99Ms);
    frameLabel = `Frame · ${peakRps} rps`;
    dataLabel = `Data · ${replicaCapacityRps} rps/replica`;
    trainLabel = `Train · target ${targetUtilization} utilization`;
    releaseLabel = `Release · ${requiredReplicas} replicas · ${provisionedCapacityRps} rps provisioned`;
    operateLabel = `Operate · ${observedUtilization} utilization · ${latencyHeadroomMs} ms headroom`;
    computedEvidence = {
      requiredReplicas,
      provisionedCapacityRps,
      observedUtilization,
      latencyHeadroomMs,
      meetsLatencySlo: latencyHeadroomMs >= 0,
    };
  } else if (isBatch) {
    const dailyRecords = record.daily_records as number;
    const bytesPerRecord = record.bytes_per_record as number;
    const shards = record.shards as number;
    const workerRecordsPerSecond = record.worker_records_per_second as number;
    const windowSeconds = record.window_seconds as number;
    const backfillDays = record.backfill_days as number;
    const requiredRps = round4(dailyRecords / windowSeconds);
    const requiredWorkers = Math.max(1, Math.ceil(requiredRps / workerRecordsPerSecond));
    const recordsPerShard = Math.ceil(dailyRecords / shards);
    const backfillRecords = dailyRecords * backfillDays;
    const backfillStorageBytes = backfillRecords * bytesPerRecord;
    frameLabel = `Frame · ${dailyRecords}/day`;
    dataLabel = `Data · ${shards} shards · ${recordsPerShard} records/shard`;
    trainLabel = `Train · ${requiredRps} rps · ${requiredWorkers} workers`;
    releaseLabel = `Release · ${windowSeconds}s window`;
    operateLabel = `Operate · backfill ${backfillDays}d · ${backfillStorageBytes} bytes`;
    computedEvidence = {
      requiredRps,
      requiredWorkers,
      recordsPerShard,
      backfillRecords,
      backfillStorageBytes,
    };
  }
  const nodes = [
    { id: "frame", label: frameLabel },
    { id: "data", label: dataLabel },
    { id: "train", label: trainLabel },
    { id: "release", label: releaseLabel },
    { id: "operate", label: operateLabel },
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
      variables: { phase: activeNodeId, ...computedEvidence },
    })),
  );
}

export function incidentGraphSteps(input: unknown = {}) {
  const record = input as Record<string, unknown>;
  const requiredFields = [
    "incident_id",
    "detected_at",
    "affected_versions",
    "containment",
    "preserved_artifacts",
    "owner",
  ] as const;
  const missing = requiredFields.filter((field) => {
    const value = record[field];
    return !value || (Array.isArray(value) && value.length === 0);
  });
  const incidentId =
    typeof record.incident_id === "string" && record.incident_id
      ? record.incident_id
      : `${missing.length} missing`;
  const artifactCount = Array.isArray(record.preserved_artifacts)
    ? record.preserved_artifacts.length
    : 0;
  const nodes = [
    { id: "detect", label: `Detect · ${incidentId}` },
    {
      id: "contain",
      label: `Contain · ${record.containment ? "declared" : "missing"}`,
    },
    { id: "preserve", label: `Preserve · ${artifactCount} artifacts` },
    { id: "diagnose", label: "Diagnose" },
    { id: "recover", label: `Recover · ${missing.length} missing` },
    { id: "learn", label: `Learn · owner ${String(record.owner ?? "missing")}` },
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
      variables: {
        phase: node.id,
        incidentId,
        missingFields: missing,
        evidencePreserved: artifactCount > 0,
        containmentDeclared: Boolean(record.containment),
      },
    })),
  );
}
