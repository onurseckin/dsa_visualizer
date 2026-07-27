import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface PrimEdge {
  from: number;
  to: number;
  weight: number;
}

export interface PrimMstInput {
  numNodes: number;
  edges: PrimEdge[];
}

export const DEFAULT_PRIM_MST_INPUT: PrimMstInput = {
  numNodes: 5,
  edges: [
    { from: 0, to: 1, weight: 2 },
    { from: 0, to: 3, weight: 6 },
    { from: 1, to: 2, weight: 3 },
    { from: 1, to: 3, weight: 8 },
    { from: 1, to: 4, weight: 5 },
    { from: 2, to: 4, weight: 7 },
    { from: 3, to: 4, weight: 9 },
  ],
};

export const PYTHON_PRIM_MST_CODE = `import heapq

def prim_mst(num_nodes: int, edges: list[tuple[int, int, int]]) -> int:
    adj = [[] for _ in range(num_nodes)]
    for u, v, w in edges:
        adj[u].append((w, v))
        adj[v].append((w, u))

    visited = [False] * num_nodes
    pq = [(0, 0)]
    total_weight = 0
    nodes_visited = 0

    while pq and nodes_visited < num_nodes:
        weight, u = heapq.heappop(pq)
        if visited[u]:
            continue
        visited[u] = True
        total_weight += weight
        nodes_visited += 1

        for w, v in adj[u]:
            if not visited[v]:
                heapq.heappush(pq, (w, v))

    return total_weight if nodes_visited == num_nodes else -1`;

export const generatePrimMstSteps = (input: PrimMstInput): AlgorithmStep[] => {
  const numNodes = Math.max(1, input?.numNodes ?? DEFAULT_PRIM_MST_INPUT.numNodes);
  const edges = input?.edges ?? DEFAULT_PRIM_MST_INPUT.edges;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const visited = new Array<boolean>(numNodes).fill(false);
  const mstEdgesSet = new Set<string>();
  let totalWeight = 0;
  let nodesVisited = 0;

  // Node layout in ring
  const nodes: GraphNodeItem[] = Array.from({ length: numNodes }, (_, i) => {
    const angle = (2 * Math.PI * i) / numNodes;
    return {
      id: `node-${i}`,
      label: `Node ${i}`,
      x: Math.round(150 + 100 * Math.cos(angle)),
      y: Math.round(150 + 100 * Math.sin(angle)),
      state: "default",
      val: i,
    };
  });

  const getEdgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);

  const createSnapshot = (activeU?: number): GraphVisualSnapshot => {
    const edgeItems: GraphEdgeItem[] = edges.map((e) => {
      const key = getEdgeKey(e.from, e.to);
      const isMst = mstEdgesSet.has(key);
      return {
        from: `node-${e.from}`,
        to: `node-${e.to}`,
        weight: e.weight,
        isPath: isMst,
        isTraversed: isMst,
      };
    });

    return {
      kind: "graph",
      nodes: nodes.map((node, idx) => ({
        ...node,
        state: idx === activeU ? "active" : visited[idx] ? "visited" : "default",
      })),
      edges: edgeItems,
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: "Initialize Prim's algorithm at Node 0",
      why: "Start growing the Minimum Spanning Tree from node 0 with total weight 0.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { startNode: 0, totalWeight: 0 } },
    variables: { numNodes, total_weight: 0 },
  });

  // Priority Queue entries: [weight, u, fromNode]
  const pq: Array<[number, number, number]> = [[0, 0, -1]];

  while (pq.length > 0 && nodesVisited < numNodes) {
    pq.sort((a, b) => a[0] - b[0]);
    const [w, u, parent] = pq.shift()!;

    if (visited[u]) continue;

    visited[u] = true;
    totalWeight += w;
    nodesVisited++;

    if (parent !== -1) {
      mstEdgesSet.add(getEdgeKey(parent, u));
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Add Node ${u} to MST (edge weight ${w})`,
        why: `Node ${u} visited. Cumulative MST weight is now ${totalWeight}. Nodes in MST: ${nodesVisited}/${numNodes}.`,
      },
      primarySnapshot: createSnapshot(u),
      auxiliaryState: {
        customState: {
          addedNode: u,
          edgeWeight: w,
          totalWeight,
          nodesVisited,
        },
      },
      variables: { u, weight: w, total_weight: totalWeight, nodes_visited: nodesVisited },
    });

    for (const edge of edges) {
      let v = -1;
      if (edge.from === u) v = edge.to;
      else if (edge.to === u) v = edge.from;

      if (v !== -1 && !visited[v]) {
        pq.push([edge.weight, v, u]);
      }
    }
  }

  const isConnected = nodesVisited === numNodes;
  const result = isConnected ? totalWeight : -1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: `Prim's MST Complete. Result = ${result}`,
      why: isConnected
        ? `All ${numNodes} nodes connected in MST with minimum total weight ${totalWeight}.`
        : `Graph is disconnected. Visited only ${nodesVisited}/${numNodes} nodes. Return -1.`,
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: { customState: { mstResult: result } },
    variables: { result },
  });

  return steps;
};

const PRIM_MST_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports heapq for priority queue operations.",
    3: "Defines prim_mst(num_nodes, edges) -> int.",
    4: "Builds adjacency list adj with weights for undirected graph.",
    9: "Initializes visited array to track nodes already included in MST.",
    10: "Initializes min-priority queue with starting node 0 at distance 0.",
    15: "Pops edge with minimum weight from priority queue.",
    18: "Marks current node u as visited and adds edge weight to total_weight.",
    22: "Pushes all adjacent edges to unvisited neighbors into priority queue.",
    26: "Returns total_weight if all nodes visited, otherwise -1.",
  },
};

export const primMst: AlgorithmDefinition<PrimMstInput> = {
  id: "prim-mst",
  title: "Prim's Minimum Spanning Tree Algorithm",
  category: "graph_spanning_trees",
  difficulty: "Medium",
  description:
    "Grows a minimum spanning tree from a starting vertex by greedily adding the cheapest edge connecting an unvisited vertex.",
  constraints: ["1 <= V <= 10", "0 <= E <= 20"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "5 nodes, 7 weighted edges",
      outputDisplay: "16",
      title: "5-Node Graph",
      input: DEFAULT_PRIM_MST_INPUT,
      output: "16",
      explanation: "MST includes edges (0-1:2), (1-2:3), (1-4:5), (0-3:6) summing to weight 16.",
    },
    {
      kind: "complex",
      inputDisplay: "4 nodes connected in diamond",
      outputDisplay: "6",
      title: "Diamond Graph",
      input: {
        numNodes: 4,
        edges: [
          { from: 0, to: 1, weight: 1 },
          { from: 1, to: 2, weight: 2 },
          { from: 2, to: 3, weight: 3 },
          { from: 0, to: 3, weight: 4 },
          { from: 0, to: 2, weight: 5 },
        ],
      },
      output: "6",
      explanation: "MST picks edges with weights 1, 2, 3 to connect all 4 nodes (total 6).",
    },
    {
      kind: "negative",
      inputDisplay: "3 nodes with node 2 isolated",
      outputDisplay: "-1",
      title: "Disconnected Graph",
      input: {
        numNodes: 3,
        edges: [{ from: 0, to: 1, weight: 4 }],
      },
      output: "-1",
      explanation: "Node 2 is disconnected and cannot be reached in MST, returning -1.",
    },
  ],
  code: PYTHON_PRIM_MST_CODE,
  timeComplexity: { best: "O(E log V)", average: "O(E log V)", worst: "O(E log V)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Each edge is inserted and popped from priority queue at most once, resulting in O(E log V) complexity.",
    space: "Uses priority queue and adjacency list taking O(V + E) auxiliary memory.",
  },
  topicGuide: {
    overview:
      "Prim's algorithm builds MST by maintaining a cut of visited and unvisited vertices, greedily selecting the minimum weight cross-cut edge.",
    sections: [
      {
        heading: "Greedy Cut Property",
        body: "The minimum weight edge connecting a node inside MST to a node outside MST is guaranteed to belong to MST.",
      },
    ],
  },
  trivia: PRIM_MST_TRIVIA,
    sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 15",
      label: "Competitive Programmer's Handbook, Ch 15",
    },
  ],
  defaultInput: DEFAULT_PRIM_MST_INPUT,
  generateSteps: generatePrimMstSteps,
};
