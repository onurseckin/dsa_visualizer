import { calculator } from "./shared";

export const rooflineBoundEstimator = calculator({
  id: "roofline-bound-estimator",
  title: "Estimate a Roofline Bound",
  topicId: "ml_accelerator_performance",
  entrypoint: "estimate_roofline",
  contract:
    "Return arithmetic intensity and a roofline upper bound from supplied FLOPs, bytes, bandwidth, and peak throughput; this is not measured accelerator performance.",
  code: `def estimate_roofline(record):
    intensity = record["flops"] / record["bytes"]
    memory_bound = intensity * record["bandwidth_gbps"]
    attainable = min(record["peak_gflops"], memory_bound)
    return {"arithmetic_intensity": round(intensity, 6), "memory_bound_gflops": round(memory_bound, 6), "attainable_gflops": round(attainable, 6), "bound": "memory" if memory_bound < record["peak_gflops"] else "compute"}`,
  cases: [
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
  source: ["Roofline performance model", "https://doi.org/10.1145/1498765.1498785"],
  values: (r) => {
    const intensity = Number(r.flops) / Number(r.bytes);
    const memory = intensity * Number(r.bandwidth_gbps);
    return [
      ["FLOPs", Number(r.flops)],
      ["arithmetic intensity", intensity],
      ["attainable GFLOP/s", Math.min(Number(r.peak_gflops), memory)],
    ];
  },
});
