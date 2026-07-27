import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const iterativeBpeVocabularyTrainer: AlgorithmDefinition<string> = {
  id: "iterativeBpeVocabularyTrainer",
  title: "Iterative BPE Vocabulary Trainer",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Medium",
  description: "Implements Iterative BPE Vocabulary Trainer for ML Tokenization.",
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
      explanation: "Standard input for Iterative BPE Vocabulary Trainer."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Iterative BPE Vocabulary Trainer."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Iterative BPE Vocabulary Trainer."
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
    time: "Time complexity analysis for Iterative BPE Vocabulary Trainer",
    space: "Space complexity analysis for Iterative BPE Vocabulary Trainer"
  },
  topicGuide: {
    overview: "Topic guide for Iterative BPE Vocabulary Trainer",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Iterative BPE Vocabulary Trainer."
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
          what: "Start Iterative BPE Vocabulary Trainer",
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
