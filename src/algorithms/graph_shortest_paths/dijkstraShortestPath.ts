import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DijkstraInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
  startNode: string;
}

export const DIJKSTRA_CODE = `import heapq

def dijkstra(graph, start_node):
    dist = {node: float('inf') for node in graph}
    dist[start_node] = 0
    pq = [(0, start_node)]
    visited = set()
    
    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        
        for neighbor, weight in graph[u]:
            new_dist = d + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(pq, (new_dist, neighbor))
                
    return dist`;

export const DEFAULT_DIJKSTRA_INPUT: DijkstraInput = {
  nodes: ["A", "B", "C", "D", "E"],
  edges: [
    { from: "A", to: "B", weight: 4 },
    { from: "A", to: "C", weight: 2 },
    { from: "B", to: "C", weight: 1 },
    { from: "B", to: "D", weight: 5 },
    { from: "C", to: "D", weight: 8 },
    { from: "C", to: "E", weight: 10 },
    { from: "D", to: "E", weight: 2 },
  ],
  startNode: "A",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Single-Source Shortest Path (SSSP) on a weighted graph asks for the minimum total edge weight path from a designated start node to every other reachable node.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "active" },
        { id: "B", label: "B (∞)", state: "default" },
        { id: "C", label: "C (∞)", state: "default" },
        { id: "D", label: "D (∞)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4 },
        { from: "A", to: "C", weight: 2 },
        { from: "B", to: "D", weight: 5 },
        { from: "C", to: "D", weight: 8 },
      ],
    },
  },
  {
    narrative:
      "In unweighted graphs, Breadth-First Search (BFS) finds shortest paths by counting hops, but when edges carry unequal non-negative weights, a path with fewer hops can have a much larger total cost than a multi-hop path.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "default" },
        { id: "C", label: "C (2)", state: "active" },
        { id: "D", label: "D (∞)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, state: "default" },
        { from: "A", to: "C", weight: 2, state: "candidate" },
        { from: "B", to: "D", weight: 5 },
        { from: "C", to: "D", weight: 8 },
      ],
    },
  },
  {
    narrative:
      "Dijkstra's algorithm solves this by maintaining tentative distances for all vertices, initially setting the start node's distance to 0 and all other vertices to infinity.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "active" },
        { id: "C", label: "C (2)", state: "visited" },
        { id: "D", label: "D (10)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, state: "candidate" },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5 },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "A min-priority queue (min-heap) stores unfinalized (distance, node) pairs so that the algorithm can instantly extract the unvisited node with the smallest known tentative distance.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "visited" },
        { id: "C", label: "C (2)", state: "visited" },
        { id: "D", label: "D (9)", state: "compare" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, isTraversed: true },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5, state: "candidate" },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "The greedy choice property guarantees that because all edge weights are non-negative, once the smallest tentative distance node is popped from the min-heap, its shortest distance is permanently finalized and can never be improved further.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "visited" },
        { id: "C", label: "C (2)", state: "visited" },
        { id: "D", label: "D (9)", state: "active" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, isTraversed: true },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5, isTraversed: true },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "When a node u is finalized, the algorithm relaxes all outgoing edges (u, v, weight). If dist[u] + weight < dist[v], tentative distance dist[v] is updated to the smaller value and pushed into the heap.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "visited" },
        { id: "C", label: "C (2)", state: "visited" },
        { id: "D", label: "D (9)", state: "swap" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, isTraversed: true },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5, isTraversed: true },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "With a binary min-heap, each edge relaxation takes O(log V) time and popping a minimum vertex takes O(log V) time, yielding total runtime of O((V + E) log V).",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "visited" },
        { id: "C", label: "C (2)", state: "visited" },
        { id: "D", label: "D (9)", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, isTraversed: true },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5, isTraversed: true },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "If negative-weight edges exist, Dijkstra's greedy assumption breaks down because a future negative edge could reduce a previously finalized distance; Bellman-Ford must be used instead.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "compare" },
        { id: "C", label: "C (2)", state: "visited" },
        { id: "D", label: "D (9)", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, state: "candidate" },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5, isTraversed: true },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Unreachable vertices remain at distance infinity throughout execution, correctly identifying disconnected components in directed or undirected graphs.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "visited" },
        { id: "B", label: "B (4)", state: "visited" },
        { id: "C", label: "C (2)", state: "visited" },
        { id: "D", label: "D (9)", state: "sorted" },
        { id: "E", label: "E (∞)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, isTraversed: true },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5, isTraversed: true },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Upon queue exhaustion, the distance map contains optimal shortest path costs from the source vertex to all reachable nodes in the graph.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (0)", state: "sorted" },
        { id: "B", label: "B (4)", state: "sorted" },
        { id: "C", label: "C (2)", state: "sorted" },
        { id: "D", label: "D (9)", state: "sorted" },
        { id: "E", label: "E (∞)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, isTraversed: true },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "B", to: "D", weight: 5, isTraversed: true },
        { from: "C", to: "D", weight: 8, isTraversed: true },
      ],
    },
  },
];

export const generateDijkstraSteps = (input: DijkstraInput): AlgorithmStep[] => {
  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : ["A", "B", "C", "D", "E"];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];
  const startNode = typeof input?.startNode === "string" ? input.startNode : (rawNodes[0] ?? "A");

  const steps: AlgorithmStep[] = [];
  let globalStepIndex = 0;

  const isDefaultInput =
    rawNodes.length === 5 &&
    rawNodes.every((val, idx) => val === DEFAULT_DIJKSTRA_INPUT.nodes[idx]) &&
    startNode === DEFAULT_DIJKSTRA_INPUT.startNode;

  if (isDefaultInput) {
    const intros = createIntroSnapshots();
    intros.forEach((intro) => {
      steps.push(
        createTutorialStep({
          stepIndex: globalStepIndex++,
          phase: "intro",
          narrative: intro.narrative,
          primarySnapshot: intro.primarySnapshot,
        }),
      );
    });
  }

  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  dist[startNode] = 0;

  const visited = new Set<string>();
  const pq: [number, string][] = [[0, startNode]];

  const getGraphNodes = (
    activeId?: string,
    overrideState?: "active" | "compare" | "visited" | "sorted" | "default",
  ): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === Infinity ? "∞" : dist[id]})`,
      state:
        id === activeId ? (overrideState ?? "active") : visited.has(id) ? "visited" : "default",
    }));

  const getGraphEdges = (activeEdge?: { from: string; to: string }): GraphEdgeItem[] =>
    rawEdges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight,
      isTraversed:
        activeEdge?.from === e.from && activeEdge?.to === e.to
          ? true
          : visited.has(e.from) && visited.has(e.to),
    }));

  steps.push(
    createTutorialStep({
      stepIndex: globalStepIndex++,
      phase: "walkthrough",
      narrative: `Initialize distance table with dist['${startNode}'] = 0 and all other nodes to ∞. Seed priority queue with start node ('${startNode}', 0).`,
      primarySnapshot: {
        kind: "graph",
        nodes: getGraphNodes(startNode, "active"),
        edges: getGraphEdges(),
      },
    }),
  );

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;

    if (visited.has(u)) {
      steps.push(
        createTutorialStep({
          stepIndex: globalStepIndex++,
          phase: "walkthrough",
          narrative: `Pop candidate ('${u}', dist ${d}) from min-heap, but '${u}' is already finalized in the visited set. Skip stale heap entry.`,
          primarySnapshot: {
            kind: "graph",
            nodes: getGraphNodes(u, "compare"),
            edges: getGraphEdges(),
          },
        }),
      );
      continue;
    }

    visited.add(u);

    steps.push(
      createTutorialStep({
        stepIndex: globalStepIndex++,
        phase: "walkthrough",
        narrative: `Extract node '${u}' with minimum tentative distance ${d} from min-heap. Lock in dist['${u}'] = ${d} as finalized shortest distance.`,
        primarySnapshot: {
          kind: "graph",
          nodes: getGraphNodes(u, "visited"),
          edges: getGraphEdges(),
        },
      }),
    );

    const outgoingEdges = rawEdges.filter((e) => e.from === u || e.to === u);
    for (const edge of outgoingEdges) {
      const neighbor = edge.from === u ? edge.to : edge.from;
      if (visited.has(neighbor)) continue;

      const newDist = d + edge.weight;
      if (newDist < dist[neighbor]) {
        const oldDistStr = dist[neighbor] === Infinity ? "∞" : dist[neighbor].toString();
        dist[neighbor] = newDist;
        pq.push([newDist, neighbor]);

        steps.push(
          createTutorialStep({
            stepIndex: globalStepIndex++,
            phase: "walkthrough",
            narrative: `Relax edge (${u} → ${neighbor}, weight ${edge.weight}): new distance ${d} + ${edge.weight} = ${newDist} improves prior distance ${oldDistStr}. Update dist['${neighbor}'] = ${newDist} and push (${newDist}, '${neighbor}') to min-heap.`,
            primarySnapshot: {
              kind: "graph",
              nodes: getGraphNodes(neighbor, "compare"),
              edges: getGraphEdges({ from: u, to: neighbor }),
            },
          }),
        );
      }
    }
  }

  const finalSummary = rawNodes
    .map((n) => `${n}: ${dist[n] === Infinity ? "∞" : dist[n]}`)
    .join(", ");

  steps.push(
    createTutorialStep({
      stepIndex: globalStepIndex++,
      phase: "walkthrough",
      narrative: `Priority queue is empty. Single-Source Shortest Path algorithm completes. Finalized shortest distances from '${startNode}': [${finalSummary}].`,
      primarySnapshot: {
        kind: "graph",
        nodes: rawNodes.map((id) => ({
          id,
          label: `${id} (${dist[id] === Infinity ? "∞" : dist[id]})`,
          state: dist[id] === Infinity ? "default" : "sorted",
        })),
        edges: getGraphEdges(),
      },
    }),
  );

  return steps;
};

const DIJKSTRA_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Dijkstra's algorithm computes the Single-Source Shortest Path (SSSP) from a source vertex to all other vertices in a directed or undirected graph with non-negative edge weights. Using a min-priority queue, it greedily extracts the unvisited vertex with the smallest tentative distance and relaxes its incident edges in <em>O((V + E) log V)</em> time.</p>",
  sections: [
    {
      heading: "Greedy Choice & Edge Relaxation",
      body: "<p>Dijkstra's algorithm relies on non-negative edge weights: once the node with the smallest tentative distance is popped from the min-heap, no future detour can yield a shorter path. Edge relaxation compares <code>dist[u] + weight</code> against <code>dist[v]</code> and updates tentative bounds dynamically.</p>",
    },
    {
      heading: "Why Negative Edges Break Dijkstra",
      body: "<p>If an edge carries a negative weight, a longer multi-edge path could reduce distance after a node is finalized. Because Dijkstra never re-visits finalized nodes, negative edges require the Bellman-Ford algorithm instead.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Single-Source Shortest Path (SSSP)",
      definition:
        "Finding shortest paths from a single starting node to all other reachable nodes in a graph.",
    },
    {
      term: "Edge Relaxation",
      definition:
        "Testing whether routing a path through node u improves the tentative shortest distance to node v.",
    },
  ],
};

const DIJKSTRA_TRIVIA: TriviaMeta = {
  skipLines: [1, 2],
  distractors: [
    "pq = [(start_node, 0)]",
    "if new_dist > dist[neighbor]:",
    "dist[neighbor] = weight",
    "visited.remove(u)",
  ],
  hints: [
    {
      line: 4,
      hint: "Initialize distance to start_node as 0, and all other nodes to infinity.",
    },
    {
      line: 9,
      hint: "Extract the node with the minimum tentative distance from the priority queue.",
    },
  ],
  lineExplanations: {
    1: "Imports Python heapq module for min-priority queue operations.",
    3: "Defines dijkstra(graph, start_node) function.",
    4: "Initializes distance table mapping all graph nodes to infinity.",
    5: "Sets start_node distance to 0.",
    6: "Initializes priority queue min-heap with tuple (0, start_node).",
    7: "Initializes visited set to track finalized vertices.",
    9: "Main loop runs while priority queue contains unvisited candidates.",
    10: "Pops (d, u) pair with minimum tentative distance from min-heap.",
    11: "Skips stale queue entries if u is already in visited set.",
    13: "Adds u to visited set, locking in its final shortest distance.",
    15: "Iterates over neighbors and edge weights of node u.",
    16: "Calculates new candidate distance through node u.",
    17: "Checks if routing through u yields a strictly shorter path to neighbor.",
    18: "Updates dist[neighbor] with the shorter distance.",
    19: "Pushes updated (new_dist, neighbor) onto min-heap.",
    21: "Returns distance dictionary containing SSSP values.",
  },
};

export const dijkstraShortestPath: AlgorithmDefinition<DijkstraInput> = {
  id: "dijkstra-shortest-path",
  title: "Dijkstra's Shortest Path Algorithm",
  topicIds: ["graph_shortest_paths"],
  difficulty: "Medium",
  description: `<p>Given a weighted graph and a start vertex, find the shortest path distances from the start vertex to all reachable vertices in the graph.</p>
<h3>Problem Statement</h3>
<p>Given a directed or undirected graph <code>G = (V, E)</code> with non-negative edge weights and a specified starting node <code>startNode</code>, return the shortest distance from <code>startNode</code> to every other node in the graph. If a node is unreachable, its distance remains <code>&infin;</code>.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nodes</code>: List of string identifiers for graph vertices.</li>
  <li><code>edges</code>: List of edge objects containing <code>from</code>, <code>to</code>, and non-negative <code>weight</code>.</li>
  <li><code>startNode</code>: The ID of the starting vertex.</li>
</ul>
<h3>Output</h3>
<p>Returns a dictionary mapping each node ID to its minimum path distance from <code>startNode</code>.</p>
`,
  constraints: [
    "1 <= Vertices V <= 10^4",
    "0 <= Edges E <= 10^5",
    "0 <= Edge Weight <= 10^4 (non-negative edge weights required)",
    "Graph can be directed or undirected",
    "Source vertex must exist in the graph",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: 'graph = {A-B:4, A-C:2, B-C:1, B-D:5, C-D:8, C-E:10, D-E:2}, start = "A"',
      outputDisplay: "{A: 0, B: 4, C: 2, D: 9, E: 11}",
      title: "Standard 5-Node Graph",
      input: DEFAULT_DIJKSTRA_INPUT,
      output: "Distances: A:0, B:4, C:2, D:9, E:11",
      explanation:
        "Dijkstra pops C (dist 2) and B (dist 4) first, then relaxes edges to find optimal distances: D (9) and E (11).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: 'graph = {A-B:2, B-C:3, A-C:10, C-D:1}, start = "A"',
      outputDisplay: "{A: 0, B: 2, C: 5, D: 6}",
      title: "Adversarial Multi-Hop Path vs Direct Edge",
      input: {
        startNode: "A",
        nodes: ["A", "B", "C", "D"],
        edges: [
          { from: "A", to: "B", weight: 2 },
          { from: "B", to: "C", weight: 3 },
          { from: "A", to: "C", weight: 10 },
          { from: "C", to: "D", weight: 1 },
        ],
      },
      output: "Distances: A:0, B:2, C:5, D:6",
      explanation:
        "Direct edge A->C has weight 10, but multi-hop path A->B->C has total weight 5 (2+3). Dijkstra correctly picks the cheaper path.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 'graph = {A-B:5, C:isolated}, start = "A"',
      outputDisplay: "{A: 0, B: 5, C: ∞}",
      title: "Boundary Unreachable Component",
      input: {
        startNode: "A",
        nodes: ["A", "B", "C"],
        edges: [{ from: "A", to: "B", weight: 5 }],
      },
      output: "Distances: A:0, B:5, C:∞",
      explanation:
        "Node C is in an isolated component with no incoming edges. Its distance remains infinity (∞).",
    },
  ],
  code: DIJKSTRA_CODE,
  timeComplexity: {
    best: "O((V + E) log V)",
    average: "O((V + E) log V)",
    worst: "O((V + E) log V)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Extracting minimum distance nodes takes O(|V| log |V|) and edge relaxations take up to O(|E| log |V|) time, for a total time complexity of O((|V| + |E|) log |V|).",
    space:
      "The distance map, visited set, and min-heap priority queue store up to O(|V| + |E|) elements.",
  },
  topicGuide: DIJKSTRA_TOPIC_GUIDE,
  trivia: DIJKSTRA_TRIVIA,
  leetcode: {
    id: 743,
    url: "https://leetcode.com/problems/network-delay-time/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #743",
      leetcodeId: 743,
      url: "https://leetcode.com/problems/network-delay-time/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 13",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 13,
      section: "13.2 Dijkstra's algorithm",
    },
  ],
  defaultInput: DEFAULT_DIJKSTRA_INPUT,
  generateSteps: generateDijkstraSteps,
};

export default dijkstraShortestPath;
