import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface EditDistanceInput {
  word1: string;
  word2: string;
}

export const DEFAULT_EDIT_DISTANCE_INPUT: EditDistanceInput = {
  word1: "horse",
  word2: "ros",
};

export const EDIT_DISTANCE_CODE = `def min_distance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

    return dp[m][n]`;

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Edit Distance (Levenshtein Distance) measures the minimum number of single-character edit operations required to transform string word1 into string word2.",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 2,
      cols: 2,
      rowHeaders: ["", "A"],
      colHeaders: ["", "B"],
      cells: [
        { row: 0, col: 0, value: 0, state: "default" },
        { row: 0, col: 1, value: 1, state: "default" },
        { row: 1, col: 0, value: 1, state: "default" },
        { row: 1, col: 1, value: "?", state: "active" },
      ],
    },
  },
  {
    narrative:
      "The three permitted character edit operations are Insert (add a character), Delete (remove a character), and Replace (change one character to another), each costing 1 unit.",
    primarySnapshot: {
      kind: "array",
      name: "operations",
      mode: "box",
      elements: [
        { id: "op-ins", value: "Insert (+1)", state: "compare" },
        { id: "op-del", value: "Delete (+1)", state: "compare" },
        { id: "op-rep", value: "Replace (+1)", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "We build an (M + 1) x (N + 1) DP table where dp[i][j] stores the minimum edit distance to transform prefix word1[0..i-1] into prefix word2[0..j-1].",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 3,
      cols: 3,
      rowHeaders: ["", "h", "o"],
      colHeaders: ["", "r", "o"],
      cells: Array.from({ length: 9 }, (_, k) => ({
        row: Math.floor(k / 3),
        col: k % 3,
        value: "?",
        state: "default" as const,
      })),
    },
  },
  {
    narrative:
      "The base column dp[i][0] = i because converting a prefix of length i into an empty string requires exactly i deletion operations.",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 4,
      cols: 4,
      rowHeaders: ["", "h", "o", "r"],
      colHeaders: ["", "r", "o", "s"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 1, col: 0, value: 1, state: "sorted" },
        { row: 2, col: 0, value: 2, state: "sorted" },
        { row: 3, col: 0, value: 3, state: "sorted" },
        { row: 0, col: 1, value: "?", state: "default" },
        { row: 0, col: 2, value: "?", state: "default" },
        { row: 0, col: 3, value: "?", state: "default" },
        { row: 1, col: 1, value: "?", state: "default" },
        { row: 1, col: 2, value: "?", state: "default" },
        { row: 1, col: 3, value: "?", state: "default" },
        { row: 2, col: 1, value: "?", state: "default" },
        { row: 2, col: 2, value: "?", state: "default" },
        { row: 2, col: 3, value: "?", state: "default" },
        { row: 3, col: 1, value: "?", state: "default" },
        { row: 3, col: 2, value: "?", state: "default" },
        { row: 3, col: 3, value: "?", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The base row dp[0][j] = j because converting an empty string into a prefix of length j requires exactly j insertion operations.",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 4,
      cols: 4,
      rowHeaders: ["", "h", "o", "r"],
      colHeaders: ["", "r", "o", "s"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: 1, state: "sorted" },
        { row: 0, col: 2, value: 2, state: "sorted" },
        { row: 0, col: 3, value: 3, state: "sorted" },
        { row: 1, col: 0, value: 1, state: "sorted" },
        { row: 2, col: 0, value: 2, state: "sorted" },
        { row: 3, col: 0, value: 3, state: "sorted" },
        { row: 1, col: 1, value: "?", state: "default" },
        { row: 1, col: 2, value: "?", state: "default" },
        { row: 1, col: 3, value: "?", state: "default" },
        { row: 2, col: 1, value: "?", state: "default" },
        { row: 2, col: 2, value: "?", state: "default" },
        { row: 2, col: 3, value: "?", state: "default" },
        { row: 3, col: 1, value: "?", state: "default" },
        { row: 3, col: 2, value: "?", state: "default" },
        { row: 3, col: 3, value: "?", state: "default" },
      ],
    },
  },
  {
    narrative:
      "When comparing character word1[i-1] with word2[j-1]: if they match, no new operation cost is needed, so dp[i][j] = dp[i-1][j-1].",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 2,
      cols: 2,
      rowHeaders: ["", "o"],
      colHeaders: ["", "o"],
      cells: [
        { row: 0, col: 0, value: 1, state: "compare", label: "match" },
        { row: 0, col: 1, value: 2, state: "default" },
        { row: 1, col: 0, value: 2, state: "default" },
        { row: 1, col: 1, value: 1, state: "active", label: "= dp[i-1][j-1]" },
      ],
    },
  },
  {
    narrative:
      "If the characters mismatch, we must pay 1 operation cost and pick the optimal prior state: dp[i][j] = 1 + min(delete: dp[i-1][j], insert: dp[i][j-1], replace: dp[i-1][j-1]).",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 2,
      cols: 2,
      rowHeaders: ["", "h"],
      colHeaders: ["", "r"],
      cells: [
        { row: 0, col: 0, value: 0, state: "compare", label: "replace" },
        { row: 0, col: 1, value: 1, state: "compare", label: "delete" },
        { row: 1, col: 0, value: 1, state: "compare", label: "insert" },
        { row: 1, col: 1, value: 1, state: "active", label: "1 + min" },
      ],
    },
  },
  {
    narrative:
      "We iterate row by row from top to bottom and column by column from left to right to populate the entire matrix.",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 3,
      cols: 3,
      rowHeaders: ["", "h", "o"],
      colHeaders: ["", "r", "o"],
      cells: [
        { row: 0, col: 0, value: 0, state: "visited" },
        { row: 0, col: 1, value: 1, state: "visited" },
        { row: 0, col: 2, value: 2, state: "visited" },
        { row: 1, col: 0, value: 1, state: "visited" },
        { row: 1, col: 1, value: 1, state: "visited" },
        { row: 1, col: 2, value: 2, state: "visited" },
        { row: 2, col: 0, value: 2, state: "visited" },
        { row: 2, col: 1, value: 2, state: "active" },
        { row: 2, col: 2, value: "?", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Upon reaching cell dp[M][N], the value represents the exact minimum edit distance to transform word1 into word2 in O(M * N) time and space.",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 3,
      cols: 3,
      rowHeaders: ["", "h", "o"],
      colHeaders: ["", "r", "o"],
      cells: [
        { row: 0, col: 0, value: 0, state: "default" },
        { row: 0, col: 1, value: 1, state: "default" },
        { row: 0, col: 2, value: 2, state: "default" },
        { row: 1, col: 0, value: 1, state: "default" },
        { row: 1, col: 1, value: 1, state: "default" },
        { row: 1, col: 2, value: 2, state: "default" },
        { row: 2, col: 0, value: 2, state: "default" },
        { row: 2, col: 1, value: 2, state: "default" },
        { row: 2, col: 2, value: 1, state: "sorted", label: "result: 1" },
      ],
    },
  },
];

export const generateEditDistanceSteps = (input: EditDistanceInput): AlgorithmStep[] => {
  const word1 = input?.word1 ?? DEFAULT_EDIT_DISTANCE_INPUT.word1;
  const word2 = input?.word2 ?? DEFAULT_EDIT_DISTANCE_INPUT.word2;
  const m = word1.length;
  const n = word2.length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.word1 === DEFAULT_EDIT_DISTANCE_INPUT.word1 &&
      input.word2 === DEFAULT_EDIT_DISTANCE_INPUT.word2);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const rowHeaders = ["", ...word1.split("")];
  const colHeaders = ["", ...word2.split("")];

  const makeMatrixSnapshot = (
    activePos?: [number, number],
    comparePositions: Array<[number, number]> = [],
    highlightResult = false,
  ): PrimaryVisualSnapshot => {
    const compSet = new Set(comparePositions.map(([r, c]) => `${r},${c}`));
    const cells = [];
    for (let r = 0; r <= m; r++) {
      for (let c = 0; c <= n; c++) {
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isCompare = compSet.has(`${r},${c}`);
        const isResult = highlightResult && r === m && c === n;
        const isFilled =
          activePos && (r < activePos[0] || (r === activePos[0] && c <= activePos[1]));

        cells.push({
          row: r,
          col: c,
          value: isFilled || r === 0 || c === 0 || highlightResult ? dp[r][c] : "?",
          state: isResult
            ? ("sorted" as const)
            : isActive
              ? ("active" as const)
              : isCompare
                ? ("compare" as const)
                : isFilled
                  ? ("visited" as const)
                  : ("default" as const),
        });
      }
    }
    return {
      kind: "matrix",
      name: "dp",
      rows: m + 1,
      cols: n + 1,
      rowHeaders,
      colHeaders,
      cells,
    };
  };

  addStep(
    `Initializing Edit Distance matrix of size ${m + 1} x ${n + 1} for word1="${word1}" (length ${m}) and word2="${word2}" (length ${n}).`,
    makeMatrixSnapshot([0, 0]),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  addStep(
    `Setting base cases: dp[i][0] = i (deletions from word1 prefix) and dp[0][j] = j (insertions to form word2 prefix).`,
    makeMatrixSnapshot([0, n]),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const char1 = word1[i - 1];
      const char2 = word2[j - 1];

      if (char1 === char2) {
        dp[i][j] = dp[i - 1][j - 1];
        addStep(
          `Cell (${i}, ${j}): comparing word1[${i - 1}] ('${char1}') with word2[${j - 1}] ('${char2}'). Since characters match, dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]} with no added cost.`,
          makeMatrixSnapshot([i, j], [[i - 1, j - 1]]),
        );
      } else {
        const deleteOp = dp[i - 1][j];
        const insertOp = dp[i][j - 1];
        const replaceOp = dp[i - 1][j - 1];
        dp[i][j] = 1 + Math.min(deleteOp, insertOp, replaceOp);

        addStep(
          `Cell (${i}, ${j}): comparing word1[${i - 1}] ('${char1}') with word2[${j - 1}] ('${char2}'). Characters mismatch: dp[${i}][${j}] = 1 + min(delete:${deleteOp}, insert:${insertOp}, replace:${replaceOp}) = ${dp[i][j]}.`,
          makeMatrixSnapshot(
            [i, j],
            [
              [i - 1, j],
              [i, j - 1],
              [i - 1, j - 1],
            ],
          ),
        );
      }
    }
  }

  addStep(
    `Completed Edit Distance tabulation: dp[${m}][${n}] = ${dp[m][n]}. The minimum number of edit operations to convert "${word1}" into "${word2}" is ${dp[m][n]}.`,
    makeMatrixSnapshot([m, n], [], true),
  );

  return steps;
};

const EDIT_DISTANCE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines min_distance(word1, word2) -> int: computes Levenshtein edit distance.",
    2: "Calculates prefix lengths m and n for word1 and word2.",
    3: "Allocates 2D DP matrix of size (m+1) x (n+1) initialized to 0.",
    4: "Blank line separating DP matrix creation from base row/col initialization.",
    5: "Outer loop fills first column dp[i][0] with row index i.",
    6: "Fills first column dp[i][0] = i, representing i deletions from word1 prefix.",
    7: "Outer loop fills first row dp[0][j] with column index j.",
    8: "Fills first row dp[0][j] = j, representing j insertions into empty string.",
    9: "Blank line separating base case initialization from subproblem grid sweep.",
    10: "Outer loop sweeps row index i from 1 to m.",
    11: "Inner loop sweeps col index j from 1 to n.",
    12: "Compares character word1[i-1] with word2[j-1].",
    13: "If characters match, copies diagonal value dp[i-1][j-1] at zero additional edit cost.",
    14: "Else branch executes when characters word1[i-1] and word2[j-1] differ.",
    15: "If characters differ, sets dp[i][j] = 1 + min(delete, insert, replace).",
    16: "Blank line separating nested loops from final distance return statement.",
    17: "Returns dp[m][n], minimum edit distance for complete strings.",
  },
};

export const editDistance: AlgorithmDefinition<EditDistanceInput> = {
  id: "edit-distance",
  title: "Edit Distance (2D Dynamic Programming)",
  topicIds: ["dp_2d"],
  difficulty: "Hard",
  description:
    "<p>Given two strings <code>word1</code> and <code>word2</code>, return the minimum number of operations required to convert <code>word1</code> into <code>word2</code>. You are permitted three operations on a character: <strong>Insert</strong> a character, <strong>Delete</strong> a character, or <strong>Replace</strong> a character.</p><p><strong>Input:</strong> Two strings <code>word1</code> and <code>word2</code>.</p><p><strong>Output:</strong> The minimum number of edit operations required to transform <code>word1</code> into <code>word2</code>.</p>",
  constraints: [
    "0 <= word1.length, word2.length <= 500",
    "word1 and word2 consist of lowercase English letters",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: 'word1 = "horse", word2 = "ros"',
      outputDisplay: "3",
      title: "Standard Case",
      input: { word1: "horse", word2: "ros" },
      output: "3",
      explanation:
        "Transforms horse -> rorse (replace 'h' with 'r') -> rose (delete 'r') -> ros (delete 'e') in 3 edit operations.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: 'word1 = "intention", word2 = "execution"',
      outputDisplay: "5",
      title: "Adversarial Multi-Op Match",
      input: { word1: "intention", word2: "execution" },
      output: "5",
      explanation:
        "Requires 5 edit operations (deletions, substitutions, and insertions) computed across a 10x10 dynamic programming grid.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 'word1 = "", word2 = "abc"',
      outputDisplay: "3",
      title: "Empty String Boundary",
      input: { word1: "", word2: "abc" },
      output: "3",
      explanation:
        "Transforming empty string into 'abc' requires 3 insertions, matching base case along table boundary dp[0][3].",
    },
  ],
  code: EDIT_DISTANCE_CODE,
  timeComplexity: {
    best: "O(M * N)",
    average: "O(M * N)",
    worst: "O(M * N)",
  },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "The DP table has (M + 1) × (N + 1) cells. Each cell requires O(1) comparison and minimum operations. Total time complexity is O(M * N).",
    space:
      "Requires an (M + 1) × (N + 1) grid to store edit distances for all prefix pairs, taking O(M * N) space.",
  },
  topicGuide: {
    overview:
      "<p>Edit Distance (Levenshtein Distance) is a core problem in string processing and sequence alignment. Given two strings <code>A</code> and <code>B</code>, we compute the minimal cost to transform <code>A</code> into <code>B</code> via character insertions, deletions, and substitutions. 2D dynamic programming builds an <code>(M+1) &times; (N+1)</code> matrix in <code>O(M &times; N)</code> time and space.</p>",
    sections: [
      {
        heading: "1. 2D Grid Formulation & Recurrence",
        body: "<p>We define <code>dp[i][j]</code> as the edit distance between <code>A[0..i-1]</code> and <code>B[0..j-1]</code>.</p><ul><li><strong>Base Cases:</strong> <code>dp[i][0] = i</code> (deletions) and <code>dp[0][j] = j</code> (insertions).</li><li><strong>Match Transition:</strong> If <code>A[i-1] == B[j-1]</code>, <code>dp[i][j] = dp[i-1][j-1]</code>.</li><li><strong>Mismatch Transition:</strong> If <code>A[i-1] != B[j-1]</code>, <code>dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])</code>.</li></ul><p>The global solution is stored at <code>dp[M][N]</code>.</p>",
      },
      {
        heading: "2. Visualizing Operations on the DP Grid",
        body: "<p>Each movement on the 2D grid maps to an edit operation:</p><ul><li><strong>Diagonal (&nwarr;):</strong> Replace <code>A[i-1]</code> with <code>B[j-1]</code> (cost 1 if mismatch, cost 0 if match).</li><li><strong>Vertical (&uarr;):</strong> Delete <code>A[i-1]</code> from <code>A</code> (cost 1).</li><li><strong>Horizontal (&larr;):</strong> Insert <code>B[j-1]</code> into <code>A</code> (cost 1).</li></ul>",
      },
      {
        heading: "3. Systems Applications",
        body: "<p>Edit distance powers infrastructure tools:</p><ul><li><strong>Spell Checkers & Auto-Correct:</strong> Candidate lookup within Levenshtein edit distance <code>k</code>.</li><li><strong>Bioinformatics (Needleman-Wunsch):</strong> Global DNA sequence alignment under scoring matrices.</li><li><strong>Version Control (git diff):</strong> Myers diff algorithm variants.</li></ul>",
      },
      {
        heading: "4. Linear Space Optimization & Hirschberg's Algorithm",
        body: "<p>Standard DP requires <code>O(M &times; N)</code> memory. Using two row vectors reduces space to <code>O(N)</code>. Hirschberg's divide-and-conquer algorithm recovers the exact alignment path in <code>O(M &times; N)</code> time and <code>O(M + N)</code> space.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Levenshtein Distance",
        definition:
          "The minimal number of single-character inserts, deletes, or substitutions to convert string A into B.",
      },
      {
        term: "Needleman-Wunsch",
        definition:
          "A global sequence alignment algorithm extending edit distance with gap penalties in computational biology.",
      },
      {
        term: "Hirschberg's Algorithm",
        definition:
          "A divide-and-conquer algorithm computing sequence alignment in linear O(N) memory.",
      },
    ],
  },
  trivia: EDIT_DISTANCE_TRIVIA,
  leetcode: {
    id: 72,
    url: "https://leetcode.com/problems/edit-distance/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #72",
      leetcodeId: 72,
      url: "https://leetcode.com/problems/edit-distance/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 7",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 7,
      section: "7.5 Edit distance",
    },
  ],
  defaultInput: DEFAULT_EDIT_DISTANCE_INPUT,
  generateSteps: generateEditDistanceSteps,
};
