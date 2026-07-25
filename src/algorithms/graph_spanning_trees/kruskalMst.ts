import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface KruskalInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const KRUSKAL_CODE = `class DSU:
    def __init__(self, nodes):
        self.parent = {n['id']: n['id'] for n in nodes}

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_i] = root_j
            return True
        return False

def kruskal_mst(nodes, edges):
    dsu = DSU(nodes)
    sorted_edges = sorted(edges, key=lambda e: e.get('weight', 1))
    mst = []

    for edge in sorted_edges:
        if dsu.union(edge['from'], edge['to']):
            mst.append(edge)

    return mst`;

export const DEFAULT_KRUSKAL_INPUT: KruskalInput = {
  nodes: [
    { id: 'A', label: 'A', x: 100, y: 100, state: 'default' },
    { id: 'B', label: 'B', x: 250, y: 50, state: 'default' },
    { id: 'C', label: 'C', x: 250, y: 200, state: 'default' },
    { id: 'D', label: 'D', x: 400, y: 100, state: 'default' },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 1 },
    { from: 'A', to: 'C', weight: 4 },
    { from: 'B', to: 'C', weight: 2 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'C', to: 'D', weight: 3 },
  ],
};

export const generateKruskalSteps = (input: KruskalInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes: GraphNodeItem[] = input.nodes.map((n) => ({
    ...n,
    state: 'default',
  }));

  const edges: GraphEdgeItem[] = input.edges.map((e) => ({
    ...e,
    isTraversed: false,
    isPath: false,
  }));

  const parent: Record<string, string> = {};
  const mstEdges: GraphEdgeItem[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>
  ) => {
    const parentHashMap: Record<string, string> = {};
    for (const n of nodes) {
      if (parent[n.id] !== undefined) {
        parentHashMap[`parent[${n.id}]`] = parent[n.id];
      }
    }

    const mstEdgeLabels = mstEdges.map(
      (e) => `(${e.from}-${e.to}: w=${e.weight ?? 1})`
    );

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'graph',
        nodes: nodes.map((n) => ({ ...n })),
        edges: edges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        hashMap: parentHashMap,
        visited: mstEdges.flatMap((e) => [e.from, e.to]),
        customState: {
          'DSU Parents': Object.entries(parent)
            .map(([k, v]) => `${k} -> ${v}`)
            .join(', '),
          'MST Edges Count': mstEdges.length,
          'MST Total Weight': mstEdges.reduce((acc, e) => acc + (e.weight ?? 0), 0),
          'MST Edges': mstEdgeLabels.join(', ') || 'None',
        },
      },
      variables,
    });
  };

  addStep(
    19,
    "Initialize Kruskal's Minimum Spanning Tree (MST) Algorithm",
    'Preparing Disjoint Set Union (DSU) parent pointers and sorting edge list by non-decreasing weight to enable greedy edge selection.',
    { nodeCount: nodes.length, edgeCount: edges.length }
  );

  if (nodes.length === 0) {
    addStep(28, 'Kruskal MST complete', 'Graph has 0 nodes.', { mstEdgeCount: 0 });
    return steps;
  }

  // Line 20: Initialize DSU parent array
  for (const n of nodes) {
    parent[n.id] = n.id;
  }

  addStep(
    20,
    'Initialize DSU parent array (each node is its own parent set)',
    'Set parent[v] = v for all vertices so that every node starts in its own singleton connected component.',
    { dsuInitialized: true }
  );

  // DSU Find helper
  const find = (i: string): string => {
    let curr = i;
    while (parent[curr] !== curr) {
      curr = parent[curr];
    }
    // Path compression
    const root = curr;
    curr = i;
    while (curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  };

  // DSU Union helper
  const union = (i: string, j: string): boolean => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  };

  // Line 21: Sort edges by weight
  const sortedEdges = [...edges].sort(
    (a, b) => (a.weight ?? 1) - (b.weight ?? 1)
  );

  addStep(
    21,
    `Sort all ${sortedEdges.length} edges in non-decreasing order of weight`,
    `Greedy Choice Strategy: Processing edges in ascending weight order ([${sortedEdges
      .map((e) => `${e.from}-${e.to}(w=${e.weight ?? 1})`)
      .join(', ')}]) ensures that the lightest edge bridging two disconnected components is always prioritized.`,
    { sortedEdgeCount: sortedEdges.length }
  );

  // Line 24: Loop through sorted edges
  for (const edge of sortedEdges) {
    const origEdge = edges.find(
      (e) =>
        (e.from === edge.from && e.to === edge.to) ||
        (e.from === edge.to && e.to === edge.from)
    );

    if (origEdge) {
      origEdge.isTraversed = true;
    }

    const uNode = nodes.find((n) => n.id === edge.from);
    const vNode = nodes.find((n) => n.id === edge.to);

    if (uNode) uNode.state = 'compare';
    if (vNode) vNode.state = 'compare';

    const rootU = find(edge.from);
    const rootV = find(edge.to);

    addStep(
      24,
      `Examine edge (${edge.from} - ${edge.to}, weight ${edge.weight ?? 1})`,
      `Finding DSU component roots: find('${edge.from}') = '${rootU}' and find('${edge.to}') = '${rootV}' to test for cycle creation.`,
      {
        from: edge.from,
        to: edge.to,
        weight: edge.weight ?? 1,
        rootU,
        rootV,
      }
    );

    const merged = union(edge.from, edge.to);

    if (merged) {
      if (origEdge) {
        origEdge.isPath = true;
      }
      mstEdges.push(edge);

      if (uNode) uNode.state = 'active';
      if (vNode) vNode.state = 'active';

      addStep(
        26,
        `Union successful! Add edge (${edge.from} - ${edge.to}) to MST`,
        `Roots '${rootU}' and '${rootV}' are distinct (find('${edge.from}') != find('${edge.to}')). Edge (${edge.from} - ${edge.to}) bridges two separate components without creating a cycle. Set parent['${rootU}'] = '${rootV}'.`,
        {
          from: edge.from,
          to: edge.to,
          weight: edge.weight ?? 1,
          newParent: rootV,
          mstSize: mstEdges.length,
        }
      );
    } else {
      addStep(
        25,
        `Union rejected! Edge (${edge.from} - ${edge.to}) forms a cycle`,
        `Both nodes '${edge.from}' and '${edge.to}' already share DSU root '${rootU}'. Adding this edge would form a cycle, so it is safely skipped.`,
        {
          from: edge.from,
          to: edge.to,
          weight: edge.weight ?? 1,
          sameRoot: rootU,
          skipped: true,
        }
      );
    }

    if (uNode) uNode.state = 'visited';
    if (vNode) vNode.state = 'visited';
  }

  const totalMstWeight = mstEdges.reduce((sum, e) => sum + (e.weight ?? 1), 0);

  addStep(
    28,
    `Kruskal's MST complete. Total MST weight = ${totalMstWeight}`,
    `Successfully identified Minimum Spanning Tree containing ${mstEdges.length} edges with minimum cumulative weight of ${totalMstWeight}.`,
    {
      totalEdgesInMst: mstEdges.length,
      totalMstWeight,
    }
  );

  return steps;
};

export const kruskalMst: AlgorithmDefinition<KruskalInput> = {
  id: 'kruskal-mst',
  title: "Kruskal's Minimum Spanning Tree",
  category: 'graph_spanning_trees',
  difficulty: 'Medium',
  description:
    'Kruskal\'s algorithm computes the Minimum Spanning Tree (MST) of a connected, undirected weighted graph. An MST is a subset of edges that connects all V vertices together without any cycles while minimizing the total sum of edge weights. The algorithm operates greedily: it sorts all E graph edges in non-decreasing order of weight and iterates through them. For each edge (u, v), a Disjoint Set Union (DSU / Union-Find) data structure with path compression checks if u and v belong to different connected components (find(u) != find(v)). If they belong to distinct sets, the edge is accepted into the MST and the sets are merged (union(u, v)); otherwise, the edge is rejected to prevent a cycle.',
  constraints: [
    '1 <= Vertices V <= 10^4',
    '0 <= Edges E <= 10^5',
    '-10^4 <= Edge Weight <= 10^4',
    'Graph must be undirected and connected (to form a single spanning tree of V - 1 edges)',
    'Duplicate edge weights are supported',
  ],
  examples: [
    {
      input: '4 nodes (A,B,C,D), 5 edges: [A-B(1), B-C(2), C-D(3), A-C(4), B-D(5)]',
      output: 'MST Edges: [A-B(1), B-C(2), C-D(3)], Total Weight = 6',
      explanation:
        '1. Sort edges: A-B(1), B-C(2), C-D(3), A-C(4), B-D(5). 2. Accept A-B(1). 3. Accept B-C(2). 4. Accept C-D(3). 5. Edge A-C(4) forms cycle (roots A & C connected via B), skipped. MST total weight = 6.',
    },
    {
      input: '3 nodes (A,B,C) forming a triangle with weights A-B(5), B-C(5), A-C(10)',
      output: 'MST Edges: [A-B(5), B-C(5)], Total Weight = 10',
      explanation:
        'Selecting the two lightest edges connects all 3 vertices into an MST without forming the triangle cycle.',
    },
  ],
  code: KRUSKAL_CODE,
  timeComplexity: {
    best: 'O(E log E)',
    average: 'O(E log E)',
    worst: 'O(E log E)',
  },
  spaceComplexity: 'O(V + E)',
  defaultInput: DEFAULT_KRUSKAL_INPUT,
  generateSteps: generateKruskalSteps,
};
