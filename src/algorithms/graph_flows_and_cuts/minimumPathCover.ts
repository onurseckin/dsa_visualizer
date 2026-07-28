import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
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
  const validEdges = edges.filter(
    (e) => e.from >= 0 && e.from < numNodes && e.to >= 0 && e.to < numNodes,
  );
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const adj: number[][] = Array.from({ length: numNodes }, () => []);
  for (const e of validEdges) {
    adj[e.from].push(e.to);
  }

  const match = new Array<number>(numNodes).fill(-1);

  // Graph node layout in a clean circular arrangement
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

  const createSnapshot = (activeU?: number, activeV?: number): GraphVisualSnapshot => {
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
      nodes: nodes.map((node, i) => {
        let state: ElementState = "default";
        if (i === activeV) {
          state = "active";
        } else if (i === activeU) {
          state = "pivot";
        } else if (match[i] !== -1 || match.includes(i)) {
          state = "visited";
        }
        return {
          ...node,
          state,
        };
      }),
      edges: edgeItems,
    };
  };

  // Step 1: Initialize adjacency list
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize graph adjacency list for ${numNodes} vertices`,
      why: `Build adjacency structure with ${validEdges.length} directed edges to find minimum vertex-disjoint path cover.`,
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: { customState: { numNodes, edgeCount: validEdges.length } },
    variables: { n: numNodes, edge_count: validEdges.length },
  });

  // Step 2: Initialize match array
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize match array to [-1] for all vertices",
      why: "match[v] stores the predecessor node u matched to right-side vertex v. -1 denotes unmatched.",
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: { customState: { match: [...match] } },
    variables: { match: [...match] },
  });

  // Step 3: Initialize matching size counter
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: "Initialize matching_size = 0",
      why: "Tracks the size of maximum bipartite matching M*.",
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: { customState: { matchingSize: 0 } },
    variables: { matching_size: 0 },
  });

  const dfs = (u: number, visited: boolean[]): boolean => {
    for (const v of adj[u]) {
      // Step: Check neighbor v
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Check neighbor node ${v} from node ${u}`,
          why: `Evaluate node ${v} status (visited = ${visited[v]}) to find an augmenting path.`,
        },
        primarySnapshot: createSnapshot(u, v),
        auxiliaryState: { customState: { u, v, visited: [...visited] } },
        variables: { u, v, visited: [...visited] },
      });

      if (!visited[v]) {
        visited[v] = true;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 11,
          explanation: {
            what: `Mark node ${v} as visited`,
            why: `Prevents visiting node ${v} again within current DFS augmenting path search.`,
          },
          primarySnapshot: createSnapshot(u, v),
          auxiliaryState: { customState: { u, v, visited: [...visited] } },
          variables: { u, v, visited: [...visited] },
        });

        // Step: Check if v is free or match[v] can be re-routed
        const isFree = match[v] === -1;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 12,
          explanation: {
            what: `Check match status of node ${v} (match[${v}] = ${match[v]})`,
            why: isFree
              ? `Node ${v} is unmatched. Direct matching (${u} -> ${v}) is available.`
              : `Node ${v} is currently matched to node ${match[v]}. Recursively attempt to re-match node ${match[v]}.`,
          },
          primarySnapshot: createSnapshot(u, v),
          auxiliaryState: { customState: { u, v, currMatch: match[v] } },
          variables: { u, v, "match[v]": match[v] },
        });

        if (isFree || dfs(match[v], visited)) {
          match[v] = u;
          steps.push({
            stepIndex: stepIndex++,
            codeLine: 13,
            explanation: {
              what: `Match node ${u} -> node ${v} (set match[${v}] = ${u})`,
              why: isFree
                ? `Node ${v} was free. Successfully assigned edge (${u} -> ${v}) to matching.`
                : `Re-routed previous match for node ${v}. Assigned edge (${u} -> ${v}) to matching.`,
            },
            primarySnapshot: createSnapshot(u, v),
            auxiliaryState: { customState: { u, v, match: [...match] } },
            variables: { u, v, match: [...match] },
          });

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 14,
            explanation: {
              what: `Return True: Found augmenting path for node ${u}`,
              why: `DFS search successfully updated matching with edge (${u} -> ${v}).`,
            },
            primarySnapshot: createSnapshot(u, v),
            auxiliaryState: { customState: { u, v } },
            variables: { u, v, result: true },
          });
          return true;
        }
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Return False: No augmenting path found from node ${u}`,
        why: `All outgoing neighbors of node ${u} are either visited or cannot be re-routed.`,
      },
      primarySnapshot: createSnapshot(u),
      auxiliaryState: { customState: { u } },
      variables: { u, result: false },
    });
    return false;
  };

  let matchingSize = 0;
  for (let i = 0; i < numNodes; i++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Iterate to vertex i = ${i}`,
        why: `Search for an augmenting path starting from left-side vertex ${i}.`,
      },
      primarySnapshot: createSnapshot(i),
      auxiliaryState: { customState: { i, matchingSize } },
      variables: { i, matching_size: matchingSize },
    });

    const visited = new Array<boolean>(numNodes).fill(false);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Reset visited array for vertex i = ${i}`,
        why: `Fresh DFS traversal state required for each augmenting path search.`,
      },
      primarySnapshot: createSnapshot(i),
      auxiliaryState: { customState: { i, visited: [...visited] } },
      variables: { i, visited: [...visited] },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Execute DFS from vertex i = ${i}`,
        why: `Traverse DAG edges from node ${i} to augment matching size.`,
      },
      primarySnapshot: createSnapshot(i),
      auxiliaryState: { customState: { i } },
      variables: { i },
    });

    if (dfs(i, visited)) {
      matchingSize++;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 21,
        explanation: {
          what: `Augmenting path found for node ${i}. Increment matching_size to ${matchingSize}`,
          why: `Total edges in bipartite matching increased to ${matchingSize}.`,
        },
        primarySnapshot: createSnapshot(i),
        auxiliaryState: { customState: { i, matchingSize } },
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
      why: `Calculated N - Max Matching: ${numNodes} - ${matchingSize} = ${minPathCover} vertex-disjoint paths cover all vertices.`,
    },
    primarySnapshot: createSnapshot(),
    auxiliaryState: { customState: { minPathCover, matchingSize, numNodes } },
    variables: { result: minPathCover, matching_size: matchingSize, n: numNodes },
  });

  return steps;
};

const MINIMUM_PATH_COVER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines min_path_cover(n, edges) function to find min path cover in a DAG.",
    2: "Initializes adjacency list adj for n nodes.",
    3: "Iterates through each directed edge (u, v) in the input edges.",
    4: "Appends node v to u's adjacency list in the DAG.",
    6: "Initializes match array of length n with -1 (all right-side nodes initially unmatched).",
    8: "Defines recursive helper function dfs(u, visited) to find augmenting paths.",
    9: "Iterates over all outgoing neighbors v of node u in the DAG.",
    10: "Checks if node v has not been visited in the current DFS traversal.",
    11: "Marks node v as visited in the current DFS path search.",
    12: "Checks if v is unmatched (match[v] < 0) or if its current owner match[v] can be re-matched via DFS.",
    13: "Assigns u as the new match for node v (match[v] = u).",
    14: "Returns True to indicate an augmenting matching path was successfully found.",
    15: "Returns False if no augmenting path could be found starting from node u.",
    17: "Initializes matching_size counter to 0.",
    18: "Iterates through each vertex i from 0 to n - 1.",
    19: "Resets the visited boolean array for the new augmenting path search from vertex i.",
    20: "Attempts to find an augmenting path starting from vertex i.",
    21: "Increments matching_size by 1 when an augmenting path is successfully found.",
    23: "Calculates and returns n - matching_size (Minimum Path Cover per Gallai's Identity).",
  },
};

export const minimumPathCover: AlgorithmDefinition<MinimumPathCoverInput> = {
  id: "minimum-path-cover",
  title: "Minimum Path Cover in DAG",
  topicIds: ["graph_flows_and_cuts"],
  difficulty: "Hard",
  description:
    "Finds the minimum number of vertex-disjoint paths needed to cover all vertices in a Directed Acyclic Graph (DAG) using Maximum Bipartite Matching.\n\nGiven a Directed Acyclic Graph (DAG) with N vertices and M directed edges, a vertex-disjoint path cover is a set of paths such that every vertex in the graph belongs to exactly one path. By Gallai's Identity, finding the minimum number of paths is equivalent to constructing a bipartite graph by splitting each vertex u into u_out and u_in, computing the Maximum Bipartite Matching size M*, and evaluating N - M*.\n\n### Input Parameters\n- numNodes (number): The total count of vertices in the DAG (0 to N-1).\n- edges (list[DagEdge]): Directed edges {from, to} defining the DAG structure.\n\n### Output\n- number: The minimum number of vertex-disjoint paths required to cover all vertices.\n\n### Edge Cases & Constraints\n- Graph must be a DAG (no directed cycles).\n- Isolated vertices (degree 0) each require an independent path of length 0.\n- Entire graph as a single linear chain requires 1 path.\n- Dilworth's theorem relates path covers to maximal antichains in partially ordered sets.",
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
    time: "DFS augmenting path algorithm runs once for each of $V$ vertices, yielding $\\mathcal{O}(V \\cdot E)$ runtime.",
    space:
      "Requires matching and visited arrays of size $V$, plus adjacency list taking $\\mathcal{O}(V + E)$ memory.",
  },
  topicGuide: {
    overview:
      "**Minimum Path Cover** in a Directed Acyclic Graph (DAG) finds the minimum number of vertex-disjoint paths required to visit every vertex in the graph. By **Gallai's Theorem**, this combinatorial optimization problem reduces directly to finding the **Maximum Bipartite Matching** in a split-vertex bipartite graph.",
    sections: [
      {
        heading: "Bipartite Graph Reduction & Vertex Splitting",
        body: "To transform path covering into bipartite matching, each vertex $u$ in the original DAG is split into two vertices in a new bipartite graph: an output vertex $u_{\\text{out}}$ on the left side and an input vertex $u_{\\text{in}}$ on the right side. Every directed edge $u \\to v$ in the original DAG becomes a bipartite edge from $u_{\\text{out}}$ to $v_{\\text{in}}$.",
      },
      {
        heading: "Gallai's Identity & Mathematical Proof",
        body: "In a DAG, each matched edge in the bipartite graph corresponds to joining two path segments at a vertex. Initially, $N$ isolated paths cover the $N$ vertices. Each edge added to a valid path cover reduces the total path count by 1:\n$$\\text{Min Path Cover} = N - |M^*|$$\nSince paths must be vertex-disjoint, no vertex can have $\\text{in\\_degree} > 1$ or $\\text{out\\_degree} > 1$ in the path cover, matching the exact structural constraint of bipartite matching.",
      },
      {
        heading: "Dilworth's Theorem & General Path Covers",
        body: "**Dilworth's theorem** establishes a famous duality in order theory: in any finite partially ordered set (poset represented by a DAG), the size of the minimum general (non-disjoint) path cover equals the size of the **maximum antichain** (a set of mutually incomparable elements). For vertex-disjoint path covers on transitive DAGs, Dilworth's theorem directly applies.",
      },
      {
        heading: "Practical Systems Applications",
        body: "Minimum Path Cover algorithms schedule dependent tasks across parallel processors, optimize compiler instruction pipelines, plan robotic movement routes through DAG checkpoints, and analyze workflow concurrency in data engineering pipelines.",
      },
      {
        heading: "Complexity Analysis",
        body: "$$\\text{Time Complexity}: \\mathcal{O}(V \\cdot E)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **Matching Pass**: DFS-based augmenting path search (Kuhn's algorithm) takes $\\mathcal{O}(E)$ per vertex for $V$ vertices, yielding $\\mathcal{O}(V \\cdot E)$ total time.\n- **Space**: Adjacency lists and matching arrays consume $\\mathcal{O}(V + E)$ space.",
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
          "Mathematical identity stating that Minimum Path Cover equals $N - |M^*|$ (vertices minus Maximum Bipartite Matching size).",
      },
      {
        term: "Vertex Splitting",
        definition:
          "Transformation mapping each DAG node $u$ into dual nodes $u_{\\text{out}}$ and $u_{\\text{in}}$ to formulate bipartite matching.",
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
