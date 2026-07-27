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
    1: "Import Python math module to compute logarithmic bounds (math.ceil, math.log2).",
    3: "Function signature for Binary Lifting LCA taking node count n, edge list, and query nodes u and v.",
    4: "Initialize an empty adjacency list for all n vertices.",
    5: "Iterate through each undirected edge pair (a, b) in the graph.",
    6: "Add vertex b to a's adjacency list.",
    7: "Add vertex a to b's adjacency list to maintain undirected connections.",
    9: "Calculate LOGN = ceil(log2(n + 1)), the maximum power-of-two jump height needed.",
    10: "Initialize depth array of size n with 0 to store each node's tree depth.",
    11: "Initialize 2D table up[n][LOGN] with 0s to store 2^j ancestors.",
    13: "Define recursive DFS helper to calculate node depths and 1-step parents.",
    14: "Record node depth depth[node] = d.",
    15: "Set 1-step parent up[node][0] = parent.",
    16: "Iterate through all adjacent children of current node.",
    17: "Check if child is not parent to prevent traversing backwards.",
    18: "Recurse into child with depth d + 1.",
    20: "Execute DFS traversal starting from root node 0 with parent 0 and depth 0.",
    21: "Outer loop for binary lifting DP: iterate power powers j from 1 up to LOGN - 1.",
    22: "Inner loop: iterate over every node i in the tree.",
    23: "DP recurrence: up[i][j] = up[up[i][j - 1]][j - 1] (2^j ancestor is 2^(j-1) ancestor of 2^(j-1) ancestor).",
    25: "Check if depth of u is less than depth of v.",
    26: "Swap u and v so that u is always the deeper node (depth[u] >= depth[v]).",
    28: "Calculate depth difference diff = depth[u] - depth[v].",
    29: "Iterate jump power j from LOGN - 1 down to 0 to equalize depths.",
    30: "Check if the j-th bit of diff is set ((diff >> j) & 1).",
    31: "Lift node u upward by 2^j levels: u = up[u][j].",
    33: "Check if u == v after depth equalization.",
    34: "If u == v, node v was an ancestor of u, so return u as the LCA.",
    36: "Iterate jump power j from LOGN - 1 down to 0 for parallel lifting.",
    37: "Check if ancestors at 2^j jump differ (up[u][j] != up[v][j]).",
    38: "Lift u upward by 2^j levels: u = up[u][j].",
    39: "Lift v upward by 2^j levels: v = up[v][j].",
    41: "Return up[u][0], the 1-step parent of u (which is the Lowest Common Ancestor).",
  },
};

export const generateBinaryLiftingLcaSteps = (input: BinaryLiftingLcaInput): AlgorithmStep[] => {
  const n = Math.max(1, Math.min(15, input.numNodes));
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
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildTreeSnapshot = (activeU: number, activeV: number, lcaNode: number = -1) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i]?.[0];
      const rightChild = children[i]?.[1];
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

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 3,
    explanation: {
      what: `Initialize Binary Lifting LCA for $N = ${n}$ nodes and query LCA(${targetU}, ${targetV}).`,
      why: "Build tree graph and prepare binary jump table.",
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV),
    auxiliaryState: {
      customState: {
        Status: "Initializing",
        "Target Query": `LCA(${targetU}, ${targetV})`,
      },
    },
    variables: { targetU, targetV, numNodes: n },
  });

  const dfs = (u: number, p: number, d: number) => {
    depth[u] = d;
    up[u][0] = p;
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 14,
      explanation: {
        what: `DFS visit Node ${u}: depth[${u}] = ${d}, 1-step parent up[${u}][0] = ${p}.`,
        why: "Record vertex depth and immediate parent pointer.",
      },
      primarySnapshot: buildTreeSnapshot(targetU, targetV),
      auxiliaryState: {
        customState: {
          "Visiting Node": u,
          Depth: d,
          "Direct Parent": p,
        },
      },
      variables: { currNode: u, depth: d, parent: p },
    });

    for (const v of adj[u]) {
      if (v !== p) {
        children[u].push(v);
        dfs(v, u, d + 1);
      }
    }
  };

  if (n > 0) dfs(0, 0, 0);

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 9,
    explanation: {
      what: `Calculated MAX_LOG = ${LOGN} based on $N = ${n}$.`,
      why: "Upward jumps will use powers of two up to $2^{${LOGN - 1}}$.",
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV),
    auxiliaryState: {
      customState: {
        LOGN,
        "Max Jump Power": `2^${LOGN - 1} = ${1 << (LOGN - 1)}`,
      },
    },
    variables: { LOGN },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 20,
    explanation: {
      what: `Ran DFS from root 0 to assign depths and 1-step parent pointers (up[i][0]).`,
      why: `Root depth is 0. Depths range from 0 to ${Math.max(...depth)}.`,
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV),
    auxiliaryState: {
      customState: {
        Depths: depth.map((d, i) => `V${i}:${d}`).join(", "),
        "1-Step Parents": up.map((r, i) => `V${i}->${r[0]}`).join(", "),
      },
    },
    variables: { rootDepth: 0 },
  });

  // Precompute binary lifting table with step logging
  for (let j = 1; j < LOGN; j++) {
    for (let i = 0; i < n; i++) {
      up[i][j] = up[up[i][j - 1]][j - 1];
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 23,
        explanation: {
          what: `DP table up[Node ${i}][2^${j}=${1 << j}] = 2^${j - 1} ancestor of Node ${up[i][j - 1]} -> Node ${up[i][j]}.`,
          why: "Precomputing power-of-two ancestor jumps for O(log N) LCA queries.",
        },
        primarySnapshot: buildTreeSnapshot(targetU, targetV),
        auxiliaryState: {
          customState: {
            "DP Cell": `up[${i}][${j}] = ${up[i][j]}`,
            "2^j Ancestor": up[i][j],
          },
        },
        variables: { node: i, power: j, ancestor: up[i][j] },
      });
    }
  }

  let u = targetU;
  let v = targetV;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 25,
    explanation: {
      what: `Check depth condition: depth[${u}] = ${depth[u]}, depth[${v}] = ${depth[v]}.`,
      why: depth[u] < depth[v] ? `depth[${u}] < depth[${v}], so we swap u and v.` : `depth[${u}] >= depth[${v}], no swap needed.`,
    },
    primarySnapshot: buildTreeSnapshot(u, v),
    auxiliaryState: {
      customState: {
        "Node U Depth": depth[u],
        "Node V Depth": depth[v],
      },
    },
    variables: { depthU: depth[u], depthV: depth[v] },
  });

  if (depth[u] < depth[v]) {
    const temp = u;
    u = v;
    v = temp;
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 26,
      explanation: {
        what: `Swapped target nodes so Node ${u} is the deeper node.`,
        why: "We always lift the deeper node u first to match node v's depth.",
      },
      primarySnapshot: buildTreeSnapshot(u, v),
      auxiliaryState: {
        customState: {
          DeeperNode: u,
          ShallowerNode: v,
        },
      },
      variables: { u, v },
    });
  }

  const diff = depth[u] - depth[v];
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 28,
    explanation: {
      what: `Depth difference diff = depth[${u}] - depth[${v}] = ${diff}.`,
      why: diff > 0 ? `Node ${u} must be lifted by ${diff} levels.` : "Nodes already at identical depths.",
    },
    primarySnapshot: buildTreeSnapshot(u, v),
    auxiliaryState: {
      customState: {
        DepthDiff: diff,
        TargetDepth: depth[v],
      },
    },
    variables: { diff },
  });

  if (diff > 0) {
    for (let j = LOGN - 1; j >= 0; j--) {
      const bitSet = (diff & (1 << j)) !== 0;
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 30,
        explanation: {
          what: `Check bit ${j} (2^${j} = ${1 << j}) of diff (${diff}): bit is ${bitSet ? "1" : "0"}.`,
          why: bitSet ? `Jump Node u up by ${1 << j} levels to Node ${up[u][j]}.` : `Do not jump at level 2^${j}.`,
        },
        primarySnapshot: buildTreeSnapshot(u, v),
        auxiliaryState: {
          customState: {
            Bit: j,
            BitSet: String(bitSet),
            CurrentU: u,
          },
        },
        variables: { j, bitSet },
      });

      if (bitSet) {
        u = up[u][j];
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 31,
          explanation: {
            what: `Lifted Node u to Node ${u} at depth ${depth[u]}.`,
            why: `Applied 2^${j} = ${1 << j} ancestor jump.`,
          },
          primarySnapshot: buildTreeSnapshot(u, v),
          auxiliaryState: {
            customState: {
              LiftedU: u,
              NewDepth: depth[u],
            },
          },
          variables: { u, newDepth: depth[u] },
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 33,
    explanation: {
      what: `Check if u == v after depth equalization: u=${u}, v=${v}.`,
      why: u === v ? `Node ${v} was an ancestor of original target node! Return ${u}.` : "Nodes are distinct at same depth, proceed to parallel binary lifting.",
    },
    primarySnapshot: buildTreeSnapshot(u, v, u === v ? u : -1),
    auxiliaryState: {
      customState: {
        NodeU: u,
        NodeV: v,
        Equal: String(u === v),
      },
    },
    variables: { u, v, isEqual: u === v },
  });

  let finalLca = u;

  if (u !== v) {
    for (let j = LOGN - 1; j >= 0; j--) {
      const uAncestor = up[u][j];
      const vAncestor = up[v][j];
      const diffAncestors = uAncestor !== vAncestor;

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 37,
        explanation: {
          what: `Inspect 2^${j} = ${1 << j} ancestors: up[${u}][${j}] = ${uAncestor}, up[${v}][${j}] = ${vAncestor}.`,
          why: diffAncestors
            ? `Ancestors differ (${uAncestor} != ${vAncestor}), so jump up safely.`
            : `Ancestors equal (${uAncestor}), jump power 2^${j} is too high (overshoots LCA).`,
        },
        primarySnapshot: buildTreeSnapshot(u, v),
        auxiliaryState: {
          customState: {
            JumpPower: `2^${j} (${1 << j})`,
            uAncestor,
            vAncestor,
            WillJump: String(diffAncestors),
          },
        },
        variables: { j, uAncestor, vAncestor, diffAncestors },
      });

      if (diffAncestors) {
        u = uAncestor;
        v = vAncestor;
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 38,
          explanation: {
            what: `Lifted both nodes to u = ${u}, v = ${v} at depth ${depth[u]}.`,
            why: `Parallel jump by ${1 << j} levels completed.`,
          },
          primarySnapshot: buildTreeSnapshot(u, v),
          auxiliaryState: {
            customState: {
              NewU: u,
              NewV: v,
              Depth: depth[u],
            },
          },
          variables: { u, v, depth: depth[u] },
        });
      }
    }
    finalLca = up[u][0];
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 41,
    explanation: {
      what: `Found LCA of nodes ${targetU} and ${targetV}: Node ${finalLca}!`,
      why: "Lowest common ancestor identified in $O(\\log N)$ jump steps.",
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
    "Compute the Lowest Common Ancestor (LCA) of nodes $u$ and $v$ in $O(\\log N)$ time per query after an $O(N \\log N)$ binary lifting precomputation.\n\n### Problem Statement\nGiven a tree with $N$ nodes rooted at node $0$ and a query pair of nodes $(u, v)$, find their Lowest Common Ancestor (LCA) using Binary Lifting (doubling dynamic programming).\n\nBinary Lifting precomputes a 2D dynamic programming table `up[u][j]` representing the $2^j$-th ancestor of node $u$. Query execution first equalizes the depths of $u$ and $v$ using powers-of-two jump steps, then lifts both nodes in parallel until they sit directly beneath their lowest common ancestor.\n\n### Input Parameters\n- `numNodes`: Integer $N$, total number of vertices ($0$ to $N-1$).\n- `edges`: Array of undirected edge pairs `[u, v]` defining tree topology.\n- `query`: A tuple `[u, v]` specifying the two target nodes for LCA evaluation.\n\n### Output\n- Returns the node index of the Lowest Common Ancestor $LCA(u, v)$.\n\n### Constraints & Edge Cases\n- $1 \\le N \\le 10^5$.\n- $0 \\le u, v < N$.\n- Root node is fixed at `0`.\n- Single node tree ($N=1$): returns `0`.\n- Ancestor query ($u$ is direct ancestor of $v$): returns $u$.",
  constraints: ["1 <= N <= 10^5", "0 <= u, v < N"],
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
    time: "Preprocessing takes $O(N \\log N)$ to build up[u][j] table. Each LCA query takes $O(\\log N)$ time using binary powers of 2.",
    space: "$O(N \\log N)$ space to store the ancestor table up[N][log N].",
  },
  topicGuide: {
    overview:
      "Binary Lifting precomputes $2^j$-th ancestor jump steps for every tree node into a 2D dynamic programming table `up[u][j]`. Instead of stepping upward one parent at a time in $O(N)$ worst-case time, binary lifting decomposes any upward path length into powers of two (e.g. $13 = 8 + 4 + 1$), enabling $O(\\log N)$ queries.\n\nReal-world systems rely on binary lifting for fast tree/DAG queries: Linux kernel Control Group (cgroup) memory hierarchy inheritance lookups, distributed network routing tables, and compilers resolving parent scopes in Abstract Syntax Trees (ASTs). The fundamental DP relation is: $up[u][j] = up[up[u][j-1]][j-1]$.",
    sections: [
      {
        heading: "Core Concept: Binary Jumping & DP Recurrence",
        body: "The $2^j$-th ancestor of node $u$ is achieved by jumping $2^{j-1}$ levels up to intermediate node $m = up[u][j-1]$, and then jumping another $2^{j-1}$ levels up from $m$. Precomputation uses a single DFS pass to record depths and 1-step parents (`up[u][0]`), followed by DP table construction in $O(N \\log N)$ total time.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "Memory layout of `up[N][LOGN]` should be organized contiguous in memory (row-major vs column-major) to optimize CPU L1/L2 cache locality during batch query processing. Space complexity is $O(N \\log N)$, which easily scales to millions of nodes in memory (e.g., $N=10^6, \\log_2 N \\approx 20$, using only $\\sim 80$ MB RAM).",
      },
      {
        heading: "Implementation Nuances: Two-Phase Query",
        body: "Phase 1: Depth Equalization. Calculate $\\Delta = depth[u] - depth[v]$. Jump $u$ upward by inspecting binary bits of $\\Delta$ from $\\lfloor\\log_2 N\\rfloor$ down to 0.\nPhase 2: Parallel Binary Lifting. If $u \\neq v$, iterate $j$ from $\\lfloor\\log_2 N\\rfloor$ down to 0: if $up[u][j] \\neq up[v][j]$, jump both $u \\leftarrow up[u][j]$ and $v \\leftarrow up[v][j]$. At completion, $up[u][0]$ is the unique LCA.",
      },
      {
        heading: "Edge Case Analysis",
        body: "1. Ancestor-Descendant queries ($u$ is ancestor of $v$): Phase 1 equalizes $v$ to $u$, resulting in $u == v$ immediately.\n2. Root level nodes: Attempting to jump past the root clamps to root or sentinel 0/null.\n3. Degenerate chain trees ($N=10^5$, max depth $N-1$): Binary lifting operates in $O(\\log N)$ steps regardless of tree skewness.",
      },
    ],
    keyTerms: [
      {
        term: "Binary Lifting Table (`up[u][j]`)",
        definition:
          "A dynamic programming table storing the $2^j$-th ancestor node for every vertex $u$.",
      },
      {
        term: "Lowest Common Ancestor (LCA)",
        definition:
          "The deepest node in a rooted tree that is an ancestor of both target nodes $u$ and $v$.",
      },
      {
        term: "Binary Decomposition of Paths",
        definition:
          "Expressing any integer distance $K$ as a sum of powers of two to perform $O(\\log K)$ total pointer jumps.",
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

export default binaryLiftingLca;
