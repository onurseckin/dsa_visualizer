import type { AlgorithmDefinition, AlgorithmStep, TreeNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

const EULER_TOUR_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature for Euler Tour technique taking node count n, edge list, and node values.",
    2: "Initialize an empty adjacency list for all n vertices.",
    3: "Iterate through each undirected edge pair (u, v) in the graph.",
    4: "Add vertex v to u's neighbor list.",
    5: "Add vertex u to v's neighbor list to maintain undirected tree connections.",
    7: "Initialize tin array of size n with -1 to store DFS entry timestamps.",
    8: "Initialize tout array of size n with -1 to store DFS exit timestamps.",
    9: "Initialize flat_order list to store the sequence of visited node IDs.",
    10: "Initialize running counter timer to 0.",
    12: "Define recursive DFS helper function that takes current vertex u and parent p.",
    13: "Declare timer as nonlocal so modifications persist across recursive calls.",
    14: "Record current timer value as entry timestamp tin[u] for vertex u.",
    15: "Increment global timer by 1 after recording entry time.",
    16: "Append vertex u to the flattened traversal order list.",
    18: "Iterate over all adjacent neighbors v of vertex u.",
    19: "Check if neighbor v is not the parent node p to prevent traversing backwards.",
    20: "Recurse into child vertex v with u as its parent.",
    22: "Assign exit timestamp tout[u] = timer - 1 after visiting u's entire subtree.",
    24: "Start Euler Tour DFS from root node 0 with parent -1.",
    25: "Return entry times tin, exit times tout, and flattened node traversal order.",
  },
};

export const generateEulerTourTechniqueSteps = (input: EulerTourInput): AlgorithmStep[] => {
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

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildTreeSnapshot = (currNode: number) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i]?.[0];
      const rightChild = children[i]?.[1];
      const isActive = i === currNode;
      const isVisited = tin[i] !== -1;

      let state: TreeNodeItem["state"] = "default";
      if (isActive) state = "active";
      else if (isVisited) state = "visited";

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

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Initialize Euler Tour traversal for tree structure with N = ${n} nodes.`,
      why: "Setting up entry timestamp (tin) and exit timestamp (tout) arrays to map 2D tree subtrees into contiguous 1D array ranges.",
    },
    primarySnapshot: buildTreeSnapshot(-1),
    auxiliaryState: {
      customState: {
        Timer: 0,
        "Euler Order": "[]",
      },
    },
    variables: { timer: 0, nodesCount: n },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 7,
    explanation: {
      what: "Initialize discovery arrays tin, tout, and linear traversal sequence.",
      why: "The entry time tin[u] marks where a node's subtree begins in the flattened array, while tout[u] marks where it ends.",
    },
    primarySnapshot: buildTreeSnapshot(-1),
    auxiliaryState: {
      customState: {
        Timer: 0,
        tin: JSON.stringify(tin),
        tout: JSON.stringify(tout),
      },
    },
    variables: { timer: 0 },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 24,
    explanation: {
      what: "Start depth-first traversal at root Node 0.",
      why: "Depth-first search systematically explores every sub-branch before completing a parent node, preserving contiguous subtree visit orders.",
    },
    primarySnapshot: buildTreeSnapshot(0),
    auxiliaryState: {
      customState: {
        "Current Node": 0,
        Timer: timer,
      },
    },
    variables: { currNode: 0, parent: -1 },
  });

  const dfsEuler = (u: number, p: number) => {
    tin[u] = timer;
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 14,
      explanation: {
        what: `Record entry timestamp tin[${u}] = ${tin[u]} for Node ${u}.`,
        why: `Timestamping node discovery establishes the lower boundary of Node ${u}'s subtree interval in the flattened array.`,
      },
      primarySnapshot: buildTreeSnapshot(u),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          "tin[u]": tin[u],
          Timer: timer,
          "Euler Order": `[${eulerOrder.join(", ")}]`,
        },
        visited: eulerOrder.map((node) => `Node ${node}`),
      },
      variables: { currNode: u, tin: tin[u], timer },
    });

    timer++;
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 15,
      explanation: {
        what: `Advance traversal clock to ${timer}.`,
        why: "Monotonically increasing timestamps guarantee that every traversal event receives a unique index in the linearized order.",
      },
      primarySnapshot: buildTreeSnapshot(u),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          Timer: timer,
        },
      },
      variables: { timer },
    });

    eulerOrder.push(u);
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 16,
      explanation: {
        what: `Append Node ${u} to linear tour order.`,
        why: `Placing nodes in arrival sequence positions Node ${u} at index tin[${u}] within the flattened array representation.`,
      },
      primarySnapshot: buildTreeSnapshot(u),
      auxiliaryState: {
        customState: {
          "Euler Order": `[${eulerOrder.join(", ")}]`,
          Timer: timer,
        },
        visited: eulerOrder.map((node) => `Node ${node}`),
      },
      variables: { currNode: u, flatOrderLen: eulerOrder.length },
    });

    const neighbors = adj[u] || [];
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 18,
      explanation: {
        what: `Inspect adjacent connections for Node ${u}.`,
        why: "We process each unvisited child subtree sequentially to maintain structural interval boundaries.",
      },
      primarySnapshot: buildTreeSnapshot(u),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          Neighbors: neighbors.join(", "),
        },
      },
      variables: { currNode: u, neighborsCount: neighbors.length },
    });

    for (const v of neighbors) {
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 19,
        explanation: {
          what: `Evaluate neighbor edge (${u} -> ${v}).`,
          why:
            v !== p
              ? `Node ${v} is an unvisited child. Recurse into its subtree to determine its entry and exit bounds.`
              : `Node ${v} is the parent of Node ${u}. Skip it to prevent backtracking up the tree hierarchy.`,
        },
        primarySnapshot: buildTreeSnapshot(u),
        auxiliaryState: {
          customState: {
            "Current Node": u,
            "Target Neighbor": v,
            Parent: p,
          },
        },
        variables: { currNode: u, neighbor: v, parent: p, isChild: v !== p },
      });

      if (v !== p) {
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 20,
          explanation: {
            what: `Recurse into child Node ${v}.`,
            why: `Depth-first exploration enters child subtrees prior to finishing Node ${u}'s entry-exit range.`,
          },
          primarySnapshot: buildTreeSnapshot(v),
          auxiliaryState: {
            customState: {
              "Calling Node": u,
              "Child Node": v,
            },
          },
          variables: { currNode: v, parent: u },
        });

        dfsEuler(v, u);
      }
    }

    tout[u] = timer - 1;
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 22,
      explanation: {
        what: `Record exit timestamp tout[${u}] = ${tout[u]} for Node ${u}.`,
        why: `Having explored all descendants, closing Node ${u}'s interval defines its entire subtree as the contiguous range [tin[${u}], tout[${u}]].`,
      },
      primarySnapshot: buildTreeSnapshot(u),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          "Subtree Range": `[${tin[u]}, ${tout[u]}]`,
          "Subtree Size": tout[u] - tin[u] + 1,
        },
        visited: eulerOrder.map((node) => `Node ${node}`),
      },
      variables: {
        currNode: u,
        tin: tin[u],
        tout: tout[u],
        subtreeSize: tout[u] - tin[u] + 1,
      },
    });
  };

  if (n > 0) dfsEuler(0, -1);

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 25,
    explanation: {
      what: "Euler Tour complete! Tree is fully flattened into a 1D range map.",
      why: "Any subtree operation on Node u can now be executed as a range query over [tin[u], tout[u]] using range data structures.",
    },
    primarySnapshot: buildTreeSnapshot(-1),
    auxiliaryState: {
      customState: {
        "Flattened Array": `[${eulerOrder.map((i) => nodeValues[i]).join(", ")}]`,
        Status: "Tree Flattened!",
      },
      visited: eulerOrder.map((i) => `Node ${i} (tin=${tin[i]}, tout=${tout[i]})`),
    },
    variables: {
      completed: true,
      totalVisited: n,
    },
  });

  return steps;
};

export const eulerTourTechnique: AlgorithmDefinition<EulerTourInput> = {
  id: "euler-tour-technique",
  title: "Euler Tour Technique (Tree Flattening)",
  topicIds: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Medium",
  description:
    "<p>Flatten a 2D tree hierarchy into a linear 1D array using DFS entry (<code>tin</code>) and exit (<code>tout</code>) timestamps, enabling subtree updates and range queries in <code>O(1)</code> mapping time.</p><h3>Problem Statement</h3><p>Given a rooted tree with <code>N</code> vertices, compute entry timestamp <code>tin[u]</code> and exit timestamp <code>tout[u]</code> for every vertex <code>u</code> during a Depth-First Search traversal.</p><p>Because DFS visits all descendants of node <code>u</code> continuously before backtracking out of <code>u</code>, the entire subtree rooted at <code>u</code> corresponds to a contiguous subsegment <code>[tin[u], tout[u]]</code> in the flattened Euler Tour array. Subtree queries (sum, min, max, point/range updates) can thus be answered using standard range data structures (Fenwick Tree / Segment Tree) in <code>O(log N)</code> time.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>numNodes</code> (number of vertices), <code>edges</code> (tree edge pairs), and optional <code>values</code> array.</li><li><strong>Output:</strong> <code>tin</code>, <code>tout</code>, and <code>flat_order</code> arrays mapping node subtrees to 1D contiguous segments.</li></ul>",
  constraints: ["1 <= N <= 10^5"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "5 nodes tree",
      outputDisplay: "Flattened range map",
      title: "5 Nodes Tree Euler Tour",
      input: DEFAULT_EULER_TOUR_INPUT,
      output: "Flattened subtree ranges computed",
      explanation: "Subtree of Node 1 maps to range [tin[1], tout[1]] in 1D array.",
    },
    {
      kind: "complex",
      inputDisplay: "6 nodes deep tree",
      outputDisplay: "6 subtree ranges",
      title: "Deep Tree Flattening",
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
      inputDisplay: "Single node tree",
      outputDisplay: "Range [0, 0]",
      title: "Single Node Boundary",
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
      "<p>The Euler Tour Technique (Tree Flattening / Traversal Linearization) transforms hierarchical parent-child relationships into a contiguous 1D array interval. By storing DFS entry timestamp <code>tin[u]</code> and exit timestamp <code>tout[u]</code>, any node <code>u</code>'s entire subtree is mapped to the contiguous slice <code>[tin[u], tout[u]]</code>.</p><p>In production software systems, tree linearization is essential for spatial database indexing (R-Trees/B-Trees), relational database nested set model queries, and compiler AST transformations.</p>",
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
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 18",
      label: "Competitive Programmer's Handbook, Ch 18",
    },
  ],
  defaultInput: DEFAULT_EULER_TOUR_INPUT,
};

export default eulerTourTechnique;
