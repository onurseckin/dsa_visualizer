import { scenario } from "./shared";
export const distributedParallelismSelection = scenario({
  id: "distributed-parallelism-selection",
  title: "Select Distributed Parallelism",
  topicId: "ml_distributed_training",
  entrypoint: "select_parallelism",
  contract:
    "Return a data, tensor, pipeline, or insufficient-memory candidate from explicit per-device fit constraints; this is not a topology design review.",
  code: `def select_parallelism(record):
    model = record["model_gb"]
    per_device = record["memory_per_device_gb"]
    devices = record["devices"]
    if model <= per_device:
        return {"choice": "data", "per_device_model_gb": model, "reasons": ["replica-fits-device"]}
    shard = model / devices
    if shard > per_device:
        return {"choice": "insufficient-memory", "per_device_model_gb": round(shard, 6), "reasons": ["model-exceeds-aggregate-device-memory"]}
    if record["layers"] >= devices * 4 and record["microbatches"] >= devices:
        return {"choice": "pipeline", "per_device_model_gb": round(shard, 6), "reasons": ["replica-exceeds-device-memory", "deep-model-and-bubble-control"]}
    return {"choice": "tensor", "per_device_model_gb": round(shard, 6), "reasons": ["replica-exceeds-device-memory", "tensor-shard-fits-device"]}`,
  cases: [
    {
      id: "data",
      label: "Replica fits",
      input: { model_gb: 20, memory_per_device_gb: 40, devices: 4, layers: 12, microbatches: 4 },
      expected: { choice: "data", per_device_model_gb: 20, reasons: ["replica-fits-device"] },
      comparison: "deep-equal",
    },
    {
      id: "replica-too-large",
      label: "Replica exceeds one device",
      input: { model_gb: 50, memory_per_device_gb: 40, devices: 4, layers: 12, microbatches: 4 },
      expected: {
        choice: "tensor",
        per_device_model_gb: 12.5,
        reasons: ["replica-exceeds-device-memory", "tensor-shard-fits-device"],
      },
      comparison: "deep-equal",
    },
    {
      id: "pipeline",
      label: "Deep model",
      input: { model_gb: 60, memory_per_device_gb: 40, devices: 4, layers: 32, microbatches: 4 },
      expected: {
        choice: "pipeline",
        per_device_model_gb: 15,
        reasons: ["replica-exceeds-device-memory", "deep-model-and-bubble-control"],
      },
      comparison: "deep-equal",
    },
    {
      id: "insufficient",
      label: "Aggregate memory is insufficient",
      input: { model_gb: 200, memory_per_device_gb: 40, devices: 4, layers: 24, microbatches: 4 },
      expected: {
        choice: "insufficient-memory",
        per_device_model_gb: 50,
        reasons: ["model-exceeds-aggregate-device-memory"],
      },
      comparison: "deep-equal",
    },
  ],
  source: ["PyTorch distributed overview", "https://docs.pytorch.org/docs/stable/distributed.html"],
  values: (r) => {
    const perDevice = Number(r.memory_per_device_gb);
    const devices = Number(r.devices);
    const shard = Number(r.model_gb) / devices;
    const choice =
      Number(r.model_gb) <= perDevice
        ? "data"
        : shard > perDevice
          ? "insufficient-memory"
          : Number(r.layers) >= Number(r.devices) * 4 && Number(r.microbatches) >= Number(r.devices)
            ? "pipeline"
            : "tensor";
    return [
      ["model GB", Number(r.model_gb)],
      ["per-device capacity GB", perDevice],
      ["replica fits one device", Number(r.model_gb) <= perDevice],
      ["sharded model GB per device", shard],
      ["candidate", choice],
    ];
  },
});
