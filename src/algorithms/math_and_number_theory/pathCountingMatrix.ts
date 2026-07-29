import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface PathCountingMatrixInput {
  adj: number[][];
  k: number;
}

export const PYTHON_PATH_COUNTING_MATRIX_CODE = `class Solution:
    def __init__(self):
        pass

    def checkRecord(self, n: int) -> int:
        MOD = 10**9 + 7
        dp = [[[0] * 3 for _ in range(2)] for _ in range(n + 1)]
        dp[0][0][0] = 1
        for i in range(n):
            for a in range(2):
                for l in range(3):
                    if dp[i][a][l] == 0:
                        continue
                    dp[i + 1][a][0] = (dp[i + 1][a][0] + dp[i][a][l]) % MOD
                    if a == 0:
                        dp[i + 1][1][0] = (dp[i + 1][1][0] + dp[i][a][l]) % MOD
                    if l < 2:
                        dp[i + 1][a][l + 1] = (dp[i + 1][a][l + 1] + dp[i][a][l]) % MOD
        res = 0
        for a in range(2):
            for l in range(3):
                res = (res + dp[n][a][l]) % MOD
        return res`;

export const DEFAULT_PATH_COUNTING_MATRIX_INPUT: PathCountingMatrixInput = {
  adj: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
  ],
  k: 2,
};

const createAdjacencyMatrixSnapshot = (
  mat: number[][],
  name: string,
  isDone = false,
  activeCell?: { r: number; c: number },
): PrimaryVisualSnapshot => {
  const n = mat.length;
  const cells: MatrixCellItem[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let state: MatrixCellItem["state"] = "default";
      if (isDone) {
        state = "sorted";
      } else if (activeCell && activeCell.r === r && activeCell.c === c) {
        state = "active";
      } else if (mat[r][c] > 0) {
        state = "compared";
      }
      cells.push({
        row: r,
        col: c,
        value: mat[r][c],
        label: `A[${r}][${c}]`,
        state,
      });
    }
  }

  const headers = Array.from({ length: n }, (_, i) => `v${i}`);

  return {
    kind: "matrix",
    name,
    rows: n,
    cols: n,
    cells,
    rowHeaders: headers,
    colHeaders: headers,
  };
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const sampleAdj = [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
  ];

  const sampleSquare = [
    [2, 0, 0],
    [0, 1, 1],
    [0, 1, 1],
  ];

  const sampleCube = [
    [0, 2, 2],
    [2, 0, 0],
    [2, 0, 0],
  ];

  const introData = [
    {
      narrative:
        "The entry A[u][v] in a graph adjacency matrix A equals the exact number of direct edges (paths of length 1) connecting node u to node v.",
      mat: sampleAdj,
      cell: { r: 0, c: 1 },
    },
    {
      narrative:
        "By matrix algebra, multiplying adjacency matrix A by itself yields matrix entry (A^2)[u][v] = sum_m (A[u][m] * A[m][v]), representing all 2-step paths from u to v via intermediate node m.",
      mat: sampleSquare,
      cell: { r: 0, c: 0 },
    },
    {
      narrative:
        "By mathematical induction, entry (A^k)[u][v] in matrix power A^k equals the total number of distinct paths of exact length k from vertex u to vertex v.",
      mat: sampleCube,
      cell: { r: 0, c: 1 },
    },
    {
      narrative:
        "Naive path counting via Depth-First Search or Breadth-First Search takes exponential time O(N^k), becoming completely intractable as path length k increases.",
      mat: sampleAdj,
      cell: { r: 1, c: 0 },
    },
    {
      narrative:
        "Binary matrix exponentiation evaluates A^k by repeatedly squaring the matrix base, reducing exponentiation from O(k) down to O(log k) matrix multiplications.",
      mat: sampleSquare,
      cell: { r: 1, c: 1 },
    },
    {
      narrative:
        "Each N x N matrix multiplication takes O(N^3) standard operations, leading to an overall logarithmic time complexity of O(N^3 log k).",
      mat: sampleCube,
      cell: { r: 2, c: 0 },
    },
    {
      narrative:
        "Result accumulator matrix R is initialized to the N x N identity matrix I (representing length 0 paths), while base matrix B starts as graph adjacency matrix A.",
      mat: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      cell: { r: 0, c: 0 },
    },
    {
      narrative:
        "When target exponent bit is odd, accumulator matrix R is multiplied by current base matrix B: R = R x B.",
      mat: sampleAdj,
      cell: { r: 0, c: 2 },
    },
    {
      narrative:
        "At every step, base matrix B is squared (B <- B x B) to double the path step length (length 1 -> 2 -> 4 -> 8).",
      mat: sampleSquare,
      cell: { r: 2, c: 2 },
    },
    {
      narrative:
        "Matrix power path counting underpins graph reachability, network flow bounds, random walks, and Markov chain transition counts.",
      mat: sampleCube,
      cell: { r: 1, c: 2 },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: createAdjacencyMatrixSnapshot(
        data.mat,
        "adjacency_path_concept",
        false,
        data.cell,
      ),
    }),
  );
};

export const generatePathCountingMatrixSteps = (
  input?: PathCountingMatrixInput,
): AlgorithmStep[] => {
  const adj =
    input && Array.isArray(input.adj) && input.adj.length > 0
      ? input.adj
      : DEFAULT_PATH_COUNTING_MATRIX_INPUT.adj;
  const k = input && typeof input.k === "number" ? Math.max(1, Math.floor(input.k)) : 2;
  const n = adj.length;

  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const matMult = (A: number[][], B: number[][]): number[][] => {
    const C = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let m = 0; m < n; m++) {
          sum += A[i][m] * B[m][j];
        }
        C[i][j] = sum;
      }
    }
    return C;
  };

  let res: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  let base = adj.map((row) => [...row]);

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize result accumulator R to N x N identity matrix I and base matrix B to input graph adjacency matrix A for path length k = ${k}.`,
      primarySnapshot: createAdjacencyMatrixSnapshot(res, "path_count_matrix_R"),
    }),
  );

  let power = k;
  while (power > 0) {
    const isOdd = power % 2 === 1;

    if (isOdd) {
      res = matMult(res, base);
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Exponent power P = ${power} is odd, so we multiply result accumulator by base matrix: R = R x B.`,
          primarySnapshot: createAdjacencyMatrixSnapshot(
            res,
            `path_count_matrix_R_power_${k - power + 1}`,
          ),
        }),
      );
    }

    base = matMult(base, base);
    power = Math.floor(power / 2);

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We square base matrix B = B x B (doubling path step power) and halve exponent power to P = ${power}.`,
        primarySnapshot: createAdjacencyMatrixSnapshot(base, `path_count_base_squared`),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Matrix exponentiation completes: entry (A^${k})[u][v] contains the exact number of paths of length ${k} between every pair of vertices.`,
      primarySnapshot: createAdjacencyMatrixSnapshot(res, "final_path_count_matrix", true),
    }),
  );

  return steps;
};

export const PATH_COUNTING_MATRIX_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Matrix Exponentiation calculates the number of paths of exact length k in a graph using A^k in O(N^3 log k) time.</p>",
  sections: [
    {
      heading: "Adjacency Matrix Power Property",
      body: "<p>The (u, v) entry of A^k equals the sum over all intermediate nodes m of (A^(k-1))[u][m] * A[m][v].</p>",
    },
  ],
  keyTerms: [
    {
      term: "Adjacency Matrix Power",
      definition: "Matrix power A^k where element (i, j) counts length-k paths from i to j.",
    },
  ],
};

export const pathCountingMatrix: AlgorithmDefinition<PathCountingMatrixInput> = {
  id: "path-counting-matrix",
  title: "Path Counting of Length K via Matrix Power",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an <code>N &times; N</code> adjacency matrix <code>adj</code> of a graph and a target path length <code>k</code>, calculate the number of distinct paths of exact length <code>k</code> between every pair of vertices.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "<li><code>adj</code>: An <code>N &times; N</code> matrix where <code>adj[u][v]</code> specifies the number of direct edges from node <code>u</code> to node <code>v</code>.</li>" +
    "<li><code>k</code>: Target path length (<code>k &ge; 1</code>).</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<ul>" +
    "<li>An <code>N &times; N</code> matrix where entry <code>[u][v]</code> contains the number of distinct paths of length <code>k</code> from vertex <code>u</code> to vertex <code>v</code>.</li>" +
    "</ul>",
  constraints: ["1 <= N <= 10", "1 <= k <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Paths of length 2",
      input: {
        adj: [
          [0, 1, 1],
          [1, 0, 0],
          [1, 0, 0],
        ],
        k: 2,
      },
      output: "[[2, 0, 0], [0, 1, 1], [0, 1, 1]]",
      explanation: "A^2 counts length-2 paths. Node 0 can reach 0 via 1 or 2 (2 paths).",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Paths of length 1",
      input: {
        adj: [
          [0, 1],
          [1, 0],
        ],
        k: 1,
      },
      output: "[[0, 1], [1, 0]]",
      explanation: "A^1 is the original adjacency matrix itself.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Paths of length 3 on 2-cycle",
      input: {
        adj: [
          [0, 1],
          [1, 0],
        ],
        k: 3,
      },
      output: "[[0, 1], [1, 0]]",
      explanation: "A^3 on 2-cycle equals A.",
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
    space: "Requires O(N^2) space for matrices.",
  },
  topicGuide: PATH_COUNTING_MATRIX_TOPIC_GUIDE,
  trivia: {
    lineExplanations: {},
  },
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 552,
      leetcodeId: 552,
      url: "https://leetcode.com/problems/student-attendance-record-ii/",
      label: "LeetCode #552",
      title: "Student Attendance Record II",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      chapterTitle: "Matrices",
      section: "23.3 Graphs and matrices",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 552,
    url: "https://leetcode.com/problems/student-attendance-record-ii/",
  },
  defaultInput: DEFAULT_PATH_COUNTING_MATRIX_INPUT,
  generateSteps: generatePathCountingMatrixSteps,
};

export default pathCountingMatrix;
