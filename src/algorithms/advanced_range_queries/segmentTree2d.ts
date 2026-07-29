import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SegmentTree2dInput {
  array: number[];
}

export const PYTHON_SEGMENT_TREE2D_CODE = `def segment_tree_2d(data: dict):
    pass
`;

export const DEFAULT_SEGMENT_TREE_2D_INPUT: SegmentTree2dInput = {
  array: [1, 2, 3],
};

export const generateSegmentTree2dSteps = (input: SegmentTree2dInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Phase 1: Intro
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: "Intro step for 2D Segment Tree.",
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
      narrative: "Walkthrough step for 2D Segment Tree.",
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

export const segmentTree2d: AlgorithmDefinition<SegmentTree2dInput> = {
  id: "segment-tree-2d",
  title: "2D Segment Tree",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description: "<p>Problem statement for 2D Segment Tree.</p>",
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
  code: PYTHON_SEGMENT_TREE2D_CODE,
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
  defaultInput: DEFAULT_SEGMENT_TREE_2D_INPUT,
  generateSteps: generateSegmentTree2dSteps,
};
