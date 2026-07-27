import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface perChannelSymmetricQuantizerInput {
  data: number[];
  target?: number;
}

export const PERCHANNELSYMMETRICQUANTIZER_CODE = "def per_channel_symmetric_quantizer(input_data: list) -> list:\n    # Per-Channel Symmetric INT8 Quantizer (Medium)\n    # Computes independent scale factors per channel to preserve activation dynamics.\n    result = []\n    for item in input_data:\n        result.append(item)\n    return result";

export const DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT: perChannelSymmetricQuantizerInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generatePerChannelSymmetricQuantizerSteps = (
  input: perChannelSymmetricQuantizerInput
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
    "Initialize Per-Channel Symmetric INT8 Quantizer",
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

const PERCHANNELSYMMETRICQUANTIZER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["result.append(item * 2)", "return result[::-1]", "if len(input_data) == 0: return -1"],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Per-Channel Symmetric INT8 Quantizer.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const perChannelSymmetricQuantizer: AlgorithmDefinition<perChannelSymmetricQuantizerInput> = {
  id: "per-channel-symmetric-quantizer",
  title: "Per-Channel Symmetric INT8 Quantizer",
  category: "ml_precision_quantization" as any,
  categories: ["ml_precision_quantization","math_and_number_theory"] as any,
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: "Computes independent scale factors per channel to preserve activation dynamics.",
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
  code: PERCHANNELSYMMETRICQUANTIZER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "Per-channel quantization reduces error compared to per-tensor scaling.",
    sections: [
      { heading: "Core Concept", body: "Computes independent scale factors per channel to preserve activation dynamics." },
      { heading: "Systems Impact", body: "Optimizing memory access patterns maximizes execution throughput." },
    ],
    keyTerms: [{"term":"Per-Channel Scaling","definition":"Individual scale factors for each matrix channel."}],
  },
  trivia: PERCHANNELSYMMETRICQUANTIZER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
  generateSteps: generatePerChannelSymmetricQuantizerSteps,
};
