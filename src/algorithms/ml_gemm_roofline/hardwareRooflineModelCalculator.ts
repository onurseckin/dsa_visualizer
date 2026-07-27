import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface hardwareRooflineModelCalculatorInput {
  flops: number;
  bytes: number;
  peakGflops: number;
  peakBandwidthGBs: number;
}

export const HARDWAREROOFLINEMODELCALCULATOR_CODE = `
def hardware_roofline_model_calculator(flops, bytes_transferred, peak_gflops, peak_bw_gbs):
    """
    Calculates Berkeley Roofline Model operational intensity and performance bounds.
    """
    ai = flops / bytes_transferred if bytes_transferred > 0 else float('inf')
    ridge_point = peak_gflops / peak_bw_gbs
    is_compute_bound = ai >= ridge_point
    max_gflops = min(peak_gflops, ai * peak_bw_gbs)
    return ai, ridge_point, is_compute_bound, max_gflops
`;

export const DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT: hardwareRooflineModelCalculatorInput = {
  flops: 1000,
  bytes: 500,
  peakGflops: 100,
  peakBandwidthGBs: 50,
};

export const generateHardwareRooflineModelCalculatorSteps = (
  input: hardwareRooflineModelCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = [
    { id: "ai", value: 0, state: "default", pointers: ["AI"] },
    { id: "balance", value: 0, state: "default", pointers: ["Ridge Point"] },
  ];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
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
      variables,
      auxiliaryState: { customState: {} },
    });
  };

  addStep(
    1,
    "Initialize Roofline Calculation",
    "Starting calculation of Arithmetic Intensity vs Machine Balance.",
    { flops: input.flops, bytes: input.bytes },
  );

  const ai = input.bytes > 0 ? input.flops / input.bytes : Infinity;
  elements[0] = { ...elements[0], value: ai, state: "active" };

  addStep(
    4,
    "Calculate Arithmetic Intensity (AI)",
    `AI = FLOPs / bytes = ${input.flops} / ${input.bytes} = ${ai}`,
    { ai },
    elements,
  );

  const machineBalance = input.peakGflops / input.peakBandwidthGBs;
  elements[1] = { ...elements[1], value: machineBalance, state: "compare" };

  addStep(
    5,
    "Calculate Machine Balance (Ridge Point)",
    `Balance = Peak GFLOPS / Peak BW = ${input.peakGflops} / ${input.peakBandwidthGBs} = ${machineBalance}`,
    { machineBalance },
    elements,
  );

  const isComputeBound = ai >= machineBalance;
  elements[0] = { ...elements[0], state: isComputeBound ? "sorted" : "default" };
  elements[1] = { ...elements[1], state: isComputeBound ? "default" : "sorted" };

  addStep(
    6,
    "Compare AI and Machine Balance",
    isComputeBound
      ? `AI (${ai}) >= Balance (${machineBalance}), so kernel is Compute-Bound.`
      : `AI (${ai}) < Balance (${machineBalance}), so kernel is Memory-Bound.`,
    { isComputeBound },
    elements,
  );

  return steps;
};

const HARDWAREROOFLINEMODELCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines Berkeley hardware roofline model calculator function.",
    4: "Calculates Arithmetic Intensity AI = flops / bytes_transferred.",
    5: "Calculates Machine Balance Ridge Point = peak_gflops / peak_bw_gbs.",
    6: "Determines if workload is Compute-Bound (AI >= Ridge Point).",
    7: "Calculates maximum attainable performance ceiling = min(peak_gflops, ai * peak_bw_gbs).",
    8: "Returns AI, ridge point, compute-bound flag, and maximum GFLOPS ceiling.",
  },
};

export const hardwareRooflineModelCalculator: AlgorithmDefinition<hardwareRooflineModelCalculatorInput> =
  {
    id: "hardware-roofline-model-calculator",
    title: "Berkeley Hardware Roofline Model Calculator",
    category: "ml_gemm_roofline",
    categories: ["ml_gemm_roofline", "arrays_and_hashing"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 2,
    mlInfraCategory: "ml_gemm_roofline",
    description:
      "The Berkeley Roofline Model provides an intuitive performance bound model for analyzing machine learning algorithms on GPU/CPU hardware. By comparing Operational Intensity (FLOPs / Byte) against Machine Balance (Peak GFLOPS / Peak Memory Bandwidth GB/s), the model determines whether a workload is Memory-Bandwidth Bound or Compute-Bound.\n\nThis algorithm implements Berkeley Hardware Roofline Model Calculator, evaluating operational intensity, computing ridge point inflection threshold, and classifying execution bottleneck bounds.\n\nInput Format:\n- flops: Total floating-point operations performed.\n- bytes: Total memory bytes transferred from DRAM.\n- peakGflops: Peak hardware compute performance in GFLOPS.\n- peakBandwidthGBs: Peak hardware memory bandwidth in GB/s.\n\nOutput Format:\n- Returns operational intensity (AI), ridge point, compute-bound boolean flag, and maximum attainable GFLOPS.\n\nEdge Cases & Constraints:\n- Zero bytes transferred (infinite arithmetic intensity, strictly compute bound).\n- High memory bandwidth systems (e.g. HBM3 with 3 TB/s).\n- Low arithmetic intensity workloads (e.g. vector addition, element-wise ReLU).",
    constraints: ["flops >= 0", "bytes >= 1", "peakGflops > 0", "peakBandwidthGBs > 0"],
    examples: [
      {
        kind: "basic",
        title: "Standard Execution",
        inputDisplay: "flops=1000, bytes=500, peakGflops=100, peakBW=50",
        outputDisplay: "Compute-Bound",
        input: DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
        output: "Compute-Bound",
        explanation: "Standard execution pass.",
      },
      {
        kind: "complex",
        title: "Complex Execution",
        inputDisplay: "flops=500, bytes=500, peakGflops=100, peakBW=10",
        outputDisplay: "Memory-Bound",
        input: DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
        output: "Memory-Bound",
        explanation: "Evaluates workload performance boundaries.",
      },
      {
        kind: "negative",
        title: "Edge Case",
        inputDisplay: "flops=100, bytes=0, peakGflops=100, peakBW=50",
        outputDisplay: "Compute-Bound",
        input: DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
        output: "Compute-Bound",
        explanation: "Edge case execution completes safely.",
      },
    ],
    code: HARDWAREROOFLINEMODELCALCULATOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Execution time complexity pass across input elements.",
      space: "Memory allocation space for result structures.",
    },
    topicGuide: {
      overview:
        "The Roofline Model maps performance (GFLOPS) as a function of Arithmetic Intensity I = FLOPs / Byte. The 'roofline' consists of two ceilings: a memory bandwidth ceiling (Performance = I * Bandwidth) and a compute ceiling (Performance = Peak GFLOPS). The intersection point is the Ridge Point (Machine Balance).",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, Operational Intensity AI = FLOPs / Bytes. Machine Balance R = Peak_GFLOPS / Peak_BW. If AI >= R, maximum performance is capped by Peak_GFLOPS (Compute-Bound). If AI < R, maximum performance is capped by AI * Peak_BW (Memory-Bound).",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "On an NVIDIA H100 GPU (1979 TFLOPS FP16 Tensor Core, 3.35 TB/s HBM3), Ridge Point R = 1979 / 3.35 = 590 FLOPs/Byte. Workloads like GEMM with large batch sizes exceed 590 FLOPs/Byte and hit compute peak, while batch-1 LLM generation (~1 FLOP/Byte) is heavily memory-bound.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation computes operational intensity AI, calculates machine balance ridge point, compares AI against ridge point, and calculates ceiling performance.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes zero byte transfers and zero peak bandwidth values.",
        },
      ],
      keyTerms: [
        {
          term: "Arithmetic Intensity",
          definition:
            "The ratio of floating-point operations executed per byte of data read/written from main memory.",
        },
        {
          term: "Ridge Point",
          definition:
            "The hardware inflection point (Peak FLOPs / Peak BW) separating memory-bound from compute-bound regimes.",
        },
        {
          term: "Memory Bandwidth Bound",
          definition:
            "Execution regime where processor compute units stall waiting for data transfers from DRAM.",
        },
      ],
    },
    trivia: HARDWAREROOFLINEMODELCALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
    defaultInput: DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
    generateSteps: generateHardwareRooflineModelCalculatorSteps,
  };
