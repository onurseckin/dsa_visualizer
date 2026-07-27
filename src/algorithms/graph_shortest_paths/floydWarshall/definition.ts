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
    "Floyd-Warshall answers the all-pairs shortest path question in one shot: for every ordered pair of vertices, what is the cheapest way to get from the first to the second? Instead of running a source-by-source search, it treats the whole answer as a matrix and improves that matrix in place through dynamic programming. It tolerates negative edge weights, needs no priority queue, and is short enough to write from memory, which makes it the standard choice for small dense graphs and for any situation where you will query many pairs. It also happens to be a template: the same triple loop solves reachability, bottleneck, and closure problems by swapping the operation inside.",
  sections: [
    {
      heading: "One matrix, one question asked repeatedly",
      body: "Start with a matrix whose entry for (i, j) is the weight of the direct edge from i to j, zero on the diagonal, and infinity where no edge exists. Now permit exactly one vertex — call it the pivot — to be used as an intermediate stop, and ask for every pair whether hopping through that pivot is cheaper than what you already have. Then permit two vertices as intermediates, then three, until every vertex has had its turn. The quantity you are computing at stage k is the shortest distance between each pair using only the first k vertices as intermediate stops, and once k reaches the total vertex count that restriction is no longer a restriction at all.",
    },
    {
      heading: "How the triple loop implements that",
      body: "The outer loop is the pivot k, and the two inner loops walk every source i and every target j, performing one comparison: if the distance from i to k plus the distance from k to j undercuts the distance from i to j, replace it. The ordering of those loops is not cosmetic — putting k anywhere but outermost computes something that is simply not the shortest-path recurrence, and it is the single most common way to get this algorithm wrong. Updating in place is nevertheless safe, because during pivot k the entries in row k and column k cannot change: improving them would require a path from k to itself with negative weight, which only happens if the graph has a negative cycle. That is why you need no second copy of the matrix even though every cell may be rewritten.",
    },
    {
      heading: "Why the pivot ordering is correct",
      body: "Look at any shortest path between two vertices and find the highest-numbered vertex it passes through in the middle. That path splits at that vertex into two shorter paths whose own intermediate vertices are all lower numbered, so both halves were already computed correctly at an earlier stage. When the pivot loop reaches that highest-numbered vertex, the comparison joins the two halves and records the full path. Every shortest path has such a highest intermediate vertex, so every shortest path is discovered at exactly the stage where its pivot comes up, and none is missed.",
    },
    {
      heading: "Negative weights and negative cycles",
      body: "Negative edges are perfectly welcome here, because nothing in the recurrence assumes that adding an edge makes a path worse. Negative cycles are a different matter: they make shortest paths undefined, and the algorithm exposes them cleanly, since a diagonal entry dropping below zero means some vertex reaches itself at a negative total cost. Once you see that, treat every distance whose path can touch the offending cycle as meaningless rather than merely inaccurate. If you need reliable answers on such a graph, you must first decide what question you are actually asking — for instance shortest simple path, which is a much harder problem, or shortest walk of bounded length.",
    },
    {
      heading: "When to prefer it over running a single-source algorithm many times",
      body: "Floyd-Warshall wins when the vertex count is modest and the graph is dense, because its cost depends only on the number of vertices and it has almost no constant-factor overhead — no heap, no adjacency traversal, just tight array arithmetic. On a large sparse graph, running Dijkstra from every vertex is dramatically faster, and when such a graph also has negative edges, Johnson's algorithm reweights it first so that repeated Dijkstra becomes legal. Also consider what you actually need: if you only ever query one source, computing the entire matrix is wasted effort, whereas if you will answer thousands of arbitrary pair queries, the matrix is exactly the lookup table you want. The other practical constraint is memory, since storing a cell per ordered pair grows quadratically and becomes the binding limit well before running time does.",
    },
    {
      heading: "The same loop, other problems",
      body: 'Replace addition with logical AND and the minimum with logical OR, and the identical triple loop computes the transitive closure of a graph, telling you which vertices can reach which — that variant is known as the Warshall algorithm. Replace the sum with "the larger of the two" and you get minimum-bottleneck paths, the route whose heaviest edge is as light as possible, which is what you want for maximum-capacity routing. To recover actual routes rather than costs, keep a parallel matrix recording the next hop for each pair and update it whenever you improve a distance, then follow those hops to walk the path out. Recognizing this family — a closed semiring with a combine operation and a select operation — is what lets you reuse the pattern on problems that have nothing to do with distance.',
    },
  ],
  keyTerms: [
    {
      term: "Pivot (intermediate vertex)",
      definition:
        "The vertex the outer loop is currently allowing paths to route through. Each pivot round asks, for every pair, whether stopping at that vertex on the way is cheaper than the route already known.",
    },
    {
      term: "Distance matrix",
      definition:
        "The table holding one cell per ordered pair of vertices, seeded with direct edge weights and refined in place until each cell holds a true shortest distance.",
    },
    {
      term: "In-place update",
      definition:
        "Overwriting the same matrix during a pivot round instead of writing into a fresh copy. It is safe because the row and column belonging to the pivot cannot change during that round.",
    },
    {
      term: "Transitive closure",
      definition:
        "The yes-or-no version of the same computation: for every pair, can the first vertex reach the second at all? You get it by swapping the arithmetic for boolean operations.",
    },
    {
      term: "Next-hop matrix",
      definition:
        "An optional companion table storing, for each pair, the first vertex to move to along the best route. Following those entries reconstructs the path itself rather than just its cost.",
    },
  ],
};

const FLOYD_WARSHALL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Entry point: takes every vertex and every direct edge weight, and will compute the shortest distance between all pairs at once.",
    2: "Caches the vertex count once, since it sizes the distance matrix and bounds every loop that follows.",
    3: "Builds the n by n table with every pair starting at infinity — unreachable until proven otherwise.",
    4: "Maps each node label to a matrix row and column index, since the table is addressed by position rather than by name.",
    6: "Walks every vertex to seed its own diagonal entry.",
    7: "Every vertex reaches itself at zero cost — the base case the whole dynamic program builds on.",
    9: "Walks the raw edge list to fill in what is known directly, before any pivoting begins.",
    10: "Writes each direct edge weight straight into the matrix using the index mapping — the starting facts the algorithm goes on to improve.",
    12: "The pivot loop: each iteration allows one more vertex to be used as an intermediate stop on any path — this must be the outermost loop or the recurrence is simply wrong.",
    13: "For the current pivot, checks every possible source vertex.",
    14: "And every possible target vertex, so all n^2 pairs get re-examined against this pivot.",
    15: "Only considers routing through k if both halves of the detour (i to k, and k to j) are actually reachable, avoiding arithmetic on infinity.",
    16: "The core comparison: does detouring through pivot k beat the best route from i to j found so far?",
    17: "Overwrites the matrix in place with the cheaper route — safe because row k and column k cannot themselves improve during this same pivot round.",
    19: "Every vertex has had its turn as pivot, so the matrix now holds the true shortest distance between every ordered pair.",
  },
};

export const floydWarshall: AlgorithmDefinition<FloydWarshallInput> = {
  id: "floyd-warshall",
  title: "Floyd-Warshall All-Pairs Shortest Path",
  category: "graph_shortest_paths",
  categories: ["graph_shortest_paths"],
  difficulty: "Medium",
  description:
    "Floyd-Warshall computes the shortest path between every pair of vertices in a weighted directed graph using dynamic programming over a distance matrix. It considers each vertex k in turn as a potential intermediate stop between every pair (i, j): whenever routing through k is cheaper (dist[i][k] + dist[k][j] < dist[i][j]), the matrix entry is updated. Once every vertex has had its turn as the pivot, the matrix holds the true shortest distance between every pair of vertices in the graph.",
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
    time: "The algorithm is three nested loops over the vertices: every pivot k, against every source i, against every target j, doing a constant-time comparison each time. That's V * V * V iterations no matter what the graph looks like, so the running time is O(V^3) in every case — the edge count never even enters the formula.",
    space:
      "The V x V distance matrix dominates memory: one cell for every ordered pair of vertices, updated in place, giving O(V^2).",
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
