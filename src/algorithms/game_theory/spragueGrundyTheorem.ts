import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SpragueGrundyInput {
  pileSizes: number[];
  allowedMoves: number[];
}

export const PYTHON_SPRAGUE_GRUNDY_CODE = `
def mex(s: set[int]) -> int:
    m = 0
    while m in s:
        m += 1
    return m

def sprague_grundy(pile_sizes: list[int], allowed_moves: list[int]) -> tuple[list[int], int]:
    """
    Computes Grundy values (nim-values) for states up to max(pile_sizes) and evaluates total Nim-Sum.
    """
    max_p = max(pile_sizes) if pile_sizes else 0
    g = [0] * (max_p + 1)
    for i in range(1, max_p + 1):
        reachable = set()
        for m in allowed_moves:
            if i - m >= 0:
                reachable.add(g[i - m])
        g[i] = mex(reachable)
    nim_sum = 0
    for p in pile_sizes:
        nim_sum ^= g[p]
    return g, nim_sum
`;

export const DEFAULT_SPRAGUE_GRUNDY_INPUT: SpragueGrundyInput = {
  pileSizes: [3, 4],
  allowedMoves: [1, 2, 3],
};

export const generateSpragueGrundySteps = (input: SpragueGrundyInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const piles = (input.pileSizes || [3, 4]).map((p) => Math.max(0, Math.floor(p)));
  const moves = (input.allowedMoves || [1, 2, 3])
    .map((m) => Math.max(1, Math.floor(m)))
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
        Piles: piles.join(", "),
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
        what: `Evaluating state ${i}: Reachable Grundy values = {${Array.from(reachable)
          .sort((a, b) => a - b)
          .join(", ")}}. mex = ${mex}.`,
        why: `Smallest non-negative integer absent from reachable Grundy values is ${mex}, so G(${i}) = ${mex}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(i, Array.from(reachable)),
      },
      auxiliaryState: {
        hashMap: {
          [`G(${i})`]: mex,
          "Reachable Set": `{${Array.from(reachable)
            .sort((a, b) => a - b)
            .join(", ")}}`,
          Transitions: reachableDetails.join("; "),
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

export const SPRAGUE_GRUNDY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Sprague-Grundy Theorem states that every impartial game under the normal play convention is mathematically equivalent to a single heap of size g in the game of Nim, where g is the Grundy value (or nim-value) of the game position. This powerful theorem allows complex multi-component combinatorial games to be solved in polynomial time.",
  sections: [
    {
      heading: "Impartial Games & Normal Play Convention",
      body: "An impartial game is a two-player game with perfect information where the available moves depend solely on the current state, regardless of whose turn it is. Under the normal play convention, the last player to make a legal move wins (a player facing zero legal moves loses).",
    },
    {
      heading: "Minimum Excluded Value (MEX) & Grundy Values",
      body: "The Grundy value G(u) of a game state u is defined recursively as the Minimum Excluded Value (mex) of the Grundy values of all states reachable from u in one valid move: G(u) = mex({G(v) : u -> v}). Terminal losing states with no valid moves have G(u) = 0.",
    },
    {
      heading: "Nim-Sum & Subgame Independence",
      body: "When a game consists of several independent subgames played concurrently (such as multiple independent coin piles or rows), the overall Grundy value G of the combined game is the bitwise XOR sum (Nim-Sum) of the individual subgame Grundy values: G = G1 ⊕ G2 ⊕ ... ⊕ Gk. If G > 0, the first player has a forced winning strategy; if G = 0, the second player wins.",
    },
    {
      heading: "Algorithmic Dynamic Programming & Patterns",
      body: "For subtraction games or graph-based impartial games, Grundy values up to state M can be computed using dynamic programming in O(M * |Moves|) time. Frequently, Grundy value sequences exhibit periodic patterns that can be detected early to answer queries for arbitrarily large state values in O(1) time.",
    },
  ],
  keyTerms: [
    {
      term: "MEX (Minimum Excluded Value)",
      definition:
        "The smallest non-negative integer (0, 1, 2, ...) absent from a given set of non-negative integers.",
    },
    {
      term: "Grundy Value (Nim-Value)",
      definition: "An integer representing the equivalent Nim heap size of a game state.",
    },
    {
      term: "Impartial Game",
      definition:
        "A game where available moves and winning conditions are identical for both players from any given state.",
    },
  ],
};

export const SPRAGUE_GRUNDY_TRIVIA: TriviaMeta = {
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
  categories: ["game_theory"],
  difficulty: "Medium",
  description:
    "Given a set of impartial game piles and a set of allowed move subtractions, compute the Grundy values (nim-values) of all states using the Minimum Excluded Value (mex) operation and determine the combined game Nim-Sum to identify whether the first or second player has a forced winning strategy.",
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
