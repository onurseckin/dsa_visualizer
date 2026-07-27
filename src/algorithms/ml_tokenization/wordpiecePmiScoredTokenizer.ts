import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const wordpiecePmiScoredTokenizer: AlgorithmDefinition<string> = {
  id: "wordpiecePmiScoredTokenizer",
  title: "WordPiece PMI-Scored Tokenizer",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Medium",
  description: "Implements WordPiece PMI-Scored Tokenizer for ML Tokenization.",
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
      explanation: "Standard input for WordPiece PMI-Scored Tokenizer."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for WordPiece PMI-Scored Tokenizer."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for WordPiece PMI-Scored Tokenizer."
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
    time: "Time complexity analysis for WordPiece PMI-Scored Tokenizer",
    space: "Space complexity analysis for WordPiece PMI-Scored Tokenizer"
  },
  topicGuide: {
    overview: "Topic guide for WordPiece PMI-Scored Tokenizer",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for WordPiece PMI-Scored Tokenizer."
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
          what: "Start WordPiece PMI-Scored Tokenizer",
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
