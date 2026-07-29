import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SpragueGrundyInput {
  pileSizes: number[];
  allowedMoves: number[];
}

export const PYTHON_SPRAGUE_GRUNDY_CODE = `def mex(s: set[int]) -> int:
    m = 0
    while m in s:
        m += 1
    return m

def sprague_grundy(pile_sizes: list[int], allowed_moves: list[int]) -> tuple[list[int], int]:
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
    return g, nim_sum`;

export const DEFAULT_SPRAGUE_GRUNDY_INPUT: SpragueGrundyInput = {
  pileSizes: [4, 6],
  allowedMoves: [1, 2, 3],
};

export const SPRAGUE_GRUNDY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Sprague-Grundy Theorem</strong> is the unifying cornerstone of impartial combinatorial game theory under normal play rules. It proves that every position in ANY impartial game (such as subtraction games, Nim, or coin turning) is mathematically equivalent to a single Nim heap of size <code>G</code>, known as the Grundy value (or nim-value) of that position. Furthermore, when a game consists of multiple independent subgame components played concurrently, the total Grundy value of the combined game is simply the bitwise XOR sum (Nim-sum) of the individual subgame Grundy values:</p><p><code>G_total = G(P₁) ⊕ G(P₂) ⊕ ... ⊕ G(Pₖ)</code></p>",
  sections: [
    {
      heading: "Impartial Games & The Minimum Excluded Value (MEX)",
      body: "<p>In an impartial game under normal play, available moves from any position are identical for both players, and the last player to make a valid move wins (a player with 0 valid moves loses). The Grundy value <code>G(u)</code> of a game state <code>u</code> is defined recursively as the Minimum Excluded Value (mex) of the Grundy values of all states <code>v</code> directly reachable from <code>u</code> in 1 move: <code>G(u) = mex({G(v) : u → v})</code>. The mex of a set S is the smallest non-negative integer (0, 1, 2, ...) absent from S. Terminal losing states with no valid moves have <code>G(u) = mex(∅) = 0</code>.</p>",
    },
    {
      heading: "Dynamic Programming for Grundy Values in Subtraction Games",
      body: "<p>For subtraction games with allowed move set <code>M = {m₁, m₂, ...}</code>, we compute Grundy values iteratively for all state sizes <code>i</code> from 0 up to max(pile_sizes). State 0 has <code>G(0) = 0</code>. For state <code>i</code>, we evaluate all valid moves <code>m ∈ M</code> where <code>i - m ≥ 0</code>, collect the reachable Grundy values <code>g[i - m]</code> into a set reachable, and set <code>g[i] = mex(reachable)</code>. This takes <code>O(K × |M|)</code> dynamic programming time for state K.</p>",
    },
    {
      heading: "Subgame Independence & The Nim-Sum Property",
      body: "<p>When playing multiple independent game piles concurrently, a player chooses 1 pile on their turn and executes a valid move on that pile alone. The Sprague-Grundy Theorem states that the overall Grundy value G of the combined game is the bitwise XOR sum of the component Grundy values: <code>G = G(P₁) ⊕ G(P₂) ⊕ ... ⊕ G(Pₙ)</code>. If <code>G &gt; 0</code>, the first player has a forced winning strategy (N-position); if <code>G = 0</code>, the second player wins (P-position).</p>",
    },
    {
      heading: "Periodicity & Pattern Detection in Game Theory",
      body: "<p>For many subtraction games, Grundy value sequences display periodic repeating patterns after an initial pre-period. Detecting period length P allows computing the Grundy value <code>g[N]</code> for arbitrarily massive numbers in <code>O(1)</code> time without computing millions of DP states.</p>",
    },
  ],
  keyTerms: [
    {
      term: "MEX (Minimum Excluded Value)",
      definition:
        "The smallest non-negative integer (0, 1, 2, 3, ...) that is absent from a given set of non-negative integers.",
    },
    {
      term: "Grundy Value (Nim-Value)",
      definition:
        "An integer representing the equivalent Nim heap size of an arbitrary impartial game state.",
    },
    {
      term: "Impartial Game",
      definition:
        "A game where legal move options depend solely on the current board state, not on which player's turn it is.",
    },
    {
      term: "Nim-Sum of Independent Subgames",
      definition:
        "The bitwise XOR sum G(P₁) ⊕ G(P₂) ⊕ ... ⊕ G(Pₙ) that evaluates the combined winning status of concurrent subgames.",
    },
  ],
};

export const SPRAGUE_GRUNDY_TRIVIA: TriviaMeta = {
  skipLines: [6],
  distractors: [
    "g[i] = min(reachable) if reachable else 0",
    "nim_sum = sum(g)",
    "g[i] = max(reachable) + 1",
  ],
  hints: [
    {
      line: 11,
      hint: "Mex is the smallest non-negative integer absent from the set",
    },
    {
      line: 15,
      hint: "Assign mex(reachable) to g[i]",
    },
  ],
  lineExplanations: {
    1: "Defines mex(s) helper function calculating minimum excluded non-negative integer.",
    2: "Initializes candidate non-negative integer m = 0.",
    3: "Loops while candidate integer m is present in set s.",
    4: "Increments candidate integer m by 1.",
    5: "Returns smallest non-negative integer m absent from set s.",
    6: "Empty line separating helper function from main function.",
    7: "Defines sprague_grundy function computing Grundy values and total Nim-Sum.",
    8: "Calculates maximum pile size max_p to bound dynamic programming array.",
    9: "Allocates Grundy values array g of size max_p + 1 initialized to 0.",
    10: "Loops through each state size i from 1 to max_p.",
    11: "Initializes empty set reachable for storing Grundy values of reachable states.",
    12: "Loops over each allowed move m in allowed_moves.",
    13: "Evaluates if subtracting move m lands on a valid state (i - m >= 0).",
    14: "Adds reachable state Grundy value g[i - m] to reachable set.",
    15: "Computes g[i] as mex(reachable) and stores it in Grundy array.",
    16: "Initializes total Nim-Sum accumulator variable to 0.",
    17: "Loops over each pile size p in pile_sizes.",
    18: "Accumulates pile Grundy value g[p] into total Nim-Sum via XOR: nim_sum ^= g[p].",
    19: "Returns complete Grundy array g and combined game Nim-Sum.",
  },
};

export const generateSpragueGrundySteps = (input: SpragueGrundyInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const piles = (
    input && Array.isArray(input.pileSizes) && input.pileSizes.length > 0
      ? input.pileSizes
      : DEFAULT_SPRAGUE_GRUNDY_INPUT.pileSizes
  ).map((p) => Math.max(0, Math.floor(p)));
  const moves = (
    input && Array.isArray(input.allowedMoves) && input.allowedMoves.length > 0
      ? input.allowedMoves
      : DEFAULT_SPRAGUE_GRUNDY_INPUT.allowedMoves
  )
    .map((m) => Math.max(1, Math.floor(m)))
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .sort((a, b) => a - b);

  const maxP = piles.length > 0 ? Math.max(...piles) : 0;
  const g = new Array<number>(maxP + 1).fill(0);

  const makeElements = (currentIdx?: number, targetIdx?: number): ArrayElement[] => {
    const elts: ArrayElement[] = [];

    for (let i = 0; i <= maxP; i++) {
      const isPile = piles.includes(i);
      const isCurrent = currentIdx === i;
      const isTarget = targetIdx === i;

      let state: ArrayElement["state"] = "default";
      if (isCurrent) state = "active";
      else if (isTarget) state = "compare";
      else if (isPile) state = "sorted";

      const pointers: string[] = [];
      if (isCurrent) pointers.push(`i=${i}`);
      if (isTarget) pointers.push(`i-m=${i}`);
      if (isPile) pointers.push("pile");

      elts.push({
        id: `g-${i}`,
        value: g[i],
        label: `state ${i}: G=${g[i]}`,
        state,
        pointers,
      });
    }

    return elts;
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Initialize Sprague-Grundy theorem analysis for piles [${piles.join(", ")}] with allowed moves [${moves.join(", ")}].`,
      why: "The Sprague-Grundy theorem models impartial combinatorial game states as equivalent Nim heaps using mex (Minimum Excluded Value) recursion.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: {
        "Piles Count": piles.length,
        "Max Pile Size": maxP,
        "Allowed Moves": moves.join(", "),
      },
    },
    variables: { maxP },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Allocate Grundy table G of size max_p + 1 = ${maxP + 1}.`,
      why: "Dynamic programming tabulates the Grundy values G(i) for all state sizes from 0 to max_p.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: { "Table Size": maxP + 1 },
    },
    variables: { maxP },
  });

  g[0] = 0;

  for (let i = 1; i <= maxP; i++) {
    const reachable = new Set<number>();
    const reachableDetails: string[] = [];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Evaluate Grundy value for game state size i = ${i}.`,
        why: "We compute G(i) by examining all states reachable in 1 move and taking their minimum excluded value (mex).",
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(i),
      },
      auxiliaryState: {
        hashMap: { currentState: i, reachableSet: "{}" },
      },
      variables: { i },
    });

    for (const m of moves) {
      if (i - m >= 0) {
        const nextState = i - m;
        const nextGrundy = g[nextState];
        reachable.add(nextGrundy);
        reachableDetails.push(`move ${m} -> state ${nextState} (G=${nextGrundy})`);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 21,
          explanation: {
            what: `Inspect move m = ${m}: state ${i} - ${m} = state ${nextState} (Grundy G(${nextState}) = ${nextGrundy}).`,
            why: "Subtracting allowed move m transitions to a smaller game state whose Grundy value is added to the reachable set.",
          },
          primarySnapshot: {
            kind: "array",
            elements: makeElements(i, nextState),
          },
          auxiliaryState: {
            hashMap: {
              currentState: i,
              move: m,
              targetState: nextState,
              targetGrundy: nextGrundy,
              reachableSet: `{${Array.from(reachable)
                .sort((a, b) => a - b)
                .join(", ")}}`,
            },
          },
          variables: { i, m, nextState, nextGrundy },
        });
      }
    }

    let mex = 0;
    while (reachable.has(mex)) {
      mex++;
    }
    g[i] = mex;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Compute mex({${Array.from(reachable)
          .sort((a, b) => a - b)
          .join(", ")}}) = ${mex}. Set G(${i}) = ${mex}.`,
        why: `The Minimum Excluded Value (mex) is the smallest non-negative integer absent from reachable Grundy values, establishing G(${i}) = ${mex}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(i),
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: "Initialize total game Nim-Sum register to 0.",
      why: "The overall game status is determined by XOR-ing the Grundy values of all active piles.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: { nimSum: 0 },
    },
    variables: { nimSum: 0 },
  });

  let nimSum = 0;
  const pileGrundySummary: string[] = [];
  for (const p of piles) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 25,
      explanation: {
        what: `Inspect pile size p = ${p} (Grundy value G(${p}) = ${g[p]}).`,
        why: `XOR-ing G(${p}) = ${g[p]} into running total game Nim-Sum.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(p),
      },
      auxiliaryState: {
        hashMap: { currentPile: p, pileGrundy: g[p], runningNimSum: nimSum },
      },
      variables: { p, "g[p]": g[p], nimSum },
    });

    nimSum ^= g[p];
    pileGrundySummary.push(`G(${p})=${g[p]}`);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 26,
      explanation: {
        what: `Fold G(${p}) = ${g[p]} into Nim-Sum (running total Nim-Sum = ${nimSum}).`,
        why: "Subgame independence guarantees that concurrent impartial subgames combine by XOR-ing their individual Grundy values.",
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(p),
      },
      auxiliaryState: {
        hashMap: { currentPile: p, pileGrundy: g[p], runningNimSum: nimSum },
      },
      variables: { p, "g[p]": g[p], nimSum },
    });
  }

  const winningPlayer = nimSum !== 0 ? "First Player (P1)" : "Second Player (P2)";

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: `Final outcome: Nim-Sum across piles [${piles.join(", ")}] is ${pileGrundySummary.join(" ⊕ ")} = ${nimSum}.`,
      why: `Nim-Sum is ${nimSum === 0 ? "ZERO (Second Player forced win)" : "NON-ZERO (First Player forced win)"}. Outcome: ${winningPlayer} has a forced winning strategy.`,
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

export const spragueGrundyTheorem: AlgorithmDefinition<SpragueGrundyInput> = {
  id: "sprague-grundy-theorem",
  title: "Sprague-Grundy Theorem & Grundy Values",
  topicIds: ["math_and_number_theory", "game_theory"],
  difficulty: "Medium",
  description:
    "<p>The Sprague-Grundy Theorem states that every impartial game position is mathematically equivalent to a Nim pile of size equal to its Grundy value:</p><p><code>G(u) = mex({G(v) : u → v})</code></p><p>For games composed of independent subgame components, the combined game's winning status is determined by the bitwise XOR sum (Nim-sum) of their individual Grundy values:</p><p><code>G_total = G(P₁) ⊕ G(P₂) ⊕ ... ⊕ G(Pₖ)</code></p>",
  constraints: [
    "1 <= pileSizes.length <= 10",
    "0 <= pileSizes[i] <= 50",
    "1 <= allowedMoves[i] <= 20",
  ],
  examples: [
    {
      kind: "basic",
      title: "Piles [4, 6] with moves [1, 2, 3]",
      input: { pileSizes: [4, 6], allowedMoves: [1, 2, 3] },
      output: "Nim-Sum: 2 (P1 Wins)",
      explanation: "G(4) = 0, G(6) = 2. Nim-Sum = 0 XOR 2 = 2 != 0, so First Player wins.",
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
    time: "Computing Grundy values up to maximum pile size M takes O(M × |Moves|) transitions.",
    space: "Requires O(M) auxiliary space to store Grundy values.",
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
