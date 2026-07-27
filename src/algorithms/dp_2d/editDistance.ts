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

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Fill base row and column for empty prefix cases`,
      why: `First column dp[i][0] = i (i deletions from "${word1}"). First row dp[0][j] = j (j insertions into empty string to form "${word2}").`,
    },
    primarySnapshot: createGridSnapshot(undefined, [], [0, n]),
    auxiliaryState: {
      customState: { word1, word2, rows: m + 1, cols: n + 1 },
    },
    variables: { m, n },
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const char1 = word1[i - 1];
      const char2 = word2[j - 1];

      if (char1 === char2) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 13,
          explanation: {
            what: `Match '${char1}' at cell (${i}, ${j})`,
            why: `Both words have character '${char1}' at position (${i}, ${j}). Zero edit cost: carry over diagonal value dp[${i - 1}][${j - 1}] = ${dp[i][j]}.`,
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
        dp[i][j] = 1 + minPrev;

        let bestOpName = "Replace";
        if (minPrev === deleteOp) bestOpName = "Delete";
        else if (minPrev === insertOp) bestOpName = "Insert";

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 15,
          explanation: {
            what: `Resolve mismatch '${char1}' vs '${char2}'`,
            why: `Characters differ. Min of delete (${deleteOp}), insert (${insertOp}), replace (${replaceOp}) is ${minPrev}. Adding 1 edit yields dp[${i}][${j}] = ${dp[i][j]}.`,
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
    6: "Fills first column dp[i][0] = i, representing i deletions from word1 prefix.",
    8: "Fills first row dp[0][j] = j, representing j insertions into empty string.",
    10: "Outer loop sweeps row index i from 1 to m.",
    11: "Inner loop sweeps col index j from 1 to n.",
    12: "Compares character word1[i-1] with word2[j-1].",
    13: "If characters match, copies diagonal value dp[i-1][j-1] at zero additional edit cost.",
    15: "If characters differ, sets dp[i][j] = 1 + min(delete, insert, replace).",
    17: "Returns dp[m][n], minimum edit distance for complete strings.",
  },
};

export const editDistance: AlgorithmDefinition<EditDistanceInput> = {
  id: "edit-distance",
  title: "Edit Distance (2D Dynamic Programming)",
  category: "dp_2d",
  categories: ["dp_2d"],
  difficulty: "Hard",
  description:
    "Given two strings word1 and word2, return the minimum number of single-character operations required to convert word1 to word2. You are allowed three operations on a character: Insert a character, Delete a character, or Replace a character. Solve using 2D dynamic programming tabulation where dp[i][j] represents the Levenshtein edit distance between prefix word1[0..i-1] and prefix word2[0..j-1].",
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
      "Edit distance (or Levenshtein distance, LeetCode #72) quantifies the minimum number of single-character insertions, deletions, and substitutions required to transform one string into another. It represents the foundation of string alignment and sequence matching. The DP table is a grid of size (M+1) x (N+1) where row i and column j represent prefixes word1[0..i-1] and word2[0..j-1]. Matching characters carry forward the diagonal cost dp[i-1][j-1], while mismatched characters take 1 + min(delete: dp[i-1][j], insert: dp[i][j-1], replace: dp[i-1][j-1]).",
    sections: [
      {
        heading: "Core Concept: Prefix States & Recurrence Relation",
        body: "Define dp[i][j] as the minimum edit distance between the first i characters of word1 and first j characters of word2. Base cases dp[i][0] = i and dp[0][j] = j represent deleting i characters or inserting j characters when one prefix is empty. If word1[i-1] == word2[j-1], dp[i][j] = dp[i-1][j-1]. Otherwise, dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).",
      },
      {
        heading: "Systems Applications: Spell Checkers, Diff Engines & Bioinformatics",
        body: "Edit distance powers key software systems: spell check suggestions (Google Search / OS spellcheck), code diff utilities (git diff / unified diff), fuzzy string search in databases (Elasticsearch Levenshtein queries), and global sequence alignment in computational biology (Needleman-Wunsch algorithm for DNA/protein alignment).",
      },
      {
        heading: "Space Optimization & Hirschberg's Linear Space Algorithm",
        body: "Because dp[i][j] depends only on row i and row i-1, space can be compressed from O(M * N) down to O(min(M, N)) using two row vectors. To reconstruct the exact sequence of edit operations in linear O(M + N) space, Hirschberg's divide-and-conquer algorithm combines 2D DP with divide-and-conquer recurrence.",
      },
      {
        heading: "Edge Case Analysis & Off-By-One Pitfalls",
        body: "Edge cases include empty strings (word1 or word2 length 0), identical strings (0 edits), and completely distinct character sets. Off-by-one errors frequently arise when indexing strings vs DP tables: DP table index i corresponds to string index i-1.",
      },
    ],
    keyTerms: [
      {
        term: "Levenshtein Distance",
        definition:
          "The minimum number of single-character insertions, deletions, or substitutions required to transform one string into another.",
      },
      {
        term: "Prefix State",
        definition:
          "Subproblem definition indexing substring prefixes word1[0..i-1] and word2[0..j-1].",
      },
      {
        term: "Needleman-Wunsch Algorithm",
        definition:
          "A global sequence alignment algorithm extending edit distance with custom scoring matrices in bioinformatics.",
      },
      {
        term: "Hirschberg's Algorithm",
        definition:
          "A divide-and-conquer algorithm computing optimal sequence alignment in linear O(N) space.",
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
