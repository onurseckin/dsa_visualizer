import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface RooflineInput {
  flops: number;
  bytesTransferred: number;
  peakTflops: number;
  memoryBandwidthGbs: number;
}

export const ROOFLINE_CLASSIFIER_CODE = `def classify_roofline_kernel(flops: float, bytes_transferred: float, peak_tflops: float, memory_bandwidth_gbs: float) -> dict:
    if bytes_transferred <= 0:
        return {"intensity": 0.0, "bound": "Memory-Bound", "attainable_tflops": 0.0}
        
    intensity = flops / bytes_transferred  # FLOPs per byte
    knee_point = (peak_tflops * 1e12) / (memory_bandwidth_gbs * 1e9)
    
    memory_bound_limit_tflops = (intensity * memory_bandwidth_gbs * 1e9) / 1e12
    attainable_tflops = min(peak_tflops, memory_bound_limit_tflops)
    
    bound = "Compute-Bound" if intensity >= knee_point else "Memory-Bound"
    
    return {
        "operational_intensity": round(intensity, 2),
        "knee_point": round(knee_point, 2),
        "bound": bound,
        "attainable_tflops": round(attainable_tflops, 2),
        "attainable_pct": round((attainable_tflops / peak_tflops) * 100.0, 1)
    }`;

export const DEFAULT_ROOFLINE_INPUT: RooflineInput = {
  flops: 2000000000,
  bytesTransferred: 400000000,
  peakTflops: 312,
  memoryBandwidthGbs: 2000,
};

export const generateRooflineIntensityClassifierSteps = (input: RooflineInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { flops, bytesTransferred, peakTflops, memoryBandwidthGbs } = input;

  const elements: ArrayElement[] = [
    {
      id: "el-flops",
      value: Number((flops / 1e6).toFixed(0)),
      state: "default",
      pointers: ["MFLOPs"],
    },
    {
      id: "el-bytes",
      value: Number((bytesTransferred / 1e6).toFixed(0)),
      state: "default",
      pointers: ["MBytes"],
    },
    { id: "el-peak", value: peakTflops, state: "default", pointers: ["Peak TFLOPs"] },
    { id: "el-bw", value: memoryBandwidthGbs, state: "default", pointers: ["BW GB/s"] },
  ];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: customState || {
          flops: `${(flops / 1e9).toFixed(2)} GFLOPs`,
          bytes: `${(bytesTransferred / 1e6).toFixed(2)} MB`,
          gpuHardware: `${peakTflops} TFLOPs | ${memoryBandwidthGbs} GB/s`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Roofline Performance Classification",
    `Evaluating kernel (${(flops / 1e9).toFixed(2)} GFLOPs, ${(bytesTransferred / 1e6).toFixed(
      2,
    )} MB memory traffic) on hardware (${peakTflops} TFLOPS, ${memoryBandwidthGbs} GB/s bandwidth).`,
    { flops, bytesTransferred, peakTflops, memoryBandwidthGbs },
  );

  if (bytesTransferred <= 0) {
    addStep(
      3,
      "Zero Memory Bytes Transferred",
      "Kernel memory traffic is zero or invalid. Classifying as Memory-Bound with 0 attainable throughput.",
      { intensity: 0, bound: "Memory-Bound", attainable_tflops: 0 },
      elements.map((el) => ({ ...el, state: "compare" })),
      { bound: "Memory-Bound", attainable_tflops: 0 },
    );
    return steps;
  }

  const intensity = flops / bytesTransferred;
  const kneePoint = (peakTflops * 1e12) / (memoryBandwidthGbs * 1e9);

  addStep(
    5,
    `Compute Operational Intensity & Hardware Knee Point`,
    `Kernel intensity = ${intensity.toFixed(2)} FLOP/byte. Target GPU knee point I_knee = ${kneePoint.toFixed(
      2,
    )} FLOP/byte.`,
    { intensity: Number(intensity.toFixed(2)), kneePoint: Number(kneePoint.toFixed(2)) },
    elements.map((el) => ({ ...el, state: "active" })),
    { intensity: intensity.toFixed(2), kneePoint: kneePoint.toFixed(2) },
  );

  const memoryBoundLimitTflops = (intensity * memoryBandwidthGbs * 1e9) / 1e12;
  const attainableTflops = Math.min(peakTflops, memoryBoundLimitTflops);
  const isComputeBound = intensity >= kneePoint;
  const bound = isComputeBound ? "Compute-Bound" : "Memory-Bound";
  const attainablePct = (attainableTflops / peakTflops) * 100.0;

  addStep(
    11,
    `Classify Kernel Performance: ${bound}`,
    `Kernel intensity (${intensity.toFixed(2)}) is ${
      isComputeBound ? ">=" : "<"
    } knee point (${kneePoint.toFixed(2)}). Kernel is ${bound}.`,
    {
      intensity: Number(intensity.toFixed(2)),
      kneePoint: Number(kneePoint.toFixed(2)),
      bound,
      attainable_tflops: Number(attainableTflops.toFixed(2)),
      attainable_pct: Number(attainablePct.toFixed(1)),
    },
    elements.map((el, i) => ({
      ...el,
      state: isComputeBound ? "sorted" : "pivot",
      pointers: [i === 0 ? bound : el.pointers?.[0] || ""],
    })),
    {
      bound,
      attainableTflops: `${attainableTflops.toFixed(2)} TFLOPs`,
      attainablePct: `${attainablePct.toFixed(1)}%`,
    },
  );

  return steps;
};

const ROOFLINE_CLASSIFIER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "intensity = bytes_transferred / flops",
    "knee_point = memory_bandwidth_gbs / peak_tflops",
    "bound = 'Compute-Bound' if intensity < knee_point else 'Memory-Bound'",
    "attainable_tflops = peak_tflops + memory_bound_limit_tflops",
  ],
  hints: [
    {
      line: 5,
      hint: "Operational intensity equals total floating point operations divided by total memory bytes accessed.",
    },
    {
      line: 6,
      hint: "The Roofline knee point is the ratio of Peak Compute Throughput (FLOP/s) to Peak Memory Bandwidth (Bytes/s).",
    },
    {
      line: 11,
      hint: "Kernels below the knee point are memory bandwidth limited; kernels above achieve peak compute throughput.",
    },
  ],
  lineExplanations: {
    1: "Defines Roofline performance model classification routine.",
    5: "Computes operational intensity (FLOP/byte) for the ML workload.",
    6: "Derives hardware knee point boundary separating memory-bound and compute-bound regimes.",
    8: "Calculates maximum attainable performance capped by memory bandwidth bandwidth ceiling.",
    11: "Classifies kernel as Compute-Bound or Memory-Bound and computes percentage of peak TFLOPs.",
  },
};

export const rooflineIntensityClassifier: AlgorithmDefinition<RooflineInput> = {
  id: "roofline-intensity-classifier",
  title: "Roofline Performance Model & Operational Intensity Classifier",
  category: "ml_gemm_roofline",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  description:
    "Evaluates an ML kernel workload against the Roofline Model, computing operational intensity (FLOP/byte) and hardware knee point to determine if execution is Memory-Bound or Compute-Bound.",
  constraints: ["flops >= 0", "bytesTransferred >= 0", "peakTflops > 0", "memoryBandwidthGbs > 0"],
  examples: [
    {
      kind: "basic",
      title: "Memory-Bound Kernel (Low Intensity)",
      inputDisplay: "flops = 2e9, bytes = 400MB, peak = 312 TFLOPS, bw = 2000 GB/s",
      outputDisplay: "intensity = 5.0 FLOP/B, knee = 156.0 FLOP/B -> Memory-Bound",
      input: DEFAULT_ROOFLINE_INPUT,
      output:
        "{operational_intensity: 5.0, knee_point: 156.0, bound: 'Memory-Bound', attainable_tflops: 10.0}",
      explanation:
        "Intensity 5 FLOP/byte is far below the H100 knee point of 156 FLOP/byte. Attainable throughput is limited by 2000 GB/s bandwidth to 10 TFLOPs (3.2% of peak).",
    },
    {
      kind: "complex",
      title: "Compute-Bound Dense GEMM (High Intensity)",
      inputDisplay: "flops = 1e12, bytes = 2GB, peak = 312 TFLOPS, bw = 2000 GB/s",
      outputDisplay: "intensity = 500.0 FLOP/B, knee = 156.0 FLOP/B -> Compute-Bound",
      input: {
        flops: 1000000000000,
        bytesTransferred: 2000000000,
        peakTflops: 312,
        memoryBandwidthGbs: 2000,
      },
      output:
        "{operational_intensity: 500.0, knee_point: 156.0, bound: 'Compute-Bound', attainable_tflops: 312.0}",
      explanation:
        "Intensity 500 FLOP/byte exceeds the hardware knee point 156 FLOP/byte. Kernel saturates peak compute engine (312 TFLOPs).",
    },
    {
      kind: "negative",
      title: "Zero Bytes Transferred Edge Case",
      inputDisplay: "flops = 1e6, bytes = 0",
      outputDisplay: "intensity = 0.0, bound = 'Memory-Bound'",
      input: {
        flops: 1000000,
        bytesTransferred: 0,
        peakTflops: 312,
        memoryBandwidthGbs: 2000,
      },
      output: "{intensity: 0.0, bound: 'Memory-Bound', attainable_tflops: 0.0}",
      explanation: "Zero bytes transferred indicates an invalid or zero-memory-traffic workload.",
    },
  ],
  code: ROOFLINE_CLASSIFIER_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(1)",
    worst: "O(1)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Direct closed-form formula evaluations executed in O(1) time.",
    space: "Uses constant memory for scalar Roofline calculations.",
  },
  topicGuide: {
    overview:
      "The Roofline Model (Williams et al.) visually relates hardware peak compute capacity, memory bandwidth, and operational intensity. It provides ML system engineers with immediate diagnosis of whether an operation (GEMM, LayerNorm, Softmax, FlashAttention) is bottlenecked by HBM memory bandwidth or Tensor Core compute execution.",
    sections: [
      {
        heading: "Operational Intensity Formula",
        body: "Intensity I = Total FLOPs / Total Memory Bytes Read and Written. High intensity operations (dense GEMM, Conv2d) reuse loaded data heavily; low intensity ops (elementwise Add, ReLU, LayerNorm) load data for only 1 FLOP per element.",
      },
      {
        heading: "Hardware Knee Point",
        body: "The inflection point I_knee = Peak FLOPS / Memory Bandwidth dictates the threshold above which memory bandwidth is no longer the bottleneck.",
      },
    ],
    keyTerms: [
      {
        term: "Roofline Model",
        definition:
          "A visual performance model that bounds kernel speed based on peak compute ceiling and memory bandwidth slope.",
      },
      {
        term: "Knee Point",
        definition:
          "The operational intensity threshold where performance transitions from memory-bound to compute-bound.",
      },
    ],
  },
  trivia: ROOFLINE_CLASSIFIER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra" }],
  defaultInput: DEFAULT_ROOFLINE_INPUT,
  generateSteps: generateRooflineIntensityClassifierSteps,
};
