import { scenario } from "./shared";
export const distributedParallelismSelection = scenario({
  id: "distributed-parallelism-selection",
  title: "Select Distributed Parallelism",
  topicId: "ml_distributed_training",
  entrypoint: "select_parallelism",
  contract:
    "Return a constraint-based data, tensor, or pipeline parallelism candidate; this is not a topology design review.",
  code: `def select_parallelism(record):
    if record["model_gb"] > record["memory_per_device_gb"] * record["devices"]: return {"choice": "tensor", "reasons": ["model-does-not-fit-aggregate-sharding"]}
    if record["layers"] >= record["devices"] * 4 and record["microbatches"] >= record["devices"]: return {"choice": "pipeline", "reasons": ["deep-model-and-bubble-control"]}
    return {"choice": "data", "reasons": ["replica-fits-device"]}`,
  cases: [
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
  source: ["PyTorch distributed overview", "https://docs.pytorch.org/docs/stable/distributed.html"],
  values: (r) => {
    const capacity = Number(r.memory_per_device_gb) * Number(r.devices);
    const choice =
      Number(r.model_gb) > capacity
        ? "tensor"
        : Number(r.layers) >= Number(r.devices) * 4 && Number(r.microbatches) >= Number(r.devices)
          ? "pipeline"
          : "data";
    return [
      ["model GB", Number(r.model_gb)],
      ["aggregate capacity GB", capacity],
      ["candidate", choice],
    ];
  },
});
