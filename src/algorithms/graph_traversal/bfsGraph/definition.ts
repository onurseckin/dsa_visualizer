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
      line: 8,
      hint: "Take whichever node has waited longest — that FIFO choice is the whole difference from DFS.",
    },
    {
      line: 11,
      hint: "Claim the neighbour the moment it is discovered, not when it is later processed, or it can enter the frontier twice.",
    },
  ],
  lineExplanations: {
    1: "deque supplies an O(1) popleft/append pair, which is exactly what a FIFO queue needs — BFS depends on that cheap front-pop to keep vertices coming out in discovery order.",
    2: "Blank separator line following module import definitions.",
    3: "Declares the traversal's entry point: an adjacency-style graph and the vertex to start the layer-by-layer expansion from.",
    4: "Seeds the visited set with the start node immediately, so it can never be rediscovered and queued a second time later.",
    5: "Initializes the FIFO frontier holding only the start node — the sole vertex at distance 0 from itself.",
    6: "Blank line preceding the primary while loop traversal logic.",
    7: "Keeps expanding as long as any discovered-but-unprocessed vertex remains in the frontier.",
    8: "Pops from the front, so vertices come out in the exact order they were discovered — that FIFO discipline is the entire reason BFS finds shortest paths in unweighted graphs.",
    9: "Scans every edge leaving the current vertex to find candidates for the next layer out.",
    10: "Filters out neighbors already discovered, so no vertex is ever queued twice.",
    11: "Marks the neighbor visited the instant it's discovered — not when it's later dequeued and processed — which is what stops two frontier vertices sharing a neighbor from both queueing it.",
    12: "Appends to the back of the queue, placing this neighbor one layer behind everything already queued and preserving the layer order.",
  },
};

export const bfsGraph: AlgorithmDefinition<BFSGraphInput> = {
  id: "bfs-graph",
  title: "BFS Graph Traversal",
  category: "graph_traversal",
  categories: ["graph_traversal"],
  difficulty: "Medium",
  description:
    "Given a directed or undirected graph $G = (V, E)$ represented by vertices $V$ and edges $E$, along with a specified start node $s \\in V$, perform a Breadth-First Search (BFS) to traverse all reachable vertices layer by layer. BFS starts at the source $s$ at distance $d(s, s) = 0$ and explores all immediately adjacent neighbors at distance $d=1$, then moves on to explore neighbors of neighbors at distance $d=2$, and so forth. The algorithm utilizes a First-In-First-Out (FIFO) queue $Q$ to maintain discovery order and a visited set $S \\subseteq V$ to prevent processing duplicate vertices or getting trapped in infinite loops caused by graph cycles. Overall runtime is bounded by $\\mathcal{O}(|V| + |E|)$ with $\\mathcal{O}(|V|)$ auxiliary space.",
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
      inputDisplay: 'graph = {A: [B, C], B: [D, E], C: [F]}, start = "A"',
      outputDisplay: '["A", "B", "C", "D", "E", "F"]',
      title: "Basic Example",
      input: {
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
      },
      output: "Order: A, B, C, D, E, F",
      explanation:
        "Starting at A, BFS visits distance-1 neighbors (B, C), then distance-2 (D, E), and finally distance-3 (F).",
    },
    {
      kind: "complex",
      inputDisplay: 'graph = {1: [2, 3], 2: [4, 5], 3: [6], 4: [7]}, start = "1"',
      outputDisplay: '["1", "2", "3", "4", "5", "6", "7"]',
      title: "Complex Edge Case",
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
      inputDisplay: 'graph = {X: []}, start = "X"',
      outputDisplay: '["X"]',
      title: "Failing / Boundary Case",
      input: {
        startNodeId: "A",
        nodes: [
          { id: "A", label: "A", state: "default" },
          { id: "B", label: "B", state: "default" },
          { id: "C", label: "C", state: "default" },
          { id: "D", label: "D", state: "default" },
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
    time: "Each vertex enters the queue $Q$ at most once — guaranteed by the visited set $S$ — and is dequeued and processed once, taking $\\mathcal{O}(|V|)$ time. Scanning incident edges takes $\\mathcal{O}(|E|)$ total work across all vertices. The total complexity is $\\mathcal{O}(|V| + |E|)$.",
    space:
      "The visited set $S$ holds up to $|V|$ vertices, and the queue $Q$ holds a frontier bounded by $\\mathcal{O}(|V|)$ vertices at maximum layer width, requiring $\\mathcal{O}(|V|)$ space.",
  },
  topicGuide: {
    overview:
      'Breadth-first search explores a graph $G=(V, E)$ in expanding concentric rings around a starting vertex $s$: all vertices at unweighted distance $d=1$, then $d=2$, up to distance $d=k$. That ordering guarantees that the first time BFS visits a vertex $v$, it has reached $v$ via a path of minimum edge count $\\text{dist}(s, v)$. It is the fundamental algorithm for unweighted shortest paths, maze solving, connected component analysis, and network flooding.',
    sections: [
      {
        heading: "The core idea: a queue turns a graph into layers",
        body: "A graph traversal strategy is governed by how candidate vertices in the frontier are prioritized. BFS uses a First-In-First-Out (FIFO) queue $Q$, ensuring vertices are popped in the exact chronological order of their discovery. When expanding a node $u$ at distance $d(s,u)=k$, any unvisited neighbor $v$ is added at distance:\n\n$$\\text{dist}(s, v) = \\text{dist}(s, u) + 1$$\n\nBecause $Q$ processes layer $k$ entirely before layer $k+1$, the queue contents maintain a monotonically non-decreasing distance property.",
      },
      {
        heading: "How the mechanism works: visit, mark, enqueue",
        body: "You seed the visited set $S = \\{s\\}$ and the queue $Q = [s]$, then iterate while $Q \\neq \\emptyset$. Each iteration pops $u = Q.\\text{popleft()}$, scans all directed or undirected edges $(u, v) \\in E$, and for every $v \\notin S$, marks $v \\in S$ and pushes $Q.\\text{append}(v)$. Marking $v$ at the exact moment of enqueue (rather than dequeue) is essential to prevent duplicate queue entries when multiple nodes share neighbor $v$.",
      },
      {
        heading: "Why it is correct: distance invariants",
        body: "The correctness of BFS as an unweighted shortest path algorithm stems from the induction invariant:\n\n$$Q = [v_1, v_2, \\dots, v_m] \\implies \\text{dist}(s, v_1) \\le \\text{dist}(s, v_2) \\le \\dots \\le \\text{dist}(s, v_m) \\le \\text{dist}(s, v_1) + 1$$\n\nWhen vertex $v$ is first enqueued, no shorter path can exist because all paths with fewer edges were explored in earlier layers.",
      },
      {
        heading: "When to use BFS versus the alternatives",
        body: "Use BFS for unweighted or uniform-edge-weight graphs where shortest path guarantees are required in $\\mathcal{O}(|V| + |E|)$ time. If edges have non-negative weights $w(u,v) \\ge 0$, upgrade to Dijkstra's algorithm using a priority queue $\\mathcal{O}((V+E)\\log V)$. If weights are restricted to $0$ and $1$, use $0-1$ BFS with a double-ended queue (`deque`) in $\\mathcal{O}(|V| + |E|)$ time.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "A single BFS invocation visits only the connected component containing source $s$. To traverse disconnected graphs, execute a outer loop over all $v \\in V$. Remember to handle isolated nodes ($E=\\emptyset$) and self-loops cleanly.",
      },
      {
        heading: "How the pattern generalizes",
        body: "Multi-source BFS initializes $Q$ with multiple start nodes simultaneously, finding shortest paths to the nearest seed in $\\mathcal{O}(|V| + |E|)$. Grid problems treat $(r, c)$ coordinates as implicit graph vertices with 4-way or 8-way transitions.",
      },
    ],
    keyTerms: [
      {
        term: "Frontier (Q)",
        definition:
          "The FIFO queue holding discovered nodes awaiting neighbor expansion.",
      },
      {
        term: "Layer / Level",
        definition:
          "The set of vertices at uniform edge distance $d(s, v)$ from the source.",
      },
      {
        term: "Visited Set (S)",
        definition:
          "The lookup set preventing cycle loops and duplicate enqueues.",
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
