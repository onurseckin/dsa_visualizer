import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const adjacentPairFrequencyCounter: AlgorithmDefinition<string> = {
  id: "adjacentPairFrequencyCounter",
  title: "Adjacent Pair Frequency Counter",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Easy",
  description: "Implements Adjacent Pair Frequency Counter for ML Tokenization.",
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
      explanation: "Standard input for Adjacent Pair Frequency Counter."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Adjacent Pair Frequency Counter."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Adjacent Pair Frequency Counter."
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
    time: "Time complexity analysis for Adjacent Pair Frequency Counter",
    space: "Space complexity analysis for Adjacent Pair Frequency Counter"
  },
  topicGuide: {
    overview: "Topic guide for Adjacent Pair Frequency Counter",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Adjacent Pair Frequency Counter."
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
          what: "Start Adjacent Pair Frequency Counter",
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
