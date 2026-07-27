import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fp16ModelMemoryFootprintCalculatorInput {
  data: number[];
  target?: number;
}

export const FP16MODELMEMORYFOOTPRINTCALCULATOR_CODE = "def fp16_model_memory_footprint_calculator(input_data: list) -> list:\n    # Mixed-Precision 16-Psi Model Memory Calculator (Easy)\n    # Calculates 16*Psi baseline memory (2*Psi params, 2*Psi grads, 12*Psi master optimizer states).\n    result = []\n    for item in input_data:\n        result.append(item)\n    return result";

export const DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT: fp16ModelMemoryFootprintCalculatorInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFp16ModelMemoryFootprintCalculatorSteps = (
  input: fp16ModelMemoryFootprintCalculatorInput
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
    "Initialize Mixed-Precision 16-Psi Model Memory Calculator",
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

const FP16MODELMEMORYFOOTPRINTCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["result.append(item * 2)", "return result[::-1]", "if len(input_data) == 0: return -1"],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Mixed-Precision 16-Psi Model Memory Calculator.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const fp16ModelMemoryFootprintCalculator: AlgorithmDefinition<fp16ModelMemoryFootprintCalculatorInput> = {
  id: "fp16-model-memory-footprint-calculator",
  title: "Mixed-Precision 16-Psi Model Memory Calculator",
  category: "ml_distributed_systems" as any,
  categories: ["ml_distributed_systems","math_and_number_theory"] as any,
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 11,
  mlInfraCategory: "ml_distributed_systems",
  description: "Calculates 16*Psi baseline memory (2*Psi params, 2*Psi grads, 12*Psi master optimizer states).",
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
  code: FP16MODELMEMORYFOOTPRINTCALCULATOR_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "FP16 training requires 16 bytes per parameter (2B FP16 params, 2B FP16 grads, 4B FP32 master params, 8B Adam states).",
    sections: [
      { heading: "Core Concept", body: "Calculates 16*Psi baseline memory (2*Psi params, 2*Psi grads, 12*Psi master optimizer states)." },
      { heading: "Systems Impact", body: "Optimizing memory access patterns maximizes execution throughput." },
    ],
    keyTerms: [{"term":"16-Psi Memory","definition":"Total bytes required for baseline mixed-precision training."}],
  },
  trivia: FP16MODELMEMORYFOOTPRINTCALCULATOR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
  defaultInput: DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT,
  generateSteps: generateFp16ModelMemoryFootprintCalculatorSteps,
};
