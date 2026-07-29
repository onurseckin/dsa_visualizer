import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Minimum Path Cover in a Directed Acyclic Graph (DAG) finds the minimum number of vertex-disjoint directed paths needed to cover every vertex.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "Node 0", state: "active" },
        { id: "node-1", label: "Node 1", state: "default" },
        { id: "node-2", label: "Node 2", state: "default" },
        { id: "node-3", label: "Node 3", state: "default" },
        { id: "node-4", label: "Node 4", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1" },
        { from: "node-1", to: "node-2" },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4" },
      ],
    },
  },
  {
    narrative:
      "Without any path edges, N isolated single-vertex paths are required to cover N vertices, providing the initial baseline.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "Path 1", state: "visited" },
        { id: "node-1", label: "Path 2", state: "visited" },
        { id: "node-2", label: "Path 3", state: "visited" },
        { id: "node-3", label: "Path 4", state: "visited" },
        { id: "node-4", label: "Path 5", state: "visited" },
      ],
      edges: [
        { from: "node-0", to: "node-1" },
        { from: "node-1", to: "node-2" },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4" },
      ],
    },
  },
  {
    narrative:
      "Adding a directed edge u -> v to a path cover merges two separate path segments into one longer path, reducing total path count by 1.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "Node 0", state: "visited" },
        { id: "node-1", label: "Node 1", state: "visited" },
        { id: "node-2", label: "Node 2", state: "default" },
        { id: "node-3", label: "Node 3", state: "default" },
        { id: "node-4", label: "Node 4", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", isPath: true },
        { from: "node-1", to: "node-2" },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4" },
      ],
    },
  },
  {
    narrative:
      "The vertex-disjoint constraint dictates that no vertex may have in-degree > 1 or out-degree > 1 within the selected path cover edges.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "Node 0 (out <= 1)", state: "active" },
        { id: "node-1", label: "Node 1", state: "visited" },
        { id: "node-2", label: "Node 2", state: "default" },
        { id: "node-3", label: "Node 3 (in <= 1)", state: "compare" },
        { id: "node-4", label: "Node 4", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", isPath: true },
        { from: "node-1", to: "node-2" },
        { from: "node-0", to: "node-3", isTraversed: true },
        { from: "node-3", to: "node-4" },
      ],
    },
  },
  {
    narrative:
      "Vertex splitting transforms each DAG node u into dual nodes u_out (left) and u_in (right) of a bipartite matching graph.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "0_out", state: "active" },
        { id: "node-1", label: "1_in", state: "compare" },
        { id: "node-2", label: "2_in", state: "compare" },
        { id: "node-3", label: "3_in", state: "compare" },
        { id: "node-4", label: "4_in", state: "compare" },
      ],
      edges: [
        { from: "node-0", to: "node-1" },
        { from: "node-1", to: "node-2" },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4" },
      ],
    },
  },
  {
    narrative:
      "Every directed edge u -> v in the original DAG maps to a bipartite matching edge connecting u_out to v_in.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "0_out", state: "visited" },
        { id: "node-1", label: "1_in", state: "visited" },
        { id: "node-2", label: "2_in", state: "default" },
        { id: "node-3", label: "3_in", state: "default" },
        { id: "node-4", label: "4_in", state: "default" },
      ],
      edges: [
        { from: "node-0", to: "node-1", isTraversed: true },
        { from: "node-1", to: "node-2" },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4" },
      ],
    },
  },
  {
    narrative:
      "Computing the Maximum Bipartite Matching M* maximizes the number of path edge merges without exceeding degree limits.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "0_out", state: "sorted" },
        { id: "node-1", label: "1_in", state: "sorted" },
        { id: "node-2", label: "2_in", state: "sorted" },
        { id: "node-3", label: "3_out", state: "sorted" },
        { id: "node-4", label: "4_in", state: "sorted" },
      ],
      edges: [
        { from: "node-0", to: "node-1", isPath: true },
        { from: "node-1", to: "node-2", isPath: true },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Gallai's Identity proves that Minimum Path Cover size equals N - |M*| (total vertices minus maximum matching size).",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "Path 1", state: "sorted" },
        { id: "node-1", label: "Path 1", state: "sorted" },
        { id: "node-2", label: "Path 1", state: "sorted" },
        { id: "node-3", label: "Path 2", state: "swap" },
        { id: "node-4", label: "Path 2", state: "swap" },
      ],
      edges: [
        { from: "node-0", to: "node-1", isPath: true },
        { from: "node-1", to: "node-2", isPath: true },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Kuhn's augmenting path algorithm solves Maximum Bipartite Matching in O(V * E) time and O(V + E) memory space.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "node-0", label: "Cover: 2", state: "sorted" },
        { id: "node-1", label: "Node 1", state: "sorted" },
        { id: "node-2", label: "Node 2", state: "sorted" },
        { id: "node-3", label: "Node 3", state: "sorted" },
        { id: "node-4", label: "Node 4", state: "sorted" },
      ],
      edges: [
        { from: "node-0", to: "node-1", isPath: true },
        { from: "node-1", to: "node-2", isPath: true },
        { from: "node-0", to: "node-3" },
        { from: "node-3", to: "node-4", isPath: true },
      ],
    },
  },
];

export const generateMinimumPathCoverSteps = (input: MinimumPathCoverInput): AlgorithmStep[] => {
  const numNodes = Math.max(1, input?.numNodes ?? DEFAULT_MINIMUM_PATH_COVER_INPUT.numNodes);
  const edges = input?.edges ?? DEFAULT_MINIMUM_PATH_COVER_INPUT.edges;
  const validEdges = edges.filter(
    (e) => e.from >= 0 && e.from < numNodes && e.to >= 0 && e.to < numNodes,
  );
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
  const adj: number[][] = Array.from({ length: numNodes }, () => []);
  for (const e of validEdges) {
    adj[e.from].push(e.to);
  }

  const match = new Array<number>(numNodes).fill(-1);

  const nodes: GraphNodeItem[] = Array.from({ length: numNodes }, (_, i) => {
    const angle = (2 * Math.PI * i) / numNodes - Math.PI / 2;
    return {
      id: `node-${i}`,
      label: `Node ${i}`,
      x: Math.round(200 + 130 * Math.cos(angle)),
      y: Math.round(180 + 110 * Math.sin(angle)),
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

  const createSnapshot = (
    activeU?: number,
    activeV?: number,
    overrideState?: "active" | "swap" | "compare" | "sorted",
  ): GraphVisualSnapshot => {
    const matchedSet = getMatchedEdgeSet();
    const edgeItems: GraphEdgeItem[] = validEdges.map((e) => {
      const key = `${e.from}->${e.to}`;
      const isMatched = matchedSet.has(key);
      const isActive = e.from === activeU && e.to === activeV;
      return {
        from: `node-${e.from}`,
        to: `node-${e.to}`,
        isPath: isMatched,
        isTraversed: isMatched || isActive,
      };
    });

    return {
      kind: "graph",
      directed: true,
      nodes: nodes.map((node, i) => {
        let state: ElementState = overrideState ?? "default";
        if (!overrideState) {
          if (i === activeV) {
            state = "compare";
          } else if (i === activeU) {
            state = "active";
          } else if (match[i] !== -1 || match.includes(i)) {
            state = "visited";
          }
        }
        return {
          ...node,
          state,
        };
      }),
      edges: edgeItems,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing bipartite matching for ${numNodes} vertices and ${validEdges.length} DAG edges.`,
      primarySnapshot: createSnapshot(undefined, undefined, "active"),
      variables: { numNodes, edgeCount: validEdges.length, matchingSize: 0 },
    }),
  );

  const dfs = (u: number, visited: boolean[]): boolean => {
    for (const v of adj[u]) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `DFS testing candidate edge Node ${u} -> Node ${v}.`,
          primarySnapshot: createSnapshot(u, v),
          variables: { u, v, visited: visited[v] },
        }),
      );

      if (!visited[v]) {
        visited[v] = true;
        const isFree = match[v] === -1;

        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: isFree
              ? `Node ${v} is unmatched. Direct matching Node ${u} -> Node ${v} is available.`
              : `Node ${v} is currently matched to Node ${match[v]}. Attempting to re-route Node ${match[v]}.`,
            primarySnapshot: createSnapshot(u, v, "swap"),
            variables: { u, v, currentMatch: match[v] },
          }),
        );

        if (isFree || dfs(match[v], visited)) {
          match[v] = u;
          steps.push(
            createTutorialStep({
              stepIndex: stepIndex++,
              phase: "walkthrough",
              narrative: `Matched Node ${u} -> Node ${v} (set match[${v}] = ${u}). Augmenting path search succeeded!`,
              primarySnapshot: createSnapshot(u, v, "sorted"),
              variables: { u, v, updatedMatch: u },
            }),
          );
          return true;
        }
      }
    }
    return false;
  };

  let matchingSize = 0;
  for (let i = 0; i < numNodes; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Searching for an augmenting path starting from vertex ${i}.`,
        primarySnapshot: createSnapshot(i),
        variables: { currentVertex: i, matchingSize },
      }),
    );

    const visited = new Array<boolean>(numNodes).fill(false);
    if (dfs(i, visited)) {
      matchingSize++;
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Found augmenting path for vertex ${i}. Incremented maximum bipartite matching size to ${matchingSize}.`,
          primarySnapshot: createSnapshot(i, undefined, "swap"),
          variables: { i, matchingSize },
        }),
      );
    }
  }

  const minPathCover = numNodes - matchingSize;
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Minimum Path Cover complete. By Gallai's Identity: N - |M*| = ${numNodes} - ${matchingSize} = ${minPathCover} vertex-disjoint paths cover all vertices.`,
      primarySnapshot: createSnapshot(undefined, undefined, "sorted"),
      variables: { completed: true, minPathCover, matchingSize, totalNodes: numNodes },
    }),
  );

  return steps;
};

const MINIMUM_PATH_COVER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines min_path_cover(n, edges) function to find min path cover in a DAG.",
    2: "Initializes adjacency list adj for n nodes.",
    3: "Iterates through each directed edge (u, v) in the input edges.",
    4: "Appends node v to u's adjacency list in the DAG.",
    6: "Initializes match array of length n with -1.",
    8: "Defines recursive helper function dfs(u, visited) to find augmenting paths.",
    9: "Iterates over all outgoing neighbors v of node u in the DAG.",
    10: "Checks if node v has not been visited in current DFS.",
    11: "Marks node v as visited in current DFS path search.",
    12: "Checks if v is unmatched or if its owner match[v] can be re-matched.",
    13: "Assigns u as the new match for node v (match[v] = u).",
    14: "Returns True to indicate an augmenting path was found.",
    15: "Returns False if no augmenting path could be found.",
    17: "Initializes matching_size counter to 0.",
    18: "Iterates through each vertex i from 0 to n - 1.",
    19: "Resets visited boolean array.",
    20: "Attempts to find an augmenting path starting from vertex i.",
    21: "Increments matching_size when augmenting path is found.",
    23: "Returns n - matching_size per Gallai's Identity.",
  },
};

export const minimumPathCover: AlgorithmDefinition<MinimumPathCoverInput> = {
  id: "minimum-path-cover",
  title: "Minimum Path Cover in DAG",
  topicIds: ["graph_flows_and_cuts"],
  difficulty: "Hard",
  description:
    "<p>Given a Directed Acyclic Graph (DAG) <code>G = (V, E)</code>, find the minimum number of vertex-disjoint directed paths needed to cover every vertex in the graph.</p><h3>Problem Statement</h3><p>Compute the Minimum Path Cover size using Gallai's Identity <code>N - |M*|</code>, where <code>N</code> is the number of vertices and <code>|M*|</code> is the Maximum Bipartite Matching size obtained by splitting each vertex into Dual in/out nodes.</p><h3>Input Parameters</h3><ul><li><code>numNodes</code>: Total number of vertices in the DAG.</li><li><code>edges</code>: Array of directed edges <code>(from, to)</code>.</li></ul><h3>Output</h3><p>Returns the minimum number of vertex-disjoint paths covering all vertices.</p>",
  constraints: ["1 <= V <= 10", "0 <= E <= 20"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "5 nodes DAG (0->1->2, 0->3->4)",
      outputDisplay: "Minimum Paths = 2",
      title: "Standard 5-Node DAG",
      input: DEFAULT_MINIMUM_PATH_COVER_INPUT,
      output: "2",
      explanation: "Covered by 2 paths: 0->1->2 and 3->4.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "6 nodes with overlapping paths",
      outputDisplay: "Minimum Paths = 2",
      title: "Adversarial 6-Node DAG",
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
      scenario: "boundary",
      inputDisplay: "4 isolated nodes (0 edges)",
      outputDisplay: "Minimum Paths = 4",
      title: "Boundary Isolated Nodes",
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
      "<p><strong>Minimum Path Cover</strong> in a Directed Acyclic Graph (DAG) finds the minimum number of vertex-disjoint paths required to visit every vertex in the graph. By <strong>Gallai's Theorem</strong>, this combinatorial optimization problem reduces directly to finding the <strong>Maximum Bipartite Matching</strong> in a split-vertex bipartite graph.</p>",
    sections: [
      {
        heading: "Bipartite Graph Reduction & Vertex Splitting",
        body: "<p>To transform path covering into bipartite matching, each vertex <em>u</em> in the original DAG is split into two vertices in a new bipartite graph: an output vertex <code>u<sub>out</sub></code> on the left side and an input vertex <code>u<sub>in</sub></code> on the right side. Every directed edge <code>u &rarr; v</code> in the original DAG becomes a bipartite edge from <code>u<sub>out</sub></code> to <code>v<sub>in</sub></code>.</p>",
      },
      {
        heading: "Gallai's Identity & Mathematical Proof",
        body: "<p>In a DAG, each matched edge in the bipartite graph corresponds to joining two path segments at a vertex. Initially, <code>N</code> isolated paths cover the <code>N</code> vertices. Each edge added to a valid path cover reduces the total path count by 1: <code>Min Path Cover = N - |M*|</code>. Since paths must be vertex-disjoint, no vertex can have in-degree &gt; 1 or out-degree &gt; 1 in the path cover, matching the structural constraint of bipartite matching.</p>",
      },
      {
        heading: "Dilworth's Theorem & General Path Covers",
        body: "<p><strong>Dilworth's theorem</strong> establishes a famous duality in order theory: in any finite partially ordered set (poset represented by a DAG), the size of the minimum general (non-disjoint) path cover equals the size of the <strong>maximum antichain</strong> (a set of mutually incomparable elements). For vertex-disjoint path covers on transitive DAGs, Dilworth's theorem directly applies.</p>",
      },
      {
        heading: "Practical Systems Applications",
        body: "<p>Minimum Path Cover algorithms schedule dependent tasks across parallel processors, optimize compiler instruction pipelines, plan robotic movement routes through DAG checkpoints, and analyze workflow concurrency in data engineering pipelines.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(V &middot; E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code><br/>DFS-based augmenting path search (Kuhn's algorithm) takes <code>O(E)</code> per vertex for <code>V</code> vertices, yielding <code>O(V &middot; E)</code> total time.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Minimum Path Cover",
        definition:
          "The smallest set of vertex-disjoint directed paths needed to visit all vertices of a DAG.",
      },
      {
        term: "Gallai's Identity",
        definition:
          "Mathematical identity stating that Minimum Path Cover equals N - |M*| (vertices minus Maximum Bipartite Matching size).",
      },
      {
        term: "Vertex Splitting",
        definition:
          "Transformation mapping each DAG node u into dual nodes u_out and u_in to formulate bipartite matching.",
      },
      {
        term: "Dilworth's Theorem",
        definition:
          "Theorem relating minimum path cover size to maximum antichain size in partially ordered sets.",
      },
      {
        term: "Augmenting Path Matching",
        definition:
          "Algorithmic technique for finding maximum bipartite matching via alternating DFS/BFS path extensions.",
      },
    ],
  },
  trivia: MINIMUM_PATH_COVER_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 20,
      label: "Competitive Programmer's Handbook, Ch 20",
    },
  ],
  defaultInput: DEFAULT_MINIMUM_PATH_COVER_INPUT,
  generateSteps: generateMinimumPathCoverSteps,
};

export default minimumPathCover;
