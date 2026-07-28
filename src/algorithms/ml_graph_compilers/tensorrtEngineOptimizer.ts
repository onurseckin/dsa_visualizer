import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TensorrtLayer {
  id: string;
  name: string;
  type: string;
  precision: "FP32" | "FP16" | "INT8";
  latencyMs: number;
}

export interface TensorrtEngineOptimizerInput {
  layers: TensorrtLayer[];
  targetPrecision: "FP16" | "INT8";
  enableHorizontalFusion: boolean;
}

export const TENSORRT_ENGINE_OPTIMIZER_CODE = `def optimize_tensorrt_engine(layers: list[dict], target_precision: str, enable_horizontal_fusion: bool) -> dict:
    optimized_layers = []
    i = 0
    n = len(layers)
    total_original_latency = sum(l["latencyMs"] for l in layers)

    while i < n:
        if (i + 2 < n and 
            layers[i]["type"] == "Conv" and 
            layers[i+1]["type"] == "BiasAdd" and 
            layers[i+2]["type"] == "ReLU"):
            fused_latency = layers[i]["latencyMs"] * 0.7
            if target_precision == "FP16":
                fused_latency *= 0.5
            elif target_precision == "INT8":
                fused_latency *= 0.25
            optimized_layers.append({
                "id": f"fused_{layers[i]['id']}_{layers[i+2]['id']}",
                "name": f"fused_cbr_{layers[i]['name']}",
                "type": "CBR_Fused_Kernel",
                "precision": target_precision,
                "latencyMs": round(fused_latency, 3)
            })
            i += 3
            continue

        layer = dict(layers[i])
        scale_factor = 0.5 if target_precision == "FP16" else (0.25 if target_precision == "INT8" else 1.0)
        layer["precision"] = target_precision
        layer["latencyMs"] = round(layer["latencyMs"] * scale_factor, 3)
        optimized_layers.append(layer)
        i += 1

    if enable_horizontal_fusion and len(optimized_layers) >= 2:
        h_fused = []
        j = 0
        while j < len(optimized_layers):
            if (j + 1 < len(optimized_layers) and 
                optimized_layers[j]["type"] == optimized_layers[j+1]["type"] == "Conv"):
                merged_latency = max(optimized_layers[j]["latencyMs"], optimized_layers[j+1]["latencyMs"]) * 1.15
                h_fused.append({
                    "id": f"h_fused_{optimized_layers[j]['id']}_{optimized_layers[j+1]['id']}",
                    "name": f"h_fused_{optimized_layers[j]['name']}_{optimized_layers[j+1]['name']}",
                    "type": "Horizontal_Grouped_Conv",
                    "precision": target_precision,
                    "latencyMs": round(merged_latency, 3)
                })
                j += 2
            else:
                h_fused.append(optimized_layers[j])
                j += 1
        optimized_layers = h_fused

    total_optimized_latency = sum(l["latencyMs"] for l in optimized_layers)
    speedup = round(total_original_latency / total_optimized_latency, 2) if total_optimized_latency > 0 else 1.0

    return {
        "optimizedLayers": optimized_layers,
        "originalLatencyMs": total_original_latency,
        "optimizedLatencyMs": total_optimized_latency,
        "speedup": speedup
    }`;

export const DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT: TensorrtEngineOptimizerInput = {
  layers: [
    { id: "l1", name: "conv1", type: "Conv", precision: "FP32", latencyMs: 2.5 },
    { id: "l2", name: "bias1", type: "BiasAdd", precision: "FP32", latencyMs: 0.8 },
    { id: "l3", name: "relu1", type: "ReLU", precision: "FP32", latencyMs: 0.5 },
    { id: "l4", name: "conv2a", type: "Conv", precision: "FP32", latencyMs: 1.8 },
    { id: "l5", name: "conv2b", type: "Conv", precision: "FP32", latencyMs: 1.8 },
    { id: "l6", name: "conv3", type: "Conv", precision: "FP32", latencyMs: 3.0 },
    { id: "l7", name: "bias3", type: "BiasAdd", precision: "FP32", latencyMs: 0.9 },
    { id: "l8", name: "relu3", type: "ReLU", precision: "FP32", latencyMs: 0.6 },
    { id: "l9", name: "conv4a", type: "Conv", precision: "FP32", latencyMs: 2.0 },
    { id: "l10", name: "conv4b", type: "Conv", precision: "FP32", latencyMs: 2.0 },
  ],
  targetPrecision: "FP16",
  enableHorizontalFusion: true,
};

function buildTrtMatrixSnapshot(
  layers: TensorrtLayer[],
  currentIndex: number,
  activeRange: [number, number] | null,
  passName: string,
): MatrixVisualSnapshot {
  const colHeaders = ["Idx", "ID", "Name", "Type", "Precision", "Latency (ms)", "Pass State"];
  const rows = layers.length;
  const cells: MatrixCellItem[] = [];

  layers.forEach((l, r) => {
    let state: MatrixCellItem["state"] = "default";
    let statusText = "Pending";

    if (activeRange && r >= activeRange[0] && r <= activeRange[1]) {
      state = "active";
      statusText = "Optimizing";
    } else if (r < currentIndex) {
      state = "sorted";
      statusText = "Optimized";
    } else if (r === currentIndex) {
      state = "pivot";
      statusText = "Inspecting";
    }

    cells.push(
      { row: r, col: 0, value: r, state },
      { row: r, col: 1, value: l.id, state },
      { row: r, col: 2, value: l.name, state },
      { row: r, col: 3, value: l.type, state },
      { row: r, col: 4, value: l.precision, state },
      { row: r, col: 5, value: l.latencyMs, state },
      { row: r, col: 6, value: statusText, state },
    );
  });

  return {
    kind: "matrix",
    rows,
    cols: 7,
    colHeaders,
    cells,
    title: `TensorRT Optimization Matrix (${passName})`,
  };
}

export const generateTensorrtEngineOptimizerSteps = (
  input: TensorrtEngineOptimizerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { layers, targetPrecision, enableHorizontalFusion } = input;
  const origLatency = layers.reduce((sum, l) => sum + l.latencyMs, 0);
  const n = layers.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentIndex: number,
    activeRange: [number, number] | null,
    passName: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildTrtMatrixSnapshot(layers, currentIndex, activeRange, passName),
      auxiliaryState: {
        customState: {
          targetPrecision,
          enableHorizontalFusion: String(enableHorizontalFusion),
          origLatencyMs: origLatency.toFixed(2),
          currentPass: passName,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize TensorRT Optimization Engine",
    `Setting target precision ${targetPrecision} and horizontal fusion = ${enableHorizontalFusion}. Original unoptimized total latency: ${origLatency.toFixed(2)}ms across ${n} layers.`,
    { n, targetPrecision, enableHorizontalFusion },
    0,
    null,
    "Init",
  );

  addStep(
    2,
    "Initialize Container optimized_layers",
    "Creating empty container to hold transformed layer metadata.",
    { n, targetPrecision },
    0,
    null,
    "Init",
  );

  addStep(
    3,
    "Initialize Index Pointer i = 0",
    "Setting iteration pointer i = 0.",
    { i: 0, n },
    0,
    null,
    "Init",
  );

  addStep(
    5,
    `Calculate Total Baseline Latency = ${origLatency.toFixed(2)}ms`,
    "Summing individual layer baseline latencies in FP32 precision.",
    { total_original_latency: origLatency },
    0,
    null,
    "Init",
  );

  const pass1Layers: TensorrtLayer[] = [];
  let i = 0;

  while (i < n) {
    addStep(
      7,
      `Pass 1 & 2 Loop at i = ${i}`,
      `Inspecting layer ${layers[i].name} (${layers[i].type}) for CBR vertical fusion and precision quantization.`,
      { i, n, layer_name: layers[i].name },
      i,
      null,
      "Pass 1: Vertical & Quant",
    );

    addStep(
      8,
      `Check Vertical CBR Pattern at i = ${i}`,
      "Evaluating window [Conv, BiasAdd, ReLU] starting at index i.",
      { i, pattern: "CBR" },
      i,
      null,
      "Pass 1: Vertical & Quant",
    );

    if (
      i + 2 < n &&
      layers[i].type === "Conv" &&
      layers[i + 1].type === "BiasAdd" &&
      layers[i + 2].type === "ReLU"
    ) {
      let fusedLatency = layers[i].latencyMs * 0.7;

      addStep(
        12,
        `Compute Fused CBR Latency at i = ${i}`,
        `Baseline latency ${layers[i].latencyMs}ms × 0.7 (fusion reduction) = ${(layers[i].latencyMs * 0.7).toFixed(2)}ms.`,
        {
          i,
          base_latency: layers[i].latencyMs,
          fused_latency: (layers[i].latencyMs * 0.7).toFixed(2),
        },
        i,
        null,
        "Pass 1: Vertical & Quant",
      );

      if (targetPrecision === "FP16") fusedLatency *= 0.5;
      else if (targetPrecision === "INT8") fusedLatency *= 0.25;

      addStep(
        13,
        `Apply ${targetPrecision} Precision Scaling to Fused Layer`,
        `Scaled fused latency by ${targetPrecision === "FP16" ? "0.5 (FP16 2x speedup)" : targetPrecision === "INT8" ? "0.25 (INT8 4x speedup)" : "1.0 (FP32 no scaling)"} → ${fusedLatency.toFixed(2)}ms.`,
        { i, targetPrecision, fused_latency: fusedLatency.toFixed(2) },
        i,
        null,
        "Pass 1: Vertical & Quant",
      );

      const fusedLayer: TensorrtLayer = {
        id: `fused_${layers[i].id}_${layers[i + 2].id}`,
        name: `fused_cbr_${layers[i].name}`,
        type: "CBR_Fused_Kernel",
        precision: targetPrecision,
        latencyMs: Number(fusedLatency.toFixed(3)),
      };

      pass1Layers.push(fusedLayer);

      addStep(
        17,
        `Fuse Vertical CBR Pattern at i = ${i}..${i + 2}`,
        `Fused ${layers[i].name} + ${layers[i + 1].name} + ${layers[i + 2].name} into single ${targetPrecision} CBR kernel. Latency reduced to ${fusedLayer.latencyMs}ms.`,
        { i, fused_name: fusedLayer.name, latency: fusedLayer.latencyMs },
        i,
        [i, i + 2],
        "Pass 1: Vertical & Quant",
      );

      i += 3;
      addStep(
        24,
        `Advance Index i by 3 to ${i}`,
        "Skipping consumed vertical CBR layers.",
        { i },
        i,
        null,
        "Pass 1: Vertical & Quant",
      );
      continue;
    } else {
      addStep(
        8,
        `Vertical CBR Pattern Rejected at i = ${i}`,
        "Window does not match Conv -> BiasAdd -> ReLU sequence.",
        { i, match: false },
        i,
        null,
        "Pass 1: Vertical & Quant",
      );
    }

    const scale = targetPrecision === "FP16" ? 0.5 : targetPrecision === "INT8" ? 0.25 : 1.0;
    const scaledLayer: TensorrtLayer = {
      ...layers[i],
      precision: targetPrecision,
      latencyMs: Number((layers[i].latencyMs * scale).toFixed(3)),
    };

    pass1Layers.push(scaledLayer);

    addStep(
      28,
      `Compute ${targetPrecision} Scale Factor for Single Layer ${layers[i].name}`,
      `Scale = ${scale} for ${targetPrecision}. New latency: ${scaledLayer.latencyMs}ms.`,
      { i, layer_name: layers[i].name, scale, new_latency: scaledLayer.latencyMs },
      i,
      [i, i],
      "Pass 1: Vertical & Quant",
    );

    i += 1;
    addStep(
      32,
      `Advance Index i to ${i}`,
      "Moving to next layer.",
      { i },
      i,
      null,
      "Pass 1: Vertical & Quant",
    );
  }

  let finalLayers = pass1Layers;

  addStep(
    34,
    "Evaluate Pass 3: Horizontal Layer Fusion",
    `Checking if enable_horizontal_fusion (${enableHorizontalFusion}) is true and optimized layers >= 2.`,
    { enableHorizontalFusion, layerCount: pass1Layers.length },
    n,
    null,
    "Pass 3: Horizontal Fusion",
  );

  if (enableHorizontalFusion && pass1Layers.length >= 2) {
    const hFused: TensorrtLayer[] = [];
    let j = 0;

    addStep(
      35,
      "Initialize Horizontal Fusion Container h_fused",
      "Creating container to store horizontally merged layer groups.",
      { j: 0 },
      n,
      null,
      "Pass 3: Horizontal Fusion",
    );

    addStep(
      36,
      "Initialize Horizontal Index j = 0",
      "Setting horizontal fusion pointer j = 0.",
      { j: 0, total: pass1Layers.length },
      n,
      null,
      "Pass 3: Horizontal Fusion",
    );

    while (j < pass1Layers.length) {
      addStep(
        37,
        `Pass 3 Horizontal Loop at j = ${j}`,
        `Inspecting adjacent layers for parallel convolution coalescing.`,
        { j, total: pass1Layers.length },
        n,
        null,
        "Pass 3: Horizontal Fusion",
      );

      if (
        j + 1 < pass1Layers.length &&
        pass1Layers[j].type === "Conv" &&
        pass1Layers[j + 1].type === "Conv"
      ) {
        const mergedLatency =
          Math.max(pass1Layers[j].latencyMs, pass1Layers[j + 1].latencyMs) * 1.15;
        const mergedLayer: TensorrtLayer = {
          id: `h_fused_${pass1Layers[j].id}_${pass1Layers[j + 1].id}`,
          name: `h_fused_${pass1Layers[j].name}_${pass1Layers[j + 1].name}`,
          type: "Horizontal_Grouped_Conv",
          precision: targetPrecision,
          latencyMs: Number(mergedLatency.toFixed(3)),
        };

        hFused.push(mergedLayer);

        addStep(
          41,
          `Coalesce Parallel Convolutions '${pass1Layers[j].name}' and '${pass1Layers[j + 1].name}'`,
          `Merged parallel convolutions into grouped kernel '${mergedLayer.name}' with merged latency ${mergedLayer.latencyMs}ms.`,
          { j, merged_name: mergedLayer.name, latency: mergedLayer.latencyMs },
          n,
          null,
          "Pass 3: Horizontal Fusion",
        );

        j += 2;
        addStep(
          48,
          `Advance Horizontal Index j by 2 to ${j}`,
          "Skipping coalesced parallel layers.",
          { j },
          n,
          null,
          "Pass 3: Horizontal Fusion",
        );
      } else {
        hFused.push(pass1Layers[j]);
        addStep(
          50,
          `Pass Through Single Layer '${pass1Layers[j].name}'`,
          "Layer cannot be horizontally fused; appending to execution plan.",
          { j, layer_name: pass1Layers[j].name },
          n,
          null,
          "Pass 3: Horizontal Fusion",
        );
        j += 1;
        addStep(
          51,
          `Advance Horizontal Index j by 1 to ${j}`,
          "Moving to next horizontal layer.",
          { j },
          n,
          null,
          "Pass 3: Horizontal Fusion",
        );
      }
    }
    finalLayers = hFused;
  }

  const finalLatency = finalLayers.reduce((sum, l) => sum + l.latencyMs, 0);
  const speedup = Number((origLatency / (finalLatency || 1)).toFixed(2));

  addStep(
    54,
    `Calculate Final Optimized Latency = ${finalLatency.toFixed(2)}ms`,
    `Summed latencies of all ${finalLayers.length} optimized engine layers.`,
    { total_optimized_latency: finalLatency },
    n,
    null,
    "Final",
  );

  addStep(
    55,
    `Compute Overall Acceleration Speedup = ${speedup}x`,
    `Speedup factor computed as ${origLatency.toFixed(2)}ms / ${finalLatency.toFixed(2)}ms.`,
    { speedup },
    n,
    null,
    "Final",
  );

  addStep(
    57,
    "TensorRT Engine Compilation & Tactic Tuning Complete",
    `Successfully compiled optimized TensorRT execution engine with ${speedup}x total speedup. Ready for CUDA stream dispatch.`,
    { complete: true, origLatency, finalLatency, speedup },
    n,
    null,
    "Final",
  );

  return steps;
};

const TENSORRT_ENGINE_OPTIMIZER_TRIVIA: TriviaMeta = {
  skipLines: [6, 18, 19, 20, 21, 23, 26, 33, 42, 43, 44, 45, 47, 49, 53, 56, 58, 59, 60, 62],
  distractors: [
    "fused_latency = layers[i]['latencyMs'] * 3.0",
    "layer['precision'] = 'FP64'",
    "optimized_layers = layers[::-1]",
    "speedup = total_original_latency * total_optimized_latency",
  ],
  hints: [
    { line: 8, hint: "Match vertical Conv + BiasAdd + ReLU layers for CBR fusion." },
    { line: 12, hint: "Compute CBR fused latency applying 30% kernel fusion savings." },
    { line: 38, hint: "Coalesce parallel identical convolution ops into a single grouped kernel." },
    { line: 55, hint: "Calculate overall engine latency reduction and execution speedup factor." },
  ],
  lineExplanations: {
    1: "Function signature defining optimize_tensorrt_engine with layers list, target_precision, and enable_horizontal_fusion flag.",
    2: "Initializes optimized_layers list to store transformed execution plan nodes.",
    3: "Sets iteration pointer i to index 0 for the vertical graph traversal pass.",
    4: "Stores initial layer count n = len(layers).",
    5: "Calculates baseline total FP32 latency by summing individual unoptimized layer latencies.",
    6: "Blank line separating initialization from vertical fusion and precision scaling loop.",
    7: "Loop iterating through network layers while pointer i is less than count n.",
    8: "Evaluates if a 3-layer window remains available starting at index i.",
    9: "Checks if layer at index i is a Convolution operation.",
    10: "Checks if subsequent layer at index i+1 is a BiasAdd operation.",
    11: "Checks if final window layer at index i+2 is a ReLU activation.",
    12: "Computes CBR fused kernel baseline latency applying a 30% reduction factor (0.7) from memory transfer overhead elimination.",
    13: "Checks if target precision is FP16 half-precision floating point.",
    14: "Applies 2x speedup factor (0.5) for FP16 Tensor Core execution.",
    15: "Checks if target precision is INT8 quantized integer math.",
    16: "Applies 4x speedup factor (0.25) for INT8 Tensor Core execution.",
    17: "Appends composite fused CBR kernel configuration object to optimized_layers list.",
    18: "Constructs composite unique node identifier for fused CBR block.",
    19: "Formats human-readable fused kernel node name.",
    20: "Sets layer operation type string to CBR_Fused_Kernel.",
    21: "Sets node precision attribute to targetPrecision.",
    22: "Stores calculated fused layer latency rounded to 3 decimal places.",
    23: "Closes dictionary literal for fused CBR kernel node.",
    24: "Advances loop pointer i by 3 to skip consumed Conv, BiasAdd, and ReLU layers.",
    25: "Continues loop to next unvisited layer index.",
    26: "Blank line separating fusion branch from un-fused single-layer fallback pass.",
    27: "Copies single layer dictionary for non-fused precision transformation.",
    28: "Computes single-layer precision scale factor (0.5 for FP16, 0.25 for INT8, 1.0 for FP32).",
    29: "Updates layer precision attribute to target precision.",
    30: "Applies precision scale factor and rounds single-layer latency to 3 decimal places.",
    31: "Appends single precision-scaled layer to optimized_layers list.",
    32: "Advances loop pointer i by 1 to process next sequential layer.",
    33: "Blank line separating Pass 1 & 2 loop from Pass 3 horizontal layer fusion.",
    34: "Evaluates if horizontal fusion pass is enabled and at least 2 layers exist in optimized_layers.",
    35: "Initializes empty h_fused list to hold horizontally coalesced layer plan.",
    36: "Initializes horizontal fusion iteration index pointer j to 0.",
    37: "Loop iterating through optimized_layers while index pointer j is less than length.",
    38: "Checks if 2 adjacent layers are available for horizontal grouped conv fusion.",
    39: "Verifies both adjacent layers at j and j+1 are Convolution operations.",
    40: "Computes merged grouped convolution latency as 115% of max latency across parallel layers.",
    41: "Appends merged horizontal grouped convolution layer payload to h_fused list.",
    42: "Sets composite horizontal fused layer identifier.",
    43: "Formats composite horizontal fused layer name.",
    44: "Sets layer type to Horizontal_Grouped_Conv.",
    45: "Sets node precision attribute to target precision.",
    46: "Stores calculated merged grouped convolution latency rounded to 3 decimal places.",
    47: "Closes horizontal fused layer dictionary object.",
    48: "Advances inner horizontal index j by 2 to skip merged parallel convolution pair.",
    49: "Else branch executed when adjacent layers cannot be horizontally coalesced.",
    50: "Appends single layer at index j directly to h_fused list.",
    51: "Advances inner horizontal index j by 1.",
    52: "Replaces optimized_layers list with horizontally fused execution plan h_fused.",
    53: "Blank line before final total latency and speedup metric calculation.",
    54: "Sums latencies of all final optimized engine layers to compute total_optimized_latency.",
    55: "Calculates overall engine execution speedup factor as baseline divided by optimized latency.",
    56: "Blank line before returning compilation result.",
    57: "Opens return dictionary payload containing compiled TensorRT engine metrics.",
    58: "Returns optimizedLayers list of transformed execution graph nodes.",
    59: "Returns original unoptimized total baseline latency in milliseconds.",
    60: "Returns optimized total engine latency in milliseconds.",
    61: "Returns overall speedup factor.",
    62: "Closes return dictionary object.",
  },
};

export const tensorrtEngineOptimizer: AlgorithmDefinition<TensorrtEngineOptimizerInput> = {
  id: "tensorrt-engine-optimizer",
  title: "TensorRT Execution Engine & Precision Quantization Optimizer",
  topicIds: ["ml_graph_compilers"],
  difficulty: "Hard",
  description:
    "NVIDIA TensorRT is an advanced deep learning inference optimizer and runtime framework engineered for high-throughput GPU execution. Models trained in PyTorch, TensorFlow, or ONNX often contain redundant layer boundaries and uncalibrated FP32 floating-point math. TensorRT processes computational graphs through a sequence of hardware-aware optimization passes to generate a serialized engine executable on NVIDIA Tensor Cores.\n\n### Mathematical Formulation & Quantization Math\n1. **Vertical Layer Fusion**: For a sequence $\\text{Conv} \\to \\text{BiasAdd} \\to \\text{ReLU}$, individual latencies $t_{\\text{conv}}, t_{\\text{bias}}, t_{\\text{relu}}$ are collapsed into a fused kernel latency $t_{\\text{fused}} = \\eta_{\\text{fusion}} \\cdot t_{\\text{conv}}$, where $\\eta_{\\text{fusion}} = 0.7$ accounts for intermediate DRAM transfer elimination.\n\n2. **Precision Scaling**: Down-casting FP32 parameters to low-precision FP16 or INT8 formats applies a hardware acceleration factor $\\alpha_{\\text{prec}}$:\n$$\\alpha_{\\text{prec}} = \\begin{cases} 0.5 & \\text{if FP16 (2x Tensor Core TFLOPS)} \\\\ 0.25 & \\text{if INT8 (4x Tensor Core TOPS)} \\\\ 1.0 & \\text{if FP32} \\end{cases}$$\nFinal fused layer latency is computed as:\n$$t_{\\text{final}} = t_{\\text{fused}} \\cdot \\alpha_{\\text{prec}}$$\n\n3. **Horizontal Layer Coalescing**: Parallel layers of identical type (e.g. $N_{\\text{parallel}}$ Conv branches) with latencies $t_1, t_2, \\dots, t_k$ are merged into a single grouped convolution launch with latency $t_{\\text{horizontal}} = \\max_j(t_j) \\cdot 1.15$, where $1.15$ accounts for grouping dispatch overhead.\n\nOverall execution speedup is given by:\n$$\\text{Speedup} = \\frac{\\sum_{i=1}^n t_{i,\\text{orig}}}{\\sum_{m=1}^M t_{m,\\text{opt}}}$$\n\nInput Format:\n- `layers`: List of network layer metadata objects containing `id`, `name`, `type`, `precision`, and baseline `latencyMs`.\n- `targetPrecision`: Target precision string (`'FP16'` or `'INT8'`).\n- `enableHorizontalFusion`: Boolean flag enabling horizontal parallel layer merging.\n\nOutput Format:\n- Returns dictionary containing `optimizedLayers`, `originalLatencyMs`, `optimizedLatencyMs`, and total calculated `speedup` factor.\n\nEdge Cases & Constraints:\n- Plugin custom layers: User-defined TensorRT plugins bypass standard graph rewrites and require custom tactic profiling.\n- Dynamic shape profiles: Optimization tactics must accommodate min/opt/max input dimensions specified in TensorRT optimization profiles.\n- Accuracy loss in INT8: Low-precision INT8 calibration requires KL-divergence histogram analysis ($D_{\\text{KL}}(P \\parallel Q) = \\sum P(x) \\log \\frac{P(x)}{Q(x)}$) to prevent severe quantization degradation.",
  constraints: [
    "1 <= layers.length <= 100",
    "targetPrecision in ['FP16', 'INT8']",
    "layers[i].latencyMs > 0",
  ],
  examples: [
    {
      kind: "basic",
      title: "10-Layer CBR Fusion + FP16 Quantization + Horizontal Merging",
      inputDisplay:
        "layers=[10 layers including 2 CBR blocks and 2 parallel Conv pairs], targetPrecision='FP16'",
      outputDisplay: "Optimized layers with ~4x total latency speedup",
      input: DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT,
      output: "Optimized engine plan with 4x speedup",
      explanation:
        "Applies vertical CBR fusion to Conv+BiasAdd+ReLU blocks, FP16 Tensor Core scaling, and horizontal fusion to parallel convolutions.",
    },
    {
      kind: "complex",
      title: "INT8 Tensor Core Quantization",
      inputDisplay: "layers=[Conv, BiasAdd, ReLU], targetPrecision='INT8'",
      outputDisplay: "CBR INT8 Kernel, Speedup: ~5.7x",
      input: {
        layers: [
          { id: "l1", name: "c1", type: "Conv", precision: "FP32", latencyMs: 4.0 },
          { id: "l2", name: "b1", type: "BiasAdd", precision: "FP32", latencyMs: 1.0 },
          { id: "l3", name: "r1", type: "ReLU", precision: "FP32", latencyMs: 0.5 },
        ],
        targetPrecision: "INT8",
        enableHorizontalFusion: false,
      },
      output: "INT8 CBR Kernel (~5.7x speedup)",
      explanation:
        "Combines vertical CBR fusion with INT8 Tensor Core execution, reducing baseline latency from 5.5ms down to under 1.0ms.",
    },
    {
      kind: "negative",
      title: "Single Unsupported Plugin Layer",
      inputDisplay: "layers=[CustomPlugin], targetPrecision='FP16'",
      outputDisplay: "CustomPlugin FP16 (2.0x speedup from FP16 cast)",
      input: {
        layers: [
          { id: "p1", name: "my_plugin", type: "CustomPlugin", precision: "FP32", latencyMs: 3.0 },
        ],
        targetPrecision: "FP16",
        enableHorizontalFusion: true,
      },
      output: "CustomPlugin (FP16)",
      explanation:
        "Custom plugin layer cannot undergo vertical CBR fusion, but receives FP16 precision casting.",
    },
  ],
  code: TENSORRT_ENGINE_OPTIMIZER_CODE,
  timeComplexity: {
    best: "O(L)",
    average: "O(L)",
    worst: "O(L)",
  },
  spaceComplexity: "O(L)",
  complexityAnalysis: {
    time: "O(L) single-pass evaluation across L graph layers.",
    space: "O(L) memory for optimized layer configuration plan.",
  },
  topicGuide: {
    overview:
      "NVIDIA TensorRT is the gold standard inference optimizer for production deployment on NVIDIA GPUs (A100, H100, L40S). By combining graph transformations, low-precision quantization, and target-specific CUDA kernel tactic auto-tuning, TensorRT maximizes throughput and minimizes latency.",
    sections: [
      {
        heading: "Why It Exists",
        body: "Deep learning models are typically trained in PyTorch or TensorFlow using FP32 auto-differentiation graphs. Directly deploying raw training graphs leads to high latency due to memory bandwidth bounds and unoptimized kernel launch overheads. TensorRT converts training models into ultra-fast inference execution engines.",
      },
      {
        heading: "What It Solves",
        body: "TensorRT addresses three main performance bottlenecks: DRAM bandwidth saturation (via vertical kernel fusion), low hardware math utilization (via FP16/INT8 Tensor Core quantization), and GPU stream idle time (via horizontal kernel coalescing and CUDA stream optimization).",
      },
      {
        heading: "Step-by-Step Intuition",
        body: "The compiler pass first scans the network graph vertically to fuse activation and bias addition into preceding matrix multiplication or convolution layers. Next, it applies precision quantization scale factors based on target hardware capabilities (FP16 or INT8). Finally, it scans horizontally to merge independent parallel operations into grouped kernels.",
      },
      {
        heading: "Trade-offs & Systems Impact",
        body: "INT8 quantization requires careful entropy calibration ($D_{\\text{KL}}(P \\parallel Q) = \\sum_{i} P(i) \\log \\frac{P(i)}{Q(i)}$) using representative calibration datasets to prevent loss of model accuracy. Engine building is compute-intensive and host CPU memory-intensive, so plan compilation is performed offline ahead of time.",
      },
      {
        heading: "Complexity & Scalability",
        body: "The graph optimization passes run in linear $\\mathcal{O}(L)$ time relative to layer count $L$. Memory overhead is $\\mathcal{O}(L)$ to maintain the optimized engine structure.",
      },
    ],
    keyTerms: [
      {
        term: "Vertical CBR Fusion",
        definition:
          "Merging Convolution, Bias Addition, and ReLU into a single CUDA kernel launch.",
      },
      {
        term: "Horizontal Coalescing",
        definition:
          "Combining independent parallel layers with identical op types into a single wide GPU kernel.",
      },
      {
        term: "Entropy Calibration",
        definition:
          "Process of determining optimal INT8 dynamic range scale factors by minimizing FP32 vs INT8 activation distribution divergence: $D_{\\text{KL}}(P \\parallel Q)$.",
      },
      {
        term: "CUDA Kernel Tactic",
        definition:
          "Target-hardware-specific low-level CUDA kernel implementation variant selected during TensorRT engine compilation.",
      },
    ],
  },
  trivia: TENSORRT_ENGINE_OPTIMIZER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT,
  generateSteps: generateTensorrtEngineOptimizerSteps,
};
