import type { AlgorithmDefinition, AlgorithmStep, TreeNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface DsuOnTreeInput {
  numNodes: number;
  edges: [number, number][];
  colors: number[];
}

export const DEFAULT_DSU_ON_TREE_INPUT: DsuOnTreeInput = {
  numNodes: 6,
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
  ],
  colors: [1, 2, 1, 2, 3, 1],
};

const DSU_ON_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: compute DSU on Tree / Sack small-to-large merging for subtree color frequencies.",
    7: "Calculate subtree sizes sz[u] to find the heavy child (max subtree size) for each node.",
    10: "DFS helper to compute subtree sizes and identify big_child[u].",
    32: "DFS helper dfs_dsu(u, p, keep): main DSU on tree recursion.",
    33: "Step 1: Process all light children with keep=False (clears their frequencies after processing).",
    36: "Step 2: Process heavy child with keep=True (preserves its accumulated frequencies in the sack).",
    39: "Step 3: Merge light children subtrees into the main sack (small-to-large merge).",
    43: "Record answer for vertex u (e.g., distinct color count or most frequent color).",
    45: "If keep=False, clear current subtree contributions from the global sack.",
  },
};

export const generateDsuOnTreeSteps = (input: DsuOnTreeInput): AlgorithmStep[] => {
  const n = Math.max(2, Math.min(10, input.numNodes));
  const edgeList = input.edges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const colors =
    input.colors && input.colors.length === n
      ? input.colors
      : Array.from({ length: n }, (_, i) => (i % 3) + 1);

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edgeList) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const children: number[][] = Array.from({ length: n }, () => []);
  const sz = Array(n).fill(1);
  const bigChild = Array(n).fill(-1);

  // DFS 1: compute sizes & identify heavy child
  const dfsSize = (u: number, p: number) => {
    let maxSz = -1;
    for (const v of adj[u]) {
      if (v !== p) {
        children[u].push(v);
        dfsSize(v, u);
        sz[u] += sz[v];
        if (sz[v] > maxSz) {
          maxSz = sz[v];
          bigChild[u] = v;
        }
      }
    }
  };
  dfsSize(0, -1);

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildTreeSnapshot = (
    currNode: number,
    heavyNode: number = -1,
    lightNodes: Set<number> = new Set(),
  ) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i][0];
      const rightChild = children[i][1];
      const isActive = i === currNode;
      const isHeavy = i === heavyNode;
      const isLight = lightNodes.has(i);

      let state: TreeNodeItem["state"] = "default";
      if (isActive) state = "active";
      else if (isHeavy) state = "sorted";
      else if (isLight) state = "compare";

      return {
        id: String(i),
        val: colors[i],
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
    codeLine: 48,
    explanation: {
      what: `Precomputed subtree sizes sz[] and identified heavy children for all ${n} nodes.`,
      why: "Heavy children preserve their sack state to optimize total merge operations to O(N log N).",
    },
    primarySnapshot: buildTreeSnapshot(0, bigChild[0]),
    auxiliaryState: {
      customState: {
        "Heavy Child of Root":
          bigChild[0] !== -1 ? `Node ${bigChild[0]} (sz=${sz[bigChild[0]]})` : "None",
        "Subtree Sizes": sz.map((s, i) => `V${i}:${s}`).join(", "),
      },
    },
    variables: {
      numNodes: n,
      rootHeavyChild: bigChild[0],
    },
  });

  const cnt = new Map<number, number>();
  const ans = Array(n).fill(0);

  const addNodeColor = (u: number, p: number, val: number) => {
    cnt.set(colors[u], (cnt.get(colors[u]) || 0) + val);
    if (cnt.get(colors[u]) === 0) {
      cnt.delete(colors[u]);
    }
    for (const v of children[u]) {
      if (v !== p) {
        addNodeColor(v, u, val);
      }
    }
  };

  const dfsDsu = (u: number, p: number, keep: boolean) => {
    // 1. Process light children
    for (const v of children[u]) {
      if (v !== p && v !== bigChild[u]) {
        dfsDsu(v, u, false);
      }
    }

    // 2. Process heavy child (keep = true)
    if (bigChild[u] !== -1) {
      dfsDsu(bigChild[u], u, true);
    }

    const lightSet = new Set<number>();
    // 3. Merge light children into sack
    for (const v of children[u]) {
      if (v !== p && v !== bigChild[u]) {
        lightSet.add(v);
        addNodeColor(v, u, 1);
      }
    }

    // Add node u's color
    cnt.set(colors[u], (cnt.get(colors[u]) || 0) + 1);
    ans[u] = cnt.size; // number of distinct colors in subtree of u

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 43,
      explanation: {
        what: `Processed Node ${u} (color=${colors[u]}). Subtree has ${cnt.size} distinct colors!`,
        why: `Merged light children into heavy child Node ${bigChild[u]}'s sack.`,
      },
      primarySnapshot: buildTreeSnapshot(u, bigChild[u], lightSet),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          "Distinct Colors in Subtree": cnt.size,
          "Color Sack Frequencies": Array.from(cnt.entries())
            .map(([c, freq]) => `Color ${c}:${freq}`)
            .join(", "),
          KeepSack: keep ? "Yes" : "No (Will Clear)",
        },
      },
      variables: {
        currNode: u,
        distinctColors: cnt.size,
        keepSack: keep,
      },
    });

    // Clear sack if keep == false
    if (!keep) {
      addNodeColor(u, p, -1);
    }
  };

  dfsDsu(0, -1, true);

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 50,
    explanation: {
      what: "DSU on Tree processing complete across all nodes!",
      why: "Small-to-large merging evaluated subtree statistics in O(N log N) total operations.",
    },
    primarySnapshot: buildTreeSnapshot(0),
    auxiliaryState: {
      customState: {
        Status: "Complete!",
        "Distinct Colors Map": ans.map((a, i) => `Node ${i}:${a}`).join(", "),
      },
    },
    variables: {
      completed: true,
    },
  });

  return steps;
};

export const dsuOnTree: AlgorithmDefinition<DsuOnTreeInput> = {
  id: "dsu-on-tree",
  title: "DSU on Tree (Sack / Small-to-Large)",
  category: "tree_queries_and_diameter",
  categories: ["tree_queries_and_diameter"],
  difficulty: "Hard",
  description:
    "Compute offline subtree statistics (such as distinct color counts) for every node in a tree using DSU on Tree (Sack / Small-to-Large merging) in $O(N \\log N)$ total time.\n\n### Problem Statement\nGiven a rooted tree with $N$ vertices, where each vertex $u$ has an associated integer attribute (e.g. `color[u]`), answer subtree queries for all nodes $u \\in [0, N-1]$.\n\nNaive subtree frequency aggregation takes $O(N^2)$ time as light subtrees are computed and discarded. DSU on Tree optimizes this by identifying the 'heavy child' (child with maximum subtree size $sz[v]$) for each node. The algorithm recursively computes light subtrees with `keep=False` (clearing their frequency table after evaluation), computes the heavy child with `keep=True` (retaining its accumulated table), and finally merges the light children back into the heavy child's table in $O(N \\log N)$ total time.\n\n### Input Parameters\n- `numNodes`: Total number of vertices $N$.\n- `edges`: Array of undirected edge pairs `[u, v]` defining tree topology.\n- `colors`: Array of size $N$ containing attribute values for each vertex.\n\n### Output\n- Returns an array `ans` of size $N$ where `ans[u]` is the count of distinct colors in node $u$'s subtree.\n\n### Constraints & Edge Cases\n- `1 <= N <= 10^5`.\n- `1 <= colors[i] <= 10^9`.\n- Single node tree ($N=1$): returns `ans = [1]`.\n- Star graph topology: root has $N-1$ leaves, heavy child can be any leaf.",
  constraints: ["1 <= N <= 15"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "6 nodes tree with colors",
      outputDisplay: "Subtree distinct colors computed",
      title: "6 Nodes Color Frequencies",
      input: DEFAULT_DSU_ON_TREE_INPUT,
      output: "Distinct colors computed for all subtrees",
      explanation: "Heavy child sack maintained; light children merged.",
    },
    {
      kind: "complex",
      inputDisplay: "7 nodes binary tree",
      outputDisplay: "7 subtree stats",
      title: "Balanced Tree Small-to-Large",
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
        colors: [1, 1, 2, 2, 3, 3, 1],
      },
      output: "Complete subtree color queries answered",
      explanation: "Each node's light subtrees merged into heavy child sack.",
    },
    {
      kind: "negative",
      inputDisplay: "Single node tree",
      outputDisplay: "1 distinct color",
      title: "Single Node Tree",
      input: {
        numNodes: 1,
        edges: [],
        colors: [42],
      },
      output: "Distinct colors = 1",
      explanation: "Single node tree requires 0 merges.",
    },
  ],
  code: `def dsu_on_tree(n, edges, colors):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    sz = [1] * n
    big_child = [-1] * n
    
    def dfs_size(u, p):
        max_sz = -1
        for v in adj[u]:
            if v != p:
                dfs_size(v, u)
                sz[u] += sz[v]
                if sz[v] > max_sz:
                    max_sz = sz[v]
                    big_child[u] = v

    cnt = {}
    ans = [0] * n

    def add(u, p, val):
        c = colors[u]
        cnt[c] = cnt.get(c, 0) + val
        if cnt[c] == 0:
            del cnt[c]
        for v in adj[u]:
            if v != p:
                add(v, u, val)

    def dfs_dsu(u, p, keep):
        for v in adj[u]:
            if v != p and v != big_child[u]:
                dfs_dsu(v, u, False)
        if big_child[u] != -1:
            dfs_dsu(big_child[u], u, True)
            
        for v in adj[u]:
            if v != p and v != big_child[u]:
                add(v, u, 1)
        cnt[colors[u]] = cnt.get(colors[u], 0) + 1
        ans[u] = len(cnt)

        if not keep:
            add(u, p, -1)

    dfs_size(0, -1)
    dfs_dsu(0, -1, True)
    return ans`,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each node is re-inserted into the frequency sack only when it belongs to a light subtree. Since a path from root to leaf contains at most O(log N) light edges, each node is processed at most O(log N) times, taking O(N log N) total time.",
    space: "O(N) space for frequency hash map and tree structures.",
  },
  topicGuide: {
    overview:
      "DSU on Tree (also known as Sack or Heavy-Light subtree merging) solves offline subtree query problems without complex data structures like persistent segment trees or dynamic merge trees. By exploiting the Heavy-Light Decomposition principle, a node reuses the frequency data structure ('sack') of its largest subtree (the heavy child) and only re-inserts nodes from smaller subtrees (light children).\n\nReal-life applications include compiler AST static analysis (evaluating scope symbol frequencies across nested AST blocks), structural clade analysis in computational biology trees, and hierarchical category metric aggregations.",
    sections: [
      {
        heading: "Core Concept: The $O(N \\log N)$ Work Proof",
        body: "A tree edge $(u, v)$ is defined as 'light' if $sz[v] \\le sz[u] / 2$. Consequently, any simple path from the root to a leaf node crosses at most $\\log_2 N$ light edges. Because a node is only re-inserted into the global sack when traversing upward through a light edge, each node is added/removed at most $\\log_2 N$ times. Total time complexity is strictly bounded by $O(N \\log N)$.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "Unlike heavy pointer-based map merges (`std::map::merge`), DSU on tree utilizes a single, static flat global frequency array or hash map `cnt`. Re-inserting elements sequentially achieves cache-friendly memory access patterns without pointer allocations.",
      },
      {
        heading: "Implementation Nuances: 3-Phase Execution",
        body: "Phase 1: Pre-pass DFS calculates subtree sizes $sz[u]$ and identifies `big_child[u]` (the child with $\\max sz[v]$).\nPhase 2: Recurse on light children with `keep=False` (erasing their contributions from `cnt`).\nPhase 3: Recurse on `big_child[u]` with `keep=True` (retaining its frequency sack), then iterate through light subtrees and re-add their elements into `cnt` before recording `ans[u]`.",
      },
      {
        heading: "Edge Case Analysis",
        body: "1. Leaf nodes: `big_child[u] == -1`, requires only 1 insertion.\n2. Perfectly balanced binary trees: every edge is light except one, exact bound $\\frac{1}{2} N \\log_2 N$ steps.\n3. Skewed line trees: single heavy child path running from root to leaf, incurring $O(N)$ total operations (0 light edge traversals!).",
      },
    ],
    keyTerms: [
      {
        term: "Heavy Child (`big_child`)",
        definition: "The child $v$ of node $u$ with the largest subtree size $sz[v]$.",
      },
      {
        term: "Light Edge",
        definition: "An edge connecting parent $u$ to child $v$ where $sz[v] \\le sz[u] / 2$.",
      },
      {
        term: "Small-to-Large Merging",
        definition:
          "The algorithmic technique of merging smaller sets into a larger set to achieve logarithmic amortized cost per element.",
      },
    ],
  },
  trivia: DSU_ON_TREE_TRIVIA,
  generateSteps: generateDsuOnTreeSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 18",
      label: "Competitive Programmer's Handbook, Ch 18",
    },
  ],
  defaultInput: DEFAULT_DSU_ON_TREE_INPUT,
};
