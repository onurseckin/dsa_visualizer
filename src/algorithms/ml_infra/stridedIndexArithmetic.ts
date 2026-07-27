import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface StridedIndexArithmeticInput {
  shape: number[];
  strides: number[];
  indices: number[];
}

export const STRIDED_INDEX_ARITHMETIC_CODE = `def strided_index_arithmetic(shape: list[int], strides: list[int], indices: list[int]) -> int:
    if len(shape) != len(strides) or len(shape) != len(indices):
        return -1
    ndim = len(shape)
    offset = 0
    for d in range(ndim):
        idx = indices[d]
        if idx < 0 or idx >= shape[d]:
            return -1  # Out of bounds
        offset += idx * strides[d]
    return offset`;

export const DEFAULT_STRIDED_INDEX_ARITHMETIC_INPUT: StridedIndexArithmeticInput = {
  shape: [2, 3, 4],
  strides: [12, 4, 1],
  indices: [1, 1, 2],
};

export const generateStridedIndexArithmeticSteps = (
  input: StridedIndexArithmeticInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { shape, strides, indices } = input;
  const ndim = shape.length;

  const elements: ArrayElement[] = shape.map((dimSize, idx) => ({
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
          shape: `[${shape.join(", ")}]`,
          strides: `[${strides.join(", ")}]`,
          indices: `[${indices.join(", ")}]`,
          offset: String(variables.offset ?? 0),
        },
      },
      variables,
    });
  };

  if (ndim !== strides.length || ndim !== indices.length || ndim === 0) {
    addStep(
      3,
      "Dimension mismatch or empty input",
      "Shape, strides, and indices arrays must have non-zero matching length.",
      { ndim, valid: false, offset: -1 },
    );
    return steps;
  }

  addStep(
    5,
    "Initialize strided index calculation",
    `Calculating 1D linear memory address for multi-index [${indices.join(
      ", ",
    )}] in ${ndim}D tensor.`,
    { ndim, offset: 0 },
  );

  let totalOffset = 0;

  for (let d = 0; d < ndim; d++) {
    const idx = indices[d];
    const dimBound = shape[d];
    const stride = strides[d];

    const currentEls: ArrayElement[] = elements.map((el, i) => {
      if (i === d) return { ...el, state: "active", pointers: [`Dim ${d}`] };
      if (i < d) return { ...el, state: "visited" };
      return { ...el, state: "default" };
    });

    addStep(
      8,
      `Check dimension ${d}: index ${idx} in bounds [0, ${dimBound})`,
      `Evaluating index ${idx} against dimension ${d} size ${dimBound}.`,
      { d, idx, shape_d: dimBound, stride_d: stride, offset: totalOffset },
      currentEls,
    );

    if (idx < 0 || idx >= dimBound) {
      const errEls: ArrayElement[] = currentEls.map((el, i) =>
        i === d ? { ...el, state: "compare", pointers: ["OOB"] } : el,
      );
      addStep(
        10,
        `Out of bounds at dimension ${d}`,
        `Index ${idx} is out of bounds for dimension size ${dimBound}. Returning -1.`,
        { d, idx, shape_d: dimBound, offset: -1 },
        errEls,
      );
      return steps;
    }

    const term = idx * stride;
    totalOffset += term;

    const termEls: ArrayElement[] = currentEls.map((el, i) =>
      i === d ? { ...el, state: "sorted", pointers: [`+${term}`] } : el,
    );

    addStep(
      11,
      `Accumulate dimension ${d} contribution: +${term}`,
      `Added ${idx} * ${stride} = ${term} to offset. Current total = ${totalOffset}.`,
      { d, idx, stride_d: stride, term, offset: totalOffset },
      termEls,
    );
  }

  const finalEls: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
    pointers: ["DONE"],
  }));

  addStep(
    12,
    `Final 1D offset computed: ${totalOffset}`,
    `Successfully mapped multi-index [${indices.join(", ")}] to linear memory location ${totalOffset}.`,
    { offset: totalOffset, complete: true },
    finalEls,
  );

  return steps;
};

export const STRIDED_INDEX_ARITHMETIC_TRIVIA: TriviaMeta = {
  skipLines: [2],
  hints: [
    { line: 7, hint: "Iterate through each tensor dimension" },
    { line: 11, hint: "Multiply coordinate index by dimension stride" },
  ],
  distractors: [
    "offset += idx / strides[d]",
    "if idx < 0 or idx > shape[d]:",
    "offset = sum(indices)",
  ],
};

export const stridedIndexArithmetic: AlgorithmDefinition<StridedIndexArithmeticInput> = {
  id: "strided-index-arithmetic",
  title: "Strided Index Arithmetic",
  category: "ml_tensor_algebra",
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Compute flat 1D buffer offsets from multi-dimensional tensor indices using dimension strides.",
  code: STRIDED_INDEX_ARITHMETIC_CODE,
  defaultInput: DEFAULT_STRIDED_INDEX_ARITHMETIC_INPUT,
  examples: [
    {
      kind: "basic",
      title: "3D Tensor Index Mapping",
      input: {
        shape: [2, 3, 4],
        strides: [12, 4, 1],
        indices: [1, 1, 2],
      },
      output: "18",
      explanation: "1*12 + 1*4 + 2*1 = 18.",
    },
    {
      kind: "complex",
      title: "Transposed Tensor Strides",
      input: {
        shape: [3, 2, 4],
        strides: [4, 12, 1],
        indices: [2, 1, 3],
      },
      output: "23",
      explanation: "Permuted strides yield 2*4 + 1*12 + 3*1 = 23.",
    },
    {
      kind: "negative",
      title: "Out of Bounds Index",
      input: {
        shape: [2, 3, 4],
        strides: [12, 4, 1],
        indices: [2, 0, 0],
      },
      output: "-1",
      explanation: "Index 2 exceeds dimension size 2 (valid indices are 0 and 1).",
    },
  ],
  timeComplexity: {
    best: "O(D)",
    average: "O(D)",
    worst: "O(D)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(D) operations where D is the number of tensor dimensions (rank).",
    space: "O(1) auxiliary memory.",
  },
  topicGuide: {
    overview:
      "Strided Index Arithmetic calculates flat 1D memory addresses from N-dimensional tensor coordinates. Tensors in PyTorch/NumPy avoid data copies during slicing or transpositions by modifying strides rather than reallocating buffer memory.",
    sections: [
      {
        heading: "Contiguous vs Non-Contiguous Strides",
        body: "A contiguous N-D tensor of shape (d0, d1, ..., dn) has strides sn=1, sn-1=dn, ..., s0=d1*...*dn. Slicing with step > 1 multiplies strides.",
      },
    ],
    keyTerms: [
      { term: "Rank / ndim", definition: "The number of dimensions of the tensor." },
      {
        term: "Stride",
        definition: "Memory step required to advance by 1 element along a given axis.",
      },
    ],
  },
  trivia: STRIDED_INDEX_ARITHMETIC_TRIVIA,
  generateSteps: generateStridedIndexArithmeticSteps,
};
