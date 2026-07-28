import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { BINARY_SEARCH_MATRIX_CODE } from "./pythonCode";
import { generateBinarySearchMatrixSteps, type BinarySearchMatrixInput } from "./stepGenerator";

export const DEFAULT_BINARY_SEARCH_MATRIX_INPUT: BinarySearchMatrixInput = {
  matrix: [
    [1, 3, 5, 7, 9],
    [10, 12, 14, 16, 18],
    [20, 22, 24, 26, 28],
    [30, 32, 34, 36, 38],
    [40, 42, 44, 46, 48],
  ],
  target: 34,
};

const BINARY_SEARCH_MATRIX_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Binary search is not limited to physical 1D arrays; it is a general technique applicable to any search domain that can be conceptually ordered. Search a 2D Matrix exploits this principle by interpreting an m x n grid — where each row is sorted and each row begins above the previous row's end — as a single virtual sorted 1D array. By converting virtual 1D indices (0 to m*n - 1) into 2D grid coordinates on the fly using integer division and modulo, the algorithm searches an m x n matrix in O(log(m * n)) time without spending memory or time to flatten the matrix.",
  sections: [
    {
      heading: "Why It Exists & The Virtual Flattening Concept",
      body: "Matrix search problems often tempt developers to perform nested searches: binary search rows first, then columns. However, when the matrix guarantees that matrix[r][0] > matrix[r-1][n-1], the entire grid forms one seamless monotonically increasing sequence of m * n elements. Virtual flattening treats index i as matrix[i // n][i % n], enabling O(log(m * n)) binary search directly.",
    },
    {
      heading: "Step-by-Step Coordinate Decomposition",
      body: "Given virtual 1D midpoint `mid`, row coordinate `row = mid // n` recovers how many complete rows of length n precede `mid`. Column coordinate `col = mid % n` recovers the offset inside that row. The algorithm probes `matrix[row][col]` and contracts `low = mid + 1` or `high = mid - 1` just like standard 1D binary search.",
    },
    {
      heading: "Trade-offs & Alternative Matrix Formulations",
      body: "Virtual flattening requires strictly sorted row boundaries. If rows are independently sorted but lack global ordering across rows (e.g. LeetCode #240: Search a 2D Matrix II), virtual flattening fails. In that variant, a top-right staircase search running in O(m + n) time or row-by-row binary search running in O(m log n) time must be used instead.",
    },
    {
      heading: "Edge Cases & Bounds Preservation",
      body: "Empty matrices (`m == 0` or `n == 0`) must be guarded up front to prevent division-by-zero or negative index calculations. Additionally, integer floor division `mid // n` must consistently use column count `n` (the row length), not row count `m`, to avoid out-of-bounds array access on non-square matrices.",
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
        "Calculating 2D row and column indices from a flat 1D index using `row = mid // cols` and `col = mid % cols`.",
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
  description: `Locate a target value in an $m \\times n$ integer matrix with sorted rows and strictly increasing row transitions in $O(\\log(m \\cdot n))$ time.

### Why It Exists & What It Solves
Searching a 2D matrix element by element takes $O(m \\cdot n)$ linear time. When each row is sorted and the first element of each row is strictly greater than the last element of the previous row, the entire matrix forms one continuous sorted sequence. Instead of flattening the matrix into a new 1D array ($O(m \\cdot n)$ space/time cost), we can perform binary search on virtual 1D indices, calculating 2D coordinates on demand in $O(1)$ space and $O(\\log(m \\cdot n))$ time.

### Step-by-Step Intuition
1. **Virtual Index Range**: Map the $m \\times n$ cells to flat indices $0$ to $m \\cdot n - 1$. Set \`low = 0\` and \`high = m * n - 1\`.
2. **Compute Midpoint**: Calculate 1D midpoint \`mid = (low + high) // 2\`.
3. **Map to 2D Coordinates**:
   - \`row = mid // n\` (number of full rows passed)
   - \`col = mid % n\` (offset within the current row)
4. **Compare & Branch**:
   - If \`matrix[row][col] == target\`, return \`True\`.
   - If \`matrix[row][col] < target\`, set \`low = mid + 1\`.
   - If \`matrix[row][col] > target\`, set \`high = mid - 1\`.

### Input Parameters
- \`matrix\`: An $m \\times n$ integer grid where each row is sorted and \`matrix[i][0] > matrix[i-1][n-1]\`.
- \`target\`: The integer target value to locate.

### Output
- Returns boolean \`true\` if target exists in matrix, otherwise \`false\`.

### Trade-offs & Complexity
- **Time Complexity**: $O(\\log(m \\cdot n))$ worst/average case, $O(1)$ best case.
- **Space Complexity**: $O(1)$ auxiliary space using virtual index mapping.
- **Requirement**: Matrix must have globally sorted row transitions.

### Edge Cases & Constraints
- \`m == matrix.length\`, \`n == matrix[i].length\`
- \`1 <= m, n <= 100\`
- \`-10^4 <= matrix[i][j], target <= 10^4\`
- Degenerate empty matrices (\`m == 0\` or \`n == 0\`).
- Single element matrices ($1 \\times 1$).`,
  constraints: [
    "m == matrix.length",
    "n == matrix[i].length",
    "1 <= m, n <= 100",
    "-10^4 <= matrix[i][j], target <= 10^4",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        "matrix = [[1, 3, 5, 7, 9], [10, 12, 14, 16, 18], [20, 22, 24, 26, 28], [30, 32, 34, 36, 38], [40, 42, 44, 46, 48]], target = 34",
      outputDisplay: "true",
      title: "Basic Example",
      input: {
        matrix: [
          [1, 3, 5, 7, 9],
          [10, 12, 14, 16, 18],
          [20, 22, 24, 26, 28],
          [30, 32, 34, 36, 38],
          [40, 42, 44, 46, 48],
        ],
        target: 34,
      },
      output: "true",
      explanation: "5x5 matrix search; flat index 17 maps to row 3, col 2 where 34 is located.",
    },
    {
      kind: "complex",
      inputDisplay:
        "matrix = [[1, 2, 4, 8], [12, 16, 20, 24], [28, 32, 40, 50], [60, 70, 80, 90]], target = 50",
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
