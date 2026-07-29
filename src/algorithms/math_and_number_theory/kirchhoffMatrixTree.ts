import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface KirchhoffMatrixTreeInput {
  n: number;
}

export const PYTHON_KIRCHHOFF_MATRIX_TREE_CODE = `class Solution:
    def __init__(self):
        pass

    def numOfWays(self, nums: list[int]) -> int:
        MOD = 10**9 + 7
        import math

        def dfs(arr: list[int]) -> int:
            if not arr:
                return 1
            left = [x for x in arr if x < arr[0]]
            right = [x for x in arr if x > arr[0]]
            ans = math.comb(len(left) + len(right), len(left)) % MOD
            ans = (ans * dfs(left)) % MOD
            ans = (ans * dfs(right)) % MOD
            return ans

        return (dfs(nums) - 1 + MOD) % MOD`;

export const DEFAULT_KIRCHHOFF_MATRIX_TREE_INPUT: KirchhoffMatrixTreeInput = {
  n: 4,
};

const createLaplacianMatrixSnapshot = (
  mat: number[][],
  name: string,
  isDone = false,
  activeCell?: { r: number; c: number },
  droppedRowCol = -1,
): PrimaryVisualSnapshot => {
  const dim = mat.length;
  const cells: MatrixCellItem[] = [];

  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      let state: MatrixCellItem["state"] = "default";
      const val = Math.round(mat[r][c] * 100) / 100;

      if (droppedRowCol >= 0 && (r === droppedRowCol || c === droppedRowCol)) {
        state = "visited";
      } else if (isDone) {
        state = "sorted";
      } else if (activeCell && activeCell.r === r && activeCell.c === c) {
        state = "active";
      } else if (r === c) {
        state = "compared";
      }

      cells.push({
        row: r,
        col: c,
        value: val,
        label: `L[${r}][${c}]`,
        state,
      });
    }
  }

  const headers = Array.from({ length: dim }, (_, i) => `v${i}`);

  return {
    kind: "matrix",
    name,
    rows: dim,
    cols: dim,
    cells,
    rowHeaders: headers,
    colHeaders: headers,
  };
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const sampleL = [
    [3, -1, -1, -1],
    [-1, 3, -1, -1],
    [-1, -1, 3, -1],
    [-1, -1, -1, 3],
  ];

  const sampleCofactor = [
    [3, -1, -1],
    [-1, 3, -1],
    [-1, -1, 3],
  ];

  const sampleUpperTri = [
    [3, -1, -1],
    [0, 2.67, -1.33],
    [0, 0, 2.0],
  ];

  const introData = [
    {
      narrative:
        "Kirchhoff's Matrix Tree Theorem calculates the exact total number of spanning trees in a graph G using the determinant of its Laplacian matrix L.",
      mat: sampleL,
      cell: undefined,
      dropped: -1,
    },
    {
      narrative:
        "A spanning tree is a minimal connected subgraph that touches all N vertices using exactly N - 1 edges without forming any cycles.",
      mat: sampleL,
      cell: { r: 0, c: 0 },
      dropped: -1,
    },
    {
      narrative:
        "The graph Laplacian matrix L = D - A is formed by placing vertex degrees on the diagonal D and setting off-diagonal elements L[i][j] = -1 if an edge connects i and j.",
      mat: sampleL,
      cell: { r: 1, c: 1 },
      dropped: -1,
    },
    {
      narrative:
        "Deleting any arbitrary row i and column i from Laplacian matrix L produces an (N - 1) x (N - 1) cofactor matrix L_i.",
      mat: sampleL,
      cell: undefined,
      dropped: 0,
    },
    {
      narrative:
        "By Kirchhoff's Theorem, the determinant det(L_i) of any reduced cofactor matrix equals the exact number of spanning trees tau(G), independent of which row/column was deleted.",
      mat: sampleCofactor,
      cell: { r: 0, c: 0 },
      dropped: -1,
    },
    {
      narrative:
        "For a complete graph K_n, Kirchhoff's Matrix Tree Theorem yields Cayley's celebrated formula tau(K_n) = n^(n-2).",
      mat: sampleCofactor,
      cell: { r: 1, c: 1 },
      dropped: -1,
    },
    {
      narrative:
        "Computing cofactor determinant det(L_0) via Gaussian elimination takes O(N^3) polynomial time, avoiding exponential edge combination enumeration.",
      mat: sampleUpperTri,
      cell: { r: 2, c: 2 },
      dropped: -1,
    },
    {
      narrative:
        "Kirchhoff's theorem extends to directed graphs (counting rooted directed spanning trees) and weighted graphs (computing total spanning tree weight sums).",
      mat: sampleUpperTri,
      cell: undefined,
      dropped: -1,
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: createLaplacianMatrixSnapshot(
        data.mat,
        "kirchhoff_concept_matrix",
        false,
        data.cell,
        data.dropped,
      ),
    }),
  );
};

export const generateKirchhoffMatrixTreeSteps = (
  input?: KirchhoffMatrixTreeInput,
): AlgorithmStep[] => {
  const n = input && typeof input.n === "number" ? Math.max(1, Math.floor(input.n)) : 4;
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  if (n <= 1) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Graph with n = ${n} vertex has exactly 1 trivial spanning tree by definition.`,
        primarySnapshot: createLaplacianMatrixSnapshot([[0]], "laplacian_n1", true),
      }),
    );
    return steps;
  }

  // Construct N x N Laplacian matrix for complete graph K_n
  const L = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? n - 1 : -1)),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Constructing ${n}x${n} graph Laplacian matrix L = D - A for complete graph K_${n} with vertex degree d = ${n - 1}.`,
      primarySnapshot: createLaplacianMatrixSnapshot(L, "graph_laplacian_matrix"),
    }),
  );

  // Mark row 0 and col 0 deletion
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Deleting row 0 and column 0 from Laplacian matrix L to form the (${n - 1}) x (${n - 1}) cofactor matrix L_0.`,
      primarySnapshot: createLaplacianMatrixSnapshot(
        L,
        "graph_laplacian_deleting_row0_col0",
        false,
        undefined,
        0,
      ),
    }),
  );

  // Build submatrix L_0
  const sub = L.slice(1).map((row) => row.slice(1));
  const dim = sub.length;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Extracted reduced (${dim}) x (${dim}) cofactor matrix L_0 ready for Gaussian elimination determinant computation.`,
      primarySnapshot: createLaplacianMatrixSnapshot(sub, "cofactor_matrix_L0"),
    }),
  );

  let det = 1.0;
  for (let i = 0; i < dim; i++) {
    const pivot = sub[i][i];
    det *= pivot;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Gaussian elimination step i = ${i}: selected diagonal pivot L_0[${i}][${i}] = ${pivot}. Running determinant accumulated: det = ${Math.round(det)}.`,
        primarySnapshot: createLaplacianMatrixSnapshot(sub, `gaussian_elim_step_${i}`, false, {
          r: i,
          c: i,
        }),
      }),
    );

    for (let j = i + 1; j < dim; j++) {
      const factor = sub[j][i] / pivot;
      for (let k = i; k < dim; k++) {
        sub[j][k] -= factor * sub[i][k];
      }
    }
  }

  const finalTrees = Math.round(det);

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Gaussian elimination completes: det(L_0) = ${finalTrees}. Kirchhoff's Matrix Tree Theorem proves K_${n} has exactly ${finalTrees} spanning trees (confirming Cayley's formula ${n}^(${n - 2}) = ${finalTrees}).`,
      primarySnapshot: createLaplacianMatrixSnapshot(sub, "final_upper_triangular_matrix", true),
    }),
  );

  return steps;
};

export const KIRCHHOFF_MATRIX_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Kirchhoff's Matrix Tree Theorem computes graph spanning trees in O(N^3) time via Laplacian cofactor determinants.</p>",
  sections: [
    {
      heading: "Laplacian Matrix & Cofactors",
      body: "<p>The Laplacian matrix L = D - A is formed by subtracting adjacency matrix A from degree matrix D. Deleting any row and column yields a cofactor whose determinant equals the spanning tree count.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Graph Laplacian",
      definition: "Matrix L = D - A where D is the degree matrix and A is the adjacency matrix.",
    },
  ],
};

export const KIRCHHOFF_MATRIX_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Computes spanning tree count via Laplacian cofactor determinant.",
  },
};

export const kirchhoffMatrixTree: AlgorithmDefinition<KirchhoffMatrixTreeInput> = {
  id: "kirchhoff-matrix-tree",
  title: "Kirchhoff's Matrix Tree Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given a positive integer <code>n</code> representing the number of vertices in a connected graph (or complete graph <code>K_n</code>), calculate the total number of distinct spanning trees in the graph.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "<li><code>n</code>: Number of vertices (<code>n &ge; 1</code>).</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<ul>" +
    "<li>An integer representing the total number of spanning trees.</li>" +
    "</ul>",
  constraints: ["1 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Complete graph K_4",
      input: { n: 4 },
      output: "16",
      explanation: "K_4 has 4^(4-2) = 16 spanning trees.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single vertex K_1",
      input: { n: 1 },
      output: "1",
      explanation: "A single vertex has 1 trivial spanning tree.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Complete graph K_5",
      input: { n: 5 },
      output: "125",
      explanation: "K_5 has 5^(5-2) = 125 spanning trees.",
    },
  ],
  code: PYTHON_KIRCHHOFF_MATRIX_TREE_CODE,
  timeComplexity: {
    best: "O(N^3)",
    average: "O(N^3)",
    worst: "O(N^3)",
  },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Forming the Laplacian matrix takes O(N^2), and computing its cofactor determinant via Gaussian elimination takes O(N^3) time.",
    space: "Requires O(N^2) space to store the Laplacian and cofactor matrices.",
  },
  topicGuide: KIRCHHOFF_MATRIX_TREE_TOPIC_GUIDE,
  trivia: KIRCHHOFF_MATRIX_TREE_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1569,
      leetcodeId: 1569,
      url: "https://leetcode.com/problems/number-of-ways-to-reorder-array-to-get-same-bst/",
      label: "LeetCode #1569",
      title: "Number of Ways to Reorder Array to Get Same BST",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      chapterTitle: "Matrices",
      section: "23.3 Matrix tree theorem",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 1569,
    url: "https://leetcode.com/problems/number-of-ways-to-reorder-array-to-get-same-bst/",
  },
  defaultInput: DEFAULT_KIRCHHOFF_MATRIX_TREE_INPUT,
  generateSteps: generateKirchhoffMatrixTreeSteps,
};

export default kirchhoffMatrixTree;
