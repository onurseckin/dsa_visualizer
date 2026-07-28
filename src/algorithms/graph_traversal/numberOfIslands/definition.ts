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
    "Counting islands is the standard introduction to connected-component counting on an implicit graph, and it teaches a pattern you will reuse constantly. The grid is not really a matrix problem: each land cell is a vertex, each adjacency between two land cells is an edge, and an island is a connected component. The technique is a full sweep of the grid paired with a flood fill that claims an entire component the moment you step onto any part of it. Once you see grids as graphs in disguise, a large family of matrix puzzles collapses into traversal problems you already know how to solve.",
  sections: [
    {
      heading: "The core idea: the grid is a graph you never have to build",
      body: 'The insight that unlocks this problem is that you do not need an adjacency list, because the coordinates already encode the edges. The neighbours of cell (r, c) are the four cells you get by adding the offsets (1, 0), (-1, 0), (0, 1) and (0, -1), computed on demand rather than stored. Land cells are vertices, water cells are absent from the graph entirely, and an island is precisely a maximal set of land cells reachable from one another. That reframing turns "count islands" into "count connected components", a question graph traversal answers directly. Recognizing this implicit-graph shape is the transferable skill; the counting loop around it is almost incidental.',
    },
    {
      heading: "How the mechanism works: sweep once, flood once",
      body: "The outer double loop visits every cell in reading order and asks one question: is this land that no earlier flood has already claimed? If the answer is yes you have discovered a brand new island, so you increment the counter and launch a BFS from that cell. The flood pushes the starting cell, then repeatedly pops a cell and enqueues each of its in-bounds, land, unvisited neighbours, marking them visited as they are enqueued. When the queue empties, every cell of that island has been claimed, so the outer sweep can continue past them without triggering anything. On the sample grid the sweep triggers at (0, 0) and floods the top-left two-by-two block, later triggers at (2, 2) for a single-cell island, and finally at (3, 3) for the two-cell island in the bottom row, giving three.",
    },
    {
      heading: "Why it is correct: count on discovery, claim everything",
      body: "The invariant is that after the sweep has passed any cell, every land cell examined so far is marked visited and belongs to exactly one island already counted. The counter can never overcount because the flood claims the whole component before the sweep moves on, so no other cell of that island will ever satisfy the unvisited test again. It can never undercount either, because the sweep inspects every single cell, so the topmost-leftmost cell of any island is guaranteed to be reached while still unvisited and will fire the counter exactly once. Together these give a clean bijection: one increment per island, no more and no fewer. Notice that the specific traversal used for the flood is irrelevant to this argument, which is why depth-first search works identically here.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: 'Mark cells visited when you enqueue them, not when you dequeue them, or a cell reachable from two neighbours in the same wave gets queued twice and the flood does redundant work. Bounds checking must come before the grid lookup, since evaluating a cell value at a negative or out-of-range index either throws or, in languages with wraparound indexing, silently connects opposite edges of the grid. Remember the cells are the strings "0" and "1" in this formulation rather than numbers, so comparing against an integer quietly finds nothing. Handle the degenerate inputs of an empty grid or an empty first row before computing dimensions. Finally, be explicit about connectivity: this problem uses four-directional adjacency, so two land cells touching only at a corner are separate islands, and a variant asking for eight directions needs four more offsets.',
    },
    {
      heading: "BFS, DFS, or union-find",
      body: "BFS and DFS both solve this with the same asymptotic cost and the same counting logic, so the choice is practical. Recursive DFS is the shortest to write but risks a stack overflow on a large grid that is almost entirely land, since the recursion depth can approach the number of cells. BFS keeps its state in an explicit queue, which is safer for big inputs, and it is also the version you want if a variant asks for distances. A visited set is the clean choice when you must not modify the caller data; overwriting land cells with water as you flood avoids the extra memory but destroys the input. Union-find becomes the better tool when cells are added over time and you must report the island count after each addition, because incremental merging is exactly what it is built for.",
    },
    {
      heading: "How the pattern generalizes",
      body: "The same sweep-plus-flood skeleton answers a whole family of grid questions with tiny edits. Return the largest flood size instead of the count and you have max area of an island; count boundary segments while flooding and you have island perimeter. Start the sweep only from border cells and you get surrounded regions and the closed-island and enclave problems, since anything the border flood misses is fully enclosed. Seed the queue with every source cell at once and BFS layers give shortest-time answers such as rotting oranges or nearest-zero distance maps. Recording each island as a set of coordinates normalized against its top-left corner lets you compare shapes, which is how distinct-islands problems work. In every case the grid stays an implicit graph and the traversal stays the same, so what changes is only what you accumulate along the way.",
    },
  ],
  keyTerms: [
    {
      term: "Connected component",
      definition:
        "A maximal group of cells mutually reachable through allowed steps. Each island in the grid is one component, so counting islands is counting components.",
    },
    {
      term: "Flood fill",
      definition:
        "A traversal that spreads outward from a starting cell to claim everything connected to it. It is what guarantees a single island contributes exactly one to the count.",
    },
    {
      term: "Implicit graph",
      definition:
        "A graph whose edges are computed from structure rather than stored, as when a cell derives its neighbours from coordinate offsets. It lets you run graph algorithms with no adjacency list at all.",
    },
    {
      term: "Four-directional connectivity",
      definition:
        "The rule that only cells sharing an edge, not merely a corner, are neighbours. Switching to eight directions changes which land clusters merge and therefore the answer.",
    },
    {
      term: "Bounds check",
      definition:
        "Confirming a candidate coordinate lies inside the grid before reading it. Doing this before the value lookup is what keeps the flood from wandering off the edge of the matrix.",
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
  description:
    "Given an $m \\times n$ 2D binary grid `grid` where `'1'` represents land and `'0'` represents water, return the total number of connected islands. An island is surrounded by water and is formed by connecting adjacent land cells horizontally or vertically (4-directional adjacency: $(r \\pm 1, c)$ and $(r, c \\pm 1)$). The algorithm sweeps every cell $(r, c)$ in $\\mathcal{O}(m \\times n)$ time and triggers a BFS/DFS flood fill upon encountering an unvisited land cell, marking all connected land cells in that component as visited.",
  constraints: [
    "1 <= m, n <= 300",
    'grid[i][j] is either "0" (water) or "1" (land)',
    "All grid boundaries outside matrix perimeter are considered surrounded by water",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]',
      outputDisplay: "2",
      title: "Basic Example",
      input: {
        grid: [
          ["1", "1", "0", "0", "0"],
          ["1", "1", "0", "0", "0"],
          ["0", "0", "1", "0", "0"],
          ["0", "0", "0", "1", "1"],
        ],
      },
      output: "3",
      explanation:
        "Top-left 2x2 land forms Island 1. Cell (2,2) forms Island 2. Bottom-right cells (3,3) and (3,4) form Island 3. Total = 3.",
    },
    {
      kind: "complex",
      inputDisplay:
        'grid = [["1","1","0","0"],["1","0","0","1"],["0","0","1","1"],["0","0","0","0"]]',
      outputDisplay: "2",
      title: "Complex Edge Case",
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
      inputDisplay: 'grid = [["0","0"],["0","0"]]',
      outputDisplay: "0",
      title: "Failing / Boundary Case",
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
    time: "Every cell in the $m \\times n$ grid is visited once by the outer loop, and each land cell is enqueued/dequeued at most once by BFS, taking $\\mathcal{O}(m \\times n)$ time.",
    space:
      "The visited lookup set and the BFS queue store at most $\\mathcal{O}(m \\times n)$ cell coordinates in the worst case when the grid is filled with land.",
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
