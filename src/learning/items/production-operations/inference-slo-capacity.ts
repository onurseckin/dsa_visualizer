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
    measured_end_to_end_p95_ms = request["measured_end_to_end_p95_ms"]
    mean_end_to_end_latency_ms = request["mean_end_to_end_latency_ms"]
    concurrency = request["arrival_rps"] * mean_end_to_end_latency_ms / 1000
    effective_rps = request["per_replica_rps"] * request["target_utilization"]
    replicas = math.ceil(request["arrival_rps"] / effective_rps)
    utilization = request["arrival_rps"] / (replicas * request["per_replica_rps"])
    return {
        "concurrency": round(concurrency, 6),
        "measured_end_to_end_p95_ms": round(measured_end_to_end_p95_ms, 6),
        "replicas": replicas,
        "utilization": round(utilization, 6),
        "slo_met": measured_end_to_end_p95_ms <= request["slo_p95_ms"],
        "hourly_cost": round(replicas * request["cost_per_replica_hour"], 6),
    }`;

const execution = functionExecution({
  entrypoint: "size_inference_service",
  outputContract:
    "Return Little's-law concurrency from measured mean end-to-end latency, measured end-to-end p95 for the SLO, replicas at target utilization, actual utilization, SLO result, and hourly cost.",
  cases: [
    {
      id: "steady-online",
      label: "Steady online service",
      input: {
        arrival_rps: 100,
        mean_end_to_end_latency_ms: 90,
        measured_end_to_end_p95_ms: 135,
        per_replica_rps: 40,
        target_utilization: 0.8,
        slo_p95_ms: 150,
        cost_per_replica_hour: 0.5,
      },
      expected: {
        concurrency: 9,
        measured_end_to_end_p95_ms: 135,
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
        mean_end_to_end_latency_ms: 120,
        measured_end_to_end_p95_ms: 200,
        per_replica_rps: 30,
        target_utilization: 0.75,
        slo_p95_ms: 150,
        cost_per_replica_hour: 0.4,
      },
      expected: {
        concurrency: 7.2,
        measured_end_to_end_p95_ms: 200,
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
        mean_end_to_end_latency_ms: 40,
        measured_end_to_end_p95_ms: 60,
        per_replica_rps: 25,
        target_utilization: 0.5,
        slo_p95_ms: 75,
        cost_per_replica_hour: 0.25,
      },
      expected: {
        concurrency: 0.2,
        measured_end_to_end_p95_ms: 60,
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
    "Use measured end-to-end p95 for the SLO and measured mean residence time for Little's law, alongside replica capacity, utilization headroom, and cost.",
  objective:
    "Calculate concurrency from mean end-to-end residence time, use an independently measured end-to-end p95 for the SLO, and size replicas and cost without treating percentile components as additive.",
  completionEvidence:
    "A passing capacity plan preserves distinct mean and p95 measurements, uses ceiling replicas at the target utilization, and flags a measured tail-latency breach even when capacity is sufficient.",
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
      "Return concurrency, measured_end_to_end_p95_ms, replicas, utilization, slo_met, and hourly_cost.",
  }),
  execution,
  generateSteps: (value) => {
    const request = value as Record<string, number>;
    return arraySteps([
      {
        codeLine: 4,
        what: "Read the measured end-to-end p95 rather than constructing a percentile from components.",
        why: "Percentiles are not additive; the SLO must use one observed end-to-end distribution.",
        values: ["measured end-to-end p95", `${request.measured_end_to_end_p95_ms} ms`],
        activeIndices: [0, 1],
      },
      {
        codeLine: 5,
        what: "Apply Little's law to arrival rate and mean end-to-end residence time.",
        why: "Concurrency equals throughput multiplied by time in system under steady assumptions.",
        values: [
          "arrival rps",
          `${request.arrival_rps}`,
          "mean latency ms",
          `${request.mean_end_to_end_latency_ms}`,
          "concurrency",
        ],
        completedIndices: [0, 1, 2, 3],
        activeIndices: [4],
      },
      {
        codeLine: 7,
        what: "Ceil replicas at target utilization.",
        why: "Fractional replicas cannot serve traffic and headroom reduces saturation risk.",
        values: [
          "arrival rps",
          `${request.arrival_rps}`,
          "replica rps",
          `${request.per_replica_rps}`,
          "target utilization",
          `${request.target_utilization}`,
          "ceil replicas",
        ],
        completedIndices: [0, 1, 2, 3, 4, 5],
        activeIndices: [6],
      },
      {
        codeLine: 9,
        what: "Report actual utilization, SLO, and cost together.",
        why: "Capacity adequacy does not prove that the latency SLO is met.",
        values: ["utilization", "measured p95 <= SLO", "hourly cost"],
        activeIndices: [0, 1, 2],
      },
    ]);
  },
  assessmentPayload: {
    variant: "changed-arrival-and-tail-latency",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Estimate capacity, headroom, tail latency, and cost for the changed workload.",
    inputs: [
      { id: "arrival_rps", label: "Arrival rate", unit: "requests/s", defaultValue: "100" },
      {
        id: "mean_end_to_end_latency_ms",
        label: "Mean end-to-end latency",
        unit: "ms",
        defaultValue: "90",
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
