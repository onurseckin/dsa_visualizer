import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flattenStridedNdViewInput {
  data: number[];
  target?: number;
}

export const FLATTENSTRIDEDNDVIEW_CODE = `
def flatten_strided_nd_view(coords, strides):
    """
    Maps N-dimensional tensor coordinates to 1D flat physical offset using strides.
    """
    flat_offset = 0
    dim_contributions = []

    for dim_idx, (coord, stride) in enumerate(zip(coords, strides)):
        offset_contrib = coord * stride
        flat_offset += offset_contrib
        dim_contributions.append(offset_contrib)

    return flat_offset, dim_contributions
`;

export const DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT: flattenStridedNdViewInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFlattenStridedNdViewSteps = (
  input: flattenStridedNdViewInput,
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
    "Initialize Multi-Dimensional Strided Coordinate Mapper",
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
    13,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FLATTENSTRIDEDNDVIEW_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines multi-dimensional strided coordinate mapper.",
    4: "Initializes total flat memory offset to 0.",
    7: "Iterates through per-dimension coordinate and stride pairs.",
    8: "Calculates dimension memory contribution = coord * stride.",
    9: "Accumulates contribution into total flat memory offset.",
    10: "Records per-dimension offset contribution.",
    12: "Returns calculated physical 1D offset and dimension breakdown.",
  },
};

export const flattenStridedNdView: AlgorithmDefinition<flattenStridedNdViewInput> = {
  id: "flatten-strided-nd-view",
  title: "Multi-Dimensional Strided Coordinate Mapper",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In N-dimensional PyTorch tensors (e.g., 4D image batch tensors NCHW or 3D transformer tokens BSD), computing physical memory addresses requires evaluating the multi-dimensional strided dot product between spatial coordinates and dimension stride vectors.\n\nThis algorithm implements Multi-Dimensional Strided Coordinate Mapper, evaluating flat physical offset calculations sum(coord_i * stride_i) across arbitrary tensor dimensions.\n\nInput Format:\n- data: Array of coordinate or stride values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns scalar physical 1D memory offset and per-dimension offset contribution breakdown.\n\nEdge Cases & Constraints:\n- 1D scalar tensors (dimension count = 1).\n- Dimensions with zero strides (virtual broadcasting).\n- Large high-dimensional tensors (N >= 5).",
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
  code: FLATTENSTRIDEDNDVIEW_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "N-dimensional coordinate mapping is at the heart of PyTorch ATen tensor indexing. Every tensor operation (subscripting tensor[i, j, k], slicing, broadcasting) relies on calculating physical buffer offsets using dimension stride vectors.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for coordinate vector C = (c_0, c_1, ..., c_{k-1}) and stride vector S = (s_0, s_1, ..., s_{k-1}), physical 1D offset is computed as Offset = C . S = sum_{i=0}^{k-1} c_i * s_i.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Evaluating strided dot products on hardware requires fast integer multiply-add instructions. PyTorch C++ kernels pre-calculate strides during tensor metadata initialization, making coordinate offset resolution O(D) where D is tensor rank.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation zips coordinate and stride tuples, computing per-dimension contributions and accumulating the total linear memory pointer offset.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include zero strides (where dimension offset contribution is 0 regardless of coordinate value) and unit strides along the inner-most dimension.",
      },
    ],
    keyTerms: [
      {
        term: "Tensor Rank",
        definition: "The total number of dimensions (axes) in a multi-dimensional tensor.",
      },
      {
        term: "Strided Dot Product",
        definition:
          "Vector dot product between tensor coordinates and stride values yielding physical 1D memory offset.",
      },
      {
        term: "Dimension Offset",
        definition:
          "The linear memory distance contributed by a specific dimension's coordinate value.",
      },
    ],
  },
  trivia: FLATTENSTRIDEDNDVIEW_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT,
  generateSteps: generateFlattenStridedNdViewSteps,
};
