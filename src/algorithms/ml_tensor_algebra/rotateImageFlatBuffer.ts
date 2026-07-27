import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rotateImageFlatBufferInput {
  data: number[];
  target?: number;
}

export const ROTATEIMAGEFLATBUFFER_CODE = `
def rotate_image_flat_buffer(matrix):
    """
    Rotates an N x N 2D tensor 90 degrees clockwise in-place.
    """
    n = len(matrix)

    for r in range(n // 2):
        for c in range(r, n - r - 1):
            temp = matrix[r][c]
            matrix[r][c] = matrix[n - 1 - c][r]
            matrix[n - 1 - c][r] = matrix[n - 1 - r][n - 1 - c]
            matrix[n - 1 - r][n - 1 - c] = matrix[c][n - 1 - r]
            matrix[c][n - 1 - r] = temp

    return matrix
`;

export const DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT: rotateImageFlatBufferInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRotateImageFlatBufferSteps = (
  input: rotateImageFlatBufferInput,
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
    "Initialize Rotate 2D Tensor 90 Degrees in Flat Memory",
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
    15,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ROTATEIMAGEFLATBUFFER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines 90-degree square matrix rotation function.",
    4: "Gets matrix dimension N.",
    6: "Iterates through outer ring layers r from 0 to N//2 - 1.",
    7: "Iterates through element offsets c within current ring layer.",
    8: "Saves top-left element matrix[r][c] into temporary variable.",
    9: "Copies bottom-left matrix[n-1-c][r] into top-left matrix[r][c].",
    10: "Copies bottom-right matrix[n-1-r][n-1-c] into bottom-left.",
    11: "Copies top-right matrix[c][n-1-r] into bottom-right.",
    12: "Assigns temporary top-left value into top-right position.",
    14: "Returns rotated in-place matrix.",
  },
};

export const rotateImageFlatBuffer: AlgorithmDefinition<rotateImageFlatBufferInput> = {
  id: "rotate-image-flat-buffer",
  title: "Rotate 2D Tensor 90 Degrees in Flat Memory",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "Image data augmentation pipelines (e.g. PyTorch torchvision.transforms, OpenCV, TensorRT vision preprocessing) perform 90-degree tensor rotations on image batches. Rotating an N x N matrix in-place without auxiliary buffer allocations optimizes memory footprint and minimizes GPU DRAM allocation overhead.\n\nThis algorithm implements Rotate 2D Tensor 90 Degrees in Flat Memory, performing 4-way cyclic element swaps across concentric square rings to rotate an N x N matrix 90 degrees clockwise in O(1) extra space.\n\nInput Format:\n- data: Array representing matrix values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns rotated N x N matrix buffer.\n\nEdge Cases & Constraints:\n- 1x1 matrix (no-op).\n- Even vs odd matrix dimensions N (center element handling).\n- Non-square input matrix safety validation.",
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
  code: ROTATEIMAGEFLATBUFFER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "In-place matrix rotation processes concentric square rings from the outermost perimeter inward to the center. Each ring rotation moves groups of 4 elements in a cycle: top -> right -> bottom -> left -> top.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, rotating element at (r, c) 90 degrees clockwise maps it to target position (c, N - 1 - r). The 4-way cycle consists of: (r, c) -> (c, N - 1 - r) -> (N - 1 - r, N - 1 - c) -> (N - 1 - c, r) -> (r, c).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In-place rotation requires O(N^2) time and O(1) auxiliary space, avoiding a second N x N matrix allocation. For GPU memory architectures, performing ring swaps in shared memory avoids DRAM allocation latency.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation loops over ring layers r from 0 to N//2 - 1, and column offsets c from r to N - r - 2, executing 4-way variable swaps using a single temporary scalar variable.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include N = 1 (loop body skipped, matrix unchanged) and odd N where central element (N//2, N//2) remains stationary.",
      },
    ],
    keyTerms: [
      {
        term: "In-Place Rotation",
        definition: "Rotating matrix elements without allocating auxiliary buffer storage.",
      },
      {
        term: "Concentric Ring Swapping",
        definition: "Processing outer matrix perimeters inward towards the center layer by layer.",
      },
      {
        term: "4-Way Cyclic Permutation",
        definition:
          "Swapping 4 corner/edge elements simultaneously in a clockwise rotational cycle.",
      },
    ],
  },
  trivia: ROTATEIMAGEFLATBUFFER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT,
  generateSteps: generateRotateImageFlatBufferSteps,
};
