import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
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
  ],
  targetPrecision: "FP16",
  enableHorizontalFusion: true,
};

export const generateTensorrtEngineOptimizerSteps = (
  input: TensorrtEngineOptimizerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { layers, targetPrecision, enableHorizontalFusion } = input;
  const origLatency = layers.reduce((sum, l) => sum + l.latencyMs, 0);

  const elements: ArrayElement[] = layers.map((layer, idx) => ({
    id: `layer-${idx}`,
    value: layer.type,
    state: "default",
    pointers: [`${layer.name} (${layer.precision}, ${layer.latencyMs}ms)`],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize TensorRT Engine Optimization Pipeline",
      why: `Target precision: ${targetPrecision}, Horizontal fusion: ${enableHorizontalFusion}. Original unoptimized total latency: ${origLatency.toFixed(2)}ms across ${layers.length} layers.`,
    },
    primarySnapshot: {
      kind: "array",
      elements,
    },
    auxiliaryState: {
      customState: {
        targetPrecision,
        enableHorizontalFusion: String(enableHorizontalFusion),
        origLatencyMs: origLatency.toFixed(2),
      },
    },
    variables: { totalLayers: layers.length, targetPrecision },
  });

  const pass1Layers: TensorrtLayer[] = [];
  let i = 0;
  const n = layers.length;

  while (i < n) {
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

      const stepElements: ArrayElement[] = layers.map((l, idx) => {
        let state: ElementState = "default";
        if (idx >= i && idx <= i + 2) state = "active";
        else if (idx < i) state = "visited";
        return {
          id: `layer-${idx}`,
          value: l.type,
          state,
          pointers: [l.name],
        };
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 20,
        explanation: {
          what: `Vertical Fusion: Conv + BiasAdd + ReLU -> CBR Fused Kernel at indices ${i}..${i + 2}`,
          why: `Fused CBR layers and cast precision to ${targetPrecision}. Latency reduced from ${(layers[i].latencyMs + layers[i + 1].latencyMs + layers[i + 2].latencyMs).toFixed(2)}ms to ${fusedLayer.latencyMs}ms.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: stepElements,
        },
        auxiliaryState: {
          customState: {
            fusedLayer: fusedLayer.name,
            newLatencyMs: String(fusedLayer.latencyMs),
          },
        },
        variables: { pass: "vertical_fusion", fusedIndex: i },
      });

      pass1Layers.push(fusedLayer);
      i += 3;
      continue;
    }

    const scale = targetPrecision === "FP16" ? 0.5 : targetPrecision === "INT8" ? 0.25 : 1.0;
    const scaledLayer: TensorrtLayer = {
      ...layers[i],
      precision: targetPrecision,
      latencyMs: Number((layers[i].latencyMs * scale).toFixed(3)),
    };
    pass1Layers.push(scaledLayer);
    i++;
  }

  let finalLayers = pass1Layers;

  if (enableHorizontalFusion && pass1Layers.length >= 2) {
    const hFused: TensorrtLayer[] = [];
    let j = 0;
    while (j < pass1Layers.length) {
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

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 43,
          explanation: {
            what: `Horizontal Fusion: Coalesced parallel Conv layers '${pass1Layers[j].name}' and '${pass1Layers[j + 1].name}'`,
            why: `Merged parallel convolutions into grouped single-kernel launch, improving GPU SM occupancy.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: pass1Layers.map((l, idx) => ({
              id: `pass1-${idx}`,
              value: l.type,
              state: idx === j || idx === j + 1 ? "active" : "visited",
              pointers: [l.name],
            })),
          },
          auxiliaryState: {
            customState: {
              horizontalFused: mergedLayer.name,
              mergedLatencyMs: String(mergedLayer.latencyMs),
            },
          },
          variables: { pass: "horizontal_fusion", hIndex: j },
        });

        hFused.push(mergedLayer);
        j += 2;
      } else {
        hFused.push(pass1Layers[j]);
        j++;
      }
    }
    finalLayers = hFused;
  }

  const finalLatency = finalLayers.reduce((sum, l) => sum + l.latencyMs, 0);
  const speedup = Number((origLatency / (finalLatency || 1)).toFixed(2));

  const finalElements: ArrayElement[] = finalLayers.map((layer, idx) => ({
    id: `opt-${idx}`,
    value: layer.type,
    state: "sorted",
    pointers: [`${layer.name} (${layer.precision}, ${layer.latencyMs}ms)`],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 57,
    explanation: {
      what: "TensorRT Engine Compilation & Tactic Tuning Complete",
      why: `Optimized engine latency from ${origLatency.toFixed(2)}ms down to ${finalLatency.toFixed(2)}ms (${speedup}x speedup). Engine ready for CUDA execution.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        originalLatencyMs: origLatency.toFixed(2),
        optimizedLatencyMs: finalLatency.toFixed(2),
        speedup: `${speedup}x`,
      },
    },
    variables: { complete: true, finalLatency, speedup },
  });

  return steps;
};

const TENSORRT_ENGINE_OPTIMIZER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  hints: [
    { line: 20, hint: "Match vertical Conv + BiasAdd + ReLU layers for CBR fusion." },
    { line: 43, hint: "Coalesce parallel identical convolution ops into a single grouped kernel." },
    { line: 57, hint: "Calculate overall engine latency reduction and execution speedup factor." },
  ],
  distractors: [
    "fused_latency = layers[i]['latencyMs'] * 3.0",
    "layer['precision'] = 'FP64'",
    "optimized_layers = layers[::-1]",
  ],
  lineExplanations: {
    1: "Defines entry point for TensorRT Engine Optimization pipeline.",
    20: "Executes vertical CBR (Conv + Bias + ReLU) layer fusion and precision casting.",
    43: "Executes horizontal layer fusion for parallel convolution streams.",
    57: "Computes total optimized latency and returns final TensorRT engine plan.",
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
    "NVIDIA TensorRT is a high-performance deep learning inference optimizer and runtime framework. It transforms trained neural network models into highly optimized executable engines using vertical layer fusion (Conv+Bias+ReLU), horizontal layer coalescing (merging parallel convolutions), precision calibration (FP32 $\\to$ FP16 / INT8 Tensor Cores), and target-GPU kernel tactic auto-tuning.\n\nInput Format:\n- layers: List of network layer metadata objects containing `id`, `name`, `type`, `precision`, and baseline `latencyMs`.\n- targetPrecision: Target precision string (`'FP16'` or `'INT8'`).\n- enableHorizontalFusion: Boolean flag enabling horizontal parallel layer merging.\n\nOutput Format:\n- Returns dictionary containing `optimizedLayers`, `originalLatencyMs`, `optimizedLatencyMs`, and total calculated `speedup` factor.\n\nEdge Cases & Constraints:\n- Plugin custom layers: User-defined TensorRT plugins bypass standard graph rewrites and require custom tactic profiling.\n- Dynamic shape profiles: Optimization tactics must accommodate min/opt/max input dimensions specified in TensorRT optimization profiles.\n- Accuracy loss in INT8: Low-precision INT8 calibration requires KL-divergence histogram analysis to prevent severe quantization degradation.",
  constraints: [
    "1 <= layers.length <= 100",
    "targetPrecision in ['FP16', 'INT8']",
    "layers[i].latencyMs > 0",
  ],
  examples: [
    {
      kind: "basic",
      title: "CBR Fusion + FP16 Quantization",
      inputDisplay: "layers=[Conv, BiasAdd, ReLU, Conv, Conv], targetPrecision='FP16'",
      outputDisplay: "Optimized layers: [fused_cbr, h_fused_conv], Speedup: ~3.8x",
      input: DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT,
      output: "fused_cbr, h_fused_conv (3.8x speedup)",
      explanation:
        "Fuses vertical Conv+BiasAdd+ReLU into CBR kernel, applies FP16 Tensor Core scaling, and horizontally merges parallel convolutions.",
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
    time: "O(L) single-pass pass evaluation across L graph layers.",
    space: "O(L) memory for optimized layer configuration plan.",
  },
  topicGuide: {
    overview:
      "NVIDIA TensorRT is the industry-standard inference optimization compiler for NVIDIA GPUs. It ingests trained models from ONNX, PyTorch, or TensorFlow, restructures the execution graph, selects optimal low-level CUDA tactics, and generates an optimized plan file executable on NVIDIA Tensor Cores.",
    sections: [
      {
        heading: "Core Concepts & Vertical/Horizontal Layer Fusion",
        body: "TensorRT performs graph transformations across two axes. Vertical fusion combines sequence patterns like $\\text{Conv} + \\text{BiasAdd} + \\text{ReLU}$ (CBR) or $\\text{MatMul} + \\text{GELU}$ into single fused CUDA kernels. Horizontal fusion identifies parallel layers operating on the same input (such as $Q, K, V$ projections in Transformer Attention) and coalesces them into a single grouped matrix operation.",
      },
      {
        heading: "Systems & Precision Quantization Tactics",
        body: "TensorRT supports FP32, FP16, BF16, and INT8/INT4 precision formats. For INT8 execution, TensorRT runs entropy calibration using representative dataset samples, computing KL-divergence between FP32 activation histograms and INT8 quantized values to compute optimal per-tensor scaling factors $S = \\frac{127}{\\max(|X|)}$.",
      },
      {
        heading: "Implementation Nuances & CUDA Kernel Tactic Profiling",
        body: "During engine compilation (`builder.build_engine`), TensorRT benchmarks multiple candidate CUDA kernel implementations (tactics)—varying block tile sizes, swizzling patterns, and shared memory allocations—on the target hardware, selecting the fastest tactic for each fused layer.",
      },
      {
        heading: "Edge Cases & Production Engine Deployment",
        body: "Dynamic shapes in LLM workloads require configuring Optimization Profiles specifying minimum, optimal, and maximum tensor dimensions. Custom C++ or CUDA plugins can be registered (`IPluginV2DynamicExt`) to execute non-standard operators within TensorRT engine streams.",
      },
    ],
    keyTerms: [
      {
        term: "Vertical CBR Fusion",
        definition:
          "Combining Convolution, Bias Addition, and Activation into a single CUDA kernel to eliminate DRAM writeback.",
      },
      {
        term: "Horizontal Layer Coalescing",
        definition:
          "Merging independent parallel layers with identical operations into a single wide GPU kernel launch.",
      },
      {
        term: "Entropy Calibration (KL-Divergence)",
        definition:
          "Process determining optimal FP32-to-INT8 quantizer scaling factors by minimizing information loss.",
      },
      {
        term: "TensorRT Engine Tactic",
        definition:
          "Target-specific CUDA kernel implementation variant benchmarked during compilation for maximum throughput.",
      },
    ],
  },
  trivia: TENSORRT_ENGINE_OPTIMIZER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT,
  generateSteps: generateTensorrtEngineOptimizerSteps,
};
