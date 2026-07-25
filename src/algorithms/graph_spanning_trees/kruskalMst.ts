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
    "Start Kruskal's MST algorithm",
    'We want the cheapest set of edges that still connects every node. The plan: sort the edges by weight, then greedily keep each one that joins two components that are not yet connected.',
    { nodeCount: nodes.length, edgeCount: edges.length }
  );

  if (nodes.length === 0) {
    addStep(28, "Kruskal's MST complete", 'With no nodes there is nothing to connect, so the spanning tree is empty.', { mstEdgeCount: 0 });
    return steps;
  }

  // Line 20: Initialize DSU parent array
  for (const n of nodes) {
    parent[n.id] = n.id;
  }

  addStep(
    20,
    'Make each node its own set',
    "We give every node parent[v] = v, so each one starts as its own tiny component. From here, union-find can tell us instantly whether an edge's endpoints are already connected.",
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
    `Sort the ${sortedEdges.length} edges by weight`,
    `Cheapest-first is the whole greedy idea: [${sortedEdges
      .map((e) => `${e.from}-${e.to}(w=${e.weight ?? 1})`)
      .join(', ')}]. The lightest edge that bridges two separate components is always safe to keep, so we want to meet those edges first.`,
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
      `Examine edge ${edge.from} - ${edge.to} (weight ${edge.weight ?? 1})`,
      `Before deciding, we ask union-find which component each endpoint lives in: find('${edge.from}') = '${rootU}' and find('${edge.to}') = '${rootV}'. Different roots mean this edge connects new territory.`,
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
        `Add edge ${edge.from} - ${edge.to} to the MST`,
        `'${edge.from}' and '${edge.to}' live in different components ('${rootU}' vs '${rootV}'), so this edge connects them without closing a loop. We keep it and merge the two sets by pointing '${rootU}' at '${rootV}'.`,
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
        `Skip edge ${edge.from} - ${edge.to} (cycle)`,
        `Both '${edge.from}' and '${edge.to}' already trace back to the same root '${rootU}', so they're connected already. Keeping this edge would only close a loop — and a tree never has one.`,
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
    `Kruskal's MST complete: total weight ${totalMstWeight}`,
    `We kept ${mstEdges.length} edges that connect every node for a total weight of ${totalMstWeight}, and no cheaper spanning tree exists. Fittingly, the up-front sort was the most expensive part — O(E log E) overall.`,
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
    "Kruskal's algorithm builds the Minimum Spanning Tree (MST) of a connected, undirected weighted graph — the cheapest possible set of edges that connects all V vertices without any cycles. It works greedily: sort every edge by weight, then walk the list from lightest to heaviest. For each edge (u, v), a union-find (DSU) structure with path compression checks whether u and v already belong to the same component. If they don't, the edge is kept and the two components are merged; if they do, the edge would close a cycle, so it is skipped.",
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
  complexityAnalysis: {
    time: 'Sorting the edge list up front dominates everything: O(E log E). After that we walk the sorted edges once, and each union-find query runs in near-constant amortized time thanks to path compression, so the scan adds only about O(E) more. Best and worst case match because the sort always happens in full.',
    space: 'Union-find stores one parent pointer per vertex, and we keep a sorted copy of the edge list alongside the growing MST, so extra memory is O(V + E).',
  },
  defaultInput: DEFAULT_KRUSKAL_INPUT,
  generateSteps: generateKruskalSteps,
};
