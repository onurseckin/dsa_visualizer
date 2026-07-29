import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Minimum Spanning Tree (MST) connects all vertices in a weighted undirected graph with minimum total edge weight and no cycles.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Node 0", state: "active" },
        { id: "node-1", label: "Node 1", state: "default" },
        { id: "node-2", label: "Node 2", state: "default" },
        { id: "node-3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2 },
        { from: "node-0", to: "node-2", weight: 4 },
        { from: "node-1", to: "node-2", weight: 1 },
        { from: "node-2", to: "node-3", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "Unlike Kruskal's algorithm which sorts global edges and merges forest components, Prim's algorithm grows a single tree component outward from a start seed.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Node 0", state: "visited" },
        { id: "node-1", label: "Node 1", state: "visited" },
        { id: "node-2", label: "Node 2", state: "active" },
        { id: "node-3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2, isPath: true },
        { from: "node-0", to: "node-2", weight: 4 },
        { from: "node-1", to: "node-2", weight: 1, isTraversed: true },
        { from: "node-2", to: "node-3", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "The Cut Property guarantees that for any cut partition between visited tree vertices S and unvisited vertices V \\ S, the minimum-weight cross-cut edge must belong to an MST.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Tree 0", state: "visited" },
        { id: "node-1", label: "Tree 1", state: "visited" },
        { id: "node-2", label: "Unvisited 2", state: "compare" },
        { id: "node-3", label: "Unvisited 3", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2, isPath: true },
        { from: "node-0", to: "node-2", weight: 4 },
        { from: "node-1", to: "node-2", weight: 1, isTraversed: true },
        { from: "node-2", to: "node-3", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "Prim's algorithm initializes by picking an arbitrary seed vertex (such as Node 0) and adding it to the growing tree set S.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Seed 0", state: "active" },
        { id: "node-1", label: "Node 1", state: "default" },
        { id: "node-2", label: "Node 2", state: "default" },
        { id: "node-3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2 },
        { from: "node-0", to: "node-2", weight: 4 },
        { from: "node-1", to: "node-2", weight: 1 },
        { from: "node-2", to: "node-3", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "A min-priority queue maintains all candidate cross-cut edges leading from visited tree nodes to unvisited neighbors, ordered by weight.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Tree 0", state: "visited" },
        { id: "node-1", label: "Candidate 1", state: "compare" },
        { id: "node-2", label: "Candidate 2", state: "compare" },
        { id: "node-3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2, isTraversed: true },
        { from: "node-0", to: "node-2", weight: 4, isTraversed: true },
        { from: "node-1", to: "node-2", weight: 1 },
        { from: "node-2", to: "node-3", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "In each iteration, popping the top of the min-priority queue retrieves the lightest edge leaving the tree component, greedily absorbing a new vertex.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Tree 0", state: "visited" },
        { id: "node-1", label: "Absorbed 1", state: "swap" },
        { id: "node-2", label: "Node 2", state: "default" },
        { id: "node-3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2, isPath: true },
        { from: "node-0", to: "node-2", weight: 4 },
        { from: "node-1", to: "node-2", weight: 1 },
        { from: "node-2", to: "node-3", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "If a popped candidate edge connects to a vertex that is already inside the tree set S, it is skipped to prevent cycle creation.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Tree 0", state: "visited" },
        { id: "node-1", label: "Tree 1", state: "visited" },
        { id: "node-2", label: "Tree 2", state: "visited" },
        { id: "node-3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2, isPath: true },
        { from: "node-0", to: "node-2", weight: 4, isTraversed: true },
        { from: "node-1", to: "node-2", weight: 1, isPath: true },
        { from: "node-2", to: "node-3", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "Newly added vertices push their incident edges to unvisited neighbors into the min-priority queue, expanding the frontier cut.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "Tree 0", state: "visited" },
        { id: "node-1", label: "Tree 1", state: "visited" },
        { id: "node-2", label: "Tree 2", state: "visited" },
        { id: "node-3", label: "Frontier 3", state: "active" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2, isPath: true },
        { from: "node-0", to: "node-2", weight: 4 },
        { from: "node-1", to: "node-2", weight: 1, isPath: true },
        { from: "node-2", to: "node-3", weight: 3, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "The algorithm terminates when all V vertices are absorbed into the MST tree, achieving O(E log V) runtime using a binary min-heap.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "node-0", label: "MST 0", state: "visited" },
        { id: "node-1", label: "MST 1", state: "visited" },
        { id: "node-2", label: "MST 2", state: "visited" },
        { id: "node-3", label: "MST 3", state: "visited" },
      ],
      edges: [
        { from: "node-0", to: "node-1", weight: 2, isPath: true },
        { from: "node-0", to: "node-2", weight: 4 },
        { from: "node-1", to: "node-2", weight: 1, isPath: true },
        { from: "node-2", to: "node-3", weight: 3, isPath: true },
      ],
    },
  },
];

export const generatePrimMstSteps = (input: PrimMstInput): AlgorithmStep[] => {
  const numNodes = Math.max(
    1,
    typeof input?.numNodes === "number" ? input.numNodes : DEFAULT_PRIM_MST_INPUT.numNodes,
  );
  const edges = Array.isArray(input?.edges) ? input.edges : DEFAULT_PRIM_MST_INPUT.edges;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  const visited = new Array<boolean>(numNodes).fill(false);
  const mstEdgesSet = new Set<string>();
  let totalWeight = 0;
  let nodesVisited = 0;

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

  const createSnapshot = (
    activeU?: number,
    candidateV?: number,
    highlightState: "active" | "compare" | "swap" = "active",
  ): GraphVisualSnapshot => {
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
        if (idx === activeU) state = highlightState;
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

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Prim's algorithm for ${numNodes} nodes: seeding min-priority queue with starting Node 0 at weight 0.`,
      primarySnapshot: createSnapshot(0, undefined, "active"),
      auxiliaryState: {
        customState: {
          "Priority Queue": "(w:0, node:0)",
          "Total Weight": 0,
          "Nodes Visited": `0 / ${numNodes}`,
        },
      },
      variables: { numNodes, totalWeight: 0, startNode: 0 },
    }),
  );

  const pq: Array<[number, number, number]> = [[0, 0, -1]];

  while (pq.length > 0 && nodesVisited < numNodes) {
    pq.sort((a, b) => a[0] - b[0]);
    const [w, u, parent] = pq.shift()!;

    if (visited[u]) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Popped candidate Node ${u} (weight ${w}) from min-heap, but Node ${u} is already in the MST tree. Skipping to prevent cycle creation.`,
          primarySnapshot: createSnapshot(u, undefined, "compare"),
          auxiliaryState: {
            customState: {
              "Priority Queue": formatPq(pq),
              "Total Weight": totalWeight,
              "Nodes Visited": `${nodesVisited} / ${numNodes}`,
            },
          },
          variables: { u, weight: w, skipped: true },
        }),
      );
      continue;
    }

    visited[u] = true;
    totalWeight += w;
    nodesVisited++;

    if (parent !== -1) {
      mstEdgesSet.add(getEdgeKey(parent, u));
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative:
          parent === -1
            ? `Absorbed seed Node 0 into MST tree.`
            : `Absorbed Node ${u} into MST tree via edge with weight ${w}. Cumulative MST weight is now ${totalWeight}.`,
        primarySnapshot: createSnapshot(u, undefined, "swap"),
        auxiliaryState: {
          customState: {
            "Priority Queue": formatPq(pq),
            "Total Weight": totalWeight,
            "Nodes Visited": `${nodesVisited} / ${numNodes}`,
          },
        },
        variables: { u, weight: w, totalWeight, nodesVisited },
      }),
    );

    for (const edge of edges) {
      let v = -1;
      if (edge.from === u) v = edge.to;
      else if (edge.to === u) v = edge.from;

      if (v !== -1 && !visited[v]) {
        pq.push([edge.weight, v, u]);
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Inspecting edge Node ${u} - Node ${v} (weight ${edge.weight}): pushed candidate cross-cut edge to min-priority queue.`,
            primarySnapshot: createSnapshot(u, v, "active"),
            auxiliaryState: {
              customState: {
                "Priority Queue": formatPq(pq),
                "Total Weight": totalWeight,
                "Nodes Visited": `${nodesVisited} / ${numNodes}`,
              },
            },
            variables: { u, v, weight: edge.weight },
          }),
        );
      }
    }
  }

  const isConnected = nodesVisited === numNodes;
  const result = isConnected ? totalWeight : -1;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: isConnected
        ? `Prim's MST algorithm complete. Successfully connected all ${numNodes} vertices into a single MST with total minimum weight ${totalWeight}.`
        : `Prim's MST algorithm complete. Graph is disconnected: reached only ${nodesVisited}/${numNodes} vertices. Returning -1.`,
      primarySnapshot: createSnapshot(),
      auxiliaryState: {
        customState: {
          "MST Result": result,
          "Total Weight": totalWeight,
          "Nodes Visited": `${nodesVisited} / ${numNodes}`,
        },
      },
      variables: { completed: true, totalWeight: result, isConnected },
    }),
  );

  return steps;
};

const PRIM_MST_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports heapq module for min-priority queue operations.",
    2: "Blank line after module import.",
    3: "Defines prim_mst(num_nodes, edges) function.",
    4: "Initializes adjacency list representation for graph.",
    5: "Populates adjacency list with edge endpoints and weights.",
    6: "Adds edge (w, v) for node u.",
    7: "Adds edge (w, u) for node v to represent undirected graph.",
    8: "Blank line before initialization.",
    9: "Tracks visited vertices to prevent cycle creation.",
    10: "Initializes min-heap with seed node 0 at weight 0.",
    11: "Accumulator for total minimum spanning tree weight.",
    12: "Counter for number of absorbed tree vertices.",
    13: "Blank line before loop execution.",
    14: "Loop until priority queue empty or all nodes absorbed.",
    15: "Extracts minimum weight cross-cut edge from min-heap.",
    16: "Checks if candidate node u has already been absorbed.",
    17: "Skips stale priority queue entry.",
    18: "Marks candidate node u as absorbed into MST.",
    19: "Adds edge weight to cumulative total weight.",
    20: "Increments visited node count.",
    21: "Blank line before neighbor push.",
    22: "Iterates over incident edges of node u.",
    23: "Filters unvisited neighbor vertices.",
    24: "Pushes cross-cut candidate edge into min-heap.",
    25: "Blank line before final result return.",
    26: "Returns total MST weight if connected, otherwise -1.",
  },
};

export const primMst: AlgorithmDefinition<PrimMstInput> = {
  id: "prim-mst",
  title: "Prim's Minimum Spanning Tree Algorithm",
  topicIds: ["graph_spanning_trees"],
  difficulty: "Medium",
  description:
    "<p>Given a connected, undirected weighted graph <code>G = (V, E)</code>, compute a Minimum Spanning Tree (MST) that connects all vertices with minimum total edge weight.</p><h3>Problem Statement</h3><p>Find a subset of edges <code>T ⊆ E</code> connecting all vertices in <code>V</code> without cycles such that the sum of edge weights in <code>T</code> is minimized. If the graph is disconnected, indicate that no single MST spans all vertices.</p><h3>Input Parameters</h3><ul><li><code>numNodes</code>: Total number of vertices in the graph.</li><li><code>edges</code>: Array of undirected edges with <code>(from, to, weight)</code> properties.</li></ul><h3>Output</h3><p>Returns the total minimum weight sum of the MST edges, or -1 if the graph is disconnected.</p>",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 10^5",
    "0 <= Edge Weight <= 10^4",
    "Graph is undirected and may contain duplicate edge weights",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "numNodes = 6, 9 weighted edges",
      outputDisplay: "Total MST Weight: 13",
      title: "Standard 6-Node Graph",
      input: DEFAULT_PRIM_MST_INPUT,
      output: "13",
      explanation:
        "MST includes edges (1-2:1), (0-1:2), (3-4:2), (2-4:3), (3-5:5) summing to weight 13.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "numNodes = 4, 5 dense edges in diamond",
      outputDisplay: "Total MST Weight: 6",
      title: "Adversarial Diamond Graph",
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
      scenario: "boundary",
      inputDisplay: "numNodes = 3, Node 2 isolated",
      outputDisplay: "Disconnected (-1)",
      title: "Boundary Disconnected Graph",
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
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 15,
      label: "Competitive Programmer's Handbook, Ch 15",
    },
  ],
  defaultInput: DEFAULT_PRIM_MST_INPUT,
  generateSteps: generatePrimMstSteps,
};

export default primMst;
