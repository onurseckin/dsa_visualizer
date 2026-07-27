import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const singlePassBpeMerger: AlgorithmDefinition<string> = {
  id: "singlePassBpeMerger",
  title: "Single-Pass BPE Merger",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Easy",
  description: "Implements Single-Pass BPE Merger for ML Tokenization.",
  isMlInfra: true,
  mlInfraLevel: 6,
  mlInfraCategory: "ml_tokenization",
  constraints: ["Input length >= 1"],
  examples: [
    {
      id: "basic",
      kind: "basic",
      title: "Basic Example",
      input: "hello world",
      output: "valid",
      explanation: "Standard input for Single-Pass BPE Merger."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Single-Pass BPE Merger."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Single-Pass BPE Merger."
    }
  ],
  code: `function processTokenization(input: string): string[] {
  // Simple mock implementation
  return input.split(" ");
}`,
  timeComplexity: {
    best: "O(1)",
    average: "O(N)",
    worst: "O(N)"
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Time complexity analysis for Single-Pass BPE Merger",
    space: "Space complexity analysis for Single-Pass BPE Merger"
  },
  topicGuide: {
    overview: "Topic guide for Single-Pass BPE Merger",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Single-Pass BPE Merger."
      }
    ]
  },
  defaultInput: "hello",
  generateSteps: (input: string): AlgorithmStep[] => {
    return [
      {
        stepIndex: 0,
        codeLine: 1,
        explanation: {
          what: "Start Single-Pass BPE Merger",
          why: "Initialize variables"
        },
        primarySnapshot: {
          kind: "array",
          elements: []
        },
        auxiliaryState: {
          customState: { info: "Started" }
        },
        variables: { input }
      }
    ];
  }
};
