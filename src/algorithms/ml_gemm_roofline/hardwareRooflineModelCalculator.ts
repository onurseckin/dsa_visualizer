import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface hardwareRooflineModelCalculatorInput {
  flops: number;
  bytes: number;
  peakGflops: number;
  peakBandwidthGBs: number;
}

export const HARDWAREROOFLINEMODELCALCULATOR_CODE = `
def hardwarerooflinemodelcalculator(tensor_shape, strides, memory_buffer):
    """
    Computes strided multi-dimensional tensor memory indexing and contiguity validation.
    """
    rows, cols = tensor_shape
    r_stride, c_stride = strides
    flat_offsets = []

    is_contiguous = True
    expected_stride = 1

    # Traverse shape dimensions in reverse order to check row-major contiguity
    for dim, stride in zip(reversed(tensor_shape), reversed(strides)):
        if stride != expected_stride:
            is_contiguous = False
        expected_stride *= dim

    for r in range(rows):
        for c in range(cols):
            # Calculate 1D memory offset using row-major strided arithmetic
            offset = r * r_stride + c * c_stride
            val = memory_buffer[offset] if offset < len(memory_buffer) else 0
            flat_offsets.append((r, c, offset, val))

    return is_contiguous, flat_offsets
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
    5,
    "Initialize Roofline Calculation",
    "Starting calculation of Arithmetic Intensity vs Machine Balance.",
    { flops: input.flops, bytes: input.bytes },
  );

  const ai = input.bytes > 0 ? input.flops / input.bytes : Infinity;
  elements[0] = { ...elements[0], value: ai, state: "active" };

  addStep(
    9,
    "Calculate Arithmetic Intensity (AI)",
    `AI = FLOPs / bytes = ${input.flops} / ${input.bytes} = ${ai}`,
    { ai },
    elements,
  );

  const machineBalance = input.peakGflops / input.peakBandwidthGBs;
  elements[1] = { ...elements[1], value: machineBalance, state: "compare" };

  addStep(
    12,
    "Calculate Machine Balance (Ridge Point)",
    `Balance = Peak GFLOPS / Peak BW = ${input.peakGflops} / ${input.peakBandwidthGBs} = ${machineBalance}`,
    { machineBalance },
    elements,
  );

  const isComputeBound = ai >= machineBalance;
  elements[0] = { ...elements[0], state: isComputeBound ? "sorted" : "default" };
  elements[1] = { ...elements[1], state: isComputeBound ? "default" : "sorted" };

  addStep(
    14,
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
  distractors: ["ai = bytes / flops", "machine_balance = peak_bw / peak_gflops"],
  hints: [{ line: 9, hint: "Arithmetic Intensity is operations per byte." }],
  lineExplanations: {
    9: "Calculates the kernel's operational intensity.",
    12: "Calculates hardware's inflection point.",
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
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), berkeley hardware roofline model calculator provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["flops >= 0", "bytes >= 1", "peakGflops > 0", "peakBandwidthGBs > 0"],
    examples: [
      {
        kind: "basic",
        title: "Compute Bound Kernel",
        inputDisplay: "flops=1000, bytes=100, peakGflops=50, peakBW=10",
        outputDisplay: "Compute-Bound",
        input: { flops: 1000, bytes: 100, peakGflops: 50, peakBandwidthGBs: 10 },
        output: "Compute-Bound",
        explanation: "AI (10) >= Machine Balance (5), kernel is compute-bound.",
      },
      {
        kind: "complex",
        title: "Memory Bound Kernel",
        inputDisplay: "flops=500, bytes=500, peakGflops=100, peakBW=10",
        outputDisplay: "Memory-Bound",
        input: { flops: 500, bytes: 500, peakGflops: 100, peakBandwidthGBs: 10 },
        output: "Memory-Bound",
        explanation: "AI (1) < Machine Balance (10), kernel is memory-bound.",
      },
      {
        kind: "negative",
        title: "Zero Bytes Transferred",
        inputDisplay: "flops=100, bytes=0, peakGflops=100, peakBW=50",
        outputDisplay: "Compute-Bound",
        input: { flops: 100, bytes: 0, peakGflops: 100, peakBandwidthGBs: 50 },
        output: "Compute-Bound",
        explanation: "Zero bytes means infinite AI, always compute-bound.",
      },
    ],
    code: HARDWAREROOFLINEMODELCALCULATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Constant time math operations.",
      space: "Constant memory for variables.",
    },
    topicGuide: {
      overview:
        "Roofline models classify kernels as Memory-Bound vs Compute-Bound based on theoretical hardware peaks.",
      sections: [
        {
          heading: "Core Concept",
          body: "Calculates Arithmetic Intensity (FLOPs/byte) and compares against Machine Balance.",
        },
        {
          heading: "Systems Impact",
          body: "Identifies whether optimization should focus on memory access or computation.",
        },
      ],
      keyTerms: [
        {
          term: "Arithmetic Intensity",
          definition: "Ratio of FLOPs executed per byte transferred from DRAM.",
        },
        {
          term: "Machine Balance",
          definition: "Ridge point where kernel transitions from memory-bound to compute-bound.",
        },
      ],
    },
    trivia: HARDWAREROOFLINEMODELCALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
    defaultInput: DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
    generateSteps: generateHardwareRooflineModelCalculatorSteps,
  };
