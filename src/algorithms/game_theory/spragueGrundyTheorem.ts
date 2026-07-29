import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SpragueGrundyInput {
  pileSizes: number[];
  allowedMoves: number[];
}

export const PYTHON_SPRAGUE_GRUNDY_CODE = `class Solution:
    def __init__(self):
        pass

    def nimGame(self, piles: list[int]) -> bool:
        xor_sum = 0
        for p in piles:
            xor_sum ^= p
        return xor_sum != 0`;

export const DEFAULT_SPRAGUE_GRUNDY_INPUT: SpragueGrundyInput = {
  pileSizes: [4, 6],
  allowedMoves: [1, 2, 3],
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "The Sprague-Grundy theorem states that every position in an impartial game is equivalent to a single Nim pile of size equal to its Grundy value G(u).",
      gTable: [0, 1, 2, 0, 1],
      reachable: [0, 1],
      vars: { "State 4": "G(4) = 1", "Equivalent Nim Pile": 1 },
    },
    {
      narrative:
        "Under normal play, two players alternate moves under identical rules, and the player making the last valid move wins.",
      gTable: [0, 1, 2],
      reachable: [0],
      vars: { Rule: "Normal Play", Winner: "Last legal move" },
    },
    {
      narrative:
        "The Minimum Excluded Value (MEX) of a set of non-negative integers is the smallest non-negative integer absent from that set.",
      gTable: [0, 1, 2],
      reachable: [0, 1, 3],
      vars: { "Reachable Set": "{0, 1, 3}", MEX: 2 },
    },
    {
      narrative:
        "The Grundy value G(u) of a state u is recursively defined as the MEX of Grundy values of all states reachable from u in one legal move.",
      gTable: [0, 1, 2],
      reachable: [0, 1],
      vars: { Formula: "G(u) = mex({G(v)})", "Computed G(u)": 2 },
    },
    {
      narrative:
        "Terminal states with no valid moves available have an empty reachable set {}, so G(0) = mex({}) = 0 serves as the base case.",
      gTable: [0],
      reachable: [],
      vars: { "Terminal State": 0, "G(0)": 0 },
    },
    {
      narrative:
        "We populate a dynamic programming Grundy table G[0..M] bottom-up for state sizes up to the maximum pile size M.",
      gTable: [0, 1, 2, 0, 1, 2],
      reachable: [0, 1],
      vars: { Table: "G[0..M]", Strategy: "Bottom-Up DP" },
    },
    {
      narrative:
        "When playing independent subgames concurrently, the total combined game Grundy value equals the bitwise XOR sum of individual pile Grundy values.",
      gTable: [0, 1, 2, 0, 1, 2],
      reachable: [0, 2],
      vars: { "Subgame XOR": "G(P1) ^ G(P2)", "Total Nim-Sum": 2 },
    },
    {
      narrative:
        "If total Nim-sum G_total is non-zero, the First Player has a forced winning strategy (N-position); if G_total is zero, the Second Player wins (P-position).",
      gTable: [0, 1, 2, 0, 1, 2],
      reachable: [0, 1, 2],
      vars: { "G_total != 0": "First Player Wins", "G_total = 0": "Second Player Wins" },
    },
    {
      narrative:
        "Computing Grundy values up to size M takes O(M * |Moves|) time and O(M) auxiliary space.",
      gTable: [0, 1, 2, 0, 1, 2],
      reachable: [0, 1, 2, 3],
      vars: { "Time Complexity": "O(M * |Moves|)", "Space Complexity": "O(M)" },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      variables: data.vars,
      primarySnapshot: {
        kind: "composite",
        layout: "horizontal",
        heading: "Sprague-Grundy Concept Representation",
        items: [
          {
            id: "grundy_table",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "G",
              mode: "box",
              elements: data.gTable.map((val, i) => ({
                id: `intro-g-${i}`,
                value: val,
                label: `G(${i})`,
                state: i === data.gTable.length - 1 ? ("active" as const) : ("default" as const),
              })),
            },
          },
          {
            id: "reachable_set",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "reachable_set",
              mode: "box",
              elements:
                data.reachable.length > 0
                  ? data.reachable.map((rVal, rIdx) => ({
                      id: `intro-r-${rIdx}`,
                      value: rVal,
                      label: `r${rIdx}`,
                      state: "compare" as const,
                    }))
                  : [
                      {
                        id: "intro-empty",
                        value: "Empty {}",
                        label: "No Moves",
                        state: "visited" as const,
                      },
                    ],
            },
          },
        ],
      },
    }),
  );
};

export const generateSpragueGrundySteps = (input: SpragueGrundyInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

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

  const createCompositeSnapshot = (
    activeIdx?: number,
    reachableVals: number[] = [],
    headingText: string = "Grundy Table DP",
    isDone: boolean = false,
  ) => {
    const gElements: ArrayElement[] = Array.from({ length: maxP + 1 }, (_, i) => ({
      id: `g-${i}`,
      value: g[i],
      label: `State ${i}`,
      state: isDone
        ? ("sorted" as ElementState)
        : i === activeIdx
          ? ("active" as ElementState)
          : i < (activeIdx ?? 0)
            ? ("sorted" as ElementState)
            : ("default" as ElementState),
      pointers: i === activeIdx ? ["current"] : undefined,
    }));

    const reachableElements: ArrayElement[] =
      reachableVals.length > 0
        ? reachableVals.map((val, idx) => ({
            id: `r-${idx}`,
            value: val,
            label: `val ${idx}`,
            state: "compare" as ElementState,
          }))
        : [
            {
              id: "r-empty",
              value: "Empty {}",
              label: "Reachable",
              state: "visited" as ElementState,
            },
          ];

    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: headingText,
      items: [
        {
          id: "g_array",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "G",
            mode: "box" as const,
            elements: gElements,
          },
        },
        {
          id: "reachable_set_array",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "reachable_set",
            mode: "box" as const,
            elements: reachableElements,
          },
        },
      ],
    };
  };

  // Step 1: Initialize
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize Grundy table G[0..${maxP}] for piles [${piles.join(", ")}] with allowed moves [${moves.join(", ")}].`,
      variables: {
        "Max Pile Size M": maxP,
        "Allowed Moves": moves.join(", "),
        "Piles Count": piles.length,
      },
      primarySnapshot: createCompositeSnapshot(undefined, [], "Initialization"),
    }),
  );

  // Step 2: Base case G(0) = 0
  g[0] = 0;
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `State 0 has zero legal move choices, yielding an empty reachable set {}. Setting G(0) = mex({}) = 0 as base case.`,
      variables: {
        "Current State": 0,
        "Reachable Set": "{}",
        "MEX Value": 0,
        "G(0)": 0,
      },
      primarySnapshot: createCompositeSnapshot(0, [], "Base Case G(0)"),
    }),
  );

  // Step 3..maxP+2: Fill G table bottom-up
  for (let i = 1; i <= maxP; i++) {
    const reachableList: number[] = [];
    const reachableSet = new Set<number>();
    for (const m of moves) {
      if (i - m >= 0) {
        const val = g[i - m];
        if (!reachableSet.has(val)) {
          reachableSet.add(val);
          reachableList.push(val);
        }
      }
    }
    reachableList.sort((a, b) => a - b);

    // Inspect frame
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Inspecting State ${i}: testing allowed moves [${moves.join(", ")}] yields valid sub-states [${moves
          .filter((m) => i - m >= 0)
          .map((m) => i - m)
          .join(", ")}] with reachable Grundy values {${reachableList.join(", ")}}.`,
        variables: {
          "Current State": i,
          "Allowed Moves": moves.join(", "),
          "Valid Sub-States":
            moves
              .filter((m) => i - m >= 0)
              .map((m) => i - m)
              .join(", ") || "None",
          "Reachable Grundy Values": `{${reachableList.join(", ")}}`,
        },
        primarySnapshot: createCompositeSnapshot(i, reachableList, `Inspecting State ${i}`),
      }),
    );

    // Consequence frame
    let mex = 0;
    while (reachableSet.has(mex)) {
      mex++;
    }
    g[i] = mex;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `State ${i}: the minimum non-negative integer missing from reachable set {${reachableList.join(", ")}} is ${mex}, setting G(${i}) = ${mex}.`,
        variables: {
          "Current State": i,
          "Reachable Set": `{${reachableList.join(", ")}}`,
          "Calculated MEX": mex,
          [`G(${i})`]: mex,
        },
        primarySnapshot: createCompositeSnapshot(i, reachableList, `Setting G(${i}) = ${mex}`),
      }),
    );
  }

  // Combine subgames Nim-sum
  let nimSum = 0;
  const pileGrundies: number[] = [];
  for (const p of piles) {
    pileGrundies.push(g[p]);
    nimSum ^= g[p];
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Combining subgames: mapped pile sizes [${piles.join(", ")}] to Grundy values [${pileGrundies.join(", ")}]. Bitwise XOR sum G_total = ${pileGrundies.join(" ^ ")} = ${nimSum}.`,
      variables: {
        "Pile Sizes": piles.join(", "),
        "Grundy Values": pileGrundies.join(", "),
        "Combined Nim-Sum G": nimSum,
      },
      primarySnapshot: createCompositeSnapshot(piles[0], pileGrundies, "Subgame XOR Combination"),
    }),
  );

  // Final completion
  const outcomeText =
    nimSum !== 0 ? "First Player forced win (G != 0)" : "Second Player forced win (G = 0)";
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Sprague-Grundy evaluation complete. Total combined game Nim-sum G = ${nimSum}. Final Outcome: ${outcomeText}.`,
      variables: {
        "Grundy Table": `G[0..${maxP}] = [${g.join(", ")}]`,
        "Combined Nim-Sum G": nimSum,
        "Winning Outcome": outcomeText,
      },
      primarySnapshot: createCompositeSnapshot(undefined, [], "Evaluation Complete", true),
    }),
  );

  return steps;
};

const SPRAGUE_GRUNDY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Sprague-Grundy Theorem equates impartial game states under normal play to single Nim piles using minimum excluded value (MEX) recursion.</p>",
  sections: [
    {
      heading: "MEX and Grundy Recursion",
      body: "<p>For any game state <code>u</code>, its Grundy value is <code>G(u) = mex({G(v) | v &isin; Reachable(u)})</code>. Base terminal states with no valid moves have <code>G(0) = 0</code>.</p>",
    },
    {
      heading: "Subgame Combination & Nim-Sum",
      body: "<p>When playing multiple independent subgames simultaneously, the combined game state has Grundy value <code>G<sub>total</sub> = G(P<sub>1</sub>) &oplus; G(P<sub>2</sub>) &oplus; &hellip; &oplus; G(P<sub>k</sub>)</code>. If <code>G<sub>total</sub> &ne; 0</code>, the First Player wins; otherwise the Second Player wins.</p>",
    },
  ],
  keyTerms: [
    {
      term: "MEX",
      definition: "Minimum Excluded Value of a set of non-negative integers.",
    },
    {
      term: "Grundy Value",
      definition: "The equivalent Nim pile size for an impartial game position.",
    },
  ],
};

export const SPRAGUE_GRUNDY_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const spragueGrundyTheorem: AlgorithmDefinition<SpragueGrundyInput> = {
  id: "sprague-grundy-theorem",
  title: "Sprague-Grundy Theorem & Grundy Values",
  topicIds: ["math_and_number_theory", "game_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute Grundy values for game state sizes using MEX (Minimum Excluded Value) recursion, and evaluate the combined Nim-sum across multiple independent subgame piles.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>pileSizes</code> (<code>int[]</code>): Array of initial pile sizes.</li>" +
    "<li><code>allowedMoves</code> (<code>int[]</code>): Array of allowed move subtraction step sizes.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>tuple</code>: Grundy value array and combined game Nim-sum.</li></ul>",
  constraints: [
    "1 <= pileSizes.length <= 10",
    "0 <= pileSizes[i] <= 50",
    "1 <= allowedMoves[i] <= 20",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Piles [4, 6] with moves [1, 2, 3]",
      input: { pileSizes: [4, 6], allowedMoves: [1, 2, 3] },
      output: "Nim-Sum: 2 (P1 Wins)",
      explanation: "G(4) = 0, G(6) = 2. Nim-Sum = 0 XOR 2 = 2 != 0.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Empty Piles [0, 0]",
      input: { pileSizes: [0, 0], allowedMoves: [1, 2] },
      output: "Nim-Sum: 0 (P2 Wins)",
      explanation: "No legal moves remain; initial state is terminal P-position.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Three piles with moves [1, 3, 4]",
      input: { pileSizes: [5, 7, 9], allowedMoves: [1, 3, 4] },
      output: "Nim-Sum: 0 (P2 Wins)",
      explanation: "Grundy values yield Nim-Sum = 0.",
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
    time: "Computing Grundy values takes O(M x |Moves|) time.",
    space: "Requires O(M) space.",
  },
  topicGuide: SPRAGUE_GRUNDY_TOPIC_GUIDE,
  trivia: SPRAGUE_GRUNDY_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1908,
      leetcodeId: 1908,
      url: "https://leetcode.com/problems/game-of-nim/",
      label: "LeetCode #1908",
      title: "Game of Nim",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 25,
      chapterTitle: "Game Theory",
      section: "25.2 Sprague–Grundy theorem",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 1908,
    url: "https://leetcode.com/problems/game-of-nim/",
  },
  defaultInput: DEFAULT_SPRAGUE_GRUNDY_INPUT,
  generateSteps: generateSpragueGrundySteps,
};

export default spragueGrundyTheorem;
