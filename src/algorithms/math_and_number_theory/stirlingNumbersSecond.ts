import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface StirlingNumbersSecondInput {
  n: number;
  k: number;
}

export const PYTHON_STIRLING_NUMBERS_SECOND_CODE = `class Solution:
    def __init__(self):
        pass

    def stirlingSecond(self, n: int, k: int) -> int:
        dp = [[0] * (k + 1) for _ in range(n + 1)]
        dp[0][0] = 1
        for i in range(1, n + 1):
            for j in range(1, min(i, k) + 1):
                dp[i][j] = dp[i - 1][j - 1] + j * dp[i - 1][j]
        return dp[n][k]`;

export const DEFAULT_STIRLING_NUMBERS_SECOND_INPUT: StirlingNumbersSecondInput = { n: 4, k: 2 };

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introRows = [
    [[1, 0, 0]],
    [
      [1, 0, 0],
      [0, 1, 0],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 3],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 3],
      [0, 1, 7],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 3],
      [0, 1, 7],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 3],
      [0, 1, 7],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 3],
      [0, 1, 7],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 3],
      [0, 1, 7],
    ],
  ];

  const introNarratives = [
    "Stirling numbers of the second kind, written S(n, k), count the number of ways to partition a set of n labeled elements into k un-labeled, non-empty subsets.",
    "For example, partitioning 3 elements {1, 2, 3} into 2 subsets yields 3 partitions: {{1,2},{3}}, {{1,3},{2}}, and {{2,3},{1}}, so S(3, 2) = 3.",
    "To derive S(n, k), single out element n. Either element n forms its own singleton subset, or it joins one of the k existing non-empty subsets.",
    "If element n forms a new singleton subset {n}, the remaining n - 1 elements must be partitioned into k - 1 subsets, contributing S(n - 1, k - 1) ways.",
    "If element n joins one of the k existing subsets created by n - 1 elements, there are k choices, contributing k * S(n - 1, k) ways.",
    "Combining both cases yields the recurrence S(n, k) = k * S(n - 1, k) + S(n - 1, k - 1) for all n >= 1 and k >= 1.",
    "Base cases are S(0, 0) = 1 (empty partition), S(n, 0) = 0 for n > 0 (cannot form 0 subsets from n items), and S(n, k) = 0 for k > n.",
    "Constructing an (n+1) x (k+1) table allows bottom-up evaluation row by row from top to bottom.",
    "Populating the DP grid executes in O(n * k) time and O(n * k) space, which can be compressed to O(k) auxiliary space.",
  ];

  return introNarratives.map((narrative, idx) => {
    const mat = introRows[idx];
    const cells: MatrixCellItem[] = mat.flatMap((row, rIdx) =>
      row.map((val, cIdx) => {
        let state: MatrixCellItem["state"] = "default";
        if (idx === 5 && rIdx === 3 && (cIdx === 1 || cIdx === 2)) {
          state = "compared";
        } else if (idx === 5 && rIdx === 4 && cIdx === 2) {
          state = "active";
        } else if (idx === 6 && (rIdx === 0 || cIdx === 0)) {
          state = "active";
        } else if (idx === 7 && rIdx === 4 && cIdx === 2) {
          state = "active";
        } else if (idx === 8) {
          state = "sorted";
        } else if (rIdx === mat.length - 1) {
          state = "active";
        }
        return {
          row: rIdx,
          col: cIdx,
          value: val,
          label: `r${rIdx}c${cIdx}`,
          state,
        };
      }),
    );

    return createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "stirling_concept",
        rows: mat.length,
        cols: 3,
        cells,
        rowHeaders: mat.map((_, r) => `n=${r}`),
        colHeaders: ["k=0", "k=1", "k=2"],
      },
    });
  });
};

export const generateStirlingNumbersSecondSteps = (
  input?: StirlingNumbersSecondInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const safeInput = input ?? DEFAULT_STIRLING_NUMBERS_SECOND_INPUT;
  const safeN = Number.isFinite(safeInput?.n)
    ? Math.floor(safeInput.n)
    : DEFAULT_STIRLING_NUMBERS_SECOND_INPUT.n;
  const safeK = Number.isFinite(safeInput?.k)
    ? Math.floor(safeInput.k)
    : DEFAULT_STIRLING_NUMBERS_SECOND_INPUT.k;

  const nVal = Math.min(10, Math.max(0, safeN));
  const kVal = Math.min(nVal, Math.max(0, safeK));

  const dp: number[][] = Array.from({ length: nVal + 1 }, () => new Array(kVal + 1).fill(0));
  dp[0][0] = 1;

  const createMatrixSnapshot = (
    activeRow: number | null,
    activeCol: number | null,
    parent1: [number, number] | null = null,
    parent2: [number, number] | null = null,
    isDone: boolean = false,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r <= nVal; r++) {
      for (let c = 0; c <= kVal; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isDone && r === nVal && c === kVal) {
          state = "sorted";
        } else if (r === activeRow && c === activeCol) {
          state = "active";
        } else if (
          (parent1 && parent1[0] === r && parent1[1] === c) ||
          (parent2 && parent2[0] === r && parent2[1] === c)
        ) {
          state = "compared";
        } else if (dp[r][c] > 0 || (r === 0 && c === 0)) {
          state = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: dp[r][c],
          label: `S(${r},${c})`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      name: "stirling_matrix",
      rows: nVal + 1,
      cols: kVal + 1,
      cells,
      rowHeaders: Array.from({ length: nVal + 1 }, (_, i) => `n=${i}`),
      colHeaders: Array.from({ length: kVal + 1 }, (_, j) => `k=${j}`),
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize an (${nVal + 1}) x (${kVal + 1}) Stirling matrix with base case S(0, 0) = 1.`,
      primarySnapshot: createMatrixSnapshot(0, 0),
    }),
  );

  for (let i = 1; i <= nVal; i++) {
    for (let j = 0; j <= kVal; j++) {
      if (j === 0) {
        dp[i][0] = 0;
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Setting base case S(${i}, 0) = 0 (cannot partition ${i} items into 0 non-empty subsets).`,
            primarySnapshot: createMatrixSnapshot(i, 0),
          }),
        );
      } else if (j > i) {
        dp[i][j] = 0;
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Setting boundary S(${i}, ${j}) = 0 (cannot form ${j} subsets from ${i} items).`,
            primarySnapshot: createMatrixSnapshot(i, j),
          }),
        );
      } else {
        const p1Val = dp[i - 1][j];
        const p2Val = dp[i - 1][j - 1];
        const total = j * p1Val + p2Val;
        dp[i][j] = total;

        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Computing S(${i}, ${j}) = ${j} * S(${i - 1}, ${j}) + S(${i - 1}, ${j - 1}) = ${j} * ${p1Val} + ${p2Val} = ${total}.`,
            primarySnapshot: createMatrixSnapshot(i, j, [i - 1, j], [i - 1, j - 1]),
          }),
        );
      }
    }
  }

  const ans = dp[nVal][kVal];
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Stirling table evaluation complete: S(${nVal}, ${kVal}) = ${ans} ways to partition ${nVal} labeled items into ${kVal} non-empty subsets.`,
      primarySnapshot: createMatrixSnapshot(nVal, kVal, null, null, true),
    }),
  );

  return steps;
};

export const STIRLING_NUMBERS_SECOND_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Stirling numbers of the second kind S(n, k) count the number of ways to partition a set of n labeled elements into k unlabeled non-empty subsets.</p>",
  sections: [
    {
      heading: "Recurrence Relation",
      body: "<p>The fundamental recurrence S(n, k) = k * S(n - 1, k) + S(n - 1, k - 1) arises by isolating the n-th element: either it forms a new singleton subset (contributing S(n - 1, k - 1)) or joins one of the k existing non-empty subsets (contributing k * S(n - 1, k)).</p>",
    },
    {
      heading: "Dynamic Programming Table Fill",
      body: "<p>By constructing an (n + 1) x (k + 1) table and setting base cases S(0, 0) = 1 and S(n, 0) = 0, each cell S(i, j) is evaluated in O(1) time using previous row values.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Stirling Number of Second Kind",
      definition:
        "Count of set partitions of an n-element set into k non-empty subsets, written S(n, k) or {n choose k}.",
    },
    {
      term: "Set Partition",
      definition: "A collection of disjoint non-empty subsets whose union equals the original set.",
    },
    {
      term: "Singleton Choice",
      definition:
        "The recurrence sub-problem case where a designated element forms its own standalone subset.",
    },
  ],
};

export const STIRLING_NUMBERS_SECOND_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const stirlingNumbersSecond: AlgorithmDefinition<StirlingNumbersSecondInput> = {
  id: "stirling-numbers-second",
  title: "Stirling Numbers of the Second Kind",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the Stirling Number of the Second Kind <code>S(n, k)</code>, which counts the number of ways to partition a set of <code>n</code> labeled elements into <code>k</code> un-labeled non-empty subsets.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 0</code>): Number of labeled elements.</li>" +
    "<li><code>k</code> (<code>0 &le; k &le; n</code>): Number of non-empty subsets.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Value of <code>S(n, k)</code>.</li></ul>",
  constraints: ["0 <= n <= 10", "0 <= k <= n"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Partition S(4, 2)",
      inputDisplay: "n = 4, k = 2",
      outputDisplay: "7",
      input: { n: 4, k: 2 },
      output: "7",
      explanation: "7 ways to partition 4 elements into 2 non-empty subsets.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Boundary Case S(0, 0)",
      inputDisplay: "n = 0, k = 0",
      outputDisplay: "1",
      input: { n: 0, k: 0 },
      output: "1",
      explanation: "Empty set has 1 valid empty set partition.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Larger Partition S(5, 3)",
      inputDisplay: "n = 5, k = 3",
      outputDisplay: "25",
      input: { n: 5, k: 3 },
      output: "25",
      explanation: "25 ways to partition 5 elements into 3 non-empty subsets.",
    },
  ],
  code: PYTHON_STIRLING_NUMBERS_SECOND_CODE,
  timeComplexity: {
    best: "O(n*k)",
    average: "O(n*k)",
    worst: "O(n*k)",
  },
  spaceComplexity: "O(n*k)",
  complexityAnalysis: {
    time: "The dynamic programming table has size (n+1) x (k+1) where each cell takes O(1) time.",
    space: "Requires O(n*k) space for table storage.",
  },
  topicGuide: STIRLING_NUMBERS_SECOND_TOPIC_GUIDE,
  trivia: STIRLING_NUMBERS_SECOND_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      chapterTitle: "Combinatorics",
      section: "22.1 Binomial coefficients",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_STIRLING_NUMBERS_SECOND_INPUT,
  generateSteps: generateStirlingNumbersSecondSteps,
};

export default stirlingNumbersSecond;
