import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
  GridVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface KnightsTourInput {
  size: number;
  startRow: number;
  startCol: number;
}

export const DEFAULT_KNIGHTS_TOUR_INPUT: KnightsTourInput = {
  size: 5,
  startRow: 0,
  startCol: 0,
};

const KNIGHT_MOVES = [
  [-2, 1],
  [-1, 2],
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
] as const;

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Knight's Tour is a sequence of moves by a chess knight on an N x N board such that the knight visits every square on the board exactly once.",
    primarySnapshot: {
      kind: "grid",
      grid: Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => ({
          row: r,
          col: c,
          state: r === 0 && c === 0 ? "active" : "default",
          distance: r === 0 && c === 0 ? 1 : undefined,
        })),
      ),
    },
  },
  {
    narrative:
      "A chess knight moves in an L-shape: 2 squares horizontally and 1 square vertically, or 1 square horizontally and 2 squares vertically (up to 8 candidate moves).",
    primarySnapshot: {
      kind: "array",
      name: "moves",
      mode: "box",
      elements: [
        { id: "m1", value: "(-2, +1)", state: "default" },
        { id: "m2", value: "(-1, +2)", state: "default" },
        { id: "m3", value: "(+1, +2)", state: "default" },
        { id: "m4", value: "(+2, +1)", state: "default" },
        { id: "m5", value: "(+2, -1)", state: "default" },
        { id: "m6", value: "(+1, -2)", state: "default" },
        { id: "m7", value: "(-1, -2)", state: "default" },
        { id: "m8", value: "(-2, -1)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Brute-force depth-first search faces an exponential search tree of O(8^(N^2)) states and suffers severe backtracking bottlenecks on larger boards.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_contrast",
      mode: "box",
      elements: [
        { id: "c1", value: "Brute-Force DFS: O(8^(N^2)) Exponential", state: "compare" },
        { id: "c2", value: "Warnsdorff Greedy: O(N^2) Polynomial", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Warnsdorff's heuristic solves the tour greedily by always moving the knight to the unvisited square that has the FEWEST valid onward unvisited neighbors.",
    primarySnapshot: {
      kind: "array",
      name: "heuristic_rule",
      mode: "box",
      elements: [
        { id: "h1", value: "Calculate Onward Degrees", state: "active" },
        { id: "h2", value: "Pick Minimum Degree Square", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Prioritizing low-degree squares (such as corners and edges) early prevents them from becoming isolated, unreachable dead ends later in the tour.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, state: "active", distance: 1 },
          { row: 0, col: 1, state: "default" },
        ],
        [
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 1, state: "compare" },
        ],
      ],
    },
  },
  {
    narrative:
      "At each step, we evaluate all valid unvisited knight move candidates and count their respective onward unvisited neighbor counts (onward degree).",
    primarySnapshot: {
      kind: "array",
      name: "candidate_degrees",
      mode: "box",
      elements: [
        { id: "cd1", value: "Candidate (1, 2): deg 2", state: "sorted" },
        { id: "cd2", value: "Candidate (2, 1): deg 4", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "We select the candidate square with the minimum onward degree, mark it with the current step index, and advance the knight to that new position.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, state: "visited", distance: 1 },
          { row: 0, col: 1, state: "default" },
        ],
        [
          { row: 1, col: 2, state: "active", distance: 2 },
          { row: 2, col: 1, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "On standard valid boards (N >= 5), Warnsdorff's rule successfully completes all N^2 steps in O(N^2) time without needing any recursive backtracking.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "Tour Complete: N^2 / N^2 Squares Visited", state: "sorted" },
        { id: "s2", value: "Time: O(N^2), Space: O(N^2)", state: "default" },
      ],
    },
  },
];

export const generateKnightsTourWarnsdorffSteps = (input: KnightsTourInput): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_KNIGHTS_TOUR_INPUT;
  const rawSize = safeInput.size ?? DEFAULT_KNIGHTS_TOUR_INPUT.size;
  const n = Math.max(3, Math.min(8, rawSize));
  const rawStartRow = safeInput.startRow ?? DEFAULT_KNIGHTS_TOUR_INPUT.startRow;
  const rawStartCol = safeInput.startCol ?? DEFAULT_KNIGHTS_TOUR_INPUT.startCol;
  const startR = Math.max(0, Math.min(n - 1, rawStartRow));
  const startC = Math.max(0, Math.min(n - 1, rawStartCol));

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.size === DEFAULT_KNIGHTS_TOUR_INPUT.size &&
      input.startRow === DEFAULT_KNIGHTS_TOUR_INPUT.startRow &&
      input.startCol === DEFAULT_KNIGHTS_TOUR_INPUT.startCol);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const board: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));

  const buildGridSnapshot = (
    activeR: number,
    activeC: number,
    candidateSet: Set<string> = new Set(),
    allSorted = false,
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    for (let r = 0; r < n; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < n; c++) {
        const isCandidate = candidateSet.has(`${r},${c}`);
        const moveNum = board[r][c];
        const isVisited = moveNum !== -1;
        const isActive = r === activeR && c === activeC;

        rowNodes.push({
          row: r,
          col: c,
          isVisited,
          distance: moveNum !== -1 ? moveNum + 1 : undefined,
          state: allSorted
            ? "sorted"
            : isActive
              ? "active"
              : isCandidate
                ? "compare"
                : isVisited
                  ? "visited"
                  : "default",
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: "grid", grid: gridNodes };
  };

  const countOnwardMoves = (r: number, c: number): number => {
    let count = 0;
    for (const [dr, dc] of KNIGHT_MOVES) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && board[nr][nc] === -1) {
        count++;
      }
    }
    return count;
  };

  board[startR][startC] = 0;
  let currR = startR;
  let currC = startC;

  addStep(
    `Initializing Knight's Tour on ${n}x${n} board. Placed knight at starting square (${startR}, ${startC}) as Move 1.`,
    buildGridSnapshot(currR, currC),
  );

  const totalSquares = n * n;
  let tourSuccess = true;

  for (let moveIdx = 1; moveIdx < totalSquares; moveIdx++) {
    const candidates: [number, number, number][] = [];
    const candidateSet = new Set<string>();

    for (const [dr, dc] of KNIGHT_MOVES) {
      const nr = currR + dr;
      const nc = currC + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && board[nr][nc] === -1) {
        const deg = countOnwardMoves(nr, nc);
        candidates.push([deg, nr, nc]);
        candidateSet.add(`${nr},${nc}`);
      }
    }

    if (candidates.length === 0) {
      addStep(
        `Dead end encountered at square (${currR}, ${currC}) on move ${moveIdx}: no unvisited knight moves remain. Incomplete tour.`,
        buildGridSnapshot(currR, currC),
      );
      tourSuccess = false;
      break;
    }

    candidates.sort((a, b) => a[0] - b[0]);
    const [minDeg, nextR, nextC] = candidates[0];

    addStep(
      `Evaluating ${candidates.length} candidate moves from (${currR}, ${currC}): Warnsdorff degrees are [${candidates.map(([d, r, c]) => `(${r},${c}):${d}`).join(", ")}]. Selecting minimum degree square (${nextR}, ${nextC}) with degree ${minDeg}.`,
      buildGridSnapshot(currR, currC, candidateSet),
    );

    board[nextR][nextC] = moveIdx;
    currR = nextR;
    currC = nextC;

    addStep(
      `Moved knight to (${currR}, ${currC}) (Move ${moveIdx + 1} of ${totalSquares}).`,
      buildGridSnapshot(currR, currC),
    );
  }

  if (tourSuccess) {
    addStep(
      `Completed Knight's Tour! All ${totalSquares} squares visited successfully using Warnsdorff's minimum degree heuristic.`,
      buildGridSnapshot(currR, currC, new Set(), true),
    );
  }

  return steps;
};

const WARNSDORFF_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: find a knight's tour on an N×N board using Warnsdorff's heuristic.",
    2: "Initialize an N×N board filled with -1 to indicate unvisited squares.",
    3: "Define the 8 standard L-shaped moves a knight can make.",
    4: "Blank line separating initialization constants from onward move counter helper.",
    5: "Helper count_onward_moves(r, c) counts unvisited onward moves from candidate square (r, c).",
    6: "Initialize candidate onward degree counter to 0.",
    7: "Loop over all 8 knight move offsets (dr, dc).",
    8: "Calculate candidate target coordinates (nr, nc).",
    9: "Check if (nr, nc) is within board boundaries and currently unvisited (board[nr][nc] == -1).",
    10: "Increment candidate onward move counter.",
    11: "Return calculated onward degree for cell (r, c).",
    12: "Blank line separating helper function definition from start position initialization.",
    13: "Mark starting square with step 0.",
    14: "Set current position tracking variables curr_r, curr_c to start coordinates.",
    15: "Blank line separating start state setup from main step iteration loop.",
    16: "Loop step from 1 up to N*N - 1 to visit remaining squares.",
    17: "Initialize empty candidates list to store tuples of (degree, next_r, next_c).",
    18: "Loop over all 8 knight move offsets from current position.",
    19: "Calculate target coordinates (nr, nc) for candidate move.",
    20: "Verify candidate (nr, nc) is within grid bounds and unvisited.",
    21: "Compute Warnsdorff onward degree for candidate square by counting its unvisited neighbors.",
    22: "Append candidate tuple (degree, nr, nc) to candidates list.",
    23: "Check if candidates list is empty (dead end reached).",
    24: "If candidates is empty, return False and current incomplete board state.",
    25: "Sort candidates by onward degree ascending (Warnsdorff's rule: smallest degree first).",
    26: "Extract target coordinates (next_r, next_c) of top candidate with minimum onward degree.",
    27: "Mark selected square (next_r, next_c) with step number.",
    28: "Update current position coordinates (curr_r, curr_c) to (next_r, next_c).",
    29: "Blank line separating step loop from final return statement.",
    30: "Return True and completed board matrix indicating full tour success.",
  },
};

export const knightsTourWarnsdorff: AlgorithmDefinition<KnightsTourInput> = {
  id: "knights-tour-warnsdorff",
  title: "Knight's Tour (Warnsdorff's Heuristic)",
  topicIds: ["backtracking"],
  difficulty: "Medium",
  description:
    "<p>Given an <code>N &times; N</code> chessboard and a starting position <code>(startRow, startCol)</code>, construct a valid Knight's Tour that visits every square on the board exactly once using Warnsdorff's minimum-degree heuristic.</p><p><strong>Input:</strong> Board dimension <code>size</code> (N), <code>startRow</code>, and <code>startCol</code>.</p><p><strong>Output:</strong> An <code>N &times; N</code> 2D matrix where each cell contains the 1-indexed step number when the knight visited that square, or an incomplete board if no tour was found.</p>",
  constraints: ["3 <= size <= 8", "0 <= startRow, startCol < size"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "N = 5, start = (0, 0)",
      outputDisplay: "25/25 squares visited",
      title: "Standard 5x5 Board Case",
      input: DEFAULT_KNIGHTS_TOUR_INPUT,
      output: "Full tour completed in 25 moves",
      explanation: "Standard 5x5 board tour completing all 25 squares.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "N = 6, start = (2, 2)",
      outputDisplay: "36/36 squares visited",
      title: "Adversarial 6x6 Center Start",
      input: { size: 6, startRow: 2, startCol: 2 },
      output: "Full tour completed in 36 moves",
      explanation: "6x6 chessboard starting near center using Warnsdorff degrees.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "N = 3, start = (0, 0)",
      outputDisplay: "Dead end after 8 moves",
      title: "Impossible 3x3 Board Boundary",
      input: { size: 3, startRow: 0, startCol: 0 },
      output: "Incomplete tour (dead end)",
      explanation: "No complete knight tour exists on a 3x3 board due to topological bottlenecks.",
    },
  ],
  code: `def knights_tour_warnsdorff(n: int, start_r: int, start_c: int) -> tuple[bool, list[list[int]]]:
    board = [[-1] * n for _ in range(n)]
    moves = [(-2, 1), (-1, 2), (1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1)]

    def count_onward_moves(r: int, c: int) -> int:
        count = 0
        for dr, dc in moves:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and board[nr][nc] == -1:
                count += 1
        return count

    board[start_r][start_c] = 0
    curr_r, curr_c = start_r, start_c

    for step in range(1, n * n):
        candidates = []
        for dr, dc in moves:
            nr, nc = curr_r + dr, curr_c + dc
            if 0 <= nr < n and 0 <= nc < n and board[nr][nc] == -1:
                deg = count_onward_moves(nr, nc)
                candidates.append((deg, nr, nc))
        if not candidates:
            return False, board
        candidates.sort(key=lambda x: x[0])
        _, next_r, next_c = candidates[0]
        board[next_r][next_c] = step
        curr_r, curr_c = next_r, next_c

    return True, board`,
  timeComplexity: {
    best: "O(N^2)",
    average: "O(N^2)",
    worst: "O(8^(N^2))",
  },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Warnsdorff's heuristic evaluates up to 8 candidate moves per step, counting onward degrees. On valid standard boards (N >= 5), this heuristic finds a full tour in O(N^2) time without requiring backtracks.",
    space: "O(N^2) memory required for the N×N chessboard matrix tracking step numbers.",
  },
  topicGuide: {
    overview:
      "<p>The Knight's Tour is a classic Hamiltonian path problem on a graph where vertices are chessboard squares and edges are valid L-shaped knight moves. Naive depth-first search suffers from combinatorial explosion. In 1823, H. C. von Warnsdorff introduced the minimum-degree onward move heuristic, turning exponential state space exploration into a polynomial greedy search. Modern systems applications of this heuristic technique include robotic arm joint path trajectory optimization and spatial space-filling curve generation.</p>",
    sections: [
      {
        heading: "Warnsdorff's Minimum-Degree Rule",
        body: "<p>Always select the candidate unvisited square that has the <strong>FEWEST</strong> valid onward unvisited knight moves. Prioritizing constrained squares (such as board corners and edges) early prevents them from becoming isolated un-reachable nodes later in the tour.</p>",
      },
      {
        heading: "Tie-Breaking & Squirrel Strategies",
        body: "<p>When multiple candidate squares share equal minimum onward degrees, ties can cause dead ends on large boards. Breaking ties by favoring candidates furthest from the board center (or using Roth's tie-breaking rules) guarantees deterministic completion for arbitrary board dimensions.</p>",
      },
      {
        heading: "Systems Applications & Space-Filling Curves",
        body: "<p>Space-filling traversals on 2D grids (similar to Hilbert curves and Morton Z-order curves) are used in database spatial indexing and memory cache locality optimizations. Warnsdorff-style greedy graph walks offer efficient continuous coverage for robotic vacuum cleaners and automated 3D printing nozzles.</p>",
      },
      {
        heading: "Closed vs Open Tours",
        body: "<p>An open tour visits all <code>N^2</code> squares without returning to the start. A closed (or re-entrant) tour requires the last visited square (step <code>N^2 - 1</code>) to be a single knight's move away from <code>(startRow, startCol)</code>, creating a continuous directed cycle.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Knight's Graph",
        definition:
          "An undirected graph where each cell on an N×N board is a node and edges connect valid chess knight moves.",
      },
      {
        term: "Warnsdorff Degree",
        definition:
          "The number of unvisited valid neighbor cells reachable from a candidate cell in one knight move.",
      },
      {
        term: "Greedy Heuristic",
        definition:
          "A problem-solving approach that makes locally optimal choices at each stage with the goal of finding a global solution.",
      },
    ],
  },
  trivia: WARNSDORFF_TRIVIA,
  generateSteps: generateKnightsTourWarnsdorffSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 19,
      label: "Competitive Programmer's Handbook, Ch 19",
    },
  ],
  defaultInput: DEFAULT_KNIGHTS_TOUR_INPUT,
};

export default knightsTourWarnsdorff;
