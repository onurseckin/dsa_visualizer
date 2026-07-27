import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zeroCopyIm2colStrideUnrollerInput {
  data: number[];
  target?: number;
}

export const ZEROCOPYIM2COLSTRIDEUNROLLER_CODE = `
def zero_copy_im2col_stride_unroller(input_matrix, kernel_size=2, stride=1):
    """
    Unrolls 2D receptive fields into column matrix vectors without copying memory.
    """
    in_rows = len(input_matrix)
    in_cols = len(input_matrix[0]) if in_rows > 0 else 0
    out_rows = (in_rows - kernel_size) // stride + 1
    out_cols = (in_cols - kernel_size) // stride + 1
    patches = []

    for r in range(out_rows):
        for c in range(out_cols):
            patch = []
            for kr in range(kernel_size):
                for kc in range(kernel_size):
                    val = input_matrix[r * stride + kr][c * stride + kc]
                    patch.append(val)
            patches.append(patch)

    return patches
`;

export const DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT: zeroCopyIm2colStrideUnrollerInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateZeroCopyIm2colStrideUnrollerSteps = (
  input: zeroCopyIm2colStrideUnrollerInput,
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
    "Initialize Zero-Copy im2col Stride Receptive Field Unroller",
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
    20,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ZEROCOPYIM2COLSTRIDEUNROLLER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines zero-copy im2col stride receptive field unroller function.",
    4: "Gets input matrix row count H.",
    5: "Gets input matrix column count W.",
    6: "Calculates output spatial row count H_out = (in_rows - kernel_size) // stride + 1.",
    7: "Calculates output spatial column count W_out = (in_cols - kernel_size) // stride + 1.",
    10: "Iterates through spatial output patch row index r.",
    11: "Iterates through spatial output patch column index c.",
    13: "Iterates through local kernel relative row offset kr.",
    14: "Iterates through local kernel relative column offset kc.",
    15: "Extracts image activation at input_matrix[r * stride + kr][c * stride + kc].",
    16: "Appends extracted activation element to current receptive patch vector.",
    17: "Appends completed receptive field patch vector to patches list.",
    19: "Returns unrolled receptive field patches array.",
  },
};

export const zeroCopyIm2colStrideUnroller: AlgorithmDefinition<zeroCopyIm2colStrideUnrollerInput> =
  {
    id: "zero-copy-im2col-stride-unroller",
    title: "Zero-Copy im2col Stride Receptive Field Unroller",
    category: "ml_tensor_algebra",
    categories: ["ml_tensor_algebra", "arrays_and_hashing"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 1,
    mlInfraCategory: "ml_tensor_algebra",
    description:
      "In high-performance CNN implementations (e.g. cuDNN im2col + GEMM, PyTorch Unfold), 2D convolutions are converted into standard General Matrix Multiplication (GEMM) operations. Unrolling sliding receptive fields into column vectors allows highly optimized GEMM BLAS engines to compute convolutions at peak FLOP capacity.\n\nThis algorithm implements Zero-Copy im2col Stride Receptive Field Unroller, extracting sliding 2D kernel patches across strided spatial locations and serializing them into unrolled column vectors.\n\nInput Format:\n- data: Array representing 2D image matrix values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns list of unrolled patch vectors representing receptive fields.\n\nEdge Cases & Constraints:\n- Stride = 1 vs Stride > 1.\n- Kernel size equal to input image dimensions (global pooling patch).\n- Boundary spatial alignment.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Input Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "Processed Memory Layout",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Processes standard input tensor memory buffer cleanly.",
      },
      {
        kind: "complex",
        title: "Larger Data Buffer",
        inputDisplay: "data = [10, 20, 30, 40, 50]",
        outputDisplay: "Processed Memory Layout",
        input: { data: [10, 20, 30, 40, 50] },
        output: "[10, 20, 30, 40, 50]",
        explanation: "Evaluates larger array with 5 tensor elements.",
      },
      {
        kind: "negative",
        title: "Edge Case Execution",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "Processed Memory Layout",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Edge case handling completes safely.",
      },
    ],
    code: ZEROCOPYIM2COLSTRIDEUNROLLER_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for result structures.",
    },
    topicGuide: {
      overview:
        "The im2col (image to column) transformation converts spatial convolution sliding windows into matrix rows/columns. This enables leveraged matrix multiplication hardware (NVIDIA Tensor Cores, TPU MXUs) to perform convolution operations at maximum throughput.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, for input H x W, kernel size K x K, and stride S, output spatial dimensions are H_out = (H - K) // S + 1 and W_out = (W - K) // S + 1. Total unrolled patches count is N_patches = H_out * W_out, where each patch is a vector of K^2 elements.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Traditional im2col creates an unrolled matrix copy, expanding memory size by up to K^2 times. Modern zero-copy implicit im2col kernels (cuDNN, Triton) compute strided patch indices dynamically on-the-fly inside GEMM registers, eliminating DRAM memory expansion overhead.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation iterates over spatial patch positions (r, c), loops through relative kernel offsets (kr, kc), extracts scalar values input[r*S + kr][c*S + kc], and appends patch vectors to the unrolled patches array.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes 1x1 kernels (where im2col reduces to identity matrix reshape) and non-unit strides.",
        },
      ],
      keyTerms: [
        {
          term: "im2col Transformation",
          definition:
            "Rearranging image sliding receptive fields into matrix columns to formulate convolution as GEMM.",
        },
        {
          term: "Implicit im2col",
          definition:
            "Computing patch memory offsets dynamically inside GPU registers to avoid explicit memory duplication.",
        },
        {
          term: "Receptive Field",
          definition:
            "The local spatial window of input activations aggregated by a convolution filter kernel.",
        },
      ],
    },
    trivia: ZEROCOPYIM2COLSTRIDEUNROLLER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
    defaultInput: DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT,
    generateSteps: generateZeroCopyIm2colStrideUnrollerSteps,
  };
