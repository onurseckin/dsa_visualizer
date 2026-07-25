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

export const KRUSKAL_CODE = `function kruskalMST(nodes, edges) {
  const parent = {};
  for (const node of nodes) parent[node.id] = node.id;

  function find(i) {
    if (parent[i] === i) return i;
    return parent[i] = find(parent[i]);
  }

  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  }

  const sortedEdges = [...edges].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
  const mst = [];

  for (const edge of sortedEdges) {
    if (union(edge.from, edge.to)) {
      mst.push(edge);
    }
  }
  return mst;
}`;

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
    1,
    "Initialize Kruskal's Minimum Spanning Tree (MST) Algorithm",
    'Preparing Disjoint Set Union (DSU) parent pointers and edge sorting.',
    { nodeCount: nodes.length, edgeCount: edges.length }
  );

  if (nodes.length === 0) {
    addStep(24, 'Kruskal MST complete', 'Graph has no nodes.', { mstEdgeCount: 0 });
    return steps;
  }

  // Line 2 & 3: Initialize DSU parent array
  for (const n of nodes) {
    parent[n.id] = n.id;
  }

  addStep(
    3,
    'Initialize DSU parent array (each node is its own parent set)',
    'Set parent[v] = v for all vertices in the graph.',
    { dsuInitialized: true }
  );

  // Line 5-8: DSU Find helper
  const find = (i: string): string => {
    let curr = i;
    while (parent[curr] !== curr) {
      curr = parent[curr];
    }
    // Path compression
    let root = curr;
    curr = i;
    while (curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  };

  // Line 10-18: DSU Union helper
  const union = (i: string, j: string): boolean => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  };

  // Line 20: Sort edges by weight
  const sortedEdges = [...edges].sort(
    (a, b) => (a.weight ?? 1) - (b.weight ?? 1)
  );

  addStep(
    20,
    `Sort all ${sortedEdges.length} edges in non-decreasing order of weight`,
    `Edges ordered by weight: [${sortedEdges
      .map((e) => `${e.from}-${e.to}(w=${e.weight ?? 1})`)
      .join(', ')}].`,
    { sortedEdgeCount: sortedEdges.length }
  );

  // Line 23: Loop through sorted edges
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
      23,
      `Examine edge (${edge.from} - ${edge.to}, weight ${edge.weight ?? 1})`,
      `Finding DSU roots: find('${edge.from}') = '${rootU}', find('${edge.to}') = '${rootV}'.`,
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
        24,
        `Union successful! Add edge (${edge.from} - ${edge.to}) to MST`,
        `Roots '${rootU}' and '${rootV}' are different. Set parent['${rootU}'] = '${rootV}'.`,
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
        23,
        `Union rejected! Edge (${edge.from} - ${edge.to}) forms a cycle`,
        `Both nodes share the same DSU root '${rootU}'. Edge skipped to prevent cycle.`,
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
    27,
    `Kruskal's MST complete. Total MST weight = ${totalMstWeight}`,
    `Found Minimum Spanning Tree with ${mstEdges.length} edges and total weight ${totalMstWeight}.`,
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
  category: 'tree',
  difficulty: 'Medium',
  description:
    "Finds the Minimum Spanning Tree (MST) of a connected, weighted graph by greedily picking edges in increasing order of weight using Disjoint Set Union (DSU / Union-Find).",
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
