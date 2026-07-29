import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DsuOperation {
  type: "find" | "union";
  u: number;
  v?: number;
}

export interface DisjointSetUnionInput {
  numNodes: number;
  operations: DsuOperation[];
}

export const DEFAULT_DISJOINT_SET_UNION_INPUT: DisjointSetUnionInput = {
  numNodes: 7,
  operations: [
    { type: "union", u: 0, v: 1 },
    { type: "union", u: 2, v: 3 },
    { type: "union", u: 4, v: 5 },
    { type: "union", u: 1, v: 2 },
    { type: "union", u: 5, v: 6 },
    { type: "union", u: 3, v: 5 },
    { type: "find", u: 0 },
    { type: "find", u: 6 },
    { type: "union", u: 0, v: 6 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Disjoint Set Union (DSU / Union-Find) maintains a dynamic partition of an N-element universe into non-overlapping connected sets.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "V0", group: 0, state: "active" },
        { id: "1", label: "V1", group: 1, state: "default" },
        { id: "2", label: "V2", group: 2, state: "default" },
        { id: "3", label: "V3", group: 3, state: "default" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Canonical Representative Leaders: Each set is represented as a tree rooted at a single canonical leader element.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "Leader V0", group: 0, state: "sorted" },
        { id: "1", label: "V1", group: 0, state: "visited" },
        { id: "2", label: "V2", group: 0, state: "visited" },
      ],
      edges: [
        { from: "1", to: "0" },
        { from: "2", to: "0" },
      ],
    },
  },
  {
    narrative:
      "Initialization: Every element starts in its own singleton component with self-referential parent pointer parent[i] = i and rank[i] = 0.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "V0", group: 0, state: "default" },
        { id: "1", label: "V1", group: 1, state: "default" },
        { id: "2", label: "V2", group: 2, state: "default" },
        { id: "3", label: "V3", group: 3, state: "default" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "find(u) Operation: Follows parent pointers upward to locate the representative root leader of the set containing element u.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "Root V0", group: 0, state: "sorted" },
        { id: "1", label: "V1", group: 0, state: "active" },
        { id: "2", label: "V2 (Find Start)", group: 0, state: "compare" },
      ],
      edges: [
        { from: "2", to: "1", isPath: true },
        { from: "1", to: "0", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Path Compression Optimization: Re-wires all visited parent pointers along the find path directly to the root leader, flattening tree height to O(1) amortized.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "Root V0", group: 0, state: "sorted" },
        { id: "1", label: "V1 (Compressed)", group: 0, state: "swap" },
        { id: "2", label: "V2 (Compressed)", group: 0, state: "swap" },
      ],
      edges: [
        { from: "1", to: "0", isPath: true },
        { from: "2", to: "0", isPath: true },
      ],
    },
  },
  {
    narrative:
      "union(u, v) Operation: Merges the disjoint sets containing u and v by locating their respective root leaders root_u and root_v.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "Root u (V0)", group: 0, state: "active" },
        { id: "3", label: "Root v (V3)", group: 1, state: "active" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Union by Rank Heuristic: Attaches the root of the lower-rank component tree under the root of the higher-rank tree to prevent height inflation.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "New Leader V0", group: 0, state: "sorted" },
        { id: "3", label: "V3 (Attached)", group: 0, state: "swap" },
      ],
      edges: [{ from: "3", to: "0", isPath: true }],
    },
  },
  {
    narrative:
      "Equal Rank Merging: When merging trees of equal rank, attach one under the other and increment the new root's rank by 1.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "Rank 1 (V0)", group: 0, state: "sorted" },
        { id: "3", label: "Rank 0 (V3)", group: 0, state: "visited" },
      ],
      edges: [{ from: "3", to: "0", isPath: true }],
    },
  },
  {
    narrative:
      "Combining Path Compression and Union by Rank guarantees near-constant O(alpha(N)) amortized time per operation and O(N) memory space.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "0", label: "Set 0 Leader", group: 0, state: "sorted" },
        { id: "1", label: "Set 0 Member", group: 0, state: "sorted" },
        { id: "2", label: "Set 0 Member", group: 0, state: "sorted" },
        { id: "3", label: "Set 0 Member", group: 0, state: "sorted" },
      ],
      edges: [
        { from: "1", to: "0", isPath: true },
        { from: "2", to: "0", isPath: true },
        { from: "3", to: "0", isPath: true },
      ],
    },
  },
];

export function generateDisjointSetUnionSteps(input: DisjointSetUnionInput): AlgorithmStep[] {
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
  const safeInput = input ?? DEFAULT_DISJOINT_SET_UNION_INPUT;
  const rawNumNodes = safeInput.numNodes ?? DEFAULT_DISJOINT_SET_UNION_INPUT.numNodes;
  const n = Math.max(2, Math.min(10, rawNumNodes));
  const rawOps = Array.isArray(safeInput.operations)
    ? safeInput.operations
    : DEFAULT_DISJOINT_SET_UNION_INPUT.operations;
  const ops = rawOps.length > 0 ? rawOps : DEFAULT_DISJOINT_SET_UNION_INPUT.operations;

  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);

  const nodePositions = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: Math.round(200 + 120 * Math.cos(angle)),
      y: Math.round(180 + 120 * Math.sin(angle)),
    };
  });

  const getRoot = (i: number): number => {
    let curr = i;
    while (curr !== parent[curr]) {
      curr = parent[curr];
    }
    return curr;
  };

  const buildGraphSnapshot = (
    activeNodes: Set<number> = new Set(),
    visitedNodes: Set<number> = new Set(),
    focusState: "active" | "swap" | "compare" | "sorted" | "visited" = "active",
  ) => {
    const nodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
      const root = getRoot(i);
      const isActive = activeNodes.has(i);
      const isVisited = visitedNodes.has(i);

      let state: GraphNodeItem["state"] = "default";
      if (isActive) state = focusState;
      else if (isVisited) state = "visited";

      return {
        id: String(i),
        label: `V${i}`,
        x: nodePositions[i].x,
        y: nodePositions[i].y,
        state,
        val: i,
        group: root % 8,
      };
    });

    const edges: GraphEdgeItem[] = [];
    for (let i = 0; i < n; i++) {
      if (parent[i] !== i) {
        const root = getRoot(i);
        edges.push({
          from: String(i),
          to: String(parent[i]),
          isPath: activeNodes.has(i) || activeNodes.has(parent[i]),
          group: root % 8,
        });
      }
    }

    return { kind: "graph" as const, nodes, edges };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized Disjoint Set Union structure with ${n} isolated element components. Initialized self-referential parent array.`,
      primarySnapshot: buildGraphSnapshot(),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { numNodes: n, numComponents: n },
    }),
  );

  const findWithCompression = (u: number): number => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Executing find(${u}): traversing parent pointers starting from node V${u} to locate its canonical root leader.`,
        primarySnapshot: buildGraphSnapshot(new Set([u]), new Set(), "compare"),
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { u },
      }),
    );

    if (parent[u] === u) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Base case reached: parent[V${u}] == V${u}. Node V${u} is its own representative root leader.`,
          primarySnapshot: buildGraphSnapshot(new Set([u]), new Set([u]), "sorted"),
          auxiliaryState: {
            stack: [],
            visited: [],
          },
          variables: { u, isRoot: true },
        }),
      );

      return u;
    }

    const path: number[] = [];
    let curr = u;
    while (curr !== parent[curr]) {
      path.push(curr);
      curr = parent[curr];
    }
    const root = curr;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Root leader V${root} located. Executing Path Compression along path [${path.join(" -> ")}].`,
        primarySnapshot: buildGraphSnapshot(new Set(path), new Set([root]), "swap"),
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { u, root, pathLength: path.length },
      }),
    );

    for (const node of path) {
      parent[node] = root;
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Path Compression complete: all nodes along path now point directly to root leader V${root}.`,
        primarySnapshot: buildGraphSnapshot(new Set([u]), new Set([root]), "visited"),
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { u, root },
      }),
    );

    return root;
  };

  for (const op of ops) {
    if (op.type === "find") {
      const u = Math.max(0, Math.min(n - 1, op.u));
      findWithCompression(u);
    } else if (op.type === "union") {
      const u = Math.max(0, Math.min(n - 1, op.u));
      const v = Math.max(0, Math.min(n - 1, op.v ?? (u + 1) % n));

      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Executing union(${u}, ${v}) to merge disjoint sets containing V${u} and V${v}.`,
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set(), "active"),
          auxiliaryState: {
            stack: [],
            visited: [],
          },
          variables: { u, v },
        }),
      );

      const rootU = findWithCompression(u);
      const rootV = findWithCompression(v);

      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Comparing component roots: root(V${u}) = V${rootU}, root(V${v}) = V${rootV}. ${rootU !== rootV ? "Roots differ; sets will be merged." : "Roots match; elements already share the same component."}`,
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU, rootV]), "compare"),
          auxiliaryState: {
            stack: [],
            visited: [],
          },
          variables: { u, v, rootU, rootV, sameComponent: rootU === rootV },
        }),
      );

      if (rootU !== rootV) {
        let newRoot = rootU;
        let childRoot = rootV;

        if (rank[rootU] < rank[rootV]) {
          newRoot = rootV;
          childRoot = rootU;
        }

        parent[childRoot] = newRoot;

        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Union by Rank: attached tree root V${childRoot} as a child under canonical root leader V${newRoot} (rank[V${newRoot}] = ${rank[newRoot]}).`,
            primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([newRoot]), "swap"),
            auxiliaryState: {
              stack: [],
              visited: [],
            },
            variables: { childRoot, newRoot },
          }),
        );

        if (rank[rootU] === rank[rootV]) {
          rank[newRoot]++;
          steps.push(
            createTutorialStep({
              stepIndex: stepIdx++,
              phase: "walkthrough",
              narrative: `Component ranks were equal prior to merge. Incremented rank[V${newRoot}] to ${rank[newRoot]}.`,
              primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([newRoot]), "visited"),
              auxiliaryState: {
                stack: [],
                visited: [],
              },
              variables: { newRank: rank[newRoot] },
            }),
          );
        }

        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `union(${u}, ${v}) returned true: merged sets under root leader V${newRoot}.`,
            primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([newRoot]), "sorted"),
            auxiliaryState: {
              stack: [],
              visited: [],
            },
            variables: { u, v, merged: true, leader: newRoot },
          }),
        );
      } else {
        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `union(${u}, ${v}) returned false: V${u} and V${v} already belong to the same component under root V${rootU}.`,
            primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU]), "sorted"),
            auxiliaryState: {
              stack: [],
              visited: [],
            },
            variables: { u, v, merged: false, sharedRoot: rootU },
          }),
        );
      }
    }
  }

  const finalRoots = new Set(Array.from({ length: n }, (_, i) => getRoot(i)));

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `All DSU operations completed! Final count of connected components: ${finalRoots.size}.`,
      primarySnapshot: buildGraphSnapshot(new Set(), new Set(), "sorted"),
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: {
        completed: true,
        componentCount: finalRoots.size,
      },
    }),
  );

  return steps;
}

export const DSU_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines DSU class.",
    2: "Constructor initializes parent and rank arrays.",
    3: "Initializes parent[i] = i for singleton sets.",
    4: "Initializes rank array to 0.",
    6: "find(i) retrieves representative root leader.",
    7: "Checks if element points to itself as root.",
    9: "Path compression step: updates parent[i] directly to root.",
    12: "union(i, j) merges sets containing i and j.",
    13: "Finds root leader of set i.",
    14: "Finds root leader of set j.",
    15: "Checks if roots belong to distinct sets.",
    16: "Compares ranks to attach smaller tree under larger tree.",
    18: "Attaches root_j under root_i.",
    19: "Checks if component trees had identical rank.",
    20: "Increments rank of root_i by 1.",
    21: "Returns True indicating sets were merged.",
    22: "Returns False indicating elements were already in same set.",
  },
};

export const disjointSetUnion: AlgorithmDefinition<DisjointSetUnionInput> = {
  id: "disjoint-set-union",
  title: "Disjoint Set Union (DSU / Union-Find)",
  topicIds: ["graph_spanning_trees"],
  difficulty: "Medium",
  description:
    "<p>Disjoint Set Union (DSU / Union-Find) maintains a dynamic partition of an <code>N</code>-element universe into non-overlapping connected sets.</p><h3>Problem Statement</h3><p>Provide two core operations: <code>find(u)</code> (determines canonical root leader while flattening pointer paths via Path Compression) and <code>union(u, v)</code> (merges sets containing <code>u</code> and <code>v</code> via Union by Rank). Guarantees near-constant amortized <code>O(&alpha;(N))</code> time per operation.</p><h3>Input Parameters</h3><ul><li><code>numNodes</code>: Total number of element vertices.</li><li><code>operations</code>: List of <code>find</code> and <code>union</code> operations.</li></ul><h3>Output</h3><p>Returns step-by-step visual execution of set merges and path compression.</p>",
  constraints: ["1 <= N <= 10^5", "1 <= Number of operations Q <= 2 * 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "7 nodes, 9 operations",
      outputDisplay: "2 connected components",
      title: "Standard 7-Node DSU Operations",
      input: DEFAULT_DISJOINT_SET_UNION_INPUT,
      output: "Merged into 2 components",
      explanation: "Unions merge sets into two large connected components.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "8 nodes, 6 union operations",
      outputDisplay: "2 large components",
      title: "Adversarial Multi-Union Chain",
      input: {
        numNodes: 8,
        operations: [
          { type: "union", u: 0, v: 1 },
          { type: "union", u: 1, v: 2 },
          { type: "union", u: 3, v: 4 },
          { type: "union", u: 4, v: 5 },
          { type: "union", u: 2, v: 5 },
          { type: "find", u: 0 },
        ],
      },
      output: "Path compression flattens set tree",
      explanation: "Chained unions trigger path compression upon find(0).",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "4 nodes, redundant union(0, 1) twice",
      outputDisplay: "No change on duplicate union",
      title: "Boundary Redundant Union Case",
      input: {
        numNodes: 4,
        operations: [
          { type: "union", u: 0, v: 1 },
          { type: "union", u: 0, v: 1 },
        ],
      },
      output: "Same component detected, no modification",
      explanation: "Redundant union checks roots and skips duplicate merge.",
    },
  ],
  code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            if self.rank[root_i] < self.rank[root_j]:
                root_i, root_j = root_j, root_i
            self.parent[root_j] = root_i
            if self.rank[root_i] == self.rank[root_j]:
                self.rank[root_i] += 1
            return True
        return False`,
  timeComplexity: {
    best: "O(α(N))",
    average: "O(α(N))",
    worst: "O(α(N))",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Combining path compression and union by rank yields an amortized time complexity of O(&alpha;(N)) per operation, where &alpha; is the inverse Ackermann function (effectively constant, &alpha;(N) <= 4 for all practical N).",
    space: "O(N) memory for parent and rank arrays.",
  },
  topicGuide: {
    overview:
      "<p>Disjoint Set Union (DSU / Union-Find) is an elegant data structure designed to maintain a partition of an <code>N</code>-element set into disjoint connected components. By combining two complementary heuristics—<strong>Path Compression</strong> during finds and <strong>Union by Rank/Size</strong> during merges—DSU achieves near-constant amortized <code>O(&alpha;(N))</code> time per operation.</p>",
    sections: [
      {
        heading: "Why It Exists & What It Solves",
        body: "<p>Standard graph reachability queries via BFS/DFS cost <code>O(V + E)</code> per query. When edges arrive dynamically and we must continuously answer 'are nodes <code>u</code> and <code>v</code> connected?', running full graph traversals is far too slow. DSU solves this by maintaining explicit tree pointers per component, enabling connectivity checks and merges in <code>O(&alpha;(N))</code> time without full graph rescans.</p>",
      },
      {
        heading: "Core Concept: Representative Leaders & Component Trees",
        body: "<p>Each set is represented as a tree rooted at a single canonical leader element. The <code>parent</code> array maps each node to its direct parent. Initially, <code>parent[i] = i</code> for all nodes, creating <code>N</code> singleton sets. Two nodes <code>u</code> and <code>v</code> belong to the same component if and only if <code>find(u) == find(v)</code>.</p>",
      },
      {
        heading: "Dual Optimizations: Path Compression & Union by Rank",
        body: "<p>Path Compression flattens component trees during <code>find(u)</code> by updating parent pointers of all traversed nodes to point directly to the root leader. Union by Rank attaches the root of the lower-rank tree under the root of the higher-rank tree, preventing tree tallness on adversarial merge sequences.</p>",
      },
      {
        heading: "Step-by-Step Intuition",
        body: "<p><strong>1. Initialization:</strong> Set <code>parent[i] = i</code>, <code>rank[i] = 0</code> for <code>0 &le; i &lt; N</code>.<br/><strong>2. Find(u):</strong> Follow <code>parent[u]</code> up to root leader <code>R</code>. On recursion unwind, set <code>parent[x] = R</code> for all visited nodes <code>x</code>.<br/><strong>3. Union(u, v):</strong> Find <code>R_u = find(u)</code> and <code>R_v = find(v)</code>. If <code>R_u &ne; R_v</code>, compare <code>rank[R_u]</code> and <code>rank[R_v]</code>, attach the smaller tree under the larger, and increment rank if equal.</p>",
      },
      {
        heading: "Trade-offs & Limitations",
        body: "<p>DSU excels at incremental edge insertions and connectivity queries. However, standard DSU does not support set splitting or edge deletion. Undoing merges requires persistent DSU or rollback stacks (Union-Find with Rollback), which drops Path Compression and runs in <code>O(log N)</code> time per operation.</p>",
      },
      {
        heading: "Theoretical Bounds: Inverse Ackermann Function &alpha;(N)",
        body: "<p>Robert Tarjan proved that combining path compression with union by rank guarantees an amortized time of <code>O(&alpha;(N))</code> per operation, where <code>&alpha;(N)</code> is the inverse Ackermann function. For all physical inputs <code>N &le; 10^80</code>, <code>&alpha;(N) &le; 4</code>, rendering operations virtually <code>O(1)</code>.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(&alpha;(N))</code><br/><strong>Space Complexity:</strong> <code>O(N)</code><br/>Combining path compression and union by rank yields amortized O(&alpha;(N)) per operation.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Disjoint Set Union (DSU)",
        definition:
          "A data structure maintaining non-overlapping subsets supporting find and union operations.",
      },
      {
        term: "Path Compression",
        definition:
          "Optimization where visited nodes are reparented directly to the set's root leader during find.",
      },
      {
        term: "Union by Rank",
        definition:
          "Heuristic attaching shorter component trees under taller component trees to keep tree depth minimal.",
      },
      {
        term: "Inverse Ackermann Function &alpha;(N)",
        definition:
          "An extremely slow-growing mathematical function bounded by 4 for all universe scale inputs N < 10^80.",
      },
    ],
  },
  trivia: DSU_TRIVIA,
  generateSteps: generateDisjointSetUnionSteps,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 15",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 15,
      section: "15.2 Union-find structure",
    },
  ],
  defaultInput: DEFAULT_DISJOINT_SET_UNION_INPUT,
};

export default disjointSetUnion;
