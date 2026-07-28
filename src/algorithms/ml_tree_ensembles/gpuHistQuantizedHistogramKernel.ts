import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface GpuHistQuantizedHistogramInput {
  binIndices: number[];
  gradients: number[];
  hessians: number[];
  numBins: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_GPU_HIST_INPUT: GpuHistQuantizedHistogramInput = {
  binIndices: [0, 1, 0, 2, 1, 3, 2, 0, 1, 3, 2, 0],
  gradients: [-0.5, 0.2, -0.3, 0.8, 0.1, 0.6, -0.4, 0.3, -0.1, 0.5, 0.2, -0.6],
  hessians: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
  numBins: 4,
  data: [0, 1, 0, 2, 1, 3, 2, 0, 1, 3, 2, 0],
  target: 4,
};

export const GPU_HIST_QUANTIZED_HISTOGRAM_CODE = `def gpu_hist_build_histogram(bin_indices: list[int], gradients: list[float], hessians: list[float], num_bins: int) -> tuple[list[float], list[float]]:
    hist_G = [0.0] * num_bins
    hist_H = [0.0] * num_bins

    for b_idx, g, h in zip(bin_indices, gradients, hessians):
        hist_G[b_idx] += g
        hist_H[b_idx] += h

    hist_G = [round(g, 4) for g in hist_G]
    hist_H = [round(h, 4) for h in hist_H]
    return hist_G, hist_H`;

export const generateGpuHistSteps = (input: GpuHistQuantizedHistogramInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const binIndices = input.binIndices || input.data || [0, 1, 0, 2, 1, 3, 2, 0, 1, 3, 2, 0];
  const gradients = input.gradients || [
    -0.5, 0.2, -0.3, 0.8, 0.1, 0.6, -0.4, 0.3, -0.1, 0.5, 0.2, -0.6,
  ];
  const hessians = input.hessians || [
    0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
  ];
  const numBins = input.numBins ?? input.target ?? 4;
  let stepIndex = 0;

  const N = binIndices.length;
  const histG = new Array(numBins).fill(0.0);
  const histH = new Array(numBins).fill(0.0);

  const getSnapshot = (activeBin: number = -1) => {
    return {
      kind: "matrix" as const,
      rows: 2,
      cols: numBins,
      rowHeaders: ["hist_G", "hist_H"],
      colHeaders: Array.from({ length: numBins }, (_, b) => `Bin ${b}`),
      cells: [
        ...histG.map((val, b) => ({
          row: 0,
          col: b,
          value: val.toFixed(2),
          state: b === activeBin ? ("active" as const) : ("default" as const),
        })),
        ...histH.map((val, b) => ({
          row: 1,
          col: b,
          value: val.toFixed(2),
          state: b === activeBin ? ("active" as const) : ("default" as const),
        })),
      ],
      title: `Shared Memory Histogram Buckets (${numBins} Bins)`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeBin: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeBin),
      auxiliaryState: {
        customState: {
          Algorithm: "GPU Quantized Histogram Kernel (XGBoost hist / LightGBM)",
          numBins: String(numBins),
          "Total Samples N": String(N),
          "Memory Access": "CUDA SRAM Shared Memory Atomic Add",
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "GPU Quantized Histogram Construction Kernel Entry",
    `Started GPU histogram construction kernel across ${N} samples and ${numBins} discrete uint8 bins.`,
    { numBins, N },
  );

  // Step 2: Init hist_G (2)
  addStep(
    2,
    `Zero-Initialize hist_G SRAM Buffer (${numBins} Bins)`,
    `Allocated ${numBins} floating point buckets for gradient histogram hist_G filled with 0.0.`,
    { numBins },
  );

  // Step 3: Init hist_H (3)
  addStep(
    3,
    `Zero-Initialize hist_H SRAM Buffer (${numBins} Bins)`,
    `Allocated ${numBins} floating point buckets for hessian histogram hist_H filled with 0.0.`,
    { numBins },
  );

  // Loop over samples (5..7)
  binIndices.forEach((bIdx, idx) => {
    const g = gradients[idx];
    const h = hessians[idx];

    addStep(
      5,
      `Sample ${idx + 1}/${N}: Read Bin uint8 Code b_idx = ${bIdx}`,
      `Loaded quantized bin code b_idx = ${bIdx} (gradient g = ${g.toFixed(2)}, hessian h = ${h.toFixed(2)}).`,
      { idx, b_idx: bIdx, g, h },
      bIdx,
    );

    histG[bIdx] += g;
    addStep(
      6,
      `CUDA Shared Memory Atomic Add: hist_G[${bIdx}] += ${g.toFixed(2)} -> ${histG[bIdx].toFixed(4)}`,
      `Accumulated gradient g = ${g.toFixed(2)} into hist_G[${bIdx}]: bucket value is now ${histG[bIdx].toFixed(4)}.`,
      { b_idx: bIdx, g, "hist_G[b_idx]": Math.round(histG[bIdx] * 10000) / 10000 },
      bIdx,
    );

    histH[bIdx] += h;
    addStep(
      7,
      `CUDA Shared Memory Atomic Add: hist_H[${bIdx}] += ${h.toFixed(2)} -> ${histH[bIdx].toFixed(4)}`,
      `Accumulated hessian h = ${h.toFixed(2)} into hist_H[${bIdx}]: bucket value is now ${histH[bIdx].toFixed(4)}.`,
      { b_idx: bIdx, h, "hist_H[b_idx]": Math.round(histH[bIdx] * 10000) / 10000 },
      bIdx,
    );
  });

  // Step 5: Round hist_G (9)
  const roundedG = histG.map((val) => Math.round(val * 10000) / 10000);
  addStep(
    9,
    "Round Gradient Histogram Values hist_G to 4 Decimal Places",
    `Rounded gradient histogram buckets: [${roundedG.map((v) => v.toFixed(4)).join(", ")}].`,
    { hist_G: JSON.stringify(roundedG) },
  );

  // Step 6: Round hist_H (10)
  const roundedH = histH.map((val) => Math.round(val * 10000) / 10000);
  addStep(
    10,
    "Round Hessian Histogram Values hist_H to 4 Decimal Places",
    `Rounded hessian histogram buckets: [${roundedH.map((v) => v.toFixed(4)).join(", ")}].`,
    { hist_H: JSON.stringify(roundedH) },
  );

  // Step 7: Return (11)
  addStep(
    11,
    "Execution Complete: Return (hist_G, hist_H)",
    `Successfully constructed ${numBins}-bin gradient and hessian histograms.`,
    { numBins, N, completed: true },
  );

  return steps;
};

const GPU_HIST_QUANTIZED_HISTOGRAM_TRIVIA: TriviaMeta = {
  skipLines: [4, 8],
  distractors: [
    "hist_G[b_idx] += 1.0",
    "hist_H[b_idx] = max(gradients)",
    "hist_G = bin_indices * gradients",
    "return sum(hist_G), sum(hist_H)",
  ],
  hints: [
    { line: 6, hint: "Atomic accumulation into gradient histogram bucket: hist_G[b_idx] += g." },
    { line: 7, hint: "Atomic accumulation into hessian histogram bucket: hist_H[b_idx] += h." },
  ],
  lineExplanations: {
    1: "Defines entry point for gpu_hist_build_histogram kernel function.",
    2: "Allocates gradient histogram buffer hist_G of size num_bins filled with zero floats.",
    3: "Allocates hessian histogram buffer hist_H of size num_bins filled with zero floats.",
    4: "Blank line before parallel atomic accumulation loop.",
    5: "Iterates over sample bin index b_idx, gradient g, and hessian h in zip(bin_indices, gradients, hessians).",
    6: "Accumulates gradient g into histogram bucket: hist_G[b_idx] += g.",
    7: "Accumulates hessian h into histogram bucket: hist_H[b_idx] += h.",
    8: "Blank line before rounding operations.",
    9: "Rounds gradient histogram bucket values to 4 decimal places.",
    10: "Rounds hessian histogram bucket values to 4 decimal places.",
    11: "Returns tuple of (hist_G, hist_H) histogram bucket arrays.",
  },
};

export const gpuHistQuantizedHistogramKernel: AlgorithmDefinition<GpuHistQuantizedHistogramInput> =
  {
    id: "gpu-hist-quantized-histogram-kernel",
    title: "GPU Quantized Histogram Construction Kernel",
    topicIds: ["ml_tree_ensembles", "advanced_range_queries"],
    difficulty: "Hard",
    description:
      "The GPU Quantized Histogram Construction Kernel implements the high-performance histogram building core utilized by **XGBoost (`tree_method='hist'`)** and **LightGBM**. Instead of sorting $N$ floating-point feature values in $O(N \\log N)$ time, the feature values are pre-quantized into discrete `uint8` bin codes ($B \\le 256$ bins). CUDA threads accumulate gradients $g_i$ and hessians $h_i$ into GPU SRAM shared memory histogram buckets in parallel $O(N)$ time.\n\n### Why It Exists\nExact greedy split search scales as $O(D \\cdot N \\log N)$, becoming a severe computational bottleneck for multi-million sample datasets. Quantized histogram construction reduces split search time from $O(D \\cdot N \\log N)$ to $O(D \\cdot N + D \\cdot B)$, accelerating GBDT training by **10x to 100x** on GPUs (NVIDIA A100, H100).\n\n### Mathematical Formulation\nGiven pre-quantized bin mapping $b: x_{i, j} \\to \\{0, 1, \\dots, B-1\\}$ for sample $i$ and feature $j$:\n\n$$1. \\quad \\text{hist}_G[b] = \\sum_{i \\in I, \\, b(x_{i,j}) = b} g_i \\quad (\\text{Gradient Histogram Bucket})$$\n\n$$2. \\quad \\text{hist}_H[b] = \\sum_{i \\in I, \\, b(x_{i,j}) = b} h_i \\quad (\\text{Hessian Histogram Bucket})$$\n\n$$3. \\quad G_{L, k} = \\sum_{b=0}^{k} \\text{hist}_G[b], \\quad H_{L, k} = \\sum_{b=0}^{k} \\text{hist}_H[b] \\quad (\\text{O(B) Prefix Sum Split Evaluation})$$\n\n### Step-by-Step Intuition\n1. **Feature Quantization**: Continuous feature values are mapped to $B=256$ discrete `uint8` bin codes using quantile binning.\n2. **Shared Memory Allocation**: Allocate fast $O(B)$ SRAM shared memory histogram buffers `hist_G` and `hist_H` per GPU Thread Block.\n3. **Parallel CUDA Atomic Addition**: Each CUDA warp thread reads sample $(g_i, h_i, b_i)$ and executes `atomicAdd(&hist_G[b_i], g_i)`.\n4. **Global Histogram Reduction**: Reduce block-level SRAM histograms into global VRAM DRAM memory.\n5. **O(B) Split Search**: Evaluate regularized XGBoost split gain across $B-1$ bin boundaries using prefix sums.\n\n### Key Trade-Offs & Hardware Execution\n- **Histogram Subtraction Trick**: For child nodes $L$ and $R$, if parent histogram $P$ and left child $L$ are known, right child histogram is computed in $O(B)$ time without scanning samples: $\\text{hist}_R = \\text{hist}_P - \\text{hist}_L$.\n- **Shared Memory Bank Conflicts**: Atomic additions into 256 shared memory bins can suffer from bank conflicts. Modern CUDA kernels use interleaved bin layouts (`hist[bin * WARP_SIZE + lane]`) to eliminate bank stalls.",
    constraints: [
      "1 <= N <= 10000000",
      "1 <= numBins <= 256",
      "binIndices elements are in [0, numBins-1]",
    ],
    examples: [
      {
        kind: "basic",
        title: "12-Sample 4-Bin Quantized Histogram Construction",
        inputDisplay: "12 samples, 4 discrete uint8 bins (0..3)",
        outputDisplay: "hist_G: [-1.4, 0.2, 0.6, 1.1], hist_H: [1.0, 0.75, 0.75, 0.5]",
        input: DEFAULT_GPU_HIST_INPUT,
        output: "([-1.4, 0.2, 0.6, 1.1], [1.0, 0.75, 0.75, 0.5])",
        explanation:
          "Accumulates 12 gradient and hessian pairs into 4 discrete histogram bin buckets in O(N) parallel time.",
      },
    ],
    code: GPU_HIST_QUANTIZED_HISTOGRAM_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(B)",
    complexityAnalysis: {
      time: "Linear in sample size $O(N)$ for histogram construction; evaluating split candidates takes $O(B)$ time.",
      space: "Requires $O(B)$ shared memory space for $B$ histogram bins ($B \\le 256$).",
    },
    topicGuide: {
      overview:
        "The GPU Quantized Histogram Construction Kernel builds gradient and hessian histograms for fast LightGBM and XGBoost tree training.",
      sections: [
        {
          heading: "Core Concept & Feature Quantization",
          body: "Histogram GBDTs quantize continuous feature values into B discrete uint8 bins (B=256). Parallel CUDA threads accumulate g_i and h_i into shared memory histogram buckets in O(N) time.",
        },
        {
          heading: "Histogram Subtraction Trick",
          body: "When splitting a node into children L and R, calculating hist_R = hist_Parent - hist_L takes O(B) time, cutting histogram construction time in half.",
        },
        {
          heading: "CUDA Shared Memory & Atomic Additions",
          body: "CUDA warps execute atomicAdd into SRAM shared memory buckets. Interleaved bin memory layouts prevent shared memory bank conflicts.",
        },
        {
          heading: "O(B) Prefix Sum Split Evaluation",
          body: "Evaluating split gains across B bin boundaries takes O(B) time instead of O(N log N), enabling 10x-100x speedups on massive datasets.",
        },
      ],
      keyTerms: [
        {
          term: "Histogram GBDT",
          definition:
            "Gradient Boosting decision tree algorithm (LightGBM, XGBoost hist) using binned feature histograms.",
        },
        {
          term: "Feature Quantization",
          definition:
            "Mapping continuous floating-point features into discrete uint8 bin codes (0..255).",
        },
        {
          term: "Histogram Subtraction",
          definition:
            "O(B) trick computing child histogram hist_R = hist_Parent - hist_L without scanning samples.",
        },
        {
          term: "SRAM Atomic Add",
          definition:
            "CUDA hardware instruction accumulating values into shared memory histogram buckets in parallel.",
        },
      ],
    },
    trivia: GPU_HIST_QUANTIZED_HISTOGRAM_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_GPU_HIST_INPUT,
    generateSteps: generateGpuHistSteps,
  };
