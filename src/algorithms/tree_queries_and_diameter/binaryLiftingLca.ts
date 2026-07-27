import type { AlgorithmDefinition, AlgorithmStep, TreeNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BinaryLiftingLcaInput {
  numNodes: number;
  edges: [number, number][];
  query: [number, number];
}

export const DEFAULT_BINARY_LIFTING_LCA_INPUT: BinaryLiftingLcaInput = {
  numNodes: 7,
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
  ],
  query: [3, 4],
};

const BINARY_LIFTING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Import math module for logarithmic calculations.",
    3: "Signature: compute LCA of nodes u and v in O(log N) using Binary Lifting.",
    8: "Precompute depth array and up table up[u][j] = 2^j ancestor of u.",
    12: "DFS traversal to assign depths and immediate parents (up[u][0]).",
    20: "Fill binary lifting DP: 2^j ancestor is the 2^(j-1) ancestor of the 2^(j-1) ancestor.",
    27: "Bring u and v to the same depth by lifting the deeper node.",
    36: "Lift both u and v in parallel using power-of-two jumps as high as possible.",
    40: "Return up[u][0], which is the lowest common ancestor of u and v.",
  },
};

export const generateBinaryLiftingLcaSteps = (input: BinaryLiftingLcaInput): AlgorithmStep[] => {
  const n = Math.max(2, Math.min(15, input.numNodes));
  const edgeList = input.edges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const [qU, qV] = input.query;
  const targetU = Math.max(0, Math.min(n - 1, qU));
  const targetV = Math.max(0, Math.min(n - 1, qV));

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edgeList) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const LOGN = Math.max(1, Math.ceil(Math.log2(n + 1)));
  const depth = Array(n).fill(0);
  const up: number[][] = Array.from({ length: n }, () => Array(LOGN).fill(0));
  const children: number[][] = Array.from({ length: n }, () => []);

  // Precompute DFS tree from root 0
  const dfs = (u: number, p: number, d: number) => {
    depth[u] = d;
    up[u][0] = p;
    for (const v of adj[u]) {
      if (v !== p) {
        children[u].push(v);
        dfs(v, u, d + 1);
      }
    }
  };

  dfs(0, 0, 0);

  // Precompute binary lifting table
  for (let j = 1; j < LOGN; j++) {
    for (let i = 0; i < n; i++) {
      up[i][j] = up[up[i][j - 1]][j - 1];
    }
  }

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildTreeSnapshot = (activeU: number, activeV: number, lcaNode: number = -1) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i][0];
      const rightChild = children[i][1];
      const isActive = i === activeU || i === activeV;
      const isLca = i === lcaNode;

      let state: TreeNodeItem["state"] = "default";
      if (isLca) state = "sorted";
      else if (isActive) state = "active";

      return {
        id: String(i),
        val: i,
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

  // Step 1: Precomputation summary
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 20,
    explanation: {
      what: `Precomputed Binary Lifting table up[N][${LOGN}] and depths for ${n} nodes.`,
      why: "Allows log2(N) power-of-two jumps up the ancestor tree.",
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV),
    auxiliaryState: {
      customState: {
        "Query Nodes": `LCA(${targetU}, ${targetV})`,
        "Depth Node U": depth[targetU],
        "Depth Node V": depth[targetV],
      },
    },
    variables: {
      targetU,
      targetV,
      depthU: depth[targetU],
      depthV: depth[targetV],
    },
  });

  let u = targetU;
  let v = targetV;

  // Equalize depth
  if (depth[u] < depth[v]) {
    const temp = u;
    u = v;
    v = temp;
  }

  const diff = depth[u] - depth[v];
  if (diff > 0) {
    for (let j = LOGN - 1; j >= 0; j--) {
      if ((diff & (1 << j)) !== 0) {
        u = up[u][j];
      }
    }
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 27,
      explanation: {
        what: `Lifted deeper node by ${diff} levels to match depth ${depth[v]}.`,
        why: "Binary lifting equalizes depths before parallel jumping.",
      },
      primarySnapshot: buildTreeSnapshot(u, v),
      auxiliaryState: {
        customState: {
          "Equalized Node U": `Node ${u} (depth ${depth[u]})`,
          "Node V": `Node ${v} (depth ${depth[v]})`,
        },
      },
      variables: {
        u,
        v,
        equalizedDepth: depth[u],
      },
    });
  }

  let finalLca = u;

  if (u !== v) {
    for (let j = LOGN - 1; j >= 0; j--) {
      if (up[u][j] !== up[v][j]) {
        u = up[u][j];
        v = up[v][j];

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 36,
          explanation: {
            what: `Lifted both nodes by 2^${j} = ${1 << j} levels to (${u}, ${v}).`,
            why: `Ancestors up[u][${j}] and up[v][${j}] differ, so jump up safely below LCA.`,
          },
          primarySnapshot: buildTreeSnapshot(u, v),
          auxiliaryState: {
            customState: {
              "Jump Power": `2^${j}`,
              "Node U": u,
              "Node V": v,
            },
          },
          variables: {
            u,
            v,
            jumpPower: 1 << j,
          },
        });
      }
    }
    finalLca = up[u][0];
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 40,
    explanation: {
      what: `Found LCA of nodes ${targetU} and ${targetV}: Node ${finalLca}!`,
      why: "Lowest common ancestor identified in O(log N) jump steps.",
    },
    primarySnapshot: buildTreeSnapshot(u, v, finalLca),
    auxiliaryState: {
      customState: {
        Result: `LCA(${targetU}, ${targetV}) = Node ${finalLca}`,
        Status: "LCA Query Complete",
      },
    },
    variables: {
      lca: finalLca,
      targetU,
      targetV,
    },
  });

  return steps;
};

export const binaryLiftingLca: AlgorithmDefinition<BinaryLiftingLcaInput> = {
  id: "binary-lifting-lca",
  title: "Binary Lifting for LCA",
  category: "tree_queries_and_diameter",
  categories: ["tree_queries_and_diameter"],
  difficulty: "Hard",
  description:
    "Binary Lifting is a dynamic programming technique for rooted trees that precomputes up[u][j] = the 2^j-th ancestor of node u. This enables O(log N) queries for Lowest Common Ancestor (LCA) and K-th ancestor after O(N log N) preprocessing.",
  constraints: ["1 <= N <= 20", "0 <= u, v < N"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "7 nodes, query LCA(3, 4)",
      outputDisplay: "LCA = Node 1",
      title: "Binary Tree LCA",
      input: DEFAULT_BINARY_LIFTING_LCA_INPUT,
      output: "Node 1",
      explanation: "Nodes 3 and 4 are siblings under parent Node 1.",
    },
    {
      kind: "complex",
      inputDisplay: "7 nodes, query LCA(3, 6)",
      outputDisplay: "LCA = Node 0",
      title: "Cross Subtree LCA",
      input: {
        numNodes: 7,
        edges: [
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
          [2, 5],
          [2, 6],
        ],
        query: [3, 6],
      },
      output: "Node 0 (Root)",
      explanation: "Node 3 (left subtree) and Node 6 (right subtree) join at root Node 0.",
    },
    {
      kind: "negative",
      inputDisplay: "7 nodes, query LCA(1, 3)",
      outputDisplay: "LCA = Node 1",
      title: "Ancestor-Descendant Query",
      input: {
        numNodes: 7,
        edges: [
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
          [2, 5],
          [2, 6],
        ],
        query: [1, 3],
      },
      output: "Node 1",
      explanation: "Node 1 is a direct ancestor of Node 3, so LCA is Node 1 itself.",
    },
  ],
  code: `import math

def binary_lifting_lca(n, edges, u, v):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)

    LOGN = math.ceil(math.log2(n + 1))
    depth = [0] * n
    up = [[0] * LOGN for _ in range(n)]

    def dfs(node, parent, d):
        depth[node] = d
        up[node][0] = parent
        for child in adj[node]:
            if child != parent:
                dfs(child, node, d + 1)

    dfs(0, 0, 0)
    for j in range(1, LOGN):
        for i in range(n):
            up[i][j] = up[up[i][j - 1]][j - 1]

    if depth[u] < depth[v]:
        u, v = v, u

    diff = depth[u] - depth[v]
    for j in range(LOGN - 1, -1, -1):
        if (diff >> j) & 1:
            u = up[u][j]

    if u == v:
        return u

    for j in range(LOGN - 1, -1, -1):
        if up[u][j] != up[v][j]:
            u = up[u][j]
            v = up[v][j]

    return up[u][0]`,
  timeComplexity: {
    best: "O(log N)",
    average: "O(log N)",
    worst: "O(log N)",
  },
  spaceComplexity: "O(N log N)",
  complexityAnalysis: {
    time: "Preprocessing takes O(N log N) to build up[u][j] table. Each LCA query takes O(log N) time using binary powers of 2.",
    space: "O(N log N) space to store the ancestor table up[N][log N].",
  },
  topicGuide: {
    overview:
      "Binary Lifting precomputes 2^j ancestor jumps for every node. Jumping using binary decomposition allows quickly lifting any node up the tree in O(log N) time.",
    sections: [
      {
        heading: "2^j Ancestor Property",
        body: "The 2^j-th ancestor of node u is up[u][j] = up[ up[u][j-1] ][j-1], composing two jumps of size 2^(j-1).",
      },
    ],
    keyTerms: [
      {
        term: "Lowest Common Ancestor (LCA)",
        definition: "The deepest node that is an ancestor of both node u and node v.",
      },
      {
        term: "Binary Lifting",
        definition: "A technique storing power-of-two jump steps to move up trees efficiently.",
      },
    ],
  },
  trivia: BINARY_LIFTING_TRIVIA,
  generateSteps: generateBinaryLiftingLcaSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 18",
      label: "Competitive Programmer's Handbook, Ch 18",
    },
  ],
  defaultInput: DEFAULT_BINARY_LIFTING_LCA_INPUT,
};
