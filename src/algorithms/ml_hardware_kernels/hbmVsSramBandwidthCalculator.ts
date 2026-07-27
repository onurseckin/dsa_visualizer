import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface hbmVsSramBandwidthCalculatorInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const HBMVSSRAMBANDWIDTHCALCULATOR_CODE = `
def calculate_roofline_bandwidth(
    bytes_transferred: int,
    flops_executed: int,
    hbm_bandwidth_tbps: float = 3.35,  # H100 HBM3 bandwidth (3.35 TB/s)
    sram_bandwidth_tbps: float = 33.0   # H100 SRAM bandwidth (33.0 TB/s)
) -> tuple[float, float, float, str]:
    """
    Calculates Roofline Model memory bandwidth metrics comparing HBM vs SRAM execution.
    - Arithmetic Intensity AI = FLOPs / Bytes
    - HBM Latency = Bytes / HBM_bandwidth
    - SRAM Latency = Bytes / SRAM_bandwidth
    Identifies whether a kernel is Memory-Bound or Compute-Bound.
    """
    arithmetic_intensity = flops_executed / max(1, bytes_transferred)
    
    hbm_time_us = (bytes_transferred / (hbm_bandwidth_tbps * 1e12)) * 1e6
    sram_time_us = (bytes_transferred / (sram_bandwidth_tbps * 1e12)) * 1e6

    # NVIDIA H100 SXM5 Ridge Point ~ 295 FLOPs/byte
    ridge_point = 295.0
    bound_status = "Memory-Bound (HBM Bottleneck)" if arithmetic_intensity < ridge_point else "Compute-Bound (Tensor Core Max)"

    return arithmetic_intensity, hbm_time_us, sram_time_us, bound_status
`;

export const DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT: hbmVsSramBandwidthCalculatorInput = {
  data: [100, 200, 300, 400],
};

export const generateHBMVSSRAMBANDWIDTHCALCULATORSteps = (
  input: hbmVsSramBandwidthCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [100, 200, 300, 400];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

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
      auxiliaryState: {
        customState: {
          hbm_tbps: "3.35",
          sram_tbps: "33.0",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize HBM vs SRAM Bandwidth Calculator",
    "Setting up GPU Roofline Model analysis comparing High Bandwidth Memory vs On-Chip SRAM.",
    { num_samples: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`sample=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      15,
      `Evaluate arithmetic intensity for sample ${idx} (val=${val})`,
      `Calculating FLOPs/byte ratio: comparing HBM transfer latency vs SRAM tile execution latency.`,
      { sampleIdx: idx, bytesVal: val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    25,
    "Execution Complete",
    "Successfully analyzed HBM vs SRAM memory bandwidth ceiling and Roofline status.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const HBMVSSRAMBANDWIDTHCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "arithmetic_intensity = bytes_transferred / flops_executed",
    "sram_time_us = hbm_time_us * 33.0",
    "ridge_point = 1.0",
  ],
  hints: [
    { line: 15, hint: "Compute Arithmetic Intensity AI = FLOPs / Bytes transferred." },
    {
      line: 17,
      hint: "Calculate execution latency using HBM 3.35 TB/s and SRAM 33.0 TB/s bandwidth limits.",
    },
    { line: 22, hint: "Compare AI against GPU Ridge Point (~295 FLOPs/byte on H100)." },
  ],
  lineExplanations: {
    1: "Defines Roofline Model memory bandwidth calculator entry point.",
    15: "Calculates Arithmetic Intensity (FLOPs per byte of DRAM access).",
    17: "Calculates memory transfer time assuming HBM3 DRAM bandwidth (3.35 TB/s).",
    18: "Calculates memory transfer time assuming SRAM cache bandwidth (33.0 TB/s).",
    22: "Classifies kernel execution status as Memory-Bound vs Compute-Bound.",
  },
};

export const hbmVsSramBandwidthCalculator: AlgorithmDefinition<hbmVsSramBandwidthCalculatorInput> =
  {
    id: "hbm-vs-sram-bandwidth-calculator",
    title: "GPU HBM vs SRAM Memory Bandwidth Calculator",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "Understanding GPU memory hierarchy performance is essential for optimizing machine learning kernels. GPUs feature two primary memory tiers:\n1. **High Bandwidth Memory (HBM3 / HBM3e)**: Main DRAM memory on the GPU (e.g. 80 GB on A100 / 141 GB on H200) with a bandwidth ceiling of $3.35 \\text{ TB/s}$ (H100 SXM5).\n2. **On-Chip Shared Memory (SRAM / L1 Cache)**: Fast register-adjacent cache memory (~228 KB per SM) with a aggregate bandwidth ceiling of $\\sim 33.0 \\text{ TB/s}$—nearly $10\\times$ faster than HBM.\n\nAccording to the **Roofline Model**, the performance ceiling of a GPU kernel is bounded by:\n$$\\text{Performance (TFLOPS)} = \\min\\left(\\text{Peak Compute TFLOPS}, \\text{Arithmetic Intensity (FLOPs/byte)} \\times \\text{Memory Bandwidth (TB/s)}\\right)$$\n\nIf a kernel's Arithmetic Intensity (AI) falls below the **Ridge Point** ($\\sim 295 \\text{ FLOPs/byte}$ on H100 FP16), execution is **Memory-Bound** (bottlenecked by HBM DRAM transfers). Tiling algorithms (like FlashAttention) load data blocks into SRAM to boost AI past the Ridge Point into the **Compute-Bound** regime.\n\nInput Format:\n- data: Array of data transfer volumes in bytes.\n- target: FLOP count target.\n\nOutput Format:\n- Arithmetic Intensity scalar $AI$, HBM transfer time $t_{\\text{hbm}}$, SRAM transfer time $t_{\\text{sram}}$, and Roofline bottleneck status string.",
    constraints: ["bytes_transferred >= 1", "flops_executed >= 0"],
    examples: [
      {
        kind: "basic",
        title: "H100 Roofline Analysis",
        inputDisplay: "bytes = 1000, flops = 200000",
        outputDisplay: "AI = 200 FLOPs/byte (Memory-Bound)",
        input: { data: [100, 200, 300, 400] },
        output: "AI = 200 FLOPs/byte",
        explanation: "Calculates AI = 200 FLOPs/byte, below H100 Ridge Point (295 FLOPs/byte).",
      },
      {
        kind: "complex",
        title: "4-Data Volume Test",
        inputDisplay: "data = [100, 200, 300, 400]",
        outputDisplay: "SRAM 10x Speedup Calculated",
        input: { data: [100, 200, 300, 400] },
        output: "SRAM 10x Speedup Calculated",
        explanation: "Evaluates HBM vs SRAM transfer latency across 4 memory transaction sizes.",
      },
      {
        kind: "negative",
        title: "Zero Bytes Check",
        inputDisplay: "data = [0]",
        outputDisplay: "Division by Zero Prevented",
        input: { data: [0] },
        output: "Division by Zero Prevented",
        explanation: "Safely handles zero bytes transferred by clamping denominator.",
      },
    ],
    code: HBMVSSRAMBANDWIDTHCALCULATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Evaluates Roofline bandwidth equations in $O(1)$ floating-point operations.",
      space: "Requires $O(1)$ auxiliary space during scalar metric calculation.",
    },
    topicGuide: {
      overview:
        "The Roofline Model provides a intuitive framework for diagnosing whether a GPU kernel is bottlenecked by HBM memory bandwidth or Tensor Core compute capacity.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Arithmetic Intensity $I = \\frac{\\text{FLOPs}}{\\text{Bytes Memory Access}}$. The Ridge Point is $I^* = \\frac{P_{\\text{peak}}}{B_{\\text{peak}}}$. For NVIDIA H100 SXM5 ($P_{\\text{peak}} = 989 \\text{ TFLOPS}$ FP16, $B_{\\text{peak}} = 3.35 \\text{ TB/s}$), $I^* = \\frac{989 \\times 10^{12}}{3.35 \\times 10^{12}} \\approx 295 \\text{ FLOPs/byte}$. Kernels with $I < 295$ are memory-bound.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Tiling data into SRAM (~33 TB/s) increases effective memory bandwidth by 10x. Standard Softmax attention has $I \\approx 2$ FLOPs/byte (heavily memory bound). FlashAttention tiles Q,K,V into SRAM, boosting $I \\approx d$ (Compute-bound for $d=128$).",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Measuring real bandwidth: Nsight Compute (NCU) measures HBM DRAM throughput (`dram__bytes_read.sum + dram__bytes_write.sum`) vs L1/SRAM throughput to verify Roofline predictions.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Un-coalesced memory accesses: If warp threads issue un-aligned global memory loads, the GPU memory controller loads entire 32-byte DRAM segments, increasing effective bytes transferred and artificially reducing AI.",
        },
      ],
      keyTerms: [
        {
          term: "High Bandwidth Memory (HBM3)",
          definition:
            "GPU DRAM main memory stacked via 3D silicon interposers (3.35 TB/s on H100).",
        },
        {
          term: "Roofline Model",
          definition:
            "An intuitive performance model relating kernel TFLOPS to Arithmetic Intensity and Memory Bandwidth.",
        },
        {
          term: "Arithmetic Intensity (AI)",
          definition:
            "The ratio of floating-point operations performed per byte of DRAM memory accessed (FLOPs/byte).",
        },
        {
          term: "Ridge Point",
          definition:
            "The minimum Arithmetic Intensity required to achieve 100% peak GPU compute throughput.",
        },
      ],
    },
    trivia: HBMVSSRAMBANDWIDTHCALCULATOR_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT,
    generateSteps: generateHBMVSSRAMBANDWIDTHCALCULATORSteps,
  };
