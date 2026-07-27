import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonSramSwizzledGemmKernelInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TRITONSRAMSWIZZLEDGEMMKERNEL_CODE =
  "def bank_conflict_swizzle(row: int, col: int, num_banks: int=32):\n    return (col ^ row) % num_banks";

export const DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT: tritonSramSwizzledGemmKernelInput = {
  row: 2,
  col: 4,
  num_banks: 32,
};

export const generateTRITONSRAMSWIZZLEDGEMMKERNELSteps = (
  input: tritonSramSwizzledGemmKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [1, 2, 3];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: { what: "Initialize algorithm", why: "Setting up memory and local vars." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e) => ({ ...e, pointers: ["init"] })),
    },
    auxiliaryState: {
      customState: { initialized: "true" },
    },
    variables: { active: true },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: { what: "Process data", why: "Applying algorithm logic." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e, idx) => ({ ...e, state: idx === 0 ? "active" : "compare" })),
    },
    auxiliaryState: {
      customState: { computing: "true" },
    },
    variables: { step: 1 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: { what: "Complete", why: "Returning result." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e) => ({ ...e, state: "sorted" })),
    },
    auxiliaryState: {
      customState: { done: "true" },
    },
    variables: { result: "calculated" },
  });

  return steps;
};

const TRITONSRAMSWIZZLEDGEMMKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Start" }],
  lineExplanations: { 1: "Defines entry point." },
};

export const tritonSramSwizzledGemmKernel: AlgorithmDefinition<tritonSramSwizzledGemmKernelInput> =
  {
    id: "triton-sram-swizzled-gemm-kernel",
    title: "Triton SRAM Swizzled Block GEMM Kernel",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description: "Implementation of Triton SRAM Swizzled Block GEMM Kernel.",
    constraints: ["Valid input arguments required."],
    examples: [
      {
        kind: "basic",
        title: "Basic Case",
        inputDisplay: "Basic Input",
        outputDisplay: "Basic Output",
        input: { row: 2, col: 4, num_banks: 32 },
        output: "Basic Output Result",
        explanation: "Standard execution.",
      },
      {
        kind: "complex",
        title: "Complex Case",
        inputDisplay: "Complex Input",
        outputDisplay: "Complex Output",
        input: { row: 2, col: 4, num_banks: 32 },
        output: "Complex Output Result",
        explanation: "Advanced execution.",
      },
      {
        kind: "negative",
        title: "Negative Case",
        inputDisplay: "Negative Input",
        outputDisplay: "Negative Output",
        input: { row: 2, col: 4, num_banks: 32 },
        output: "Negative Output Result",
        explanation: "Edge case handling.",
      },
    ],
    code: TRITONSRAMSWIZZLEDGEMMKERNEL_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Algorithm specific time complexity.",
      space: "Algorithm specific space complexity.",
    },
    topicGuide: {
      overview: "Overview of Triton SRAM Swizzled Block GEMM Kernel",
      sections: [{ heading: "Concept", body: "Core algorithm mechanics." }],
      keyTerms: [{ term: "Metric", definition: "A quantifiable measure." }],
    },
    trivia: TRITONSRAMSWIZZLEDGEMMKERNEL_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT,
    generateSteps: generateTRITONSRAMSWIZZLEDGEMMKERNELSteps,
  };
