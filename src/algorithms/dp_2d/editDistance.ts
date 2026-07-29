import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
  GridVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const generateEditDistanceSteps = (input: EditDistanceInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const word1 = input?.word1 ?? DEFAULT_EDIT_DISTANCE_INPUT.word1;
  const word2 = input?.word2 ?? DEFAULT_EDIT_DISTANCE_INPUT.word2;
  const m = word1.length;
  const n = word2.length;
  let stepIndex = 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  const createGridSnapshot = (
    activePos?: [number, number],
    comparePositions: Array<[number, number]> = [],
    computedUntil?: [number, number],
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    const compSet = new Set(comparePositions.map(([r, c]) => `${r},${c}`));

    for (let r = 0; r <= m; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c <= n; c++) {
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isCompare = compSet.has(`${r},${c}`);
        const isComputed = Boolean(
          computedUntil &&
          (r < computedUntil[0] || (r === computedUntil[0] && c <= computedUntil[1])),
        );

        rowNodes.push({
          row: r,
          col: c,
          distance: dp[r][c],
          state: isActive ? "active" : isCompare ? "compare" : isComputed ? "visited" : "default",
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: "grid", grid: gridNodes };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Start Edit Distance algorithm for word1="${word1}" and word2="${word2}"`,
      why: "Computing minimal character insertion, deletion, and replacement operations.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { word1, word2 } },
    variables: { word1, word2 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Store string lengths m=${m} ("${word1}") and n=${n} ("${word2}")`,
      why: "Grid dimensions will be (m+1) x (n+1) to include empty prefixes.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { m, n } },
    variables: { m, n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize 2D DP matrix of size ${m + 1} x ${n + 1} with zeros`,
      why: "dp[i][j] will store the edit distance between word1[0..i-1] and word2[0..j-1].",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { rows: m + 1, cols: n + 1 } },
    variables: { m, n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Loop over rows 0..${m} to set base column  dp[i][0] = i`,
      why: "Transforming word1 prefix of length i into an empty string always costs exactly i deletions, so the first column fills with 0, 1, 2, … m.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { baseCol: "dp[i][0] = i for i in 0..m" } },
    variables: { m },
  });

  for (let i = 0; i <= m; i++) dp[i][0] = i;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Initialize base column dp[i][0] = i for i = 0..${m}`,
      why: "Transforming word1 prefix of length i to empty string requires i deletions.",
    },
    primarySnapshot: createGridSnapshot(undefined, [], [m, 0]),
    auxiliaryState: { customState: { baseColInitialized: true } },
    variables: { m },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Loop over columns 0..${n} to set base row  dp[0][j] = j`,
      why: "Transforming an empty string into word2 prefix of length j costs exactly j insertions.",
    },
    primarySnapshot: createGridSnapshot(undefined, [], [m, 0]),
    auxiliaryState: { customState: { baseRow: "dp[0][j] = j for j in 0..n" } },
    variables: { n },
  });

  for (let j = 0; j <= n; j++) dp[0][j] = j;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `Initialize base row dp[0][j] = j for j = 0..${n}`,
      why: "Transforming empty string to word2 prefix of length j requires j insertions.",
    },
    primarySnapshot: createGridSnapshot(undefined, [], [m, 0]),
    auxiliaryState: { customState: { baseRowInitialized: true } },
    variables: { n },
  });

  for (let i = 1; i <= m; i++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Begin outer loop for row i = ${i} (char '${word1[i - 1]}')`,
        why: `Processing prefix word1[0..${i - 1}] against all prefixes of word2.`,
      },
      primarySnapshot: createGridSnapshot(undefined, [], [i - 1, n]),
      auxiliaryState: {
        customState: { i, char1: word1[i - 1], word1, word2 },
      },
      variables: { i, char1: word1[i - 1] },
    });

    for (let j = 1; j <= n; j++) {
      const char1 = word1[i - 1];
      const char2 = word2[j - 1];

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Inner loop cell (i=${i}, j=${j}): compare '${char1}' with '${char2}'`,
          why: `Evaluating transition to fill dp[${i}][${j}].`,
        },
        primarySnapshot: createGridSnapshot([i, j], [], [i, j - 1]),
        auxiliaryState: { customState: { i, j, char1, char2 } },
        variables: { i, j, char1, char2 },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 12,
        explanation: {
          what: `Evaluate condition word1[${i - 1}] ('${char1}') == word2[${j - 1}] ('${char2}')`,
          why:
            char1 === char2
              ? `Characters match! Zero extra edit cost required.`
              : `Characters differ! Must take 1 + min(delete, insert, replace).`,
        },
        primarySnapshot: createGridSnapshot([i, j], [], [i, j - 1]),
        auxiliaryState: { customState: { i, j, match: char1 === char2 } },
        variables: { i, j, match: char1 === char2 },
      });

      if (char1 === char2) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 13,
          explanation: {
            what: `Match '${char1}' at cell (${i}, ${j}): dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}`,
            why: `Carried forward diagonal cost dp[${i - 1}][${j - 1}] without additional edit cost.`,
          },
          primarySnapshot: createGridSnapshot([i, j], [[i - 1, j - 1]], [i, j]),
          auxiliaryState: {
            customState: { char1, char2, operation: "Match", editCost: dp[i][j] },
          },
          variables: { i, j, char1, char2, "dp[i][j]": dp[i][j] },
        });
      } else {
        const deleteOp = dp[i - 1][j];
        const insertOp = dp[i][j - 1];
        const replaceOp = dp[i - 1][j - 1];
        const minPrev = Math.min(deleteOp, insertOp, replaceOp);

        let bestOpName = "Replace";
        if (minPrev === deleteOp) bestOpName = "Delete";
        else if (minPrev === insertOp) bestOpName = "Insert";

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 14,
          explanation: {
            what: `Characters mismatch: '${char1}' ≠ '${char2}'`,
            why: "The characters differ, so we must pay a cost of 1 and take the best of the three edit operations: delete, insert, or replace.",
          },
          primarySnapshot: createGridSnapshot([i, j], [], [i, j - 1]),
          auxiliaryState: { customState: { i, j, char1, char2, match: false } },
          variables: { i, j, char1, char2, match: false },
        });

        dp[i][j] = 1 + minPrev;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 15,
          explanation: {
            what: `Mismatch: dp[${i}][${j}] = 1 + min(delete:${deleteOp}, insert:${insertOp}, replace:${replaceOp}) = ${dp[i][j]}`,
            why: `Optimal move is ${bestOpName}. Updated dp[${i}][${j}] = ${dp[i][j]}.`,
          },
          primarySnapshot: createGridSnapshot(
            [i, j],
            [
              [i - 1, j],
              [i, j - 1],
              [i - 1, j - 1],
            ],
            [i, j],
          ),
          auxiliaryState: {
            customState: {
              char1,
              char2,
              operation: bestOpName,
              deleteCost: deleteOp,
              insertCost: insertOp,
              replaceCost: replaceOp,
            },
          },
          variables: { i, j, char1, char2, "dp[i][j]": dp[i][j] },
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Final result dp[${m}][${n}] = ${dp[m][n]}`,
      why: `The minimum edit distance to transform "${word1}" into "${word2}" is ${dp[m][n]}.`,
    },
    primarySnapshot: createGridSnapshot([m, n], [], [m, n]),
    auxiliaryState: {
      customState: { result: dp[m][n] },
    },
    variables: { minDistance: dp[m][n] },
  });

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
    "<p>The <strong>Edit Distance</strong> (Levenshtein Distance) problem (LeetCode #72) asks for the minimum number of single-character operations—<strong>Insert</strong>, <strong>Delete</strong>, or <strong>Replace</strong>—required to transform string <code>word1</code> of length <code>M</code> into string <code>word2</code> of length <code>N</code>.</p><p>Let <code>dp[i][j]</code> denote the minimum edit distance between prefix <code>word1[0..i-1]</code> and prefix <code>word2[0..j-1]</code>. Base cases are <code>dp[i][0] = i</code> and <code>dp[0][j] = j</code>. If characters match, <code>dp[i][j] = dp[i-1][j-1]</code>; otherwise <code>dp[i][j] = 1 + min(delete, insert, replace)</code>.</p>",
  constraints: [
    "0 <= word1.length, word2.length <= 500",
    "word1 and word2 consist of lowercase English letters",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: 'word1 = "horse", word2 = "ros"',
      outputDisplay: "3",
      title: "Basic Example",
      input: { word1: "horse", word2: "ros" },
      output: "3",
      explanation:
        "Transforms horse -> rorse (replace 'h' with 'r') -> rose (delete 'r') -> ros (delete 'e') in 3 edit operations.",
    },
    {
      kind: "complex",
      inputDisplay: 'word1 = "intention", word2 = "execution"',
      outputDisplay: "5",
      title: "Complex Edge Case",
      input: { word1: "intention", word2: "execution" },
      output: "5",
      explanation:
        "Requires 5 edit operations (deletions, substitutions, and insertions) computed across a 10x10 dynamic programming grid.",
    },
    {
      kind: "negative",
      inputDisplay: 'word1 = "", word2 = "abc"',
      outputDisplay: "3",
      title: "Failing / Boundary Case",
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
