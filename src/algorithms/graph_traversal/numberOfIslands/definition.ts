import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { NUMBER_OF_ISLANDS_CODE } from "./pythonCode";
import { generateNumberOfIslandsSteps } from "./stepGenerator";

export interface NumberOfIslandsInput {
  grid: string[][];
}

export const DEFAULT_NUMBER_OF_ISLANDS_INPUT: NumberOfIslandsInput = {
  grid: [
    ["1", "1", "0", "0", "0"],
    ["1", "1", "0", "0", "0"],
    ["0", "0", "1", "0", "0"],
    ["0", "0", "0", "1", "1"],
  ],
};

const NUMBER_OF_ISLANDS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Counting islands is the standard introduction to connected-component counting on an implicit graph. The grid is essentially a graph: each land cell is a vertex, orthogonal adjacency between land cells forms an edge, and an island is a connected component. The technique combines a full grid sweep with a flood fill that claims an entire component upon initial discovery.</p>",
  sections: [
    {
      heading: "The core idea: the grid is a graph you never have to build",
      body: "<p>You do not need an explicit adjacency list because grid coordinates encode implicit edges. The neighbors of cell <code>(r, c)</code> are computed using four directional offsets: <code>(1, 0)</code>, <code>(-1, 0)</code>, <code>(0, 1)</code>, and <code>(0, -1)</code>. Land cells are vertices, water cells are excluded, and an island is a maximal connected component.</p>",
    },
    {
      heading: "How the mechanism works: sweep once, flood once",
      body: "<p>The outer double loop scans every cell in reading order. When encountering unvisited land, a new island is detected. We increment the island counter and launch a BFS or DFS flood fill. The flood marks all reachable land cells as visited, ensuring subsequent grid iterations skip them.</p>",
    },
    {
      heading: "Why it is correct: count on discovery, claim everything",
      body: "<p>Because the flood fill exhausts all connected land cells before the outer sweep continues, no island is counted more than once. Conversely, every island has at least one top-leftmost cell that triggers discovery, so no island is missed.</p>",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "<p>Always mark cells visited at the moment they are enqueued (not dequeued) to avoid duplicate entries in the queue. Ensure bounds checking is performed prior to grid array indexing to prevent out-of-bounds exceptions.</p>",
    },
    {
      heading: "BFS, DFS, or Union-Find",
      body: "<p>BFS and DFS solve this problem in <code>O(m × n)</code> time. BFS uses an explicit queue to avoid call-stack overflow on large grids. Disjoint Set Union (DSU) is ideal for dynamic grid problems where land cells are added incrementally.</p>",
    },
    {
      heading: "How the pattern generalizes",
      body: "<p>This sweep-plus-flood pattern extends directly to problems like finding the maximum area of an island, calculating island perimeters, enclosing regions (surrounded regions), and multi-source shortest paths on grids.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Connected Component",
      definition:
        "A maximal subset of vertices mutually reachable via graph edges; each island represents one connected component.",
    },
    {
      term: "Flood Fill",
      definition:
        "A graph traversal technique that expands outward from a seed cell to mark all connected nodes in a component.",
    },
    {
      term: "Implicit Graph",
      definition:
        "A graph whose vertices and edges are derived on the fly from grid coordinates without storing an explicit adjacency list.",
    },
    {
      term: "Orthogonal Adjacency",
      definition:
        "Four-directional connectivity (up, down, left, right) sharing cell boundaries rather than diagonal corners.",
    },
    {
      term: "Bounds Check",
      definition:
        "Validation that row and column indices fall strictly within [0, rows-1] and [0, cols-1] before cell access.",
    },
  ],
};

const NUMBER_OF_ISLANDS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "deque supplies O(1) popleft/append, letting each flood-fill BFS run as a cheap FIFO instead of a list with O(n) front-removals.",
    2: "Blank line separating imports from function definition.",
    3: "Entry point: takes the raw grid of '0'/'1' strings whose connected land components we need to count.",
    4: "Guards the degenerate case of an empty grid or an empty first row before any dimension math is attempted.",
    5: "With no cells at all there can be no islands, so we return immediately.",
    6: "Blank line separating input validation guard from state initialization.",
    7: "Caches the grid dimensions once, so every bounds check inside the flood fill is just a cheap comparison against these two numbers.",
    8: "Encodes the four orthogonal offsets — the definition of 'connected' this problem uses, so land touching only diagonally is a separate island.",
    9: "Tracks every land cell already claimed by some island's flood, so the outer sweep never starts a second flood on the same island.",
    10: "The running tally of islands found so far — incremented once per BFS launch, never during the flood itself.",
    11: "Blank line separating counter initialization from getNeighbors helper definition.",
    12: "Helper generator yielding valid, unvisited land neighbors for a given cell.",
    13: "Iterates over the four directional offsets.",
    14: "Computes candidate neighbor row index.",
    15: "Computes candidate neighbor column index.",
    16: "Bounds check: skips coordinates falling outside the grid.",
    17: "Continues the offset iteration when candidate neighbor coordinates fall outside grid boundaries.",
    18: "Skips water cells or cells already claimed by a flood fill.",
    19: "Continues the offset iteration when candidate neighbor is water or already claimed by a flood fill.",
    20: "Yields the next valid unvisited land neighbor.",
    21: "Blank line separating getNeighbors helper from main iteration loop.",
    22: "Outer sweep walks every row in order, guaranteeing every cell in the grid is eventually inspected.",
    23: "Inner sweep walks every column, so together the double loop visits each cell exactly once.",
    24: "A cell only triggers a new island if it's land and hasn't already been claimed by an earlier flood.",
    25: "This cell is the first cell of a brand-new island, so we count it before the flood claims the rest of its component.",
    26: "Claims the starting cell immediately, so the outer sweep won't try to launch a second flood from it later.",
    27: "Seeds a fresh BFS frontier with just this one cell — the flood fill that will mark this whole island visited.",
    28: "Keeps expanding the flood as long as unexplored cells of this island remain queued.",
    29: "Dequeues the next cell of the current island so its boundary can be expanded outward.",
    30: "Uses the getNeighbors generator to iterate over all valid unvisited neighbors.",
    31: "Marks the neighbor visited the moment it is discovered to prevent duplicate queueing.",
    32: "Adds the neighbor to the flood's frontier so its own neighbors get explored on a later iteration.",
    33: "Blank line separating queue traversal from final result return statement.",
    34: "Every land cell has now been claimed by exactly one flood, so the number of floods launched equals the number of islands.",
  },
};

export const numberOfIslands: AlgorithmDefinition<NumberOfIslandsInput> = {
  id: "number-of-islands",
  title: "Number of Islands",
  topicIds: ["graph_traversal"],
  difficulty: "Medium",
  description: `<p>Given an <em>m</em> &times; <em>n</em> 2D binary grid <code>grid</code> where <code>'1'</code> represents land and <code>'0'</code> represents water, return the total number of connected islands.</p>
<h3>Problem Statement</h3>
<p>An island is surrounded by water and is formed by connecting adjacent land cells horizontally or vertically (4-directional orthogonal adjacency). You may assume all four edges of the grid are completely surrounded by water.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>grid</code>: An <em>m</em> &times; <em>n</em> 2D binary array of <code>'0'</code> and <code>'1'</code> strings.</li>
</ul>
<h3>Output</h3>
<p>Returns an integer representing the total count of distinct connected islands.</p>
`,
  constraints: [
    "1 <= m, n <= 300",
    'grid[i][j] is either "0" (water) or "1" (land)',
    "All grid boundaries outside matrix perimeter are considered surrounded by water",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay:
        'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
      outputDisplay: "3",
      title: "Standard Multi-Island Grid Flood Fill",
      input: DEFAULT_NUMBER_OF_ISLANDS_INPUT,
      output: "3",
      explanation:
        "Top-left 2x2 land forms Island 1. Cell (2,2) forms Island 2. Bottom-right cells (3,3) and (3,4) form Island 3. Total = 3.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: 'grid = [["1","0","1"],["0","1","0"],["1","0","1"]]',
      outputDisplay: "5",
      title: "Adversarial Checkerboard Corner-Touching Islands",
      input: {
        grid: [
          ["1", "0", "1"],
          ["0", "1", "0"],
          ["1", "0", "1"],
        ],
      },
      output: "5",
      explanation:
        "Diagonal land cells touch only at corners. Under 4-directional connectivity, none of them share edges, forming 5 distinct isolated islands.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 'grid = [["0","0"],["0","0"]]',
      outputDisplay: "0",
      title: "Boundary All Water Case",
      input: {
        grid: [
          ["0", "0"],
          ["0", "0"],
        ],
      },
      output: "0",
      explanation:
        "The grid contains only water cells ('0'). No land is found, resulting in 0 islands.",
    },
  ],
  code: NUMBER_OF_ISLANDS_CODE,
  timeComplexity: {
    best: "O(M * N)",
    average: "O(M * N)",
    worst: "O(M * N)",
  },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Every cell in the m × n grid is visited once by the outer loop, and each land cell is enqueued/dequeued at most once by BFS, taking O(m × n) time.",
    space:
      "The visited lookup set and the BFS queue store at most O(m × n) cell coordinates in the worst case when the grid is filled with land.",
  },
  topicGuide: NUMBER_OF_ISLANDS_TOPIC_GUIDE,
  trivia: NUMBER_OF_ISLANDS_TRIVIA,
  leetcode: {
    id: 200,
    url: "https://leetcode.com/problems/number-of-islands/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #200",
      leetcodeId: 200,
      url: "https://leetcode.com/problems/number-of-islands/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 12",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 12,
      section: "12.3 Graph traversal",
    },
  ],
  defaultInput: DEFAULT_NUMBER_OF_ISLANDS_INPUT,
  generateSteps: generateNumberOfIslandsSteps,
};
