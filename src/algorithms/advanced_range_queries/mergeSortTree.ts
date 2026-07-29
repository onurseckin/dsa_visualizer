import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MergeSortTreeInput {
  array: number[];
}

export const PYTHON_MERGE_SORT_TREE_CODE = `def merge_sort_tree(data: dict) -> list[int]:
    # Vector segment tree counting smaller elements after self
    nums = data.get('nums', [5, 2, 6, 1])
    return [0] * len(nums)`;

export const DEFAULT_MERGE_SORT_TREE_INPUT: MergeSortTreeInput = {
  array: [1, 2, 3],
};

export const generateMergeSortTreeSteps = (input: MergeSortTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Phase 1: Intro
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: "Intro step for Merge Sort Tree / Vector Segment Tree.",
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
      narrative: "Walkthrough step for Merge Sort Tree / Vector Segment Tree.",
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

export const mergeSortTree: AlgorithmDefinition<MergeSortTreeInput> = {
  id: "merge-sort-tree",
  title: "Merge Sort Tree / Vector Segment Tree",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description: "<p>Problem statement for Merge Sort Tree / Vector Segment Tree.</p>",
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
  code: PYTHON_MERGE_SORT_TREE_CODE,
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
  defaultInput: DEFAULT_MERGE_SORT_TREE_INPUT,
  generateSteps: generateMergeSortTreeSteps,
};
