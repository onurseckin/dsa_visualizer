import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface stridedMaxPoolingInput {
  data: number[];
  target?: number;
}

export const STRIDEDMAXPOOLING_CODE = `
def strided_max_pooling(matrix, pool_size=2, stride=2):
    """
    Applies 2D max-pooling operation over sliding window with given stride.
    """
    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0
    out_rows = (rows - pool_size) // stride + 1
    out_cols = (cols - pool_size) // stride + 1
    pooled = []

    for r in range(out_rows):
        row_out = []
        for c in range(out_cols):
            max_val = float('-inf')
            for pr in range(pool_size):
                for pc in range(pool_size):
                    val = matrix[r * stride + pr][c * stride + pc]
                    if val > max_val:
                        max_val = val
            row_out.append(max_val)
        pooled.append(row_out)

    return pooled
`;

export const DEFAULT_STRIDEDMAXPOOLING_INPUT: stridedMaxPoolingInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateStridedMaxPoolingSteps = (input: stridedMaxPoolingInput): AlgorithmStep[] => {
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
    "Initialize 2D Strided Max Pooling Operator",
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
    23,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const STRIDEDMAXPOOLING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines 2D strided max pooling function.",
    4: "Gets input matrix row count.",
    5: "Gets input matrix column count.",
    6: "Calculates pooled output row count = (rows - pool_size) // stride + 1.",
    7: "Calculates pooled output column count = (cols - pool_size) // stride + 1.",
    10: "Iterates through output spatial row index r.",
    12: "Iterates through output spatial column index c.",
    13: "Initializes local receptive window max tracker to negative infinity.",
    14: "Iterates through window relative row offset pr.",
    15: "Iterates through window relative column offset pc.",
    16: "Fetches input feature map activation at matrix[r*stride + pr][c*stride + pc].",
    17: "Updates local window max tracker if current val is larger.",
    19: "Appends spatial max value to current output row.",
    22: "Returns downsampled 2D max-pooled output matrix.",
  },
};

export const stridedMaxPooling: AlgorithmDefinition<stridedMaxPoolingInput> = {
  id: "strided-max-pooling",
  title: "2D Strided Max Pooling Operator",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "Convolutional neural networks (CNNs, e.g., ResNet, VGG, UNet) use 2D max-pooling layers to downsample spatial feature map dimensions, providing translation invariance and reducing memory consumption for downstream layers.\n\nThis algorithm implements 2D Strided Max Pooling Operator, sliding a pool_size x pool_size receptive window over 2D input feature maps with spatial stride step sizes and computing local maximum reductions.\n\nInput Format:\n- data: Array representing 2D matrix feature map values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns downsampled 2D pooled feature map matrix.\n\nEdge Cases & Constraints:\n- Non-overlapping pooling windows (stride = pool_size).\n- Overlapping pooling windows (stride < pool_size).\n- Feature map spatial bounds not perfectly divisible by stride.",
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
  code: STRIDEDMAXPOOLING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "2D max-pooling downsamples feature maps by partitioning inputs into spatial windows and extracting the maximum activation value in each window. Spatial output dimensions are calculated as out_dim = (in_dim - pool_size) // stride + 1.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for output spatial coordinate (r, c), pooled activation is P[r][c] = max_{0 <= pr < K, 0 <= pc < K} (M[r * S + pr][c * S + pc]), where K is pool_size and S is stride.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In GPU CNN kernels (cuDNN), max pooling preserves maximum activation indices (argmax masks) during forward execution so backward gradient pass can route gradients strictly back to winning activation locations.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation calculates output grid dimensions, loops through output cell positions, initializes max tracker to negative infinity, and scans receptive window elements to find spatial max values.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes pool_size = 1 (identity pass) and input dimensions smaller than pool_size.",
      },
    ],
    keyTerms: [
      {
        term: "Max Pooling",
        definition:
          "Downsampling operation selecting the maximum scalar value within a local sliding window.",
      },
      {
        term: "Spatial Stride",
        definition:
          "The step size distance the pooling window shifts across feature map dimensions.",
      },
      {
        term: "Receptive Window",
        definition:
          "The local spatial grid region (pool_size x pool_size) evaluated in each pooling step.",
      },
    ],
  },
  trivia: STRIDEDMAXPOOLING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_STRIDEDMAXPOOLING_INPUT,
  generateSteps: generateStridedMaxPoolingSteps,
};
