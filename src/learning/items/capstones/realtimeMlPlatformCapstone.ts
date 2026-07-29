import { defineCapstoneItem, functionExecution } from "../../authoring";
import {
  CAPSTONE_DIFFICULTY,
  CAPSTONE_TOPIC_IDS,
  capstoneStarter,
  lifecycleGraphSteps,
  platformChecklist,
  realtimePlatformRubric,
  platformTimeline,
  realtimePlatformSource,
} from "./shared";

const code = `import math

def plan_realtime_capacity(spec):
    peak_rps = float(spec["peak_rps"])
    replica_capacity_rps = float(spec["replica_capacity_rps"])
    target_utilization = float(spec["target_utilization"])
    predicted_p99_ms = float(spec["predicted_p99_ms"])
    slo_p99_ms = float(spec["slo_p99_ms"])

    if peak_rps < 0 or replica_capacity_rps <= 0:
        raise ValueError("peak must be non-negative and replica capacity positive")
    if target_utilization <= 0 or target_utilization > 1:
        raise ValueError("target utilization must be in (0, 1]")
    if predicted_p99_ms < 0 or slo_p99_ms <= 0:
        raise ValueError("latencies must be non-negative with a positive SLO")

    effective_capacity = replica_capacity_rps * target_utilization
    required_replicas = max(1, math.ceil(peak_rps / effective_capacity))
    provisioned_capacity_rps = required_replicas * replica_capacity_rps
    observed_utilization = 0 if peak_rps == 0 else peak_rps / provisioned_capacity_rps

    return {
        "required_replicas": required_replicas,
        "provisioned_capacity_rps": round(provisioned_capacity_rps, 4),
        "observed_utilization": round(observed_utilization, 4),
        "latency_headroom_ms": round(slo_p99_ms - predicted_p99_ms, 4),
        "meets_latency_slo": predicted_p99_ms <= slo_p99_ms,
    }`;

const outputContract =
  "Return ceiling replica count at target utilization, provisioned capacity, resulting utilization, and signed p99 latency headroom.";

const execution = functionExecution({
  entrypoint: "plan_realtime_capacity",
  outputContract,
  cases: [
    {
      id: "steady-peak",
      label: "Steady peak with latency headroom",
      input: {
        peak_rps: 500,
        replica_capacity_rps: 100,
        target_utilization: 0.75,
        predicted_p99_ms: 180,
        slo_p99_ms: 250,
      },
      expected: {
        required_replicas: 7,
        provisioned_capacity_rps: 700,
        observed_utilization: 0.7143,
        latency_headroom_ms: 70,
        meets_latency_slo: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "minimum-service",
      label: "Minimum online service footprint",
      input: {
        peak_rps: 1,
        replica_capacity_rps: 10,
        target_utilization: 1,
        predicted_p99_ms: 50,
        slo_p99_ms: 50,
      },
      expected: {
        required_replicas: 1,
        provisioned_capacity_rps: 10,
        observed_utilization: 0.1,
        latency_headroom_ms: 0,
        meets_latency_slo: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "latency-regression",
      label: "Large peak with an independent p99 regression",
      input: {
        peak_rps: 1_800,
        replica_capacity_rps: 120,
        target_utilization: 0.65,
        predicted_p99_ms: 240,
        slo_p99_ms: 200,
      },
      expected: {
        required_replicas: 24,
        provisioned_capacity_rps: 2_880,
        observed_utilization: 0.625,
        latency_headroom_ms: -40,
        meets_latency_slo: false,
      },
      comparison: "deep-equal",
    },
  ],
});

export const realtimeMlPlatformCapstone = defineCapstoneItem({
  id: "realtime-ml-platform-capstone",
  title: "Real-Time ML Platform Capstone",
  topicIds: CAPSTONE_TOPIC_IDS,
  difficultyProfile: CAPSTONE_DIFFICULTY,
  description:
    "Design an online prediction system whose point-in-time features, model package, capacity, overload behavior, canary, rollback, and delayed-label evaluation form one operable contract.",
  objective:
    "Defend a real-time ML design under latency, freshness, failure, consistency, governance, and cost constraints without treating a successful HTTP response as a correct prediction.",
  completionEvidence:
    "A rubric-scored real-time platform design plus a passing replica, utilization, and p99 headroom calculation.",
  sources: [realtimePlatformSource],
  prompt: {
    context:
      "A decision API must serve bursty online traffic using fresh features. Some dependencies fail independently, labels arrive after seven days, and the organization requires a reversible canary release.",
    question:
      "Design the real-time lifecycle from feature consistency and package signature through capacity, SLOs, overload, fallback, canary, rollback, monitoring, governance, and delayed evaluation.",
    constraints: [
      "The service must define behavior when online features are stale or unavailable.",
      "The release cannot send all traffic to a new model before compatibility and outcome guardrails pass.",
      "Queueing and dependency latency count against the same end-to-end SLO.",
    ],
  },
  rubric: realtimePlatformRubric,
  playground: {
    code,
    starterCode: capstoneStarter("plan_realtime_capacity", outputContract),
    execution,
    generateSteps: (value) =>
      lifecycleGraphSteps(["frame", "data", "train", "release", "operate"], value),
  },
  assessmentPayload: {
    variant: "bursty-online-decision",
    changedContext: true,
    isomorphicRetest: false,
    checklist: platformChecklist,
    incidentTimeline: platformTimeline,
  },
});
