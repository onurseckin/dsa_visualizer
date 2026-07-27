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
    1: "Signature: compute Euler Tour entry (tin) and exit (tout) times to flatten tree into array.",
    2: "Initialize tin, tout arrays and flattened traversal list.",
    4: "Recursive DFS: record tin[u] when entering vertex u.",
    7: "Traverse unvisited neighbor children recursively.",
    11: "Record tout[u] when exiting vertex u after visiting its full subtree.",
    13: "Subtree of u corresponds to contiguous range [tin[u], tout[u]] in flattened array.",
  },
};

export const generateEulerTourTechniqueSteps = (
  input: EulerTourInput,
): AlgorithmStep[] => {
  const n = Math.max(2, Math.min(10, input.numNodes));
  const edgeList = input.edges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const nodeValues = input.values && input.values.length === n ? input.values : Array.from({ length: n }, (_, i) => (i + 1) * 10);

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
  buildChildrenTree(0);

  const tin = Array(n).fill(-1);
  const tout = Array(n).fill(-1);
  const eulerOrder: number[] = [];
  let timer = 0;

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildTreeSnapshot = (currNode: number) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i][0];
      const rightChild = children[i][1];
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
    codeLine: 2,
    explanation: {
      what: `Initialized Euler Tour for tree with ${n} nodes.`,
      why: "DFS traversal will record entry (tin) and exit (tout) timestamps.",
    },
    primarySnapshot: buildTreeSnapshot(-1),
    auxiliaryState: {
      customState: {
        "Timer": 0,
        "Euler Order": "[]",
      },
    },
    variables: {
      timer: 0,
      nodesCount: n,
    },
  });

  const dfsEuler = (u: number) => {
    tin[u] = timer++;
    eulerOrder.push(u);

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 4,
      explanation: {
        what: `Entered Node ${u} (val=${nodeValues[u]}). Assigned tin[${u}] = ${tin[u]}.`,
        why: "Entry timestamp opens the contiguous subtree range.",
      },
      primarySnapshot: buildTreeSnapshot(u),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          "Entry Time (tin)": tin[u],
          "Timer": timer,
          "Euler Order": `[${eulerOrder.join(", ")}]`,
        },
        visited: eulerOrder.map((node) => `Node ${node}`),
      },
      variables: {
        currNode: u,
        tin: tin[u],
        timer,
      },
    });

    for (const child of children[u]) {
      dfsEuler(child);
    }

    tout[u] = timer - 1;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 11,
      explanation: {
        what: `Exited Node ${u}. Assigned tout[${u}] = ${tout[u]}. Subtree range: [${tin[u]}, ${tout[u]}].`,
        why: "Exit timestamp closes the contiguous subtree range.",
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
        rangeLen: tout[u] - tin[u] + 1,
      },
    });
  };

  dfsEuler(0);

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 13,
    explanation: {
      what: "Euler Tour Complete! Tree is fully flattened into linear array order.",
      why: "Any subtree sum/update query on Node u now maps to range query on [tin[u], tout[u]].",
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
  category: "tree_queries_and_diameter",
  difficulty: "Medium",
  description:
    "The Euler Tour Technique flattens a tree structure into a 1D array by recording entry (tin) and exit (tout) times during a depth-first search. Because all nodes in a subtree are visited continuously between tin[u] and tout[u], any subtree query becomes a simple contiguous range query [tin[u], tout[u]] on a Fenwick tree or Segment tree.",
  constraints: ["1 <= N <= 20"],
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
      "Euler Tour technique maps tree hierarchy to flat 1D array ranges. Subtree operations (sums, updates, max) translate directly to range queries on standard range data structures.",
    sections: [
      {
        heading: "Contiguous Subtree Invariant",
        body: "All descendants of node u are visited between tin[u] and tout[u]. Thus, the subtree of u forms the contiguous slice flat_array[tin[u] .. tout[u]].",
      },
    ],
    keyTerms: [
      {
        term: "Euler Tour",
        definition: "A DFS traversal order that records entry and exit timestamps for tree nodes.",
      },
      {
        term: "Tree Flattening",
        definition: "Transforming tree parent-child structures into 1D contiguous range segments.",
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
