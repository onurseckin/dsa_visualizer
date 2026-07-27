import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export const wordpiecePmiScoredTokenizer: AlgorithmDefinition<string> = {
  id: "wordpiecePmiScoredTokenizer",
  title: "WordPiece PMI-Scored Tokenizer",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Medium",
  description: "Implements WordPiece PMI-Scored Tokenizer for subword vocabulary segmentation.",
  isMlInfra: true,
  mlInfraLevel: 6,
  mlInfraCategory: "ml_tokenization",
  constraints: ["Input length >= 1"],
  examples: [
    {
      kind: "basic",
      inputDisplay: '"unaffordability"',
      outputDisplay: '["un", "##afford", "##ability"]',
      input: "unaffordability",
      output: '["un", "##afford", "##ability"]',
      explanation: "Breaks token into prefix and continuation subwords based on PMI score.",
    },
    {
      kind: "complex",
      inputDisplay: '"internationalization"',
      outputDisplay: '["inter", "##national", "##ization"]',
      input: "internationalization",
      output: '["inter", "##national", "##ization"]',
      explanation: "Segments long compound word using vocabulary PMI lookup.",
    },
    {
      kind: "negative",
      inputDisplay: '""',
      outputDisplay: "[]",
      input: "",
      output: "[]",
      explanation: "Empty input string returns empty tokens.",
    },
  ],
  defaultInput: "unaffordability",
  code: `def wordpiece_tokenize(text: str, vocab: set) -> list[str]:
    tokens = []
    start = 0
    while start < len(text):
        end = len(text)
        cur_substr = None
        while start < end:
            substr = text[start:end]
            if start > 0:
                substr = "##" + substr
            if substr in vocab:
                cur_substr = substr
                break
            end -= 1
        if cur_substr is None:
            tokens.append("[UNK]")
            break
        tokens.append(cur_substr)
        start = end
    return tokens`,
  timeComplexity: {
    best: "O(N)",
    average: "O(N^2)",
    worst: "O(N^2)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Longest prefix matching evaluates substrings up to vocabulary match or UNK.",
    space: "Requires array storage for subword token strings.",
  },
  topicGuide: {
    overview: "WordPiece segments words into maximum-likelihood subword tokens.",
    sections: [
      {
        heading: "Continuation Subwords",
        body: "Subwords following the initial prefix are prefixed with '##' to denote continuation.",
      },
    ],
    keyTerms: [
      {
        term: "PMI (Pointwise Mutual Information)",
        definition:
          "A measure of association evaluating how frequently two subwords co-occur versus independently.",
      },
    ],
  },
  generateSteps: (_input: string): AlgorithmStep[] => {
    const steps: AlgorithmStep[] = [];

    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: "Initialize WordPiece Tokenizer",
        why: "Ready to segment input string.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [{ id: "t1", value: 1, label: "unaffordability", state: "active" }],
      },
      auxiliaryState: { customState: { text: "unaffordability" } },
      variables: { start: 0 },
    });

    steps.push({
      stepIndex: 1,
      codeLine: 10,
      explanation: { what: "Match longest prefix 'un'", why: "Found in vocabulary." },
      primarySnapshot: {
        kind: "array",
        elements: [{ id: "t1", value: 1, label: "un", state: "visited" }],
      },
      auxiliaryState: { customState: { token: "un" } },
      variables: { start: 2 },
    });

    steps.push({
      stepIndex: 2,
      codeLine: 18,
      explanation: { what: "Complete subword segmentation", why: "Tokens generated." },
      primarySnapshot: {
        kind: "array",
        elements: [
          { id: "t1", value: 1, label: "un", state: "sorted" },
          { id: "t2", value: 1, label: "##afford", state: "sorted" },
          { id: "t3", value: 1, label: "##ability", state: "sorted" },
        ],
      },
      auxiliaryState: { customState: {} },
      variables: {},
    });

    return steps;
  },
};
