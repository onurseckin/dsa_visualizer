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
      kind: "basic",
      inputDisplay: "Basic Input",
      outputDisplay: "Basic Output",
      input: "unaffordability",
      output: "Basic Success",
      explanation: "A simple clear basic example for iterativeBpeVocabularyTrainer.",
    },
    {
      kind: "complex",
      inputDisplay: "Complex Input",
      outputDisplay: "Complex Output",
      input: "unaffordability",
      output: "Complex Success",
      explanation: "A more intricate scenario with multiple elements.",
    },
    {
      kind: "negative",
      inputDisplay: "Empty Input",
      outputDisplay: "Empty Output",
      input: "unaffordability",
      output: "Empty",
      explanation: "Handling empty or invalid edge cases.",
    },
  ],
  defaultInput: "unaffordability",
  code: `
def iterativeBpeVocabularyTrainer(input_text, vocabulary_scores):
    """
    Iterative BPE Vocabulary Trainer
    Subword tokenization using dynamic programming lattice Viterbi decoding / BPE merge pairs.
    """
    text_len = len(input_text)
    dp_scores = [float('-inf')] * (text_len + 1)
    dp_scores[0] = 0.0
    backtrack = [0] * (text_len + 1)

    for i in range(1, text_len + 1):
        for j in range(i):
            subword = input_text[j:i]
            if subword in vocabulary_scores:
                candidate_score = dp_scores[j] + vocabulary_scores[subword]
                if candidate_score > dp_scores[i]:
                    dp_scores[i] = candidate_score
                    backtrack[i] = j

    cursor = text_len
    subword_sequence = []
    while cursor > 0:
        prev = backtrack[cursor]
        subword_sequence.append(input_text[prev:cursor])
        cursor = prev

    return subword_sequence[::-1]
`,
  timeComplexity: {
    best: "O(1)",
    average: "O(N log N)",
    worst: "O(N^2)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Time complexity heavily depends on the input size N.",
    space: "Requires O(N) auxiliary space for storing the intermediate processing states.",
  },
  topicGuide: {
    overview:
      "Comprehensive guide to iterativeBpeVocabularyTrainer in machine learning infrastructure.",
    sections: [
      {
        heading: "Core Concept",
        body: "The iterativeBpeVocabularyTrainer algorithm is a foundational component.",
      },
      {
        heading: "Mathematical Foundation",
        body: "It relies on well-established principles for its operation.",
      },
    ],
    keyTerms: [
      { term: "Node", definition: "A single unit of data or point in space." },
      { term: "Edge", definition: "A connection or transition between nodes." },
    ],
  },
  generateSteps: (_input: unknown) => {
    const steps: AlgorithmStep[] = [];

    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: { what: "Initialize algorithm", why: "To set up the initial state" },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { phase: "init" } },
      variables: { i: 0 },
    });

    steps.push({
      stepIndex: 1,
      codeLine: 4,
      explanation: { what: "Iterate over elements", why: "Processing each element" },
      primarySnapshot: {
        kind: "array",
        elements: [{ id: "el-1", value: 1, label: "node1", state: "active" }],
      },
      auxiliaryState: {},
      variables: { i: 1 },
    });

    steps.push({
      stepIndex: 2,
      codeLine: 6,
      explanation: { what: "Finish execution", why: "All elements processed" },
      primarySnapshot: {
        kind: "array",
        elements: [{ id: "el-1", value: 1, label: "node1", state: "sorted" }],
      },
      auxiliaryState: {},
      variables: { i: 1 },
    });

    return steps;
  },
};
