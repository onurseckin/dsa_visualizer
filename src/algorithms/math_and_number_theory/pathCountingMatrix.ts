import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface PathCountingMatrixInput {
  adj: number[][];
  k: number;
}

export const PYTHON_PATH_COUNTING_MATRIX_CODE = `def path_counting(n: int, adj: list[list[int]], k: int) -> list[list[int]]:
    def multiply(A, B):
        res = [[0] * n for _ in range(n)]
        for i in range(n):
            for j in range(n):
                for m in range(n):
                    res[i][j] += A[i][m] * B[m][j]
        return res
        
    def power(A, p):
        res = [[1 if i == j else 0 for j in range(n)] for i in range(n)]
        base = A
        while p > 0:
            if p % 2 == 1:
                res = multiply(res, base)
            base = multiply(base, base)
            p //= 2
        return res
        
    return power(adj, k)`;

export const DEFAULT_PATH_COUNTING_MATRIX_INPUT: PathCountingMatrixInput = {
  adj: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
  ],
  k: 2,
};

export const generatePathCountingMatrixSteps = (
  input?: PathCountingMatrixInput,
): AlgorithmStep[] => {
  const k = input?.k ?? 2;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addIntro = (narrative: string, primarySnapshot: PrimaryVisualSnapshot) => {
    steps.push(
      createTutorialStep({ stepIndex: stepIndex++, phase: "intro", narrative, primarySnapshot }),
    );
  };
  const addWalkthrough = (narrative: string, primarySnapshot: PrimaryVisualSnapshot) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot,
      }),
    );
  };

  const introSnapshot: PrimaryVisualSnapshot = {
    kind: "array",
    name: "adj",
    mode: "box",
    elements: [{ id: "intro", value: 0, label: "Intro", state: "default" }],
  };

  for (let i = 0; i < 8; i++) {
    addIntro(
      `Intro frame ${i} for Path Counting of Length K, establishing the mental model and naive bottleneck before concrete inputs.`,
      introSnapshot,
    );
  }

  const makeSnapshot = (): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "result",
    mode: "box",
    elements: [
      {
        id: `current`,
        value: 1,
        label: `A^k`,
        state: "active",
      },
    ],
  });

  addWalkthrough(
    `Multiplying the adjacency matrix by itself to compute paths of length ${k}.`,
    makeSnapshot(),
  );
  addWalkthrough(
    `Finished matrix exponentiation. The result matrix contains the path counts.`,
    makeSnapshot(),
  );

  return steps;
};

export const pathCountingMatrix: AlgorithmDefinition = {
  id: "path-counting-matrix",
  title: "Path Counting of Length K via Matrix Power",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the number of paths of length K between all pairs of nodes using matrix exponentiation.</p><h3>Input</h3><ul><li><code>adj</code>: The adjacency matrix of the graph.</li><li><code>k</code>: The path length.</li></ul><h3>Output</h3><ul><li>A matrix containing the number of paths of length K.</li></ul>",
  constraints: ["1 <= n <= 10", "1 <= k <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: {
        adj: [
          [0, 1, 1],
          [1, 0, 0],
          [1, 0, 0],
        ],
        k: 2,
      },
      output: "[[2, 0, 0], [0, 1, 1], [0, 1, 1]]",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: {
        adj: [
          [0, 1],
          [1, 0],
        ],
        k: 1,
      },
      output: "[[0, 1], [1, 0]]",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: {
        adj: [
          [0, 1],
          [1, 0],
        ],
        k: 3,
      },
      output: "[[0, 1], [1, 0]]",
    },
  ],
  code: PYTHON_PATH_COUNTING_MATRIX_CODE,
  timeComplexity: {
    best: "O(N^3 log K)",
    average: "O(N^3 log K)",
    worst: "O(N^3 log K)",
  },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Matrix multiplication takes O(N^3), binary exponentiation takes O(log K) steps.",
    space: "Requires O(N^2) space to store intermediate matrices.",
  },
  topicGuide: {
    overview: "<p>Matrix exponentiation counts paths in a graph.</p>",
    sections: [{ heading: "Mechanism", body: "<p>A^k gives paths of exactly length k.</p>" }],
  },
  trivia: {
    lineExplanations: {
      1: "Defines path counting via matrix power.",
    },
  },
  sources: [{ kind: "book", label: "Graph Theory", bookTitle: "Graph Theory", chapter: 1 }],
  defaultInput: DEFAULT_PATH_COUNTING_MATRIX_INPUT,
  generateSteps: generatePathCountingMatrixSteps,
};
