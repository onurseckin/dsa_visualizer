import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  TopicGuide,
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

const KRUSKAL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A minimum spanning tree is the cheapest set of edges that keeps every vertex of an undirected weighted graph connected without any redundancy. This is the shape of problem you have whenever you must link things together at minimum total cost — laying cable between buildings, wiring a circuit, choosing which roads to pave — and note that it is about total cost, not about any single pair being close. Kruskal's algorithm builds that tree by sorting every edge by weight and walking the list from cheapest to most expensive, keeping an edge whenever it joins two pieces that are not yet connected. Its whole engine is a disjoint-set (union-find) structure, so learning Kruskal is really learning two topics at once.",
  sections: [
    {
      heading: 'Cheapest edge that does not close a loop',
      body: 'Picture the vertices as a pile of separate fragments, each initially alone, that you are trying to fuse into one piece. Walking the edges in increasing weight order, an edge is useful exactly when its two endpoints sit in different fragments, because then it merges them and reduces the fragment count by one. If both endpoints already sit in the same fragment they are connected by a path already, so the edge would only create a cycle and add weight for nothing. You therefore need to answer one question quickly, over and over: are these two vertices already in the same fragment? Everything else in the algorithm is bookkeeping around that question.',
    },
    {
      heading: 'Union-find is the engine',
      body: 'Each fragment is represented by a tree of parent pointers, and its identity is whichever vertex sits at the root. To test two endpoints you follow parent pointers from each up to its root and compare the two roots; to merge fragments you make one root point at the other. Left alone those trees can grow into long chains, so two refinements keep them flat: path compression rewires every vertex you walked past to point straight at the root, and union by rank or size always hangs the smaller tree under the larger. With both in place, the connectivity queries cost so little that sorting the edges dominates the entire run. A useful stopping rule falls out of the same structure — once you have accepted one fewer edge than there are vertices, the tree is complete and the rest of the sorted list can be ignored.',
    },
    {
      heading: 'Why greedy is provably optimal here',
      body: 'The guarantee comes from the cut property: if you split the vertices into two groups in any way at all, the lightest edge crossing that split belongs to some minimum spanning tree. Every edge Kruskal accepts is the lightest remaining edge crossing the boundary between the fragment it joins and everything else, which is precisely a cut of that form, so no accepted edge is ever a mistake. The mirror image is the cycle property: the heaviest edge of any cycle can always be left out, which justifies every edge Kruskal skips. Put together they say that the greedy order never paints you into a corner, and you can also see it as an exchange argument — swapping in a cheaper crossing edge could only improve a supposedly optimal tree, so the cheap one must have been safe to take.',
    },
    {
      heading: 'Kruskal, Prim, or something else',
      body: "Prim's algorithm solves the identical problem from the other side: it grows one connected tree outward from a starting vertex, always absorbing the cheapest edge leaving the current tree, which is the same greedy principle applied to a single cut. Prim tends to win on dense graphs because it never needs a global sort and works naturally from an adjacency structure, while Kruskal shines on sparse graphs and especially when the edges arrive already sorted or can be sorted cheaply, since then the algorithm is little more than a scan. Kruskal also degrades gracefully into a very useful tool when you feed it a disconnected graph — it returns a minimum spanning forest, one tree per connected component, which Prim from a single seed cannot do. And if you need the maximum spanning tree instead, just walk the sorted list in the opposite direction; nothing else changes.",
    },
    {
      heading: 'Pitfalls and edge cases',
      body: 'Negative edge weights are entirely harmless here, unlike in shortest-path problems, because a spanning tree must contain a fixed number of edges no matter what and there is no cycle to exploit. Equal weights mean several different minimum spanning trees may exist; your tie-breaking decides which one you get, but the total weight is identical, so a test asserting a specific edge set can be wrong while the algorithm is right. The algorithm assumes undirected edges — the directed analogue, a minimum spanning arborescence, needs a genuinely different method and cannot be obtained by ignoring direction. Two implementation traps are worth naming: comparing endpoint labels instead of their roots, which misses cycles created through intermediate vertices, and skipping path compression, which quietly turns the union-find into a linked list on adversarial inputs.',
    },
    {
      heading: 'Where this pattern shows up again',
      body: 'The accept-or-skip loop over sorted edges is a general recipe for "combine cheapest first" problems. Stop Kruskal early, after accepting a chosen number of merges, and you have single-linkage clustering, where the fragments are the clusters and the next edge you would have taken measures the separation between them. The minimum spanning tree also solves the minimum-bottleneck path problem for free: the path between any two vertices inside the tree minimizes the heaviest edge you must cross, which is why the same structure answers maximum-capacity routing questions. More broadly, processing edges in weight order while maintaining connectivity is the standard offline technique for questions like "at what threshold do these two vertices first become connected", and recording the merge history as a tree turns those into simple ancestor lookups.',
    },
  ],
  keyTerms: [
    {
      term: 'Spanning tree',
      definition:
        'A subset of edges that connects every vertex while containing no cycle, which forces it to have exactly one fewer edge than there are vertices. The minimum spanning tree is the one whose edge weights sum to the smallest possible total.',
    },
    {
      term: 'Disjoint-set union (union-find)',
      definition:
        'The structure that tracks which vertices currently belong to the same fragment, supporting a find operation that names a fragment and a union operation that merges two of them.',
    },
    {
      term: 'Path compression',
      definition:
        'Re-pointing every vertex encountered during a find directly at the root, so later queries on the same fragment take a single step. It is what keeps union-find effectively constant time.',
    },
    {
      term: 'Cut property',
      definition:
        'The theorem doing all the work: for any way of splitting the vertices into two groups, the lightest edge crossing the split belongs to some minimum spanning tree. Each edge Kruskal accepts is such an edge.',
    },
    {
      term: 'Spanning forest',
      definition:
        'What you get when the graph is not connected: one minimum spanning tree per connected component. Kruskal produces it naturally, since it simply runs out of merging edges.',
    },
  ],
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
  topicGuide: KRUSKAL_TOPIC_GUIDE,
  defaultInput: DEFAULT_KRUSKAL_INPUT,
  generateSteps: generateKruskalSteps,
};
