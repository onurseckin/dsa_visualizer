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
  numNodes: 6,
  edges: [
    { from: 0, to: 1, weight: 2 },
    { from: 0, to: 2, weight: 4 },
    { from: 1, to: 2, weight: 1 },
    { from: 1, to: 3, weight: 7 },
    { from: 2, to: 4, weight: 3 },
    { from: 3, to: 4, weight: 2 },
    { from: 3, to: 5, weight: 5 },
    { from: 4, to: 5, weight: 8 },
    { from: 0, to: 3, weight: 6 },
  ],
};

export const PYTHON_PRIM_MST_CODE = `import heapq

def prim_mst(num_nodes, edges):
    adj = {i: [] for i in range(num_nodes)}
    for u, v, w in edges:
        adj[u].append((w, v))
        adj[v].append((w, u))
        
    visited = [False] * num_nodes
    pq = [(0, 0)]
    total_weight = 0
    nodes_visited = 0
    
    while pq and nodes_visited < num_nodes:
        w, u = heapq.heappop(pq)
        if visited[u]:
            continue
        visited[u] = True
        total_weight += w
        nodes_visited += 1
        
        for weight, neighbor in adj[u]:
            if not visited[neighbor]:
                heapq.heappush(pq, (weight, neighbor))
                
    return total_weight if nodes_visited == num_nodes else -1`;

export const generatePrimMstSteps = (input: PrimMstInput): AlgorithmStep[] => {
  const numNodes = Math.max(
    1,
    typeof input?.numNodes === "number" ? input.numNodes : DEFAULT_PRIM_MST_INPUT.numNodes,
  );
  const edges = Array.isArray(input?.edges) ? input.edges : DEFAULT_PRIM_MST_INPUT.edges;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const visited = new Array<boolean>(numNodes).fill(false);
  const mstEdgesSet = new Set<string>();
  let totalWeight = 0;
  let nodesVisited = 0;

  // Node layout in ring
  const nodes: GraphNodeItem[] = Array.from({ length: numNodes }, (_, i) => {
    const angle = (2 * Math.PI * i) / numNodes - Math.PI / 2;
    return {
      id: `node-${i}`,
      label: `Node ${i}`,
      x: Math.round(200 + 120 * Math.cos(angle)),
      y: Math.round(180 + 120 * Math.sin(angle)),
      state: "default",
      val: i,
    };
  });

  const getEdgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);

  const createSnapshot = (activeU?: number, candidateV?: number): GraphVisualSnapshot => {
    const edgeItems: GraphEdgeItem[] = edges.map((e) => {
      const key = getEdgeKey(e.from, e.to);
      const isMst = mstEdgesSet.has(key);
      const isCandidate =
        activeU !== undefined &&
        candidateV !== undefined &&
        ((e.from === activeU && e.to === candidateV) ||
          (e.from === candidateV && e.to === activeU));

      return {
        from: `node-${e.from}`,
        to: `node-${e.to}`,
        weight: e.weight,
        isPath: isMst,
        isTraversed: isMst || isCandidate,
      };
    });

    return {
      kind: "graph",
      nodes: nodes.map((node, idx) => {
        let state: GraphNodeItem["state"] = "default";
        if (idx === activeU) state = "active";
        else if (idx === candidateV) state = "compare";
        else if (visited[idx]) state = "visited";
        return {
          ...node,
          state,
        };
      }),
      edges: edgeItems,
    };
  };

  const formatPq = (pqArray: Array<[number, number, number]>) => {
    if (pqArray.length === 0) return "Empty";
    const sorted = [...pqArray].sort((a, b) => a[0] - b[0]);
    return sorted.map(([w, u]) => `(w:${w}, node:${u})`).join(", ");
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Prim's algorithm for ${numNodes} nodes.`,
      why: "Build adjacency list and prepare min-priority queue starting from seed Node 0.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: {
      customState: {
        "Priority Queue": "Empty",
        "Total Weight": 0,
        "Nodes Visited": `0 / ${numNodes}`,
        "MST Edges": "None",
      },
    },
    variables: { numNodes, total_weight: 0, nodes_visited: 0 },
  });

  // Priority Queue entries: [weight, u, fromNode]
  const pq: Array<[number, number, number]> = [[0, 0, -1]];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: "Enqueued initial seed Node 0 with weight 0 into Min-Heap.",
      why: "Prim's algorithm grows a single MST component outward from Node 0.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: {
      customState: {
        "Priority Queue": formatPq(pq),
        "Total Weight": 0,
        "Nodes Visited": `0 / ${numNodes}`,
        "MST Edges": "None",
      },
    },
    variables: { startNode: 0, pqLength: 1 },
  });

  while (pq.length > 0 && nodesVisited < numNodes) {
    pq.sort((a, b) => a[0] - b[0]);
    const [w, u, parent] = pq.shift()!;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Popped minimum weight candidate (Node ${u}, weight ${w}) from Priority Queue.`,
        why: "Heap popping always retrieves the lightest edge crossing the current MST cut.",
      },
      primarySnapshot: createSnapshot(u),
      auxiliaryState: {
        customState: {
          "Popped Element": `Node ${u} (weight ${w})`,
          "Priority Queue": formatPq(pq),
          "Total Weight": totalWeight,
          "Nodes Visited": `${nodesVisited} / ${numNodes}`,
          "MST Edges": Array.from(mstEdgesSet).join(", ") || "None",
        },
      },
      variables: { u, w, alreadyVisited: visited[u] },
    });

    if (visited[u]) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 17,
        explanation: {
          what: `Skipped Node ${u}: Node ${u} is already part of the MST.`,
          why: "An edge connecting two nodes already in the MST would close a cycle.",
        },
        primarySnapshot: createSnapshot(u),
        auxiliaryState: {
          customState: {
            "Skipped Node": u,
            Reason: "Already visited (Cycle prevention)",
            "Priority Queue": formatPq(pq),
            "Total Weight": totalWeight,
            "Nodes Visited": `${nodesVisited} / ${numNodes}`,
            "MST Edges": Array.from(mstEdgesSet).join(", ") || "None",
          },
        },
        variables: { u, skipped: true },
      });
      continue;
    }

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
        what: `Added Node ${u} to MST (edge weight ${w}). Cumulative weight: ${totalWeight}.`,
        why: `Node ${u} absorbed into MST tree. Nodes in MST: ${nodesVisited}/${numNodes}.`,
      },
      primarySnapshot: createSnapshot(u),
      auxiliaryState: {
        customState: {
          "Added Node": u,
          "Edge Weight": w,
          "Total Weight": totalWeight,
          "Nodes Visited": `${nodesVisited} / ${numNodes}`,
          "MST Edges": Array.from(mstEdgesSet).join(", ") || "None",
          "Priority Queue": formatPq(pq),
        },
      },
      variables: { u, weight: w, total_weight: totalWeight, nodes_visited: nodesVisited },
    });

    // Inspect outgoing edges
    for (const edge of edges) {
      let v = -1;
      if (edge.from === u) v = edge.to;
      else if (edge.to === u) v = edge.from;

      if (v !== -1) {
        if (!visited[v]) {
          pq.push([edge.weight, v, u]);
          steps.push({
            stepIndex: stepIndex++,
            codeLine: 24,
            explanation: {
              what: `Enqueued edge Node ${u} -> Node ${v} (weight ${edge.weight}) to Priority Queue.`,
              why: `Node ${v} is an unvisited neighbor. Edge added to frontier candidates.`,
            },
            primarySnapshot: createSnapshot(u, v),
            auxiliaryState: {
              customState: {
                "Frontier Edge": `${u} -> ${v} (w: ${edge.weight})`,
                "Priority Queue": formatPq(pq),
                "Total Weight": totalWeight,
                "Nodes Visited": `${nodesVisited} / ${numNodes}`,
                "MST Edges": Array.from(mstEdgesSet).join(", ") || "None",
              },
            },
            variables: { u, v, weight: edge.weight },
          });
        }
      }
    }
  }

  const isConnected = nodesVisited === numNodes;
  const result = isConnected ? totalWeight : -1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: `Prim's MST Complete. Total MST Weight = ${result}.`,
      why: isConnected
        ? `All ${numNodes} nodes connected into a single MST with minimum total weight ${totalWeight}.`
        : `Graph is disconnected. Visited only ${nodesVisited}/${numNodes} nodes. Return -1.`,
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: {
      customState: {
        "MST Result": result,
        "Total Weight": totalWeight,
        "Nodes Visited": `${nodesVisited} / ${numNodes}`,
        "MST Edges": Array.from(mstEdgesSet).join(", ") || "None",
      },
    },
    variables: { result, isConnected, totalWeight },
  });

  return steps;
};

const PRIM_MST_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports heapq for min-priority queue operations.",
    2: "Blank line after module import.",
    3: "Defines prim_mst(num_nodes, edges) -> int.",
    4: "Initializes adjacency list adj mapping each node to list of (weight, neighbor) pairs.",
    5: "Iterates over undirected graph edges to populate adjacency list.",
    6: "Appends directed edge from u to (w, v).",
    7: "Appends reverse directed edge from v to (w, u) for undirected graph.",
    8: "Blank line separating adjacency build from state initialization.",
    9: "Initializes visited array of size num_nodes to False.",
    10: "Initializes min-priority queue with starting node 0 at distance 0: [(0, 0)].",
    11: "Initializes total_weight accumulator to 0.",
    12: "Initializes nodes_visited counter to 0.",
    13: "Blank line separating state init from main loop.",
    14: "Drives main loop while priority queue is non-empty and unvisited nodes remain.",
    15: "Pops lightest candidate edge (w, u) from min-priority queue.",
    16: "Checks if popped node u has already been included in the MST.",
    17: "Continues loop to discard stale duplicate priority queue entry.",
    18: "Marks node u as visited and added to the MST.",
    19: "Adds edge weight w to cumulative total_weight.",
    20: "Increments nodes_visited count by 1.",
    21: "Blank line separating node visit logic from neighbor expansion.",
    22: "Iterates over all outgoing edges from newly added node u.",
    23: "Checks if adjacent neighbor node is unvisited.",
    24: "Pushes candidate edge (weight, neighbor) onto min-priority queue.",
    25: "Blank line separating loop body from return statement.",
    26: "Returns total_weight if all nodes connected in MST, otherwise returns -1.",
  },
};

export const primMst: AlgorithmDefinition<PrimMstInput> = {
  id: "prim-mst",
  title: "Prim's Minimum Spanning Tree Algorithm",
  topicIds: ["graph_spanning_trees"],
  difficulty: "Medium",
  description:
    "<p><strong>Prim's algorithm</strong> constructs a Minimum Spanning Tree (MST) for a connected, undirected weighted graph <code>G = (V, E)</code> by growing a single tree component outward from an initial seed vertex.</p><p>At each step, a min-priority queue extracts the cheapest edge <code>(u, v, w)</code> connecting a node inside the current tree component <code>S</code> to an unvisited node <code>v ∉ S</code>. It operates in <code>O(E log V)</code> time with a binary min-heap, prioritizing frontier edges crossing the cut boundary.</p>",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 10^5",
    "0 <= Edge Weight <= 10^4",
    "Graph is undirected and may contain duplicate edge weights",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "6 nodes, 9 weighted edges",
      outputDisplay: "13",
      title: "6-Node Graph",
      input: DEFAULT_PRIM_MST_INPUT,
      output: "13",
      explanation:
        "MST includes edges (1-2:1), (0-1:2), (3-4:2), (2-4:3), (3-5:5) summing to weight 13.",
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
      "<p>Prim's algorithm is a classic greedy graph algorithm that builds a <strong>Minimum Spanning Tree (MST)</strong> by growing a single connected tree <code>S</code> from a seed vertex. By continuously absorbing the minimum-weight edge crossing the boundary between visited tree nodes <code>S</code> and unvisited frontier nodes <code>V \\ S</code> (the <strong>Cut Property</strong>), Prim's algorithm efficiently computes the optimal spanning tree in <code>O(E log V)</code> time.</p>",
    sections: [
      {
        heading: "Why It Exists & What It Solves",
        body: "<p>Finding the cheapest network connecting all <code>|V|</code> nodes without loops occurs frequently in physical infrastructure (fiber-optic wiring, electrical grids, circuit routing). Prim's algorithm solves this by growing a tree locally, absorbing one node at a time via the cheapest available connection.</p>",
      },
      {
        heading: "The Cut Property & Greedy Selection",
        body: "<p>A cut <code>(S, V \\ S)</code> splits graph nodes into tree nodes <code>S</code> and non-tree nodes <code>V \\ S</code>. The <strong>Cut Property</strong> guarantees that the lightest edge <code>e = (u, v)</code> crossing <code>(S, V \\ S)</code> belongs to an MST. Prim's algorithm maintains <code>S</code> and greedily picks the minimum-weight edge leaving <code>S</code> at every step.</p>",
      },
      {
        heading: "Implementation: Min-Priority Queue / Binary Heap",
        body: "<p>A min-heap tracks candidate edges <code>(weight, neighbor)</code>. When node <code>u</code> joins <code>S</code>, all edges from <code>u</code> to unvisited neighbors are pushed into the heap. Popping from the heap yields the next cheapest cross-cut edge, skipping nodes that were already visited.</p>",
      },
      {
        heading: "Step-by-Step Intuition",
        body: "<p>1. Start at Node 0. Set <code>visited[0] = True</code>, push candidate edges to priority queue.<br/>2. Pop lightest edge <code>(w, u)</code> from queue.<br/>3. If <code>u</code> is already visited, discard.<br/>4. Mark <code>visited[u] = True</code>, add edge to MST, and push <code>u</code>'s unvisited neighbors to queue.<br/>5. Repeat until all <code>|V|</code> nodes are visited.</p>",
      },
      {
        heading: "Trade-offs: Prim vs. Kruskal Algorithm",
        body: "<p>Prim's algorithm grows a single connected tree and performs exceptionally well on dense graphs (<code>E ≈ V²</code>). Kruskal's algorithm merges disconnected forest components and is preferable for sparse graphs (<code>E ≈ V</code>).</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(E log V)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code><br/>Each edge is inserted into and extracted from the priority queue at most once. Priority queue operations run in <code>O(log V)</code> time.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Minimum Spanning Tree (MST)",
        definition:
          "A spanning subgraph T ⊆ E connecting all vertices together with minimum total edge weight sum.",
      },
      {
        term: "Cut Property",
        definition:
          "Theorem stating that the lightest edge crossing any vertex cut (S, V \\ S) is guaranteed to be part of an MST.",
      },
      {
        term: "Min-Priority Queue",
        definition:
          "Heap data structure allowing O(1) minimum element retrieval and O(log N) operations.",
      },
      {
        term: "Frontier / Fringe",
        definition:
          "The set of candidate edges connecting visited tree vertices S to unvisited neighbors V \\ S.",
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
