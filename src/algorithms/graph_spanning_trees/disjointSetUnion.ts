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

const DSU_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the Disjoint Set Union (DSU) class managing N element components.",
    2: "Constructor initializes parent pointers and rank arrays for N nodes.",
    3: "Initializes self-referential parent array parent[i] = i for singleton sets.",
    4: "Initializes rank array to 0 for all elements to track tree height bounds.",
    5: "Blank line separating constructor from find method.",
    6: "find(i) retrieves the representative root leader of the set containing element i.",
    7: "Base case check: returns i if element i points to itself as root leader.",
    8: "Returns root element i when i is its own parent.",
    9: "Path compression step: recursively finds root and updates parent[i] directly to root.",
    10: "Returns compressed representative root leader for element i.",
    11: "Blank line separating find method from union method.",
    12: "union(i, j) merges the disjoint sets containing elements i and j.",
    13: "Finds the representative root leader of the set containing element i.",
    14: "Finds the representative root leader of the set containing element j.",
    15: "Checks whether root_i and root_j belong to distinct sets.",
    16: "Compares ranks: if rank[root_i] < rank[root_j], swaps roots to attach smaller tree under larger tree.",
    17: "Swaps root_i and root_j so root_i always has equal or greater rank.",
    18: "Attaches root_j under root_i by setting parent[root_j] = root_i.",
    19: "Checks if both component trees had identical rank prior to merging.",
    20: "Increments rank of root_i by 1 because merging equal-height trees increases root height.",
    21: "Returns True indicating sets were successfully merged.",
    22: "Returns False indicating elements i and j were already in the same component.",
  },
};

export const generateDisjointSetUnionSteps = (input: DisjointSetUnionInput): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_DISJOINT_SET_UNION_INPUT;
  const rawNumNodes = safeInput.numNodes ?? DEFAULT_DISJOINT_SET_UNION_INPUT.numNodes;
  const n = Math.max(2, Math.min(10, rawNumNodes));
  const rawOps = Array.isArray(safeInput.operations)
    ? safeInput.operations
    : DEFAULT_DISJOINT_SET_UNION_INPUT.operations;
  const ops = rawOps.length > 0 ? rawOps : DEFAULT_DISJOINT_SET_UNION_INPUT.operations;

  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);

  // Layout node positions on a circle
  const nodePositions = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: Math.round(200 + 120 * Math.cos(angle)),
      y: Math.round(180 + 120 * Math.sin(angle)),
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

  // Step 1: Init (Line 2)
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Initialize Disjoint Set Union structure with ${n} isolated element components.`,
      why: "Each element starts as its own self-referential root leader (parent[i] = i, rank[i] = 0).",
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
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 6,
      explanation: {
        what: `Execute find(${u}) to locate representative component leader.`,
        why: `Traversing parent pointers starting from node V${u} to identify the canonical root leader.`,
      },
      primarySnapshot: buildGraphSnapshot(new Set([u])),
      auxiliaryState: {
        customState: {
          Operation: `find(${u})`,
          "Current Node": `V${u}`,
          "Parent Array": `[${parent.join(", ")}]`,
        },
      },
      variables: { u },
    });

    if (parent[u] === u) {
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 7,
        explanation: {
          what: `Base case reached: parent[V${u}] == V${u}.`,
          why: `Node V${u} points to itself, confirming it is the canonical root leader of its set.`,
        },
        primarySnapshot: buildGraphSnapshot(new Set([u])),
        auxiliaryState: {
          customState: {
            Operation: `find(${u})`,
            "Root Leader": `V${u}`,
            "Parent Array": `[${parent.join(", ")}]`,
          },
        },
        variables: { u, isRoot: true },
      });

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 8,
        explanation: {
          what: `Return representative root leader V${u}.`,
          why: `Since V${u} is already a root leader, find(${u}) returns V${u} without pointer re-wiring.`,
        },
        primarySnapshot: buildGraphSnapshot(new Set([u]), new Set([u])),
        auxiliaryState: {
          customState: {
            Operation: `find(${u})`,
            "Returned Root": `V${u}`,
            "Parent Array": `[${parent.join(", ")}]`,
          },
        },
        variables: { u, root: u },
      });

      return u;
    }

    const path: number[] = [];
    let curr = u;
    while (curr !== parent[curr]) {
      path.push(curr);
      curr = parent[curr];
    }
    const root = curr;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 9,
      explanation: {
        what: `Root leader V${root} located; perform Path Compression along path [${path.join(" -> ")}].`,
        why: `Path Compression re-wires all visited nodes along the traversal path directly to root leader V${root}, flattening tree height to O(1) for future queries.`,
      },
      primarySnapshot: buildGraphSnapshot(new Set(path), new Set([root])),
      auxiliaryState: {
        customState: {
          Operation: `find(${u})`,
          "Path to Flatten": path.join(" -> "),
          "Root Leader": `V${root}`,
        },
      },
      variables: { u, root, pathLength: path.length },
    });

    for (const node of path) {
      parent[node] = root;
    }

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 10,
      explanation: {
        what: `find(${u}) completed -> Canonical Root Leader: V${root}.`,
        why: "All elements along the lookup path now point directly to root leader V" + root + ".",
      },
      primarySnapshot: buildGraphSnapshot(new Set([u]), new Set([root])),
      auxiliaryState: {
        customState: {
          Operation: `find(${u})`,
          "Representative Root": `V${root}`,
          "Parent Array": `[${parent.join(", ")}]`,
        },
      },
      variables: { u, root },
    });

    return root;
  };

  for (const op of ops) {
    if (op.type === "find") {
      const u = Math.max(0, Math.min(n - 1, op.u));
      findWithCompression(u);
    } else if (op.type === "union") {
      const u = Math.max(0, Math.min(n - 1, op.u));
      const v = Math.max(0, Math.min(n - 1, op.v ?? (u + 1) % n));

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 12,
        explanation: {
          what: `Execute union(${u}, ${v}) to merge disjoint sets.`,
          why: `Determining canonical root leaders for V${u} and V${v} prior to performing union by rank.`,
        },
        primarySnapshot: buildGraphSnapshot(new Set([u, v])),
        auxiliaryState: {
          customState: {
            Operation: `union(${u}, ${v})`,
            "Parent Array": `[${parent.join(", ")}]`,
          },
        },
        variables: { u, v },
      });

      const rootU = findWithCompression(u);
      const rootV = findWithCompression(v);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 15,
        explanation: {
          what: `Compare component roots: root(V${u}) = V${rootU}, root(V${v}) = V${rootV}.`,
          why:
            rootU !== rootV
              ? `Roots differ (V${rootU} ≠ V${rootV}); sets are disjoint and will be merged.`
              : `Roots match (V${rootU} = V${rootV}); elements already belong to the same component, skipping merge.`,
        },
        primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU, rootV])),
        auxiliaryState: {
          customState: {
            Operation: `union(${u}, ${v})`,
            "Root U": `V${rootU}`,
            "Root V": `V${rootV}`,
            "Rank Root U": rank[rootU],
            "Rank Root V": rank[rootV],
          },
        },
        variables: { u, v, rootU, rootV, sameComponent: rootU === rootV },
      });

      if (rootU !== rootV) {
        let newRoot = rootU;
        let childRoot = rootV;

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 16,
          explanation: {
            what: `Evaluate Union by Rank heuristic: rank[V${rootU}] = ${rank[rootU]}, rank[V${rootV}] = ${rank[rootV]}.`,
            why:
              rank[rootU] < rank[rootV]
                ? `rank[V${rootU}] < rank[V${rootV}]: attach shorter tree V${rootU} under taller root V${rootV}.`
                : rank[rootU] > rank[rootV]
                  ? `rank[V${rootU}] > rank[V${rootV}]: attach shorter tree V${rootV} under taller root V${rootU}.`
                  : `Ranks are equal (${rank[rootU]}): attach V${rootV} under V${rootU} and increment rank[V${rootU}].`,
          },
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU, rootV])),
          auxiliaryState: {
            customState: {
              Operation: `union(${u}, ${v})`,
              "Rank Root U": rank[rootU],
              "Rank Root V": rank[rootV],
            },
          },
          variables: { u, v, rootU, rootV, rankU: rank[rootU], rankV: rank[rootV] },
        });

        if (rank[rootU] < rank[rootV]) {
          newRoot = rootV;
          childRoot = rootU;
          steps.push({
            stepIndex: stepIdx++,
            codeLine: 17,
            explanation: {
              what: `Select higher-rank root V${newRoot} as canonical leader.`,
              why: "Union by rank prevents height inflation by hanging shorter trees under taller roots.",
            },
            primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU, rootV])),
            auxiliaryState: {
              customState: {
                Operation: `union(${u}, ${v})`,
                "Selected Leader": `V${newRoot}`,
              },
            },
            variables: { newRoot, childRoot },
          });
        }

        parent[childRoot] = newRoot;

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 18,
          explanation: {
            what: `Update parent pointer: parent[V${childRoot}] = V${newRoot}.`,
            why: `Tree root V${childRoot} is now attached as a child under canonical root leader V${newRoot}.`,
          },
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([newRoot])),
          auxiliaryState: {
            customState: {
              Operation: `union(${u}, ${v})`,
              "New Parent Edge": `V${childRoot} -> V${newRoot}`,
              "Parent Array": `[${parent.join(", ")}]`,
            },
          },
          variables: { childRoot, newRoot },
        });

        if (rank[rootU] === rank[rootV]) {
          steps.push({
            stepIndex: stepIdx++,
            codeLine: 19,
            explanation: {
              what: `Component ranks were identical prior to merge (rank = ${rank[newRoot]}).`,
              why: "Merging two trees of equal height increases the max depth bound of the combined tree by 1.",
            },
            primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([newRoot])),
            auxiliaryState: {
              customState: {
                Operation: `union(${u}, ${v})`,
                "Equal Ranks": rank[newRoot],
              },
            },
            variables: { equalRank: rank[newRoot] },
          });

          rank[newRoot]++;

          steps.push({
            stepIndex: stepIdx++,
            codeLine: 20,
            explanation: {
              what: `Increment rank[V${newRoot}] to ${rank[newRoot]}.`,
              why: "Updated upper bound on component tree height following equal-rank merge.",
            },
            primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([newRoot])),
            auxiliaryState: {
              customState: {
                Operation: `union(${u}, ${v})`,
                "New Rank": rank[newRoot],
                "Rank Array": `[${rank.join(", ")}]`,
              },
            },
            variables: { newRank: rank[newRoot] },
          });
        }

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 21,
          explanation: {
            what: `union(${u}, ${v}) returned true (sets merged).`,
            why: `Successfully merged component containing V${u} and component containing V${v} under leader V${newRoot}.`,
          },
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([newRoot])),
          auxiliaryState: {
            customState: {
              Operation: `union(${u}, ${v})`,
              Result: "Merged (True)",
              "New Component Leader": `V${newRoot}`,
            },
          },
          variables: { u, v, merged: true, leader: newRoot },
        });
      } else {
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 22,
          explanation: {
            what: `union(${u}, ${v}) returned false (redundant union).`,
            why: `Both V${u} and V${v} already share root leader V${rootU}. No set modification needed.`,
          },
          primarySnapshot: buildGraphSnapshot(new Set([u, v]), new Set([rootU])),
          auxiliaryState: {
            customState: {
              Operation: `union(${u}, ${v})`,
              Result: "Already Connected (False)",
              "Shared Root": `V${rootU}`,
            },
          },
          variables: { u, v, merged: false, sharedRoot: rootU },
        });
      }
    }
  }

  const finalRoots = new Set(Array.from({ length: n }, (_, i) => getRoot(i)));

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 21,
    explanation: {
      what: `All DSU operations completed! Final component count: ${finalRoots.size}.`,
      why: "Path compression and union by rank achieved near-constant amortized O(alpha(N)) time per operation.",
    },
    primarySnapshot: buildGraphSnapshot(),
    auxiliaryState: {
      customState: {
        Status: "Complete",
        "Final Components": finalRoots.size,
        "Parent Array": `[${parent.join(", ")}]`,
        "Rank Array": `[${rank.join(", ")}]`,
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
  topicIds: ["graph_spanning_trees"],
  difficulty: "Medium",
  description:
    "<p>Disjoint Set Union (DSU / Union-Find) maintains a dynamic partition of an <code>N</code>-element universe into non-overlapping connected sets. It provides two core operations: <code>find(u)</code>, which determines the canonical representative leader of the set containing <code>u</code> while flattening pointer paths via <strong>Path Compression</strong>, and <code>union(u, v)</code>, which merges the sets containing <code>u</code> and <code>v</code> using <strong>Union by Rank/Size</strong> to keep tree depths minimal. Together, these optimizations guarantee amortized <code>O(&alpha;(N))</code> time per query—where <code>&alpha;</code> is the inverse Ackermann function—making DSU essential for Kruskal's MST, dynamic connectivity, and cycle detection.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>numNodes</code> (element universe count) and <code>operations</code> array containing <code>find</code> and <code>union</code> queries.</li><li><strong>Output:</strong> Step-by-step visual execution of component tree formation and path compression.</li></ul>",
  constraints: ["1 <= N <= 10^5", "1 <= Number of operations Q <= 2 * 10^5"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "7 nodes, 9 operations",
      outputDisplay: "2 connected components",
      title: "7 Nodes DSU Operations",
      input: DEFAULT_DISJOINT_SET_UNION_INPUT,
      output: "Merged into 2 components",
      explanation: "Unions merge sets into two large connected components.",
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
    time: "Combining path compression and union by rank yields an amortized time complexity of O(&alpha;(N)) per operation, where &alpha; is the inverse Ackermann function (effectively constant, &alpha;(N) <= 4 for all practical N).",
    space: "O(N) memory for parent and rank arrays.",
  },
  topicGuide: {
    overview:
      "<p>Disjoint Set Union (DSU / Union-Find) is an elegant data structure designed to maintain a partition of an <code>N</code>-element set into disjoint connected components. By combining two complementary heuristics—<strong>Path Compression</strong> during finds and <strong>Union by Rank/Size</strong> during merges—DSU achieves near-constant amortized <code>O(&alpha;(N))</code> time per operation. It is foundational for graph algorithms such as Kruskal's Minimum Spanning Tree, dynamic connectivity queries, and Tarjan's offline lowest common ancestor algorithm.</p>",
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
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 15",
      label: "Competitive Programmer's Handbook, Ch 15",
    },
  ],
  defaultInput: DEFAULT_DISJOINT_SET_UNION_INPUT,
};

export default disjointSetUnion;
