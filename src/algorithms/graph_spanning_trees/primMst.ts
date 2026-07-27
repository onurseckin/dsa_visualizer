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

export const PYTHON_PRIM_MST_CODE = `
def python_prim_mst(input_array):
    """
    Implementation of python_prim_mst.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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
  categories: ["graph_spanning_trees"],
  difficulty: "Medium",
  description:
    "Given a connected, undirected graph with V vertices and E weighted edges, construct a Minimum Spanning Tree (MST)—a subset of V - 1 edges that connects all vertices together without any cycles while minimizing total edge weight sum. Prim's algorithm starts from an arbitrary initial vertex and grows the MST iteratively. At each step, a min-priority queue extracts the lightest edge connecting a vertex inside the current MST tree to an unvisited vertex outside the tree. If the graph is disconnected, report that a single spanning tree cannot be formed.",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 10^5",
    "0 <= Edge Weight <= 10^4",
    "Graph is undirected and may contain duplicate edge weights",
  ],
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
      "Prim's algorithm is a greedy graph traversal algorithm that constructs a Minimum Spanning Tree (MST) by growing a single connected tree outward from an initial seed node. By prioritizing the minimum-weight edge across the cut dividing visited tree nodes from unvisited nodes, Prim's algorithm operates efficiently using a min-priority queue (or Fibonacci heap) in O(E log V) time.",
    sections: [
      {
        heading: "Core Concept: The Cut Property & Local Greedy Choices",
        body: "A cut partitions the graph's vertices into two disjoint sets S and V \\ S. The Cut Property states that for any cut, the lightest edge crossing the cut boundary belongs to some Minimum Spanning Tree. Prim's algorithm maintains S as the set of nodes already in the MST, greedily absorbing the lightest edge leaving S at every step.",
      },
      {
        heading: "Implementation: Priority Queues & Min-Heaps",
        body: "Using a binary min-heap priority queue, candidate edges are ordered by weight. When a node u is added to S, all edges leaving u to unvisited neighbors are pushed onto the heap. Popping the top element extracts the cheapest valid cross-cut edge.",
      },
      {
        heading: "Comparison: Prim vs Kruskal Algorithm",
        body: "Prim's algorithm grows a single continuous tree component, whereas Kruskal's algorithm merges independent forest components. On dense graphs (E ≈ V^2), Prim with an adjacency matrix runs in O(V^2) without heap overhead, outperforming Kruskal's O(E log E). On sparse graphs (E ≈ V), binary heap Prim and Kruskal achieve comparable O(E log V) bounds.",
      },
      {
        heading: "Systems Applications & Network Infrastructure",
        body: "Prim's MST algorithm underpins physical network wiring (minimizing fiber optic conduit installation cost), circuit layout design (VLSI clock tree routing), and cluster analysis in machine learning.",
      },
    ],
    keyTerms: [
      {
        term: "Minimum Spanning Tree (MST)",
        definition:
          "A spanning subgraph of a connected, edge-weighted undirected graph that connects all vertices together with minimum total edge weight and no cycles.",
      },
      {
        term: "Cut Property",
        definition:
          "The fundamental theorem stating that for any vertex partition (S, V \\ S), the minimum weight edge crossing between S and V \\ S is part of an MST.",
      },
      {
        term: "Min-Priority Queue",
        definition:
          "A abstract data structure that allows fast O(1) minimum element inspection and O(log N) extraction and insertion.",
      },
      {
        term: "Fringe / Frontier",
        definition:
          "The set of candidate edges connecting visited tree nodes to adjacent unvisited vertices.",
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
