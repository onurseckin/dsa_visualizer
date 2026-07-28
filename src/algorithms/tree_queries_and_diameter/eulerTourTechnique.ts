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
  const n = Math.max(1, Math.min(10, input.numNodes));
  const edgeList = input.edges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const nodeValues =
    input.values && input.values.length === n
      ? input.values
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
      what: `Initialize Euler Tour for tree with $N = ${n}$ nodes.`,
      why: "We set up adjacency structure and prepare entry/exit arrays for DFS traversal.",
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
      what: "Initialize tin, tout arrays and flat_order list.",
      why: "tin[u] stores entry timestamp, tout[u] stores exit timestamp, and flat_order records visit sequence.",
    },
    primarySnapshot: buildTreeSnapshot(-1),
    auxiliaryState: {
      customState: {
        Timer: 0,
        "tin": JSON.stringify(tin),
        "tout": JSON.stringify(tout),
      },
    },
    variables: { timer: 0 },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 24,
    explanation: {
      what: "Invoke dfs(u=0, p=-1) from root vertex 0.",
      why: "The tree traversal starts at the root node 0 with no parent.",
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
        what: `Record entry time tin[${u}] = ${tin[u]} for Node ${u} (val=${nodeValues[u]}).`,
        why: "tin[u] marks the beginning of node u's subtree in the linearized array.",
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
        what: `Increment timer to ${timer}.`,
        why: "Each entry timestamp uses a unique sequential integer.",
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
        what: `Append Node ${u} to flat_order list: [${eulerOrder.join(", ")}].`,
        why: "Node u is positioned at index tin[u] in the flattened array.",
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
        what: `Examine neighbors of Node ${u}: [${neighbors.join(", ")}].`,
        why: "We iterate through all adjacent nodes to traverse child subtrees.",
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
          what: `Check if neighbor ${v} != parent ${p}.`,
          why: v !== p ? `${v} is a child node. We will recurse into it.` : `${v} is the parent node. We skip it to avoid backtracking.`,
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
            what: `Recurse into dfs(u=${v}, p=${u}).`,
            why: `Traverse into the child subtree of Node ${v}.`,
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
        what: `Assign exit time tout[${u}] = ${tout[u]}. Subtree range for Node ${u}: [${tin[u]}, ${tout[u]}].`,
        why: "All descendants of node u have been processed. The range [tin[u], tout[u]] completely covers its subtree.",
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
      what: "Euler Tour Complete! Tree is fully flattened into 1D linear order.",
      why: "Any subtree sum or update query on Node u now maps directly to the range query $[tin[u], tout[u]]$.",
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
  category: "tree_fundamentals",
  categories: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Medium",
  description:
    "Flatten a 2D tree hierarchy into a linear 1D array using DFS entry (`tin`) and exit (`tout`) timestamps, enabling subtree updates and range queries in $O(1)$ mapping time.\n\n### Problem Statement\nGiven a rooted tree with $N$ vertices, compute entry timestamp `tin[u]` and exit timestamp `tout[u]` for every vertex $u$ during a Depth-First Search traversal.\n\nBecause DFS visits all descendants of node $u$ continuously before backtracking out of $u$, the entire subtree rooted at $u$ corresponds to a contiguous subsegment $[tin[u], tout[u]]$ in the flattened Euler Tour array. Subtree queries (sum, min, max, point/range updates) can thus be answered using standard range data structures (Fenwick Tree / Segment Tree) in $O(\\log N)$ time.\n\n### Input Parameters\n- `numNodes`: Total number of vertices $N$.\n- `edges`: Array of undirected edge pairs `[u, v]` defining tree topology.\n- `values`: Optional array of node values.\n\n### Output\n- Returns arrays `tin`, `tout`, and `flat_order` where node $u$'s subtree is mapped to index slice $[tin[u], tout[u]]$.\n\n### Constraints & Edge Cases\n- $1 \\le N \\le 10^5$.\n- Single node tree ($N=1$): `tin[0] = 0, tout[0] = 0` (slice of length $1$).\n- Deep chain graph ($N=10^5$): `tin` spans $[0, N-1]$, `tout` spans $[0, N-1]$ accordingly.",
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
    time: "Single DFS traversal visits every node and edge once, taking $O(N)$ linear time.",
    space: "$O(N)$ space for tin, tout, and recursion stack.",
  },
  topicGuide: {
    overview:
      "The Euler Tour Technique (Tree Flattening / Traversal Linearization) transforms hierarchical parent-child relationships into a contiguous 1D array interval. By storing DFS entry timestamp `tin[u]` and exit timestamp `tout[u]`, any node $u$'s entire subtree is mapped to the contiguous slice $[tin[u], tout[u]]$.\n\nIn real-life production systems, tree linearization is essential for high-performance spatial database indexing (R-Trees/B-Trees), database nested set model queries (SQL tree queries without recursive CTEs), and compiler AST optimizations.",
    sections: [
      {
        heading: "Core Concept: The Subtree Invariant",
        body: "During DFS traversal, a node $u$ is entered at timestamp `tin[u]`. All descendants of $u$ are visited recursively before DFS exits node $u$ at timestamp `tout[u]`. Because no non-descendant node can be visited within this window, the range $[tin[u], tout[u]]$ contains strictly the subtree of $u$.",
      },
      {
        heading: "Systems & Performance Impact: Linear Array vs Tree Pointers",
        body: "Pointer-chasing tree traversals cause heavy L1/L2 cache misses due to non-contiguous node heap allocations. Flattening the tree into a linear array allows hardware prefetchers to achieve maximum memory bandwidth during range updates or sum aggregations via Fenwick Trees.",
      },
      {
        heading: "Implementation Nuances: 1-Pass vs 2-Pass Euler Tours",
        body: "Standard Subtree Flattening (1 entry per node): `tin[u]` is assigned on entry, `tout[u]` is assigned after visiting all children. Length of array is $N$.\nLCA Euler Tour (RMQ reduction): Records node on entry AND after returning from every child branch. Length of array is $2N - 1$. RMQ over this array yields LCA in $O(1)$ query time.",
      },
      {
        heading: "Edge Case Analysis",
        body: "1. Ancestor Checks: Node $u$ is an ancestor of node $v$ if and only if $tin[u] \\le tin[v]$ and $tout[u] \\ge tout[v]$.\n2. Subtree Size: The number of vertices in $u$'s subtree is exactly $tout[u] - tin[u] + 1$.\n3. Leaf Nodes: `tin[u] == tout[u]`, forming a 1-element slice.",
      },
    ],
    keyTerms: [
      {
        term: "Euler Tour (`tin` / `tout`)",
        definition:
          "Entry (`tin`) and exit (`tout`) timestamps assigned during a depth-first search of a tree.",
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
