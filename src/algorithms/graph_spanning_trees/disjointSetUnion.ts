import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
  numNodes: 6,
  operations: [
    { type: "union", u: 0, v: 1 },
    { type: "union", u: 2, v: 3 },
    { type: "union", u: 1, v: 2 },
    { type: "find", u: 3 },
  ],
};

const DSU_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: initialize DSU structure with N elements.",
    2: "Set parent[i] = i (each element is initially its own root leader) and rank[i] = 0.",
    6: "find(u) with path compression: flattens tree by pointing visited nodes directly to root.",
    12: "union(u, v) with union by rank: attaches lower-rank root under higher-rank root.",
    19: "Increment rank[root_i] if both roots had equal rank.",
  },
};

export const generateDisjointSetUnionSteps = (input: DisjointSetUnionInput): AlgorithmStep[] => {
  const n = Math.max(2, Math.min(10, input.numNodes));
  const ops =
    input.operations && input.operations.length > 0
      ? input.operations
      : DEFAULT_DISJOINT_SET_UNION_INPUT.operations;

  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);

  // Layout node positions on a circle
  const nodePositions = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: 200 + 120 * Math.cos(angle),
      y: 180 + 120 * Math.sin(angle),
    };
  });

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

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
  ) => {
    const nodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
      const root = getRoot(i);
      const isActive = activeNodes.has(i);
      const isVisited = visitedNodes.has(i);

      let state: GraphNodeItem["state"] = "default";
      if (isActive) state = "active";
      else if (isVisited) state = "visited";

      return {
        id: String(i),
        label: `V${i}`,
        x: nodePositions[i].x,
        y: nodePositions[i].y,
        state,
        val: i,
        group: root % 8, // Assign color group based on root leader
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

  // Step 1: Init
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Initialized Disjoint Set Union with ${n} isolated sets.`,
      why: "Each node i is its own root leader (parent[i] = i, rank[i] = 0).",
    },
    primarySnapshot: buildGraphSnapshot(),
    auxiliaryState: {
      customState: {
        "Parent Array": `[${parent.join(", ")}]`,
        "Rank Array": `[${rank.join(", ")}]`,
        "Total Components": n,
      },
    },
    variables: {
      numNodes: n,
      numComponents: n,
    },
  });

  const findWithCompression = (u: number): number => {
    const path: number[] = [];
    let curr = u;
    while (curr !== parent[curr]) {
      path.push(curr);
      curr = parent[curr];
    }
    const root = curr;

    // Path compression
    for (const node of path) {
      parent[node] = root;
    }

    return root;
  };

  for (const op of ops) {
    if (op.type === "find") {
      const u = Math.max(0, Math.min(n - 1, op.u));
      const root = findWithCompression(u);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 6,
        explanation: {
          what: `Executed find(${u}) with path compression -> Representative Root: V${root}.`,
          why: "Path compression updates parent pointers directly to root, flattening tree depth to O(α(N)).",
        },
        primarySnapshot: buildGraphSnapshot(new Set([u]), new Set([root])),
        auxiliaryState: {
          customState: {
            Operation: `find(${u})`,
            "Representative Root": `V${root}`,
            "Parent Array": `[${parent.join(", ")}]`,
          },
        },
        variables: {
          u,
          root,
        },
      });
    } else if (op.type === "union") {
      const u = Math.max(0, Math.min(n - 1, op.u));
      const v = Math.max(0, Math.min(n - 1, op.v ?? (u + 1) % n));

      const rootU = findWithCompression(u);
      const rootV = findWithCompression(v);

      if (rootU !== rootV) {
        if (rank[rootU] < rank[rootV]) {
          parent[rootU] = rootV;
        } else if (rank[rootU] > rank[rootV]) {
          parent[rootV] = rootU;
        } else {
          parent[rootV] = rootU;
          rank[rootU]++;
        }

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 12,
          explanation: {
            what: `Executed union(${u}, ${v}) -> Merged component V${rootV} into V${rootU}.`,
            why: "Union by rank attached tree with smaller rank under root with larger rank.",
          },
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU, rootV])),
          auxiliaryState: {
            customState: {
              Operation: `union(${u}, ${v})`,
              "New Leader": `V${getRoot(u)}`,
              "Parent Array": `[${parent.join(", ")}]`,
              "Rank Array": `[${rank.join(", ")}]`,
            },
          },
          variables: {
            u,
            v,
            rootU,
            rootV,
          },
        });
      } else {
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 12,
          explanation: {
            what: `Executed union(${u}, ${v}) -> Nodes V${u} and V${v} are already in the same component!`,
            why: `Both nodes share root V${rootU}. No edge added.`,
          },
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU])),
          auxiliaryState: {
            customState: {
              Operation: `union(${u}, ${v})`,
              Status: "Already Connected",
              "Shared Root": `V${rootU}`,
            },
          },
          variables: {
            u,
            v,
            alreadyConnected: true,
          },
        });
      }
    }
  }

  const finalRoots = new Set(Array.from({ length: n }, (_, i) => getRoot(i)));

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 21,
    explanation: {
      what: `Completed all DSU operations! Remaining disjoint components: ${finalRoots.size}.`,
      why: "Union-Find operations completed in near-constant amortized time O(α(N)).",
    },
    primarySnapshot: buildGraphSnapshot(),
    auxiliaryState: {
      customState: {
        Status: "Complete!",
        "Final Component Count": finalRoots.size,
        "Parent Array": `[${parent.join(", ")}]`,
      },
    },
    variables: {
      completed: true,
      componentCount: finalRoots.size,
    },
  });

  return steps;
};

export const disjointSetUnion: AlgorithmDefinition<DisjointSetUnionInput> = {
  id: "disjoint-set-union",
  title: "Disjoint Set Union (DSU / Union-Find)",
  category: "graph_spanning_trees",
  categories: ["graph_spanning_trees"],
  difficulty: "Medium",
  description:
    "Disjoint Set Union (DSU / Union-Find) maintains a collection of disjoint sets. It efficiently supports finding the representative leader of a set (find) and merging two sets (union) using path compression and union by rank in near-constant amortized O(α(N)) time.",
  constraints: ["1 <= N <= 20"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "6 nodes, 4 operations",
      outputDisplay: "3 connected components",
      title: "6 Nodes Basic DSU Operations",
      input: DEFAULT_DISJOINT_SET_UNION_INPUT,
      output: "Merged into 3 components",
      explanation: "Unions merge sets 0-1 and 2-3 into a combined 4-node set {0,1,2,3}.",
    },
    {
      kind: "complex",
      inputDisplay: "8 nodes, 6 union operations",
      outputDisplay: "2 large components",
      title: "8 Nodes Multi-Union Chain",
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
      inputDisplay: "4 nodes, redundant union(0, 1) twice",
      outputDisplay: "No change on duplicate union",
      title: "Redundant Union Case",
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
    time: "Combining path compression and union by rank yields an amortized time complexity of O(α(N)) per operation, where α is the inverse Ackermann function (effectively constant, α(N) <= 4 for all practical N).",
    space: "O(N) memory for parent and rank arrays.",
  },
  topicGuide: {
    overview:
      "Disjoint Set Union (DSU) efficiently tracks partitioning of a set into disjoint components. Path compression flattens tree paths during find, while union by rank keeps component tree heights minimal.",
    sections: [
      {
        heading: "Path Compression & Union by Rank",
        body: "Path compression redirects traversed nodes directly to the root leader during find(). Union by rank attaches shorter tree roots under taller tree roots.",
      },
    ],
    keyTerms: [
      {
        term: "Disjoint Set Union (DSU)",
        definition:
          "A data structure maintaining non-overlapping subsets with find and union operations.",
      },
      {
        term: "Path Compression",
        definition:
          "Optimization where visited nodes are reparented directly to the set's root during find.",
      },
      {
        term: "Inverse Ackermann Function α(N)",
        definition: "An extremely slow-growing function bounded by 4 for all realistic inputs.",
      },
    ],
  },
  trivia: DSU_TRIVIA,
  generateSteps: generateDisjointSetUnionSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 15",
      label: "Competitive Programmer's Handbook, Ch 15",
    },
  ],
  defaultInput: DEFAULT_DISJOINT_SET_UNION_INPUT,
};
