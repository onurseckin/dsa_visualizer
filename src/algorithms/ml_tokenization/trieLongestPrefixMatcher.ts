import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const trieLongestPrefixMatcher: AlgorithmDefinition<string> = {
  id: "trieLongestPrefixMatcher",
  title: "Trie Longest Prefix Matcher",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Medium",
  description: "Implements Trie Longest Prefix Matcher for ML Tokenization.",
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
      explanation: "Standard input for Trie Longest Prefix Matcher."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Trie Longest Prefix Matcher."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Trie Longest Prefix Matcher."
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
    time: "Time complexity analysis for Trie Longest Prefix Matcher",
    space: "Space complexity analysis for Trie Longest Prefix Matcher"
  },
  topicGuide: {
    overview: "Topic guide for Trie Longest Prefix Matcher",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Trie Longest Prefix Matcher."
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
          what: "Start Trie Longest Prefix Matcher",
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
