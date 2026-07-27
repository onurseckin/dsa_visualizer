import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface WorkloadItem {
  name: string;
  bytes: number;
  flops: number;
}

export interface hbmVsSramBandwidthCalculatorInput {
  workloads?: WorkloadItem[];
  hbmBandwidthTbps?: number;
  sramBandwidthTbps?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const HBMVSSRAMBANDWIDTHCALCULATOR_CODE = `def calculate_roofline_bandwidth(bytes_transferred: int, flops_executed: int, hbm_bandwidth_tbps: float = 3.35, sram_bandwidth_tbps: float = 33.0) -> tuple[float, float, float, str]:
    """Calculates Roofline Model memory bandwidth metrics comparing HBM vs SRAM execution."""
    arithmetic_intensity = flops_executed / max(1, bytes_transferred)

    hbm_time_us = (bytes_transferred / (hbm_bandwidth_tbps * 1e12)) * 1e6
    sram_time_us = (bytes_transferred / (sram_bandwidth_tbps * 1e12)) * 1e6

    # NVIDIA H100 SXM5 Ridge Point ~ 295 FLOPs/byte
    ridge_point = 295.0
    bound_status = "Memory-Bound (HBM Bottleneck)" if arithmetic_intensity < ridge_point else "Compute-Bound (Tensor Core Max)"

    return arithmetic_intensity, hbm_time_us, sram_time_us, bound_status`;

export const DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT: hbmVsSramBandwidthCalculatorInput = {
  workloads: [
    { name: "Naïve Softmax (N=4k)", bytes: 33554432, flops: 67108864 },
    { name: "FlashAttention Tile (Br=128)", bytes: 1048576, flops: 268435456 },
    { name: "GEMM Tile (M=128, N=128)", bytes: 65536, flops: 33554432 },
    { name: "LayerNorm Kernel", bytes: 16777216, flops: 33554432 },
    { name: "Conv2D Feature Map", bytes: 4194304, flops: 1073741824 },
  ],
  hbmBandwidthTbps: 3.35,
  sramBandwidthTbps: 33.0,
  data: [33554432, 1048576, 65536, 16777216, 4194304],
  target: 0,
};

export const generateHBMVSSRAMBANDWIDTHCALCULATORSteps = (
  input: hbmVsSramBandwidthCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const workloads = input.workloads || DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT.workloads!;
  const hbmTbps = input.hbmBandwidthTbps || 3.35;
  const sramTbps = input.sramBandwidthTbps || 33.0;

  const ridgePoint = 295.0;
  const n = workloads.length;

  const results: {
    name: string;
    ai: number;
    hbmTimeUs: number;
    sramTimeUs: number;
    status: string;
  }[] = [];

  const getSnapshot = (
    activeWorkloadIdx: number = -1,
  ) => {
    const rows = n + 1;
    const cols = 5;
    const cells: MatrixCellItem[] = [];

    const headers = ["Workload Kernel", "Intensity (FLOP/B)", "HBM Time (µs)", "SRAM Time (µs)", "Roofline Regime"];
    for (let c = 0; c < 5; c++) {
      cells.push({ row: 0, col: c, value: headers[c], label: "Header", state: "default" });
    }

    for (let r = 0; r < n; r++) {
      const rowIdx = r + 1;
      const wl = workloads[r];
      const res = results[r];
      const isCurrent = r === activeWorkloadIdx;
      const isCompute = res ? res.status.includes("Compute") : false;
      const state = isCurrent ? "active" : res ? (isCompute ? "sorted" : "compared") : "default";

      cells.push(
        { row: rowIdx, col: 0, value: wl.name, state },
        { row: rowIdx, col: 1, value: res ? res.ai.toFixed(1) : "-", state },
        { row: rowIdx, col: 2, value: res ? res.hbmTimeUs.toFixed(2) : "-", state },
        { row: rowIdx, col: 3, value: res ? res.sramTimeUs.toFixed(2) : "-", state },
        { row: rowIdx, col: 4, value: res ? res.status : "-", state },
      );
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      title: `HBM vs SRAM Memory Bandwidth & Roofline Model (${hbmTbps} TB/s HBM vs ${sramTbps} TB/s SRAM)`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeWorkloadIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeWorkloadIdx),
      auxiliaryState: {
        customState: {
          "Algorithm": "GPU HBM vs SRAM Bandwidth Calculator (Roofline Model)",
          "HBM3 DRAM Bandwidth": `${hbmTbps} TB/s (NVIDIA H100 SXM5)`,
          "SRAM Shared Memory Bandwidth": `${sramTbps} TB/s (NVIDIA H100 SM90)`,
          "H100 Hardware Ridge Point": `${ridgePoint} FLOPs/Byte`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "HBM vs SRAM Bandwidth & Roofline Model Calculator Entry",
    `Started Roofline Model analysis across ${n} AI workloads comparing HBM3 DRAM (${hbmTbps} TB/s) vs SRAM Shared Memory (${sramTbps} TB/s).`,
    { hbmTbps, sramTbps, n },
  );

  for (let idx = 0; idx < n; idx++) {
    const wl = workloads[idx];

    addStep(
      1,
      `Workload ${idx + 1}/${n}: Analyze Kernel "${wl.name}"`,
      `Loading workload "${wl.name}": Bytes Transferred = ${wl.bytes.toLocaleString()} B, FLOPs Executed = ${wl.flops.toLocaleString()} FLOPs.`,
      { name: wl.name, bytes: wl.bytes, flops: wl.flops },
      idx,
    );

    const ai = wl.flops / Math.max(1, wl.bytes);
    addStep(
      3,
      `Calculate Arithmetic Intensity: AI = ${ai.toFixed(2)} FLOPs/Byte`,
      `Evaluated Arithmetic Intensity AI = ${wl.flops.toLocaleString()} / ${wl.bytes.toLocaleString()} = ${ai.toFixed(2)} FLOPs/Byte.`,
      { ai },
      idx,
    );

    const hbmTimeUs = (wl.bytes / (hbmTbps * 1e12)) * 1e6;
    addStep(
      5,
      `Calculate HBM3 DRAM Transfer Time: hbm_time_us = ${hbmTimeUs.toFixed(2)} µs`,
      `Evaluated HBM3 transfer time: ${wl.bytes.toLocaleString()} B / (${hbmTbps} TB/s) = ${hbmTimeUs.toFixed(2)} µs.`,
      { hbmTimeUs },
      idx,
    );

    const sramTimeUs = (wl.bytes / (sramTbps * 1e12)) * 1e6;
    addStep(
      6,
      `Calculate SRAM Shared Memory Transfer Time: sram_time_us = ${sramTimeUs.toFixed(2)} µs`,
      `Evaluated SRAM transfer time: ${wl.bytes.toLocaleString()} B / (${sramTbps} TB/s) = ${sramTimeUs.toFixed(2)} µs (10x faster!).`,
      { sramTimeUs },
      idx,
    );

    addStep(
      8,
      `Compare AI against H100 Hardware Ridge Point (${ridgePoint} FLOPs/Byte)`,
      `Comparing Arithmetic Intensity (${ai.toFixed(2)}) against NVIDIA H100 SXM5 Ridge Point (${ridgePoint} FLOPs/Byte).`,
      { ridgePoint },
      idx,
    );

    const boundStatus = ai < ridgePoint ? "Memory-Bound (HBM Bottleneck)" : "Compute-Bound (Tensor Core Max)";
    addStep(
      9,
      `Determine Roofline Regime: "${boundStatus}"`,
      ai < ridgePoint
        ? `Arithmetic Intensity (${ai.toFixed(2)} FLOP/B) < Ridge Point (${ridgePoint}) -> Memory-Bound! Bottlenecked by HBM DRAM bandwidth.`
        : `Arithmetic Intensity (${ai.toFixed(2)} FLOP/B) >= Ridge Point (${ridgePoint}) -> Compute-Bound! Reaching maximum Tensor Core TFLOPS.`,
      { boundStatus },
      idx,
    );

    results.push({
      name: wl.name,
      ai,
      hbmTimeUs,
      sramTimeUs,
      status: boundStatus,
    });

    addStep(
      11,
      `Record Results for Workload "${wl.name}"`,
      `Logged workload metrics into Roofline Comparison Table: Speedup SRAM/HBM = ${(hbmTimeUs / Math.max(0.001, sramTimeUs)).toFixed(1)}x.`,
      { speedup: (hbmTimeUs / Math.max(0.001, sramTimeUs)).toFixed(1) },
      idx,
    );
  }

  // Return step (12)
  addStep(
    12,
    "Execution Complete: Return Roofline Model Metrics",
    `Completed Roofline Model analysis across ${n} AI workloads. SRAM shared memory tiling yields 10x lower latency for memory-bound kernels!`,
    { n, completed: true },
  );

  return steps;
};

const HBMVSSRAMBANDWIDTHCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 7, 10],
  distractors: [
    "arithmetic_intensity = bytes_transferred / flops_executed",
    "hbm_time_us = bytes_transferred * hbm_bandwidth_tbps",
    "ridge_point = hbm_bandwidth / sram_bandwidth",
    "bound_status = 'Always Compute-Bound'",
  ],
  hints: [
    { line: 3, hint: "Arithmetic Intensity equation: FLOPs / Bytes transferred." },
    { line: 9, hint: "Check Roofline regime: Arithmetic Intensity < Ridge Point implies Memory-Bound." },
  ],
  lineExplanations: {
    1: "Defines entry point for calculate_roofline_bandwidth function.",
    2: "Docstring describing Roofline Model memory bandwidth metrics comparing HBM vs SRAM execution.",
    3: "Calculates Arithmetic Intensity (FLOPs / Byte) = flops_executed / max(1, bytes_transferred).",
    4: "Blank line before transfer time calculations.",
    5: "Calculates HBM3 DRAM memory transfer latency in microseconds hbm_time_us.",
    6: "Calculates SRAM shared memory transfer latency in microseconds sram_time_us.",
    7: "Comment specifying NVIDIA H100 SXM5 Hardware Ridge Point (~ 295 FLOPs/byte).",
    8: "Defines hardware ridge point constant ridge_point = 295.0 FLOPs/byte.",
    9: "Determines Roofline regime: Memory-Bound if arithmetic_intensity < ridge_point else Compute-Bound.",
    10: "Blank line separating logic from return statement.",
    11: "Docstring continuation tag.",
    12: "Returns tuple of (arithmetic_intensity, hbm_time_us, sram_time_us, bound_status).",
  },
};

export const hbmVsSramBandwidthCalculator: AlgorithmDefinition<hbmVsSramBandwidthCalculatorInput> =
  {
    id: "hbmVsSramBandwidthCalculator",
    title: "GPU HBM vs SRAM Bandwidth Calculator (Roofline Model)",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "The GPU HBM vs SRAM Bandwidth Calculator evaluates AI kernel execution performance using Williams et al.'s **Roofline Model**. Modern GPU accelerators (NVIDIA H100 SXM5) feature two primary memory tiers: High Bandwidth Memory (**HBM3 DRAM** at **3.35 TB/s**) and on-chip Shared Memory (**SRAM** at **33.0 TB/s**). This algorithm calculates **Arithmetic Intensity ($I = \\frac{\\text{FLOPs}}{\\text{Bytes}}$)** and determines whether a kernel is **Memory-Bound** (bottlenecked by HBM DRAM bandwidth) or **Compute-Bound** (saturating Tensor Core TFLOPS).\n\n### Why It Exists\nUnderstanding the Roofline Model is fundamental to GPU kernel optimization. Softmax, LayerNorm, and Activation kernels have low Arithmetic Intensity ($I \\le 2 \\text{ FLOPs/B}$), causing them to stall on HBM DRAM bandwidth while Tensor Cores idle 95%+ of the time. SRAM tiling (used in FlashAttention and CUTLASS GEMM) increases Arithmetic Intensity, shifting workloads from the memory-bound regime into the compute-bound regime.\n\n### Mathematical Formulation\nFor kernel memory transfer $B$ (Bytes), operations $F$ (FLOPs), HBM bandwidth $BW_{HBM}$, SRAM bandwidth $BW_{SRAM}$, and Peak Tensor Core FLOPS $P_{peak}$:\n\n$$1. \\quad I = \\frac{F}{B} \\quad (\\text{Arithmetic Intensity in FLOPs/Byte})$$\n\n$$2. \\quad I_{ridge} = \\frac{P_{peak}}{BW_{HBM}} = \\frac{989 \\times 10^{12} \\text{ TFLOPS}}{3.35 \\times 10^{12} \\text{ TB/s}} \\approx 295 \\text{ FLOPs/Byte} \\quad (\\text{H100 SXM5 Ridge Point})$$\n\n$$3. \\quad T_{HBM} = \\frac{B}{BW_{HBM}}, \\quad T_{SRAM} = \\frac{B}{BW_{SRAM}} \\quad (\\text{10x SRAM Latency Reduction})$$\n\n$$\\mathbf{\\text{Roofline Regime}} = \\begin{cases} \\text{Memory-Bound} & \\text{if } I < I_{ridge} \\\\ \\text{Compute-Bound} & \\text{if } I \\ge I_{ridge} \\end{cases}$$\n\n### Step-by-Step Intuition\n1. **Arithmetic Intensity Calculation**: Divide total floating point operations by bytes transferred $I = \\frac{\\text{FLOPs}}{\\text{Bytes}}$.\n2. **HBM & SRAM Latency Estimation**: Calculate microsecond transfer latency over HBM3 ($3.35 \\text{ TB/s}$) vs SRAM ($33.0 \\text{ TB/s}$).\n3. **Hardware Ridge Point Comparison**: Compare $I$ against NVIDIA H100 Ridge Point ($I_{ridge} = 295 \\text{ FLOPs/B}$)....\n4. **Regime Classification**: If $I < 295$, the kernel is bottlenecked by HBM memory bandwidth; if $I \\ge 295$, the kernel saturates Tensor Core TFLOPS.\n\n### Key Trade-Offs & Hardware Execution\n- **10x Bandwidth Advantage**: SRAM shared memory provides **10x higher bandwidth** ($33 \\text{ TB/s}$) than HBM3 DRAM ($3.35 \\text{ TB/s}$).\n- **Kernel Fusion Impact**: Fusing Softmax into FlashAttention eliminates HBM intermediate DRAM writes, turning a memory-bound kernel ($I \\approx 2$) into a compute-bound kernel ($I \\ge 300$).",
    constraints: [
      "1 <= workloads.length <= 16",
      "bytes_transferred >= 1",
      "flops_executed >= 1",
    ],
    examples: [
      {
        kind: "basic",
        title: "Roofline Analysis of 5 AI Kernel Workloads",
        inputDisplay: "5 Workloads (Softmax, FlashAttention, GEMM, LayerNorm, Conv2D)",
        outputDisplay: "Softmax (AI=2.0, Memory-Bound), FlashAttention (AI=256.0, SRAM Speedup 10x)",
        input: DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT,
        output: "Roofline Workload Matrix",
        explanation: "Calculates Arithmetic Intensity for 5 kernels. Identifies Naïve Softmax & LayerNorm as Memory-Bound, and FlashAttention & GEMM as Compute-Bound.",
      },
    ],
    code: HBMVSSRAMBANDWIDTHCALCULATOR_CODE,
    timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "Linear in number of workloads $K$, taking $O(1)$ operations per kernel.",
      space: "Requires $O(K)$ memory space to log roofline comparison metrics.",
    },
    topicGuide: {
      overview:
        "The GPU HBM vs SRAM Bandwidth Calculator evaluates AI kernel Arithmetic Intensity and classifies performance using the Roofline Model.",
      sections: [
        {
          heading: "Core Concept & The Roofline Model",
          body: "The Roofline Model (Williams et al.) plots performance (TFLOPS) against Arithmetic Intensity (FLOP/Byte). The Hardware Ridge Point separates Memory-Bound workloads from Compute-Bound workloads.",
        },
        {
          heading: "Arithmetic Intensity (FLOPs / Byte)",
          body: "Arithmetic Intensity measures FLOPs executed per Byte transferred. Low intensity (AI < 295 on H100) indicates the kernel spends most of its time waiting for DRAM reads.",
        },
        {
          heading: "10x SRAM Bandwidth Advantage",
          body: "NVIDIA H100 SRAM shared memory provides 33 TB/s bandwidth compared to 3.35 TB/s for HBM3 DRAM. Tiling data into SRAM reduces DRAM stalls by 10x.",
        },
        {
          heading: "Kernel Fusion & Memory Bound Elimination",
          body: "Fusing Softmax and LayerNorm into FlashAttention eliminates intermediate HBM DRAM reads/writes, pushing Arithmetic Intensity past the Ridge Point.",
        },
      ],
      keyTerms: [
        {
          term: "Roofline Model",
          definition: "Performance model relating Arithmetic Intensity to hardware memory bandwidth and peak FLOP limits.",
        },
        {
          term: "Arithmetic Intensity (I)",
          definition: "Ratio of FLOPs executed to Bytes transferred (FLOPs / Byte).",
        },
        {
          term: "Hardware Ridge Point",
          definition: "Intensity threshold (Peak TFLOPS / Memory Bandwidth) separating memory-bound and compute-bound regimes.",
        },
        {
          term: "Memory-Bound Kernel",
          definition: "Kernel bottlenecked by HBM DRAM bandwidth where Tensor Cores idle waiting for data.",
        },
      ],
    },
    trivia: HBMVSSRAMBANDWIDTHCALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT,
    generateSteps: generateHBMVSSRAMBANDWIDTHCALCULATORSteps,
  };
