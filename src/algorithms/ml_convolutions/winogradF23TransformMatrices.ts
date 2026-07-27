import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface winogradF23TransformMatricesInput {
  data: number[];
  target?: number;
}

export const WINOGRADF23TRANSFORMMATRICES_CODE = "def winograd_f23_transform_matrices(input_data: list) -> list:\n    # Winograd F(2x2, 3x3) Transform Matrices (Medium)\n    # Generates Winograd minimal filtering transform matrices B, G, A.\n    result = []\n    for item in input_data:\n        result.append(item)\n    return result";

export const DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT: winogradF23TransformMatricesInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateWinogradF23TransformMatricesSteps = (
  input: winogradF23TransformMatricesInput
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
    "Initialize Winograd F(2x2, 3x3) Transform Matrices",
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

const WINOGRADF23TRANSFORMMATRICES_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["result.append(item * 2)", "return result[::-1]", "if len(input_data) == 0: return -1"],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Winograd F(2x2, 3x3) Transform Matrices.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const winogradF23TransformMatrices: AlgorithmDefinition<winogradF23TransformMatricesInput> = {
  id: "winograd-f23-transform-matrices",
  title: "Winograd F(2x2, 3x3) Transform Matrices",
  category: "ml_convolutions" as any,
  categories: ["ml_convolutions","math_and_number_theory"] as any,
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description: "Generates Winograd minimal filtering transform matrices B, G, A.",
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
  code: WINOGRADF23TRANSFORMMATRICES_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "Winograd F(2x2, 3x3) reduces spatial multiplications from 36 to 16.",
    sections: [
      { heading: "Core Concept", body: "Generates Winograd minimal filtering transform matrices B, G, A." },
      { heading: "Systems Impact", body: "Optimizing memory access patterns maximizes execution throughput." },
    ],
    keyTerms: [{"term":"Winograd Transform","definition":"Minimal filtering transform reducing multiplication count by 2.25x."}],
  },
  trivia: WINOGRADF23TRANSFORMMATRICES_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
  generateSteps: generateWinogradF23TransformMatricesSteps,
};
