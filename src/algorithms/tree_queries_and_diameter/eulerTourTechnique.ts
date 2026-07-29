import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TreeNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface EulerTourInput {
  numNodes: number;
  edges: [number, number][];
  values?: number[];
}

export const DEFAULT_EULER_TOUR_INPUT: EulerTourInput = {
  numNodes: 5,
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
  ],
  values: [10, 20, 30, 40, 50],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Euler Tour Technique flattens a 2D tree topology into a linear 1D array using DFS entry (tin) and exit (tout) timestamps.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "active" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "default" },
        { id: "2", val: 30, state: "default" },
        { id: "3", val: 40, state: "default" },
        { id: "4", val: 50, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Subtree Invariant: Because DFS visits all descendants of node u before backtracking out, node u's entire subtree forms a contiguous 1D slice [tin[u], tout[u]].",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "swap" },
        { id: "2", val: 30, state: "default" },
        { id: "3", val: 40, state: "swap" },
        { id: "4", val: 50, state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Range Query Acceleration: Mapping 2D subtrees into contiguous 1D array ranges allows Fenwick Trees and Segment Trees to run subtree updates in O(log N) time.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 30, state: "sorted" },
        { id: "3", val: 40, state: "sorted" },
        { id: "4", val: 50, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Timestamp Initialization: Entry timestamp tin[u] and exit timestamp tout[u] arrays are initialized to -1 for all vertices.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "default" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "default" },
        { id: "2", val: 30, state: "default" },
        { id: "3", val: 40, state: "default" },
        { id: "4", val: 50, state: "default" },
      ],
    },
  },
  {
    narrative: "Depth-first search launches from root vertex 0 at global clock timer = 0.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "active" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "default" },
        { id: "2", val: 30, state: "default" },
        { id: "3", val: 40, state: "default" },
        { id: "4", val: 50, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Recording entry timestamp tin[u] = timer upon discovering node u marks the lower bound index of node u's subtree interval.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "active" },
        { id: "2", val: 30, state: "default" },
        { id: "3", val: 40, state: "default" },
        { id: "4", val: 50, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Traversing each child branch recursively preserves contiguous ordering for every subtree level.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "visited" },
        { id: "2", val: 30, state: "default" },
        { id: "3", val: 40, state: "active" },
        { id: "4", val: 50, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Recording exit timestamp tout[u] = timer - 1 after visiting all descendants closes node u's subtree interval [tin[u], tout[u]].",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "swap" },
        { id: "2", val: 30, state: "default" },
        { id: "3", val: 40, state: "visited" },
        { id: "4", val: 50, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "The single DFS pass flattens the tree into a linear range map in optimal O(N) time and O(N) space.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 10, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 20, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 30, state: "sorted" },
        { id: "3", val: 40, state: "sorted" },
        { id: "4", val: 50, state: "sorted" },
      ],
    },
  },
];

export const generateEulerTourTechniqueSteps = (input: EulerTourInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  const safeInput = input ?? DEFAULT_EULER_TOUR_INPUT;
  const rawNumNodes = safeInput.numNodes ?? DEFAULT_EULER_TOUR_INPUT.numNodes;
  const n = Math.max(1, Math.min(10, rawNumNodes));
  const rawEdges = Array.isArray(safeInput.edges)
    ? safeInput.edges
    : DEFAULT_EULER_TOUR_INPUT.edges;
  const edgeList = rawEdges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const rawValues = safeInput.values;
  const nodeValues =
    Array.isArray(rawValues) && rawValues.length === n
      ? rawValues
      : Array.from({ length: n }, (_, i) => (i + 1) * 10);

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edgeList) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const children: number[][] = Array.from({ length: n }, () => []);
  const visited = Array(n).fill(false);

  const buildChildrenTree = (u: number) => {
    visited[u] = true;
    for (const v of adj[u]) {
      if (!visited[v]) {
        children[u].push(v);
        buildChildrenTree(v);
      }
    }
  };
  if (n > 0) buildChildrenTree(0);

  const tin = Array(n).fill(-1);
  const tout = Array(n).fill(-1);
  const eulerOrder: number[] = [];
  let timer = 0;

  const buildTreeSnapshot = (
    focusNode: number,
    focusState: "active" | "swap" | "compare" | "sorted" | "visited" = "active",
  ) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i]?.[0];
      const rightChild = children[i]?.[1];
      let state: TreeNodeItem["state"] = "default";
      if (i === focusNode) {
        state = focusState;
      } else if (tout[i] !== -1) {
        state = "visited";
      } else if (tin[i] !== -1) {
        state = "visited";
      }

      return {
        id: String(i),
        val: nodeValues[i],
        leftId: leftChild !== undefined ? String(leftChild) : undefined,
        rightId: rightChild !== undefined ? String(rightChild) : undefined,
        state,
      };
    });

    return {
      kind: "tree" as const,
      nodes: treeNodes,
      rootId: "0",
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized Euler Tour traversal for tree structure with N = ${n} nodes.`,
      primarySnapshot: buildTreeSnapshot(-1),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { timer: 0, nodesCount: n },
    }),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Started depth-first traversal at root Node 0. Initialized entry (tin) and exit (tout) arrays to -1.`,
      primarySnapshot: buildTreeSnapshot(0, "active"),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { currNode: 0, parent: -1 },
    }),
  );

  const dfsEuler = (u: number, p: number) => {
    tin[u] = timer;
    timer++;
    eulerOrder.push(u);

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Recorded entry timestamp tin[${u}] = ${tin[u]} for Node ${u} at timer=${timer - 1} and appended to tour order: [${eulerOrder.join(", ")}].`,
        primarySnapshot: buildTreeSnapshot(u, "compare"),
        auxiliaryState: {
          stack: [],
          visited: eulerOrder.map(String),
        },
        variables: { currNode: u, tin: tin[u], timer },
      }),
    );

    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      if (v !== p) {
        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Recursing from parent Node ${u} into child Node ${v} to compute its subtree interval bounds.`,
            primarySnapshot: buildTreeSnapshot(v, "active"),
            auxiliaryState: {
              stack: [],
              visited: eulerOrder.map(String),
            },
            variables: { currNode: v, parent: u },
          }),
        );

        dfsEuler(v, u);
      }
    }

    tout[u] = timer - 1;
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Recorded exit timestamp tout[${u}] = ${tout[u]} for Node ${u}. Subtree interval of Node ${u} is finalized as [tin=${tin[u]}, tout=${tout[u]}].`,
        primarySnapshot: buildTreeSnapshot(u, "swap"),
        auxiliaryState: {
          stack: [],
          visited: eulerOrder.map(String),
        },
        variables: {
          currNode: u,
          tin: tin[u],
          tout: tout[u],
          subtreeSize: tout[u] - tin[u] + 1,
        },
      }),
    );
  };

  if (n > 0) dfsEuler(0, -1);

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Euler Tour complete! Tree is fully flattened into 1D range map. Flattened order: [${eulerOrder.join(", ")}].`,
      primarySnapshot: {
        kind: "tree",
        rootId: "0",
        nodes: Array.from({ length: n }, (_, i) => ({
          id: String(i),
          val: nodeValues[i],
          leftId: children[i]?.[0] !== undefined ? String(children[i][0]) : undefined,
          rightId: children[i]?.[1] !== undefined ? String(children[i][1]) : undefined,
          state: "sorted",
        })),
      },
      auxiliaryState: {
        stack: [],
        visited: eulerOrder.map(String),
      },
      variables: { completed: true, totalVisited: n },
    }),
  );

  return steps;
};

export const EULER_TOUR_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature for Euler Tour technique.",
    2: "Initialize adjacency list.",
    3: "Iterate through edges.",
    4: "Add neighbor u -> v.",
    5: "Add neighbor v -> u.",
    7: "Initialize tin array with -1.",
    8: "Initialize tout array with -1.",
    9: "Initialize flat_order list.",
    10: "Initialize timer to 0.",
    12: "Define recursive DFS helper.",
    14: "Record entry timestamp tin[u].",
    15: "Increment global timer.",
    16: "Append vertex to flattened order.",
    18: "Iterate over neighbors.",
    19: "Check if neighbor is parent.",
    20: "Recurse into child.",
    22: "Assign exit timestamp tout[u].",
    24: "Start DFS from root.",
    25: "Return tin, tout, and flat_order.",
  },
};

export const eulerTourTechnique: AlgorithmDefinition<EulerTourInput> = {
  id: "euler-tour-technique",
  title: "Euler Tour Technique (Tree Flattening)",
  topicIds: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Medium",
  description:
    "<p>Given a rooted tree with <code>N</code> vertices, compute entry timestamp <code>tin[u]</code> and exit timestamp <code>tout[u]</code> for every vertex <code>u</code> during a Depth-First Search traversal to flatten the tree into a contiguous 1D array.</p><h3>Problem Statement</h3><p>Because DFS visits all descendants of node <code>u</code> continuously before backtracking, node <code>u</code>'s subtree corresponds to the contiguous slice <code>[tin[u], tout[u]]</code>. Subtree queries (sum, min, max, updates) can be answered using range data structures (Fenwick/Segment Tree) in <code>O(log N)</code> time.</p><h3>Input Parameters</h3><ul><li><code>numNodes</code>: Total number of tree vertices.</li><li><code>edges</code>: Array of tree edge pairs <code>[u, v]</code>.</li><li><code>values</code>: Optional array of node values.</li></ul><h3>Output</h3><p>Returns tin, tout, and flat_order arrays mapping subtrees to 1D contiguous segments.</p>",
  constraints: ["1 <= N <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "5 nodes tree",
      outputDisplay: "Flattened range map",
      title: "Standard 5-Node Tree Euler Tour",
      input: DEFAULT_EULER_TOUR_INPUT,
      output: "Flattened subtree ranges computed",
      explanation: "Subtree of Node 1 maps to range [tin[1], tout[1]] in 1D array.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "6 nodes deep tree",
      outputDisplay: "6 subtree ranges",
      title: "Adversarial Deep Tree Flattening",
      input: {
        numNodes: 6,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [0, 4],
          [4, 5],
        ],
        values: [5, 15, 25, 35, 45, 55],
      },
      output: "6 entry/exit pairs",
      explanation: "Tree with deep chains mapped into 1D contiguous segments.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "Single node tree",
      outputDisplay: "Range [0, 0]",
      title: "Boundary Single Node Tree",
      input: {
        numNodes: 1,
        edges: [],
        values: [100],
      },
      output: "tin[0]=0, tout[0]=0",
      explanation: "A single node has a range of length 1.",
    },
  ],
  code: `def euler_tour(n, edges, values):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    tin = [-1] * n
    tout = [-1] * n
    flat_order = []
    timer = 0

    def dfs(u, p):
        nonlocal timer
        tin[u] = timer
        timer += 1
        flat_order.append(u)

        for v in adj[u]:
            if v != p:
                dfs(v, u)

        tout[u] = timer - 1

    dfs(0, -1)
    return tin, tout, flat_order`,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Single DFS traversal visits every node and edge once, taking O(N) linear time.",
    space: "O(N) space for tin, tout, and recursion stack.",
  },
  topicGuide: {
    overview:
      "<p>The Euler Tour Technique (Tree Flattening / Traversal Linearization) transforms hierarchical parent-child relationships into a contiguous 1D array interval. By storing DFS entry timestamp <code>tin[u]</code> and exit timestamp <code>tout[u]</code>, any node <code>u</code>'s entire subtree is mapped to the contiguous slice <code>[tin[u], tout[u]]</code>.</p>",
    sections: [
      {
        heading: "Core Concept: The Subtree Invariant",
        body: "<p>During DFS traversal, a node <code>u</code> is entered at timestamp <code>tin[u]</code>. All descendants of <code>u</code> are visited recursively before DFS exits node <code>u</code> at timestamp <code>tout[u]</code>. Because no non-descendant node can be visited within this time window, the range <code>[tin[u], tout[u]]</code> strictly encompasses the entire subtree of <code>u</code>.</p>",
      },
      {
        heading: "Systems & Performance Impact: Linear Array vs Tree Pointers",
        body: "<p>Pointer-chasing tree traversals cause heavy L1/L2 cache misses due to non-contiguous node heap allocations. Flattening the tree into a linear array allows hardware prefetchers and cache lines to achieve maximum memory bandwidth during range updates or sum aggregations via Fenwick Trees.</p>",
      },
      {
        heading: "Implementation Nuances: 1-Pass vs 2-Pass Euler Tours",
        body: "<p>Standard Subtree Flattening records entry on discovery and exit after visiting all children, producing an array of length <code>N</code>. Range Minimum Query (RMQ) Euler Tours record node discovery and re-record after returning from every child branch, producing an array of length <code>2N - 1</code> that reduces Lowest Common Ancestor (LCA) queries to RMQ in <code>O(1)</code> time.</p>",
      },
      {
        heading: "Edge Case Analysis",
        body: "<p><strong>Ancestor Relationships:</strong> Node <code>u</code> is an ancestor of node <code>v</code> if and only if <code>tin[u] &le; tin[v]</code> and <code>tout[u] &ge; tout[v]</code>.<br/><strong>Subtree Cardinality:</strong> The number of vertices in <code>u</code>'s subtree is exactly <code>tout[u] - tin[u] + 1</code>.<br/><strong>Leaf Nodes:</strong> <code>tin[u] == tout[u]</code>, forming a 1-element slice.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(N)</code><br/><strong>Space Complexity:</strong> <code>O(N)</code><br/>Single DFS traversal visits every node and edge once, taking O(N) linear time.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Euler Tour (tin / tout)",
        definition:
          "Entry (tin) and exit (tout) timestamps assigned during a depth-first search of a tree.",
      },
      {
        term: "Tree Linearization",
        definition:
          "Mapping a 2D tree topology onto a 1D array to allow range query data structures (Fenwick/Segment tree) to operate on subtrees.",
      },
      {
        term: "Subtree Contiguity",
        definition:
          "The property ensuring all nodes in a subtree reside in a single unbroken slice of the linearized array.",
      },
    ],
  },
  trivia: EULER_TOUR_TRIVIA,
  generateSteps: generateEulerTourTechniqueSteps,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 18",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 18,
      section: "18.1 Tree queries",
    },
  ],
  defaultInput: DEFAULT_EULER_TOUR_INPUT,
};

export default eulerTourTechnique;
