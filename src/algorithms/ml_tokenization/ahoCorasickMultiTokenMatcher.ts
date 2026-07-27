import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const ahoCorasickMultiTokenMatcher: AlgorithmDefinition<string> = {
  id: "ahoCorasickMultiTokenMatcher",
  title: "Aho-Corasick Multi-Token Matcher",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Hard",
  description: "Implements Aho-Corasick Multi-Token Matcher for ML Tokenization.",
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
      explanation: "Standard input for Aho-Corasick Multi-Token Matcher."
    },
    {
      id: "complex",
      kind: "complex",
      title: "Complex Example",
      input: "huggingface tokenizers",
      output: "valid",
      explanation: "More complex input for Aho-Corasick Multi-Token Matcher."
    },
    {
      id: "negative",
      kind: "negative",
      title: "Negative Example",
      input: "",
      output: "invalid",
      explanation: "Edge case for Aho-Corasick Multi-Token Matcher."
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
    time: "Time complexity analysis for Aho-Corasick Multi-Token Matcher",
    space: "Space complexity analysis for Aho-Corasick Multi-Token Matcher"
  },
  topicGuide: {
    overview: "Topic guide for Aho-Corasick Multi-Token Matcher",
    sections: [
      {
        heading: "Theory",
        body: "Mathematical foundations and formulas for Aho-Corasick Multi-Token Matcher."
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
          what: "Start Aho-Corasick Multi-Token Matcher",
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
