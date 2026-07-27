import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const basicTrieInsertSearch: AlgorithmDefinition<string> = {
  id: "basicTrieInsertSearch",
  title: "Basic Trie Insert & Search",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Easy",
  description: "Implements Basic Trie Insert & Search for ML Tokenization.",
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
      explanation: "Standard input for Basic Trie Insert & Search."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Basic Trie Insert & Search."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Basic Trie Insert & Search."
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
    time: "Time complexity analysis for Basic Trie Insert & Search",
    space: "Space complexity analysis for Basic Trie Insert & Search"
  },
  topicGuide: {
    overview: "Topic guide for Basic Trie Insert & Search",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Basic Trie Insert & Search."
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
          what: "Start Basic Trie Insert & Search",
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
