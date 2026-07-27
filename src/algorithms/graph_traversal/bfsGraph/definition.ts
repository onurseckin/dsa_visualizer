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
    3: "Declares the traversal's entry point: an adjacency-style graph and the vertex to start the layer-by-layer expansion from.",
    4: "Seeds the visited set with the start node immediately, so it can never be rediscovered and queued a second time later.",
    5: "Initializes the FIFO frontier holding only the start node — the sole vertex at distance 0 from itself.",
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
  difficulty: "Medium",
  description:
    "Breadth-First Search (BFS) explores a graph layer by layer from a source node: all distance-1 neighbors first, then distance-2, and so on. A first-in-first-out queue keeps the layers in order while a visited set stops cycles from causing repeat visits. Because nodes are reached in order of distance, BFS finds the shortest path (fewest edges) from the source to every reachable vertex in an unweighted graph.",
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
    time: "Each vertex enters the queue at most once — the visited set guarantees it — and is dequeued and processed once, which accounts for the V term. When a vertex is dequeued we scan its incident edges, and over the whole run every edge is looked at only a constant number of times, adding the E term. The total is O(V + E) in every case, because BFS always sweeps the entire reachable component.",
    space:
      "The visited set can end up holding every vertex, and the queue can hold a whole frontier of vertices at once, so extra memory grows with the vertex count — O(V).",
  },
  topicGuide: {
    overview:
      'Breadth-first search explores a graph in rings around a starting vertex: everything one edge away, then everything two edges away, and so on until the reachable part of the graph is exhausted. That ordering is not a stylistic preference but the source of its main guarantee, because the first time BFS reaches a vertex it has necessarily arrived by a path with the fewest possible edges. It is the traversal to reach for whenever "shortest", "fewest moves", or "closest" appears in an unweighted setting, and it is the backbone of grid puzzles, maze solving, social-distance queries, and web crawling. The whole algorithm is a queue, a visited set, and the discipline to never look at a vertex twice.',
    sections: [
      {
        heading: "The core idea: a queue turns a graph into layers",
        body: "A traversal is defined by which discovered-but-unexplored vertex you choose to expand next, and BFS always chooses the one that has been waiting longest. A first-in-first-out queue enforces that choice mechanically, so vertices leave the queue in the same order they were discovered. Because a vertex is discovered from a neighbour one edge closer to the source, this ordering keeps the queue sorted by distance from the source at all times. In the sample graph, starting at A the queue holds B and C, then D and E, then F, which is exactly the layer structure of the graph drawn out. Swap the queue for a stack and you get depth-first search instead, which is why these two famous traversals differ by a single data-structure choice.",
      },
      {
        heading: "How the mechanism works: visit, mark, enqueue",
        body: "You seed the visited set and the queue with the source, then loop while the queue is non-empty. Each iteration pops the front vertex, scans its adjacency list, and for every neighbour not yet in the visited set adds it to visited and pushes it onto the back of the queue. The critical detail is that a vertex is marked visited the moment it is enqueued, not when it is later dequeued. If you delay the mark until dequeue, a vertex with several neighbours in the current layer gets pushed multiple times, and the queue can blow up while your traversal reports duplicate visits. If you need distances or the actual path, store a distance or parent value alongside the mark at the same instant, since that is exactly when the shortest path to that vertex is fixed.",
      },
      {
        heading: "Why it is correct: distances never go backwards",
        body: "The invariant that carries BFS is that at every moment the queue contains vertices from at most two consecutive layers, with the nearer layer in front, and every vertex in the queue is labelled with its true shortest distance from the source. Expanding a vertex at distance d can only discover unvisited neighbours at distance d + 1, so appending them to the back keeps the queue ordered and the invariant intact. This is what licenses the first-visit rule: when you reach a vertex for the first time, no shorter route can exist, because every route with fewer edges would have come from an earlier layer that was already fully expanded. Any later edge into that vertex therefore offers nothing better and can be ignored, which is why marking on discovery loses no correctness. Notice how much this argument depends on all edges costing the same, and that is precisely the assumption Dijkstra has to replace when weights differ.",
      },
      {
        heading: "When to use BFS versus the alternatives",
        body: "Choose BFS when edges are unweighted or uniformly weighted and you care about distance, since it gives shortest paths with nothing more than a queue. Choose depth-first search when you want to go deep rather than wide, as in cycle detection, topological ordering, or exploring every path, and when its recursion structure makes the bookkeeping natural. Once edges carry different positive weights, BFS is simply wrong and you need Dijkstra with a priority queue; the special case of weights that are only 0 or 1 has a neat middle ground called 0-1 BFS using a deque. If you are searching a huge space toward a known target, bidirectional BFS from both ends can cut the explored frontier dramatically, and A-star adds a heuristic when you have a sensible distance estimate.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "BFS only reaches the connected component containing the source, so counting all components means restarting it from every unvisited vertex, and the sample disconnected case is a reminder that unvisited does not mean unreachable by mistake. Watch out for graphs represented so that a missing key throws instead of returning an empty neighbour list, and for the source vertex needing to be in visited before the loop starts. Self loops and parallel edges are harmless if you check visited before enqueuing, but they will cause duplicates if you skip that check. Memory is the sneakier problem: the frontier of a broad graph can be a large fraction of all vertices at once, so BFS can use far more memory than DFS on the same graph. Directed graphs also make the traversal one-way, so reachability from A says nothing about reachability back to A.",
      },
      {
        heading: "How the pattern generalizes",
        body: "Once the loop is familiar, most BFS problems are small variations on it. Recording the queue length before each round and draining exactly that many vertices gives you an explicit layer number, which is how minimum-moves puzzles report their answer. Seeding the queue with several vertices at once turns it into multi-source BFS, which computes the distance to the nearest of many starts in one sweep and solves rotting-oranges and nearest-exit problems directly. Colouring vertices by alternating layers checks whether a graph is bipartite. On grids the graph is implicit, with cells as vertices and the four or eight step directions as edges, so no adjacency list needs building at all. State-space search generalizes further still, treating any configuration such as a board layout or a word as a vertex and legal transformations as edges.",
      },
    ],
    keyTerms: [
      {
        term: "Frontier",
        definition:
          "The set of discovered vertices still waiting to be expanded, which is exactly what the queue holds. Its size at the widest layer determines the memory BFS actually needs.",
      },
      {
        term: "Layer",
        definition:
          "All vertices at the same edge distance from the source. BFS processes layers strictly in order, and that order is what makes its distances shortest.",
      },
      {
        term: "Visited set",
        definition:
          "The record of vertices already discovered, which prevents cycles from causing infinite loops and repeated work. Adding to it at discovery time rather than expansion time is what keeps the queue free of duplicates.",
      },
      {
        term: "Adjacency list",
        definition:
          "A representation storing, for each vertex, the collection of vertices it links to. It lets BFS scan only the edges that actually exist rather than testing every possible pair.",
      },
      {
        term: "Connected component",
        definition:
          "A maximal group of vertices mutually reachable through edges. A single BFS explores exactly one of them, which is why component counting restarts the search from each unvisited vertex.",
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
