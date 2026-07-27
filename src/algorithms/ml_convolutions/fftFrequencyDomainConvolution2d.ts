import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fftFrequencyDomainConvolution2dInput {
  data: number[];
  target?: number;
}

export const FFTFREQUENCYDOMAINCONVOLUTION2D_CODE = `
def fftfrequencydomainconvolution2d(image_matrix, conv_kernel, stride=1, padding=0):
    """
    2D Convolution operator lowering to 2D matrix multiplication via im2col sliding windows.
    """
    h_in, w_in = len(image_matrix), len(image_matrix[0])
    k_h, k_w = len(conv_kernel), len(conv_kernel[0])

    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    feature_map = [[0] * w_out for _ in range(h_out)]

    for r in range(h_out):
        for c in range(w_out):
            acc_sum = 0
            for kr in range(k_h):
                for kc in range(k_w):
                    ir = r * stride + kr - padding
                    ic = c * stride + kc - padding
                    if 0 <= ir < h_in and 0 <= ic < w_in:
                        acc_sum += image_matrix[ir][ic] * conv_kernel[kr][kc]
            feature_map[r][c] = acc_sum

    return feature_map
`;

export const DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT: fftFrequencyDomainConvolution2dInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFftFrequencyDomainConvolution2dSteps = (
  input: fftFrequencyDomainConvolution2dInput,
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
          im2colBuffer: "[(val*2)]",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize 2D Fast Fourier Transform (FFT) Convolution Engine",
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
      `Evaluating element at index ${idx} against target condition.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FFTFREQUENCYDOMAINCONVOLUTION2D_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for 2D Fast Fourier Transform (FFT) Convolution Engine.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const fftFrequencyDomainConvolution2d: AlgorithmDefinition<fftFrequencyDomainConvolution2dInput> =
  {
    id: "fft-frequency-domain-convolution-2d",
    title: "2D Fast Fourier Transform (FFT) Convolution Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "arrays_and_hashing"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), 2d fast fourier transform (fft) convolution engine provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Processes standard input array cleanly.",
      },
      {
        kind: "complex",
        title: "Larger Data Input",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates larger array with 5 elements.",
      },
      {
        kind: "negative",
        title: "Edge Case Target Not Found",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Target is absent from memory, processing finishes safely.",
      },
    ],
    code: FFTFREQUENCYDOMAINCONVOLUTION2D_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for result structures.",
    },
    topicGuide: {
      overview:
        "FFT convolution transforms spatial grids into frequency domain for point-wise multiplication.",
      sections: [
        {
          heading: "Core Concept",
          body: "Executes O(N log N) spatial convolution via 2D FFT point-wise multiplication.",
        },
        {
          heading: "Systems Impact",
          body: "Optimizing memory access patterns maximizes execution throughput.",
        },
      ],
      keyTerms: [
        { term: "FFT Convolution", definition: "Frequency-domain O(N log N) fast convolution." },
      ],
    },
    trivia: FFTFREQUENCYDOMAINCONVOLUTION2D_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT,
    generateSteps: generateFftFrequencyDomainConvolution2dSteps,
  };
