import { debugging } from "./shared";
export const compilerGraphCompatibility = debugging({
  id: "compiler-graph-compatibility",
  title: "Debug Compiler Graph Compatibility",
  topicId: "ml_compilation_quantization",
  entrypoint: "check_graph_compatibility",
  contract:
    "Return unsupported operators, dynamic-shape status, and a graph-manifest compatibility classification; it does not compile a model.",
  code: `def check_graph_compatibility(record):
    unsupported = sorted(set(record["operators"]) - set(record["supported"]))
    dynamic = bool(record["dynamic_shapes"])
    return {"unsupported": unsupported, "dynamic_shapes": dynamic, "classification": "compatible" if not unsupported and not dynamic else "partition-or-rewrite"}`,
  cases: [
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
  source: ["ONNX operator schemas", "https://onnx.ai/onnx/operators/"],
  values: (r) => {
    const unsupported = (r.operators as string[]).filter(
      (operator) => !(r.supported as string[]).includes(operator),
    );
    return [
      ["operators", (r.operators as string[]).join(",")],
      ["unsupported operators", unsupported.join(",") || "none"],
      ["dynamic shapes", Boolean(r.dynamic_shapes)],
      [
        "classification",
        unsupported.length || r.dynamic_shapes ? "partition-or-rewrite" : "compatible",
      ],
    ];
  },
});
