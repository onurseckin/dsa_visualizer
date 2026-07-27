import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { BINARY_SEARCH_MATRIX_CODE } from "./pythonCode";
import { generateBinarySearchMatrixSteps, type BinarySearchMatrixInput } from "./stepGenerator";

export const DEFAULT_BINARY_SEARCH_MATRIX_INPUT: BinarySearchMatrixInput = {
  matrix: [
    [1, 3, 5, 7],
    [10, 11, 16, 20],
    [23, 30, 34, 60],
  ],
  target: 3,
};

const BINARY_SEARCH_MATRIX_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Binary search is not really an array algorithm; it is a technique for any search space you can order so that a single probe tells you which half to throw away. This problem makes that explicit, because the matrix is not a sorted list anywhere in memory, yet its rows are arranged so that reading them one after another would produce one. So you binary search that imaginary list and translate each index back into a grid coordinate on demand. Learning to see the sorted structure a problem only implies, and to search it without ever building it, is the transferable skill here.",
  sections: [
    {
      heading: "The flattening idea",
      body: `The matrix comes with two promises: each row is sorted from left to right, and the first value of every row is greater than the last value of the row above it. Concatenating the rows would therefore give one sorted sequence of m times n numbers, but actually building that sequence would cost time and memory you do not need to spend. Instead you search the index range from zero to m times n minus one as if the sequence existed, converting a flat index into a cell by dividing by the column count for the row and taking the remainder for the column. The division recovers how many complete rows the index passes over and the remainder recovers its offset inside its own row. Nothing is copied, you simply reinterpret what a position means.`,
    },
    {
      heading: "How each probe halves the problem",
      body: `You keep two bounds, low and high, delimiting the flat indices that could still hold the target, and you loop while low has not passed high. Compute the midpoint, read the cell it denotes, and compare that value with the target. A match ends the search; a value that is too small means every index from low through mid is too small as well, so low becomes mid plus one; a value that is too large triggers the mirror move and high becomes mid minus one. Each comparison retires half the remaining candidates, so even a large grid collapses to a single cell in remarkably few reads, and the loop ends either on a match or when the bounds cross.`,
    },
    {
      heading: "The invariant, and why termination is not automatic",
      body: `The invariant is that if the target is present at all, its flat index lies between low and high. Every branch preserves it, because the half being discarded is provably wrong given the sorted order. Correctness also requires the loop to actually finish, and that is where binary search implementations most often break. Pairing the condition that low may equal high with updates of mid plus one and mid minus one guarantees the interval strictly shrinks on every iteration, so it cannot stall; write low equals mid instead and a two-element range will spin forever. It is also worth computing the midpoint as low plus half the gap rather than by adding the bounds, a habit that matters in languages where that sum can overflow.`,
    },
    {
      heading: "Why the row-boundary promise matters",
      body: `The flattening trick is legitimate only because rows are strictly increasing across their boundaries. If each row were sorted but the ranges of different rows could overlap, the concatenation would not be sorted, and this algorithm would return wrong answers on inputs it accepts without complaint. That looser variant needs a different idea entirely: start at the top-right corner and step left when the value is too large or down when it is too small, eliminating a whole column or a whole row per step. Knowing which structural promise you have been given is what selects the algorithm, so read the constraints before reaching for a familiar pattern.`,
    },
    {
      heading: "Pitfalls and edge cases",
      body: `Guard the degenerate inputs first, because an empty matrix or a matrix whose first row is empty makes the largest flat index negative and the whole index computation meaningless. Use the column count, not the row count, in both the division and the remainder, since swapping them yields plausible-looking coordinates that quietly read the wrong cells on any non-square grid. Remember that this problem only asks for a boolean, so there is no boundary to hunt for; if you instead wanted the insertion position you would run the same loop and return low once it ends. And when duplicates are allowed, a plain binary search finds some occurrence rather than the first, which only matters if the problem asks for a specific one.`,
    },
    {
      heading: "The pattern beyond arrays",
      body: `The reusable form of binary search is this: define a space of candidates and a predicate that is false up to some point and true from there onward, then find that boundary. The space does not have to be an array, it can be a range of possible answers. Koko Eating Bananas searches over eating speeds, Split Array Largest Sum over possible values of the largest allowed subarray sum, and Median of Two Sorted Arrays over how many elements to take from the first array. In each of those the array-shaped intuition disappears and only the monotone predicate remains, which is the version of binary search worth internalizing; the sorted array, and this flattened matrix, are simply its easiest instances.`,
    },
  ],
  keyTerms: [
    {
      term: "Monotone search space",
      definition:
        "Any ordered set of candidates where probing one of them tells you which side the answer must lie on. It is the only thing binary search genuinely requires.",
    },
    {
      term: "Virtual flattening",
      definition:
        "Treating the grid as a sorted list of all its cells without ever building that list, converting a flat index into a row and column with a division and a remainder.",
    },
    {
      term: "Search interval",
      definition:
        "The range of flat indices between low and high that could still contain the target. The algorithm promises the answer, if it exists, is inside it.",
    },
    {
      term: "Logarithmic shrink",
      definition:
        "The effect of discarding one side of the midpoint each round, which cuts the interval roughly in half per comparison until a single candidate remains.",
    },
    {
      term: "Strictly increasing rows",
      definition:
        "The precondition that each row begins above where the previous row ended. It is exactly what makes the flattened reading order sorted.",
    },
  ],
};

const BINARY_SEARCH_MATRIX_TRIVIA: TriviaMeta = {
  skipLines: [1, 17],
  distractors: [
    "low, high = 0, m * n",
    "while low < high:",
    "row = mid % n",
    "elif mid_val > target:",
    "high = mid",
  ],
  hints: [
    {
      line: 5,
      hint: "Open the window over the flattened index space — the last valid position, not the number of cells.",
    },
    {
      line: 9,
      hint: "Recover which row a flat index lands in by dividing it by the row width.",
    },
    {
      line: 10,
      hint: "Recover the column from the same flat index using what is left over after that division.",
    },
    {
      line: 15,
      hint: "Handle the case where the probe came in under the target, so everything at or below it can be discarded.",
    },
  ],
  lineExplanations: {
    1: "Defines search_matrix(matrix, target) -> bool: treats the whole 2D grid as one sorted list and binary searches it without ever building that list.",
    2: "Guards the degenerate cases — an empty matrix or a matrix whose first row is empty — since the index math below would be meaningless without at least one element.",
    3: "An empty matrix can't contain the target, so returns False immediately rather than falling through into index arithmetic on a zero-sized grid.",
    4: "Caches the row count m and column count n — needed to convert between a flat index and its (row, column) coordinate.",
    5: "Opens the binary search window over the flattened index space: low starts at the first cell, high at the last of the m*n virtual positions.",
    7: "Loops while the window is non-empty — the same halting condition as a normal binary search, just over virtual indices instead of array indices.",
    8: "Picks the midpoint of the current window — the next flat index to probe.",
    9: "Converts the flat index to its row by integer division by the row width n — dividing off complete rows recovers which row the index falls in.",
    10: "Converts the flat index to its column via the remainder after that division — whatever's left over is the offset within that row.",
    11: "Reads the actual matrix cell at (row, col) — the value the flattened index was standing in for.",
    13: "Checks whether the probed value equals the target.",
    14: "A match ends the search immediately — True, found.",
    15: "If the probed value is smaller than the target, the target (if present) must live strictly after this position, since the flattened order is fully sorted.",
    16: "Discards the entire lower half by moving low just past mid — everything at or before mid is now known to be too small.",
    17: "Introduces the remaining case — the probed value must be greater than the target — since the two prior branches were exhaustive.",
    18: "Symmetric to the low branch: the probed value was too large, so drops the upper half by pulling high back to just before mid.",
    20: "The window closed with no match ever found, so the target genuinely isn't anywhere in the matrix — returns False.",
  },
};

export const binarySearchMatrix: AlgorithmDefinition<BinarySearchMatrixInput> = {
  id: "binary-search-matrix",
  title: "Search a 2D Matrix",
  category: "binary_search",
  difficulty: "Medium",
  description:
    "Searches for a target value in an m x n integer matrix — each row sorted, rows strictly increasing — by binary searching the grid as one virtual sorted 1D array.",
  constraints: [
    "m == matrix.length",
    "n == matrix[i].length",
    "1 <= m, n <= 100",
    "-10^4 <= matrix[i][j], target <= 10^4",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 3",
      outputDisplay: "true",
      title: "Basic Example",
      input: {
        matrix: [
          [1, 3, 5, 7],
          [10, 11, 16, 20],
          [23, 30, 34, 60],
        ],
        target: 3,
      },
      output: "true",
      explanation: "Target 3 exists at row 0, column 1.",
    },
    {
      kind: "complex",
      inputDisplay: "matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 16",
      outputDisplay: "true",
      title: "Complex Edge Case",
      input: {
        matrix: [
          [1, 2, 4, 8],
          [12, 16, 20, 24],
          [28, 32, 40, 50],
          [60, 70, 80, 90],
        ],
        target: 50,
      },
      output: "true",
      explanation: "4x4 matrix search; flat index 11 maps to row 2, col 3 where 50 is located.",
    },
    {
      kind: "negative",
      inputDisplay: "matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 13",
      outputDisplay: "false",
      title: "Failing / Boundary Case",
      input: {
        matrix: [
          [1, 3, 5, 7],
          [10, 11, 16, 20],
          [23, 30, 34, 60],
        ],
        target: 13,
      },
      output: "false",
      explanation: "Target 13 falls between 11 and 16, but is not present in the matrix.",
    },
  ],
  code: BINARY_SEARCH_MATRIX_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log(m * n))",
    worst: "O(log(m * n))",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Every probe compares one cell and throws away half of the remaining virtual list, so the m·n candidates shrink to a single cell in about log₂(m·n) comparisons — O(log(m·n)). The best case is O(1) when the very first midpoint happens to be the target; otherwise the repeated halving carries us to the answer or to an empty range.",
    space:
      "We navigate with just the low, high, and mid indices — no copy of the matrix and no recursion — so extra memory is O(1).",
  },
  topicGuide: BINARY_SEARCH_MATRIX_TOPIC_GUIDE,
  trivia: BINARY_SEARCH_MATRIX_TRIVIA,
  leetcode: {
    id: 74,
    url: "https://leetcode.com/problems/search-a-2d-matrix/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #74",
      leetcodeId: 74,
      url: "https://leetcode.com/problems/search-a-2d-matrix/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 3",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 3,
      section: "3.3 Binary search",
    },
  ],
  defaultInput: DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
  generateSteps: generateBinarySearchMatrixSteps,
};

export default binarySearchMatrix;
