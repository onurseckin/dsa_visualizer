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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Hamiltonian Path is a simple path in an undirected graph that visits every vertex exactly once; a Hamiltonian Circuit is a closed path returning to the start vertex.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "v0", label: "V0", x: 100, y: 100, state: "visited" },
        { id: "v1", label: "V1", x: 250, y: 100, state: "visited" },
        { id: "v2", label: "V2", x: 250, y: 250, state: "visited" },
        { id: "v3", label: "V3", x: 100, y: 250, state: "active" },
      ],
      edges: [
        { from: "v0", to: "v1", isPath: true, isTraversed: true },
        { from: "v1", to: "v2", isPath: true, isTraversed: true },
        { from: "v2", to: "v3", isPath: true, isTraversed: true },
        { from: "v3", to: "v0", isPath: false },
      ],
    },
  },
  {
    narrative:
      "Finding a Hamiltonian path is NP-complete; testing all N! vertex permutation paths in brute-force order causes exponential runtime explosion.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_contrast",
      mode: "box",
      elements: [
        { id: "c1", value: "Brute-Force Permutations: O(N!)", state: "compare" },
        { id: "c2", value: "Bitmask Dynamic Programming: O(2^N * N^2)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "An N-bit integer mask represents the subset of visited vertices, where bit i = 1 means vertex Vi is in the current path.",
    primarySnapshot: {
      kind: "bitmask",
      name: "visited_mask",
      value: 7,
      bitWidth: 4,
      label: "Visited Bitmask (0111₂ = {V0, V1, V2})",
      bits: [
        { index: 0, value: 1, label: "V0", state: "active" },
        { index: 1, value: 1, label: "V1", state: "active" },
        { index: 2, value: 1, label: "V2", state: "active" },
        { index: 3, value: 0, label: "V3", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We define boolean state dp[mask][u] as true if there exists a valid simple path visiting the subset of vertices in mask and ending at vertex u.",
    primarySnapshot: {
      kind: "array",
      name: "dp_state",
      mode: "box",
      elements: [
        { id: "d1", value: "dp[mask][u] = True", label: "Valid path ends at u", state: "sorted" },
        {
          id: "d2",
          value: "dp[mask][u] = False",
          label: "Unreachable path state",
          state: "default",
        },
      ],
    },
  },
  {
    narrative:
      "Base cases: for every vertex u, dp[1 << u][u] = true, representing a single-vertex path of length 1 starting at node u.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "v0", label: "V0", x: 100, y: 100, state: "sorted" },
        { id: "v1", label: "V1", x: 250, y: 100, state: "sorted" },
        { id: "v2", label: "V2", x: 250, y: 250, state: "sorted" },
        { id: "v3", label: "V3", x: 100, y: 250, state: "sorted" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "To extend a path ending at vertex u (dp[mask][u] == true) to an unvisited neighbor v (bit v = 0), we set dp[mask | (1 << v)][v] = true.",
    primarySnapshot: {
      kind: "array",
      name: "transition",
      mode: "box",
      elements: [
        { id: "t1", value: "dp[mask][u] == True", state: "visited" },
        { id: "t2", value: "Neighbor v unvisited", state: "compare" },
        { id: "t3", value: "-> dp[mask | (1<<v)][v] = True", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "A complete Hamiltonian path is found if dp[(1 << N) - 1][u] is true for any endpoint vertex u.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "v0", label: "V0", x: 100, y: 100, state: "visited" },
        { id: "v1", label: "V1", x: 250, y: 100, state: "visited" },
        { id: "v2", label: "V2", x: 250, y: 250, state: "visited" },
        { id: "v3", label: "V3", x: 100, y: 250, state: "sorted" },
      ],
      edges: [
        { from: "v0", to: "v1", isPath: true, isTraversed: true },
        { from: "v1", to: "v2", isPath: true, isTraversed: true },
        { from: "v2", to: "v3", isPath: true, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Bitmask DP evaluates Hamiltonian paths in O(2^N * N^2) time and O(2^N * N) space, making exact verification practical for graphs up to N = 20 nodes.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "Time: O(2^N * N^2)", state: "sorted" },
        { id: "s2", value: "Space: O(2^N * N)", state: "default" },
      ],
    },
  },
];

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

  const nodePositions = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: Math.round(200 + 120 * Math.cos(angle)),
      y: Math.round(180 + 120 * Math.sin(angle)),
    };
  });

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.numNodes === DEFAULT_HAMILTONIAN_PATH_INPUT.numNodes &&
      Array.isArray(input.edges) &&
      input.edges.length === DEFAULT_HAMILTONIAN_PATH_INPUT.edges.length &&
      input.edges.every(
        (e, idx) =>
          e[0] === DEFAULT_HAMILTONIAN_PATH_INPUT.edges[idx][0] &&
          e[1] === DEFAULT_HAMILTONIAN_PATH_INPUT.edges[idx][1],
      ));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const dp: boolean[][] = Array.from({ length: 1 << n }, () => Array(n).fill(false));

  const makeGraphSnapshot = (
    activeMask: number,
    activeEndNode: number,
    highlightResult = false,
  ): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
      const isVisited = (activeMask & (1 << i)) !== 0;
      const isActive = i === activeEndNode;
      return {
        id: String(i),
        label: `V${i}`,
        x: nodePositions[i].x,
        y: nodePositions[i].y,
        state:
          highlightResult && isVisited
            ? "sorted"
            : isActive
              ? "active"
              : isVisited
                ? "visited"
                : "default",
      };
    });

    const edges: GraphEdgeItem[] = edgeList.map(([u, v]) => {
      const isUTrapped = (activeMask & (1 << u)) !== 0;
      const isVTrapped = (activeMask & (1 << v)) !== 0;
      const isPath = isUTrapped && isVTrapped && (u === activeEndNode || v === activeEndNode);
      return {
        from: String(u),
        to: String(v),
        isPath,
        isTraversed: isPath,
      };
    });

    return { kind: "graph", directed: false, nodes, edges };
  };

  addStep(
    `Initializing Hamiltonian ${isCircuit ? "Circuit" : "Path"} Bitmask DP for graph with ${n} vertices.`,
    makeGraphSnapshot(0, -1),
  );

  for (let u = 0; u < n; u++) {
    dp[1 << u][u] = true;
  }

  addStep(
    `Setting base cases: dp[1 << u][u] = true for all single vertices V0..V${n - 1}.`,
    makeGraphSnapshot(1, 0),
  );

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
            addStep(
              `Extending path from Node V${u} to unvisited neighbor V${v}: updating bitmask ${mask.toString(2)}₂ -> ${nextMask.toString(2)}₂, setting dp[${nextMask.toString(2)}₂][${v}] = true.`,
              makeGraphSnapshot(nextMask, v),
            );
          }

          if (nextMask === fullMask) {
            if (!isCircuit || adj[v].includes(0)) {
              pathFound = true;
              finalEndNode = v;
            }
          }
        }
      }
    }
  }

  addStep(
    pathFound
      ? `Completed Hamiltonian ${isCircuit ? "Circuit" : "Path"} evaluation: found valid path visiting all ${n} vertices ending at Node V${finalEndNode}.`
      : `Completed Hamiltonian evaluation: no valid path visiting all ${n} vertices exists.`,
    makeGraphSnapshot(fullMask, finalEndNode, true),
  );

  return steps;
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

export const hamiltonianPathDp: AlgorithmDefinition<HamiltonianPathInput> = {
  id: "hamiltonian-path-dp",
  title: "Hamiltonian Path & Circuit (Bitmask DP)",
  topicIds: ["backtracking"],
  difficulty: "Hard",
  description:
    "<p>Given an undirected graph with <code>N</code> vertices and a list of edges, determine whether there exists a Hamiltonian Path (a simple path visiting every vertex exactly once) or a Hamiltonian Circuit (a closed loop returning to the start vertex).</p><p><strong>Input:</strong> Number of vertices <code>numNodes</code>, 2D array of edge pairs <code>edges</code>, and optional boolean <code>isCircuit</code>.</p><p><strong>Output:</strong> A boolean flag returning <code>true</code> if a valid Hamiltonian path or circuit exists, and <code>false</code> otherwise.</p>",
  constraints: [
    "1 <= numNodes <= 12",
    "0 <= edges.length <= numNodes * (numNodes - 1) / 2",
    "0 <= u, v < numNodes with u != v",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "4 nodes, 5 edges",
      outputDisplay: "Hamiltonian Path exists",
      title: "Standard 4-Node Connected Graph",
      input: DEFAULT_HAMILTONIAN_PATH_INPUT,
      output: "Valid path visiting 0->1->2->3",
      explanation: "All 4 nodes visited in a single continuous simple path.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "5 nodes cycle graph",
      outputDisplay: "Hamiltonian Circuit exists",
      title: "Adversarial 5-Node Cycle",
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
      scenario: "boundary",
      inputDisplay: "4 nodes disconnected graph",
      outputDisplay: "No Hamiltonian Path",
      title: "Disconnected Graph Boundary",
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
    ],
  },
  trivia: HAMILTONIAN_TRIVIA,
  generateSteps: generateHamiltonianPathDpSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 19,
      label: "Competitive Programmer's Handbook, Ch 19",
    },
  ],
  defaultInput: DEFAULT_HAMILTONIAN_PATH_INPUT,
};

export default hamiltonianPathDp;
