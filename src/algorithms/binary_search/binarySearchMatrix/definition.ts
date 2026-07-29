import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { BINARY_SEARCH_MATRIX_CODE } from "./pythonCode";
import {
  DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
  generateBinarySearchMatrixSteps,
  type BinarySearchMatrixInput,
} from "./stepGenerator";

export { DEFAULT_BINARY_SEARCH_MATRIX_INPUT };

const BINARY_SEARCH_MATRIX_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Binary search is not limited to physical 1D arrays; it is a general technique applicable to any search domain that can be conceptually ordered. Search a 2D Matrix exploits this principle by interpreting an <em>m</em> &times; <em>n</em> grid — where each row is sorted and each row begins above the previous row's end — as a single virtual sorted 1D array. By converting virtual 1D indices into 2D grid coordinates on the fly using integer division and modulo, the algorithm searches the grid in <em>O(log(m &middot; n))</em> time without extra memory.</p>",
  sections: [
    {
      heading: "Why It Exists & The Virtual Flattening Concept",
      body: "<p>Matrix search problems often tempt developers to perform nested searches: binary search rows first, then columns. However, when the matrix guarantees globally sorted row boundaries, the entire grid forms one seamless monotonically increasing sequence. Virtual flattening treats index <em>i</em> as <code>matrix[i // n][i % n]</code>, enabling logarithmic binary search directly.</p>",
    },
    {
      heading: "Step-by-Step Coordinate Decomposition",
      body: "<p>Given virtual 1D midpoint <code>mid</code>, row coordinate <code>row = mid // n</code> recovers how many complete rows of length <em>n</em> precede <code>mid</code>. Column coordinate <code>col = mid % n</code> recovers the offset inside that row. The algorithm probes <code>matrix[row][col]</code> and contracts the search window accordingly.</p>",
    },
    {
      heading: "Trade-offs & Alternative Matrix Formulations",
      body: "<p>Virtual flattening requires strictly sorted row boundaries. If rows are independently sorted but lack global ordering across rows, virtual flattening fails. In that variant, a staircase search running in <em>O(m + n)</em> time or row-by-row binary search running in <em>O(m log n)</em> time must be used instead.</p>",
    },
    {
      heading: "Edge Cases & Bounds Preservation",
      body: "<p>Empty matrices must be guarded up front to prevent division-by-zero or negative index calculations. Additionally, integer floor division <code>mid // n</code> must consistently use column count <em>n</em> to avoid out-of-bounds array access on non-square matrices.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Virtual Flattening",
      definition:
        "Mapping a multi-dimensional grid to a single 1D index space using arithmetic index conversion without instantiating extra memory.",
    },
    {
      term: "Monotone Grid Structure",
      definition:
        "A 2D layout where row elements and row-to-row boundaries strictly increase, creating a globally sorted sequence.",
    },
    {
      term: "Coordinate Decomposition",
      definition:
        "Calculating 2D row and column indices from a flat 1D index using row = mid // cols and col = mid % cols.",
    },
  ],
};

const BINARY_SEARCH_MATRIX_TRIVIA: TriviaMeta = {
  skipLines: [16, 18],
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
    1: "Defines search_matrix(matrix, target) -> bool: binary searches a 2D matrix by treating it as a virtual 1D sorted array.",
    2: "Guards against degenerate inputs (empty matrix or zero-length first row) before performing index calculations.",
    3: "Returns False immediately when given an empty matrix since target cannot be present.",
    4: "Stores grid dimensions m (number of rows) and n (number of columns).",
    5: "Initializes binary search window: low starts at flat index 0, high at m * n - 1.",
    6: "Blank line preceding main search loop.",
    7: "Loops while search range is valid (low <= high).",
    8: "Calculates virtual 1D midpoint index mid = (low + high) // 2.",
    9: "Converts flat mid index to 2D row index via integer division mid // n.",
    10: "Converts flat mid index to 2D column index via remainder mid % n.",
    11: "Fetches cell value mid_val from matrix[row][col].",
    12: "Blank line preceding comparison logic.",
    13: "Checks if probed value mid_val equals target.",
    14: "Returns True immediately upon locating target.",
    15: "Checks if mid_val is strictly less than target.",
    16: "Discards lower half of search window by updating low = mid + 1.",
    17: "Branch handling case when mid_val is strictly greater than target.",
    18: "Discards upper half of search window by updating high = mid - 1.",
    19: "Blank line ending main search loop.",
    20: "Returns False when search range is exhausted without finding target.",
  },
};

export const binarySearchMatrix: AlgorithmDefinition<BinarySearchMatrixInput> = {
  id: "binary-search-matrix",
  title: "Search a 2D Matrix",
  topicIds: ["binary_search"],
  difficulty: "Medium",
  description: `<p>Locate a target value in an <em>m</em> &times; <em>n</em> integer matrix with sorted rows and strictly increasing row transitions in <em>O(log(m &middot; n))</em> time.</p>
<h3>Why It Exists &amp; What It Solves</h3>
<p>Searching a 2D matrix element by element takes <em>O(m &middot; n)</em> linear time. When each row is sorted and the first element of each row is strictly greater than the last element of the previous row, the entire matrix forms one continuous sorted sequence. Instead of flattening the matrix into a new 1D array (which would require extra space and time), we can perform binary search on virtual 1D indices, calculating 2D coordinates on demand in <em>O(1)</em> space and <em>O(log(m &middot; n))</em> time.</p>
<h3>Step-by-Step Intuition</h3>
<ul>
  <li><strong>Virtual Index Range</strong>: Map the <em>m</em> &times; <em>n</em> cells to flat indices 0 to <em>m &middot; n - 1</em>. Set <code>low = 0</code> and <code>high = m * n - 1</code>.</li>
  <li><strong>Compute Midpoint</strong>: Calculate 1D midpoint <code>mid = (low + high) // 2</code>.</li>
  <li><strong>Map to 2D Coordinates</strong>: Calculate <code>row = mid // n</code> and <code>col = mid % n</code>.</li>
  <li><strong>Compare &amp; Branch</strong>:
    <ul>
      <li>If <code>matrix[row][col] == target</code>, return <code>True</code>.</li>
      <li>If <code>matrix[row][col] &lt; target</code>, set <code>low = mid + 1</code>.</li>
      <li>If <code>matrix[row][col] &gt; target</code>, set <code>high = mid - 1</code>.</li>
    </ul>
  </li>
</ul>
<h3>Input Parameters</h3>
<ul>
  <li><code>matrix</code>: An <em>m</em> &times; <em>n</em> integer grid where each row is sorted and <code>matrix[i][0] &gt; matrix[i-1][n-1]</code>.</li>
  <li><code>target</code>: The integer target value to locate.</li>
</ul>
<h3>Output</h3>
<p>Returns boolean <code>true</code> if target exists in matrix, otherwise <code>false</code>.</p>
<h3>Trade-offs &amp; Complexity</h3>
<ul>
  <li><strong>Time Complexity</strong>: <em>O(log(m &middot; n))</em> worst/average case, <em>O(1)</em> best case.</li>
  <li><strong>Space Complexity</strong>: <em>O(1)</em> auxiliary space using virtual index mapping.</li>
  <li><strong>Requirement</strong>: Matrix must have globally sorted row transitions.</li>
</ul>
<h3>Edge Cases &amp; Constraints</h3>
<ul>
  <li><code>m == matrix.length</code>, <code>n == matrix[i].length</code></li>
  <li><code>1 &le; m, n &le; 100</code></li>
  <li><code>-10<sup>4</sup> &le; matrix[i][j], target &le; 10<sup>4</sup></code></li>
  <li>Degenerate empty matrices (<code>m == 0</code> or <code>n == 0</code>).</li>
  <li>Single element matrices (1 &times; 1).</li>
</ul>`,
  constraints: [
    "m == matrix.length",
    "n == matrix[i].length",
    "1 <= m, n <= 100",
    "-10^4 <= matrix[i][j], target <= 10^4",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay:
        "matrix = [[1, 3, 5, 7, 9], [10, 12, 14, 16, 18], [20, 22, 24, 26, 28], [30, 32, 34, 36, 38], [40, 42, 44, 46, 48]], target = 34",
      outputDisplay: "true",
      title: "Standard 5x5 Matrix Target Present",
      input: DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
      output: "true",
      explanation: "5x5 matrix search; flat index 17 maps to row 3, col 2 where 34 is located.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay:
        "matrix = [[1, 2, 4, 8], [12, 16, 20, 24], [28, 32, 40, 50], [60, 70, 80, 90]], target = 50",
      outputDisplay: "true",
      title: "Adversarial 4x4 Matrix Search",
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
      scenario: "boundary",
      inputDisplay: "matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 13",
      outputDisplay: "false",
      title: "Boundary Absent Target Search",
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
    time: "Probing virtual midpoint index cuts the remaining m*n elements in half on every step, yielding O(log(m * n)) time complexity.",
    space:
      "Uses O(1) auxiliary space by performing virtual 1D-to-2D coordinate transformations without modifying or copying the input matrix.",
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
