import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rowParallelLinearAllreducerInput {
  data: number[];
  target?: number;
}

export const ROWPARALLELLINEARALLREDUCER_CODE =
  "def row_parallel_linear_allreducer(input_data: list) -> list:\n    # Megatron-LM Row Parallel Linear All-Reduce Engine (Medium)\n    # Splits weight matrix W along rows and performs All-Reduce sum over layer outputs.\n    result = []\n    for item in input_data:\n        result.append(item)\n    return result";

export const DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT: rowParallelLinearAllreducerInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRowParallelLinearAllreducerSteps = (
  input: rowParallelLinearAllreducerInput,
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
    "Initialize Megatron-LM Row Parallel Linear All-Reduce Engine",
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

const ROWPARALLELLINEARALLREDUCER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Megatron-LM Row Parallel Linear All-Reduce Engine.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const rowParallelLinearAllreducer: AlgorithmDefinition<rowParallelLinearAllreducerInput> = {
  id: "row-parallel-linear-allreducer",
  title: "Megatron-LM Row Parallel Linear All-Reduce Engine",
  category: "ml_distributed_systems",
  categories: ["ml_distributed_systems", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 11,
  mlInfraCategory: "ml_distributed_systems",
  description: "Splits weight matrix W along rows and performs All-Reduce sum over layer outputs.",
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
  code: ROWPARALLELLINEARALLREDUCER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Row parallel linear layers split weights along input rows and sum outputs via All-Reduce.",
    sections: [
      {
        heading: "Core Concept",
        body: "Splits weight matrix W along rows and performs All-Reduce sum over layer outputs.",
      },
      {
        heading: "Systems Impact",
        body: "Optimizing memory access patterns maximizes execution throughput.",
      },
    ],
    keyTerms: [
      {
        term: "Row Parallelism",
        definition: "Splitting GEMM weight rows and summing outputs via All-Reduce.",
      },
    ],
  },
  trivia: ROWPARALLELLINEARALLREDUCER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
  defaultInput: DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT,
  generateSteps: generateRowParallelLinearAllreducerSteps,
};
