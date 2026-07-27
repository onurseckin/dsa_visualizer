import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv1dSharedMemoryScratchpadInput {
  signal?: number[];
  kernel?: number[];
  haloPad?: number;
  data?: number[];
  target?: number;
}

export const CONV1DSHAREDMEMORYSCRATCHPAD_CODE = `def conv1d_shared_memory_scratchpad(signal, kernel, halo_pad=1):
    """
    Loads halo padded 1D signal into SRAM scratchpad to compute shared memory 1D convolution.
    """
    n = len(signal)
    k_len = len(kernel)
    sram_tile = [0] * (n + 2 * halo_pad)
    for i in range(n):
        sram_tile[i + halo_pad] = signal[i]
    output = []
    for i in range(n):
        acc = 0
        for k in range(k_len):
            acc += sram_tile[i + k] * kernel[k]
        output.append(acc)
    return output, sram_tile`;

export const DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT: conv1dSharedMemoryScratchpadInput = {
  signal: [2, 4, 6, 8, 10],
  kernel: [1, 0, -1],
  haloPad: 1,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateConv1dSharedMemoryScratchpadSteps = (
  input: conv1dSharedMemoryScratchpadInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const signal = input.signal && input.signal.length > 0 ? input.signal : [2, 4, 6, 8, 10];
  const kernel = input.kernel && input.kernel.length > 0 ? input.kernel : [1, 0, -1];
  const haloPad = Math.max(input.haloPad ?? 1, 1);

  const n = signal.length;
  const kLen = kernel.length;
  const sramTileSize = n + 2 * haloPad;

  const sramTile: number[] = new Array(sramTileSize).fill(0);
  const output: number[] = [];

  const getMatrixSnapshot = (
    currentI?: number,
    currentK?: number,
    phase: string = "init",
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    const maxCols = sramTileSize;

    // Row 0: Input Signal
    for (let c = 0; c < maxCols; c++) {
      if (c < n) {
        cells.push({
          row: 0,
          col: c,
          value: signal[c],
          label: `Sig[${c}]`,
          state: currentI === c && phase.includes("load") ? "active" : "default",
        });
      } else {
        cells.push({
          row: 0,
          col: c,
          value: "-",
          label: "N/A",
          state: "inactive",
        });
      }
    }

    // Row 1: Kernel Filter
    for (let c = 0; c < maxCols; c++) {
      if (c < kLen) {
        cells.push({
          row: 1,
          col: c,
          value: kernel[c],
          label: `Ker[${c}]`,
          state: currentK === c ? "active" : "compared",
        });
      } else {
        cells.push({
          row: 1,
          col: c,
          value: "-",
          label: "N/A",
          state: "inactive",
        });
      }
    }

    // Row 2: SRAM Scratchpad Tile (Halo Padded)
    for (let c = 0; c < maxCols; c++) {
      let state: MatrixCellItem["state"] = "default";
      if (c < haloPad || c >= n + haloPad) {
        state = "inactive"; // Halo region
      } else if (phase.includes("load") && currentI !== undefined && c === currentI + haloPad) {
        state = "active";
      } else if (phase.includes("conv") && currentI !== undefined && currentK !== undefined) {
        if (c === currentI + currentK) {
          state = "pivot";
        }
      }

      cells.push({
        row: 2,
        col: c,
        value: sramTile[c],
        label: c < haloPad || c >= n + haloPad ? `Halo[${c}]` : `Tile[${c}]`,
        state,
      });
    }

    // Row 3: Convolution Output
    for (let c = 0; c < maxCols; c++) {
      if (c < n) {
        const hasVal = c < output.length;
        cells.push({
          row: 3,
          col: c,
          value: hasVal ? output[c] : "-",
          label: `Out[${c}]`,
          state: currentI === c && phase.includes("conv") ? "active" : hasVal ? "sorted" : "default",
        });
      } else {
        cells.push({
          row: 3,
          col: c,
          value: "-",
          label: "N/A",
          state: "inactive",
        });
      }
    }

    return {
      kind: "matrix",
      rows: 4,
      cols: maxCols,
      title: `1D Conv SRAM Scratchpad (N=${n}, K=${kLen}, Halo=${haloPad})`,
      rowHeaders: [
        "Input Signal",
        "Kernel Filter",
        "SRAM Tile (Halo Padded)",
        "Conv Output",
      ],
      colHeaders: Array.from({ length: maxCols }, (_, idx) => `Col ${idx}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentI?: number,
    currentK?: number,
    phase: string = "init",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getMatrixSnapshot(currentI, currentK, phase),
      auxiliaryState: {
        customState: {
          signal: `[${signal.join(", ")}]`,
          kernel: `[${kernel.join(", ")}]`,
          sramTile: `[${sramTile.join(", ")}]`,
          output: `[${output.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Line 1: Function setup
  addStep(
    1,
    "Initialize 1D Conv GPU SRAM Scratchpad Engine",
    "Setting up execution parameters and fast on-chip shared memory layout.",
    { n, k_len: kLen, halo_pad: haloPad },
    undefined,
    undefined,
    "init",
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Loads halo padded 1D signal into SRAM scratchpad to compute shared memory 1D con",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Line 5: Signal length
  addStep(
    5,
    "Read Input Signal Length",
    `Input signal contains ${n} scalar samples.`,
    { n },
    undefined,
    undefined,
    "init",
  );

  // Line 6: Kernel length
  addStep(
    6,
    "Read Kernel Filter Length",
    `Convolution kernel filter contains ${kLen} weights.`,
    { k_len: kLen },
    undefined,
    undefined,
    "init",
  );

  // Line 7: Allocate SRAM tile
  addStep(
    7,
    "Allocate Shared Memory (SRAM) Tile Buffer",
    `Allocated sram_tile array of size ${sramTileSize} (${n} signal + 2*${haloPad} halo boundary slots).`,
    { sram_tile_size: sramTileSize },
    undefined,
    undefined,
    "init",
  );

  // Lines 8-9: Load signal into SRAM scratchpad
  for (let i = 0; i < n; i++) {
    addStep(
      8,
      `Iterate Signal Load Loop (i=${i})`,
      `Preparing to load signal sample at index ${i} into SRAM scratchpad tile offset.`,
      { i, signal_val: signal[i] },
      i,
      undefined,
      "load_iter",
    );

    sramTile[i + haloPad] = signal[i];
    addStep(
      9,
      `Coalesced Write Signal[${i}] into SRAM Tile[${i + haloPad}]`,
      `Copied signal value ${signal[i]} to SRAM scratchpad position ${i + haloPad} (shifted by halo offset ${haloPad}).`,
      { i, sram_index: i + haloPad, val: signal[i] },
      i,
      undefined,
      "load_write",
    );
  }

  // Line 10: Init output list
  addStep(
    10,
    "Initialize Output Array",
    "Allocated array to accumulate 1D convolution dot products.",
    { output: "[]" },
    undefined,
    undefined,
    "conv_init",
  );

  // Lines 11-15: Convolution sliding window
  for (let i = 0; i < n; i++) {
    addStep(
      11,
      `Begin Convolution Window at Position i=${i}`,
      `Evaluating sliding kernel window centered over SRAM tile starting at offset ${i}.`,
      { i },
      i,
      undefined,
      "conv_window",
    );

    let acc = 0;
    addStep(
      12,
      `Initialize Accumulator acc = 0`,
      `Reset dot product accumulator to zero for output position ${i}.`,
      { i, acc },
      i,
      undefined,
      "conv_acc",
    );

    for (let k = 0; k < kLen; k++) {
      addStep(
        13,
        `Iterate Kernel Index k=${k}`,
        `Reading SRAM tile element at index ${i + k} and kernel weight at index ${k}.`,
        { i, k, tile_idx: i + k, kernel_val: kernel[k] },
        i,
        k,
        "conv_kernel_iter",
      );

      const term = sramTile[i + k] * kernel[k];
      acc += term;
      addStep(
        14,
        `Multiply-Accumulate (MAC): acc += Tile[${i + k}] * Ker[${k}]`,
        `Multiplied tile value ${sramTile[i + k]} by weight ${kernel[k]} (+${term}). Accumulator total = ${acc}.`,
        { i, k, tile_val: sramTile[i + k], kernel_val: kernel[k], term, acc },
        i,
        k,
        "conv_mac",
      );
    }

    output.push(acc);
    addStep(
      15,
      `Store Convolution Dot Product Output[${i}] = ${acc}`,
      `Appended final window dot product ${acc} to convolution result array.`,
      { i, acc, output: `[${output.join(", ")}]` },
      i,
      undefined,
      "conv_store",
    );
  }

  // Line 16: Return
  addStep(
    16,
    "1D Convolution Execution Complete",
    "Successfully computed 1D shared memory convolution via SRAM scratchpad.",
    { completed: true, output: `[${output.join(", ")}]` },
    undefined,
    undefined,
    "complete",
  );

  return steps;
};

const CONV1DSHAREDMEMORYSCRATCHPAD_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "acc += signal[i + k] * kernel[k]  # Uncached HBM access",
    "sram_tile = [0] * n  # Missing halo padding slots",
    "return output[::-1]",
  ],
  hints: [
    { line: 7, hint: "Allocate SRAM tile size as n + 2 * halo_pad to fit boundary halo elements." },
    { line: 14, hint: "Read window inputs directly from on-chip SRAM tile sram_tile[i + k] instead of HBM DRAM." },
  ],
  lineExplanations: {
    1: "Defines conv1d_shared_memory_scratchpad function taking signal, kernel, and halo_pad parameters.",
    2: "Starts docstring describing halo-padded 1D shared memory signal convolution.",
    3: "Explains caching signal and boundary halo values in SRAM to accelerate windowed reads.",
    4: "Closes function docstring.",
    5: "Gets input signal length n.",
    6: "Gets kernel filter length k_len.",
    7: "Allocates on-chip SRAM scratchpad tile sized to hold signal data plus left/right halo padding.",
    8: "Iterates through each element i of input signal array.",
    9: "Copies signal[i] into sram_tile at index shifted by halo_pad offset.",
    10: "Initializes empty output array for storing convolution dot products.",
    11: "Iterates through signal sliding window output positions i from 0 to n - 1.",
    12: "Resets dot product accumulator acc to zero for output position i.",
    13: "Iterates through kernel weight filter indices k from 0 to k_len - 1.",
    14: "Executes Multiply-Accumulate (MAC): multiplies SRAM tile entry sram_tile[i + k] by kernel[k].",
    15: "Appends completed window dot product accumulator value acc to output array.",
    16: "Returns computed 1D convolution output array and sram_tile scratchpad snapshot.",
  },
};

export const conv1dSharedMemoryScratchpad: AlgorithmDefinition<conv1dSharedMemoryScratchpadInput> = {
  id: "conv1d-shared-memory-scratchpad",
  title: "1D Conv GPU SRAM Scratchpad Simulator",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description: `1D convolutions in audio processing, speech recognition (e.g. Wav2Vec, Whisper), time-series neural networks, and NLP Conv1D layers repeatedly read overlapping signal elements across sliding kernel windows.

Reading signal elements repeatedly from High Bandwidth Memory (HBM/DRAM) introduces severe memory bandwidth bottlenecks. In CUDA GPU kernels, threads in a thread block cooperatively load the 1D signal tile along with boundary halo padding into fast on-chip shared memory (SRAM) scratchpads once. Subsequent sliding window dot products read exclusively from SRAM at $\\approx 19\\text{ TB/s}$ bandwidth instead of DRAM:
$$y[i] = \\sum_{k=0}^{K-1} \\text{SRAM}[i + k] \\times \\text{kernel}[k]$$

This algorithm simulates a 1D Convolution GPU SRAM Scratchpad step-by-step, visualizing signal loading, halo padding placement, tile storage, sliding multiply-accumulate (MAC) loops, and output generation.`,
  constraints: ["1 <= signal.length <= 1000", "1 <= kernel.length <= 32", "1 <= haloPad <= 4"],
  examples: [
    {
      kind: "basic",
      title: "Standard 1D Convolution with Halo Caching",
      inputDisplay: "signal = [2, 4, 6, 8, 10], kernel = [1, 0, -1], haloPad = 1",
      outputDisplay: "Output = [-4, -4, -4, -4, -4]",
      input: DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
      output: "Output = [-4, -4, -4, -4, -4]",
      explanation: "Loads 1D signal into SRAM scratchpad with halo slots and computes sliding window dot products.",
    },
    {
      kind: "complex",
      title: "Edge Detection Signal Filter",
      inputDisplay: "signal = [1, 1, 1, 5, 5, 5], kernel = [-1, 1]",
      outputDisplay: "Output = [0, 0, 4, 0, 0, 0]",
      input: { signal: [1, 1, 1, 5, 5, 5], kernel: [-1, 1], haloPad: 1 },
      output: "Output = [0, 0, 4, 0, 0, 0]",
      explanation: "Evaluates gradient edge detection over cached SRAM scratchpad tiles.",
    },
  ],
  code: CONV1DSHAREDMEMORYSCRATCHPAD_CODE,
  timeComplexity: { best: "O(N * K)", average: "O(N * K)", worst: "O(N * K)" },
  spaceComplexity: "O(N + K)",
  complexityAnalysis: {
    time: "Requires O(N) memory load steps into SRAM plus O(N * K) arithmetic MAC operations where N is signal length and K is kernel length.",
    space: "O(N + 2*Halo) shared memory allocation for the SRAM scratchpad tile.",
  },
  topicGuide: {
    overview:
      "Shared memory (SRAM) scratchpad caching is a fundamental CUDA programming pattern for stencil and convolution operators. By staging a tile of signal data along with boundary halo elements into shared memory cooperatively, threads in a block reduce High Bandwidth Memory (HBM) DRAM accesses from $\\mathcal{O}(N \\times K)$ down to $\\mathcal{O}(N)$.\n\nBecause GPU shared memory resides on the processor chip alongside SIMD vector execution units, memory accesses operate with sub-nanosecond latencies and multiterabyte-per-second bandwidth, completely removing memory stalls during sliding window compute loops.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "In a naive GPU 1D convolution kernel executing directly over DRAM, each output thread $i$ reads $K$ consecutive signal elements $X[i], X[i+1], \\dots, X[i+K-1]$. Across $N$ threads, the total number of DRAM memory transactions is $N \\times K$. By loading the data block into on-chip SRAM first, total DRAM accesses drop to $N + 2 \\times \\text{Halo}$. The reuse factor is $K$, directly multiplying arithmetic intensity under the Roofline model.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "SRAM scratchpad caching solves severe DRAM bandwidth congestion in 1D/2D/3D convolutions, audio DSP pipelines (Wav2Vec2, Tacotron), time-series forecasting models, and image processing filters. It is utilized throughout NVIDIA cuDNN, TensorRT, and PyTorch C++ ATen kernel backends.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Given signal `[2, 4, 6, 8, 10]`, kernel `[1, 0, -1]`, and `haloPad=1`: First, threads allocate SRAM tile of size $5 + 2 \\times 1 = 7$. Boundary slots `[0]` and `[6]` store halo zeroes, while slots `[1..5]` store signal values `[2, 4, 6, 8, 10]`. Next, for output index $i=0$, the kernel multiplies SRAM tile elements `[2, 4, 6]` by weights `[1, 0, -1]` yielding $2 \\times 1 + 4 \\times 0 + 6 \\times (-1) = -4$. All reads hit SRAM instantaneously.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "The trade-off of shared memory scratchpads is manual memory management and bank conflicts. GPU shared memory is divided into 32 memory banks. If multiple threads in a warp access different addresses mapping to the same bank, accesses are serialized (bank conflict). Contiguous linear loads with unit stride ensure conflict-free broadcast loading.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(N \\times K)$ arithmetic operations and $\\mathcal{O}(N)$ DRAM transfer steps. Space Complexity: $\\mathcal{O}(N + K)$ shared memory buffer space per CUDA thread block.",
      },
    ],
    keyTerms: [
      {
        term: "SRAM Scratchpad",
        definition:
          "Fast on-chip user-managed memory allocated per thread block on GPU Streaming Multiprocessors.",
      },
      {
        term: "Halo Padding",
        definition:
          "Boundary elements loaded around tile edges into shared memory to satisfy stencil window read boundaries.",
      },
      {
        term: "Multiply-Accumulate (MAC)",
        definition:
          "Hardware execution instruction computing a * b + c in a single clock cycle.",
      },
      {
        term: "Bank Conflict",
        definition:
          "Performance degradation occurring when multiple concurrent thread requests access distinct addresses in the same SRAM memory bank.",
      },
    ],
  },
  trivia: CONV1DSHAREDMEMORYSCRATCHPAD_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
  generateSteps: generateConv1dSharedMemoryScratchpadSteps,
};
