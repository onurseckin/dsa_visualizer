import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface DagEdge {
  from: number;
  to: number;
}

export interface MinimumPathCoverInput {
  numNodes: number;
  edges: DagEdge[];
}

export const DEFAULT_MINIMUM_PATH_COVER_INPUT: MinimumPathCoverInput = {
  numNodes: 5,
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 0, to: 3 },
    { from: 3, to: 4 },
  ],
};

export const PYTHON_MINIMUM_PATH_COVER_CODE = `def min_path_cover(n, edges):
    adj = {i: [] for i in range(n)}
    for u, v in edges:
        adj[u].append(v)
        
    match = [-1] * n
    
    def dfs(u, visited):
        for v in adj[u]:
            if not visited[v]:
                visited[v] = True
                if match[v] < 0 or dfs(match[v], visited):
                    match[v] = u
                    return True
        return False
        
    matching_size = 0
    for i in range(n):
        visited = [False] * n
        if dfs(i, visited):
            matching_size += 1
            
    return n - matching_size`;

export const generateMinimumPathCoverSteps = (input: MinimumPathCoverInput): AlgorithmStep[] => {
  const numNodes = Math.max(1, input?.numNodes ?? DEFAULT_MINIMUM_PATH_COVER_INPUT.numNodes);
  const edges = input?.edges ?? DEFAULT_MINIMUM_PATH_COVER_INPUT.edges;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const adj: number[][] = Array.from({ length: numNodes }, () => []);
  for (const e of edges) {
    adj[e.from].push(e.to);
  }

  const match = new Array<number>(numNodes).fill(-1);

  // Graph layout
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

  const getMatchedEdgeSet = () => {
    const set = new Set<string>();
    for (let v = 0; v < numNodes; v++) {
      if (match[v] !== -1) {
        set.add(`${match[v]}->${v}`);
      }
    }
    return set;
  };

  const createSnapshot = (activeU?: number, activeV?: number): GraphVisualSnapshot => {
    const matchedSet = getMatchedEdgeSet();
    const edgeItems: GraphEdgeItem[] = edges.map((e) => {
      const key = `${e.from}->${e.to}`;
      const isMatched = matchedSet.has(key);
      const isActive = e.from === activeU && e.to === activeV;
      return {
        from: `node-${e.from}`,
        to: `node-${e.to}`,
        isPath: isMatched || isActive,
        isTraversed: isMatched || isActive,
      };
    });

    return {
      kind: "graph",
      nodes: nodes.map((node, i) => ({
        ...node,
        state:
          i === activeV
            ? "active"
            : i === activeU
              ? "pivot"
              : match.includes(i)
                ? "visited"
                : "default",
      })),
      edges: edgeItems,
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize Bipartite Matching for Minimum Path Cover",
      why: "By Dilworth's theorem / Gallai's identity, Min Path Cover in DAG = N - Max Bipartite Matching size.",
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: { customState: { numNodes, matchingSize: 0 } },
    variables: { num_nodes: numNodes, matching_size: 0 },
  });

  const dfs = (u: number, visited: boolean[]): boolean => {
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 10,
          explanation: {
            what: `Try matching left-node ${u} to right-node ${v}`,
            why: `Checking if node ${v} is free or if its current owner match[${v}] (${match[v]}) can be re-matched.`,
          },
          primarySnapshot: createSnapshot(u, v),
          auxiliaryState: { customState: { u, v, currMatch: match[v] } },
          variables: { u, v, "match[v]": match[v] },
        });

        if (match[v] === -1 || dfs(match[v], visited)) {
          match[v] = u;
          return true;
        }
      }
    }
    return false;
  };

  let matchingSize = 0;
  for (let i = 0; i < numNodes; i++) {
    const visited = new Array<boolean>(numNodes).fill(false);
    if (dfs(i, visited)) {
      matchingSize++;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 21,
        explanation: {
          what: `Found augmenting path for node ${i}. Matching size is now ${matchingSize}`,
          why: `Augmented matching with edge from node ${i}. Total matching count = ${matchingSize}.`,
        },
        primarySnapshot: createSnapshot(i),
        auxiliaryState: { customState: { node: i, matchingSize } },
        variables: { i, matching_size: matchingSize },
      });
    }
  }

  const minPathCover = numNodes - matchingSize;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Minimum Path Cover = ${minPathCover}`,
      why: `Calculated N - Max Matching: ${numNodes} - ${matchingSize} = ${minPathCover} paths needed to cover DAG vertices.`,
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: { customState: { minPathCover } },
    variables: { result: minPathCover },
  });

  return steps;
};

const MINIMUM_PATH_COVER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines minimum_path_cover(num_nodes, edges) -> int.",
    2: "Builds adjacency list for directed graph DAG.",
    6: "Initializes match array with -1 (unmatched).",
    8: "Defines DFS helper for finding augmenting paths in bipartite graph.",
    12: "If target node v is unmatched or its match can be re-routed, matches v to u.",
    18: "Loops through each vertex i to find augmenting matching paths.",
    23: "Returns num_nodes - matching_size (Minimum Path Cover count).",
  },
};

export const minimumPathCover: AlgorithmDefinition<MinimumPathCoverInput> = {
  id: "minimum-path-cover",
  title: "Minimum Path Cover in DAG",
  category: "graph_flows_and_cuts",
  categories: ["graph_flows_and_cuts"],
  difficulty: "Hard",
  description:
    "Finds the minimum number of vertex-disjoint paths required to cover all vertices in a Directed Acyclic Graph (DAG) using Maximum Bipartite Matching.",
  constraints: ["1 <= V <= 10", "0 <= E <= 20"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "5 nodes DAG (0->1->2, 0->3->4)",
      outputDisplay: "2",
      title: "5-Node DAG",
      input: DEFAULT_MINIMUM_PATH_COVER_INPUT,
      output: "2",
      explanation: "Covered by 2 paths: 0->1->2 and 3->4.",
    },
    {
      kind: "complex",
      inputDisplay: "6 nodes with multiple paths",
      outputDisplay: "2",
      title: "Complex DAG",
      input: {
        numNodes: 6,
        edges: [
          { from: 0, to: 1 },
          { from: 1, to: 2 },
          { from: 3, to: 4 },
          { from: 4, to: 5 },
          { from: 0, to: 4 },
        ],
      },
      output: "2",
      explanation: "Covered by 2 paths: 0->1->2 and 3->4->5.",
    },
    {
      kind: "negative",
      inputDisplay: "4 isolated nodes (0 edges)",
      outputDisplay: "4",
      title: "Isolated Nodes",
      input: {
        numNodes: 4,
        edges: [],
      },
      output: "4",
      explanation: "With no edges, each of the 4 nodes forms its own path of length 0.",
    },
  ],
  code: PYTHON_MINIMUM_PATH_COVER_CODE,
  timeComplexity: { best: "O(V * E)", average: "O(V * E)", worst: "O(V * E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "DFS augmenting path algorithm runs once for each of V vertices, yielding O(V * E) runtime.",
    space:
      "Requires matching and visited arrays of size V, plus adjacency list taking O(V + E) memory.",
  },
  topicGuide: {
    overview:
      "By Gallai's Theorem, minimum path cover in a DAG equals V minus maximum bipartite matching in the split vertex graph.",
    sections: [
      {
        heading: "Bipartite Transformation",
        body: "Splitting each vertex u into out-node u_out and in-node u_in transforms path cover into maximum bipartite matching.",
      },
    ],
  },
  trivia: MINIMUM_PATH_COVER_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 20",
      label: "Competitive Programmer's Handbook, Ch 20",
    },
  ],
  defaultInput: DEFAULT_MINIMUM_PATH_COVER_INPUT,
  generateSteps: generateMinimumPathCoverSteps,
};
