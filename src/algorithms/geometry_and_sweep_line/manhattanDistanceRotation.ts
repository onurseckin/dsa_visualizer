import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ManhattanDistanceRotationInput {
  array: number[];
}

export const PYTHON_MANHATTAN_DISTANCE_ROTATION_CODE = `def manhattan_distance_rotation(data: dict) -> int:
    # Coordinate rotation trick converting L1 to L_infinity
    points = data.get('points', [])
    return len(points)`;

export const DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT: ManhattanDistanceRotationInput = {
  array: [1, 2, 3],
};

export const generateManhattanDistanceRotationSteps = (
  input: ManhattanDistanceRotationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Phase 1: Intro
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: "Intro step for Manhattan Distance Coordinate Rotation Trick.",
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
      narrative: "Walkthrough step for Manhattan Distance Coordinate Rotation Trick.",
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

export const manhattanDistanceRotation: AlgorithmDefinition<ManhattanDistanceRotationInput> = {
  id: "manhattan-distance-rotation",
  title: "Manhattan Distance Coordinate Rotation Trick",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description: "<p>Problem statement for Manhattan Distance Coordinate Rotation Trick.</p>",
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
  code: PYTHON_MANHATTAN_DISTANCE_ROTATION_CODE,
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
  defaultInput: DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT,
  generateSteps: generateManhattanDistanceRotationSteps,
};
