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
    1: "Function signature for DSU on Tree taking vertex count n, edge list, and node colors.",
    2: "Initialize an empty adjacency list for all n vertices.",
    3: "Iterate through each undirected edge pair (u, v) in the tree.",
    4: "Add vertex v to u's adjacency list.",
    5: "Add vertex u to v's adjacency list to maintain undirected connections.",
    7: "Initialize subtree size array sz[] with 1 for all vertices.",
    8: "Initialize big_child[] array with -1 to track heavy child for each vertex.",
    10: "Define first DFS helper to compute subtree sizes and identify heavy children.",
    11: "Initialize running maximum subtree size max_sz to -1.",
    12: "Iterate over all adjacent neighbors v of vertex u.",
    13: "Skip parent node p to prevent traversing backwards up the tree.",
    14: "Recurse into child vertex v to calculate its subtree size.",
    15: "Accumulate child v's subtree size into parent sz[u].",
    16: "Check if child v's subtree size exceeds current maximum max_sz.",
    17: "Update max_sz with child v's subtree size.",
    18: "Designate child v as the heavy child big_child[u].",
    20: "Initialize frequency dictionary cnt to store color counts in the current sack.",
    21: "Initialize answer array ans[] of size n to store distinct color counts for each subtree.",
    23: "Helper function add(u, p, val) to recursively insert (val=+1) or remove (val=-1) u's subtree.",
    24: "Get color c of current vertex u.",
    25: "Update frequency of color c in the sack by val.",
    26: "Check if frequency of color c drops to 0 after removal.",
    27: "Delete color c key from frequency map if count is 0.",
    28: "Iterate through all adjacent neighbors v of vertex u.",
    29: "Skip parent node p during recursive color addition/removal.",
    30: "Recurse into child v to modify its subtree color counts.",
    32: "Main DSU on Tree recursive DFS taking vertex u, parent p, and keep boolean flag.",
    33: "Iterate through adjacent neighbors v of vertex u.",
    34: "Identify light children (neighbors v != p and v != big_child[u]).",
    35: "Recurse into light child v with keep=False (clears sack after computing ans[v]).",
    36: "Check if vertex u has a heavy child big_child[u].",
    37: "Recurse into heavy child with keep=True (preserves its sack for parent u).",
    39: "Iterate through neighbors v of vertex u to merge light children.",
    40: "Filter light children (v != p and v != big_child[u]).",
    41: "Merge light child v's subtree into the global sack by calling add(v, u, +1).",
    42: "Include vertex u's own color into the frequency map cnt.",
    43: "Record distinct color count ans[u] = len(cnt) for vertex u's subtree.",
    45: "Check if keep flag is False (meaning u is a light child).",
    46: "Clear vertex u's entire subtree contribution from the sack by calling add(u, p, -1).",
    48: "Run Pass 1 DFS to calculate sizes sz[] and identify heavy children.",
    49: "Run Pass 2 DSU on Tree starting at root node 0 with keep=True.",
    50: "Return computed distinct color count answer array ans.",
  },
};

export const generateDsuOnTreeSteps = (input: DsuOnTreeInput): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_DSU_ON_TREE_INPUT;
  const rawNumNodes = safeInput.numNodes ?? DEFAULT_DSU_ON_TREE_INPUT.numNodes;
  const n = Math.max(1, Math.min(10, rawNumNodes));
  const rawEdges = Array.isArray(safeInput.edges)
    ? safeInput.edges
    : DEFAULT_DSU_ON_TREE_INPUT.edges;
  const edgeList = rawEdges.filter(([u, v]) => u >= 0 && u < n && v >= 0 && v < n);
  const rawColors = safeInput.colors;
  const colors =
    Array.isArray(rawColors) && rawColors.length === n
      ? rawColors
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
  if (n > 0) dfsSize(0, -1);

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const buildTreeSnapshot = (
    currNode: number,
    heavyNode: number = -1,
    lightNodes: Set<number> = new Set(),
  ) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i]?.[0];
      const rightChild = children[i]?.[1];
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
    codeLine: 1,
    explanation: {
      what: `Initialize DSU on Tree execution for N = ${n} nodes.`,
      why: "Constructing adjacency topology and preparing frequency data structures for small-to-large subtree merging.",
    },
    primarySnapshot: buildTreeSnapshot(-1),
    auxiliaryState: {
      customState: {
        Status: "Initializing",
        "Subtree Sizes": "Uncalculated",
      },
    },
    variables: { numNodes: n },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 7,
    explanation: {
      what: "Initialize subtree size tracking array and heavy child designations.",
      why: "Subtree sizes determine which child is designated 'heavy' to inherit its parent's frequency accumulator without re-computation.",
    },
    primarySnapshot: buildTreeSnapshot(-1),
    auxiliaryState: {
      customState: {
        sz: JSON.stringify(Array(n).fill(1)),
        bigChild: JSON.stringify(Array(n).fill(-1)),
      },
    },
    variables: { numNodes: n },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 48,
    explanation: {
      what: "Execute Pass 1 DFS: compute subtree sizes and identify heavy children.",
      why: "Determining the largest child for each node bounds element re-insertions to at most log2(N) per node, guaranteeing O(N log N) overall runtime.",
    },
    primarySnapshot: buildTreeSnapshot(0, bigChild[0]),
    auxiliaryState: {
      customState: {
        "Subtree Sizes": sz.map((s, i) => `V${i}:${s}`).join(", "),
        "Heavy Children": bigChild
          .map((b, i) => `V${i}->${b !== -1 ? `V${b}` : "None"}`)
          .join(", "),
      },
    },
    variables: { numNodes: n, rootHeavyChild: bigChild[0] },
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

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 49,
    explanation: {
      what: "Execute Pass 2 DFS: start small-to-large merging from root Node 0.",
      why: "Traversal systematically computes light child subtrees, clears them, and retains heavy child subtree frequency tables.",
    },
    primarySnapshot: buildTreeSnapshot(0, bigChild[0]),
    auxiliaryState: {
      customState: {
        "Current Node": 0,
        KeepSack: "True",
      },
    },
    variables: { currNode: 0, parent: -1, keep: true },
  });

  const dfsDsu = (u: number, p: number, keep: boolean) => {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 32,
      explanation: {
        what: `Begin processing Node ${u} (heavy child: ${bigChild[u] !== -1 ? `Node ${bigChild[u]}` : "None"}, keep = ${keep}).`,
        why: "Processes light subtrees first, clears their state, then processes the heavy subtree and retains its accumulator.",
      },
      primarySnapshot: buildTreeSnapshot(u, bigChild[u]),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          "Heavy Child": bigChild[u] !== -1 ? `Node ${bigChild[u]}` : "None",
          KeepFlag: String(keep),
        },
      },
      variables: { currNode: u, parent: p, keep, heavyChild: bigChild[u] },
    });

    // 1. Process light children
    for (const v of children[u]) {
      if (v !== p && v !== bigChild[u]) {
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 35,
          explanation: {
            what: `Recurse into light child Node ${v} with keep = false.`,
            why: "Light child subtree queries are evaluated independently; their frequency contributions are erased afterwards to avoid polluting sibling state.",
          },
          primarySnapshot: buildTreeSnapshot(v, -1, new Set([v])),
          auxiliaryState: {
            customState: {
              "Parent Node": u,
              "Light Child": v,
              KeepFlag: "False",
            },
          },
          variables: { currNode: u, lightChild: v },
        });

        dfsDsu(v, u, false);
      }
    }

    // 2. Process heavy child (keep = true)
    if (bigChild[u] !== -1) {
      const hb = bigChild[u];
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 37,
        explanation: {
          what: `Recurse into heavy child Node ${hb} with keep = true.`,
          why: `Heavy child Node ${hb} represents the largest subtree (size ${sz[hb]}). Preserving its accumulator eliminates redundant re-insertions.`,
        },
        primarySnapshot: buildTreeSnapshot(hb, hb),
        auxiliaryState: {
          customState: {
            "Parent Node": u,
            "Heavy Child": hb,
            KeepFlag: "True",
          },
        },
        variables: { currNode: u, heavyChild: hb },
      });

      dfsDsu(hb, u, true);
    }

    const lightSet = new Set<number>();
    // 3. Merge light children into sack
    for (const v of children[u]) {
      if (v !== p && v !== bigChild[u]) {
        lightSet.add(v);
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 41,
          explanation: {
            what: `Merge light child Node ${v}'s subtree into global frequency map.`,
            why: "Re-inserting light child elements into the heavy child's retained accumulator combines all subtree attributes.",
          },
          primarySnapshot: buildTreeSnapshot(u, bigChild[u], lightSet),
          auxiliaryState: {
            customState: {
              "Current Node": u,
              "Merging Light Subtree": v,
              SackSize: cnt.size,
            },
          },
          variables: { currNode: u, mergingChild: v },
        });

        addNodeColor(v, u, 1);
      }
    }

    // Add node u's color
    cnt.set(colors[u], (cnt.get(colors[u]) || 0) + 1);
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 42,
      explanation: {
        what: `Include Node ${u}'s own attribute (color ${colors[u]}) in frequency map.`,
        why: "The root node of the current subtree contributes its color to the final frequency distribution.",
      },
      primarySnapshot: buildTreeSnapshot(u, bigChild[u], lightSet),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          "Node Color": colors[u],
          "Sack Frequencies": Array.from(cnt.entries())
            .map(([c, f]) => `C${c}:${f}`)
            .join(", "),
        },
      },
      variables: { currNode: u, color: colors[u] },
    });

    ans[u] = cnt.size; // number of distinct colors in subtree of u
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 43,
      explanation: {
        what: `Record ans[${u}] = ${cnt.size} distinct colors in Node ${u}'s subtree.`,
        why: "The frequency map now reflects the complete, unified attribute counts for Node u's subtree.",
      },
      primarySnapshot: buildTreeSnapshot(u, bigChild[u], lightSet),
      auxiliaryState: {
        customState: {
          "Current Node": u,
          "Subtree Distinct Colors": cnt.size,
          "Color Frequencies": Array.from(cnt.entries())
            .map(([c, f]) => `Color ${c}:${f}`)
            .join(", "),
          KeepSack: keep ? "Yes" : "No (Will Clear)",
        },
      },
      variables: { currNode: u, distinctColors: cnt.size, keepSack: keep },
    });

    // Clear sack if keep == false
    if (!keep) {
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 46,
        explanation: {
          what: `Clear Node ${u}'s subtree contributions from global frequency map (keep = false).`,
          why: "Because Node u is a light child of its parent, resetting its frequencies ensures clean state for remaining sibling traversals.",
        },
        primarySnapshot: buildTreeSnapshot(u),
        auxiliaryState: {
          customState: {
            "Current Node": u,
            Action: "Clearing Sack",
          },
        },
        variables: { currNode: u, action: "clearSack" },
      });

      addNodeColor(u, p, -1);
    }
  };

  if (n > 0) dfsDsu(0, -1, true);

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 50,
    explanation: {
      what: "DSU on Tree traversal complete across all nodes!",
      why: "Small-to-large merging successfully evaluated all subtree queries in O(N log N) total operations.",
    },
    primarySnapshot: buildTreeSnapshot(0),
    auxiliaryState: {
      customState: {
        Status: "Complete!",
        "Distinct Colors Map": ans.map((a, i) => `Node ${i}:${a}`).join(", "),
      },
    },
    variables: { completed: true },
  });

  return steps;
};

export const dsuOnTree: AlgorithmDefinition<DsuOnTreeInput> = {
  id: "dsu-on-tree",
  title: "DSU on Tree (Sack / Small-to-Large)",
  topicIds: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Hard",
  description:
    "<p>Compute offline subtree statistics (such as distinct color counts) for every node in a tree using DSU on Tree (Sack / Small-to-Large merging) in <code>O(N log N)</code> total time.</p><h3>Problem Statement</h3><p>Given a rooted tree with <code>N</code> vertices, where each vertex <code>u</code> has an associated attribute (e.g. <code>color[u]</code>), answer subtree queries for all nodes <code>u &in; [0, N-1]</code>.</p><p>Naive subtree frequency aggregation takes <code>O(N^2)</code> time as light subtrees are computed and discarded. DSU on Tree optimizes this by identifying the heavy child (the child with maximum subtree size <code>sz[v]</code>) for each node. The algorithm recursively computes light subtrees with <code>keep=False</code> (clearing their frequency table after evaluation), computes the heavy child with <code>keep=True</code> (retaining its accumulated table), and finally merges the light children back into the heavy child's table in <code>O(N log N)</code> total time.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>numNodes</code> (total vertices), <code>edges</code> (edge pairs), and <code>colors</code> array.</li><li><strong>Output:</strong> Returns array <code>ans</code> where <code>ans[u]</code> is the count of distinct colors in node <code>u</code>'s subtree.</li></ul>",
  constraints: ["1 <= N <= 10^5"],
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
      "<p>DSU on Tree (also known as Sack or Heavy-Light subtree merging) solves offline subtree query problems without complex data structures like persistent segment trees or dynamic merge trees. By exploiting the Heavy-Light Decomposition principle, a node reuses the frequency data structure ('sack') of its largest subtree (the heavy child) and only re-inserts nodes from smaller subtrees (light children).</p><p>Real-life applications include compiler AST static analysis (evaluating scope symbol frequencies across nested AST blocks), structural clade analysis in computational biology trees, and hierarchical category metric aggregations.</p>",
    sections: [
      {
        heading: "Core Concept: The O(N log N) Work Proof",
        body: "<p>A tree edge <code>(u, v)</code> is defined as 'light' if <code>sz[v] &le; sz[u] / 2</code>. Consequently, any simple path from the root to a leaf node crosses at most <code>log2 N</code> light edges. Because a node is only re-inserted into the global sack when traversing upward through a light edge, each node is added or removed at most <code>log2 N</code> times. Total time complexity is strictly bounded by <code>O(N log N)</code>.</p>",
      },
      {
        heading: "Systems & Performance Impact",
        body: "<p>Unlike heavy pointer-based map merges, DSU on tree utilizes a single, static flat global frequency array or hash map <code>cnt</code>. Re-inserting elements sequentially achieves cache-friendly memory access patterns without pointer allocations.</p>",
      },
      {
        heading: "Implementation Nuances: 3-Phase Execution",
        body: "<p><strong>Phase 1:</strong> Pre-pass DFS calculates subtree sizes <code>sz[u]</code> and identifies <code>big_child[u]</code> (the child with maximum <code>sz[v]</code>).<br/><strong>Phase 2:</strong> Recurse on light children with <code>keep=False</code> (erasing their contributions from <code>cnt</code>).<br/><strong>Phase 3:</strong> Recurse on <code>big_child[u]</code> with <code>keep=True</code> (retaining its frequency sack), then iterate through light subtrees and re-add their elements into <code>cnt</code> before recording <code>ans[u]</code>.</p>",
      },
      {
        heading: "Edge Case Analysis",
        body: "<p><strong>Leaf nodes:</strong> <code>big_child[u] == -1</code>, requires only 1 insertion.<br/><strong>Perfectly balanced binary trees:</strong> every edge is light except one, exact bound <code>(1/2) N log2 N</code> steps.<br/><strong>Skewed line trees:</strong> single heavy child path running from root to leaf, incurring <code>O(N)</code> total operations (0 light edge traversals!).</p>",
      },
    ],
    keyTerms: [
      {
        term: "Heavy Child (big_child)",
        definition: "The child v of node u with the largest subtree size sz[v].",
      },
      {
        term: "Light Edge",
        definition: "An edge connecting parent u to child v where sz[v] <= sz[u] / 2.",
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

export default dsuOnTree;
