import {
  arraySteps,
  defineCalculatorItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `import math

def size_inference_service(request):
    latency_ms = request["service_p95_ms"] + request["queue_p95_ms"] + request["network_p95_ms"]
    concurrency = request["arrival_rps"] * latency_ms / 1000
    effective_rps = request["per_replica_rps"] * request["target_utilization"]
    replicas = math.ceil(request["arrival_rps"] / effective_rps)
    utilization = request["arrival_rps"] / (replicas * request["per_replica_rps"])
    return {
        "concurrency": round(concurrency, 6),
        "estimated_p95_ms": round(latency_ms, 6),
        "replicas": replicas,
        "utilization": round(utilization, 6),
        "slo_met": latency_ms <= request["slo_p95_ms"],
        "hourly_cost": round(replicas * request["cost_per_replica_hour"], 6),
    }`;

const execution = functionExecution({
  entrypoint: "size_inference_service",
  outputContract:
    "Return Little's-law concurrency, additive p95 latency, replicas at target utilization, actual utilization, SLO result, and hourly cost.",
  cases: [
    {
      id: "steady-online",
      label: "Steady online service",
      input: {
        arrival_rps: 100,
        service_p95_ms: 80,
        queue_p95_ms: 25,
        network_p95_ms: 15,
        per_replica_rps: 40,
        target_utilization: 0.8,
        slo_p95_ms: 150,
        cost_per_replica_hour: 0.5,
      },
      expected: {
        concurrency: 12,
        estimated_p95_ms: 120,
        replicas: 4,
        utilization: 0.625,
        slo_met: true,
        hourly_cost: 2,
      },
      comparison: "deep-equal",
    },
    {
      id: "latency-breach",
      label: "Queueing breaches p95",
      input: {
        arrival_rps: 60,
        service_p95_ms: 90,
        queue_p95_ms: 70,
        network_p95_ms: 20,
        per_replica_rps: 30,
        target_utilization: 0.75,
        slo_p95_ms: 150,
        cost_per_replica_hour: 0.4,
      },
      expected: {
        concurrency: 10.8,
        estimated_p95_ms: 180,
        replicas: 3,
        utilization: 0.666667,
        slo_met: false,
        hourly_cost: 1.2,
      },
      comparison: "deep-equal",
    },
    {
      id: "low-volume",
      label: "Low-volume endpoint",
      input: {
        arrival_rps: 5,
        service_p95_ms: 40,
        queue_p95_ms: 5,
        network_p95_ms: 5,
        per_replica_rps: 25,
        target_utilization: 0.5,
        slo_p95_ms: 75,
        cost_per_replica_hour: 0.25,
      },
      expected: {
        concurrency: 0.25,
        estimated_p95_ms: 50,
        replicas: 1,
        utilization: 0.2,
        slo_met: true,
        hourly_cost: 0.25,
      },
      comparison: "deep-equal",
    },
  ],
});

export const inferenceSloCapacity = defineCalculatorItem({
  id: "inference-slo-capacity",
  title: "Size Inference Capacity Against an SLO",
  topicIds: ["ml_inference_serving"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Use arrival rate, tail-latency components, measured per-replica capacity, utilization headroom, and cost to size an online service.",
  objective:
    "Calculate concurrency, p95 latency, replicas, actual utilization, and cost without confusing average service time with an end-to-end SLO.",
  completionEvidence:
    "A passing capacity plan states measured assumptions, uses ceiling replicas at the target utilization, and flags a latency breach even when capacity is sufficient.",
  sources: [
    verifiedSource({
      label: "Kubernetes Horizontal Pod Autoscaling",
      url: "https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/",
    }),
    verifiedSource({
      label: "Ray Serve architecture",
      url: "https://docs.ray.io/en/latest/serve/architecture.html",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "size_inference_service",
    parameters: ["request"],
    contract:
      "Return concurrency, estimated_p95_ms, replicas, utilization, slo_met, and hourly_cost.",
  }),
  execution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 4,
        what: "Add measured p95 service, queue, and network components.",
        why: "The end-to-end latency budget spans every request stage.",
        values: ["service p95", "queue p95", "network p95", "end-to-end p95"],
        activeIndices: [0, 1, 2],
      },
      {
        codeLine: 5,
        what: "Apply Little's law to arrival rate and residence time.",
        why: "Concurrency equals throughput multiplied by time in system under steady assumptions.",
        values: ["arrival rps", "latency seconds", "concurrency"],
        completedIndices: [0, 1],
        activeIndices: [2],
      },
      {
        codeLine: 7,
        what: "Ceil replicas at target utilization.",
        why: "Fractional replicas cannot serve traffic and headroom reduces saturation risk.",
        values: ["arrival rps", "replica rps", "target utilization", "ceil replicas"],
        completedIndices: [0, 1, 2],
        activeIndices: [3],
      },
      {
        codeLine: 9,
        what: "Report actual utilization, SLO, and cost together.",
        why: "Capacity adequacy does not prove that the latency SLO is met.",
        values: ["utilization", "p95 <= SLO", "hourly cost"],
        activeIndices: [0, 1, 2],
      },
    ]),
  assessmentPayload: {
    variant: "changed-arrival-and-tail-latency",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Estimate capacity, headroom, tail latency, and cost for the changed workload.",
    inputs: [
      { id: "arrival_rps", label: "Arrival rate", unit: "requests/s", defaultValue: "100" },
      {
        id: "service_p95_ms",
        label: "Service p95",
        unit: "ms",
        defaultValue: "80",
      },
      {
        id: "per_replica_rps",
        label: "Measured replica capacity",
        unit: "requests/s",
        defaultValue: "40",
      },
      {
        id: "target_utilization",
        label: "Target utilization",
        unit: "ratio",
        defaultValue: "0.8",
      },
    ],
    result: { value: 4, unit: "replicas", tolerance: 0 },
  },
});
