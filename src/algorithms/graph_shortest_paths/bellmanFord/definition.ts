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
    "Bellman-Ford solves the same single-source shortest path problem as Dijkstra's algorithm, but it abandons the requirement that edge weights be non-negative. Rather than trusting a greedy order, it relaxes every edge in the graph over and over and lets improvements ripple outward one hop per sweep. That makes it the right tool whenever a cost can be negative — a rebate, a currency gain, energy recovered instead of spent — and it comes with a bonus no greedy method can offer: it can tell you when the question has no answer at all because a negative cycle exists. The trade you accept is doing far more redundant work in exchange for that robustness.",
  sections: [
    {
      heading: "Relax everything, then do it again",
      body: "The insight is that you do not need to know which edge to relax next if you are willing to relax all of them. After one full sweep over the edge list, every shortest path that uses a single edge is definitely correct; after two sweeps, every shortest path using at most two edges is correct, and so on. Since a shortest path never needs to repeat a vertex, it can span at most V - 1 edges, so V - 1 sweeps are enough to settle every distance in the graph. You are effectively doing dynamic programming where the stage is the number of edges a path is allowed to use, and the edge list is the transition table.",
    },
    {
      heading: "What one sweep actually does",
      body: "A sweep walks the edge list in whatever order it happens to be stored and, for each edge from u to v, asks whether the distance already known for u plus that edge's weight beats the distance recorded for v. When it does, you overwrite v's entry, and that improvement is immediately visible to later edges in the same sweep — which is why a lucky edge ordering can converge in one pass while an unlucky one needs all V - 1. You must guard the comparison by checking that u is reachable at all, because adding a weight to infinity is meaningless and, with negative weights, can even manufacture a finite distance to an unreachable vertex. A sweep that changes nothing proves the table has converged, so tracking that flag lets you stop early instead of grinding through the remaining passes.",
    },
    {
      heading: "Why V - 1 sweeps are exactly enough",
      body: "The invariant to hold in mind is that after k sweeps, the table holds the true cost of the best path to each vertex among all paths using no more than k edges. Proving the step is easy: an optimal path with k + 1 edges is an optimal path with k edges followed by one final edge, and that final edge is guaranteed to be relaxed during sweep k + 1. Because an optimal path in a graph with no negative cycle never revisits a vertex, it has at most V - 1 edges, so the invariant at k = V - 1 already covers every optimal path there is. This is also why the bound is tight rather than pessimistic — a long chain of vertices relaxed in exactly the wrong order really does need every sweep.",
    },
    {
      heading: "Negative cycles: detection, not repair",
      body: 'Run one extra sweep after the V - 1 are done. If any edge can still be relaxed, no simple path explanation is possible, so some negative-weight cycle must be reachable from the source, and that is precisely what the extra pass detects. When such a cycle exists, "shortest path" stops being well defined for the vertices it can reach, because looping the cycle once more always lowers the total, driving the cost toward negative infinity. Bellman-Ford does not repair this — it reports it, which in practice is often the whole point, as in arbitrage detection where the negative cycle is the profitable trade you were looking for. If you need to know which vertices are spoiled rather than just that something is wrong, you can propagate the "unbounded" mark forward from any still-relaxable edge.',
    },
    {
      heading: "Choosing it over the alternatives",
      body: "With strictly non-negative weights Dijkstra's algorithm is the better choice and you should default to it; Bellman-Ford earns its keep only when negativity or cycle detection is in play. If the graph happens to be acyclic, forget sweeps entirely and relax edges in topological order, which settles every distance in a single pass regardless of sign. For all-pairs questions on graphs with negative edges, Bellman-Ford becomes a subroutine rather than the answer: Johnson's algorithm runs it once from an artificial source to compute a reweighting that removes negative weights, then runs Dijkstra from every vertex. The queue-based refinement often called SPFA keeps only vertices whose distance changed, which is much faster on typical graphs but has no better worst case, so it is an optimization rather than a different algorithm.",
    },
    {
      heading: "Pitfalls and practical notes",
      body: "Do not confuse a negative edge with a negative cycle: negative edges alone are entirely fine here, and only a cycle whose total weight is negative breaks the problem. Remember that detection is scoped to cycles reachable from your source — a negative cycle sitting in a disconnected corner of the graph cannot affect any distance you compute, so it will not and should not be flagged. On undirected graphs a single negative edge is automatically a negative cycle, since you can walk back and forth across it, which is why negative weights are really a directed-graph topic. Finally, keep the early-exit check honest: stop when a sweep changes nothing, not when it changes little, or you will report distances that have not finished settling.",
    },
  ],
  keyTerms: [
    {
      term: "Edge relaxation",
      definition:
        "The single operation the whole algorithm is built from: if the distance to u plus the weight of edge u to v is smaller than the recorded distance to v, replace v's distance with the better value.",
    },
    {
      term: "Sweep (pass)",
      definition:
        "One complete traversal of the entire edge list, relaxing each edge once. Each sweep extends the set of correct answers by one more edge of path length.",
    },
    {
      term: "Negative-weight cycle",
      definition:
        "A directed cycle whose edge weights sum to less than zero. Any vertex reachable through one has no shortest distance, because every extra lap around the cycle makes the total cheaper.",
    },
    {
      term: "Reachability guard",
      definition:
        "The check that skips an edge whose source is still at infinity. It stops the algorithm from arithmetic on an unreachable distance, which negative weights would otherwise turn into a bogus finite answer.",
    },
    {
      term: "Early termination",
      definition:
        "Stopping as soon as a full sweep produces no update. The table cannot change again after such a sweep, so the remaining passes would be pure waste.",
    },
  ],
};

const BELLMAN_FORD_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Entry point: takes the vertex list, the raw (u, v, weight) edge list, and the source, and tolerates negative edge weights unlike Dijkstra.",
    2: "Every vertex starts at infinity — unknown — until some sequence of relaxations proves a finite distance to it.",
    3: "The one certain distance before any work begins: the source is zero away from itself.",
    5: "Runs one full sweep per possible path length, since after k sweeps every shortest path using at most k edges is already proven correct.",
    6: "Each sweep walks every single edge, because unlike Dijkstra there's no priority order to trust — every edge must be re-examined on every pass.",
    7: "Only relaxes through u if u is actually reachable, guarding against adding a weight to infinity, which negative weights could otherwise turn into a bogus finite number.",
    8: "Takes the cheaper route the instant this sweep discovers one — the update is visible to later edges in the same pass, which is why a lucky ordering can converge early.",
    10: "Starts the detection flag optimistic; only a genuinely still-relaxable edge will flip it.",
    11: "One more full pass over every edge, run only after the V - 1 sweeps that should already have settled every true shortest path.",
    12: "If any edge can still be relaxed after V - 1 passes, no ordinary simple path explains it — the only remaining explanation is a negative-weight cycle.",
    13: "Records that the graph is unsafe: some reachable cycle can be looped forever to drive a distance toward negative infinity.",
    14: "Stops immediately once one negative cycle is confirmed — a single one is enough to invalidate the shortest-path question for the vertices it touches.",
    16: "Hands back both the distance table and whether it can actually be trusted.",
  },
};

export const bellmanFord: AlgorithmDefinition<BellmanFordInput> = {
  id: "bellman-ford",
  title: "Bellman-Ford Shortest Path",
  category: "graph_shortest_paths",
  difficulty: "Medium",
  description:
    "Bellman-Ford computes shortest paths from one source vertex to every other vertex in a weighted graph — and unlike Dijkstra's algorithm, it tolerates negative edge weights. The idea is simple: relax every edge, and repeat that sweep V - 1 times so improvements can propagate along even the longest simple path. A final extra sweep doubles as a detector: if any edge can still be relaxed after V - 1 passes, the graph must contain a negative-weight cycle reachable from the source.",
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
      inputDisplay: "graph = {S-A:6, S-B:7, A-B:8, A-C:5, A-D:-4, B-C:-3, B-E:9, C-A:-2, D-C:7, D-S:2}, start = \"S\"",
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
      inputDisplay: "graph = {S-A:1, A-B:3, B-C:-2, C-A:-2}, start = \"S\"",
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
      inputDisplay: "graph = {S-A:5, B-C:3}, start = \"S\"",
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
        "Cycle A -> B -> C -> A has total weight 1 + (-2) + (-1) = -2. The 11th pass detects ongoing relaxation and flags a negative cycle.",
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
    time: "Each pass sweeps all E edges once, and we run up to V - 1 passes so that an improvement can travel across the longest possible simple path — that product gives the O(V * E) worst case. When the graph converges early, a pass with zero updates lets us stop, so the best case is a single O(E) sweep.",
    space:
      "We keep one distance value per vertex, so extra memory grows linearly with the vertex count — O(V). The edge list is just the input; nothing else accumulates.",
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
