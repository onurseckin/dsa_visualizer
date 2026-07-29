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
    1: "Entry point: takes the vertex list, raw edge list, and source vertex, handling negative weights unlike Dijkstra.",
    2: "Every vertex starts at infinity until relaxations prove a finite distance to it.",
    3: "The source node is initialized to distance 0 from itself.",
    4: "Blank line separating distance table initialization from outer iteration sweeps.",
    5: "Runs up to |V| - 1 passes, guaranteeing paths of up to |V| - 1 edges are correctly computed.",
    6: "Each pass scans every edge in the graph.",
    7: "Guards against relaxing from an unreachable vertex.",
    8: "Updates the distance to node v if a shorter path through u is found.",
    9: "Blank line separating main relaxation loop from negative cycle detection.",
    10: "Initializes negative cycle flag.",
    11: "Runs an extra pass to test if any distance can still be relaxed.",
    12: "If an edge can still be relaxed after |V| - 1 passes, a negative cycle exists.",
    13: "Sets negative cycle flag to true.",
    14: "Terminates cycle detection early upon finding the first negative cycle.",
    15: "Blank line before return statement.",
    16: "Checks whether a negative cycle was detected.",
    17: "Returns sentinel indicating undefined distances due to negative cycle.",
    18: "Returns the finalized distance map.",
  },
};

export const bellmanFord: AlgorithmDefinition<BellmanFordInput> = {
  id: "bellman-ford",
  title: "Bellman-Ford Shortest Path",
  topicIds: ["graph_shortest_paths"],
  difficulty: "Medium",
  description:
    "<p>Given a directed weighted graph <code>G = (V, E)</code> and a starting node, compute the shortest path distance from the starting node to every reachable vertex, or detect if the graph contains a reachable negative-weight cycle.</p><h3>Problem Statement</h3><p>Compute single-source shortest path distances for all vertices in a graph that may contain negative edge weights. If a negative-weight cycle is reachable from the start node, indicate that shortest path distances are undefined.</p><h3>Input Parameters</h3><ul><li><code>nodes</code>: List of node identifiers in the graph.</li><li><code>edges</code>: List of directed edges with numeric weights <code>(from, to, weight)</code>.</li><li><code>startNode</code>: The source vertex ID from which shortest path distances are calculated.</li></ul><h3>Output</h3><p>Returns a dictionary mapping each node to its shortest distance from <code>startNode</code>, or a sentinel indicating a negative cycle was detected.</p>",
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
      scenario: "standard",
      inputDisplay: 'graph = {S-A:4, S-B:2, B-A:1, A-C:3, B-C:5, B-D:4, C-D:-2}, start = "S"',
      outputDisplay: "{S: 0, A: 3, B: 2, C: 6, D: 4}",
      title: "Standard Directed Graph with Negative Weight",
      input: DEFAULT_BELLMAN_FORD_INPUT,
      output: "Distances: S:0, A:3, B:2, C:6, D:4",
      explanation:
        "Iterative edge relaxation handles the negative edge C->D (-2) gracefully, converging to shortest distances without negative cycles.",
    },
    {
      kind: "complex",
      scenario: "boundary",
      inputDisplay: 'graph = {S-A:5, B-C:3}, start = "S"',
      outputDisplay: "{S: 0, A: 5, B: ∞, C: ∞}",
      title: "Boundary Disconnected Graph",
      input: {
        startNode: "S",
        nodes: ["S", "A", "B", "C"],
        edges: [
          { from: "S", to: "A", weight: 5 },
          { from: "B", to: "C", weight: 3 },
        ],
      },
      output: "Distances: S:0, A:5, B:∞, C:∞",
      explanation:
        "Unreachable vertices B and C remain at distance ∞ throughout all relaxation passes.",
    },
    {
      kind: "negative",
      scenario: "adversarial",
      inputDisplay: 'graph = {A-B:1, B-C:-2, C-A:-1}, start = "A"',
      outputDisplay: "Negative Cycle Detected",
      title: "Adversarial Negative Cycle",
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
        "Cycle A -> B -> C -> A has total weight 1 + (-2) + (-1) = -2. The algorithm detects that distances can be infinitely reduced.",
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

export default bellmanFord;
