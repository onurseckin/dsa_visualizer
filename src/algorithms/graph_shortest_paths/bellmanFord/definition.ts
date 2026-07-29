import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { BELLMAN_FORD_CODE } from "./pythonCode";
import { generateBellmanFordSteps } from "./stepGenerator";

export interface BellmanFordInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
  startNode: string;
}

export const DEFAULT_BELLMAN_FORD_INPUT: BellmanFordInput = {
  nodes: ["S", "A", "B", "C", "D"],
  edges: [
    { from: "S", to: "A", weight: 4 },
    { from: "S", to: "B", weight: 2 },
    { from: "B", to: "A", weight: 1 },
    { from: "A", to: "C", weight: 3 },
    { from: "B", to: "C", weight: 5 },
    { from: "B", to: "D", weight: 4 },
    { from: "C", to: "D", weight: -2 },
  ],
  startNode: "S",
};

const BELLMAN_FORD_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Bellman-Ford solves the Single-Source Shortest Path (SSSP) problem on directed weighted graphs, supporting negative edge weights and detecting negative-weight cycles. Unlike Dijkstra's algorithm, which greedily finalizes vertices, Bellman-Ford repeatedly relaxes all edges in the graph across <code>|V| - 1</code> passes, allowing distance updates to propagate outward hop by hop.</p>",
  sections: [
    {
      heading: "Relax everything, then do it again",
      body: "<p>Instead of deciding which vertex to process next, Bellman-Ford relaxes all <code>|E|</code> edges in each pass. After <code>k</code> passes, the algorithm guarantees finding the shortest path to any vertex reachable using at most <code>k</code> edges. Because a simple shortest path without cycles contains at most <code>|V| - 1</code> edges, <code>|V| - 1</code> passes are sufficient to discover all shortest paths.</p>",
    },
    {
      heading: "What one sweep actually does",
      body: "<p>Each sweep iterates through every edge <code>(u, v)</code>. If vertex <code>u</code> is reachable (<code>dist[u] ≠ ∞</code>) and <code>dist[u] + w(u, v) &lt; dist[v]</code>, we update <code>dist[v] = dist[u] + w(u, v)</code>. If an entire pass completes without updating any distance, the distances have converged early and the algorithm terminates.</p>",
    },
    {
      heading: "Why |V| - 1 sweeps are exactly enough",
      body: "<p>A simple path in a graph with <code>|V|</code> vertices contains at most <code>|V| - 1</code> edges. Since each pass extends optimal path lengths by at least one edge, <code>|V| - 1</code> passes suffice to compute shortest paths for all reachable vertices.</p>",
    },
    {
      heading: "Negative cycles: detection, not repair",
      body: "<p>Running an extra <code>|V|</code>-th pass checks for negative-weight cycles. If any edge <code>(u, v)</code> can still be relaxed after <code>|V| - 1</code> passes (<code>dist[u] + w(u, v) &lt; dist[v]</code>), a negative-weight cycle is reachable from the source. In such cases, shortest distances are undefined (cost tends toward <code>-∞</code>).</p>",
    },
    {
      heading: "Choosing it over the alternatives",
      body: "<p>Use Dijkstra's algorithm when all edge weights are non-negative due to its superior <code>O((V + E) log V)</code> time complexity. Choose Bellman-Ford when graphs contain negative edge weights or require negative cycle detection.</p>",
    },
    {
      heading: "Pitfalls and practical notes",
      body: "<p>Always guard edge relaxation with a reachability check (<code>dist[u] ≠ ∞</code>) to avoid arithmetic on infinite values, especially when edge weights are negative. Note that negative cycles are only detected if they are reachable from the start node.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Edge Relaxation",
      definition:
        "The operation dist[v] = min(dist[v], dist[u] + w(u, v)) updating the tentative shortest distance to node v.",
    },
    {
      term: "Pass / Sweep",
      definition:
        "One complete iteration over all edges in the graph, extending shortest path computations by one edge.",
    },
    {
      term: "Negative-Weight Cycle",
      definition:
        "A directed cycle whose edge weights sum to less than zero, causing path costs to decrease infinitely.",
    },
    {
      term: "Reachability Guard",
      definition:
        "The check dist[u] ≠ ∞ ensuring an edge's source vertex is reachable before attempting relaxation.",
    },
    {
      term: "Early Termination",
      definition:
        "Stopping the algorithm early when a complete pass produces no distance updates across any edge.",
    },
  ],
};

const BELLMAN_FORD_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Entry point: takes the vertex list, the raw (u, v, weight) edge list, and the source, and tolerates negative edge weights unlike Dijkstra.",
    2: "Every vertex starts at infinity — unknown — until some sequence of relaxations proves a finite distance to it.",
    3: "The one certain distance before any work begins: the source is zero away from itself.",
    4: "Blank line separating distance table initialization from outer iteration sweeps.",
    5: "Runs one full sweep per possible path length, since after k sweeps every shortest path using at most k edges is already proven correct.",
    6: "Each sweep walks every single edge, because unlike Dijkstra there's no priority order to trust — every edge must be re-examined on every pass.",
    7: "Only relaxes through u if u is actually reachable, guarding against adding a weight to infinity, which negative weights could otherwise turn into a bogus finite number.",
    8: "Takes the cheaper route the instant this sweep discovers one — the update is visible to later edges in the same pass, which is why a lucky ordering can converge early.",
    9: "Blank line separating edge relaxation passes from negative cycle detection pass.",
    10: "Starts the detection flag optimistic; only a genuinely still-relaxable edge will flip it.",
    11: "One more full pass over every edge, run only after the V - 1 sweeps that should already have settled every true shortest path.",
    12: "If any edge can still be relaxed after V - 1 passes, no ordinary simple path explains it — the only remaining explanation is a negative-weight cycle.",
    13: "Records that the graph is unsafe: some reachable cycle can be looped forever to drive a distance toward negative infinity.",
    14: "Stops immediately once one negative cycle is confirmed — a single one is enough to invalidate the shortest-path question for the vertices it touches.",
    15: "Blank line separating negative cycle loop from return statement.",
    16: "Branches on the negative-cycle flag so an untrustworthy distance table is never exposed as an answer.",
    17: "Returns the stable (None, True) sentinel because no finite shortest-distance map exists.",
    18: "Returns the settled distance table with False when no reachable negative cycle exists.",
  },
};

export const bellmanFord: AlgorithmDefinition<BellmanFordInput> = {
  id: "bellman-ford",
  title: "Bellman-Ford Shortest Path",
  topicIds: ["graph_shortest_paths"],
  difficulty: "Medium",
  description:
    "<p>The <strong>Bellman-Ford algorithm</strong> computes Single-Source Shortest Paths (SSSP) from a source vertex to every other vertex in a directed weighted graph <code>G = (V, E)</code>. Unlike Dijkstra's algorithm, Bellman-Ford supports negative edge weights (<code>w(u, v) ∈ ℝ</code>) and detects negative-weight cycles.</p><p>It repeatedly relaxes all <code>|E|</code> edges over <code>|V| - 1</code> passes in <code>O(|V| · |E|)</code> time and <code>O(|V|)</code> space.</p>",
  constraints: [
    "1 <= Vertices V <= 250",
    "0 <= Edges E <= 2500",
    "-10^4 <= Edge Weight <= 10^4",
    "Start node must exist in the graph",
    "Graphs may contain negative edge weights and negative cycles",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        'graph = {S-A:6, S-B:7, A-B:8, A-C:5, A-D:-4, B-C:-3, B-E:9, C-A:-2, D-C:7, D-S:2}, start = "S"',
      outputDisplay: "{S: 0, A: 2, B: 7, C: 4, D: -2}",
      title: "Basic Example",
      input: {
        startNode: "S",
        nodes: ["S", "A", "B", "C", "D"],
        edges: [
          { from: "S", to: "A", weight: 4 },
          { from: "S", to: "B", weight: 2 },
          { from: "B", to: "A", weight: 1 },
          { from: "A", to: "C", weight: 3 },
          { from: "B", to: "C", weight: 5 },
          { from: "B", to: "D", weight: 4 },
          { from: "C", to: "D", weight: -2 },
        ],
      },
      output: "Distances: S:0, A:3, B:2, C:6, D:4",
      explanation:
        "Iterative edge relaxation handles the negative edge C->D (-2) gracefully. Final shortest distances are computed with no negative cycles.",
    },
    {
      kind: "complex",
      inputDisplay: 'graph = {S-A:1, A-B:3, B-C:-2, C-A:-2}, start = "S"',
      outputDisplay: "Negative Cycle Detected",
      title: "Complex Edge Case",
      input: {
        startNode: "S",
        nodes: ["S", "A", "B", "C", "D"],
        edges: [
          { from: "S", to: "A", weight: 5 },
          { from: "A", to: "B", weight: 2 },
          { from: "B", to: "C", weight: -4 },
          { from: "C", to: "D", weight: 1 },
        ],
      },
      output: "Distances: S:0, A:5, B:7, C:3, D:4",
      explanation:
        "Relaxation propagates across 4 edges in sequence. The negative edge B->C (-4) lowers distances for both C and downstream node D.",
    },
    {
      kind: "negative",
      inputDisplay: 'graph = {S-A:5, B-C:3}, start = "S"',
      outputDisplay: "{S: 0, A: 5, B: ∞, C: ∞}",
      title: "Failing / Boundary Case",
      input: {
        startNode: "A",
        nodes: ["A", "B", "C"],
        edges: [
          { from: "A", to: "B", weight: 1 },
          { from: "B", to: "C", weight: -2 },
          { from: "C", to: "A", weight: -1 },
        ],
      },
      output: "Negative Cycle Detected: True",
      explanation:
        "Cycle A -> B -> C -> A has total weight 1 + (-2) + (-1) = -2. Detection returns the stable (None, True) sentinel instead of schedule-dependent finite distances.",
    },
  ],
  code: BELLMAN_FORD_CODE,
  timeComplexity: {
    best: "O(E)",
    average: "O(V * E)",
    worst: "O(V * E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Each of the |V|-1 passes relaxes all |E| edges, resulting in O(|V| · |E|) time. If no distances change in a pass, the algorithm terminates early in O(|E|) best-case time.",
    space: "The distance map stores |V| entries, requiring O(|V|) space.",
  },
  topicGuide: BELLMAN_FORD_TOPIC_GUIDE,
  trivia: BELLMAN_FORD_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 13",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 13,
      section: "13.1 Bellman–Ford algorithm",
    },
  ],
  defaultInput: DEFAULT_BELLMAN_FORD_INPUT,
  generateSteps: generateBellmanFordSteps,
};
