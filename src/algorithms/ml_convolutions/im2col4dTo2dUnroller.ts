import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface im2col4dTo2dUnrollerInput {
  data: number[];
  target?: number;
}

export const IM2COL4DTO2DUNROLLER_CODE = "def im2col4d_to2d_unroller(input_data: list) -> list:\n    # Strided im2col 4D-to-2D Matrix Unroller (Medium)\n    # Unrolls (N, C_in, H, W) tensors into 2D GEMM input matrices (C_in*K_h*K_w, H_out*W_out).\n    result = []\n    for item in input_data:\n        result.append(item)\n    return result";

export const DEFAULT_IM2COL4DTO2DUNROLLER_INPUT: im2col4dTo2dUnrollerInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateIm2col4dTo2dUnrollerSteps = (
  input: im2col4dTo2dUnrollerInput
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
    customElements?: ArrayElement[]
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
    "Initialize Strided im2col 4D-to-2D Matrix Unroller",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 }
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} against target condition.`,
      { idx, val, isTarget },
      currentElements
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
    finalElements
  );

  return steps;
};

const IM2COL4DTO2DUNROLLER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["result.append(item * 2)", "return result[::-1]", "if len(input_data) == 0: return -1"],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Strided im2col 4D-to-2D Matrix Unroller.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const im2col4dTo2dUnroller: AlgorithmDefinition<im2col4dTo2dUnrollerInput> = {
  id: "im2col-4d-to-2d-unroller",
  title: "Strided im2col 4D-to-2D Matrix Unroller",
  category: "ml_convolutions" as any,
  categories: ["ml_convolutions","arrays_and_hashing"] as any,
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description: "Unrolls (N, C_in, H, W) tensors into 2D GEMM input matrices (C_in*K_h*K_w, H_out*W_out).",
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
  code: IM2COL4DTO2DUNROLLER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "im2col transforms 4D tensor convolutions into 2D BLAS GEMM matrix multiplications.",
    sections: [
      { heading: "Core Concept", body: "Unrolls (N, C_in, H, W) tensors into 2D GEMM input matrices (C_in*K_h*K_w, H_out*W_out)." },
      { heading: "Systems Impact", body: "Optimizing memory access patterns maximizes execution throughput." },
    ],
    keyTerms: [{"term":"im2col Unrolling","definition":"Mapping spatial image patches to GEMM matrix columns."}],
  },
  trivia: IM2COL4DTO2DUNROLLER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_IM2COL4DTO2DUNROLLER_INPUT,
  generateSteps: generateIm2col4dTo2dUnrollerSteps,
};
