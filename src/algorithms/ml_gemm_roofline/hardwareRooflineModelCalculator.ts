import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface hardwareRooflineModelCalculatorInput {
  flops: number;
  bytes: number;
  peakGflops: number;
  peakBandwidthGBs: number;
}

export const HARDWAREROOFLINEMODELCALCULATOR_CODE = `def hardware_roofline_model_calculator(flops, bytes_transferred, peak_gflops, peak_bw_gbs):
    ai = flops / bytes_transferred if bytes_transferred > 0 else float('inf')
    ridge_point = peak_gflops / peak_bw_gbs
    is_compute_bound = ai >= ridge_point
    max_gflops = min(peak_gflops, ai * peak_bw_gbs)
    return ai, ridge_point, is_compute_bound, max_gflops`;

export const DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT: hardwareRooflineModelCalculatorInput = {
  flops: 2000,
  bytes: 500,
  peakGflops: 1000,
  peakBandwidthGBs: 100,
};

export const generateHardwareRooflineModelCalculatorSteps = (
  input: hardwareRooflineModelCalculatorInput,
): AlgorithmStep[] => {
  const { flops, bytes, peakGflops, peakBandwidthGBs } = input;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // 4x4 Matrix representation of Roofline model parameters & analysis
  const rows = 4;
  const cols = 4;

  const matrixValues: string[][] = [
    [String(flops), String(bytes), "0.00", "Pending"],
    [String(peakGflops), String(peakBandwidthGBs), "0.00", "Pending"],
    ["0.00", "0.0%", String(bytes), "Pending"],
    ["0.00", "0.0%", "0.00", "Pending"],
  ];

  const makeMatrixSnapshot = (
    activeRow?: number,
    activeCol?: number,
    title: string = "Berkeley Roofline Model Matrix Analysis",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cellState: MatrixCellItem["state"] = "default";
        if (r === activeRow && c === activeCol) {
          cellState = "active";
        } else if (r === activeRow) {
          cellState = "compared";
        } else if (r < (activeRow ?? -1)) {
          cellState = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          state: cellState,
          label: `R${r}C${c}`,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      cells,
      rowHeaders: ["Workload Profile", "Machine Hardware", "Bandwidth Ceiling", "Compute Ceiling"],
      colHeaders: ["Metric 1", "Metric 2", "Derived Val", "Regime / Status"],
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(activeRow, activeCol, `Roofline Model Step ${stepIndex}`),
      auxiliaryState: {
        customState: {
          flops: String(flops),
          bytes: String(bytes),
          peakGflops: String(peakGflops),
          peakBW: String(peakBandwidthGBs),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Initialize Berkeley Hardware Roofline Calculator",
    "Starting operational intensity and performance ceiling evaluation for target ML workload.",
    { flops, bytes, peakGflops, peakBandwidthGBs },
    0,
    0,
  );

  // Step 1b: Input specifications parsing
  addStep(
    1,
    "Parse Workload & Machine Parameters",
    `Loaded workload parameters (FLOPs = ${flops}, Bytes = ${bytes}) and hardware parameters (Peak GFLOPS = ${peakGflops}, Peak BW = ${peakBandwidthGBs} GB/s).`,
    { flops, bytes, peakGflops, peakBandwidthGBs },
    0,
    1,
  );

  // Step 1c: Parameter validation
  addStep(
    1,
    "Validate Input Parameter Bounds",
    "Checking non-negative FLOP count, DRAM byte volume, peak GFLOPS rate, and DRAM bandwidth.",
    { valid: flops >= 0 && bytes >= 0 && peakGflops > 0 && peakBandwidthGBs > 0 },
    0,
    0,
  );

  // Step 2: AI Calculation micro-steps
  addStep(
    2,
    "Inspect FLOP vs Byte Ratio Definition",
    "Arithmetic Intensity (I) measures floating-point work performed per DRAM byte fetched across memory bus.",
    { flops, bytes },
    0,
    1,
  );

  addStep(
    2,
    "Verify Non-Zero Memory Bytes Transferred",
    `Checking if bytes_transferred (${bytes}) > 0 to prevent division by zero.`,
    { bytes, isValid: bytes > 0 },
    0,
    1,
  );

  const ai = bytes > 0 ? flops / bytes : Infinity;
  matrixValues[0][2] = ai === Infinity ? "Inf" : ai.toFixed(2);

  addStep(
    2,
    `Compute Operational Intensity (AI = ${ai === Infinity ? "Inf" : ai.toFixed(2)} FLOPs/Byte)`,
    `Evaluated AI = FLOPs / Bytes = ${flops} / ${bytes} = ${ai === Infinity ? "Inf" : ai.toFixed(2)} FLOPs/Byte.`,
    { flops, bytes, ai: ai === Infinity ? "Infinity" : ai },
    0,
    2,
  );

  // Step 3: Machine Balance (Ridge Point) calculation micro-steps
  addStep(
    3,
    "Inspect Machine Peak Compute & Bandwidth Capabilities",
    `Peak GFLOPS = ${peakGflops}, Peak Bandwidth = ${peakBandwidthGBs} GB/s.`,
    { peakGflops, peakBandwidthGBs },
    1,
    0,
  );

  const ridgePoint = peakGflops / peakBandwidthGBs;
  matrixValues[1][2] = ridgePoint.toFixed(2);

  addStep(
    3,
    `Calculate Machine Balance / Ridge Point (${ridgePoint.toFixed(2)} FLOPs/Byte)`,
    `Ridge Point = Peak GFLOPS / Peak BW = ${peakGflops} / ${peakBandwidthGBs} = ${ridgePoint.toFixed(2)} FLOPs/Byte.`,
    { peakGflops, peakBandwidthGBs, ridgePoint },
    1,
    2,
  );

  // Step 4: Compare AI vs Ridge Point (Regime Classification)
  addStep(
    4,
    "Compare Workload AI Against Hardware Ridge Point",
    `Evaluating if AI (${ai.toFixed(2)}) >= Ridge Point (${ridgePoint.toFixed(2)}).`,
    { ai: ai === Infinity ? 999999 : ai, ridgePoint },
    0,
    3,
  );

  const isComputeBound = ai >= ridgePoint;
  matrixValues[0][3] = isComputeBound ? "Compute-Bound" : "Memory-Bound";
  matrixValues[1][3] = isComputeBound ? "High Intensity" : "Low Intensity";

  addStep(
    4,
    `Classify Execution Bottleneck: ${isComputeBound ? "COMPUTE-BOUND" : "MEMORY-BOUND"}`,
    isComputeBound
      ? `Workload AI (${ai.toFixed(2)}) >= Ridge Point (${ridgePoint.toFixed(2)}). Execution is limited by peak compute FLOPS!`
      : `Workload AI (${ai.toFixed(2)}) < Ridge Point (${ridgePoint.toFixed(2)}). Execution is limited by DRAM bandwidth!`,
    { isComputeBound },
    0,
    3,
  );

  // Step 5: Calculate Performance Ceilings
  const bwCeiling = ai * peakBandwidthGBs;
  matrixValues[2][0] = bwCeiling.toFixed(2);
  matrixValues[2][1] = `${Math.min(100, (bwCeiling / peakGflops) * 100).toFixed(1)}%`;
  matrixValues[2][3] = isComputeBound ? "Non-Binding" : "ACTIVE LIMIT";

  addStep(
    5,
    `Compute Bandwidth-Constrained Ceiling (${bwCeiling.toFixed(2)} GFLOPS)`,
    `Bandwidth Limit = AI * Peak BW = ${ai.toFixed(2)} * ${peakBandwidthGBs} = ${bwCeiling.toFixed(2)} GFLOPS.`,
    { ai: ai === Infinity ? 999999 : ai, peakBandwidthGBs, bwCeiling },
    2,
    0,
  );

  matrixValues[3][0] = peakGflops.toFixed(2);
  matrixValues[3][1] = isComputeBound
    ? "100.0%"
    : `${((bwCeiling / peakGflops) * 100).toFixed(1)}%`;
  matrixValues[3][3] = isComputeBound ? "ACTIVE LIMIT" : "Non-Binding";

  addStep(
    5,
    `Inspect Compute-Constrained Ceiling (${peakGflops.toFixed(2)} GFLOPS)`,
    `Peak Hardware Compute Roof = ${peakGflops} GFLOPS.`,
    { peakGflops },
    3,
    0,
  );

  const maxGflops = Math.min(peakGflops, bwCeiling);

  addStep(
    5,
    `Evaluate Attainable Performance Ceiling = min(Peak GFLOPS, BW Limit)`,
    `max_gflops = min(${peakGflops}, ${bwCeiling.toFixed(2)}) = ${maxGflops.toFixed(2)} GFLOPS.`,
    { peakGflops, bwCeiling, maxGflops },
    3,
    3,
  );

  // Step 6: Return tuple & analysis steps
  addStep(
    6,
    "Prepare Return Tuple: (ai, ridge_point, is_compute_bound, max_gflops)",
    "Assembling output tuples containing key Roofline analytical metrics.",
    {
      ai: ai === Infinity ? "Infinity" : Number(ai.toFixed(2)),
      ridgePoint: Number(ridgePoint.toFixed(2)),
      isComputeBound,
      maxGflops: Number(maxGflops.toFixed(2)),
    },
    3,
    3,
  );

  addStep(
    6,
    `Validate Operational Intensity Output (AI = ${ai.toFixed(2)})`,
    "Verifying operational intensity float ratio correctness.",
    { ai: ai === Infinity ? "Infinity" : Number(ai.toFixed(2)) },
    0,
    2,
  );

  addStep(
    6,
    `Validate Ridge Point Output (${ridgePoint.toFixed(2)})`,
    "Verifying hardware inflection threshold correctness.",
    { ridgePoint: Number(ridgePoint.toFixed(2)) },
    1,
    2,
  );

  addStep(
    6,
    `Validate Bottleneck Flag (is_compute_bound = ${isComputeBound})`,
    "Verifying binary bottleneck classification state.",
    { isComputeBound },
    0,
    3,
  );

  addStep(
    6,
    `Validate Max Attainable GFLOPS (${maxGflops.toFixed(2)})`,
    "Verifying roofline ceiling throughput cap.",
    { maxGflops: Number(maxGflops.toFixed(2)) },
    3,
    3,
  );

  addStep(
    6,
    "Analyze Memory Efficiency Ratio",
    `Attainable performance efficiency = ${((maxGflops / peakGflops) * 100).toFixed(1)}% of peak hardware GFLOPS.`,
    { efficiencyPercent: Number(((maxGflops / peakGflops) * 100).toFixed(1)) },
    2,
    1,
  );

  addStep(
    6,
    "Analyze Hardware Optimization Opportunities",
    isComputeBound
      ? "Kernel is compute-bound: Focus on FP16 Tensor Core instruction tuning and warp execution occupancy."
      : "Kernel is memory-bound: Focus on cache tiling, float quantization (INT8/FP8), and memory access coalescing.",
    { recommendation: isComputeBound ? "Tensor Core Tuning" : "Memory Tiling & Quantization" },
    3,
    3,
  );

  addStep(
    6,
    "Execution Complete: Return Berkeley Roofline Results",
    "Successfully computed operational intensity, ridge point, and performance bounds.",
    { completed: true },
    3,
    3,
  );

  return steps;
};

const HARDWAREROOFLINEMODELCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "ai = flops * bytes_transferred",
    "ridge_point = peak_bw_gbs / peak_gflops",
    "is_compute_bound = ai < ridge_point",
    "max_gflops = peak_gflops + peak_bw_gbs",
  ],
  hints: [
    { line: 2, hint: "Operational Intensity AI is FLOPs divided by bytes transferred." },
    { line: 3, hint: "Ridge Point is peak GFLOPS divided by memory bandwidth GB/s." },
    { line: 5, hint: "Attainable GFLOPS is bounded by min(peak GFLOPS, AI * memory bandwidth)." },
  ],
  lineExplanations: {
    1: "Defines Berkeley hardware roofline model calculator function signature.",
    2: "Calculates Arithmetic Intensity AI = FLOPs / bytes (or Infinity if zero bytes).",
    3: "Calculates Machine Balance (Ridge Point) = peak_gflops / peak_bw_gbs.",
    4: "Determines if workload is Compute-Bound (AI >= Ridge Point) or Memory-Bound.",
    5: "Calculates maximum attainable performance ceiling = min(peak_gflops, ai * peak_bw_gbs).",
    6: "Returns tuple of (AI, Ridge Point, is_compute_bound flag, max_gflops ceiling).",
  },
};

export const hardwareRooflineModelCalculator: AlgorithmDefinition<hardwareRooflineModelCalculatorInput> =
  {
    id: "hardware-roofline-model-calculator",
    title: "Berkeley Hardware Roofline Model Calculator",
    topicIds: ["ml_gemm_roofline", "arrays_and_hashing"],
    difficulty: "Hard",
    description:
      "The Berkeley Roofline Model is an insightful visually-grounded performance model used across high-performance computing (HPC) and deep learning systems optimization (CUDA, Triton, PyTorch Inductor, TensorRT). It maps machine performance ceiling (GFLOPS) against Operational Intensity $I = \\text{FLOPs} / \\text{Byte}$ of memory traffic.\n\nThe model features two distinct ceilings:\n1. Memory Bandwidth Ceiling: $\\text{Performance} = I \\times \\text{Peak Memory Bandwidth (GB/s)}$.\n2. Compute Capacity Ceiling: $\\text{Performance} = \\text{Peak Hardware Compute (GFLOPS)}$.\n\nThe intersection point $I_{\\text{ridge}} = \\frac{\\text{Peak GFLOPS}}{\\text{Peak Bandwidth GB/s}}$ represents the Machine Balance (Ridge Point). Kernels with $I < I_{\\text{ridge}}$ are Memory-Bandwidth Bound (stalled waiting for DRAM), while kernels with $I \\ge I_{\\text{ridge}}$ are Compute-Bound (capable of saturating GPU Tensor Cores).\n\nInput Format:\n- flops: Total floating-point operations executed by the algorithm.\n- bytes: Total memory bytes transferred from DRAM.\n- peakGflops: Peak hardware compute rate in GFLOPS.\n- peakBandwidthGBs: Peak hardware DRAM memory bandwidth in GB/s.\n\nOutput Format:\n- Returns tuple `(ai, ridge_point, is_compute_bound, max_gflops)`.\n\nEdge Cases & Constraints:\n- Zero bytes transferred ($I \\to \\infty$, strictly compute bound).\n- High memory bandwidth systems (e.g. HBM3 with 3.35 TB/s).\n- Low operational intensity kernels (e.g., vector addition, element-wise activations).",
    constraints: ["flops >= 0", "bytes >= 0", "peakGflops > 0", "peakBandwidthGBs > 0"],
    examples: [
      {
        kind: "basic",
        title: "Compute-Bound GEMM Execution",
        inputDisplay: "flops=2000, bytes=500, peakGflops=1000, peakBW=100",
        outputDisplay: "AI=4.00, RidgePoint=10.00, ComputeBound=false, MaxGFLOPS=400.00",
        input: DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
        output: "AI=4.00, RidgePoint=10.00, MaxGFLOPS=400.00",
        explanation:
          "AI (4.0) < Ridge Point (10.0), so kernel is Memory-Bound with 400 GFLOPS ceiling.",
      },
    ],
    code: HARDWAREROOFLINEMODELCALCULATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Evaluates closed-form arithmetic scalar operations in O(1) constant time.",
      space: "Allocates scalar floating-point variables in O(1) constant space.",
    },
    topicGuide: {
      overview:
        "The Berkeley Roofline Model provides hardware engineers and AI kernel developers with a rigorous framework for diagnosing system bottlenecks. By plotting performance as a function of Arithmetic Intensity, developers can quickly determine whether a kernel requires memory optimization (tiling, quantization, kernel fusion) or compute optimization (vectorization, Tensor Core instructions, unrolling).",
      sections: [
        {
          heading: "Why It Exists & Theoretical Foundations",
          body: "Modern microprocessors feature compute throughputs that grow exponentially faster than memory bandwidth (the Memory Wall). Arithmetic Intensity $I = \\frac{\\text{FLOPs}}{\\text{Bytes}}$ quantifies how efficiently a kernel reuses data in cache registers before fetching new data from main memory.",
        },
        {
          heading: "What It Solves & Real-World Applications",
          body: "Provides precise diagnostic guidance for GPU/CPU acceleration. For instance, on an NVIDIA H100 (1979 TFLOPS FP16, 3.35 TB/s HBM3), Ridge Point $I_{\\text{ridge}} = \\frac{1979}{3.35} \\approx 590$ FLOPs/Byte. Large-batch LLM training (GEMM) easily exceeds 590 FLOPs/Byte and runs compute-bound, whereas single-token auto-regressive decoding (~1 FLOP/Byte) is severely memory-bound.",
        },
        {
          heading: "Step-by-Step Intuition & Worked Example",
          body: "Given FLOPs=2000, Bytes=500: (1) Compute $I = 2000 / 500 = 4.0$ FLOPs/Byte. (2) Given Peak GFLOPS=1000, Peak BW=100 GB/s, compute Ridge Point $I_{\\text{ridge}} = 1000 / 100 = 10.0$. (3) Since $4.0 < 10.0$, the kernel is Memory-Bound. (4) Maximum achievable performance is $4.0 \\times 100 = 400$ GFLOPS.",
        },
        {
          heading: "Trade-offs & Hardware Realities",
          body: "The basic Roofline model assumes ideal cache hit rates and full memory bus saturation. Extended Roofline models incorporate multi-level cache ceilings (L1, L2, L3) and vector unit instruction limits (SIMD/AVX-512 vs scalar).",
        },
        {
          heading: "Time & Space Complexity Analysis",
          body: "Time Complexity: $O(1)$ constant time for closed-form division and comparison operations. Space Complexity: $O(1)$ constant memory usage.",
        },
      ],
      keyTerms: [
        {
          term: "Arithmetic Intensity",
          definition:
            "The ratio of floating-point operations performed per byte of DRAM memory transferred ($I = \\text{FLOPs} / \\text{Byte}$).",
        },
        {
          term: "Ridge Point",
          definition:
            "The hardware balance inflection point ($I_{\\text{ridge}} = \\frac{\\text{Peak GFLOPS}}{\\text{Peak BW}}$) separating memory-bound from compute-bound execution.",
        },
        {
          term: "Memory Bandwidth Bound",
          definition:
            "Execution regime where ALUs stall waiting for data fetches from DRAM due to low operational intensity ($I < I_{\\text{ridge}}$).",
        },
        {
          term: "Compute Bound",
          definition:
            "Execution regime where memory bandwidth is sufficient and performance is capped by ALU/Tensor Core clock rates ($I \\ge I_{\\text{ridge}}$).",
        },
      ],
    },
    trivia: HARDWAREROOFLINEMODELCALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
    defaultInput: DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
    generateSteps: generateHardwareRooflineModelCalculatorSteps,
  };
