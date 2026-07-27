import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface GpuHistQuantizedHistogramInput {
  binIndices: number[]; // uint8 bin codes (0..numBins-1) for N samples
  gradients: number[];
  hessians: number[];
  numBins: number;
}

export const DEFAULT_GPU_HIST_INPUT: GpuHistQuantizedHistogramInput = {
  binIndices: [0, 1, 0, 2, 1, 2, 0, 1],
  gradients: [-0.5, 0.2, -0.3, 0.8, 0.1, 0.6, -0.4, 0.3],
  hessians: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
  numBins: 3,
};

export const GPU_HIST_QUANTIZED_HISTOGRAM_CODE = `def gpu_hist_build_histogram(bin_indices: list[int], gradients: list[float], hessians: list[float], num_bins: int) -> tuple[list[float], list[float]]:
    """
    GPU Quantized Histogram Construction Kernel (XGBoost 'tree_method=hist' / LightGBM).
    Bins feature values into discrete uint8 bins (0..num_bins-1) and accumulates gradient G and hessian H sums
    into fast shared memory histogram buckets in parallel O(N) time.
    """
    hist_G = [0.0] * num_bins
    hist_H = [0.0] * num_bins

    # Parallel atomic accumulation per sample into bin buckets
    for b_idx, g, h in zip(bin_indices, gradients, hessians):
        hist_G[b_idx] += g
        hist_H[b_idx] += h

    hist_G = [round(g, 4) for g in hist_G]
    hist_H = [round(h, 4) for h in hist_H]
    return hist_G, hist_H`;

export const generateGpuHistSteps = (input: GpuHistQuantizedHistogramInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { binIndices, gradients, hessians, numBins } = input;
  let stepIndex = 0;

  const N = binIndices.length;
  const histG = new Array(numBins).fill(0.0);
  const histH = new Array(numBins).fill(0.0);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize GPU Quantized Histogram Kernel (numBins = ${numBins})`,
      why: `Accumulating gradients and hessians across N = ${N} quantized samples into ${numBins} histogram bin buckets in shared memory.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: binIndices.map((b, idx) => ({
        id: `s-${idx}`,
        value: b,
        label: `Sample ${idx} (Bin ${b})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        numBins: String(numBins),
        totalSamples: String(N),
        gpuKernel: "Shared Memory Atomic Addition",
        status: "Initialized",
      },
    },
    variables: { numBins, N },
  });

  for (let i = 0; i < N; i++) {
    const b = binIndices[i];
    const g = gradients[i];
    const h = hessians[i];

    histG[b] += g;
    histH[b] += h;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Sample ${i}: Bin ${b} Atomic Accumulation (g = ${g.toFixed(2)}, h = ${h.toFixed(2)})`,
        why: `Accumulated sample ${i} into histogram Bin ${b}. Updated Bin ${b} totals: G = ${histG[
          b
        ].toFixed(2)}, H = ${histH[b].toFixed(2)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: binIndices.map((bIdx, idx) => ({
          id: `s-${idx}`,
          value: bIdx,
          label: `S${idx} -> Bin ${bIdx}`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`Bin ${b}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeSample: `Sample ${i}`,
          targetBin: `Bin ${b}`,
          binGTotal: histG[b].toFixed(2),
          binHTotal: histH[b].toFixed(2),
        },
      },
      variables: { i, bin: b, g, h },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: "GPU Histogram Construction Kernel Complete",
      why: `Histogram built across ${numBins} bins: G = [${histG
        .map((g) => g.toFixed(2))
        .join(
          ", ",
        )}], H = [${histH.map((h) => h.toFixed(2)).join(", ")}]. Ready for O(numBins) split search!`,
    },
    primarySnapshot: {
      kind: "array",
      elements: histG.map((g, bIdx) => ({
        id: `bin-${bIdx}`,
        value: bIdx,
        label: `Bin ${bIdx}: G=${g.toFixed(2)}, H=${histH[bIdx].toFixed(2)}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        histG: histG.map((g) => g.toFixed(2)).join(", "),
        histH: histH.map((h) => h.toFixed(2)).join(", "),
        status: "Completed",
      },
    },
    variables: { numBins, complete: true },
  });

  return steps;
};

export const gpuHistQuantizedHistogramKernel: AlgorithmDefinition<GpuHistQuantizedHistogramInput> =
  {
    id: "gpuHistQuantizedHistogramKernel",
    title: "GPU Quantized Histogram Construction Kernel",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "Simulates GPU-accelerated quantized histogram building (XGBoost `tree_method='hist'`, LightGBM, CatBoost). Continuous feature values are pre-quantized into discrete 8-bit uint8 bins (0..255). Parallel GPU thread blocks accumulate sample gradients g_i and hessians h_i into shared memory histogram buckets in parallel O(N) time.\n\nInput Format:\n- binIndices: Array of quantized uint8 feature bin codes for N samples.\n- gradients: 1st order loss gradients g_i.\n- hessians: 2nd order loss hessians h_i.\n- numBins: Total histogram bin count B (typically 256).\n\nOutput Format:\n- Returns tuple (histogramG, histogramH).\n\nEdge Cases & Constraints:\n- Empty bin: Remains G = 0.0, H = 0.0.",
    constraints: ["0 <= binIndices[i] < numBins."],
    examples: [
      {
        kind: "basic",
        title: "Histogram Building across 8 Samples (3 Bins)",
        inputDisplay: "N = 8 samples, 3 bins, gradients & hessians",
        outputDisplay:
          "Bin 0: G = -1.2, H = 0.75 | Bin 1: G = 0.6, H = 0.75 | Bin 2: G = 1.4, H = 0.5",
        input: DEFAULT_GPU_HIST_INPUT,
        output: "G: [-1.2, 0.6, 1.4], H: [0.75, 0.75, 0.5]",
        explanation: "Accumulates sample gradients and hessians into 3 histogram bin buckets.",
      },
      {
        kind: "complex",
        title: "Single Bin Uniform Dataset",
        inputDisplay: "All samples in Bin 0",
        outputDisplay: "Bin 0 contains all G and H totals",
        input: {
          binIndices: [0, 0, 0],
          gradients: [1.0, 2.0, 3.0],
          hessians: [1.0, 1.0, 1.0],
          numBins: 2,
        },
        output: "Bin 0 G = 6.0, H = 3.0",
        explanation: "All values accumulate into Bin 0.",
      },
      {
        kind: "negative",
        title: "Zero Gradient Input",
        inputDisplay: "gradients = [0, 0, 0]",
        outputDisplay: "G = [0.0, 0.0]",
        input: {
          binIndices: [0, 1, 0],
          gradients: [0.0, 0.0, 0.0],
          hessians: [1.0, 1.0, 1.0],
          numBins: 2,
        },
        output: "G = [0.0, 0.0]",
        explanation: "Zero gradients yield zero G totals.",
      },
    ],
    defaultInput: DEFAULT_GPU_HIST_INPUT,
    code: GPU_HIST_QUANTIZED_HISTOGRAM_CODE,
    timeComplexity: {
      best: "O(N / CUDA_THREADS + numBins)",
      average: "O(N / CUDA_THREADS + numBins)",
      worst: "O(N + numBins)",
    },
    spaceComplexity: "O(numBins)",
    complexityAnalysis: {
      time: "O(N / CUDA_THREADS) parallel GPU thread block execution time, reducing split search time from O(N log N) to O(numBins).",
      space: "O(numBins) shared memory per GPU thread block to hold histogram G and H arrays.",
    },
    topicGuide: {
      overview:
        "Histogram-based decision tree algorithms (LightGBM Ke et al. 2017, XGBoost `tree_method='hist'`) bin continuous feature values into 256 discrete integer bins (uint8). This converts O(N log N) exact greedy sorting into O(N) GPU atomic histogram accumulation, enabling 10x-50x faster GBDT training.",
      sections: [
        {
          heading: "Overview & Feature Quantization",
          body: "Continuous features are binned using quantile sketches into B discrete bins (B = 256). During tree training, raw float32 features are never accessed; only 1-byte uint8 bin codes are read into L1 cache.",
        },
        {
          heading: "GPU Shared Memory Atomic Aggregation",
          body: "CUDA thread blocks load sample bin codes and accumulate gradients g_i and hessians h_i into fast on-chip SRAM via atomic add operations (`atomicAdd`).",
        },
        {
          heading: "Histogram Subtraction Trick",
          body: "Once the parent histogram Hist(Parent) and left child histogram Hist(Left) are built, the right child histogram is computed instantly via vector subtraction Hist(Right) = Hist(Parent) - Hist(Left), cutting histogram construction time in half.",
        },
        {
          heading: "Implementation Nuances & Memory Alignment",
          body: "To maximize CUDA memory throughput, bin indices are stored in contiguous 128-bit aligned vector loads, avoiding unaligned memory access overhead across GPU warps.",
        },
      ],
      keyTerms: [
        {
          term: "Feature Quantization",
          definition:
            "Discretizing continuous floating-point features into 256 integer bins (uint8).",
        },
        {
          term: "Histogram Building Kernel",
          definition:
            "Parallel GPU CUDA kernel accumulating sample gradients into histogram bin buckets.",
        },
        {
          term: "Histogram Subtraction Trick",
          definition:
            "Deriving a sibling node histogram by subtracting left child histogram from parent histogram.",
        },
        {
          term: "Shared Memory SRAM",
          definition:
            "On-chip GPU scratchpad memory providing high-bandwidth, low-latency storage for per-block histogram buckets.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "LightGBM & XGBoost GPU Histogram Architecture",
      },
    ],
    generateSteps: generateGpuHistSteps,
  };
