import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SpragueGrundyInput {
  pileSizes: number[];
  allowedMoves: number[];
}

export const PYTHON_SPRAGUE_GRUNDY_CODE = `def calculate_mex(s: set[int]) -> int:
    mex = 0
    while mex in s:
        mex += 1
    return mex

def sprague_grundy(piles: list[int], moves: list[int]) -> tuple[list[int], int]:
    max_p = max(piles) if piles else 0
    g = [0] * (max_p + 1)
    for i in range(1, max_p + 1):
        reachable = set()
        for m in moves:
            if i - m >= 0:
                reachable.add(g[i - m])
        g[i] = calculate_mex(reachable)
    nim_sum = 0
    for p in piles:
        nim_sum ^= g[p]
    return g, nim_sum`;

export const DEFAULT_SPRAGUE_GRUNDY_INPUT: SpragueGrundyInput = {
  pileSizes: [3, 4],
  allowedMoves: [1, 2, 3],
};

export const generateSpragueGrundySteps = (input: SpragueGrundyInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const piles = (input.pileSizes || [3, 4]).map(p => Math.max(0, Math.floor(p)));
  const moves = (input.allowedMoves || [1, 2, 3])
    .map(m => Math.max(1, Math.floor(m)))
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .sort((a, b) => a - b);

  const maxP = piles.length > 0 ? Math.max(...piles) : 0;
  const g = new Array<number>(maxP + 1).fill(0);

  const makeElements = (currentIdx?: number, mexSet?: number[]): ArrayElement[] => {
    const elts: ArrayElement[] = [];

    for (let i = 0; i <= maxP; i++) {
      const isPile = piles.includes(i);
      const isCurrent = currentIdx === i;

      elts.push({
        id: `g-${i}`,
        value: g[i],
        state: isCurrent ? "active" : isPile ? "sorted" : "default",
        pointers: [`state ${i}${isPile ? " (pile)" : ""}`],
      });
    }

    if (mexSet && mexSet.length > 0) {
      elts.push({
        id: "mex-val",
        value: g[currentIdx || 0],
        state: "compare",
        pointers: ["mex"],
      });
    }

    return elts;
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Initializing Sprague-Grundy theorem calculation for piles [${piles.join(", ")}] with allowed moves [${moves.join(", ")}].`,
      why: "Every impartial game under normal play is equivalent to a Nim pile of size equal to its Grundy value G(s) = mex({G(t) : s -> t}).",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: {
        "Piles": piles.join(", "),
        "Allowed Moves": moves.join(", "),
        "G(0)": 0,
      },
    },
    variables: { maxPiles: maxP },
  });

  for (let i = 1; i <= maxP; i++) {
    const reachable = new Set<number>();
    const reachableDetails: string[] = [];

    for (const m of moves) {
      if (i - m >= 0) {
        const targetG = g[i - m];
        reachable.add(targetG);
        reachableDetails.push(`move ${m} -> G(${i - m})=${targetG}`);
      }
    }

    let mex = 0;
    while (reachable.has(mex)) {
      mex++;
    }
    g[i] = mex;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Evaluating state ${i}: Reachable Grundy values = {${Array.from(reachable).sort((a,b)=>a-b).join(", ")}}. mex = ${mex}.`,
        why: `Smallest non-negative integer absent from reachable Grundy values is ${mex}, so G(${i}) = ${mex}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(i, Array.from(reachable)),
      },
      auxiliaryState: {
        hashMap: {
          [`G(${i})`]: mex,
          "Reachable Set": `{${Array.from(reachable).sort((a,b)=>a-b).join(", ")}}`,
          "Transitions": reachableDetails.join("; "),
        },
      },
      variables: { i, mex },
    });
  }

  let nimSum = 0;
  const pileGrundySummary: string[] = [];
  for (const p of piles) {
    nimSum ^= g[p];
    pileGrundySummary.push(`G(${p})=${g[p]}`);
  }

  const winningPlayer = nimSum !== 0 ? "First Player (P1)" : "Second Player (P2)";

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Calculated total Nim-Sum across all game piles: ${pileGrundySummary.join(" ⊕ ")} = ${nimSum}.`,
      why: `Nim-Sum is ${nimSum === 0 ? "ZERO (Losing Position)" : "NON-ZERO (Winning Position)"}. Strategy: ${winningPlayer} has a forced winning strategy.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: {
        "Pile Grundy Values": pileGrundySummary.join(", "),
        "Nim-Sum": nimSum,
        "Winning Player": winningPlayer,
      },
    },
    variables: { nimSum, winningPlayer },
  });

  return steps;
};

const SPRAGUE_GRUNDY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Sprague-Grundy Theorem states that every impartial game under normal play convention is equivalent to a single heap in the game of Nim, whose size is the Grundy value (nim-value) of the game state.",
  sections: [
    {
      heading: "Impartial Games & Normal Play",
      body: "An impartial game is one where available moves depend only on the current state, not which player's turn it is. Under normal play, the last player to move wins.",
    },
    {
      heading: "The Minimum Excluded Value (MEX)",
      body: "The Grundy value G(u) of state u is mex({G(v) : v is reachable from u}). MEX finds the smallest non-negative integer not present in the set of reachable Grundy values.",
    },
  ],
  keyTerms: [
    {
      term: "MEX (Minimum Excluded)",
      definition: "The smallest non-negative integer (0, 1, 2...) not present in a given set of numbers.",
    },
    {
      term: "Nim-Sum",
      definition: "Bitwise XOR sum of Grundy values for independent subgames.",
    },
  ],
};

const SPRAGUE_GRUNDY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines helper function calculating minimum excluded non-negative integer (mex).",
    7: "Main Sprague-Grundy function computing Grundy values for game states.",
    8: "Finds maximum pile size max_p to size Grundy value array.",
    9: "Initializes Grundy array g of size max_p + 1 with 0s.",
    10: "Loops through game states 1 to max_p.",
    12: "Loops through allowed moves from state i.",
    14: "Adds reachable state Grundy value g[i - m] to reachable set.",
    15: "Computes g[i] as mex of reachable state Grundy values.",
    18: "XOR sums Grundy values across all active game piles to get overall Nim-Sum.",
    19: "Returns array of Grundy values and total Nim-Sum.",
  },
};

export const spragueGrundyTheorem: AlgorithmDefinition<SpragueGrundyInput> = {
  id: "sprague-grundy-theorem",
  title: "Sprague-Grundy Theorem & Grundy Values",
  category: "game_theory",
  difficulty: "Medium",
  description:
    "Analyze impartial games under normal play by computing Grundy values (nim-values) using the minimum excluded value (mex) of reachable states.",
  constraints: [
    "1 <= pileSizes.length <= 10",
    "0 <= pileSizes[i] <= 50",
    "1 <= allowedMoves[i] <= 20",
  ],
  examples: [
    {
      kind: "basic",
      title: "Piles [3, 4] with moves [1, 2, 3]",
      input: { pileSizes: [3, 4], allowedMoves: [1, 2, 3] },
      output: "Nim-Sum: 7 (P1 Wins)",
      explanation: "G(3) = 3, G(4) = 0. Nim-Sum = 3 XOR 0 = 3 != 0, so First Player wins.",
    },
    {
      kind: "complex",
      title: "Three piles with restricted moves [1, 3, 4]",
      input: { pileSizes: [5, 7, 9], allowedMoves: [1, 3, 4] },
      output: "Nim-Sum: 0 (P2 Wins)",
      explanation: "Grundy values yield Nim-Sum = 0, so Second Player wins under optimal play.",
    },
    {
      kind: "negative",
      title: "Empty Piles [0, 0]",
      input: { pileSizes: [0, 0], allowedMoves: [1, 2] },
      output: "Nim-Sum: 0 (P2 Wins)",
      explanation: "No legal moves remain; initial state is a terminal loss for First Player.",
    },
  ],
  code: PYTHON_SPRAGUE_GRUNDY_CODE,
  timeComplexity: {
    best: "O(M * |Moves|)",
    average: "O(M * |Moves|)",
    worst: "O(M * |Moves|)",
  },
  spaceComplexity: "O(M)",
  complexityAnalysis: {
    time: "Computing Grundy values up to maximum pile size M takes O(M * |Moves|) transitions.",
    space: "Requires O(M) memory to store Grundy values.",
  },
  topicGuide: SPRAGUE_GRUNDY_TOPIC_GUIDE,
  trivia: SPRAGUE_GRUNDY_TRIVIA,
    sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 25",
      label: "Competitive Programmer's Handbook, Ch 25",
    },
  ],
  defaultInput: DEFAULT_SPRAGUE_GRUNDY_INPUT,
  generateSteps: generateSpragueGrundySteps,
};
