import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { FLOYD_WARSHALL_CODE } from "./pythonCode";
import { generateFloydWarshallSteps } from "./stepGenerator";

export interface FloydWarshallInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
}

export const DEFAULT_FLOYD_WARSHALL_INPUT: FloydWarshallInput = {
  nodes: ["1", "2", "3", "4"],
  edges: [
    { from: "1", to: "3", weight: -2 },
    { from: "2", to: "1", weight: 4 },
    { from: "2", to: "3", weight: 3 },
    { from: "3", to: "4", weight: 2 },
    { from: "4", to: "2", weight: -1 },
  ],
};

const FLOYD_WARSHALL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Floyd-Warshall computes All-Pairs Shortest Paths (APSP) on a weighted graph using dynamic programming. Instead of running single-source algorithms from every vertex, it maintains a 2D distance matrix <code>D</code> and updates all cell values in place across <code>|V|</code> pivot stages.</p>",
  sections: [
    {
      heading: "One matrix, one question asked repeatedly",
      body: "<p>Initialize matrix cell <code>dist[i][j]</code> with direct edge weight, 0 on the main diagonal, and ∞ where no edge exists. At pivot stage <code>k</code>, consider whether routing through vertex <code>k</code> shortens the path from <code>i</code> to <code>j</code>.</p>",
    },
    {
      heading: "How the triple loop implements that",
      body: "<p>The outer loop iterates pivot <code>k</code> from 0 to <code>|V|-1</code>. Two inner loops iterate source <code>i</code> and target <code>j</code>, applying the relaxation check: <code>dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])</code>.</p>",
    },
    {
      heading: "Why the pivot ordering is correct",
      body: "<p>Any shortest path between <code>i</code> and <code>j</code> has a highest-indexed intermediate vertex. When pivot <code>k</code> reaches that index, both sub-paths <code>i → k</code> and <code>k → j</code> have already been computed, combining into the optimal overall path.</p>",
    },
    {
      heading: "Negative weights and negative cycles",
      body: "<p>Floyd-Warshall handles negative edge weights. If a diagonal entry <code>dist[i][i]</code> drops below 0 after execution, the graph contains a reachable negative-weight cycle.</p>",
    },
    {
      heading: "When to prefer it over running a single-source algorithm many times",
      body: "<p>Floyd-Warshall is optimal for small or dense graphs (<code>V ≤ 200</code>) due to its simple <code>O(V³)</code> structure with low constant overhead. For large sparse graphs, running Dijkstra from all sources is faster.</p>",
    },
    {
      heading: "The same loop, other problems",
      body: "<p>By replacing addition with logical AND and minimum with logical OR, the same triple-nested loop computes transitive closure (Warshall's algorithm).</p>",
    },
  ],
  keyTerms: [
    {
      term: "Pivot Vertex (k)",
      definition:
        "The intermediate vertex evaluated in the outer loop to check for shorter paths between all pairs (i, j).",
    },
    {
      term: "Distance Matrix",
      definition: "A 2D array storing shortest path distances between all ordered vertex pairs.",
    },
    {
      term: "In-place Update",
      definition:
        "Modifying the distance matrix directly without secondary arrays, valid because pivot row k and column k remain unchanged during stage k.",
    },
    {
      term: "Transitive Closure",
      definition:
        "A boolean matrix determining reachability between all pairs of vertices in a directed graph.",
    },
    {
      term: "All-Pairs Shortest Path (APSP)",
      definition:
        "The problem of finding shortest paths between every pair of vertices in a graph.",
    },
  ],
};

const FLOYD_WARSHALL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Entry point: takes every vertex and every direct edge weight, and will compute the shortest distance between all pairs at once.",
    2: "Caches the vertex count once, since it sizes the distance matrix and bounds every loop that follows.",
    3: "Builds the n by n table with every pair starting at infinity — unreachable until proven otherwise.",
    4: "Maps each node label to a matrix row and column index, since the table is addressed by position rather than by name.",
    5: "Blank line separating index dictionary creation from diagonal matrix initialization.",
    6: "Walks every vertex to seed its own diagonal entry.",
    7: "Every vertex reaches itself at zero cost — the base case the whole dynamic program builds on.",
    8: "Blank line separating diagonal self-distance initialization from direct edge weight population.",
    9: "Walks the raw edge list to fill in what is known directly, before any pivoting begins.",
    10: "Writes each direct edge weight straight into the matrix using the index mapping — the starting facts the algorithm goes on to improve.",
    11: "Blank line separating direct edge insertion from triple nested pivot loop.",
    12: "The pivot loop: each iteration allows one more vertex to be used as an intermediate stop on any path — this must be the outermost loop or the recurrence is simply wrong.",
    13: "For the current pivot, checks every possible source vertex.",
    14: "And every possible target vertex, so all n^2 pairs get re-examined against this pivot.",
    15: "Only considers routing through k if both halves of the detour (i to k, and k to j) are actually reachable, avoiding arithmetic on infinity.",
    16: "The core comparison: does detouring through pivot k beat the best route from i to j found so far?",
    17: "Overwrites the matrix in place with the cheaper route — safe because row k and column k cannot themselves improve during this same pivot round.",
    18: "Blank line separating inner relaxation loop from matrix return statement.",
    19: "Every vertex has had its turn as pivot, so the matrix now holds the true shortest distance between every ordered pair.",
  },
};

export const floydWarshall: AlgorithmDefinition<FloydWarshallInput> = {
  id: "floyd-warshall",
  title: "Floyd-Warshall All-Pairs Shortest Path",
  topicIds: ["graph_shortest_paths"],
  difficulty: "Medium",
  description:
    "<p>The <strong>Floyd-Warshall algorithm</strong> computes the shortest path between every pair of vertices in a weighted directed graph <code>G = (V, E)</code> using dynamic programming over a 2D distance matrix <code>D</code>. For each pivot vertex <code>k</code>, it relaxes every pair <code>(i, j)</code> using the recurrence:</p><p><code>dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])</code></p><p>It runs in <code>O(|V|³)</code> time and <code>O(|V|²)</code> space, supporting negative edge weights.</p>",
  constraints: [
    "1 <= Vertices V <= 200",
    "0 <= Edges E <= V * (V - 1)",
    "-10^4 <= Edge Weight <= 10^4",
    "Graph can be directed or undirected",
    "Can handle negative edge weights, provided no negative-weight cycles exist",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "matrix = [[0, 5, ∞, 10], [∞, 0, 3, ∞], [∞, ∞, 0, 1], [∞, ∞, ∞, 0]]",
      outputDisplay: "[[0, 5, 8, 9], [∞, 0, 3, 4], [∞, ∞, 0, 1], [∞, ∞, ∞, 0]]",
      title: "Basic Example",
      input: {
        nodes: ["1", "2", "3", "4"],
        edges: [
          { from: "1", to: "3", weight: -2 },
          { from: "2", to: "1", weight: 4 },
          { from: "2", to: "3", weight: 3 },
          { from: "3", to: "4", weight: 2 },
          { from: "4", to: "2", weight: -1 },
        ],
      },
      output: "Full 4x4 shortest path distance matrix",
      explanation:
        "Iterates pivots k=1..4. Pivot k=3 updates dist[1][4] = dist[1][3] + dist[3][4] = (-2) + 2 = 0.",
    },
    {
      kind: "complex",
      inputDisplay:
        "matrix = [[0, 3, 8, ∞, -4], [∞, 0, ∞, 1, 7], [∞, 4, 0, ∞, ∞], [2, ∞, -5, 0, ∞], [∞, ∞, ∞, 6, 0]]",
      outputDisplay:
        "[[0, 1, -3, 2, -4], [3, 0, -4, 1, -1], [7, 4, 0, 5, 3], [2, -1, -5, 0, -2], [8, 5, 1, 6, 0]]",
      title: "Complex Edge Case",
      input: {
        nodes: ["1", "2", "3", "4"],
        edges: [
          { from: "1", to: "2", weight: 3 },
          { from: "2", to: "3", weight: 2 },
          { from: "3", to: "4", weight: -4 },
          { from: "1", to: "4", weight: 10 },
        ],
      },
      output: "dist[1][4] = 1",
      explanation:
        "Direct edge 1->4 is 10, but routing through pivots 2 and 3 yields dist[1][4] = 3 + 2 - 4 = 1.",
    },
    {
      kind: "negative",
      inputDisplay: "matrix = [[0, -1], [-1, 0]]",
      outputDisplay: "Negative Cycle Detected",
      title: "Failing / Boundary Case",
      input: {
        nodes: ["1", "2"],
        edges: [
          { from: "1", to: "2", weight: -3 },
          { from: "2", to: "1", weight: -2 },
        ],
      },
      output: "Negative Cycle Detected: True",
      explanation:
        "Edges 1->2 (-3) and 2->1 (-2) form a negative cycle of total weight -5. Diagonal dist[1][1] drops below zero.",
    },
  ],
  code: FLOYD_WARSHALL_CODE,
  timeComplexity: {
    best: "O(V^3)",
    average: "O(V^3)",
    worst: "O(V^3)",
  },
  spaceComplexity: "O(V^2)",
  complexityAnalysis: {
    time: "Three nested loops sweep all |V| pivot vertices, |V| source vertices, and |V| target vertices, taking strictly O(|V|³) operations.",
    space: "The |V| × |V| distance matrix requires O(|V|²) memory.",
  },
  topicGuide: FLOYD_WARSHALL_TOPIC_GUIDE,
  trivia: FLOYD_WARSHALL_TRIVIA,
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
      section: "13.3 Floyd–Warshall algorithm",
    },
  ],
  defaultInput: DEFAULT_FLOYD_WARSHALL_INPUT,
  generateSteps: generateFloydWarshallSteps,
};
