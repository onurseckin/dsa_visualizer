import type { LearningItem } from "../../../types";
import {
  arraySteps,
  defineCalculatorItem,
  defineDebuggingItem,
  defineScenarioItem,
  defineTraceItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../../authoring";

type Case = Parameters<typeof functionExecution>[0]["cases"][number];

function steps(labels: readonly string[]) {
  return () =>
    arraySteps(
      labels.map((label, index) => ({
        codeLine: index + 1,
        what: `Update the measurable ${label} invariant for this stage.`,
        why: "Each frame preserves an accounting invariant before the next decision is made.",
        values: labels.map((value, valueIndex) => (valueIndex <= index ? value : "pending")),
        activeIndices: [index],
        completedIndices: labels.slice(0, index).map((_, valueIndex) => valueIndex),
      })),
    );
}

function playground(
  entrypoint: string,
  parameters: readonly string[],
  contract: string,
  code: string,
  cases: readonly Case[],
) {
  return {
    code,
    starterCode: semanticStarter({ entrypoint, parameters, contract }),
    execution: functionExecution({ entrypoint, outputContract: contract, cases }),
  };
}

const roofline = playground(
  "estimate_roofline",
  ["record"],
  "Return arithmetic_intensity, memory_bound_gflops, attainable_gflops, and bound using only supplied FLOPs, bytes, bandwidth, and peak throughput.",
  `def estimate_roofline(record):
    intensity = record["flops"] / record["bytes"]
    memory_bound = intensity * record["bandwidth_gbps"]
    attainable = min(record["peak_gflops"], memory_bound)
    return {"arithmetic_intensity": round(intensity, 6), "memory_bound_gflops": round(memory_bound, 6), "attainable_gflops": round(attainable, 6), "bound": "memory" if memory_bound < record["peak_gflops"] else "compute"}`,
  [
    {
      id: "memory",
      label: "Low intensity",
      input: { flops: 200, bytes: 100, bandwidth_gbps: 50, peak_gflops: 500 },
      expected: {
        arithmetic_intensity: 2,
        memory_bound_gflops: 100,
        attainable_gflops: 100,
        bound: "memory",
      },
      comparison: "deep-equal",
    },
    {
      id: "compute",
      label: "High intensity",
      input: { flops: 4000, bytes: 100, bandwidth_gbps: 50, peak_gflops: 500 },
      expected: {
        arithmetic_intensity: 40,
        memory_bound_gflops: 2000,
        attainable_gflops: 500,
        bound: "compute",
      },
      comparison: "deep-equal",
    },
    {
      id: "ridge",
      label: "Ridge point",
      input: { flops: 1000, bytes: 100, bandwidth_gbps: 50, peak_gflops: 500 },
      expected: {
        arithmetic_intensity: 10,
        memory_bound_gflops: 500,
        attainable_gflops: 500,
        bound: "compute",
      },
      comparison: "deep-equal",
    },
  ],
);

export const rooflineBoundEstimator = defineCalculatorItem({
  id: "roofline-bound-estimator",
  title: "Estimate a Roofline Bound",
  topicIds: ["ml_accelerator_performance"],
  difficultyProfile: profile(2, 3, 2, 2),
  description:
    "Compute a roofline upper bound from explicit operation, traffic, bandwidth, and peak-throughput assumptions without claiming a measured accelerator result.",
  objective:
    "Distinguish arithmetic intensity from observed throughput and identify whether reducing traffic or increasing arithmetic work can change the limiting bound.",
  completionEvidence:
    "The learner returns correct intensity and bound for three workloads and explains which measurable quantity would be profiled before optimizing a kernel.",
  sources: [
    verifiedSource({
      label: "Roofline performance model",
      url: "https://doi.org/10.1145/1498765.1498785",
    }),
  ],
  ...roofline,
  generateSteps: steps(["FLOPs", "bytes", "roofline bound"]),
  assessmentPayload: {
    variant: "changed-traffic",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Calculate the roofline ceiling from the supplied accounting record.",
    inputs: [
      { id: "flops", label: "Operations" },
      { id: "bytes", label: "Traffic" },
    ],
    result: { value: 100, unit: "GFLOP/s", tolerance: 0.000001 },
  },
});

const tiledGemm = playground(
  "trace_tiled_gemm",
  ["record"],
  "Return tile_count, naive_reads, tiled_reads, and reuse_factor for a square GEMM access model; this is a memory-access model, not a GPU execution.",
  `def trace_tiled_gemm(record):
    n = record["n"]
    tile = record["tile"]
    tiles = (n + tile - 1) // tile
    naive = 2 * n * n * n
    tiled = 2 * tiles * n * n
    return {"tile_count": tiles, "naive_reads": naive, "tiled_reads": tiled, "reuse_factor": round(naive / tiled, 6)}`,
  [
    {
      id: "four-by-four",
      label: "Four square tiles",
      input: { n: 8, tile: 2 },
      expected: { tile_count: 4, naive_reads: 1024, tiled_reads: 512, reuse_factor: 2 },
      comparison: "deep-equal",
    },
    {
      id: "one-tile",
      label: "One complete tile",
      input: { n: 4, tile: 4 },
      expected: { tile_count: 1, naive_reads: 128, tiled_reads: 32, reuse_factor: 4 },
      comparison: "deep-equal",
    },
    {
      id: "partial-tile",
      label: "Partial edge tile",
      input: { n: 5, tile: 2 },
      expected: { tile_count: 3, naive_reads: 250, tiled_reads: 150, reuse_factor: 1.666667 },
      comparison: "deep-equal",
    },
  ],
);
export const tiledGemmMemoryTrace = defineTraceItem({
  id: "tiled-gemm-memory-trace",
  title: "Trace Tiled GEMM Memory Reuse",
  topicIds: ["ml_accelerator_performance"],
  difficultyProfile: profile(2, 3, 3, 2),
  description:
    "Trace the change in modeled matrix reads when a square multiplication reuses tile-local operands instead of reloading every scalar pair.",
  objective:
    "Use a reusable access model to explain why tiling can reduce traffic while recognizing that the model does not measure any device kernel.",
  completionEvidence:
    "Correctly compares naïve and tiled read counts across complete and edge tiles, then identifies the reuse invariant.",
  sources: [
    verifiedSource({
      label: "CUDA matrix multiplication best practices",
      url: "https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-in-matrix-multiplication-c-ab",
    }),
  ],
  ...tiledGemm,
  generateSteps: steps(["naive loads", "tile reuse", "reduced traffic"]),
  assessmentPayload: {
    variant: "changed-tile",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace modeled reads as tile size changes.",
    currentState: "Each multiply initially reloads its operands.",
  },
});

const profilerDecision = playground(
  "choose_optimization",
  ["record"],
  "Return a conservative optimization focus and evidence threshold from profiler fractions; it classifies supplied measurements and does not profile hardware.",
  `def choose_optimization(record):
    largest = max(("memory", record["memory_fraction"]), ("compute", record["compute_fraction"]), ("launch", record["launch_fraction"]), key=lambda pair: pair[1])
    focus = {"memory": "reduce-memory-traffic", "compute": "improve-compute-efficiency", "launch": "reduce-launch-overhead"}[largest[0]]
    return {"focus": focus, "dominant_fraction": largest[1], "optimize": largest[1] >= record["minimum_fraction"]}`,
  [
    {
      id: "memory",
      label: "Memory dominated",
      input: {
        memory_fraction: 0.7,
        compute_fraction: 0.2,
        launch_fraction: 0.1,
        minimum_fraction: 0.5,
      },
      expected: { focus: "reduce-memory-traffic", dominant_fraction: 0.7, optimize: true },
      comparison: "deep-equal",
    },
    {
      id: "launch",
      label: "Launch dominated",
      input: {
        memory_fraction: 0.2,
        compute_fraction: 0.2,
        launch_fraction: 0.6,
        minimum_fraction: 0.65,
      },
      expected: { focus: "reduce-launch-overhead", dominant_fraction: 0.6, optimize: false },
      comparison: "deep-equal",
    },
    {
      id: "compute",
      label: "Compute dominated",
      input: {
        memory_fraction: 0.1,
        compute_fraction: 0.8,
        launch_fraction: 0.1,
        minimum_fraction: 0.5,
      },
      expected: { focus: "improve-compute-efficiency", dominant_fraction: 0.8, optimize: true },
      comparison: "deep-equal",
    },
  ],
);
export const profilerOptimizationDecision = defineScenarioItem({
  id: "profiler-optimization-decision",
  title: "Make a Profiler Optimization Decision",
  topicIds: ["ml_accelerator_performance"],
  difficultyProfile: profile(2, 2, 2, 3),
  description:
    "Choose an optimization hypothesis from a supplied profiler summary rather than attributing end-to-end latency to a kernel without evidence.",
  objective:
    "Separate a quantifiable dominant-time classification from the qualitative decision to spend engineering effort and state the required confirming measurement.",
  completionEvidence:
    "A response identifies the dominant fraction, names a falsifiable optimization hypothesis, and gives a counterfactual that would defer kernel work.",
  sources: [
    verifiedSource({
      label: "PyTorch profiler documentation",
      url: "https://docs.pytorch.org/docs/stable/profiler.html",
    }),
  ],
  prompt: {
    context:
      "A profiler summary partitions measured wall time into memory, compute, and launch fractions.",
    question:
      "Which hypothesis should be tested first, and what end-to-end evidence would justify the work?",
  },
  rubric: {
    criteria: [
      {
        id: "evidence",
        label: "Measurement evidence",
        description: "Uses the supplied dominant fraction rather than a vendor assumption.",
        points: 3,
        critical: true,
      },
      {
        id: "counterfactual",
        label: "Counterfactual",
        description: "States what changed measurement would reverse the decision.",
        points: 2,
        critical: true,
      },
    ],
  },
  playground: {
    ...profilerDecision,
    generateSteps: steps(["profile fraction", "dominant cause", "decision threshold"]),
  },
  assessmentPayload: {
    variant: "changed-profiler",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["memory", "compute", "launch"],
    consequences:
      "The scratchpad checks classification only; the written decision must justify its operational value.",
  },
});

const ring = playground(
  "trace_ring_allreduce",
  ["record"],
  "Return phases, bytes_per_rank, and surviving_ranks for a modeled ring all-reduce; no distributed process is executed.",
  `def trace_ring_allreduce(record):
    ranks = record["ranks"]
    phases = 2 * (ranks - 1)
    bytes_per_rank = phases * record["tensor_bytes"] / ranks
    return {"phases": phases, "bytes_per_rank": bytes_per_rank, "surviving_ranks": ranks - (1 if record.get("failed_rank") is not None else 0)}`,
  [
    {
      id: "four-rank",
      label: "Four ranks",
      input: { ranks: 4, tensor_bytes: 120 },
      expected: { phases: 6, bytes_per_rank: 180, surviving_ranks: 4 },
      comparison: "deep-equal",
    },
    {
      id: "two-rank",
      label: "Two ranks",
      input: { ranks: 2, tensor_bytes: 80 },
      expected: { phases: 2, bytes_per_rank: 80, surviving_ranks: 2 },
      comparison: "deep-equal",
    },
    {
      id: "failure",
      label: "Rank failure",
      input: { ranks: 8, tensor_bytes: 800, failed_rank: 3 },
      expected: { phases: 14, bytes_per_rank: 1400, surviving_ranks: 7 },
      comparison: "deep-equal",
    },
  ],
);
export const ringAllreduceTrace = defineTraceItem({
  id: "ring-allreduce-trace",
  title: "Trace Ring All-Reduce",
  topicIds: ["ml_distributed_training"],
  difficultyProfile: profile(2, 3, 3, 2),
  description:
    "Trace a ring collective's accounting phases and per-rank bytes, including the fact that a rank failure invalidates a real collective rather than being repaired by this model.",
  objective:
    "Explain the ring traffic invariant and distinguish modeled byte accounting from a successful multi-process collective execution.",
  completionEvidence:
    "Calculates phase and byte counts for three rank configurations and explicitly identifies the failure condition requiring recovery.",
  sources: [
    verifiedSource({
      label: "NCCL collective communication",
      url: "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html",
    }),
  ],
  ...ring,
  generateSteps: steps(["reduce-scatter", "ring hops", "all-gather"]),
  assessmentPayload: {
    variant: "changed-rank-count",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace byte accounting around the ring.",
    currentState: "All ranks begin with an equal tensor shard.",
  },
});

const parallelism = playground(
  "select_parallelism",
  ["record"],
  "Return a constraint-based parallelism label and reasons; it is a deterministic scratchpad, not a replacement for a topology design review.",
  `def select_parallelism(record):
    if record["model_gb"] > record["memory_per_device_gb"] * record["devices"]: return {"choice": "tensor", "reasons": ["model-does-not-fit-aggregate-sharding"]}
    if record["layers"] >= record["devices"] * 4 and record["microbatches"] >= record["devices"]: return {"choice": "pipeline", "reasons": ["deep-model-and-bubble-control"]}
    return {"choice": "data", "reasons": ["replica-fits-device"]}`,
  [
    {
      id: "data",
      label: "Replica fits",
      input: { model_gb: 20, memory_per_device_gb: 40, devices: 4, layers: 12, microbatches: 4 },
      expected: { choice: "data", reasons: ["replica-fits-device"] },
      comparison: "deep-equal",
    },
    {
      id: "tensor",
      label: "Sharding required",
      input: { model_gb: 200, memory_per_device_gb: 40, devices: 4, layers: 24, microbatches: 4 },
      expected: { choice: "tensor", reasons: ["model-does-not-fit-aggregate-sharding"] },
      comparison: "deep-equal",
    },
    {
      id: "pipeline",
      label: "Deep model",
      input: { model_gb: 60, memory_per_device_gb: 40, devices: 4, layers: 32, microbatches: 4 },
      expected: { choice: "pipeline", reasons: ["deep-model-and-bubble-control"] },
      comparison: "deep-equal",
    },
  ],
);
export const distributedParallelismSelection = defineScenarioItem({
  id: "distributed-parallelism-selection",
  title: "Select Distributed Parallelism",
  topicIds: ["ml_distributed_training"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Choose data, tensor, or pipeline parallelism from explicit model, memory, depth, microbatch, and device constraints without treating one recipe as universal.",
  objective:
    "Turn fit and communication constraints into a provisional parallelism choice, while documenting topology and measured-communication checks that can overturn it.",
  completionEvidence:
    "Selects a compatible mode for changed inputs and supplies a qualitative rationale, rejected alternative, and validation measurement.",
  sources: [
    verifiedSource({
      label: "PyTorch distributed overview",
      url: "https://docs.pytorch.org/docs/stable/distributed.html",
    }),
  ],
  prompt: {
    context:
      "A model, batch, device-memory, and topology record must be converted into a parallelism plan.",
    question: "Which parallelism family fits and what communication risk must be validated?",
  },
  rubric: {
    criteria: [
      {
        id: "fit",
        label: "Fit analysis",
        description: "Explains fit and shard assumptions.",
        points: 3,
        critical: true,
      },
      {
        id: "validation",
        label: "Validation",
        description: "Names a communication or bubble measurement that can falsify the plan.",
        points: 2,
        critical: true,
      },
    ],
  },
  playground: {
    ...parallelism,
    generateSteps: steps(["fit constraint", "parallelism candidate", "validation metric"]),
  },
  assessmentPayload: {
    variant: "changed-model-shape",
    changedContext: true,
    isomorphicRetest: true,
    consequences:
      "The scratchpad selects a candidate; the rubric evaluates the design justification.",
  },
});

const straggler = playground(
  "diagnose_distributed_step",
  ["record"],
  "Return sharded state memory and a straggler classification from supplied timings; it does not inspect a cluster or execute collective communication.",
  `def diagnose_distributed_step(record):
    state = (record["parameters_gb"] + record["gradients_gb"] + record["optimizer_gb"]) / record["ranks"]
    slowest = max(record["rank_seconds"])
    fastest = min(record["rank_seconds"])
    return {"sharded_state_gb": round(state, 6), "step_seconds": slowest, "straggler_gap_seconds": round(slowest - fastest, 6), "diagnosis": "straggler" if slowest > fastest * record["straggler_ratio"] else "balanced"}`,
  [
    {
      id: "balanced",
      label: "Balanced ranks",
      input: {
        parameters_gb: 40,
        gradients_gb: 40,
        optimizer_gb: 80,
        ranks: 4,
        rank_seconds: [10, 10.5, 10.2],
        straggler_ratio: 1.2,
      },
      expected: {
        sharded_state_gb: 40,
        step_seconds: 10.5,
        straggler_gap_seconds: 0.5,
        diagnosis: "balanced",
      },
      comparison: "deep-equal",
    },
    {
      id: "straggler",
      label: "Slow rank",
      input: {
        parameters_gb: 24,
        gradients_gb: 24,
        optimizer_gb: 48,
        ranks: 4,
        rank_seconds: [8, 8.1, 12],
        straggler_ratio: 1.2,
      },
      expected: {
        sharded_state_gb: 24,
        step_seconds: 12,
        straggler_gap_seconds: 4,
        diagnosis: "straggler",
      },
      comparison: "deep-equal",
    },
    {
      id: "eight",
      label: "Eight-way shard",
      input: {
        parameters_gb: 64,
        gradients_gb: 64,
        optimizer_gb: 128,
        ranks: 8,
        rank_seconds: [4, 4, 4, 4],
        straggler_ratio: 1.1,
      },
      expected: {
        sharded_state_gb: 32,
        step_seconds: 4,
        straggler_gap_seconds: 0,
        diagnosis: "balanced",
      },
      comparison: "deep-equal",
    },
  ],
);
export const distributedMemoryStraggler = defineDebuggingItem({
  id: "distributed-memory-straggler",
  title: "Diagnose Distributed Memory and Stragglers",
  topicIds: ["ml_distributed_training"],
  difficultyProfile: profile(3, 3, 2, 3),
  description:
    "Calculate sharded state memory and classify timing skew from provided observations before attributing a slow step to a particular network or device fault.",
  objective:
    "Use timing and state accounting to separate a quantified straggler symptom from the qualitative investigation needed to identify its root cause.",
  completionEvidence:
    "Returns correct sharded memory and skew, then proposes an evidence-gathering next step without claiming a cluster diagnosis from the scratchpad alone.",
  sources: [
    verifiedSource({
      label: "PyTorch FSDP documentation",
      url: "https://docs.pytorch.org/docs/stable/fsdp.html",
    }),
  ],
  ...straggler,
  generateSteps: steps(["state shards", "rank timings", "skew diagnosis"]),
  assessmentPayload: {
    variant: "changed-rank-timing",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: "Uses total state per rank and average timing as the step bound.",
    evidence: [
      {
        label: "Rank timings",
        content: "One rank exceeds the fastest rank by the configured ratio.",
      },
    ],
    failingTests: ["slowest rank bounds a synchronous step"],
    hints: ["Account for every state component before division."],
  },
});

const quantization = playground(
  "plan_quantization",
  ["record"],
  "Return scale, maximum reconstruction error, and validation decision for symmetric integer quantization using supplied calibration bounds; this is portable arithmetic, not a vendor inference run.",
  `def plan_quantization(record):
    scale = record["max_abs"] / ((2 ** (record["bits"] - 1)) - 1)
    error = scale / 2
    return {"scale": round(scale, 8), "max_error": round(error, 8), "validate": error <= record["error_budget"], "granularity": record["granularity"]}`,
  [
    {
      id: "int8",
      label: "Int8 calibration",
      input: { max_abs: 1.27, bits: 8, error_budget: 0.01, granularity: "per-tensor" },
      expected: { scale: 0.01, max_error: 0.005, validate: true, granularity: "per-tensor" },
      comparison: "deep-equal",
    },
    {
      id: "int4-reject",
      label: "Int4 budget reject",
      input: { max_abs: 1.4, bits: 4, error_budget: 0.05, granularity: "per-channel" },
      expected: { scale: 0.2, max_error: 0.1, validate: false, granularity: "per-channel" },
      comparison: "deep-equal",
    },
    {
      id: "int16",
      label: "Int16 calibration",
      input: { max_abs: 3.2767, bits: 16, error_budget: 0.0001, granularity: "per-tensor" },
      expected: { scale: 0.0001, max_error: 0.00005, validate: true, granularity: "per-tensor" },
      comparison: "deep-equal",
    },
  ],
);
export const quantizationDeploymentPlan = defineCalculatorItem({
  id: "quantization-deployment-plan",
  title: "Plan Quantization Deployment",
  topicIds: ["ml_compilation_quantization"],
  difficultyProfile: profile(3, 3, 2, 3),
  description:
    "Calculate a symmetric quantization scale and error bound, then use it as one gate in a calibration, validation, monitoring, and rollback deployment plan.",
  objective:
    "Separate the quantitative error budget from qualitative decisions about calibration coverage, accuracy slices, rollout, and rollback criteria.",
  completionEvidence:
    "Computes scale and worst-case error for three bit widths and writes a validation plus rollback plan that does not claim hardware execution.",
  sources: [
    verifiedSource({
      label: "PyTorch quantization documentation",
      url: "https://docs.pytorch.org/docs/stable/quantization.html",
    }),
  ],
  ...quantization,
  generateSteps: steps(["calibration range", "integer scale", "error budget"]),
  assessmentPayload: {
    variant: "changed-calibration-range",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Check the error-budget arithmetic before proposing deployment gates.",
    inputs: [
      { id: "max_abs", label: "Calibration maximum" },
      { id: "bits", label: "Bits" },
    ],
    result: { value: 0.005, unit: "absolute error", tolerance: 0.000001 },
  },
});

const compiler = playground(
  "check_graph_compatibility",
  ["record"],
  "Return unsupported operators, dynamic-shape status, and a safe compatibility classification from a supplied graph manifest; it does not compile or execute a model.",
  `def check_graph_compatibility(record):
    unsupported = sorted(set(record["operators"]) - set(record["supported"]))
    dynamic = bool(record["dynamic_shapes"])
    return {"unsupported": unsupported, "dynamic_shapes": dynamic, "classification": "compatible" if not unsupported and not dynamic else "partition-or-rewrite"}`,
  [
    {
      id: "compatible",
      label: "Supported static graph",
      input: {
        operators: ["MatMul", "Relu"],
        supported: ["MatMul", "Relu"],
        dynamic_shapes: false,
      },
      expected: { unsupported: [], dynamic_shapes: false, classification: "compatible" },
      comparison: "deep-equal",
    },
    {
      id: "operator",
      label: "Unsupported operator",
      input: { operators: ["MatMul", "CustomOp"], supported: ["MatMul"], dynamic_shapes: false },
      expected: {
        unsupported: ["CustomOp"],
        dynamic_shapes: false,
        classification: "partition-or-rewrite",
      },
      comparison: "deep-equal",
    },
    {
      id: "dynamic",
      label: "Dynamic shape graph",
      input: { operators: ["MatMul"], supported: ["MatMul"], dynamic_shapes: true },
      expected: { unsupported: [], dynamic_shapes: true, classification: "partition-or-rewrite" },
      comparison: "deep-equal",
    },
  ],
);
export const compilerGraphCompatibility = defineDebuggingItem({
  id: "compiler-graph-compatibility",
  title: "Debug Compiler Graph Compatibility",
  topicIds: ["ml_compilation_quantization"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Identify unsupported operators and dynamic-shape constraints in an explicit graph manifest before isolating numerical regression and partition boundaries.",
  objective:
    "Classify graph compatibility from evidence and formulate the next graph, shape, and numerical checks without asserting that an engine compiled successfully.",
  completionEvidence:
    "Finds unsupported and dynamic constraints in three manifests and explains which compatibility or regression artifact would be captured next.",
  sources: [
    verifiedSource({ label: "ONNX operator schemas", url: "https://onnx.ai/onnx/operators/" }),
  ],
  ...compiler,
  generateSteps: steps(["operator inventory", "shape constraints", "compatibility boundary"]),
  assessmentPayload: {
    variant: "changed-operator-set",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: "Assumes every operator and shape is compatible.",
    evidence: [
      {
        label: "Manifest",
        content: "The graph manifest lists supported operators and dynamic shape use.",
      },
    ],
    failingTests: ["unsupported operators require partition or rewrite"],
    hints: ["Compare graph inventory to the target's supported set."],
  },
});

const runtime = playground(
  "select_portable_runtime",
  ["record"],
  "Return portable or specialized selection from supplied compatibility and latency constraints; it is a decision aid and never executes an engine.",
  `def select_portable_runtime(record):
    if record["targets"] > 1 and record["portable_supported"]: return {"choice": "portable", "reason": "multi-target-compatibility"}
    if record["specialized_latency_ms"] < record["latency_slo_ms"]: return {"choice": "specialized", "reason": "latency-slo"}
    return {"choice": "portable", "reason": "fallback-compatibility"}`,
  [
    {
      id: "portable",
      label: "Multiple targets",
      input: { targets: 3, portable_supported: true, specialized_latency_ms: 4, latency_slo_ms: 5 },
      expected: { choice: "portable", reason: "multi-target-compatibility" },
      comparison: "deep-equal",
    },
    {
      id: "specialized",
      label: "Single target latency",
      input: {
        targets: 1,
        portable_supported: false,
        specialized_latency_ms: 4,
        latency_slo_ms: 5,
      },
      expected: { choice: "specialized", reason: "latency-slo" },
      comparison: "deep-equal",
    },
    {
      id: "fallback",
      label: "Latency miss",
      input: { targets: 1, portable_supported: true, specialized_latency_ms: 9, latency_slo_ms: 5 },
      expected: { choice: "portable", reason: "fallback-compatibility" },
      comparison: "deep-equal",
    },
  ],
);
export const portableRuntimeSelection = defineScenarioItem({
  id: "portable-runtime-selection",
  title: "Select a Portable Runtime",
  topicIds: ["ml_compilation_quantization"],
  difficultyProfile: profile(2, 2, 3, 3),
  description:
    "Choose portable interchange or specialized runtime under explicit target compatibility and latency constraints without representing either choice as a guaranteed performance result.",
  objective:
    "Make compatibility, latency, numerical validation, and fallback ownership visible in a runtime decision rather than selecting by brand or benchmark anecdote.",
  completionEvidence:
    "Returns a defensible candidate for three constraint records and documents the compatibility and numerical checks needed before production adoption.",
  sources: [
    verifiedSource({ label: "ONNX Runtime compatibility", url: "https://onnxruntime.ai/docs/" }),
  ],
  prompt: {
    context:
      "A deployment must balance target count, compatibility support, and latency service-level objectives.",
    question:
      "Which runtime family is appropriate, and what validation prevents an unsupported portability claim?",
  },
  rubric: {
    criteria: [
      {
        id: "constraints",
        label: "Constraint mapping",
        description: "Connects compatibility and latency constraints to the choice.",
        points: 3,
        critical: true,
      },
      {
        id: "validation",
        label: "Validation plan",
        description: "Requires numerical and target compatibility verification.",
        points: 2,
        critical: true,
      },
    ],
  },
  playground: {
    ...runtime,
    generateSteps: steps(["target set", "compatibility", "runtime decision"]),
  },
  assessmentPayload: {
    variant: "changed-target-matrix",
    changedContext: true,
    isomorphicRetest: true,
    consequences:
      "The scratchpad is a policy classifier; it does not prove engine support or benchmark speed.",
  },
});

const bpe = playground(
  "estimate_token_budget",
  ["record"],
  "Return token_count, byte_count, and remaining_context from supplied token pieces; pieces are an illustrative tokenizer trace and do not claim a production vocabulary.",
  `def estimate_token_budget(record):
    tokens = record["pieces"]
    byte_count = sum(len(piece.encode("utf-8")) for piece in tokens)
    return {"token_count": len(tokens), "byte_count": byte_count, "remaining_context": record["context_limit"] - len(tokens)}`,
  [
    {
      id: "ascii",
      label: "ASCII pieces",
      input: { pieces: ["learn", "ing"], context_limit: 8 },
      expected: { token_count: 2, byte_count: 8, remaining_context: 6 },
      comparison: "deep-equal",
    },
    {
      id: "utf8",
      label: "UTF-8 piece",
      input: { pieces: ["caf", "é"], context_limit: 4 },
      expected: { token_count: 2, byte_count: 5, remaining_context: 2 },
      comparison: "deep-equal",
    },
    {
      id: "budget",
      label: "Full budget",
      input: { pieces: ["a", "b", "c"], context_limit: 3 },
      expected: { token_count: 3, byte_count: 3, remaining_context: 0 },
      comparison: "deep-equal",
    },
  ],
);
export const bpeTokenBudget = defineTraceItem({
  id: "bpe-token-budget",
  title: "Trace BPE Token Budget",
  topicIds: ["ml_transformer_internals"],
  difficultyProfile: profile(2, 3, 2, 2),
  description:
    "Trace illustrative token pieces, UTF-8 byte boundaries, and context-budget consumption without presenting the supplied pieces as a universal tokenizer vocabulary.",
  objective:
    "Distinguish token count from byte length and explain why a changed vocabulary or boundary can change context use.",
  completionEvidence:
    "Counts token and UTF-8 bytes for ASCII and non-ASCII pieces, then identifies the context-budget invariant.",
  sources: [
    verifiedSource({
      label: "SentencePiece tokenizer paper",
      url: "https://aclanthology.org/D18-2012/",
    }),
  ],
  ...bpe,
  generateSteps: steps(["token pieces", "UTF-8 bytes", "context remaining"]),
  assessmentPayload: {
    variant: "changed-vocabulary-pieces",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace pieces and budget, including a UTF-8 boundary.",
    currentState: "An illustrative piece sequence is supplied.",
  },
});

const attention = playground(
  "trace_causal_attention",
  ["record"],
  "Return causal attention weights for a scalar query against scalar keys and values; masked future positions receive exactly zero weight.",
  `import math
def trace_causal_attention(record):
    q = record["query"]
    keys = record["keys"][:record["position"] + 1]
    values = record["values"][:record["position"] + 1]
    scores = [q * key for key in keys]
    largest = max(scores)
    weights = [math.exp(score - largest) for score in scores]
    total = sum(weights)
    normalized = [weight / total for weight in weights]
    output = sum(weight * value for weight, value in zip(normalized, values))
    return {"weights": [round(weight, 6) for weight in normalized] + [0] * (len(record["keys"]) - len(normalized)), "output": round(output, 6)}`,
  [
    {
      id: "first",
      label: "First token",
      input: { query: 1, keys: [1, 2], values: [10, 20], position: 0 },
      expected: { weights: [1, 0], output: 10 },
      comparison: "deep-equal",
    },
    {
      id: "two",
      label: "Second token",
      input: { query: 1, keys: [0, 0], values: [2, 6], position: 1 },
      expected: { weights: [0.5, 0.5], output: 4 },
      comparison: "deep-equal",
    },
    {
      id: "masked",
      label: "Masked future",
      input: { query: 1, keys: [1, 1, 10], values: [2, 4, 100], position: 1 },
      expected: { weights: [0.5, 0.5, 0], output: 3 },
      comparison: "deep-equal",
    },
  ],
);
export const causalAttentionTrace = defineTraceItem({
  id: "causal-attention-trace",
  title: "Trace Causal Attention",
  topicIds: ["ml_transformer_internals"],
  difficultyProfile: profile(3, 3, 3, 2),
  description:
    "Trace scaled-down causal attention scores, normalized weights, and composed output while preserving the zero-weight invariant for future positions.",
  objective:
    "Explain how causal masking changes the valid key set before softmax and how valid weights compose values.",
  completionEvidence:
    "Produces correct weights and output for early, equal-score, and future-masked cases and names the causal-mask invariant.",
  sources: [
    verifiedSource({ label: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }),
  ],
  ...attention,
  generateSteps: steps(["causal mask", "normalized weights", "value composition"]),
  assessmentPayload: {
    variant: "changed-query-position",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace the allowed keys and attention output.",
    currentState: "Future key positions are excluded before normalization.",
  },
});

const kv = playground(
  "size_kv_cache",
  ["record"],
  "Return KV-cache bytes and an eviction recommendation from explicit layers, tokens, batch, heads, head dimension, dtype bytes, and capacity; this is a memory model, not a serving execution.",
  `def size_kv_cache(record):
    bytes_used = 2 * record["layers"] * record["tokens"] * record["batch"] * record["kv_heads"] * record["head_dim"] * record["dtype_bytes"]
    return {"bytes": bytes_used, "mebibytes": round(bytes_used / (1024 * 1024), 6), "policy": "evict-or-reject" if bytes_used > record["capacity_bytes"] else "retain"}`,
  [
    {
      id: "small",
      label: "Small cache",
      input: {
        layers: 2,
        tokens: 4,
        batch: 1,
        kv_heads: 2,
        head_dim: 4,
        dtype_bytes: 2,
        capacity_bytes: 1000,
      },
      expected: { bytes: 256, mebibytes: 0.000244, policy: "retain" },
      comparison: "deep-equal",
    },
    {
      id: "capacity",
      label: "Capacity overflow",
      input: {
        layers: 2,
        tokens: 8,
        batch: 2,
        kv_heads: 2,
        head_dim: 4,
        dtype_bytes: 2,
        capacity_bytes: 1000,
      },
      expected: { bytes: 1024, mebibytes: 0.000977, policy: "evict-or-reject" },
      comparison: "deep-equal",
    },
    {
      id: "mqa",
      label: "Single KV head",
      input: {
        layers: 1,
        tokens: 16,
        batch: 1,
        kv_heads: 1,
        head_dim: 8,
        dtype_bytes: 1,
        capacity_bytes: 1000,
      },
      expected: { bytes: 256, mebibytes: 0.000244, policy: "retain" },
      comparison: "deep-equal",
    },
  ],
);
export const kvCacheMemoryPolicy = defineCalculatorItem({
  id: "kv-cache-memory-policy",
  title: "Set a KV-Cache Memory Policy",
  topicIds: ["ml_transformer_internals"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Calculate KV-cache memory from context, batch, layers, heads, head dimension, and dtype, then connect the result to a transparent retain or eviction decision.",
  objective:
    "Use a dimensional memory model to explain the effects of GQA/MQA-style KV-head count and distinguish it from a claim about a live server's memory use.",
  completionEvidence:
    "Computes three cache sizes correctly and documents how capacity, admission, and eviction policy would be validated under real workload traces.",
  sources: [
    verifiedSource({
      label: "Transformer KV-cache documentation",
      url: "https://huggingface.co/docs/transformers/main/cache_explanation",
    }),
  ],
  ...kv,
  generateSteps: steps(["key-value tensors", "memory accounting", "capacity policy"]),
  assessmentPayload: {
    variant: "changed-context-and-batch",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Calculate cache bytes before setting admission or eviction policy.",
    inputs: [
      { id: "tokens", label: "Context tokens" },
      { id: "batch", label: "Batch" },
    ],
    result: { value: 256, unit: "bytes", tolerance: 0.000001 },
  },
});

export const COMPUTE_ELECTIVE_EXPECTATIONS = Object.freeze([
  ["roofline-bound-estimator", "ml_accelerator_performance", "calculator"],
  ["tiled-gemm-memory-trace", "ml_accelerator_performance", "trace"],
  ["profiler-optimization-decision", "ml_accelerator_performance", "scenario"],
  ["ring-allreduce-trace", "ml_distributed_training", "trace"],
  ["distributed-parallelism-selection", "ml_distributed_training", "scenario"],
  ["distributed-memory-straggler", "ml_distributed_training", "debugging"],
  ["quantization-deployment-plan", "ml_compilation_quantization", "calculator"],
  ["compiler-graph-compatibility", "ml_compilation_quantization", "debugging"],
  ["portable-runtime-selection", "ml_compilation_quantization", "scenario"],
  ["bpe-token-budget", "ml_transformer_internals", "trace"],
  ["causal-attention-trace", "ml_transformer_internals", "trace"],
  ["kv-cache-memory-policy", "ml_transformer_internals", "calculator"],
] as const);

export const COMPUTE_ELECTIVE_ITEMS = Object.freeze([
  rooflineBoundEstimator,
  tiledGemmMemoryTrace,
  profilerOptimizationDecision,
  ringAllreduceTrace,
  distributedParallelismSelection,
  distributedMemoryStraggler,
  quantizationDeploymentPlan,
  compilerGraphCompatibility,
  portableRuntimeSelection,
  bpeTokenBudget,
  causalAttentionTrace,
  kvCacheMemoryPolicy,
] satisfies readonly LearningItem[]);
