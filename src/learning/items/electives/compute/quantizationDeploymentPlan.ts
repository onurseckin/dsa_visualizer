import { calculator } from "./shared";

export const quantizationDeploymentPlan = calculator({
  id: "quantization-deployment-plan",
  title: "Plan Quantization Deployment",
  topicId: "ml_compilation_quantization",
  entrypoint: "plan_quantization",
  contract:
    "Use standard-library arithmetic to quantize and dequantize supplied values, returning per-tensor or per-channel scales, validation error, and deploy or rollback decision; this is not NumPy or vendor inference execution.",
  code: `def plan_quantization(record):
    rows = record["values"]
    qmax = (2 ** (record["bits"] - 1)) - 1
    qmin = -qmax
    if record["granularity"] == "per-channel":
        scales = [max(abs(value) for value in row) / qmax for row in rows]
    else:
        scale = max(abs(value) for row in rows for value in row) / qmax
        scales = [scale]
    quantized = []
    dequantized = []
    errors = []
    for row_index, row in enumerate(rows):
        scale = scales[row_index] if record["granularity"] == "per-channel" else scales[0]
        qrow = [max(qmin, min(qmax, round(value / scale))) if scale else 0 for value in row]
        drow = [round(value * scale, 8) for value in qrow]
        quantized.append(qrow)
        dequantized.append(drow)
        errors.extend(abs(original - restored) for original, restored in zip(row, drow))
    max_error = round(max(errors, default=0), 8)
    validate = max_error <= record["error_budget"]
    return {"scales": [round(scale, 8) for scale in scales], "quantized": quantized, "dequantized": dequantized, "max_error": max_error, "validate": validate, "decision": "deploy" if validate else "rollback", "granularity": record["granularity"]}`,
  cases: [
    {
      id: "int8",
      label: "Int8 calibration",
      input: {
        values: [[-1.27, 0.635, 1.27]],
        bits: 8,
        error_budget: 0.006,
        granularity: "per-tensor",
      },
      expected: {
        scales: [0.01],
        quantized: [[-127, 64, 127]],
        dequantized: [[-1.27, 0.64, 1.27]],
        max_error: 0.005,
        validate: true,
        decision: "deploy",
        granularity: "per-tensor",
      },
      comparison: "deep-equal",
    },
    {
      id: "per-channel-rollback",
      label: "Per-channel rollback",
      input: {
        values: [
          [-1.4, 0.6],
          [0.07, -0.035],
        ],
        bits: 4,
        error_budget: 0.004,
        granularity: "per-channel",
      },
      expected: {
        scales: [0.2, 0.01],
        quantized: [
          [-7, 3],
          [7, -4],
        ],
        dequantized: [
          [-1.4, 0.6],
          [0.07, -0.04],
        ],
        max_error: 0.005,
        validate: false,
        decision: "rollback",
        granularity: "per-channel",
      },
      comparison: "deep-equal",
    },
    {
      id: "int16",
      label: "Int16 calibration",
      input: {
        values: [[3.2767, -1.63835]],
        bits: 16,
        error_budget: 0.0001,
        granularity: "per-tensor",
      },
      expected: {
        scales: [0.0001],
        quantized: [[32767, -16383]],
        dequantized: [[3.2767, -1.6383]],
        max_error: 0.00005,
        validate: true,
        decision: "deploy",
        granularity: "per-tensor",
      },
      comparison: "deep-equal",
    },
  ],
  source: [
    "PyTorch quantization documentation",
    "https://docs.pytorch.org/docs/stable/quantization.html",
  ],
  values: (record) => {
    const rows = record.values as number[][];
    const qmax = 2 ** (Number(record.bits) - 1) - 1;
    const scales =
      record.granularity === "per-channel"
        ? rows.map((row) => Math.max(...row.map(Math.abs)) / qmax)
        : [Math.max(...rows.flat().map(Math.abs)) / qmax];
    let maxError = 0;
    const quantized = rows.map((row, rowIndex) => {
      const scale = record.granularity === "per-channel" ? scales[rowIndex] : scales[0];
      return row.map((value) => {
        const integer = Math.max(-qmax, Math.min(qmax, Math.round(value / scale)));
        maxError = Math.max(maxError, Math.abs(value - integer * scale));
        return integer;
      });
    });
    return [
      ["calibration values", JSON.stringify(rows)],
      ["scales", scales.map((scale) => Number(scale.toFixed(8))).join(",")],
      ["quantized integers", JSON.stringify(quantized)],
      ["maximum validation error", Number(maxError.toFixed(8))],
      ["decision", maxError <= Number(record.error_budget) ? "deploy" : "rollback"],
    ];
  },
});
