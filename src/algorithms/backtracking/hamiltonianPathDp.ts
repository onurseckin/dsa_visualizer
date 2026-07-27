import type { AlgorithmDefinition, AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface HamiltonianPathInput {
  numNodes: number;
  edges: [number, number][];
  isCircuit?: boolean;
}

export const DEFAULT_HAMILTONIAN_PATH_INPUT: HamiltonianPathInput = {
  numNodes: 4,
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [0, 2],
  ],
  isCircuit: false,
};

const HAMILTONIAN_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: check if graph has a Hamiltonian path using Bitmask DP.",
    2: "Initialize dp[mask][u] table where mask represents visited nodes set.",
    4: "Base case: single vertex path with mask (1 << u).",
    7: "Iterate over all bitmask subsets of vertices.",
    9: "Try extending path from vertex u to unvisited neighbor v.",
    13: "Check if any vertex has dp[(1 << N) - 1][u] == True (full coverage).",
  },
};

export const generateHamiltonianPathDpSteps = (
  input: HamiltonianPathInput,
): AlgorithmStep[] => {
  const n = Math.max(2, Math.min(8, input.numNodes));
  const edgeList = input.edges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const isCircuit = Boolean(input.isCircuit);

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edgeList) {
    adj[u].push(v);
    adj[v].push(u);
  }

  // Pre-calculate node positions on a circle
  const nodePositions = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: 200 + 120 * Math.cos(angle),
      y: 180 + 120 * Math.sin(angle),
    };
  });

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildGraphSnapshot = (
    mask: number,
    currNode: number,
    pathEdges: Set<string>,
  ) => {
    const nodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
      const isVisited = (mask & (1 << i)) !== 0;
      const isActive = i === currNode;
      return {
        id: String(i),
        label: `V${i}`,
        x: nodePositions[i].x,
        y: nodePositions[i].y,
        state: isActive ? "active" : isVisited ? "visited" : "default",
        val: i,
      };
    });

    const edges: GraphEdgeItem[] = edgeList.map(([u, v]) => {
      const key1 = `${u}-${v}`;
      const key2 = `${v}-${u}`;
      const isPath = pathEdges.has(key1) || pathEdges.has(key2);
      return {
        from: String(u),
        to: String(v),
        isPath,
        isTraversed: isPath,
      };
    });

    return { kind: "graph" as const, nodes, edges };
  };

  const dp: boolean[][] = Array.from({ length: 1 << n }, () => Array(n).fill(false));

  // Step 1: Base cases
  for (let u = 0; u < n; u++) {
    dp[1 << u][u] = true;
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Initialized Bitmask DP base cases: single-node paths for all ${n} vertices.`,
      why: "dp[1 << u][u] = True for each vertex u starting its own path.",
    },
    primarySnapshot: buildGraphSnapshot(0, -1, new Set()),
    auxiliaryState: {
      customState: {
        "Active Mask": "0000 (Base)",
        "Nodes Visited": "1 at a time",
      },
    },
    variables: {
      numNodes: n,
      fullMask: (1 << n) - 1,
    },
  });

  const fullMask = (1 << n) - 1;
  const pathEdges = new Set<string>();
  let pathFound = false;
  let finalEndNode = -1;

  for (let mask = 1; mask <= fullMask; mask++) {
    for (let u = 0; u < n; u++) {
      if (!dp[mask][u]) continue;

      for (const v of adj[u]) {
        if ((mask & (1 << v)) === 0) {
          const nextMask = mask | (1 << v);
          dp[nextMask][v] = true;
          pathEdges.add(`${u}-${v}`);

          if (nextMask === fullMask) {
            if (!isCircuit || adj[v].includes(0)) {
              pathFound = true;
              finalEndNode = v;
            }
          }

          if (steps.length < 25) {
            steps.push({
              stepIndex: stepIdx++,
              codeLine: 9,
              explanation: {
                what: `Extended path from V${u} to V${v}. New mask: binary ${nextMask.toString(2).padStart(n, "0")}.`,
                why: `v=V${v} was unvisited in mask ${mask.toString(2)}. Set dp[nextMask][${v}] = True.`,
              },
              primarySnapshot: buildGraphSnapshot(nextMask, v, pathEdges),
              auxiliaryState: {
                customState: {
                  "Mask Binary": nextMask.toString(2).padStart(n, "0"),
                  "Current End Node": `V${v}`,
                  "Edge Added": `V${u} -> V${v}`,
                },
              },
              variables: {
                mask: nextMask,
                currNode: v,
                prevNode: u,
              },
            });
          }
        }
      }
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 13,
    explanation: {
      what: pathFound
        ? `Found valid Hamiltonian ${isCircuit ? "Circuit" : "Path"} ending at V${finalEndNode}!`
        : `No Hamiltonian ${isCircuit ? "Circuit" : "Path"} exists for this graph.`,
      why: pathFound
        ? `dp[${fullMask}][${finalEndNode}] is True, meaning all ${n} vertices were visited.`
        : `dp[${fullMask}] had no reachable end state visiting all ${n} nodes.`,
    },
    primarySnapshot: buildGraphSnapshot(fullMask, finalEndNode, pathEdges),
    auxiliaryState: {
      customState: {
        Result: pathFound ? "Path Found!" : "No Path Exists",
        "Full Mask": fullMask.toString(2).padStart(n, "0"),
      },
    },
    variables: {
      pathFound,
      fullMask,
    },
  });

  return steps;
};

export const hamiltonianPathDp: AlgorithmDefinition<HamiltonianPathInput> = {
  id: "hamiltonian-path-dp",
  title: "Hamiltonian Path & Circuit (Bitmask DP)",
  category: "backtracking",
  difficulty: "Hard",
  description:
    "A Hamiltonian Path is a path in an undirected or directed graph that visits every vertex exactly once. This algorithm computes whether a Hamiltonian Path or Circuit exists using Bitmask Dynamic Programming, reducing the brute-force O(N!) factorial search to O(2^N * N^2) time.",
  constraints: ["1 <= N <= 12", "0 <= E <= N*(N-1)/2"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "4 nodes, 5 edges",
      outputDisplay: "Hamiltonian Path exists",
      title: "4-node Connected Graph",
      input: DEFAULT_HAMILTONIAN_PATH_INPUT,
      output: "Valid path visiting 0->1->2->3",
      explanation: "All 4 nodes visited in a single continuous simple path.",
    },
    {
      kind: "complex",
      inputDisplay: "5 nodes cycle graph",
      outputDisplay: "Hamiltonian Circuit exists",
      title: "5-node Cycle",
      input: {
        numNodes: 5,
        edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
        isCircuit: true,
      },
      output: "Valid circuit found",
      explanation: "Cycle graph has a trivial Hamiltonian circuit.",
    },
    {
      kind: "negative",
      inputDisplay: "4 nodes disconnected graph",
      outputDisplay: "No Hamiltonian Path",
      title: "Disconnected Star Graph",
      input: {
        numNodes: 4,
        edges: [[0, 1], [0, 2]],
        isCircuit: false,
      },
      output: "No path covers all 4 nodes",
      explanation: "Node 3 is isolated, making complete vertex coverage impossible.",
    },
  ],
  code: `def hamiltonian_path_dp(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    dp = [[False] * n for _ in range(1 << n)]
    for u in range(n):
        dp[1 << u][u] = True

    for mask in range(1, 1 << n):
        for u in range(n):
            if not dp[mask][u]:
                continue
            for v in adj[u]:
                if not (mask & (1 << v)):
                    dp[mask | (1 << v)][v] = True

    full_mask = (1 << n) - 1
    return any(dp[full_mask][u] for u in range(n))`,
  timeComplexity: {
    best: "O(2^N * N^2)",
    average: "O(2^N * N^2)",
    worst: "O(2^N * N^2)",
  },
  spaceComplexity: "O(2^N * N)",
  complexityAnalysis: {
    time: "Bitmask DP iterates over 2^N subset masks, checking transitions across N nodes and their neighbors (N), yielding O(2^N * N^2) overall time.",
    space: "O(2^N * N) memory to store boolean reachability states for each (mask, endNode) pair.",
  },
  topicGuide: {
    overview:
      "Finding a Hamiltonian path is NP-complete. Dynamic Programming using bitwise bitmasks allows holding intermediate state (visited subset bitmask, current endpoint), speeding up search over plain recursion.",
    sections: [
      {
        heading: "Bitmask State Representation",
        body: "Integer mask bit i represents whether node i has been visited (1) or not (0). dp[mask][u] stores whether subset mask can end at node u.",
      },
    ],
    keyTerms: [
      {
        term: "Hamiltonian Path",
        definition: "A path in a graph visiting every vertex exactly once.",
      },
      {
        term: "Bitmask DP",
        definition: "Using bitwise integer representations as DP states for subset subproblems.",
      },
    ],
  },
  trivia: HAMILTONIAN_TRIVIA,
  generateSteps: generateHamiltonianPathDpSteps,
    sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 19",
      label: "Competitive Programmer's Handbook, Ch 19",
    },
  ],
  defaultInput: DEFAULT_HAMILTONIAN_PATH_INPUT,
};
