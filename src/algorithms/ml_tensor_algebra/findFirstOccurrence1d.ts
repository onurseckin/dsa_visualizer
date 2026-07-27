import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface findFirstOccurrence1dInput {
  data: number[];
  target?: number;
}

export const FINDFIRSTOCCURRENCE1D_CODE = `
def find_first_occurrence_1d(buffer, target, stride=1):
    """
    Performs strided 1D linear memory scan to locate target element offset.
    """
    n = len(buffer)
    match_index = -1

    for i in range(0, n, stride):
        val = buffer[i]
        if val == target:
            match_index = i
            break

    return match_index
`;

export const DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT: findFirstOccurrence1dInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFindFirstOccurrence1dSteps = (
  input: findFirstOccurrence1dInput,
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
    "Initialize Find First Occurrence in 1D Buffer",
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
    14,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FINDFIRSTOCCURRENCE1D_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines strided 1D search function.",
    4: "Gets buffer length N.",
    5: "Initializes match index result to -1 (not found).",
    7: "Iterates through buffer indices starting at 0 with step = stride.",
    8: "Reads scalar value at physical offset index i.",
    9: "Checks if value matches query target.",
    10: "Records matching physical index i.",
    11: "Exits loop immediately upon finding first match.",
    13: "Returns match index or -1 if target absent.",
  },
};

export const findFirstOccurrence1d: AlgorithmDefinition<findFirstOccurrence1dInput> = {
  id: "find-first-occurrence-1d",
  title: "Find First Occurrence in 1D Buffer",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In strided tensor indexing, search kernels, and payload metadata parsers, locate matching scalar markers or target tokens across non-contiguous memory layouts requires strided linear scans.\n\nThis algorithm implements Find First Occurrence in 1D Buffer, performing a strided search pass across a 1D memory array to find the first index matching a target query scalar.\n\nInput Format:\n- data: 1D numerical buffer array.\n- target: Target scalar search value.\n\nOutput Format:\n- Returns integer physical buffer offset index if found, or -1 if absent.\n\nEdge Cases & Constraints:\n- Target present at index 0.\n- Target absent from array (returns -1).\n- Strided steps hopping over target elements.",
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
  code: FINDFIRSTOCCURRENCE1D_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Strided 1D buffer search is a building block for tensor slicing, token matching in LLM tokenizers, and finding sentinel values in sparse tensor buffers. Efficient strided traversal ensures linear-time search without redundant element checks.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given a buffer of size N, stride S, and query target T, the search inspects indices i = 0, S, 2S, ..., stopping at the first index where buffer[i] == T. The time complexity is O(N / S) with O(1) auxiliary space.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "On modern CPU/GPU microarchitectures, strided access with stride S > 1 breaks spatial memory locality and SIMD vector loads. Increasing stride decreases L1 cache line utilization because unused adjacent bytes are fetched into cache lines.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation uses early loop termination upon target discovery to minimize instruction execution count. Boundary guards prevent indexing beyond buffer length N.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes target located at boundary elements (index 0 or last index), strides larger than buffer length, and empty buffers.",
      },
    ],
    keyTerms: [
      {
        term: "Strided Search",
        definition:
          "Scanning a memory array by advancing pointer positions by non-unit stride increments.",
      },
      {
        term: "Early Exit",
        definition:
          "Terminating search execution immediately once a target matching condition is met.",
      },
      {
        term: "Spatial Locality",
        definition:
          "The property where accessing a memory address makes adjacent memory addresses faster to access via CPU/GPU cache lines.",
      },
    ],
  },
  trivia: FINDFIRSTOCCURRENCE1D_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT,
  generateSteps: generateFindFirstOccurrence1dSteps,
};
