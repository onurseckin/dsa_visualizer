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
    1: "Entry point: takes vertex list and edge list, computing all-pairs shortest paths simultaneously.",
    2: "Sizes the 2D distance matrix based on vertex count n.",
    3: "Allocates the n x n matrix initialized to infinity.",
    4: "Maps node labels to 0-indexed matrix rows and columns.",
    5: "Blank line separating index mapping from base distance seeding.",
    6: "Sets diagonal self-distances dist[i][i] = 0.",
    7: "Diagonal elements set to 0 as base case.",
    8: "Blank line before seeding edge weights.",
    9: "Populates direct edge weights into the distance matrix.",
    10: "Writes direct edge weight into dist[u][v].",
    11: "Blank line before triple nested pivot loops.",
    12: "Outermost loop iterates intermediate pivot node k from 0 to n-1.",
    13: "Middle loop iterates source node i from 0 to n-1.",
    14: "Inner loop iterates destination node j from 0 to n-1.",
    15: "Guards against integer overflow by verifying both subpaths dist[i][k] and dist[k][j] are finite.",
    16: "Tests whether detour through pivot k is shorter than existing dist[i][j].",
    17: "Updates dist[i][j] in place with shorter detour cost.",
    18: "Blank line before returning resulting distance matrix.",
    19: "Returns the computed all-pairs shortest path matrix.",
  },
};

export const floydWarshall: AlgorithmDefinition<FloydWarshallInput> = {
  id: "floyd-warshall",
  title: "Floyd-Warshall All-Pairs Shortest Path",
  topicIds: ["graph_shortest_paths"],
  difficulty: "Medium",
  description:
    "<p>Given a weighted directed graph <code>G = (V, E)</code>, compute the shortest path distance between every ordered pair of vertices <code>(u, v)</code> using a 2D distance matrix.</p><h3>Problem Statement</h3><p>Compute an <code>N × N</code> matrix <code>dist</code> where <code>dist[i][j]</code> represents the minimum path cost from vertex <code>i</code> to vertex <code>j</code>, allowing negative edge weights but detecting negative cycles.</p><h3>Input Parameters</h3><ul><li><code>nodes</code>: List of vertex identifiers.</li><li><code>edges</code>: List of directed edges with numeric weights <code>(from, to, weight)</code>.</li></ul><h3>Output</h3><p>Returns an <code>N × N</code> 2D array of shortest distances between all vertex pairs.</p>",
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
      scenario: "standard",
      inputDisplay: 'nodes = ["1","2","3","4"], edges = [1->3:-2, 2->1:4, 2->3:3, 3->4:2, 4->2:-1]',
      outputDisplay: "4x4 Matrix: dist[1][4] = 0, dist[2][4] = 5, ...",
      title: "Standard All-Pairs Shortest Paths",
      input: DEFAULT_FLOYD_WARSHALL_INPUT,
      output: "Full 4x4 shortest path distance matrix computed",
      explanation:
        "Iterates pivots k=1..4. Pivot k=3 updates dist[1][4] = dist[1][3] + dist[3][4] = (-2) + 2 = 0.",
    },
    {
      kind: "complex",
      scenario: "boundary",
      inputDisplay: 'nodes = ["1","2","3"], edges = [1->2:5]',
      outputDisplay: "Matrix with disconnected pairs at ∞",
      title: "Boundary Sparse Graph",
      input: {
        nodes: ["1", "2", "3"],
        edges: [{ from: "1", to: "2", weight: 5 }],
      },
      output: "dist[1][2]=5, all other non-diagonal entries=∞",
      explanation:
        "Vertices without connecting paths remain at infinity throughout all pivot relaxation rounds.",
    },
    {
      kind: "negative",
      scenario: "adversarial",
      inputDisplay: 'nodes = ["1","2"], edges = [1->2:-3, 2->1:-2]',
      outputDisplay: "Negative Cycle Detected (dist[1][1] < 0)",
      title: "Adversarial Negative Cycle",
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

export default floydWarshall;
