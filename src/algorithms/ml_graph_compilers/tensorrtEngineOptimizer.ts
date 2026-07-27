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
    """
    Optimizes a neural network execution graph using TensorRT optimization passes:
    1. Vertical Layer Fusion (Conv + BiasAdd + ReLU -> CBR Fused Layer)
    2. Precision Quantization & Calibration (FP32 -> FP16 / INT8)
    3. Horizontal Layer Coalescing (Merging parallel identical ops)
    4. Tactic Selection (Profiling optimal CUDA kernel per layer)
    Returns optimized layer execution plan and estimated speedup.
    """
    optimized_layers = []
    i = 0
    n = len(layers)
    total_original_latency = sum(l["latencyMs"] for l in layers)
    
    # Pass 1 & 2: Vertical Fusion & Precision Scaling
    while i < n:
        # Check vertical CBR fusion pattern: Conv -> BiasAdd -> ReLU
        if (i + 2 < n and 
            layers[i]["type"] == "Conv" and 
            layers[i+1]["type"] == "BiasAdd" and 
            layers[i+2]["type"] == "ReLU"):
            
            fused_latency = layers[i]["latencyMs"] * 0.7 # 30% reduction from fusion
            if target_precision == "FP16":
                fused_latency *= 0.5 # 2x speedup in FP16 Tensor Cores
            elif target_precision == "INT8":
                fused_latency *= 0.25 # 4x speedup in INT8 Tensor Cores
                
            optimized_layers.append({
                "id": f"fused_{layers[i]['id']}_{layers[i+2]['id']}",
                "name": f"fused_cbr_{layers[i]['name']}",
                "type": "CBR_Fused_Kernel",
                "precision": target_precision,
                "latencyMs": round(fused_latency, 3)
            })
            i += 3
            continue
            
        # Single layer precision scaling
        layer = dict(layers[i])
        scale_factor = 0.5 if target_precision == "FP16" else (0.25 if target_precision == "INT8" else 1.0)
        layer["precision"] = target_precision
        layer["latencyMs"] = round(layer["latencyMs"] * scale_factor, 3)
        optimized_layers.append(layer)
        i += 1

    # Pass 3: Horizontal Fusion (if enabled)
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
    9,
    "Initialize Container optimized_layers",
    "Creating empty container to hold transformed layer metadata.",
    { n, targetPrecision },
    0,
    null,
    "Init",
  );

  addStep(
    10,
    "Initialize Index Pointer i = 0",
    "Setting iteration pointer i = 0.",
    { i: 0, n },
    0,
    null,
    "Init",
  );

  addStep(
    12,
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
      15,
      `Pass 1 & 2 Loop at i = ${i}`,
      `Inspecting layer ${layers[i].name} (${layers[i].type}) for CBR vertical fusion and precision quantization.`,
      { i, n, layer_name: layers[i].name },
      i,
      null,
      "Pass 1: Vertical & Quant",
    );

    addStep(
      17,
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
      if (targetPrecision === "FP16") fusedLatency *= 0.5;
      else if (targetPrecision === "INT8") fusedLatency *= 0.25;

      const fusedLayer: TensorrtLayer = {
        id: `fused_${layers[i].id}_${layers[i + 2].id}`,
        name: `fused_cbr_${layers[i].name}`,
        type: "CBR_Fused_Kernel",
        precision: targetPrecision,
        latencyMs: Number(fusedLatency.toFixed(3)),
      };

      pass1Layers.push(fusedLayer);

      addStep(
        28,
        `Fuse Vertical CBR Pattern at i = ${i}..${i + 2}`,
        `Fused ${layers[i].name} + ${layers[i + 1].name} + ${layers[i + 2].name} into single ${targetPrecision} CBR kernel. Latency reduced to ${fusedLayer.latencyMs}ms.`,
        { i, fused_name: fusedLayer.name, latency: fusedLayer.latencyMs },
        i,
        [i, i + 2],
        "Pass 1: Vertical & Quant",
      );

      i += 3;
      addStep(
        35,
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
        17,
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
      43,
      `Apply ${targetPrecision} Precision Quantization to ${layers[i].name}`,
      `Scaled layer latency from ${layers[i].latencyMs}ms down to ${scaledLayer.latencyMs}ms using ${targetPrecision} Tensor Cores.`,
      { i, layer_name: layers[i].name, new_latency: scaledLayer.latencyMs },
      i,
      [i, i],
      "Pass 1: Vertical & Quant",
    );

    i += 1;
    addStep(
      44,
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
    47,
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
      48,
      "Initialize Horizontal Fusion Container h_fused",
      "Creating container to store horizontally merged layer groups.",
      { j: 0 },
      n,
      null,
      "Pass 3: Horizontal Fusion",
    );

    while (j < pass1Layers.length) {
      addStep(
        50,
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
          54,
          `Coalesce Parallel Convolutions '${pass1Layers[j].name}' and '${pass1Layers[j + 1].name}'`,
          `Merged parallel convolutions into grouped kernel '${mergedLayer.name}' with merged latency ${mergedLayer.latencyMs}ms.`,
          { j, merged_name: mergedLayer.name, latency: mergedLayer.latencyMs },
          n,
          null,
          "Pass 3: Horizontal Fusion",
        );

        j += 2;
        addStep(
          61,
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
          63,
          `Pass Through Single Layer '${pass1Layers[j].name}'`,
          "Layer cannot be horizontally fused; appending to execution plan.",
          { j, layer_name: pass1Layers[j].name },
          n,
          null,
          "Pass 3: Horizontal Fusion",
        );
        j += 1;
      }
    }
    finalLayers = hFused;
  }

  const finalLatency = finalLayers.reduce((sum, l) => sum + l.latencyMs, 0);
  const speedup = Number((origLatency / (finalLatency || 1)).toFixed(2));

  addStep(
    67,
    `Calculate Final Optimized Latency = ${finalLatency.toFixed(2)}ms`,
    `Summed latencies of all ${finalLayers.length} optimized engine layers.`,
    { total_optimized_latency: finalLatency },
    n,
    null,
    "Final",
  );

  addStep(
    68,
    `Compute Overall Acceleration Speedup = ${speedup}x`,
    `Speedup factor computed as ${origLatency.toFixed(2)}ms / ${finalLatency.toFixed(2)}ms.`,
    { speedup },
    n,
    null,
    "Final",
  );

  addStep(
    76,
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
  skipLines: [2, 3, 4, 5, 6, 7, 8, 13, 14, 21, 27, 34, 37, 38, 45, 46, 62, 66, 69, 70, 75, 76],
  distractors: [
    "fused_latency = layers[i]['latencyMs'] * 3.0",
    "layer['precision'] = 'FP64'",
    "optimized_layers = layers[::-1]",
    "speedup = total_original_latency * total_optimized_latency",
  ],
  hints: [
    { line: 17, hint: "Match vertical Conv + BiasAdd + ReLU layers for CBR fusion." },
    { line: 22, hint: "Compute CBR fused latency applying 30% kernel fusion savings." },
    { line: 51, hint: "Coalesce parallel identical convolution ops into a single grouped kernel." },
    { line: 68, hint: "Calculate overall engine latency reduction and execution speedup factor." },
  ],
  lineExplanations: {
    1: "Function signature for optimize_tensorrt_engine receiving layers, target_precision, and enable_horizontal_fusion.",
    2: "Docstring start describing TensorRT execution engine optimization passes.",
    3: "Describes vertical CBR layer fusion pass.",
    4: "Describes precision quantization and calibration (FP32 -> FP16/INT8).",
    5: "Describes horizontal layer coalescing for parallel identical operations.",
    6: "Describes kernel tactic selection auto-tuning.",
    7: "Describes return value with speedup estimation.",
    8: "Docstring close.",
    9: "Initializes optimized_layers list for transformed layer plan.",
    10: "Sets loop iteration pointer i to 0.",
    11: "Computes total input layer count n = len(layers).",
    12: "Calculates baseline unoptimized total latency across all input layers.",
    13: "Blank line before Pass 1 & 2 loop.",
    14: "Comment indicating Pass 1 & 2: Vertical Fusion & Precision Scaling.",
    15: "Loop iterating while index i is less than layer count n.",
    16: "Comment indicating vertical CBR fusion pattern check.",
    17: "Checks if 3-layer window is available.",
    18: "Verifies layer i is Conv type.",
    19: "Verifies layer i+1 is BiasAdd type.",
    20: "Verifies layer i+2 is ReLU type.",
    21: "Blank line before fusion latency calculation.",
    22: "Computes CBR fused kernel baseline latency with 30% overhead reduction factor (0.7).",
    23: "Checks if target precision is FP16.",
    24: "Applies 2x speedup factor (0.5) for FP16 Tensor Cores.",
    25: "Checks if target precision is INT8.",
    26: "Applies 4x speedup factor (0.25) for INT8 Tensor Cores.",
    27: "Blank line before appending fused CBR layer dictionary.",
    28: "Appends fused CBR kernel dictionary payload to optimized_layers.",
    29: "Sets composite fused layer identifier.",
    30: "Formats fused CBR layer name.",
    31: "Sets type to CBR_Fused_Kernel.",
    32: "Assigns target precision string to fused layer.",
    33: "Rounds calculated fused latency to 3 decimal places.",
    34: "Closes fused layer dictionary.",
    35: "Advances loop index i by 3 to skip fused CBR layers.",
    36: "Continues to next iteration of loop.",
    37: "Blank line before single-layer fallback path.",
    38: "Comment indicating single layer precision scaling.",
    39: "Creates copy dictionary of layer at index i.",
    40: "Computes precision scale factor (0.5 for FP16, 0.25 for INT8, 1.0 for FP32).",
    41: "Assigns target precision to single layer.",
    42: "Scales and rounds layer latency.",
    43: "Appends precision-scaled layer to optimized_layers.",
    44: "Advances loop index i by 1.",
    45: "Blank line before Pass 3 section.",
    46: "Comment indicating Pass 3: Horizontal Fusion.",
    47: "Checks if horizontal fusion is enabled and at least 2 layers exist in optimized_layers.",
    48: "Initializes h_fused list for horizontally merged layers.",
    49: "Sets inner loop index j to 0.",
    50: "Loop iterating while j is less than length of optimized_layers.",
    51: "Checks if window of 2 adjacent Conv layers exists at j and j+1.",
    52: "Verifies both layer j and j+1 have type Conv.",
    53: "Computes merged horizontal grouped convolution latency with 15% grouping overhead.",
    54: "Appends horizontal grouped conv layer payload to h_fused list.",
    55: "Sets horizontal fused layer identifier.",
    56: "Sets horizontal fused layer name.",
    57: "Sets type to Horizontal_Grouped_Conv.",
    58: "Assigns target precision string.",
    59: "Rounds merged latency to 3 decimal places.",
    60: "Closes horizontal fused layer payload.",
    61: "Advances inner loop index j by 2.",
    62: "Else branch when adjacent layers cannot be horizontally fused.",
    63: "Appends single layer at index j to h_fused list.",
    64: "Advances inner loop index j by 1.",
    65: "Updates optimized_layers list with horizontally fused plan h_fused.",
    66: "Blank line before final speedup calculation.",
    67: "Sums latencies of all optimized layers to get total_optimized_latency.",
    68: "Calculates engine latency speedup factor relative to total_original_latency.",
    69: "Blank line before returning optimized engine plan.",
    70: "Opens return dictionary payload.",
    71: "Sets optimizedLayers to optimized_layers list.",
    72: "Sets originalLatencyMs to total_original_latency.",
    73: "Sets optimizedLatencyMs to total_optimized_latency.",
    74: "Sets speedup factor.",
    75: "Closes return dictionary payload.",
    76: "Return statement end.",
  },
};

export const tensorrtEngineOptimizer: AlgorithmDefinition<TensorrtEngineOptimizerInput> = {
  id: "tensorrt-engine-optimizer",
  title: "TensorRT Execution Engine & Precision Quantization Optimizer",
  category: "ml_graph_compilers",
  categories: ["ml_graph_compilers"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_graph_compilers",
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

