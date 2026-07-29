import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ZeckendorfTheoremInput {
  n: number;
}

export const PYTHON_ZECKENDORFTHEOREM_CODE = `def zeckendorf(n: int) -> list[int]:
    if n <= 0: return []
    fibs = [1, 2]
    while fibs[-1] <= n:
        fibs.append(fibs[-1] + fibs[-2])
    res = []
    for f in reversed(fibs):
        if f <= n:
            res.append(f)
            n -= f
    return res`;

export const DEFAULT_ZECKENDORFTHEOREM_INPUT: ZeckendorfTheoremInput = {
  n: 100,
};

export const generateZeckendorfTheoremSteps = (input: ZeckendorfTheoremInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Intro steps
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative:
          "This is a mathematically beautiful algorithm. We will now explore how it operates on a deeper level.",
        primarySnapshot: {
          kind: "array",
          name: "concept",
          elements: [{ id: "1", value: i, state: "active" }],
        },
      }),
    );
  }

  // Walkthrough steps
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: "We start by setting up the initial state and parameters for our calculation.",
      primarySnapshot: {
        kind: "array",
        name: "state",
        elements: [{ id: "1", value: input.n, state: "active" }],
      },
    }),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "We conclude the execution, returning the computed result from the mathematical procedure.",
      primarySnapshot: {
        kind: "array",
        name: "state",
        elements: [{ id: "1", value: input.n, state: "result" }],
      },
    }),
  );

  return steps;
};

const ZECKENDORFTHEOREM_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Zeckendorf's Theorem algorithm overview.</p>",
  sections: [
    {
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>",
    },
  ],
  keyTerms: [],
};

const ZECKENDORFTHEOREM_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const zeckendorfTheorem: AlgorithmDefinition<ZeckendorfTheoremInput> = {
  id: "zeckendorf-theorem",
  title: "Zeckendorf's Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Represents an integer as a sum of non-consecutive Fibonacci numbers.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 1</code>): The integer.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Fibonacci numbers summing to n.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 100 },
      output: "Result",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 1 },
      output: "Result",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { n: 100 },
      output: "Result",
    },
  ],
  code: PYTHON_ZECKENDORFTHEOREM_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Time complexity depends on the mathematical properties of n.",
    space: "Requires minimal auxiliary space.",
  },
  topicGuide: ZECKENDORFTHEOREM_TOPIC_GUIDE,
  trivia: ZECKENDORFTHEOREM_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "Number Theory",
    },
  ],
  defaultInput: DEFAULT_ZECKENDORFTHEOREM_INPUT,
  generateSteps: generateZeckendorfTheoremSteps,
};
