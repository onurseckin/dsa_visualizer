import { calculator } from "./shared";
export const quantizationDeploymentPlan = calculator({
  id: "quantization-deployment-plan",
  title: "Plan Quantization Deployment",
  topicId: "ml_compilation_quantization",
  entrypoint: "plan_quantization",
  contract:
    "Return symmetric integer scale, reconstruction error, and validation decision from supplied calibration values; this is not vendor inference.",
  code: `def plan_quantization(record):
    scale = record["max_abs"] / ((2 ** (record["bits"] - 1)) - 1)
    error = scale / 2
    return {"scale": round(scale, 8), "max_error": round(error, 8), "validate": error <= record["error_budget"], "granularity": record["granularity"]}`,
  cases: [
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
  source: [
    "PyTorch quantization documentation",
    "https://docs.pytorch.org/docs/stable/quantization.html",
  ],
  values: (r) => {
    const scale = Number(r.max_abs) / (2 ** (Number(r.bits) - 1) - 1);
    const error = scale / 2;
    return [
      ["calibration maximum", Number(r.max_abs)],
      ["integer scale", Number(scale.toFixed(8))],
      ["maximum error", Number(error.toFixed(8))],
      ["error budget met", error <= Number(r.error_budget)],
    ];
  },
});
