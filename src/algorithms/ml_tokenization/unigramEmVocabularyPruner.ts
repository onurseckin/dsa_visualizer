import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const unigramEmVocabularyPruner: AlgorithmDefinition<string> = {
  id: "unigramEmVocabularyPruner",
  title: "Unigram EM Vocabulary Pruner",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Medium",
  description: "Implements Unigram EM Vocabulary Pruner for ML Tokenization.",
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
      explanation: "Standard input for Unigram EM Vocabulary Pruner."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Unigram EM Vocabulary Pruner."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Unigram EM Vocabulary Pruner."
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
    time: "Time complexity analysis for Unigram EM Vocabulary Pruner",
    space: "Space complexity analysis for Unigram EM Vocabulary Pruner"
  },
  topicGuide: {
    overview: "Topic guide for Unigram EM Vocabulary Pruner",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Unigram EM Vocabulary Pruner."
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
          what: "Start Unigram EM Vocabulary Pruner",
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
