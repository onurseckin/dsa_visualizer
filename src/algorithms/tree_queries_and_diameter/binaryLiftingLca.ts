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
  const safeInput = input ?? DEFAULT_BINARY_LIFTING_LCA_INPUT;
  const rawNumNodes = safeInput.numNodes ?? DEFAULT_BINARY_LIFTING_LCA_INPUT.numNodes;
  const n = Math.max(1, Math.min(15, rawNumNodes));
  const rawEdges = Array.isArray(safeInput.edges)
    ? safeInput.edges
    : DEFAULT_BINARY_LIFTING_LCA_INPUT.edges;
  const edgeList = rawEdges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const rawQuery = Array.isArray(safeInput.query)
    ? safeInput.query
    : DEFAULT_BINARY_LIFTING_LCA_INPUT.query;
  const [qU, qV] = rawQuery;
  const targetU = Math.max(0, Math.min(n - 1, qU ?? 0));
  const targetV = Math.max(0, Math.min(n - 1, qV ?? 0));

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edgeList) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const LOGN = Math.max(1, Math.ceil(Math.log2(n + 1)));
  const depth = Array(n).fill(0);
  const up: number[][] = Array.from({ length: n }, () => Array(LOGN).fill(0));

  // Precompute tree children structure rooted at 0 for tree snapshot layout
  const children: number[][] = Array.from({ length: n }, () => []);
  const buildTreeChildren = (curr: number, p: number) => {
    for (const nxt of adj[curr]) {
      if (nxt !== p) {
        children[curr].push(nxt);
        buildTreeChildren(nxt, curr);
      }
    }
  };
  if (n > 0) buildTreeChildren(0, 0);

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildTreeSnapshot = (
    activeU: number,
    activeV: number,
    lcaNode: number = -1,
    visitingNode: number = -1,
  ) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i]?.[0];
      const rightChild = children[i]?.[1];
      const isActive = i === activeU || i === activeV;
      const isLca = i === lcaNode;
      const isVisiting = i === visitingNode;

      let state: TreeNodeItem["state"] = "default";
      if (isLca) state = "sorted";
      else if (isActive) state = "active";
      else if (isVisiting) state = "compare";

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

  // Step 1: Function entry / init
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 3,
    explanation: {
      what: `Initialize Binary Lifting LCA for N = ${n} nodes and query LCA(${targetU}, ${targetV}).`,
      why: "Setting target nodes and preparing adjacency structures for depth calculation and binary jump table construction.",
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

  // Step 2: Adjacency list creation
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Construct undirected tree graph for ${n} vertices with ${edgeList.length} edges.`,
      why: "Adjacency lists enable tree traversal during DFS depth precomputation.",
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV),
    auxiliaryState: {
      customState: {
        Status: "Adjacency List Built",
        "Target Query": `LCA(${targetU}, ${targetV})`,
      },
    },
    variables: { numNodes: n, numEdges: edgeList.length },
  });

  // Step 3: Calculate LOGN limit
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 9,
    explanation: {
      what: `Compute binary jump power bound LOGN = ceil(log2(${n} + 1)) = ${LOGN}.`,
      why: `Determines the maximum power-of-two jump level required (up to 2^${LOGN - 1} = ${1 << (LOGN - 1)} steps).`,
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

  // Step 4: Initialize depth array
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 10,
    explanation: {
      what: `Initialize node depth tracking array for ${n} vertices.`,
      why: "Tree depth governs how many levels the deeper query node must be lifted before parallel traversal.",
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV),
    auxiliaryState: {
      customState: {
        Status: "Depth Array Initialized",
        LOGN,
      },
    },
    variables: { numNodes: n },
  });

  // Step 5: Initialize 2D up table
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 11,
    explanation: {
      what: `Allocate binary lifting table up[${n}][${LOGN}].`,
      why: "up[u][j] will record the ancestor of node u located exactly 2^j levels above it.",
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV),
    auxiliaryState: {
      customState: {
        Status: "2D Table Initialized",
        "Table Size": `${n} x ${LOGN}`,
      },
    },
    variables: { numNodes: n, LOGN },
  });

  // Step 6: Invoke DFS from root 0
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 20,
    explanation: {
      what: "Start DFS depth and parent precomputation from root Node 0.",
      why: "Rooting the tree computes each node's depth and establishes base 1-step parent references (up[u][0]).",
    },
    primarySnapshot: buildTreeSnapshot(targetU, targetV, -1, 0),
    auxiliaryState: {
      customState: {
        Status: "Starting DFS",
        "Root Node": 0,
      },
    },
    variables: { root: 0, depth: 0 },
  });

  const dfs = (u: number, p: number, d: number) => {
    depth[u] = d;
    up[u][0] = p;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 14,
      explanation: {
        what: `DFS visit Node ${u}: record depth[${u}] = ${d}.`,
        why: "Depth measures distance from root 0 to establish structural levels.",
      },
      primarySnapshot: buildTreeSnapshot(targetU, targetV, -1, u),
      auxiliaryState: {
        customState: {
          "Visiting Node": u,
          Depth: d,
          "1-Step Parent": p,
        },
      },
      variables: { currNode: u, depth: d, parent: p },
    });

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 15,
      explanation: {
        what: `Set immediate parent up[${u}][0] = ${p}.`,
        why: "Establishes the base case 2^0 = 1 jump ancestor for doubling DP table construction.",
      },
      primarySnapshot: buildTreeSnapshot(targetU, targetV, -1, u),
      auxiliaryState: {
        customState: {
          "Visiting Node": u,
          "up[u][0]": p,
        },
      },
      variables: { currNode: u, parent: p },
    });

    for (const v of adj[u]) {
      if (v !== p) {
        dfs(v, u, d + 1);
      }
    }
  };

  if (n > 0) dfs(0, 0, 0);

  // Precompute binary lifting DP table
  for (let j = 1; j < LOGN; j++) {
    for (let i = 0; i < n; i++) {
      up[i][j] = up[up[i][j - 1]][j - 1];
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 23,
        explanation: {
          what: `DP table entry: up[Node ${i}][2^${j}=${1 << j}] = Node ${up[i][j]}.`,
          why: `Jumping 2^${j} levels is computed by taking a 2^${j - 1} jump to Node ${up[i][j - 1]} and then another 2^${j - 1} jump.`,
        },
        primarySnapshot: buildTreeSnapshot(targetU, targetV),
        auxiliaryState: {
          customState: {
            "DP Cell": `up[${i}][${j}] = ${up[i][j]}`,
            "Jump Level": `2^${j} (${1 << j} steps)`,
            "Intermediate Node": up[i][j - 1],
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
      what: `Compare node depths: depth[Node ${u}] = ${depth[u]}, depth[Node ${v}] = ${depth[v]}.`,
      why:
        depth[u] < depth[v]
          ? `Node ${u} is shallower than Node ${v}; swap nodes to make u the deeper target.`
          : `Node ${u} is already at equal or deeper depth than Node ${v}.`,
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
        what: `Swapped target nodes: u = Node ${u} (depth ${depth[u]}), v = Node ${v} (depth ${depth[v]}).`,
        why: "Depth alignment requires operating on the deeper node first.",
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
      what: `Calculate depth difference diff = ${depth[u]} - ${depth[v]} = ${diff}.`,
      why:
        diff > 0
          ? `Node ${u} must be lifted upward by ${diff} levels to match Node ${v}'s depth.`
          : "Nodes sit at identical depths; no depth alignment required.",
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
          what: `Inspect bit ${j} (2^${j} = ${1 << j}) of depth difference ${diff}: bit is ${bitSet ? "1" : "0"}.`,
          why: bitSet
            ? `Bit is active; lift Node u by 2^${j} = ${1 << j} steps upward to Node ${up[u][j]}.`
            : "Bit is inactive; skip this power-of-two jump level.",
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
            why: `Applied 2^${j} = ${1 << j} level binary jump using up table.`,
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
      what: `Evaluate node alignment after depth equalization: u = Node ${u}, v = Node ${v}.`,
      why:
        u === v
          ? `Nodes coincide at Node ${u}; the shallower target was an ancestor of the deeper target. Return Node ${u} as LCA.`
          : `Nodes are at equal depth (${depth[u]}) but in distinct subtrees. Proceed to parallel binary lifting.`,
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
          what: `Inspect 2^${j} = ${1 << j} level ancestors: up[${u}][${j}] = ${uAncestor}, up[${v}][${j}] = ${vAncestor}.`,
          why: diffAncestors
            ? `Ancestors differ (${uAncestor} != ${vAncestor}); jump both nodes upward simultaneously.`
            : `Ancestors coincide (${uAncestor}); jumping 2^${j} steps would overshoot the lowest common ancestor.`,
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
            what: `Lifted both nodes to u = Node ${u}, v = Node ${v} (depth ${depth[u]}).`,
            why: `Parallel binary jump of 2^${j} = ${1 << j} levels completed.`,
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
      what: `Found Lowest Common Ancestor for original query: Node ${finalLca}!`,
      why: "Both nodes sit directly beneath their lowest common ancestor; taking 1 final step (up[u][0]) yields the LCA.",
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
  topicIds: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Hard",
  description:
    "<p>Compute the Lowest Common Ancestor (LCA) of nodes <code>u</code> and <code>v</code> in <code>O(log N)</code> time per query after an <code>O(N log N)</code> binary lifting precomputation.</p><h3>Problem Statement</h3><p>Given a tree with <code>N</code> nodes rooted at node 0 and a query pair of nodes <code>(u, v)</code>, find their Lowest Common Ancestor (LCA) using Binary Lifting (doubling dynamic programming).</p><p>Binary Lifting precomputes a 2D dynamic programming table <code>up[u][j]</code> representing the <code>2^j</code>-th ancestor of node <code>u</code>. Query execution first equalizes the depths of <code>u</code> and <code>v</code> using powers-of-two jump steps, then lifts both nodes in parallel until they sit directly beneath their lowest common ancestor.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>numNodes</code> (total vertices), <code>edges</code> (edge pairs), and <code>query</code> (target node tuple <code>[u, v]</code>).</li><li><strong>Output:</strong> Node index of the Lowest Common Ancestor <code>LCA(u, v)</code>.</li></ul>",
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
    time: "Preprocessing takes O(N log N) to build up[u][j] table. Each LCA query takes O(log N) time using binary powers of 2.",
    space: "O(N log N) space to store the ancestor table up[N][log N].",
  },
  topicGuide: {
    overview:
      "<p>Binary Lifting precomputes <code>2^j</code>-th ancestor jump steps for every tree node into a 2D dynamic programming table <code>up[u][j]</code>. Instead of stepping upward one parent at a time in <code>O(N)</code> worst-case time, binary lifting decomposes any upward path length into powers of two (e.g. <code>13 = 8 + 4 + 1</code>), enabling <code>O(log N)</code> queries.</p><p>Real-world systems rely on binary lifting for fast tree/DAG queries: Linux kernel Control Group (cgroup) memory hierarchy inheritance lookups, distributed network routing tables, and compilers resolving parent scopes in Abstract Syntax Trees (ASTs). The fundamental DP relation is: <code>up[u][j] = up[up[u][j-1]][j-1]</code>.</p>",
    sections: [
      {
        heading: "Core Concept: Binary Jumping & DP Recurrence",
        body: "<p>The <code>2^j</code>-th ancestor of node <code>u</code> is achieved by jumping <code>2^(j-1)</code> levels up to intermediate node <code>m = up[u][j-1]</code>, and then jumping another <code>2^(j-1)</code> levels up from <code>m</code>. Precomputation uses a single DFS pass to record depths and 1-step parents (<code>up[u][0]</code>), followed by DP table construction in <code>O(N log N)</code> total time.</p>",
      },
      {
        heading: "Systems & Performance Impact",
        body: "<p>Organizing the memory layout of <code>up[N][LOGN]</code> efficiently optimizes CPU L1/L2 cache locality during batch query processing. Space complexity is <code>O(N log N)</code>, which easily scales to millions of nodes in memory (e.g., <code>N = 10^6, log2 N &approx; 20</code>, consuming minimal RAM).</p>",
      },
      {
        heading: "Implementation Nuances: Two-Phase Query",
        body: "<p><strong>Phase 1: Depth Equalization.</strong> Calculate <code>&Delta; = depth[u] - depth[v]</code>. Jump <code>u</code> upward by inspecting binary bits of <code>&Delta;</code> from highest power down to 0.<br/><strong>Phase 2: Parallel Binary Lifting.</strong> If <code>u &ne; v</code>, iterate <code>j</code> downward: if <code>up[u][j] &ne; up[v][j]</code>, jump both nodes in parallel (<code>u &larr; up[u][j]</code> and <code>v &larr; up[v][j]</code>). At completion, <code>up[u][0]</code> is the unique LCA.</p>",
      },
      {
        heading: "Edge Case Analysis",
        body: "<p><strong>Ancestor-Descendant queries:</strong> Phase 1 equalizes <code>v</code> to <code>u</code>, resulting in <code>u == v</code> immediately.<br/><strong>Root level nodes:</strong> Attempting to jump past the root clamps to root node 0.<br/><strong>Degenerate chain trees:</strong> Binary lifting operates in <code>O(log N)</code> steps regardless of tree skewness.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Binary Lifting Table (up[u][j])",
        definition:
          "A dynamic programming table storing the 2^j-th ancestor node for every vertex u.",
      },
      {
        term: "Lowest Common Ancestor (LCA)",
        definition:
          "The deepest node in a rooted tree that is an ancestor of both target nodes u and v.",
      },
      {
        term: "Binary Decomposition of Paths",
        definition:
          "Expressing any integer distance K as a sum of powers of two to perform O(log K) total pointer jumps.",
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
