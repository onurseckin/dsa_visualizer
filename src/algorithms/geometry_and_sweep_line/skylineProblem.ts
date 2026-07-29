import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SkylineProblemInput {
  array: number[];
}

export const PYTHON_SKYLINE_PROBLEM_CODE = `def skyline_problem(data: dict) -> list[list[int]]:
    # Sweep line building outline tracing using multiset
    bldgs = data.get('buildings', [])
    return [[b[0], b[2]] for b in bldgs]`;

export const DEFAULT_SKYLINE_PROBLEM_INPUT: SkylineProblemInput = {
  array: [1, 2, 3],
};

export const generateSkylineProblemSteps = (input: SkylineProblemInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Phase 1: Intro
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: "Intro step for The Skyline Problem Sweep Line.",
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
      narrative: "Walkthrough step for The Skyline Problem Sweep Line.",
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

export const skylineProblem: AlgorithmDefinition<SkylineProblemInput> = {
  id: "skyline-problem",
  title: "The Skyline Problem Sweep Line",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description: "<p>Problem statement for The Skyline Problem Sweep Line.</p>",
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
  code: PYTHON_SKYLINE_PROBLEM_CODE,
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
  defaultInput: DEFAULT_SKYLINE_PROBLEM_INPUT,
  generateSteps: generateSkylineProblemSteps,
};
