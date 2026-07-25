import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface BellmanFordInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
  startNode: string;
}

export const BELLMAN_FORD_CODE = `def bellman_ford(nodes, edges, start_node):
    dist = {node: float('inf') for node in nodes}
    dist[start_node] = 0

    # Relax edges V - 1 times
    for i in range(len(nodes) - 1):
        for u, v, weight in edges:
            if dist[u] != float('inf') and dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight

    # Check for negative-weight cycles
    has_negative_cycle = False
    for u, v, weight in edges:
        if dist[u] != float('inf') and dist[u] + weight < dist[v]:
            has_negative_cycle = True
            break

    return dist, has_negative_cycle`;

export const DEFAULT_BELLMAN_FORD_INPUT: BellmanFordInput = {
  nodes: ['S', 'A', 'B', 'C', 'D'],
  edges: [
    { from: 'S', to: 'A', weight: 4 },
    { from: 'S', to: 'B', weight: 2 },
    { from: 'B', to: 'A', weight: 1 },
    { from: 'A', to: 'C', weight: 3 },
    { from: 'B', to: 'C', weight: 5 },
    { from: 'B', to: 'D', weight: 4 },
    { from: 'C', to: 'D', weight: -2 },
  ],
  startNode: 'S',
};

export const generateBellmanFordSteps = (input: BellmanFordInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = input.nodes || [];
  const rawEdges = input.edges || [];
  const startNode = input.startNode || (rawNodes[0] ?? '');

  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  if (startNode && dist[startNode] !== undefined) {
    dist[startNode] = 0;
  }

  const getGraphNodes = (activeNodeId?: string): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === Infinity ? '∞' : dist[id]})`,
      state: id === activeNodeId ? 'active' : dist[id] !== Infinity ? 'visited' : 'default',
    }));

  const getGraphEdges = (activeEdge?: { from: string; to: string }): GraphEdgeItem[] =>
    rawEdges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight,
      isTraversed: activeEdge?.from === e.from && activeEdge?.to === e.to,
      isPath: dist[e.to] !== Infinity && dist[e.from] !== Infinity && dist[e.from] + e.weight === dist[e.to],
    }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNodeId?: string,
    activeEdge?: { from: string; to: string }
  ) => {
    const distTableFormatted: Record<string, number> = {};
    for (const n of rawNodes) {
      distTableFormatted[n] = dist[n];
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'graph',
        nodes: getGraphNodes(activeNodeId),
        edges: getGraphEdges(activeEdge),
      },
      auxiliaryState: {
        distanceTable: distTableFormatted,
        visited: rawNodes.filter((n) => dist[n] !== Infinity),
        customState: {
          'Start Node': startNode,
          'Node Count': rawNodes.length,
          'Edge Count': rawEdges.length,
        },
      },
      variables,
    });
  };

  // Line 1 & 2: Initialization
  addStep(
    1,
    'Initialize Bellman-Ford Shortest Path Algorithm',
    `Bellman-Ford iteratively relaxes edges up to V - 1 times because any simple path in a graph with ${rawNodes.length} vertices contains at most ${Math.max(0, rawNodes.length - 1)} edges.`,
    { nodeCount: rawNodes.length, edgeCount: rawEdges.length }
  );

  if (rawNodes.length === 0) {
    addStep(18, 'Bellman-Ford execution complete', 'Graph contains 0 nodes.', { completed: true });
    return steps;
  }

  addStep(
    3,
    `Set start node dist['${startNode}'] = 0, all other nodes = ∞`,
    `Distance from source '${startNode}' to itself is initialized to 0, while all other node distances default to positive infinity.`,
    { startNode, 'dist[startNode]': 0 },
    startNode
  );

  // Outer loop: V - 1 passes
  const numPasses = Math.max(0, rawNodes.length - 1);

  for (let pass = 0; pass < numPasses; pass++) {
    let anyRelaxedInPass = false;
    addStep(
      6,
      `Start Relaxation Pass ${pass + 1} of ${numPasses}`,
      `Pass ${pass + 1} guarantees finding true shortest paths for all vertices whose optimal path from source contains at most ${pass + 1} edges.`,
      { pass: pass + 1, numPasses }
    );

    for (const edge of rawEdges) {
      const u = edge.from;
      const v = edge.to;
      const weight = edge.weight;

      if (dist[u] !== Infinity && dist[u] + weight < dist[v]) {
        const oldDist = dist[v];
        dist[v] = dist[u] + weight;
        anyRelaxedInPass = true;

        addStep(
          9,
          `Relax edge (${u} → ${v}, weight ${weight}): dist['${v}'] updated from ${oldDist === Infinity ? '∞' : oldDist} to ${dist[v]}`,
          `Triangle Inequality Relaxation: dist['${u}'] (${dist[u] - weight}) + weight (${weight}) = ${dist[v]} < previous dist['${v}'] (${oldDist === Infinity ? '∞' : oldDist}). Shorter path discovered to '${v}'.`,
          { pass: pass + 1, u, v, weight, newDist: dist[v] },
          v,
          { from: u, to: v }
        );
      } else {
        addStep(
          8,
          `Examine edge (${u} → ${v}, weight ${weight}): no relaxation`,
          dist[u] === Infinity
            ? `Source node '${u}' is currently unreachable (dist = ∞), so edge (${u} → ${v}) cannot yield a valid path.`
            : `Current dist['${v}'] (${dist[v] === Infinity ? '∞' : dist[v]}) is already <= dist['${u}'] (${dist[u]}) + weight ${weight} (${dist[u] + weight}). Edge relaxation skipped.`,
          { pass: pass + 1, u, v, weight },
          u,
          { from: u, to: v }
        );
      }
    }

    if (!anyRelaxedInPass) {
      addStep(
        6,
        `Early termination after Pass ${pass + 1}`,
        'No distance updates occurred during this entire pass. All shortest paths have fully converged ahead of V - 1 passes.',
        { convergedEarly: true, pass: pass + 1 }
      );
      break;
    }
  }

  // Check for negative weight cycles
  let hasNegativeCycle = false;
  addStep(
    12,
    'Check for negative-weight cycles across all edges',
    'Running a V-th relaxation check tests if any edge can still decrease distance. If so, a negative-weight cycle exists.',
    { checkingNegativeCycles: true }
  );

  for (const edge of rawEdges) {
    const u = edge.from;
    const v = edge.to;
    const weight = edge.weight;

    if (dist[u] !== Infinity && dist[u] + weight < dist[v]) {
      hasNegativeCycle = true;
      addStep(
        15,
        `Negative cycle detected on edge (${u} → ${v}, weight ${weight})!`,
        `Distance to '${v}' can be further decreased (${dist[u]} + ${weight} < ${dist[v]}), confirming a negative-weight cycle is reachable from source '${startNode}'.`,
        { u, v, weight, hasNegativeCycle: true },
        v,
        { from: u, to: v }
      );
      break;
    }
  }

  if (!hasNegativeCycle) {
    addStep(
      18,
      `Bellman-Ford complete. Shortest paths computed from source '${startNode}'.`,
      'No negative-weight cycles detected. Final shortest path distances computed for all reachable vertices.',
      { hasNegativeCycle: false, completed: true }
    );
  } else {
    addStep(
      18,
      'Bellman-Ford complete with negative cycle warning.',
      'Graph contains a negative-weight cycle reachable from source. Shortest paths are undefined (unbounded negative distance).',
      { hasNegativeCycle: true, completed: true }
    );
  }

  return steps;
};

export const bellmanFord: AlgorithmDefinition<BellmanFordInput> = {
  id: 'bellman-ford',
  title: 'Bellman-Ford Shortest Path',
  category: 'graph_shortest_paths',
  difficulty: 'Medium',
  description:
    'Computes single-source shortest paths from a starting vertex to all other vertices in a weighted graph (directed or undirected). Unlike Dijkstra\'s algorithm, Bellman-Ford can handle negative edge weights. By iteratively relaxing all E edges V - 1 times (where V is the vertex count), the algorithm guarantees computing exact shortest paths provided there are no negative-weight cycles. An optional V-th edge relaxation pass is performed to detect whether negative-weight cycles exist: if any edge can still be relaxed after V - 1 passes, a negative cycle is reachable from the source.',
  constraints: [
    '1 <= Vertices V <= 250',
    '0 <= Edges E <= 2500',
    '-10^4 <= Edge Weight <= 10^4',
    'Start node must exist in the graph',
    'Graphs may contain negative edge weights and negative cycles',
  ],
  examples: [
    {
      input: 'StartNode = S, Nodes = [S,A,B,C,D], Edges = [S->A(4), S->B(2), B->A(1), A->C(3), B->C(5), B->D(4), C->D(-2)]',
      output: 'Distances: S:0, A:3, B:2, C:6, D:4',
      explanation:
        'Iterative edge relaxation updates S->B (2), S->A via B (2+1=3), S->C via A (3+3=6), and S->D via C (6-2=4). No negative cycles detected.',
    },
    {
      input: 'StartNode = A, Nodes = [A, B, C], Edges = [A->B(1), B->C(-2), C->B(-1)]',
      output: 'Negative Cycle Detected: True',
      explanation:
        'Cycle B -> C -> B has total weight (-2) + (-1) = -3. Iterative relaxation continues decreasing distance indefinitely.',
    },
  ],
  code: BELLMAN_FORD_CODE,
  timeComplexity: {
    best: 'O(E)',
    average: 'O(V * E)',
    worst: 'O(V * E)',
  },
  spaceComplexity: 'O(V)',
  defaultInput: DEFAULT_BELLMAN_FORD_INPUT,
  generateSteps: generateBellmanFordSteps,
};
