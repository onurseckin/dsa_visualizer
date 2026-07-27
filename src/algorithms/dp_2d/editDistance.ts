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

export const EDIT_DISTANCE_CODE = `
def edit_distance(input_array):
    """
    Implementation of edit_distance.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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
    codeLine: 3,
    explanation: {
      what: `Fill the base row and column`,
      why: `The first column says dp[i][0] = i, because turning the first i letters of "${word1}" into nothing takes i deletions. The first row says dp[0][j] = j, because building the first j letters of "${word2}" from nothing takes j insertions.`,
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
            why: `Both words have '${char1}' here, so no edit is needed — we just carry over the cost of matching the shorter prefixes diagonally: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}.`,
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
            why: `The letters differ, so we pick the cheapest fix among deleting (${deleteOp}), inserting (${insertOp}), or replacing (${replaceOp}). ${bestOpName} wins at ${minPrev}, and adding 1 for the edit itself gives dp[${i}][${j}] = ${dp[i][j]}.`,
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
      what: `Read the answer at dp[${m}][${n}]`,
      why: `The bottom-right cell compares the full words, so turning "${word1}" into "${word2}" takes ${dp[m][n]} edits. We got there by solving every smaller prefix pair exactly once, which is why the work is proportional to the table size.`,
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
    1: "Defines min_distance(word1, word2) -> int: computes the Levenshtein distance, the fewest single-character edits needed to turn word1 into word2.",
    2: "Caches the two prefix lengths m and n up front, since the whole table is indexed by how many characters of each word have been consumed.",
    3: "Allocates an (m+1) x (n+1) grid of zeros — one cell per pair of prefix lengths, including the empty-prefix row and column at index 0.",
    5: "Loops over every possible length of word1's prefix so the first column can be filled before the main recurrence starts.",
    6: "Sets dp[i][0] = i: turning the first i characters of word1 into the empty string costs exactly i deletions — the base case along that axis.",
    7: "Loops over every possible length of word2's prefix to fill the first row the same way.",
    8: "Sets dp[0][j] = j: building the first j characters of word2 out of nothing costs exactly j insertions — the mirror base case.",
    10: "Sweeps row index i from 1 to m — the outer loop over word1's real prefixes, now that the borders are seeded.",
    11: "Sweeps column index j from 1 to n for each i, filling the grid left-to-right, top-to-bottom so every cell's dependencies (above, left, diagonal) are already computed.",
    12: "Compares the last character of each prefix — word1[i-1] and word2[j-1] — since the table is indexed 1-based but the strings are indexed 0-based.",
    13: "If the characters match, no edit is spent here: dp[i][j] just copies the diagonal neighbor's answer for the two shorter prefixes.",
    14: "Otherwise the characters differ and one edit is unavoidable, so falls through to the three-way minimum below.",
    15: "Charges one edit and takes the best of the three possible last operations — delete (dp[i-1][j]), insert (dp[i][j-1]), or substitute (dp[i-1][j-1]) — so the cheapest of the three always wins regardless of which turns out best.",
    17: "Returns dp[m][n], the bottom-right corner where both prefixes have grown into the full words — the answer for the complete strings.",
  },
};

export const editDistance: AlgorithmDefinition<EditDistanceInput> = {
  id: "edit-distance",
  title: "Edit Distance (2D Dynamic Programming)",
  category: "dp_2d",
  categories: ["dp_2d"],
  difficulty: "Hard",
  description:
    "Finds the minimum number of single-character operations (insertions, deletions, or substitutions) required to transform word1 into word2 using Levenshtein distance 2D dynamic programming tabulation.",
  constraints: [
    "0 <= word1.length, word2.length <= 500",
    "Strings consist of lowercase English letters",
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
        "Transforms horse -> rorse (replace 'h') -> rose (delete 'r') -> ros (delete 'e') in 3 edit operations.",
    },
    {
      kind: "complex",
      inputDisplay: 'word1 = "intention", word2 = "execution"',
      outputDisplay: "5",
      title: "Complex Edge Case",
      input: { word1: "intention", word2: "execution" },
      output: "5",
      explanation:
        "Requires 5 edit operations (deletions, substitutions, and insertion) across 9x9 dynamic programming table.",
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
    time: "The dp table has (M + 1) × (N + 1) cells — one for every pair of prefixes of the two words — and we fill each cell exactly once with a constant amount of comparison work. That makes the total time O(M × N) no matter what the strings look like; matching and mismatching characters cost the same.",
    space:
      "The full 2D table stores an answer for every prefix pair, so memory grows with both word lengths — O(M × N). Only the previous row is strictly needed, but we keep the whole table so the computation stays visible.",
  },
  topicGuide: {
    overview:
      "Edit distance, also called Levenshtein distance, measures how far apart two strings are by counting the fewest single-character insertions, deletions, and substitutions that turn one into the other. It is the canonical two-dimensional dynamic program: the state is a pair of prefix lengths, so the table is a grid and the answer waits in the far corner. The move behind it — look at the last characters and branch on the ways they could have been reconciled — recurs in almost every problem about two sequences. Spell checkers, diff tools, fuzzy search, and DNA alignment all rest on this grid or a close relative of it.",
    sections: [
      {
        heading: "The core idea: the state is a pair of prefixes",
        body: "Define dp of i and j as the edit distance between the first i characters of the first word and the first j characters of the second. An index of zero means an empty prefix, which is why the table carries one extra row and one extra column, and why that border can be filled immediately: turning an empty string into a prefix of length j costs j insertions, and the mirror case costs i deletions. Those borders are not decoration, because every interior cell eventually traces its value back to them. The number you actually want sits in the bottom-right cell, where both prefixes have grown into the complete words.",
      },
      {
        heading: "How the mechanism works: three operations, three neighbours",
        body: "Look only at the last character of each prefix. If they are equal they cost nothing, so the distance is whatever it took to align the two shorter prefixes and you copy the value diagonally up and to the left. If they differ you must spend one edit, and there are exactly three ways to spend it: substitute, which consumes a character from each side and reads the diagonal; delete from the first word, which consumes only its character and reads the cell above; or insert into the first word to match the second, which reads the cell to the left. Take the minimum of those three neighbours and add one. Because every cell reads only cells above and to the left, filling the grid row by row from left to right is enough to guarantee its inputs are ready.",
      },
      {
        heading: "Why the grid is correct",
        body: "The invariant is that when you compute a cell, the three cells it reads already hold true minimum distances for their own prefix pairs, which the row-major sweep and the hand-filled borders together guarantee. Correctness then follows from the case analysis being exhaustive: in any optimal edit script the final operation either matches the two last characters or is one of the three edits, and there is no fourth possibility to forget. Each case reduces to a strictly smaller prefix pair, so the recursion bottoms out on the borders rather than running forever. Notice too that overlapping subproblems are the reason a table is needed at all — the plain recursion revisits the same prefix pairs an exponential number of times, and the grid does nothing cleverer than remember each one.",
      },
      {
        heading: "Reading out the alignment, and trimming memory",
        body: "The corner cell gives you a number, but what you often want is the script that achieves it, and you recover that by walking backwards from the corner. A diagonal step on equal characters is a keep, a diagonal step on unequal characters is a substitution, a step upward is a deletion, and a step leftward is an insertion. Keep the whole grid if you need that walk. If you only need the number, observe that no cell ever reads above the previous row, so two rows suffice — or one row plus a saved diagonal value — and that is the standard trick for very long strings. Hirschberg's algorithm satisfies both wants at once by recursing on the middle column, giving you a full alignment in linear memory.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "Two traps dominate in practice. The first is mixing up which axis holds which word, so deletions and insertions swap roles — harmless while both cost one, quietly wrong the moment the costs differ. The second is index confusion: the table is indexed by prefix lengths, which are one-based, while the strings are zero-based, so the characters you compare live at i minus one and j minus one. Beyond that, test the empty inputs deliberately, since the distance from an empty word is just the other word's length and a correct border produces that with no special-case code. And resist the urge to short-circuit on equal characters by skipping the minimum, because a match only ever reads the diagonal and adding a guard there is how off-by-one bugs sneak in.",
      },
      {
        heading: "How the pattern generalises",
        body: "The grid is a template rather than a single algorithm. Drop substitution and count matches instead of edits and the same table computes the longest common subsequence; allow a transposition of two adjacent characters and you have Damerau-Levenshtein, which is what spell checkers want for typos. Give the operations unequal costs and the plus-one becomes a per-operation weight, and reward matches instead of penalising edits and you arrive at Needleman-Wunsch sequence alignment from bioinformatics. The reusable skill is recognising that any problem about two sequences advancing independently wants a two-dimensional table indexed by how far you have consumed each one, which is also how regular-expression matching, wildcard matching, and interleaving-string problems all get solved.",
      },
    ],
    keyTerms: [
      {
        term: "Levenshtein distance",
        definition:
          "The minimum number of single-character insertions, deletions, and substitutions needed to transform one string into another. It is a true metric, so it is symmetric and satisfies the triangle inequality.",
      },
      {
        term: "Prefix",
        definition:
          "The first i characters of a string, including the empty prefix when i is zero. The whole table is indexed by prefix lengths, which is why it needs a row and column for zero.",
      },
      {
        term: "Base case",
        definition:
          "The pre-filled first row and column, where one prefix is empty. They encode that converting to or from an empty string costs one edit per remaining character.",
      },
      {
        term: "Overlapping subproblems",
        definition:
          "The situation where the same subproblem is reachable through many different recursion paths. It is the property that makes memoising or tabulating pay off, as opposed to plain divide and conquer.",
      },
      {
        term: "Traceback",
        definition:
          "Walking backwards from the final cell along the choices that produced each value in order to recover the actual sequence of edits. It needs the full grid, which is why space-optimised versions can report only the distance.",
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
