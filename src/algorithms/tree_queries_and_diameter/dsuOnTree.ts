import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TreeNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "DSU on Tree (Sack / Small-to-Large merging) answers offline subtree queries (such as distinct color counts) for all vertices in O(N log N) total time.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "active" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "default" },
        { id: "2", val: 1, leftId: "5", state: "default" },
        { id: "3", val: 2, state: "default" },
        { id: "4", val: 3, state: "default" },
        { id: "5", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Small-to-Large Merging Principle: Merging smaller frequency accumulators into larger ones avoids redundant operations on large subtrees.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "swap" },
        { id: "2", val: 1, leftId: "5", state: "compare" },
        { id: "3", val: 2, state: "default" },
        { id: "4", val: 3, state: "default" },
        { id: "5", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Heavy-Light Subtree Partitioning: For each vertex u, its child with the largest subtree size sz[v] is designated the Heavy Child; all other children are Light Children.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 1, leftId: "5", state: "compare" },
        { id: "3", val: 2, state: "default" },
        { id: "4", val: 3, state: "default" },
        { id: "5", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Work Bound Proof: Any root-to-leaf path crosses at most log2 N light edges, guaranteeing each node is re-inserted into the global sack at most O(log N) times.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 1, leftId: "5", state: "sorted" },
        { id: "3", val: 2, state: "sorted" },
        { id: "4", val: 3, state: "sorted" },
        { id: "5", val: 1, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Pass 1 DFS: Computes subtree sizes sz[u] and designates heavy child big_child[u] for every vertex.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "active" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "compare" },
        { id: "2", val: 1, leftId: "5", state: "default" },
        { id: "3", val: 2, state: "default" },
        { id: "4", val: 3, state: "default" },
        { id: "5", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Light Subtree Processing (keep = false): Evaluates light child subtrees independently and erases their frequency contributions to avoid polluting sibling state.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "visited" },
        { id: "2", val: 1, leftId: "5", state: "swap" },
        { id: "3", val: 2, state: "default" },
        { id: "4", val: 3, state: "default" },
        { id: "5", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Heavy Subtree Processing (keep = true): Evaluates the heavy child subtree and retains its accumulated frequency table in the global sack.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "visited" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 1, leftId: "5", state: "default" },
        { id: "3", val: 2, state: "default" },
        { id: "4", val: 3, state: "default" },
        { id: "5", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Light Child Re-insertion: Re-inserts light child elements back into the heavy child's retained sack to compute the final answer ans[u].",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "active" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 1, leftId: "5", state: "compare" },
        { id: "3", val: 2, state: "default" },
        { id: "4", val: 3, state: "default" },
        { id: "5", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "DSU on Tree computes offline subtree queries for all nodes in optimal O(N log N) time and O(N) space.",
    primarySnapshot: {
      kind: "tree",
      rootId: "0",
      nodes: [
        { id: "0", val: 1, leftId: "1", rightId: "2", state: "sorted" },
        { id: "1", val: 2, leftId: "3", rightId: "4", state: "sorted" },
        { id: "2", val: 1, leftId: "5", state: "sorted" },
        { id: "3", val: 2, state: "sorted" },
        { id: "4", val: 3, state: "sorted" },
        { id: "5", val: 1, state: "sorted" },
      ],
    },
  },
];

export const generateDsuOnTreeSteps = (input: DsuOnTreeInput): AlgorithmStep[] => {
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

  const buildTreeSnapshot = (
    currNode: number,
    focusState: "active" | "swap" | "compare" | "sorted" | "visited" = "active",
    heavyNode: number = -1,
    lightNodes: Set<number> = new Set(),
    isFinal: boolean = false,
  ) => {
    const treeNodes: TreeNodeItem[] = Array.from({ length: n }, (_, i) => {
      const leftChild = children[i]?.[0];
      const rightChild = children[i]?.[1];
      let state: TreeNodeItem["state"] = "default";
      if (isFinal) {
        state = "sorted";
      } else if (i === currNode) {
        state = focusState;
      } else if (i === heavyNode) {
        state = "sorted";
      } else if (lightNodes.has(i)) {
        state = "compare";
      }

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

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized DSU on Tree execution for N = ${n} nodes.`,
      primarySnapshot: buildTreeSnapshot(-1),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { numNodes: n },
    }),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Executed Pass 1 DFS: calculated subtree sizes sz[] and identified heavy children (bigChild). Root Node 0 heavy child: Node ${bigChild[0]}.`,
      primarySnapshot: buildTreeSnapshot(0, "compare", bigChild[0]),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { numNodes: n, rootHeavyChild: bigChild[0] },
    }),
  );

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
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Begin processing Node ${u} (heavy child: ${bigChild[u] !== -1 ? `Node ${bigChild[u]}` : "None"}, keep = ${keep}).`,
        primarySnapshot: buildTreeSnapshot(u, "active", bigChild[u]),
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { currNode: u, parent: p, keep, heavyChild: bigChild[u] },
      }),
    );

    for (const v of children[u]) {
      if (v !== p && v !== bigChild[u]) {
        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Recursing into light child Node ${v} with keep = false (sack will be cleared after evaluation).`,
            primarySnapshot: buildTreeSnapshot(v, "compare", -1, new Set([v])),
            auxiliaryState: {
              stack: [],
              visited: [],
            },
            variables: { currNode: u, lightChild: v },
          }),
        );

        dfsDsu(v, u, false);
      }
    }

    if (bigChild[u] !== -1) {
      const hb = bigChild[u];
      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Recursing into heavy child Node ${hb} with keep = true (retains accumulated frequencies in global sack).`,
          primarySnapshot: buildTreeSnapshot(hb, "swap", hb),
          auxiliaryState: {
            stack: [],
            visited: [],
          },
          variables: { currNode: u, heavyChild: hb },
        }),
      );

      dfsDsu(hb, u, true);
    }

    const lightSet = new Set<number>();
    for (const v of children[u]) {
      if (v !== p && v !== bigChild[u]) {
        lightSet.add(v);
        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Merging light child Node ${v}'s subtree elements into the global frequency sack.`,
            primarySnapshot: buildTreeSnapshot(u, "compare", bigChild[u], lightSet),
            auxiliaryState: {
              stack: [],
              visited: [],
            },
            variables: { currNode: u, mergingChild: v },
          }),
        );

        addNodeColor(v, u, 1);
      }
    }

    cnt.set(colors[u], (cnt.get(colors[u]) || 0) + 1);
    ans[u] = cnt.size;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Included Node ${u}'s color ${colors[u]}. Recorded ans[${u}] = ${cnt.size} distinct colors in Node ${u}'s subtree.`,
        primarySnapshot: buildTreeSnapshot(u, "swap", bigChild[u], lightSet),
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { currNode: u, distinctColors: cnt.size, keepSack: keep },
      }),
    );

    if (!keep) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Clearing Node ${u}'s subtree contributions from global frequency map (keep = false).`,
          primarySnapshot: buildTreeSnapshot(u, "visited"),
          auxiliaryState: {
            stack: [],
            visited: [],
          },
          variables: { currNode: u, action: "clearSack" },
        }),
      );

      addNodeColor(u, p, -1);
    }
  };

  if (n > 0) dfsDsu(0, -1, true);

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `DSU on Tree complete! Distinct color count answers computed for all ${n} subtrees.`,
      primarySnapshot: buildTreeSnapshot(0, "sorted", -1, new Set(), true),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { completed: true },
    }),
  );

  return steps;
};

export const DSU_ON_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature for DSU on Tree.",
    2: "Initialize adjacency list.",
    3: "Iterate through edges.",
    7: "Initialize sz array.",
    8: "Initialize bigChild array.",
    10: "Define DFS 1 for subtree sizes.",
    16: "Identify heavy child with maximum size.",
    20: "Initialize frequency map.",
    23: "Define add helper for subtree color updates.",
    32: "Main DSU on Tree recursive function.",
    35: "Recurse on light children with keep=false.",
    37: "Recurse on heavy child with keep=true.",
    41: "Merge light child subtree into sack.",
    42: "Include node u color.",
    43: "Record distinct colors ans[u].",
    46: "Clear sack if keep=false.",
    48: "Run Pass 1 DFS.",
    49: "Run Pass 2 DSU on Tree.",
    50: "Return distinct color answers ans.",
  },
};

export const dsuOnTree: AlgorithmDefinition<DsuOnTreeInput> = {
  id: "dsu-on-tree",
  title: "DSU on Tree (Sack / Small-to-Large)",
  topicIds: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Hard",
  description:
    "<p>Given a rooted tree with <code>N</code> vertices where each vertex <code>u</code> has a color attribute <code>colors[u]</code>, compute offline subtree statistics (distinct color counts) for all subtrees in <code>O(N log N)</code> total time.</p><h3>Problem Statement</h3><p>Identify the heavy child (child with largest subtree size <code>sz[v]</code>) for every node. Recurse on light children with <code>keep=False</code> (erasing their frequencies), recurse on heavy child with <code>keep=True</code> (retaining its frequency sack), and merge light subtrees back into the heavy child sack in <code>O(N log N)</code> total time.</p><h3>Input Parameters</h3><ul><li><code>numNodes</code>: Total number of vertices.</li><li><code>edges</code>: Edge pairs <code>[u, v]</code>.</li><li><code>colors</code>: Array of node colors.</li></ul><h3>Output</h3><p>Returns array <code>ans</code> where <code>ans[u]</code> is the count of distinct colors in node <code>u</code>'s subtree.</p>",
  constraints: ["1 <= N <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "6 nodes tree with colors",
      outputDisplay: "Subtree distinct colors computed",
      title: "Standard 6-Node Color Frequencies",
      input: DEFAULT_DSU_ON_TREE_INPUT,
      output: "Distinct colors computed for all subtrees",
      explanation: "Heavy child sack maintained; light children merged.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "7 nodes binary tree",
      outputDisplay: "7 subtree stats",
      title: "Adversarial Balanced Tree Small-to-Large",
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
      scenario: "boundary",
      inputDisplay: "Single node tree",
      outputDisplay: "1 distinct color",
      title: "Boundary Single Node Tree",
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
      "<p>DSU on Tree (also known as Sack or Heavy-Light subtree merging) solves offline subtree query problems without complex data structures like persistent segment trees or dynamic merge trees. By exploiting the Heavy-Light Decomposition principle, a node reuses the frequency data structure ('sack') of its largest subtree (the heavy child) and only re-inserts nodes from smaller subtrees (light children).</p>",
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
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(N log N)</code><br/><strong>Space Complexity:</strong> <code>O(N)</code><br/>Each node is processed at most O(log N) times, taking O(N log N) total time.</p>",
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
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 18",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 18,
      section: "18.4 DSU on tree",
    },
  ],
  defaultInput: DEFAULT_DSU_ON_TREE_INPUT,
};

export default dsuOnTree;
