import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { BFS_GRAPH_CODE } from "./pythonCode";
import { generateBFSGraphSteps, type BFSGraphInput } from "./stepGenerator";

export const DEFAULT_BFS_INPUT: BFSGraphInput = {
  startNodeId: "A",
  nodes: [
    { id: "A", label: "A", x: 100, y: 100, state: "default" },
    { id: "B", label: "B", x: 200, y: 50, state: "default" },
    { id: "C", label: "C", x: 200, y: 150, state: "default" },
    { id: "D", label: "D", x: 300, y: 50, state: "default" },
    { id: "E", label: "E", x: 300, y: 150, state: "default" },
    { id: "F", label: "F", x: 400, y: 100, state: "default" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "E" },
    { from: "D", to: "F" },
    { from: "E", to: "F" },
  ],
};

const BFS_GRAPH_TRIVIA: TriviaMeta = {
  skipLines: [3],
  distractors: [
    "current = queue.pop()",
    "visited = set()",
    "queue.appendleft(neighbor)",
    "if neighbor in visited:",
    "visited.add(current)",
  ],
  hints: [
    {
      line: 4,
      hint: "Seed the seen-set with the origin itself, so it can never be discovered a second time.",
    },
    {
      line: 5,
      hint: "Build the frontier from a structure with a cheap front, holding just the origin to begin with.",
    },
    {
      line: 9,
      hint: "Take whichever node has waited longest — that FIFO choice is the whole difference from DFS.",
    },
    {
      line: 13,
      hint: "Claim the neighbour the moment it is discovered, not when it is later processed, or it can enter the frontier twice.",
    },
  ],
  lineExplanations: {
    1: "deque supplies an O(1) popleft/append pair, which is exactly what a FIFO queue needs — BFS depends on that cheap front-pop to keep vertices coming out in discovery order.",
    2: "Blank separator line following module import definitions.",
    3: "Declares the traversal's entry point: an adjacency-style graph and the vertex to start the layer-by-layer expansion from.",
    4: "Seeds the visited set with the start node immediately, so it can never be rediscovered and queued a second time later.",
    5: "Initializes the FIFO frontier holding only the start node — the sole vertex at distance 0 from itself.",
    6: "Initializes the ordered traversal result that will be returned to the caller.",
    7: "Blank line preceding the primary while loop traversal logic.",
    8: "Keeps expanding as long as any discovered-but-unprocessed vertex remains in the frontier.",
    9: "Pops from the front, so vertices come out in the exact order they were discovered — that FIFO discipline is the entire reason BFS finds shortest paths in unweighted graphs.",
    10: "Records the dequeued node in breadth-first visitation order.",
    11: "Scans every edge leaving the current vertex to find candidates for the next layer out.",
    12: "Filters out neighbors already discovered, so no vertex is ever queued twice.",
    13: "Marks the neighbor visited the instant it's discovered — not when it's later dequeued and processed — which is what stops two frontier vertices sharing a neighbor from both queueing it.",
    14: "Appends to the back of the queue, placing this neighbor one layer behind everything already queued and preserving the layer order.",
    15: "Blank line separating traversal from its result.",
    16: "Returns nodes in the exact order they were removed from the FIFO queue.",
  },
};

export const bfsGraph: AlgorithmDefinition<BFSGraphInput> = {
  id: "bfs-graph",
  title: "BFS Graph Traversal",
  topicIds: ["graph_traversal"],
  difficulty: "Medium",
  description: `<p>Given a graph and a designated starting node, visit all reachable vertices in layer-by-layer breadth-first traversal order.</p>
<h3>Problem Statement</h3>
<p>Given a graph <code>G = (V, E)</code> represented by a list of vertices <code>V</code> and edges <code>E</code>, and a starting node <code>startNodeId</code>, return the sequence of vertices in the order they are first discovered during a breadth-first traversal.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nodes</code>: List of graph node objects representing vertices.</li>
  <li><code>edges</code>: List of edge objects connecting pairs of vertices.</li>
  <li><code>startNodeId</code>: The ID of the starting vertex.</li>
</ul>
<h3>Output</h3>
<p>Returns an array of node IDs visited in layer-by-layer traversal order.</p>
`,
  constraints: [
    "1 <= Number of vertices V <= 10^4",
    "0 <= Number of edges E <= 10^5",
    "Vertices are uniquely labeled strings or integers",
    "The graph can be directed or undirected and may contain cycles",
    "Start node must be a valid vertex present in the graph",
  ],
  examples: [
    {
      kind: "basic",
      kind: "basic",
      scenario: "standard",
      inputDisplay: 'graph = {A: [B, C], B: [D, E], C: [F]}, start = "A"',
      outputDisplay: '["A", "B", "C", "D", "E", "F"]',
      title: "Standard Connected Graph Layer Traversal",
      input: DEFAULT_BFS_INPUT,
      output: "Order: A, B, C, D, E, F",
      explanation:
        "Starting at A, BFS visits distance-1 neighbors (B, C), then distance-2 (D, E), and finally distance-3 (F).",
    },
    {
      kind: "complex",
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: 'graph = {A: [B], B: [C, D], C: [A, E]}, start = "A"',
      outputDisplay: '["A", "B", "C", "D", "E"]',
      title: "Adversarial Cyclic Graph Traversal",
      input: {
        startNodeId: "A",
        nodes: [
          { id: "A", label: "A", x: 100, y: 100, state: "default" },
          { id: "B", label: "B", x: 200, y: 50, state: "default" },
          { id: "C", label: "C", x: 200, y: 150, state: "default" },
          { id: "D", label: "D", x: 300, y: 50, state: "default" },
          { id: "E", label: "E", x: 300, y: 150, state: "default" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
          { from: "C", to: "A" },
          { from: "B", to: "D" },
          { from: "C", to: "E" },
          { from: "D", to: "E" },
          { from: "E", to: "B" },
        ],
      },
      output: "Order: A, B, C, D, E",
      explanation:
        "The graph contains back-edges and cycles (A-B-C-A, B-D-E-B). The visited set prevents infinite loops, visiting every reachable node once.",
    },
    {
      kind: "negative",
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 'graph = {A: [B], C: [D]}, start = "A"',
      outputDisplay: '["A", "B"]',
      title: "Boundary Disconnected Component Case",
      input: {
        startNodeId: "A",
        nodes: [
          { id: "A", label: "A", x: 100, y: 100, state: "default" },
          { id: "B", label: "B", x: 200, y: 100, state: "default" },
          { id: "C", label: "C", x: 300, y: 100, state: "default" },
          { id: "D", label: "D", x: 400, y: 100, state: "default" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "C", to: "D" },
        ],
      },
      output: "Visited: {A, B}",
      explanation:
        "Nodes C and D reside in an isolated component. BFS from A visits only reachable vertices {A, B}, leaving C and D unvisited.",
    },
  ],
  code: BFS_GRAPH_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Each vertex enters the queue Q at most once — guaranteed by the visited set S — and is dequeued and processed once, taking O(|V|) time. Scanning incident edges takes O(|E|) total work across all vertices. Total complexity is O(|V| + |E|).",
    space:
      "The visited set S holds up to |V| vertices, and the queue Q holds a frontier bounded by O(|V|) vertices at maximum layer width, requiring O(|V|) space.",
  },
  topicGuide: {
    overview:
      "<p>Breadth-first search explores a graph <code>G = (V, E)</code> in expanding concentric rings around a starting vertex <code>s</code>: all vertices at unweighted distance <code>d = 1</code>, then <code>d = 2</code>, up to distance <code>d = k</code>. That ordering guarantees that the first time BFS visits a vertex <code>v</code>, it has reached <code>v</code> via a path of minimum edge count <code>dist(s, v)</code>.</p><p>It is the fundamental algorithm for unweighted shortest paths, maze solving, connected component analysis, and network flooding.</p>",
    sections: [
      {
        heading: "The core idea: a queue turns a graph into layers",
        body: "<p>A graph traversal strategy is governed by how candidate vertices in the frontier are prioritized. BFS uses a First-In-First-Out (FIFO) queue <code>Q</code>, ensuring vertices are popped in the exact chronological order of their discovery. When expanding a node <code>u</code> at distance <code>dist(s, u) = k</code>, any unvisited neighbor <code>v</code> is added at distance <code>dist(s, v) = dist(s, u) + 1</code>.</p><p>Because <code>Q</code> processes layer <code>k</code> entirely before layer <code>k + 1</code>, the queue contents maintain a monotonically non-decreasing distance property.</p>",
      },
      {
        heading: "How the mechanism works: visit, mark, enqueue",
        body: "<p>You seed the visited set <code>S = {s}</code> and the queue <code>Q = [s]</code>, then iterate while <code>Q</code> is non-empty. Each iteration pops <code>u = Q.popleft()</code>, scans all directed or undirected edges <code>(u, v) ∈ E</code>, and for every unvisited neighbor, marks <code>v ∈ S</code> and appends <code>v</code> to <code>Q</code>.</p><p>Marking <code>v</code> at the exact moment of enqueue (rather than dequeue) is essential to prevent duplicate queue entries when multiple nodes share neighbor <code>v</code>.</p>",
      },
      {
        heading: "Why it is correct: distance invariants",
        body: "<p>The correctness of BFS as an unweighted shortest path algorithm stems from the induction invariant that queue elements are ordered by non-decreasing distance: <code>dist(s, v1) ≤ dist(s, v2) ≤ ... ≤ dist(s, vm) ≤ dist(s, v1) + 1</code>.</p><p>When vertex <code>v</code> is first enqueued, no shorter path can exist because all paths with fewer edges were explored in earlier layers.</p>",
      },
      {
        heading: "When to use BFS versus the alternatives",
        body: "<p>Use BFS for unweighted or uniform-edge-weight graphs where shortest path guarantees are required in <code>O(V + E)</code> time. If edges have non-negative weights, upgrade to Dijkstra's algorithm using a priority queue (<code>O((V + E) log V)</code>). If weights are restricted to 0 and 1, use 0-1 BFS with a double-ended queue (<code>deque</code>) in <code>O(V + E)</code> time.</p>",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "<p>A single BFS invocation visits only the connected component containing source <code>s</code>. To traverse disconnected graphs, execute an outer loop over all <code>v ∈ V</code>. Remember to handle isolated nodes (empty edge set) and self-loops cleanly.</p>",
      },
      {
        heading: "How the pattern generalizes",
        body: "<p>Multi-source BFS initializes <code>Q</code> with multiple start nodes simultaneously, finding shortest paths to the nearest seed in <code>O(V + E)</code>. Grid problems treat <code>(r, c)</code> coordinates as implicit graph vertices with 4-way or 8-way transitions.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Frontier Queue (Q)",
        definition: "The FIFO queue holding discovered nodes awaiting neighbor expansion.",
      },
      {
        term: "Layer / Level",
        definition: "The set of vertices at uniform edge distance dist(s, v) from the source.",
      },
      {
        term: "Visited Set (S)",
        definition: "The lookup set preventing cycle loops and duplicate enqueues.",
      },
    ],
  },
  trivia: BFS_GRAPH_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 12",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 12,
      section: "12.2 Breadth-first search",
    },
  ],
  defaultInput: DEFAULT_BFS_INPUT,
  generateSteps: generateBFSGraphSteps,
};

export default bfsGraph;
