import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

const WARNSDORFF_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: find a knight's tour on an N×N board using Warnsdorff's heuristic.",
    2: "Initialize an N×N board filled with -1 to indicate unvisited squares.",
    3: "Define the 8 standard L-shaped moves a knight can make.",
    5: "Helper count_onward_moves(r, c) counts unvisited onward moves.",
    13: "Mark starting square with step 0.",
    14: "Set current position to (start_r, start_c).",
    16: "Loop step from 1 up to N*N - 1 to visit remaining squares.",
    21: "Compute Warnsdorff onward degree for each unvisited move.",
    24: "If candidates is empty, return False and current board state.",
    25: "Sort candidates by onward degree ascending (Warnsdorff's rule).",
    27: "Mark selected square with step number.",
    30: "Return True and completed board matrix.",
  },
};

export const generateKnightsTourWarnsdorffSteps = (input: KnightsTourInput): AlgorithmStep[] => {
  const n = Math.max(3, Math.min(8, input.size));
  const startR = Math.max(0, Math.min(n - 1, input.startRow));
  const startC = Math.max(0, Math.min(n - 1, input.startCol));

  const steps: AlgorithmStep[] = [];
  let stepCount = 0;

  const board: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));

  const buildGrid = (
    activeR: number,
    activeC: number,
    candidates: [number, number, number][] = [],
  ): GridCellNode[][] => {
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (__, c) => {
        const isCandidate = candidates.some(([, cr, cc]) => cr === r && cc === c);
        const moveNum = board[r][c];
        const isVisited = moveNum !== -1;
        const isActive = r === activeR && c === activeC;

        let state: GridCellNode["state"] = "default";
        if (isActive) state = "active";
        else if (isCandidate) state = "compare";
        else if (isVisited) state = "visited";

        return {
          row: r,
          col: c,
          isVisited,
          state,
          distance: moveNum !== -1 ? moveNum + 1 : undefined,
        };
      }),
    );
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

  // Step 1: Init
  board[startR][startC] = 0;
  let currR = startR;
  let currC = startC;

  steps.push({
    stepIndex: stepCount++,
    codeLine: 13,
    explanation: {
      what: `Placed knight at starting position (${startR}, ${startC}).`,
      why: "Initial position marked as step 1.",
    },
    primarySnapshot: {
      kind: "grid",
      grid: buildGrid(currR, currC),
    },
    auxiliaryState: {
      visited: [`(${currR},${currC})`],
      customState: {
        "Current Position": `(${currR}, ${currC})`,
        "Moves Completed": 1,
        "Total Squares": n * n,
      },
    },
    variables: {
      currR,
      currC,
      visitedCount: 1,
      totalSquares: n * n,
    },
  });

  const totalSquares = n * n;
  let tourSuccess = true;

  for (let moveIdx = 1; moveIdx < totalSquares; moveIdx++) {
    const candidates: [number, number, number][] = []; // [degree, r, c]
    for (const [dr, dc] of KNIGHT_MOVES) {
      const nr = currR + dr;
      const nc = currC + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && board[nr][nc] === -1) {
        const deg = countOnwardMoves(nr, nc);
        candidates.push([deg, nr, nc]);
      }
    }

    if (candidates.length === 0) {
      steps.push({
        stepIndex: stepCount++,
        codeLine: 24,
        explanation: {
          what: `No valid unvisited moves remaining from (${currR}, ${currC}).`,
          why: "Knight reached a dead end before completing the full tour.",
        },
        primarySnapshot: {
          kind: "grid",
          grid: buildGrid(currR, currC),
        },
        auxiliaryState: {
          customState: {
            Status: "Dead End / Incomplete Tour",
            "Visited Squares": moveIdx,
          },
        },
        variables: {
          currR,
          currC,
          completed: false,
        },
      });
      tourSuccess = false;
      break;
    }

    // Step evaluating candidate degrees
    steps.push({
      stepIndex: stepCount++,
      codeLine: 21,
      explanation: {
        what: `Evaluated ${candidates.length} candidate moves from (${currR}, ${currC}) via Warnsdorff degrees.`,
        why: "Warnsdorff's rule prioritizes squares with the fewest onward unvisited neighbors.",
      },
      primarySnapshot: {
        kind: "grid",
        grid: buildGrid(currR, currC, candidates),
      },
      auxiliaryState: {
        customState: {
          "Candidates Evaluated": candidates
            .map(([deg, r, c]) => `(${r},${c}):deg=${deg}`)
            .join(", "),
        },
      },
      variables: {
        candidateCount: candidates.length,
        minDegree: Math.min(...candidates.map((c) => c[0])),
      },
    });

    candidates.sort((a, b) => a[0] - b[0]);
    const [, nextR, nextC] = candidates[0];

    board[nextR][nextC] = moveIdx;
    currR = nextR;
    currC = nextC;

    steps.push({
      stepIndex: stepCount++,
      codeLine: 27,
      explanation: {
        what: `Moved knight to (${currR}, ${currC}) (step ${moveIdx + 1}).`,
        why: "Selected candidate move with minimum onward degree.",
      },
      primarySnapshot: {
        kind: "grid",
        grid: buildGrid(currR, currC),
      },
      auxiliaryState: {
        customState: {
          "Current Position": `(${currR}, ${currC})`,
          "Moves Completed": moveIdx + 1,
          "Total Squares": totalSquares,
        },
      },
      variables: {
        currR,
        currC,
        visitedCount: moveIdx + 1,
      },
    });
  }

  if (tourSuccess) {
    steps.push({
      stepIndex: stepCount++,
      codeLine: 30,
      explanation: {
        what: `Completed full Knight's Tour visiting all ${totalSquares} squares!`,
        why: "Warnsdorff's heuristic guided the knight through all squares without backtracking.",
      },
      primarySnapshot: {
        kind: "grid",
        grid: buildGrid(currR, currC),
      },
      auxiliaryState: {
        customState: {
          Status: "Tour Complete!",
          "Total Moves": totalSquares,
        },
      },
      variables: {
        completed: true,
        totalSquares,
      },
    });
  }

  return steps;
};

export const knightsTourWarnsdorff: AlgorithmDefinition<KnightsTourInput> = {
  id: "knights-tour-warnsdorff",
  title: "Knight's Tour (Warnsdorff's Heuristic)",
  category: "backtracking",
  difficulty: "Medium",
  description:
    "A Knight's Tour is a sequence of moves on an N×N chessboard such that the knight visits every square exactly once. Warnsdorff's heuristic directs the knight to always move to an unvisited square with the smallest number of valid onward unvisited moves, turning exponential backtracking into a greedy polynomial search.",
  constraints: ["3 <= N <= 8", "0 <= startRow, startCol < N"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "N = 5, start = (0, 0)",
      outputDisplay: "25/25 squares visited",
      title: "5x5 Corner Start",
      input: { size: 5, startRow: 0, startCol: 0 },
      output: "Full tour completed in 25 moves",
      explanation: "Standard 5x5 board tour completing all 25 squares.",
    },
    {
      kind: "complex",
      inputDisplay: "N = 6, start = (2, 2)",
      outputDisplay: "36/36 squares visited",
      title: "6x6 Center Start",
      input: { size: 6, startRow: 2, startCol: 2 },
      output: "Full tour completed in 36 moves",
      explanation: "6x6 chessboard starting near center using Warnsdorff degrees.",
    },
    {
      kind: "negative",
      inputDisplay: "N = 3, start = (0, 0)",
      outputDisplay: "Dead end after 8 moves",
      title: "Impossible 3x3 Board",
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
    time: "Warnsdorff's heuristic reduces move choices to the minimum degree onward vertex. On standard boards, this heuristic finds a valid tour in O(N^2) time without deep backtracking.",
    space: "O(N^2) space required to maintain the N×N chessboard matrix.",
  },
  topicGuide: {
    overview:
      "The Knight's Tour problem is a classical Hamiltonian path problem on a knight's graph representation of a chessboard. Using pure depth-first search results in severe combinatorial explosion. Warnsdorff's heuristic solves the tour efficiently by choosing candidates with minimum onward degree.",
    sections: [
      {
        heading: "Warnsdorff's Rule",
        body: "Always move the knight to an unvisited square that has the FEWEST onward valid unvisited knight moves. This keeps open options on harder-to-reach edge and corner squares.",
      },
      {
        heading: "Tie Breaking",
        body: "When multiple candidate squares tie for minimum degree, breaking ties uniformly or based on distance from board center helps prevent getting trapped in early dead ends.",
      },
    ],
    keyTerms: [
      {
        term: "Knight's Graph",
        definition:
          "A graph where each chessboard square is a vertex and edges connect valid knight moves.",
      },
      {
        term: "Warnsdorff Degree",
        definition:
          "The number of valid onward unvisited squares accessible from a candidate square.",
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
      chapter: "Ch 19",
      label: "Competitive Programmer's Handbook, Ch 19",
    },
  ],
  defaultInput: DEFAULT_KNIGHTS_TOUR_INPUT,
};
