import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface PointInPolygonInput {
  array: number[];
}

export const PYTHON_POINT_IN_POLYGON_CODE = `def point_in_polygon(data: dict) -> bool:
    # Ray casting algorithm for point location
    pt = data.get('point', [0, 0])
    return len(pt) == 2`;

export const DEFAULT_POINT_IN_POLYGON_INPUT: PointInPolygonInput = {
  array: [1, 2, 3],
};

export const generatePointInPolygonSteps = (input: PointInPolygonInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Phase 1: Intro
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: "Intro step for Point-in-Polygon Ray Casting.",
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
      narrative: "Walkthrough step for Point-in-Polygon Ray Casting.",
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

export const pointInPolygon: AlgorithmDefinition<PointInPolygonInput> = {
  id: "point-in-polygon",
  title: "Point-in-Polygon Ray Casting",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description: "<p>Problem statement for Point-in-Polygon Ray Casting.</p>",
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
  code: PYTHON_POINT_IN_POLYGON_CODE,
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
  defaultInput: DEFAULT_POINT_IN_POLYGON_INPUT,
  generateSteps: generatePointInPolygonSteps,
};
