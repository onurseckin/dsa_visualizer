import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const characterFrequencyNgramCounter: AlgorithmDefinition<string> = {
  id: "characterFrequencyNgramCounter",
  title: "Character Frequency N-gram Counter",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Easy",
  description: "Implements Character Frequency N-gram Counter for ML Tokenization.",
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
      explanation: "Standard input for Character Frequency N-gram Counter."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Character Frequency N-gram Counter."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Character Frequency N-gram Counter."
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
    time: "Time complexity analysis for Character Frequency N-gram Counter",
    space: "Space complexity analysis for Character Frequency N-gram Counter"
  },
  topicGuide: {
    overview: "Topic guide for Character Frequency N-gram Counter",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Character Frequency N-gram Counter."
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
          what: "Start Character Frequency N-gram Counter",
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
