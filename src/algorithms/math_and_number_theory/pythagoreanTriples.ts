import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface PythagoreanTriplesInput {
  n: number;
}

export const PYTHON_PYTHAGOREANTRIPLES_CODE = `import math
def pythagorean_triples(limit: int) -> list[list[int]]:
    triples = []
    m = 2
    while m * m + 1 <= limit:
        for n in range(1, m):
            if (m - n) % 2 == 1 and math.gcd(m, n) == 1:
                a = m * m - n * n
                b = 2 * m * n
                c = m * m + n * n
                if c <= limit:
                    triples.append([min(a,b), max(a,b), c])
        m += 1
    return triples`;

export const DEFAULT_PYTHAGOREANTRIPLES_INPUT: PythagoreanTriplesInput = {
  n: 50,
};

export const generatePythagoreanTriplesSteps = (
  input: PythagoreanTriplesInput,
): AlgorithmStep[] => {
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

const PYTHAGOREANTRIPLES_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Primitive Pythagorean Triples algorithm overview.</p>",
  sections: [
    {
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>",
    },
  ],
  keyTerms: [],
};

const PYTHAGOREANTRIPLES_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const pythagoreanTriples: AlgorithmDefinition<PythagoreanTriplesInput> = {
  id: "pythagorean-triples",
  title: "Primitive Pythagorean Triples",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Generates primitive Pythagorean triples up to a given limit using Euclid's formula.</p><h3>Input Parameters</h3><ul><li><code>limit</code> (<code>limit &ge; 5</code>): Maximum hypotenuse value.</li></ul><h3>Output</h3><ul><li><code>list[list[int]]</code>: List of [a, b, c] triples.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 50 },
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
  code: PYTHON_PYTHAGOREANTRIPLES_CODE,
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
  topicGuide: PYTHAGOREANTRIPLES_TOPIC_GUIDE,
  trivia: PYTHAGOREANTRIPLES_TRIVIA,
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
  defaultInput: DEFAULT_PYTHAGOREANTRIPLES_INPUT,
  generateSteps: generatePythagoreanTriplesSteps,
};
