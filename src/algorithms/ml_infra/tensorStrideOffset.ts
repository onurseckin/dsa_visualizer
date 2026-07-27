import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TensorStrideOffsetInput {
  shape: [number, number, number, number];
  strides: [number, number, number, number];
  indices: [number, number, number, number];
}

export const TENSOR_STRIDE_OFFSET_CODE = `def tensor_stride_offset(shape: list[int], strides: list[int], indices: list[int]) -> int:
    ndim = len(shape)
    offset = 0
    for d in range(ndim):
        idx = indices[d]
        if idx < 0 or idx >= shape[d]:
            return -1  # Out of bounds
        offset += idx * strides[d]
    return offset`;

export const DEFAULT_TENSOR_STRIDE_OFFSET_INPUT: TensorStrideOffsetInput = {
  shape: [2, 3, 4, 4],
  strides: [48, 16, 4, 1],
  indices: [1, 2, 3, 1],
};

export const generateTensorStrideOffsetSteps = (
  input: TensorStrideOffsetInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dimNames = ["Dim 0 (N)", "Dim 1 (C)", "Dim 2 (H)", "Dim 3 (W)"];

  const elements: ArrayElement[] = input.shape.map((dimSize, idx) => ({
    id: `dim-${idx}`,
    value: dimSize,
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
          shape: `[${input.shape.join(", ")}]`,
          strides: `[${input.strides.join(", ")}]`,
          indices: `[${input.indices.join(", ")}]`,
          computedOffset: String(variables.offset ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize tensor offset calculation",
    `Calculating physical 1D memory offset for 4D indices [${input.indices.join(
      ", ",
    )}] given tensor shape [${input.shape.join(", ")}] and strides [${input.strides.join(", ")}].`,
    { ndim: 4, offset: 0 },
  );

  let runningOffset = 0;
  let oob = false;

  for (let d = 0; d < 4; d++) {
    const dimName = dimNames[d];
    const idx = input.indices[d];
    const size = input.shape[d];
    const stride = input.strides[d];

    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === d) {
        return { ...el, state: "active", pointers: [dimName] };
      }
      if (i < d) {
        return { ...el, state: "visited" };
      }
      return { ...el, state: "default" };
    });

    addStep(
      4,
      `Inspect dimension ${d}: ${dimName}`,
      `Checking dimension ${d} index=${idx}, size=${size}, stride=${stride}.`,
      { d, dimName, idx, shape_d: size, stride_d: stride, offset: runningOffset },
      currentElements,
    );

    if (idx < 0 || idx >= size) {
      oob = true;
      const errorElements: ArrayElement[] = currentElements.map((el, i) =>
        i === d ? { ...el, state: "compare", pointers: ["OUT OF BOUNDS"] } : el,
      );
      addStep(
        6,
        `Out of bounds detected at dimension ${d}`,
        `Index ${idx} is invalid for shape bound ${size}. Returning -1 to indicate memory fault.`,
        { d, idx, shape_d: size, offset: -1 },
        errorElements,
      );
      return steps;
    }

    const term = idx * stride;
    runningOffset += term;

    const updatedElements: ArrayElement[] = currentElements.map((el, i) =>
      i === d ? { ...el, state: "sorted", pointers: [`+${term}`] } : el,
    );

    addStep(
      7,
      `Accumulate offset: +${term} (running total = ${runningOffset})`,
      `Dimension ${d} contributes ${idx} * ${stride} = ${term} bytes/elements to the linear memory offset.`,
      { d, idx, stride_d: stride, term, offset: runningOffset },
      updatedElements,
    );
  }

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
    pointers: ["OFFSET DONE"],
  }));

  addStep(
    8,
    `Return final memory offset: ${runningOffset}`,
    `Successfully mapped 4D multi-index [${input.indices.join(
      ", ",
    )}] to flat 1D memory offset ${runningOffset}.`,
    { offset: runningOffset, valid: !oob },
    finalElements,
  );

  return steps;
};

const TENSOR_STRIDE_OFFSET_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "offset += idx + strides[d]",
    "offset += d * shape[d]",
    "if idx <= 0 or idx > shape[d]:",
    "return offset * strides[0]",
  ],
  hints: [
    {
      line: 5,
      hint: "Extract the coordinate index for the current dimension from the input multi-index.",
    },
    {
      line: 6,
      hint: "Validate that the index lies strictly within bounds [0, shape[d]).",
    },
    {
      line: 8,
      hint: "Multiply the dimension index by its corresponding stride value and add it to running offset.",
    },
  ],
  lineExplanations: {
    1: "Defines the 4D tensor stride & offset calculator accepting shape, strides, and indices.",
    2: "Determines the number of dimensions (4 for a 4D tensor).",
    3: "Initializes the 1D flat memory byte/element offset to 0.",
    4: "Iterates through each dimension from major (dimension 0) to minor (dimension 3).",
    5: "Reads the coordinate index for the current dimension.",
    6: "Performs boundary check against the tensor dimension size.",
    7: "Returns error code -1 on invalid out-of-bounds access.",
    8: "Scales index by stride and accumulates into linear offset.",
    9: "Returns the computed 1D linear buffer memory offset.",
  },
};

export const tensorStrideOffset: AlgorithmDefinition<TensorStrideOffsetInput> = {
  id: "tensor-stride-offset",
  title: "4D Tensor Stride & Memory Offset",
  category: "ml_tensor_algebra",
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  description:
    "Computes the 1D linear memory buffer offset for any multi-dimensional index in a 4D tensor given its shapes and strides (e.g., NCHW or NHWC layout).",
  constraints: [
    "len(shape) == 4",
    "len(strides) == 4",
    "len(indices) == 4",
    "shape[i] > 0 for all i",
  ],
  examples: [
    {
      kind: "basic",
      title: "Standard Contiguous NCHW Access",
      inputDisplay: "shape = [2, 3, 4, 4], strides = [48, 16, 4, 1], indices = [1, 2, 3, 1]",
      outputDisplay: "93",
      input: {
        shape: [2, 3, 4, 4],
        strides: [48, 16, 4, 1],
        indices: [1, 2, 3, 1],
      },
      output: "93",
      explanation: "Offset = 1*48 + 2*16 + 3*4 + 1*1 = 48 + 32 + 12 + 1 = 93.",
    },
    {
      kind: "complex",
      title: "Non-Contiguous Strided Tensor",
      inputDisplay: "shape = [4, 16, 32, 32], strides = [1, 4, 64, 2048], indices = [2, 8, 15, 10]",
      outputDisplay: "21474",
      input: {
        shape: [4, 16, 32, 32],
        strides: [1, 4, 64, 2048],
        indices: [2, 8, 15, 10],
      },
      output: "21474",
      explanation: "Offset = 2*1 + 8*4 + 15*64 + 10*2048 = 2 + 32 + 960 + 20480 = 21474.",
    },
    {
      kind: "negative",
      title: "Out-of-Bounds Index Access",
      inputDisplay: "shape = [2, 3, 4, 4], strides = [48, 16, 4, 1], indices = [2, 0, 0, 0]",
      outputDisplay: "-1",
      input: {
        shape: [2, 3, 4, 4],
        strides: [48, 16, 4, 1],
        indices: [2, 0, 0, 0],
      },
      output: "-1",
      explanation:
        "Index 2 at dimension 0 violates shape limit of 2 [valid indices 0..1], returning -1 error.",
    },
  ],
  code: TENSOR_STRIDE_OFFSET_CODE,
  timeComplexity: {
    best: "O(D)",
    average: "O(D)",
    worst: "O(D)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Requires a single linear pass over the tensor dimensions (D = 4 iterations), making calculation O(1) in practice.",
    space: "Uses constant auxiliary memory to store running sum and dimension metadata.",
  },
  topicGuide: {
    overview:
      "Tensors are stored in memory as flat 1D contiguous or non-contiguous byte buffers. High-level deep learning frameworks (PyTorch, Caffe, TensorFlow) map multi-dimensional coordinates (N, C, H, W) to flat 1D memory locations using stride vectors. Understanding stride arithmetic is fundamental to CUDA kernel indexing, zero-copy tensor transposition, and sub-tensor slicing.",
    sections: [
      {
        heading: "Contiguous vs. Non-Contiguous Layouts",
        body: "In a standard row-major 4D tensor (NCHW), the stride of the rightmost dimension is 1, and each preceding dimension stride is the cumulative product of subsequent dimension sizes. Transposing or permuting dimensions modifies the stride array without reallocating underlying buffer data.",
      },
      {
        heading: "Multi-Index Mapping Equation",
        body: "The flat offset formula for N-dimensional index i = (i_0, i_1, ..., i_{N-1}) with strides s = (s_0, s_1, ..., s_{N-1}) is Offset = sum_{d=0}^{N-1} i_d * s_d.",
      },
    ],
    keyTerms: [
      {
        term: "Stride",
        definition:
          "The number of elements/bytes in memory needed to advance by 1 position along a specific dimension.",
      },
      {
        term: "Contiguous Tensor",
        definition:
          "A tensor whose elements occupy adjacent memory addresses in standard major-to-minor dimension order.",
      },
    ],
  },
  trivia: TENSOR_STRIDE_OFFSET_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_TENSOR_STRIDE_OFFSET_INPUT,
  generateSteps: generateTensorStrideOffsetSteps,
};
