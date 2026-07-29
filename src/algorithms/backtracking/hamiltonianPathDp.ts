import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
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
    1: "Helper build_adj defines function to construct undirected adjacency list from edge list.",
    2: "Initialize list of empty lists for all n vertices.",
    3: "Iterate through each undirected edge pair (u, v) in the input graph.",
    4: "Add vertex v to the adjacency list of vertex u.",
    5: "Add vertex u to the adjacency list of vertex v for undirected connectivity.",
    6: "Return the completed adjacency list.",
    7: "Blank line separating build_adj helper from main DP solver function.",
    8: "Signature: check if graph has a Hamiltonian path using Bitmask DP.",
    9: "Build adjacency list representation from graph edge list.",
    10: "Initialize DP table of size (1 << n) × n filled with False reachability flags.",
    11: "Iterate over every vertex u to initialize base cases.",
    12: "Base case: single vertex paths dp[1 << u][u] = True for each node starting its path.",
    13: "Blank line separating base case initialization from subset DP transitions.",
    14: "Iterate over all subset bitmasks of vertices from 1 to (1 << n) - 1.",
    15: "Iterate over every possible path ending vertex u.",
    16: "If state dp[mask][u] is False, skip since no valid path ends at u with visited set mask.",
    17: "Continue to next vertex u.",
    18: "Iterate over all graph neighbors v of vertex u.",
    19: "Check if node v is not yet visited in current bitmask (mask & (1 << v) == 0).",
    20: "Transition: set dp[mask | (1 << v)][v] = True to record valid extended path.",
    21: "Blank line separating DP iteration loops from final result computation.",
    22: "Full mask (1 << n) - 1 representing all n vertices visited.",
    23: "Check if any node u yields dp[full_mask][u] == True to determine global Hamiltonian path existence.",
  },
};

export const generateHamiltonianPathDpSteps = (input: HamiltonianPathInput): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_HAMILTONIAN_PATH_INPUT;
  const rawNumNodes = safeInput.numNodes ?? DEFAULT_HAMILTONIAN_PATH_INPUT.numNodes;
  const n = Math.max(2, Math.min(8, rawNumNodes));
  const rawEdges = Array.isArray(safeInput.edges)
    ? safeInput.edges
    : DEFAULT_HAMILTONIAN_PATH_INPUT.edges;
  const edgeList = rawEdges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const isCircuit = Boolean(safeInput.isCircuit);

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

  const dp: boolean[][] = Array.from({ length: 1 << n }, () => Array(n).fill(false));
  const parentMap = new Map<string, number>();

  // Step 1: Base cases
  for (let u = 0; u < n; u++) {
    dp[1 << u][u] = true;
    parentMap.set(`${1 << u}-${u}`, -1);
  }

  const getPathEdges = (targetMask: number, endNode: number): Set<string> => {
    const edgeSet = new Set<string>();
    if (endNode < 0) return edgeSet;
    let curr = endNode;
    let m = targetMask;
    while (curr !== -1) {
      const prev = parentMap.get(`${m}-${curr}`);
      if (prev === undefined || prev === -1) break;
      edgeSet.add(`${prev}-${curr}`);
      edgeSet.add(`${curr}-${prev}`);
      m = m ^ (1 << curr);
      curr = prev;
    }
    return edgeSet;
  };

  const buildGraphSnapshot = (mask: number, currNode: number) => {
    const activePathEdges = getPathEdges(mask, currNode);

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
      const isPath = activePathEdges.has(key1) || activePathEdges.has(key2);
      return {
        from: String(u),
        to: String(v),
        isPath,
        isTraversed: isPath,
      };
    });

    return { kind: "graph" as const, nodes, edges };
  };

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 12,
    explanation: {
      what: `Initialize Bitmask DP base cases for N = ${n} vertices.`,
      why: "Setting dp[1 << u][u] = True for each node u starting a path of length 1.",
    },
    primarySnapshot: buildGraphSnapshot(0, -1),
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
  let pathFound = false;
  let finalEndNode = -1;

  for (let mask = 1; mask <= fullMask; mask++) {
    for (let u = 0; u < n; u++) {
      if (!dp[mask][u]) continue;

      for (const v of adj[u]) {
        if ((mask & (1 << v)) === 0) {
          const nextMask = mask | (1 << v);
          if (!dp[nextMask][v]) {
            dp[nextMask][v] = true;
            parentMap.set(`${nextMask}-${v}`, u);
          }

          if (nextMask === fullMask) {
            if (!isCircuit || adj[v].includes(0)) {
              pathFound = true;
              finalEndNode = v;
            }
          }

          if (steps.length < 35) {
            steps.push({
              stepIndex: stepIdx++,
              codeLine: 20,
              explanation: {
                what: `Extend path from Node V${u} to unvisited Node V${v} (new mask ${nextMask.toString(2).padStart(n, "0")}).`,
                why: `Since V${v} is not yet in bitmask ${mask.toString(2).padStart(n, "0")}, we transition to dp[nextMask][${v}] = True.`,
              },
              primarySnapshot: buildGraphSnapshot(nextMask, v),
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
    codeLine: 23,
    explanation: {
      what: pathFound
        ? `Found valid Hamiltonian ${isCircuit ? "Circuit" : "Path"} ending at Node V${finalEndNode}!`
        : `No Hamiltonian ${isCircuit ? "Circuit" : "Path"} exists for this graph configuration.`,
      why: pathFound
        ? `dp[full_mask][${finalEndNode}] is True, confirming a path visiting all ${n} vertices.`
        : `All subset bitmasks evaluated without reaching a complete ${n}-vertex coverage state.`,
    },
    primarySnapshot: buildGraphSnapshot(fullMask, finalEndNode),
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
  topicIds: ["backtracking"],
  difficulty: "Hard",
  description:
    "<p>Determine whether an undirected graph contains a Hamiltonian Path (visiting every vertex exactly once) or Hamiltonian Circuit using Bitmask Dynamic Programming.</p><h3>Problem Statement</h3><p>Given an undirected graph with <code>N</code> vertices (labeled 0 to <code>N-1</code>) and a list of edges, determine whether there exists a Hamiltonian Path (a simple path visiting every vertex exactly once) or a Hamiltonian Circuit (a closed loop returning to the start vertex).</p><p>While brute-force depth-first search requires <code>O(N!)</code> factorial time, Bitmask Dynamic Programming (Held-Karp algorithm) optimizes state exploration to <code>O(2^N &middot; N^2)</code> by encoding visited vertex sets into binary bitmask integers.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>numNodes</code> (number of vertices), <code>edges</code> (edge pairs), and optional <code>isCircuit</code> boolean.</li><li><strong>Output:</strong> Boolean flag indicating whether a valid Hamiltonian path or circuit exists.</li></ul><h3>Constraints &amp; Edge Cases</h3><ul><li><code>1 &lt;= numNodes &lt;= 12</code></li><li><code>0 &lt;= edges.length &lt;= numNodes * (numNodes - 1) / 2</code></li><li>Disconnected components or isolated vertices correctly return False.</li></ul>",
  constraints: [
    "1 <= numNodes <= 12",
    "0 <= edges.length <= numNodes * (numNodes - 1) / 2",
    "0 <= u, v < numNodes with u != v",
  ],
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
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
          [4, 0],
        ],
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
        edges: [
          [0, 1],
          [0, 2],
        ],
        isCircuit: false,
      },
      output: "No path covers all 4 nodes",
      explanation: "Node 3 is isolated, making complete vertex coverage impossible.",
    },
  ],
  code: `def build_adj(n: int, edges: list[tuple[int, int]]) -> list[list[int]]:
    adj: list[list[int]] = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    return adj

def hamiltonian_path_dp(n: int, edges: list[tuple[int, int]]) -> bool:
    adj = build_adj(n, edges)
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
    time: "Bitmask DP iterates over 2^N subset masks, checking transitions across N nodes and their neighbors (up to N), yielding O(2^N * N^2) overall execution time.",
    space: "O(2^N * N) memory to store boolean reachability states for each (mask, endNode) pair.",
  },
  topicGuide: {
    overview:
      "<p>Finding a Hamiltonian Path is one of Karp's 21 classic NP-complete problems. While recursive backtracking requires exponential factorial time <code>O(N!)</code>, Dynamic Programming using bitmask representation (the Held-Karp algorithm paradigm) compresses intermediate subproblem state to run in <code>O(2^N &middot; N^2)</code>. Practical systems applications include robotic coverage path planning, printed circuit board (PCB) trace routing, and DNA sequence assembly.</p>",
    sections: [
      {
        heading: "Bitmask State Representation",
        body: "<p>Integer mask bit <code>i</code> represents whether vertex <code>i</code> has been visited (1) or not (0). State <code>dp[mask][u]</code> is True if and only if there exists a valid simple path visiting exactly the subset of vertices indicated by <code>mask</code> and ending at vertex <code>u</code>.</p>",
      },
      {
        heading: "DP Transitions & Bitwise Operations",
        body: "<p>To extend a path ending at node <code>u</code> with mask <code>mask</code> to an unvisited neighbor <code>v</code>, verify that <code>(mask &amp; (1 &lt;&lt; v)) == 0</code>. The next state becomes <code>dp[mask | (1 &lt;&lt; v)][v] = True</code>. Bitwise shifts and OR operations execute in single-cycle CPU instructions, maximizing cache locality and register throughput.</p>",
      },
      {
        heading: "Systems Applications & TSP",
        body: "<p>In VLSI microchip fabrication and CNC toolhead path optimization, minimizing movement costs while visiting specified coordinates reduces mechanical wear. Adding edge weights transforms Hamiltonian Path DP into the Traveling Salesperson Problem (TSP), where <code>dp[mask][u]</code> tracks the minimum path cost.</p>",
      },
      {
        heading: "Memory Footprint & Optimization Limits",
        body: "<p>For <code>N = 20</code>, storing states requires modest RAM, making Bitmask DP highly practical. However, for <code>N &gt; 30</code>, memory limits necessitate heuristic search methods such as Lin-Kernighan, A* search, or integer linear programming (ILP) branch-and-cut solvers.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Hamiltonian Path",
        definition: "A simple path in a graph that visits every vertex exactly once.",
      },
      {
        term: "Bitmask DP",
        definition:
          "Using binary bit representation of integers to index dynamic programming subproblem subsets.",
      },
      {
        term: "Held-Karp Algorithm",
        definition:
          "A dynamic programming algorithm that solves the Traveling Salesperson Problem / Hamiltonian Path in exponential O(2^N * N^2) time.",
      },
      {
        term: "NP-Completeness",
        definition:
          "The class of decision problems for which no polynomial-time algorithm is known, but solutions can be verified in polynomial time.",
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

export default hamiltonianPathDp;
