import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TreeNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Lowest Common Ancestor (LCA) of nodes u and v is the deepest shared ancestor in a rooted tree structure.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "visited" },
        { id: "2", val: 2, leftId: "5", rightId: "6", state: "default" },
        { id: "3", val: 3, state: "active" },
        { id: "4", val: 4, state: "active" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Linear Ancestor Traversal: Stepping upward one parent link at a time takes O(N) worst-case time on skewed chain trees.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", state: "visited" },
        { id: "1", val: 1, leftId: "2", state: "visited" },
        { id: "2", val: 2, leftId: "3", state: "visited" },
        { id: "3", val: 3, state: "active" },
      ],
    },
  },
  {
    narrative:
      "Binary Lifting Doubling Principle: Precomputing 2^j-th ancestors into table up[u][j] allows decomposing any upward path into powers-of-two jumps.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "visited" },
        { id: "2", val: 2, state: "default" },
        { id: "3", val: 3, state: "active" },
        { id: "4", val: 4, state: "default" },
      ],
    },
  },
  {
    narrative:
      "DP Recurrence Relation: up[u][j] = up[up[u][j-1]][j-1] (jumping 2^j levels equals taking two consecutive jumps of 2^(j-1) levels).",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "swap" },
        { id: "2", val: 2, state: "default" },
        { id: "3", val: 3, state: "active" },
        { id: "4", val: 4, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Precomputation Phase: A single DFS pass calculates depth[u] and base 1-step parents up[u][0] for all nodes in O(N log N) time.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "active" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "compare" },
        { id: "2", val: 2, leftId: "5", rightId: "6", state: "compare" },
        { id: "3", val: 3, state: "default" },
        { id: "4", val: 4, state: "default" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Phase 1 (Depth Equalization): The deeper query node is lifted upward using binary power jumps until both nodes rest at equal depth.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "default" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "active" },
        { id: "2", val: 2, leftId: "5", rightId: "6", state: "active" },
        { id: "3", val: 3, state: "visited" },
        { id: "4", val: 4, state: "default" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Direct Ancestor Short-Circuit: If after depth equalization u equals v, then v was an ancestor of u, returning u as the LCA.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "default" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 2, state: "default" },
        { id: "3", val: 3, state: "default" },
        { id: "4", val: 4, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Phase 2 (Parallel Binary Lifting): If u and v differ, both nodes jump upward simultaneously whenever up[u][j] != up[v][j].",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "active" },
        { id: "2", val: 2, leftId: "5", rightId: "6", state: "active" },
        { id: "3", val: 3, state: "visited" },
        { id: "4", val: 4, state: "default" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, state: "visited" },
      ],
    },
  },
  {
    narrative: "Binary Lifting answers LCA queries in O(log N) query time using O(N log N) space.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 0, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 1, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 2, leftId: "5", rightId: "6", state: "sorted" },
        { id: "3", val: 3, state: "sorted" },
        { id: "4", val: 4, state: "sorted" },
        { id: "5", val: 5, state: "sorted" },
        { id: "6", val: 6, state: "sorted" },
      ],
    },
  },
];

export const generateBinaryLiftingLcaSteps = (input: BinaryLiftingLcaInput): AlgorithmStep[] => {
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

  const buildTreeSnapshot = (
    activeU: number,
    activeV: number,
    lcaNode: number = -1,
    visitingNode: number = -1,
    focusState: "active" | "swap" | "compare" | "sorted" | "visited" = "active",
  ) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i]?.[0];
      const rightChild = children[i]?.[1];
      const isLca = i === lcaNode;
      const isActive = i === activeU || i === activeV;
      const isVisiting = i === visitingNode;

      let state: TreeNodeItem["state"] = "default";
      if (isLca) state = "sorted";
      else if (isVisiting) state = focusState;
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

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized Binary Lifting LCA for N = ${n} nodes and target query LCA(${targetU}, ${targetV}). LOGN bound = ${LOGN}.`,
      primarySnapshot: buildTreeSnapshot(targetU, targetV),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { targetU, targetV, numNodes: n, LOGN },
    }),
  );

  const dfs = (u: number, p: number, d: number) => {
    depth[u] = d;
    up[u][0] = p;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `DFS visit Node ${u}: recorded depth[${u}] = ${d} and base parent up[${u}][0] = ${p}.`,
        primarySnapshot: buildTreeSnapshot(targetU, targetV, -1, u, "compare"),
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { currNode: u, depth: d, parent: p },
      }),
    );

    for (const v of adj[u]) {
      if (v !== p) {
        dfs(v, u, d + 1);
      }
    }
  };

  if (n > 0) dfs(0, 0, 0);

  for (let j = 1; j < LOGN; j++) {
    for (let i = 0; i < n; i++) {
      up[i][j] = up[up[i][j - 1]][j - 1];
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Precomputed binary lifting DP table up[N][${LOGN}] in O(N log N) time.`,
      primarySnapshot: buildTreeSnapshot(targetU, targetV, -1, 0, "visited"),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { LOGN },
    }),
  );

  let u = targetU;
  let v = targetV;

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Comparing query node depths: depth[Node ${u}] = ${depth[u]}, depth[Node ${v}] = ${depth[v]}.`,
      primarySnapshot: buildTreeSnapshot(u, v, -1, u, "compare"),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { depthU: depth[u], depthV: depth[v] },
    }),
  );

  if (depth[u] < depth[v]) {
    const temp = u;
    u = v;
    v = temp;
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Swapped query nodes: u = Node ${u} (deeper, depth ${depth[u]}), v = Node ${v} (shallower, depth ${depth[v]}).`,
        primarySnapshot: buildTreeSnapshot(u, v, -1, u, "swap"),
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { u, v },
      }),
    );
  }

  const diff = depth[u] - depth[v];
  if (diff > 0) {
    for (let j = LOGN - 1; j >= 0; j--) {
      const bitSet = (diff & (1 << j)) !== 0;
      if (bitSet) {
        u = up[u][j];
        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Lifted deeper node u by 2^${j} = ${1 << j} levels to Node ${u} (new depth ${depth[u]}).`,
            primarySnapshot: buildTreeSnapshot(u, v, -1, u, "swap"),
            auxiliaryState: {
              stack: [],
              visited: [],
            },
            variables: { u, newDepth: depth[u] },
          }),
        );
      }
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Depth equalization complete: Node u = ${u}, Node v = ${v} (both at depth ${depth[u]}).`,
      primarySnapshot: buildTreeSnapshot(u, v, -1, u, "active"),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { u, v, isEqual: u === v },
    }),
  );

  let finalLca = u;

  if (u !== v) {
    for (let j = LOGN - 1; j >= 0; j--) {
      const uAncestor = up[u][j];
      const vAncestor = up[v][j];
      if (uAncestor !== vAncestor) {
        u = uAncestor;
        v = vAncestor;
        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Parallel binary jump of 2^${j} = ${1 << j} levels: lifted both nodes to u = Node ${u}, v = Node ${v} (depth ${depth[u]}).`,
            primarySnapshot: buildTreeSnapshot(u, v, -1, u, "swap"),
            auxiliaryState: {
              stack: [],
              visited: [],
            },
            variables: { u, v, depth: depth[u] },
          }),
        );
      }
    }
    finalLca = up[u][0];
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `LCA query complete: Lowest Common Ancestor of target nodes is Node ${finalLca}!`,
      primarySnapshot: buildTreeSnapshot(u, v, finalLca),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: {
        lca: finalLca,
        targetU,
        targetV,
      },
    }),
  );

  return steps;
};

export const BINARY_LIFTING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports math module.",
    3: "Function signature for Binary Lifting LCA.",
    4: "Initialize adjacency list.",
    9: "Calculate LOGN = ceil(log2(n + 1)).",
    10: "Initialize depth array.",
    11: "Initialize 2D table up[n][LOGN].",
    13: "Define recursive DFS helper.",
    14: "Record node depth.",
    15: "Set 1-step parent up[node][0].",
    20: "Execute DFS traversal from root 0.",
    21: "Outer loop for binary lifting DP.",
    23: "DP recurrence relation: up[i][j] = up[up[i][j-1]][j-1].",
    25: "Check if depth of u is less than depth of v.",
    26: "Swap u and v so u is deeper.",
    28: "Calculate depth difference diff.",
    30: "Check if j-th bit of diff is set.",
    31: "Lift node u upward by 2^j levels.",
    33: "Check if u == v after depth equalization.",
    36: "Iterate jump power j for parallel lifting.",
    37: "Check if ancestors at 2^j jump differ.",
    38: "Lift u upward by 2^j levels.",
    39: "Lift v upward by 2^j levels.",
    41: "Return up[u][0] as the LCA.",
  },
};

export const binaryLiftingLca: AlgorithmDefinition<BinaryLiftingLcaInput> = {
  id: "binary-lifting-lca",
  title: "Binary Lifting for LCA",
  topicIds: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Hard",
  description:
    "<p>Given a rooted tree with <code>N</code> nodes and a query pair of nodes <code>(u, v)</code>, compute their Lowest Common Ancestor (LCA) in <code>O(log N)</code> query time using Binary Lifting.</p><h3>Problem Statement</h3><p>Precompute a 2D dynamic programming table <code>up[u][j]</code> representing the <code>2^j</code>-th ancestor of node <code>u</code>. Query execution equalizes the depths of <code>u</code> and <code>v</code> using binary powers of two, then lifts both nodes in parallel until they sit directly beneath their lowest common ancestor.</p><h3>Input Parameters</h3><ul><li><code>numNodes</code>: Total number of tree vertices.</li><li><code>edges</code>: Array of tree edge pairs <code>[u, v]</code>.</li><li><code>query</code>: Target node tuple <code>[u, v]</code>.</li></ul><h3>Output</h3><p>Returns the vertex index of the Lowest Common Ancestor <code>LCA(u, v)</code>.</p>",
  constraints: ["1 <= N <= 10^5", "0 <= u, v < N"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "7 nodes, query LCA(3, 4)",
      outputDisplay: "LCA = Node 1",
      title: "Standard Binary Tree LCA",
      input: DEFAULT_BINARY_LIFTING_LCA_INPUT,
      output: "Node 1",
      explanation: "Nodes 3 and 4 are siblings under parent Node 1.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "7 nodes, query LCA(3, 6)",
      outputDisplay: "LCA = Node 0",
      title: "Adversarial Cross Subtree LCA",
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
      scenario: "boundary",
      inputDisplay: "7 nodes, query LCA(1, 3)",
      outputDisplay: "LCA = Node 1",
      title: "Boundary Ancestor-Descendant Query",
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
      "<p>Binary Lifting precomputes <code>2^j</code>-th ancestor jump steps for every tree node into a 2D dynamic programming table <code>up[u][j]</code>. Instead of stepping upward one parent at a time in <code>O(N)</code> worst-case time, binary lifting decomposes any upward path length into powers of two (e.g. <code>13 = 8 + 4 + 1</code>), enabling <code>O(log N)</code> queries.</p>",
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
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(log N)</code><br/><strong>Space Complexity:</strong> <code>O(N log N)</code><br/>Preprocessing takes O(N log N). Each LCA query takes O(log N) time.</p>",
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
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 18",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 18,
      section: "18.3 Finding the lowest common ancestor",
    },
  ],
  defaultInput: DEFAULT_BINARY_LIFTING_LCA_INPUT,
};

export default binaryLiftingLca;
