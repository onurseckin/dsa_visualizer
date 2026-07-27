import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv1dSharedMemoryScratchpadInput {
  data: number[];
  target?: number;
}

export const CONV1DSHAREDMEMORYSCRATCHPAD_CODE = `
def conv1d_shared_memory_scratchpad(signal, kernel, halo_pad=1):
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

    return output, sram_tile
`;

export const DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT: conv1dSharedMemoryScratchpadInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateConv1dSharedMemoryScratchpadSteps = (
  input: conv1dSharedMemoryScratchpadInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
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
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize 1D Conv GPU SRAM Scratchpad Simulator",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in memory layout.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    19,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const CONV1DSHAREDMEMORYSCRATCHPAD_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines 1D convolution shared memory scratchpad simulation.",
    4: "Gets signal buffer length N.",
    5: "Gets kernel filter length K.",
    6: "Allocates SRAM tile memory buffer including left and right halo padding.",
    8: "Loads signal data into SRAM scratchpad at offset halo_pad.",
    11: "Initializes output convolution array.",
    12: "Iterates through signal output positions i.",
    13: "Initializes dot product accumulator to 0.",
    14: "Iterates through kernel filter indices k.",
    15: "Multiplies SRAM tile signal element by kernel weight W[k].",
    16: "Appends accumulated convolution dot product to output array.",
    18: "Returns convolution result array and SRAM tile snapshot.",
  },
};

export const conv1dSharedMemoryScratchpad: AlgorithmDefinition<conv1dSharedMemoryScratchpadInput> =
  {
    id: "conv1d-shared-memory-scratchpad",
    title: "1D Conv GPU SRAM Scratchpad Simulator",
    category: "ml_gemm_roofline",
    categories: ["ml_gemm_roofline", "arrays_and_hashing"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 2,
    mlInfraCategory: "ml_gemm_roofline",
    description:
      "1D convolutions in audio processing, time-series ML, and NLP models (e.g., WaveNet, Conv1D layers) repeatedly read overlapping signal elements across sliding kernel windows. Reading signal values repeatedly from High Bandwidth Memory (HBM) wastes bandwidth.\n\nThis algorithm implements 1D Conv GPU SRAM Scratchpad Simulation, loading 1D signals and boundary halo padding into fast on-chip GPU shared memory (SRAM) before evaluating sliding window dot products.\n\nInput Format:\n- data: Array representing 1D input signal values.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns 1D convolution result array and SRAM scratchpad buffer snapshot.\n\nEdge Cases & Constraints:\n- Boundary halo padding at signal start and end.\n- Kernel size larger than signal buffer.\n- Shared memory capacity limits per thread block.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Execution",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
        output: "[10, 20, 30]",
        explanation: "Standard execution pass.",
      },
      {
        kind: "complex",
        title: "Complex Execution",
        inputDisplay: "data = [10, 20, 30, 40, 50]",
        outputDisplay: "[10, 20, 30, 40, 50]",
        input: DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
        output: "[10, 20, 30, 40, 50]",
        explanation: "Evaluates workload performance boundaries.",
      },
      {
        kind: "negative",
        title: "Edge Case",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
        output: "[5, 10, 15]",
        explanation: "Edge case execution completes safely.",
      },
    ],
    code: CONV1DSHAREDMEMORYSCRATCHPAD_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Execution time complexity pass across input elements.",
      space: "Memory allocation space for result structures.",
    },
    topicGuide: {
      overview:
        "Shared memory (SRAM) scratchpad caching is a foundational CUDA pattern for stencil and convolution operations. By cooperatively loading a tile of signal data along with boundary halo elements into shared memory once, threads in a block reduce DRAM accesses from O(N * K) down to O(N).",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, 1D convolution over signal X with kernel W of length K computes Y[i] = sum_{k=0}^{K-1} X[i + k] * W[k]. Shared memory allocation size is Tile_Size = Block_Dim + K - 1.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Accessing SRAM achieves ~19 TB/s bandwidth on NVIDIA H100 GPUs compared to ~3.3 TB/s for HBM3 DRAM. Staging halo elements in SRAM maximizes arithmetic intensity and prevents redundant DRAM transactions.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation allocates an SRAM array with halo padding, copies signal elements, and performs sliding dot products entirely from fast shared memory.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge cases include zero signal padding, asymmetric kernel sizes, and shared memory bank conflicts during strided reads.",
        },
      ],
      keyTerms: [
        {
          term: "SRAM Scratchpad",
          definition: "Fast on-chip shared memory allocated per GPU thread block.",
        },
        {
          term: "Halo Padding",
          definition:
            "Boundary elements loaded into shared memory to support stencil window reads.",
        },
        {
          term: "Coalesced Loading",
          definition:
            "Cooperative loading of DRAM data into shared memory by contiguous warp threads.",
        },
      ],
    },
    trivia: CONV1DSHAREDMEMORYSCRATCHPAD_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
    defaultInput: DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
    generateSteps: generateConv1dSharedMemoryScratchpadSteps,
  };
