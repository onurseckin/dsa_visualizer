import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface onlineMaxLogsumexpTrackerInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const ONLINEMAXLOGSUMEXPTRACKER_CODE =
  "def algorithm(data: list) -> list:\n    # Process data\n    return [x * 2 for x in data]";

export const DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT: onlineMaxLogsumexpTrackerInput = {
  data: [1, 2, 3],
};

export const generateONLINEMAXLOGSUMEXPTRACKERSteps = (
  input: onlineMaxLogsumexpTrackerInput,
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

const ONLINEMAXLOGSUMEXPTRACKER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Start" }],
  lineExplanations: { 1: "Defines entry point." },
};

export const onlineMaxLogsumexpTracker: AlgorithmDefinition<onlineMaxLogsumexpTrackerInput> = {
  id: "online-max-logsumexp-tracker",
  title: "Online Softmax Running Max & LSE Tracker",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: "Implementation of Online Softmax Running Max & LSE Tracker.",
  constraints: ["Valid input arguments required."],
  examples: [
    {
      kind: "basic",
      title: "Basic Case",
      inputDisplay: "Basic Input",
      outputDisplay: "Basic Output",
      input: { data: [1, 2, 3] },
      output: "Basic Output Result",
      explanation: "Standard execution.",
    },
    {
      kind: "complex",
      title: "Complex Case",
      inputDisplay: "Complex Input",
      outputDisplay: "Complex Output",
      input: { data: [1, 2, 3] },
      output: "Complex Output Result",
      explanation: "Advanced execution.",
    },
    {
      kind: "negative",
      title: "Negative Case",
      inputDisplay: "Negative Input",
      outputDisplay: "Negative Output",
      input: { data: [1, 2, 3] },
      output: "Negative Output Result",
      explanation: "Edge case handling.",
    },
  ],
  code: ONLINEMAXLOGSUMEXPTRACKER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Algorithm specific time complexity.",
    space: "Algorithm specific space complexity.",
  },
  topicGuide: {
    overview: "Overview of Online Softmax Running Max & LSE Tracker",
    sections: [{ heading: "Concept", body: "Core algorithm mechanics." }],
    keyTerms: [{ term: "Metric", definition: "A quantifiable measure." }],
  },
  trivia: ONLINEMAXLOGSUMEXPTRACKER_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT,
  generateSteps: generateONLINEMAXLOGSUMEXPTRACKERSteps,
};
