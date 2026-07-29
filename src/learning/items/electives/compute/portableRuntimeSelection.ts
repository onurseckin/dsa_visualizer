import { scenario } from "./shared";
export const portableRuntimeSelection = scenario({
  id: "portable-runtime-selection",
  title: "Select a Portable Runtime",
  topicId: "ml_compilation_quantization",
  entrypoint: "select_portable_runtime",
  contract:
    "Return a portable or specialized runtime decision from supplied compatibility and latency constraints; it does not execute an engine.",
  code: `def select_portable_runtime(record):
    if record["targets"] > 1 and record["portable_supported"]: return {"choice": "portable", "reason": "multi-target-compatibility"}
    if record["specialized_latency_ms"] < record["latency_slo_ms"]: return {"choice": "specialized", "reason": "latency-slo"}
    return {"choice": "portable", "reason": "fallback-compatibility"}`,
  cases: [
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
  source: ["ONNX Runtime compatibility", "https://onnxruntime.ai/docs/"],
  values: (r) => {
    const choice =
      Number(r.targets) > 1 && Boolean(r.portable_supported)
        ? "portable"
        : Number(r.specialized_latency_ms) < Number(r.latency_slo_ms)
          ? "specialized"
          : "portable";
    return [
      ["target count", Number(r.targets)],
      ["portable support", Boolean(r.portable_supported)],
      ["specialized latency ms", Number(r.specialized_latency_ms)],
      ["candidate", choice],
    ];
  },
});
