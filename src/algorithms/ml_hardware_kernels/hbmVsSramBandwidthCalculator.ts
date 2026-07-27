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

  const results: {
    name: string;
    ai: number;
    hbmTimeUs: number;
    sramTimeUs: number;
    status: string;
  }[] = [];

  const createMatrixSnapshot = (
    activeWorkloadIdx?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    workloads.forEach((wl, idx) => {
      const res = results[idx];
      const aiVal = res ? Number(res.ai.toFixed(1)) : 0;
      const hbmUs = res ? Number(res.hbmTimeUs.toFixed(2)) : 0;
      const sramUs = res ? Number(res.sramTimeUs.toFixed(2)) : 0;
      const isCompute = res ? res.status.includes("Compute") : false;

      let state: MatrixCellItem["state"] = "default";
      if (activeWorkloadIdx === idx) {
        state = "active";
      } else if (res) {
        state = isCompute ? "sorted" : "compared";
      }

      grid.push([
        {
          row: idx,
          col: 0,
          value: idx + 1,
          label: `${wl.name}`,
          state,
        },
        {
          row: idx,
          col: 1,
          value: aiVal,
          label: `AI=${aiVal} FLOP/B`,
          state,
        },
        {
          row: idx,
          col: 2,
          value: hbmUs,
          label: `HBM=${hbmUs}µs`,
          state,
        },
        {
          row: idx,
          col: 3,
          value: sramUs,
          label: `SRAM=${sramUs}µs`,
          state,
        },
      ]);
    });
    return grid;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeWorkloadIdx?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: workloads.length,
        cols: 4,
        cells: createMatrixSnapshot(activeWorkloadIdx),
      },
      auxiliaryState: {
        customState: customState ?? {
          hbm_bandwidth: `${hbmTbps} TB/s (H100 HBM3)`,
          sram_bandwidth: `${sramTbps} TB/s (H100 SRAM)`,
          ridge_point: `${ridgePoint} FLOPs/byte`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize GPU HBM vs SRAM Bandwidth Calculator",
    `Roofline Model analysis initialized: HBM bandwidth ${hbmTbps} TB/s, SRAM bandwidth ${sramTbps} TB/s, H100 Ridge Point ${ridgePoint} FLOPs/byte.`,
    { hbm_tbps: hbmTbps, sram_tbps: sramTbps, ridge_point: ridgePoint },
  );

  addStep(
    2,
    "Inspect Roofline Model parameters and hardware ceilings",
    `Evaluating ${workloads.length} GPU kernel workloads for memory bandwidth bottlenecks.`,
    { num_workloads: workloads.length },
  );

  workloads.forEach((wl, idx) => {
    addStep(
      3,
      `Evaluate Workload ${idx + 1}/${workloads.length}: "${wl.name}" (${wl.bytes} Bytes, ${wl.flops} FLOPs)`,
      `Computing Arithmetic Intensity AI = FLOPs / max(1, Bytes).`,
      { name: wl.name, bytes: wl.bytes, flops: wl.flops },
      idx,
    );

    const ai = wl.flops / Math.max(1, wl.bytes);
    addStep(
      3,
      `Calculated Arithmetic Intensity AI = ${wl.flops} / ${wl.bytes} = ${ai.toFixed(2)} FLOPs/byte`,
      `Kernel processes ${ai.toFixed(2)} floating point ops per byte transferred across memory bus.`,
      { name: wl.name, ai: Number(ai.toFixed(2)) },
      idx,
    );

    const hbmTimeUs = (wl.bytes / (hbmTbps * 1e12)) * 1e6;
    addStep(
      5,
      `Calculate HBM3 DRAM Transfer Time = (${wl.bytes} B / 3.35 TB/s) = ${hbmTimeUs.toFixed(3)} µs`,
      `Latency to transfer ${wl.bytes} bytes over 3.35 TB/s HBM3 bus.`,
      { name: wl.name, hbm_time_us: Number(hbmTimeUs.toFixed(3)) },
      idx,
    );

    const sramTimeUs = (wl.bytes / (sramTbps * 1e12)) * 1e6;
    addStep(
      6,
      `Calculate SRAM Cache Transfer Time = (${wl.bytes} B / 33.0 TB/s) = ${sramTimeUs.toFixed(3)} µs`,
      `Latency to transfer ${wl.bytes} bytes over 33.0 TB/s on-chip SRAM. Speedup = ${(hbmTimeUs / Math.max(0.0001, sramTimeUs)).toFixed(1)}x.`,
      { name: wl.name, sram_time_us: Number(sramTimeUs.toFixed(3)), speedup: Number((hbmTimeUs / Math.max(0.0001, sramTimeUs)).toFixed(1)) },
      idx,
    );

    addStep(
      9,
      `Retrieve NVIDIA H100 Ridge Point = 295.0 FLOPs/byte`,
      `GPU Roofline inflection point dividing Memory-Bound and Compute-Bound regions.`,
      { ridge_point: 295.0 },
      idx,
    );

    const isCompute = ai >= ridgePoint;
    const boundStatus = isCompute
      ? "Compute-Bound (Tensor Core Max)"
      : "Memory-Bound (HBM Bottleneck)";

    results.push({
      name: wl.name,
      ai,
      hbmTimeUs,
      sramTimeUs,
      status: boundStatus,
    });

    addStep(
      10,
      `Classify Workload "${wl.name}": ${boundStatus} (AI ${ai.toFixed(2)} ${isCompute ? ">=" : "<"} 295.0)`,
      `Roofline classification complete for "${wl.name}".`,
      { name: wl.name, ai: Number(ai.toFixed(2)), status: boundStatus },
      idx,
    );
  });

  addStep(
    12,
    "Return Roofline bandwidth comparison results for all workloads",
    `Roofline Model analysis complete. Successfully compared HBM vs SRAM transfer latency across ${workloads.length} GPU kernel workloads.`,
    { completed: true, total_workloads: workloads.length },
  );

  return steps;
};

export const HBMVSSRAMBANDWIDTHCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [4, 7, 8, 11],
  distractors: [
    "arithmetic_intensity = bytes_transferred / flops_executed",
    "sram_time_us = hbm_time_us * 33.0",
    "ridge_point = 1.0",
    "bound_status = 'Compute-Bound' if AI < ridge_point else 'Memory-Bound'",
  ],
  hints: [
    { line: 3, hint: "Compute Arithmetic Intensity AI = FLOPs / Bytes transferred." },
    { line: 5, hint: "Calculate memory transfer time using HBM (3.35 TB/s) and SRAM (33.0 TB/s) bandwidths." },
    { line: 10, hint: "Compare AI against GPU Ridge Point (~295 FLOPs/byte on H100)." },
  ],
  lineExplanations: {
    1: "Defines calculate_roofline_bandwidth signature with transfer volume, FLOP count, and memory bandwidth specs.",
    2: "Docstring explaining Roofline Model comparison between HBM3 DRAM and on-chip SRAM.",
    3: "Calculates Arithmetic Intensity AI = FLOPs / max(1, Bytes).",
    4: "Blank line preceding memory latency calculation.",
    5: "Calculates transfer latency in microseconds over HBM3 DRAM (3.35 TB/s).",
    6: "Calculates transfer latency in microseconds over on-chip SRAM (33.0 TB/s).",
    7: "Blank line preceding Ridge Point comparison.",
    8: "Comment noting NVIDIA H100 SXM5 Ridge Point of ~295 FLOPs/byte.",
    9: "Sets H100 FP16 hardware Ridge Point constant to 295.0 FLOPs/byte.",
    10: "Classifies kernel bottleneck as Memory-Bound vs Compute-Bound by comparing AI to Ridge Point.",
    11: "Blank line preceding return statement.",
    12: "Returns tuple of (arithmetic_intensity, hbm_time_us, sram_time_us, bound_status).",
  },
};

export const hbmVsSramBandwidthCalculator: AlgorithmDefinition<hbmVsSramBandwidthCalculatorInput> = {
  id: "hbm-vs-sram-bandwidth-calculator",
  title: "GPU HBM vs SRAM Memory Bandwidth Calculator",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master GPU Roofline Model Analysis: compare High Bandwidth Memory (HBM3) vs On-Chip Shared Memory (SRAM) performance ceilings on modern hardware like NVIDIA H100/A100.

### Why It Exists & What It Solves
Understanding GPU memory hierarchy performance is essential for diagnosing bottlenecks in machine learning workloads. Modern GPUs feature two primary memory tiers:
1. **High Bandwidth Memory (HBM3 / HBM3e)**: Main DRAM memory on the GPU (e.g. 80 GB on A100 / 141 GB on H200) with a bandwidth ceiling of $3.35 \\text{ TB/s}$ on NVIDIA H100 SXM5.
2. **On-Chip Shared Memory (SRAM / L1 Cache)**: Fast register-adjacent cache memory (~228 KB per SM) with an aggregate bandwidth ceiling of $\\sim 33.0 \\text{ TB/s}$—nearly $10\\times$ faster than HBM.

According to Williams et al.'s **Roofline Model**, the attainable performance ceiling of a GPU kernel is governed by:
$$\\text{Performance (TFLOPS)} = \\min\\left(\\text{Peak Compute TFLOPS}, \\text{Arithmetic Intensity (FLOPs/byte)} \\times \\text{Memory Bandwidth (TB/s)}\\right)$$

### The Ridge Point
The **Ridge Point** is the minimum Arithmetic Intensity (AI) required to reach peak GPU Tensor Core FLOPs:
$$\\text{Ridge Point } I^* = \\frac{\\text{Peak TFLOPS}}{\\text{Peak Memory Bandwidth (TB/s)}}$$

For NVIDIA H100 SXM5 (989 FP16 TFLOPS, 3.35 TB/s HBM):
$$I^* = \\frac{989 \\times 10^{12}}{3.35 \\times 10^{12}} \\approx 295.0 \\text{ FLOPs/byte}$$

- **Memory-Bound ($AI < 295$)**: Execution speed is limited by HBM DRAM memory bandwidth. The GPU Tensor Cores sit idle waiting for data.
- **Compute-Bound ($AI \\ge 295$)**: Execution speed is limited by Tensor Core ALU compute capacity. Memory transfers are completely hidden.

Tiling algorithms (like FlashAttention and tiled GEMM) load data blocks into SRAM to boost AI past the Ridge Point into the Compute-Bound regime.

### Input Parameters
- \`workloads\`: List of kernel workloads with \`name\`, \`bytes\` transferred, and \`flops\` executed.
- \`hbmBandwidthTbps\`: HBM DRAM bandwidth spec (default 3.35 TB/s for H100).
- \`sramBandwidthTbps\`: SRAM cache bandwidth spec (default 33.0 TB/s for H100).

### Output
- Returns Arithmetic Intensity scalar $AI$, HBM transfer time $t_{\\text{hbm}}$, SRAM transfer time $t_{\\text{sram}}$, and Roofline bottleneck status string.

### Trade-offs & Complexity
- **Time Complexity**: $O(1)$ scalar calculation per workload.
- **Space Complexity**: $O(1)$ auxiliary space.`,
  constraints: ["bytes_transferred >= 1", "flops_executed >= 0"],
  examples: [
    {
      kind: "basic",
      title: "H100 Roofline Analysis",
      inputDisplay: "FlashAttention Tile (Br=128)",
      outputDisplay: "AI = 256 FLOPs/byte (Memory-Bound)",
      input: {
        workloads: [
          { name: "Naïve Softmax (N=4k)", bytes: 33554432, flops: 67108864 },
          { name: "FlashAttention Tile (Br=128)", bytes: 1048576, flops: 268435456 },
          { name: "GEMM Tile (M=128, N=128)", bytes: 65536, flops: 33554432 },
          { name: "LayerNorm Kernel", bytes: 16777216, flops: 33554432 },
          { name: "Conv2D Feature Map", bytes: 4194304, flops: 1073741824 },
        ],
        hbmBandwidthTbps: 3.35,
        sramBandwidthTbps: 33.0,
      },
      output: "Roofline metrics computed",
      explanation: "Evaluates Roofline bandwidth and Ridge Point for 5 representative ML workloads.",
    },
    {
      kind: "complex",
      title: "4-Data Volume Test",
      inputDisplay: "hbmBandwidthTbps = 3.35, sramBandwidthTbps = 33.0",
      outputDisplay: "SRAM 10x Speedup Calculated",
      input: {
        workloads: [
          { name: "Naïve Softmax (N=4k)", bytes: 33554432, flops: 67108864 },
          { name: "FlashAttention Tile (Br=128)", bytes: 1048576, flops: 268435456 },
        ],
        hbmBandwidthTbps: 3.35,
        sramBandwidthTbps: 33.0,
      },
      output: "SRAM 10x Speedup Calculated",
      explanation: "Evaluates HBM vs SRAM transfer latency across 2 memory transaction sizes.",
    },
    {
      kind: "negative",
      title: "Zero Bytes Check",
      inputDisplay: "bytes = 0, flops = 100",
      outputDisplay: "Division by Zero Prevented",
      input: {
        workloads: [{ name: "Zero Bytes Test", bytes: 0, flops: 100 }],
      },
      output: "Division by Zero Prevented",
      explanation: "Safely handles zero bytes transferred by clamping denominator.",
    },
  ],
  code: HBMVSSRAMBANDWIDTHCALCULATOR_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Evaluates Roofline bandwidth equations in O(1) floating-point operations.",
    space: "Requires O(1) auxiliary space during scalar metric calculation.",
  },
  topicGuide: {
    overview:
      "The Roofline Model provides an intuitive framework for diagnosing whether a GPU kernel is bottlenecked by HBM memory bandwidth or Tensor Core compute capacity.",
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
