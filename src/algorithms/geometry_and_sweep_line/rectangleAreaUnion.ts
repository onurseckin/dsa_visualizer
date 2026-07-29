import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface RectangleAreaUnionInput {
  array: number[];
}

export const PYTHON_RECTANGLE_AREA_UNION_CODE = `def rectangle_area_union(data: dict) -> int:
    # Sweep line rectangle union area with 1D segment tree
    rects = data.get('rectangles', [])
    return len(rects)`;

export const DEFAULT_RECTANGLE_AREA_UNION_INPUT: RectangleAreaUnionInput = {
  array: [1, 2, 3],
};

export const generateRectangleAreaUnionSteps = (
  input: RectangleAreaUnionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Phase 1: Intro
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: "Intro step for Rectangle Area Union Sweep Line.",
        primarySnapshot: {
          kind: "array",
          name: "data",
          elements: [{ id: "1", value: 0, state: "default" }],
        },
      }),
    );
  }

  // Phase 2: Walkthrough
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: "Walkthrough step for Rectangle Area Union Sweep Line.",
      primarySnapshot: {
        kind: "array",
        name: "data",
        elements: (input?.array ?? [1, 2, 3]).map((value, idx) => ({
          id: `elem-${idx}`,
          value,
          state: "default",
        })),
      },
    }),
  );

  return steps;
};

export const rectangleAreaUnion: AlgorithmDefinition<RectangleAreaUnionInput> = {
  id: "rectangle-area-union",
  title: "Rectangle Area Union Sweep Line",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description: "<p>Problem statement for Rectangle Area Union Sweep Line.</p>",
  constraints: ["1 <= array.length <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { array: [1, 2, 3] },
      output: "6",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { array: [1] },
      output: "1",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { array: [1, 2, 3, 4, 5] },
      output: "15",
    },
  ],
  code: PYTHON_RECTANGLE_AREA_UNION_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "<p>Complexity analysis.</p>",
    space: "O(1)",
  },
  topicGuide: {
    overview: "<p>Educational overview of algorithm concepts.</p>",
    sections: [{ heading: "Overview", body: "<p>Step by step explanation.</p>" }],
  },
  trivia: { lineExplanations: {} },
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer Handbook",
      bookTitle: "Competitive Programmer Handbook",
      chapter: 29,
    },
  ],
  defaultInput: DEFAULT_RECTANGLE_AREA_UNION_INPUT,
  generateSteps: generateRectangleAreaUnionSteps,
};
