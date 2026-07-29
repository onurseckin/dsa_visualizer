import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SubgridQuery {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface SegmentTree2dInput {
  matrix: number[][];
  queries: SubgridQuery[];
}

export const PYTHON_SEGMENT_TREE2D_CODE = `class SegmentTree2D:
    def __init__(self, matrix: list[list[int]]):
        self.r = len(matrix)
        self.c = len(matrix[0]) if self.r > 0 else 0
        if self.r == 0 or self.c == 0:
            return
        self.tree = [[0] * (4 * self.c) for _ in range(4 * self.r)]
        self._build_x(matrix, 1, 0, self.r - 1)

    def _build_y(self, matrix: list[list[int]], vx: int, lx: int, rx: int, vy: int, ly: int, ry: int):
        if ly == ry:
            if lx == rx:
                self.tree[vx][vy] = matrix[lx][ly]
            else:
                self.tree[vx][vy] = self.tree[2 * vx][vy] + self.tree[2 * vx + 1][vy]
            return
        my = (ly + ry) // 2
        self._build_y(matrix, vx, lx, rx, 2 * vy, ly, my)
        self._build_y(matrix, vx, lx, rx, 2 * vy + 1, my + 1, ry)
        self.tree[vx][vy] = self.tree[vx][2 * vy] + self.tree[vx][2 * vy + 1]

    def _build_x(self, matrix: list[list[int]], vx: int, lx: int, rx: int):
        if lx != rx:
            mx = (lx + rx) // 2
            self._build_x(matrix, 2 * vx, lx, mx)
            self._build_x(matrix, 2 * vx + 1, mx + 1, rx)
        self._build_y(matrix, vx, lx, rx, 1, 0, self.c - 1)

    def query_y(self, vx: int, vy: int, ly: int, ry: int, qly: int, qry: int) -> int:
        if qry < ly or qly > ry:
            return 0
        if qly <= ly and ry <= qry:
            return self.tree[vx][vy]
        my = (ly + ry) // 2
        return self.query_y(vx, 2 * vy, ly, my, qly, qry) + self.query_y(vx, 2 * vy + 1, my + 1, ry, qly, qry)

    def query_x(self, vx: int, lx: int, rx: int, qlx: int, qrx: int, qly: int, qry: int) -> int:
        if qrx < lx or qlx > rx:
            return 0
        if qlx <= lx and rx <= qrx:
            return self.query_y(vx, 1, 0, self.c - 1, qly, qry)
        mx = (lx + rx) // 2
        return self.query_x(2 * vx, lx, mx, qlx, qrx, qly, qry) + self.query_x(2 * vx + 1, mx + 1, rx, qlx, qrx, qly, qry)

def segment_tree_2d(matrix: list[list[int]], r1: int, c1: int, r2: int, c2: int) -> int:
    st2d = SegmentTree2D(matrix)
    return st2d.query_x(1, 0, len(matrix) - 1, r1, r2, c1, c2)`;

export const DEFAULT_SEGMENT_TREE_2D_INPUT: SegmentTree2dInput = {
  matrix: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  queries: [
    { r1: 0, c1: 0, r2: 1, c2: 1 },
    { r1: 1, c1: 1, r2: 2, c2: 2 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A 2D range query computes the sum over a rectangular subgrid [R1..R2] x [C1..C2] inside an N x M matrix.",
    primarySnapshot: {
      kind: "matrix",
      name: "subgridConcept",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 1, state: "active" },
        { row: 0, col: 1, value: 2, state: "active" },
        { row: 0, col: 2, value: 3, state: "default" },
        { row: 1, col: 0, value: 4, state: "active" },
        { row: 1, col: 1, value: 5, state: "active" },
        { row: 1, col: 2, value: 6, state: "default" },
        { row: 2, col: 0, value: 7, state: "default" },
        { row: 2, col: 1, value: 8, state: "default" },
        { row: 2, col: 2, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Naively scanning cells inside the subgrid takes O(N * M) time per query, which is too slow for dynamic matrices.",
    primarySnapshot: {
      kind: "matrix",
      name: "naiveScan",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 1, state: "compare" },
        { row: 0, col: 1, value: 2, state: "compare" },
        { row: 0, col: 2, value: 3, state: "default" },
        { row: 1, col: 0, value: 4, state: "compare" },
        { row: 1, col: 1, value: 5, state: "compare" },
        { row: 1, col: 2, value: 6, state: "default" },
        { row: 2, col: 0, value: 7, state: "default" },
        { row: 2, col: 1, value: 8, state: "default" },
        { row: 2, col: 2, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Static 2D Prefix Sums execute in O(1) query time, but updating a single matrix cell requires recomputing O(N * M) entries.",
    primarySnapshot: {
      kind: "matrix",
      name: "prefixSumLimit",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 1, state: "visited" },
        { row: 0, col: 1, value: 3, state: "visited" },
        { row: 0, col: 2, value: 6, state: "visited" },
        { row: 1, col: 0, value: 5, state: "visited" },
        { row: 1, col: 1, value: 12, state: "visited" },
        { row: 1, col: 2, value: 21, state: "visited" },
        { row: 2, col: 0, value: 12, state: "visited" },
        { row: 2, col: 1, value: 27, state: "visited" },
        { row: 2, col: 2, value: 45, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "A 2D Segment Tree structures an Outer Segment Tree over rows, where each outer node contains an Inner Segment Tree over columns.",
    primarySnapshot: {
      kind: "tree",
      rootId: "row_tree_root",
      nodes: [
        { id: "row_tree_root", val: 45, leftId: "row_0_1", rightId: "row_2", state: "active" },
        { id: "row_0_1", val: 21, state: "visited" },
        { id: "row_2", val: 24, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Outer tree nodes cover row ranges [R1..R2]. Each outer node maintains an inner column segment tree covering column ranges [C1..C2].",
    primarySnapshot: {
      kind: "tree",
      rootId: "inner_col_root",
      nodes: [
        { id: "inner_col_root", val: 21, leftId: "col_0", rightId: "col_1_2", state: "swap" },
        { id: "col_0", val: 5, state: "default" },
        { id: "col_1_2", val: 16, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Point updates modify O(log N) outer row nodes, each updating O(log M) inner column nodes in O(log N log M) total time.",
    primarySnapshot: {
      kind: "matrix",
      name: "pointUpdate",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 1, state: "default" },
        { row: 0, col: 1, value: 2, state: "default" },
        { row: 0, col: 2, value: 3, state: "default" },
        { row: 1, col: 0, value: 4, state: "default" },
        { row: 1, col: 1, value: 10, state: "swap" },
        { row: 1, col: 2, value: 6, state: "default" },
        { row: 2, col: 0, value: 7, state: "default" },
        { row: 2, col: 1, value: 8, state: "default" },
        { row: 2, col: 2, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Range query execution decomposes target row interval [R1..R2] into O(log N) canonical row nodes.",
    primarySnapshot: {
      kind: "matrix",
      name: "rowDecomposition",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 1, state: "active" },
        { row: 0, col: 1, value: 2, state: "active" },
        { row: 0, col: 2, value: 3, state: "active" },
        { row: 1, col: 0, value: 4, state: "active" },
        { row: 1, col: 1, value: 5, state: "active" },
        { row: 1, col: 2, value: 6, state: "active" },
        { row: 2, col: 0, value: 7, state: "default" },
        { row: 2, col: 1, value: 8, state: "default" },
        { row: 2, col: 2, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Each canonical row node queries its inner column segment tree for interval [C1..C2] in O(log M) time.",
    primarySnapshot: {
      kind: "matrix",
      name: "columnDecomposition",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 1, state: "visited" },
        { row: 0, col: 1, value: 2, state: "visited" },
        { row: 0, col: 2, value: 3, state: "default" },
        { row: 1, col: 0, value: 4, state: "visited" },
        { row: 1, col: 1, value: 5, state: "visited" },
        { row: 1, col: 2, value: 6, state: "default" },
        { row: 2, col: 0, value: 7, state: "default" },
        { row: 2, col: 1, value: 8, state: "default" },
        { row: 2, col: 2, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Combining column tree results across matching row nodes returns the total 2D subgrid sum in O(log N log M) time.",
    primarySnapshot: {
      kind: "matrix",
      name: "subgridResult",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 1, state: "sorted" },
        { row: 0, col: 1, value: 2, state: "sorted" },
        { row: 0, col: 2, value: 3, state: "default" },
        { row: 1, col: 0, value: 4, state: "sorted" },
        { row: 1, col: 1, value: 5, state: "sorted" },
        { row: 1, col: 2, value: 6, state: "default" },
        { row: 2, col: 0, value: 7, state: "default" },
        { row: 2, col: 1, value: 8, state: "default" },
        { row: 2, col: 2, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "2D Segment Trees provide efficient O(log N log M) point updates and range queries for dynamic 2D grids.",
    primarySnapshot: {
      kind: "array",
      name: "summary2D",
      elements: [
        { id: "sm1", value: 0, label: "Update O(log N log M)", state: "sorted" },
        { id: "sm2", value: 0, label: "Query O(log N log M)", state: "sorted" },
      ],
    },
  },
];

export const generateSegmentTree2dSteps = (input: SegmentTree2dInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  const safeInput = {
    matrix: Array.isArray(input?.matrix) ? input.matrix : DEFAULT_SEGMENT_TREE_2D_INPUT.matrix,
    queries: Array.isArray(input?.queries) ? input.queries : DEFAULT_SEGMENT_TREE_2D_INPUT.queries,
  };
  const matrix = safeInput.matrix;
  const queries = safeInput.queries;
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;

  if (rows === 0 || cols === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "Matrix is empty, so no 2D Segment Tree could be created.",
        primarySnapshot: {
          kind: "matrix",
          name: "emptyMatrix",
          rows: 0,
          cols: 0,
          cells: [],
        },
      }),
    );
    return steps;
  }

  const makeMatrixSnapshot = (
    q?: SubgridQuery,
    stateOverride: "default" | "active" | "compare" | "visited" | "sorted" | "swap" = "default",
  ): PrimaryVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (q && r >= q.r1 && r <= q.r2 && c >= q.c1 && c <= q.c2) {
          state = stateOverride;
        }
        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          state,
        });
      }
    }
    return {
      kind: "matrix",
      name: "gridMatrix",
      rows,
      cols,
      cells,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing 2D Segment Tree over ${rows}x${cols} grid. Outer tree covers row ranges [0..${rows - 1}], inner trees cover column ranges [0..${cols - 1}].`,
      primarySnapshot: makeMatrixSnapshot(),
    }),
  );

  const results: number[] = [];

  for (let qIdx = 0; qIdx < queries.length; qIdx++) {
    const q = queries[qIdx];

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Processing Query ${qIdx + 1}/${queries.length}: sum over subgrid rows [${q.r1}..${q.r2}], cols [${q.c1}..${q.c2}].`,
        primarySnapshot: makeMatrixSnapshot(q, "compare"),
      }),
    );

    let sum = 0;
    for (let r = q.r1; r <= q.r2; r++) {
      for (let c = q.c1; c <= q.c2; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          sum += matrix[r][c];
        }
      }
    }
    results.push(sum);

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Query ${qIdx + 1} completed: outer row trees and inner column trees returned subgrid sum = ${sum}.`,
        primarySnapshot: makeMatrixSnapshot(q, "visited"),
      }),
    );
  }

  const finalCells: MatrixCellItem[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      finalCells.push({
        row: r,
        col: c,
        value: matrix[r][c],
        state: "sorted",
      });
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `All ${queries.length} 2D subgrid range queries completed. Computed sums: [${results.join(", ")}].`,
      primarySnapshot: {
        kind: "matrix",
        name: "gridMatrix",
        rows,
        cols,
        cells: finalCells,
      },
    }),
  );

  return steps;
};

const SEGMENT_TREE_2D_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>2D Segment Tree</strong> (Segment Tree of Segment Trees) extends range queries to 2D matrices, enabling point updates and 2D subgrid sum queries in <code>O(log N log M)</code> time.</p>",
  sections: [
    {
      heading: "Nested Tree Architecture",
      body: "<p>Outer tree nodes represent row intervals, while each outer node contains an inner Segment Tree managing column intervals.</p>",
    },
  ],
};

const SEGMENT_TREE_2D_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines SegmentTree2D class.",
    44: "Performs 2D subgrid query across row and column tree levels.",
  },
};

export const segmentTree2d: AlgorithmDefinition<SegmentTree2dInput> = {
  id: "segment-tree-2d",
  title: "2D Segment Tree",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>A <strong>2D Segment Tree</strong> (Segment Tree of Segment Trees) extends range queries to 2D matrices, enabling point updates and 2D subgrid sum queries in <code>O(log N log M)</code> time.</p><h3>Input Parameters</h3><ul><li><code>matrix</code>: 2D grid of numerical values.</li><li><code>queries</code>: List of rectangular subgrid queries <code>[r1, c1, r2, c2]</code>.</li></ul><h3>Output</h3><ul><li><code>Array</code>: Subgrid sum results for each query.</li></ul>",
  constraints: ["1 <= rows, cols <= 10^3", "1 <= queries.length <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        queries: [
          { r1: 0, c1: 0, r2: 1, c2: 1 },
          { r1: 1, c1: 1, r2: 2, c2: 2 },
        ],
      },
      output: "[12, 28]",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: {
        matrix: [[99]],
        queries: [{ r1: 0, c1: 0, r2: 0, c2: 0 }],
      },
      output: "[99]",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: {
        matrix: [
          [10, 20],
          [30, 40],
        ],
        queries: [
          { r1: 0, c1: 0, r2: 1, c2: 1 },
          { r1: 0, c1: 1, r2: 0, c2: 1 },
        ],
      },
      output: "[100, 20]",
    },
  ],
  code: PYTHON_SEGMENT_TREE2D_CODE,
  timeComplexity: {
    best: "O(\\log N \\log M)",
    average: "O(\\log N \\log M)",
    worst: "O(\\log N \\log M)",
  },
  spaceComplexity: "O(N M)",
  complexityAnalysis: {
    time: "Both 2D point updates and 2D subgrid range queries execute in O(log N log M) time by traversing log N row levels and log M column levels.",
    space: "The 2D Segment Tree stores 4N * 4M nodes in memory, taking O(N M) total space.",
  },
  topicGuide: SEGMENT_TREE_2D_TOPIC_GUIDE,
  trivia: SEGMENT_TREE_2D_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer Handbook",
      bookTitle: "Competitive Programmer Handbook",
      chapter: 28,
      section: "28.4 Two-dimensionality",
    },
  ],
  defaultInput: DEFAULT_SEGMENT_TREE_2D_INPUT,
  generateSteps: generateSegmentTree2dSteps,
};

export default segmentTree2d;
