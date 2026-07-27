import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface EdmondsKarpMaxFlowInput {
  sourceId?: string;
  sinkId?: string;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const EDMONDS_KARP_CODE = `from collections import deque

def edmonds_karp(capacity, source, sink):
    n = len(capacity)
    flow = [[0] * n for _ in range(n)]
    max_flow = 0
    
    while True:
        parent = [-1] * n
        queue = deque([source])
        while queue:
            u = queue.popleft()
            if u == sink:
                break
            for v in range(n):
                if parent[v] == -1 and capacity[u][v] - flow[u][v] > 0:
                    parent[v] = u
                    queue.append(v)
                    
        if parent[sink] == -1:
            break
            
        push = float('inf')
        v = sink
        while v != source:
            u = parent[v]
            push = min(push, capacity[u][v] - flow[u][v])
            v = u
            
        v = sink
        while v != source:
            u = parent[v]
            flow[u][v] += push
            flow[v][u] -= push
            v = u
            
        max_flow += push
        
    return max_flow`;

export const EDMONDS_KARP_TRIVIA: TriviaMeta = {
  skipLines: [1, 2],
  distractors: [
    "queue.pop()",
    "flow[p][curr] -= bottleneck",
    "max_flow = max(max_flow, bottleneck)",
    "if capacity[curr][nxt] > 0:",
  ],
  hints: [
    {
      line: 10,
      hint: "Edmonds-Karp uses BFS (FIFO queue) to find augmenting paths with the fewest edges.",
    },
    {
      line: 14,
      hint: "Residual capacity is defined as capacity[u][v] - flow[u][v].",
    },
    {
      line: 23,
      hint: "Find bottleneck flow as the minimum residual capacity along the augmenting path.",
    },
    {
      line: 29,
      hint: "Add bottleneck flow to forward edges and subtract from reverse residual edges.",
    },
  ],
  lineExplanations: {
    1: "Imports deque for BFS augmenting path search.",
    3: "Defines Edmonds-Karp Max Flow algorithm taking capacity matrix, source, and sink.",
    5: "Initializes flow matrix flow[u][v] = 0.",
    10: "Runs BFS to discover shortest augmenting path from source to sink in residual network.",
    14: "Filters for edges with strictly positive residual capacity capacity[u][v] - flow[u][v] > 0.",
    17: "Terminates when sink is unreachable from source in residual graph (parent[sink] == -1).",
    23: "Calculates bottleneck flow constraint as minimum residual capacity along path.",
    29: "Augments forward flow flow[u][v] += push and updates reverse residual edge flow[v][u] -= push.",
    33: "Accumulates bottleneck flow into max_flow.",
  },
};

export const DEFAULT_EDMONDS_KARP_INPUT: EdmondsKarpMaxFlowInput = {
  sourceId: "S",
  sinkId: "T",
  nodes: [
    { id: "S", label: "S", x: 100, y: 150, state: "default" },
    { id: "A", label: "A", x: 250, y: 80, state: "default" },
    { id: "B", label: "B", x: 250, y: 220, state: "default" },
    { id: "T", label: "T", x: 400, y: 150, state: "default" },
  ],
  edges: [
    { from: "S", to: "A", weight: 10 },
    { from: "S", to: "B", weight: 10 },
    { from: "A", to: "B", weight: 2 },
    { from: "A", to: "T", weight: 8 },
    { from: "B", to: "T", weight: 10 },
  ],
};

export function generateEdmondsKarpSteps(input: EdmondsKarpMaxFlowInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const nodes = input.nodes.map((n) => ({ ...n }));
  const edges = input.edges.map((e) => ({ ...e }));
  const source = input.sourceId || nodes[0]?.id || "S";
  const sink = input.sinkId || nodes[nodes.length - 1]?.id || "T";

  const nodeIds = nodes.map((n) => n.id);
  const capacity: Record<string, Record<string, number>> = {};
  const flow: Record<string, Record<string, number>> = {};

  for (const u of nodeIds) {
    capacity[u] = {};
    flow[u] = {};
    for (const v of nodeIds) {
      capacity[u][v] = 0;
      flow[u][v] = 0;
    }
  }

  for (const e of edges) {
    const cap = e.weight ?? 1;
    capacity[e.from][e.to] = (capacity[e.from][e.to] || 0) + cap;
  }

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Initialized Edmonds-Karp Max Flow algorithm (Source: "${source}", Sink: "${sink}").`,
      why: "Edmonds-Karp uses BFS to repeatedly find the shortest augmenting path in the residual network.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      customState: { "Max Flow": 0, Source: source, Sink: sink },
    },
    variables: { totalNodes: nodes.length, totalEdges: edges.length },
  });

  let maxFlow = 0;
  let iteration = 0;

  while (iteration < 20) {
    iteration++;

    // BFS for augmenting path
    const parent: Record<string, string | null> = {};
    for (const u of nodeIds) parent[u] = null;

    const queue: string[] = [source];

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 10,
      explanation: {
        what: `Iteration ${iteration}: Running BFS from source "${source}" to find shortest augmenting path.`,
        why: "BFS explores layer-by-layer in residual graph where capacity[u][v] - flow[u][v] > 0.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === source ? "active" : n.id === sink ? "pivot" : "default",
        })),
        edges: edges.map((e) => ({
          ...e,
          weight: capacity[e.from][e.to],
        })),
      },
      auxiliaryState: {
        queue: [...queue],
        customState: { "Current Max Flow": maxFlow },
      },
      variables: { iteration, currentMaxFlow: maxFlow },
    });

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === sink) break;

      for (const nxt of nodeIds) {
        if (parent[nxt] === null && nxt !== source && capacity[curr][nxt] - flow[curr][nxt] > 0) {
          parent[nxt] = curr;
          queue.push(nxt);
        }
      }
    }

    if (parent[sink] === null) {
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 21,
        explanation: {
          what: `No more augmenting paths from "${source}" to "${sink}" in residual graph.`,
          why: "Edmonds-Karp algorithm terminates (Max Flow Min Cut theorem achieved).",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({ ...n, state: "sorted" })),
          edges: edges.map((e) => ({
            ...e,
            isTraversed: flow[e.from][e.to] > 0,
          })),
        },
        auxiliaryState: {
          customState: { "FINAL MAX FLOW": maxFlow },
        },
        variables: { maxFlow },
      });
      break;
    }

    // Compute bottleneck capacity
    let bottleneck = Number.POSITIVE_INFINITY;
    let curr = sink;
    const pathNodes: string[] = [];

    while (curr !== source) {
      pathNodes.push(curr);
      const p = parent[curr]!;
      bottleneck = Math.min(bottleneck, capacity[p][curr] - flow[p][curr]);
      curr = p;
    }
    pathNodes.push(source);
    pathNodes.reverse();

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 23,
      explanation: {
        what: `Found augmenting path: ${pathNodes.join(" -> ")} with Bottleneck Capacity = ${bottleneck}.`,
        why: "Bottleneck is the minimum residual edge capacity along the path.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          state: pathNodes.includes(n.id) ? "swap" : "default",
        })),
        edges: edges.map((e) => {
          let isOnPath = false;
          for (let i = 0; i < pathNodes.length - 1; i++) {
            if (e.from === pathNodes[i] && e.to === pathNodes[i + 1]) isOnPath = true;
          }
          return { ...e, isPath: isOnPath };
        }),
      },
      auxiliaryState: {
        customState: {
          "Augmenting Path": pathNodes.join(" -> "),
          Bottleneck: bottleneck,
        },
      },
      variables: { bottleneck, path: pathNodes.join(" -> ") },
    });

    // Augment flow
    curr = sink;
    while (curr !== source) {
      const p = parent[curr]!;
      flow[p][curr] += bottleneck;
      flow[curr][p] -= bottleneck;
      curr = p;
    }

    maxFlow += bottleneck;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 37,
      explanation: {
        what: `Augmented flow by +${bottleneck}. New Max Flow = ${maxFlow}.`,
        why: "Flow updated along path edges and reverse residual edges adjusted.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({ ...n, state: "visited" })),
        edges: edges.map((e) => ({
          ...e,
          isTraversed: flow[e.from][e.to] > 0,
        })),
      },
      auxiliaryState: {
        customState: {
          "Current Max Flow": maxFlow,
          Flows: Object.entries(flow)
            .flatMap(([u, row]) =>
              Object.entries(row)
                .filter(([_, val]) => val > 0)
                .map(([v, val]) => `${u}->${v}:${val}/${capacity[u][v]}`),
            )
            .join(", "),
        },
      },
      variables: { maxFlow, addedFlow: bottleneck },
    });
  }

  return steps;
}

export const edmondsKarpMaxFlow: AlgorithmDefinition<EdmondsKarpMaxFlowInput> = {
  id: "edmonds-karp-max-flow",
  title: "Edmonds-Karp Max Flow",
  category: "graph_flows_and_cuts",
  categories: ["graph_flows_and_cuts"],
  difficulty: "Hard",
  description:
    "Edmonds-Karp computes the Maximum Flow in a flow network in O(V * E^2) time by implementing Ford-Fulkerson using Breadth-First Search (BFS) to find shortest augmenting paths in the residual graph.\n\nGiven a flow network represented by nodes and directed edges with non-negative capacity bounds, Edmonds-Karp repeatedly locates the shortest augmenting path (measured by the number of edges) from the source vertex to the sink vertex in the residual network.\n\n### Input Parameters\n- sourceId (string): The identifier of the flow source vertex S.\n- sinkId (string): The identifier of the flow sink vertex T.\n- nodes (list[GraphNodeItem]): Vertices comprising the network.\n- edges (list[GraphEdgeItem]): Directed edges with positive capacity weights.\n\n### Output\n- number: The maximum total flow pushed from source to sink.\n\n### Edge Cases & Constraints\n- Capacities must be non-negative (capacity[u][v] >= 0).\n- Reverse residual edges handle flow redirection when augmentations push back previously routed flow.\n- Disconnected sink returns 0 max flow.\n- Guaranteed polynomial termination in O(V * E^2) time regardless of capacity integrality.",
  constraints: ["2 <= V <= 200", "1 <= E <= 1000", "Capacities must be non-negative numbers"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nodes = [S, A, B, T], capacities specified",
      outputDisplay: "Max Flow = 19",
      title: "4-Node Flow Network",
      input: DEFAULT_EDMONDS_KARP_INPUT,
      output: "Max Flow = 19",
      explanation: "Flow paths S->A->T (8), S->A->B->T (2), S->B->T (9) yield max flow 19.",
    },
    {
      kind: "complex",
      inputDisplay: "nodes = [S, A, B, C, D, T], 6-node network",
      outputDisplay: "Max Flow = 23",
      title: "Complex 6-Node Flow Network",
      input: {
        sourceId: "S",
        sinkId: "T",
        nodes: [
          { id: "S", label: "S", x: 100, y: 150, state: "default" },
          { id: "A", label: "A", x: 230, y: 80, state: "default" },
          { id: "B", label: "B", x: 230, y: 220, state: "default" },
          { id: "C", label: "C", x: 360, y: 80, state: "default" },
          { id: "D", label: "D", x: 360, y: 220, state: "default" },
          { id: "T", label: "T", x: 490, y: 150, state: "default" },
        ],
        edges: [
          { from: "S", to: "A", weight: 16 },
          { from: "S", to: "B", weight: 13 },
          { from: "A", to: "B", weight: 4 },
          { from: "A", to: "C", weight: 12 },
          { from: "B", to: "A", weight: 10 },
          { from: "B", to: "D", weight: 14 },
          { from: "C", to: "B", weight: 9 },
          { from: "C", to: "T", weight: 20 },
          { from: "D", to: "C", weight: 7 },
          { from: "D", to: "T", weight: 4 },
        ],
      },
      output: "Max Flow = 23",
      explanation: "Classic 6-node flow network bottleneck computation.",
    },
    {
      kind: "negative",
      inputDisplay: "nodes = [S, A, B, T], disconnected sink",
      outputDisplay: "Max Flow = 0",
      title: "Disconnected Sink (Zero Max Flow)",
      input: {
        sourceId: "S",
        sinkId: "T",
        nodes: [
          { id: "S", label: "S", x: 100, y: 150, state: "default" },
          { id: "A", label: "A", x: 220, y: 150, state: "default" },
          { id: "B", label: "B", x: 340, y: 150, state: "default" },
          { id: "T", label: "T", x: 460, y: 150, state: "default" },
        ],
        edges: [
          { from: "S", to: "A", weight: 10 },
          { from: "B", to: "T", weight: 10 },
        ],
      },
      output: "Max Flow = 0",
      explanation: "No directed path connects source S to sink T, so max flow is 0.",
    },
  ],
  code: EDMONDS_KARP_CODE,
  timeComplexity: {
    best: "O(V * E^2)",
    average: "O(V * E^2)",
    worst: "O(V * E^2)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Using BFS guarantees that each shortest path augmentation increases the distance to at least one edge's bottleneck. There are at most $\\mathcal{O}(V \\cdot E)$ total augmentations, each taking $\\mathcal{O}(E)$ time for BFS, yielding $\\mathcal{O}(V \\cdot E^2)$ total runtime.",
    space: "Capacity/flow matrices and BFS queues consume $\\mathcal{O}(V^2)$ or $\\mathcal{O}(V + E)$ space.",
  },
  topicGuide: {
    overview:
      "**Edmonds-Karp** is a canonical implementation of the Ford-Fulkerson method for computing maximum network flow. By using **Breadth-First Search (BFS)** to select augmenting paths with the minimum edge count, it guarantees a polynomial time bound of $\\mathcal{O}(V \\cdot E^2)$ and avoids infinite loops on irrational edge capacities.",
    sections: [
      {
        heading: "BFS Shortest Path Guarantee & Termination",
        body: "Standard Ford-Fulkerson using Depth-First Search can take exponentially many steps or fail to terminate on irrational edge capacities. Edmonds-Karp resolves this by using BFS to find augmenting paths with the minimum number of edges. Each augmentation guarantees that the shortest-path distance $\\delta_f(s, v)$ from source to any node never decreases, limiting the total number of augmentations to at most $\\mathcal{O}(V \\cdot E)$.",
      },
      {
        heading: "Residual Network & Flow Redirection",
        body: "Flow augmentation creates a residual graph $G_f$ containing forward edges with remaining capacity $c_f(u, v) = c(u, v) - f(u, v)$ and backward edges $c_f(v, u) = f(u, v)$. Reverse edges allow the algorithm to effectively undo or re-route prior flow decisions when a superior combination of paths is discovered.",
      },
      {
        heading: "Max-Flow Min-Cut Theorem",
        body: "The Max-Flow Min-Cut theorem asserts that the value of the maximum $s$-$t$ flow equals the total capacity of the minimum $s$-$t$ cut partitioning vertices into source set $S$ and sink set $T$:\n$$|f^*| = \\min_{S, T} c(S, T) = \\sum_{u \\in S, v \\in T} c(u, v)$$\nWhen no augmenting path remains in $G_f$, the set of vertices reachable from $s$ defines the exact minimum capacity cut.",
      },
      {
        heading: "Real-World Applications & Network Optimization",
        body: "Max flow algorithms solve transportation logistics, internet traffic routing, bipartite matching, image segmentation (graph cuts in computer vision), airline flight scheduling, and maximum bipartite matching problems.",
      },
      {
        heading: "Complexity Analysis",
        body: "$$\\text{Time Complexity}: \\mathcal{O}(V \\cdot E^2)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **BFS Pass**: Each BFS takes $\\mathcal{O}(E)$ time.\n- **Augmentations**: Number of augmenting paths is bounded by $\\mathcal{O}(V \\cdot E)$. Total runtime is $\\mathcal{O}(V \\cdot E^2)$.",
      },
    ],
    keyTerms: [
      {
        term: "Edmonds-Karp Algorithm",
        definition:
          "A specific specialization of Ford-Fulkerson that uses BFS to find augmenting paths with the fewest edges.",
      },
      {
        term: "Residual Capacity",
        definition:
          "The unallocated edge capacity $c_f(u, v) = c(u, v) - f(u, v)$ available for additional flow.",
      },
      {
        term: "Augmenting Path",
        definition:
          "A simple directed path from source to sink in the residual network with positive bottleneck capacity.",
      },
      {
        term: "Bottleneck Capacity",
        definition:
          "The minimum residual capacity $\\gamma$ along an augmenting path, which limits the maximum flow addition for that path.",
      },
      {
        term: "Max-Flow Min-Cut Theorem",
        definition:
          "Fundamental theorem stating that maximum $s$-$t$ network flow equals the minimum total capacity of edges separating $s$ from $t$.",
      },
    ],
  },
  trivia: EDMONDS_KARP_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 20",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 20,
      section: "20.1 Ford-Fulkerson & Edmonds-Karp algorithm",
    },
  ],
  defaultInput: DEFAULT_EDMONDS_KARP_INPUT,
  generateSteps: generateEdmondsKarpSteps,
};
