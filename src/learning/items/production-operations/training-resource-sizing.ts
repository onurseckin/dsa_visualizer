import {
  arraySteps,
  defineCalculatorItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def size_training_resources(request):
    gpus = request["gpus"]
    elapsed_seconds = request["steps"] * request["seconds_per_step"]
    capacity_gpu_seconds = gpus * elapsed_seconds
    utilization = request["observed_gpu_busy_seconds"] / capacity_gpu_seconds
    gpu_hours = capacity_gpu_seconds / 3600
    peak_memory = request["model_gb"] * (1 + request["optimizer_multiplier"]) / gpus + request["activation_gb_per_gpu"]
    return {
        "peak_memory_per_gpu_gb": round(peak_memory, 6),
        "gpu_hours": round(gpu_hours, 6),
        "utilization": round(utilization, 6),
        "wasted_gpu_hours": round(gpu_hours * (1 - utilization), 6),
        "checkpoint_storage_gb": round(request["checkpoint_count"] * request["checkpoint_gb"], 6),
        "network_transfer_gb": round(request["steps"] * request["network_gb_per_step"], 6),
        "throughput_samples_per_second": round(request["samples_per_step"] / request["seconds_per_step"], 6),
    }`;

const execution = functionExecution({
  entrypoint: "size_training_resources",
  outputContract:
    "Return per-GPU peak memory, GPU-hours, busy utilization, wasted GPU-hours, checkpoint storage, network transfer, and sample throughput.",
  cases: [
    {
      id: "four-gpu",
      label: "Four-GPU training run",
      input: {
        gpus: 4,
        steps: 3600,
        seconds_per_step: 2,
        observed_gpu_busy_seconds: 21600,
        model_gb: 16,
        optimizer_multiplier: 3,
        activation_gb_per_gpu: 6,
        checkpoint_count: 3,
        checkpoint_gb: 20,
        network_gb_per_step: 0.4,
        samples_per_step: 128,
      },
      expected: {
        peak_memory_per_gpu_gb: 22,
        gpu_hours: 8,
        utilization: 0.75,
        wasted_gpu_hours: 2,
        checkpoint_storage_gb: 60,
        network_transfer_gb: 1440,
        throughput_samples_per_second: 64,
      },
      comparison: "deep-equal",
    },
    {
      id: "single-gpu",
      label: "Single-GPU fine-tune",
      input: {
        gpus: 1,
        steps: 1800,
        seconds_per_step: 1,
        observed_gpu_busy_seconds: 1440,
        model_gb: 4,
        optimizer_multiplier: 2,
        activation_gb_per_gpu: 5,
        checkpoint_count: 2,
        checkpoint_gb: 6,
        network_gb_per_step: 0,
        samples_per_step: 32,
      },
      expected: {
        peak_memory_per_gpu_gb: 17,
        gpu_hours: 0.5,
        utilization: 0.8,
        wasted_gpu_hours: 0.1,
        checkpoint_storage_gb: 12,
        network_transfer_gb: 0,
        throughput_samples_per_second: 32,
      },
      comparison: "deep-equal",
    },
    {
      id: "eight-gpu-low-utilization",
      label: "Eight-GPU low-utilization run",
      input: {
        gpus: 8,
        steps: 7200,
        seconds_per_step: 0.5,
        observed_gpu_busy_seconds: 14400,
        model_gb: 32,
        optimizer_multiplier: 3,
        activation_gb_per_gpu: 8,
        checkpoint_count: 4,
        checkpoint_gb: 40,
        network_gb_per_step: 0.25,
        samples_per_step: 256,
      },
      expected: {
        peak_memory_per_gpu_gb: 24,
        gpu_hours: 8,
        utilization: 0.5,
        wasted_gpu_hours: 4,
        checkpoint_storage_gb: 160,
        network_transfer_gb: 1800,
        throughput_samples_per_second: 512,
      },
      comparison: "deep-equal",
    },
  ],
});

export const trainingResourceSizing = defineCalculatorItem({
  id: "training-resource-sizing",
  title: "Size a Training Resource Contract",
  topicIds: ["ml_training_platform"],
  difficultyProfile: profile(2, 3, 2, 2),
  description:
    "Compute memory, elapsed capacity, useful utilization, waste, checkpoint storage, network transfer, and throughput from explicit units.",
  objective:
    "Build a resource estimate whose memory, time, storage, network, and utilization assumptions can be independently audited.",
  completionEvidence:
    "A passing estimate includes correct units and explains which observed utilization loss is actionable rather than treating allocation as useful work.",
  sources: [
    verifiedSource({
      label: "Kubernetes scheduling GPUs",
      url: "https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "size_training_resources",
    parameters: ["request"],
    contract:
      "Return the seven documented resource metrics using explicit seconds, hours, gigabytes, and samples.",
  }),
  execution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 3,
        what: "Compute elapsed job seconds.",
        why: "GPU-hours multiply wall time by allocated GPUs.",
        values: ["steps", "seconds/step", "elapsed seconds"],
        activeIndices: [0, 1],
      },
      {
        codeLine: 5,
        what: "Separate busy time from allocated capacity.",
        why: "Utilization is useful GPU-seconds divided by capacity GPU-seconds.",
        values: ["busy GPU-s", "capacity GPU-s", "utilization"],
        activeIndices: [0, 1, 2],
      },
      {
        codeLine: 7,
        what: "Add model-state and activation memory per device.",
        why: "A device must fit both persistent state and live activations.",
        values: ["model+optimizer", "activations", "peak/device"],
        completedIndices: [0, 1],
        activeIndices: [2],
      },
      {
        codeLine: 13,
        what: "Emit storage, network, and throughput alongside compute.",
        why: "A reliable execution contract spans every constrained resource.",
        values: ["GPU-hours", "checkpoint GB", "network GB", "samples/s"],
        completedIndices: [0, 1, 2],
        activeIndices: [3],
      },
    ]),
  assessmentPayload: {
    variant: "changed-utilization-and-checkpoint",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Estimate the complete resource contract before admitting the training job.",
    inputs: [
      { id: "gpus", label: "Allocated GPUs", unit: "GPUs", defaultValue: "4" },
      { id: "steps", label: "Training steps", unit: "steps", defaultValue: "3600" },
      { id: "seconds_per_step", label: "Step time", unit: "s/step", defaultValue: "2" },
      {
        id: "observed_gpu_busy_seconds",
        label: "Observed busy time",
        unit: "GPU-s",
        defaultValue: "21600",
      },
    ],
    result: { value: 8, unit: "GPU-hours", tolerance: 0.000001 },
  },
});
