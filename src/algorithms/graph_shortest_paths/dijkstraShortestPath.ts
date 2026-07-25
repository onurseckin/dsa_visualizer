import type { AlgorithmDefinition, AlgorithmStep, GraphNodeItem, GraphEdgeItem } from '../../types/dsa';

export interface DijkstraInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
  startNode: string;
}

export const DIJKSTRA_CODE = `import heapq

def dijkstra(nodes, edges, start_node):
    dist = {node: float('inf') for node in nodes}
    dist[start_node] = 0
    pq = [(0, start_node)]
    visited = set()

    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)

        for edge in edges:
            if edge['from'] == u:
                v, weight = edge['to'], edge['weight']
                if dist[u] + weight < dist[v]:
                    dist[v] = dist[u] + weight
                    heapq.heappush(pq, (dist[v], v))

    return dist`;

export const DEFAULT_DIJKSTRA_INPUT: DijkstraInput = {
  nodes: ['A', 'B', 'C', 'D', 'E'],
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'C', to: 'D', weight: 8 },
    { from: 'C', to: 'E', weight: 10 },
    { from: 'D', to: 'E', weight: 2 },
  ],
  startNode: 'A',
};

export const generateDijkstraSteps = (input: DijkstraInput): AlgorithmStep[] => {
  const rawNodes = input.nodes || ['A', 'B', 'C', 'D', 'E'];
  const rawEdges = input.edges || [];
  const startNode = input.startNode || 'A';

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  if (rawNodes.length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 3,
      explanation: {
        what: 'Initialize Dijkstra Shortest Path Algorithm',
        why: 'Empty node set provided.',
      },
      primarySnapshot: { kind: 'graph', nodes: [], edges: [] },
      auxiliaryState: { customState: { NodeCount: 0 } },
      variables: { completed: true },
    });
    return steps;
  }

  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  dist[startNode] = 0;

  const visited = new Set<string>();
  const pq: [number, string][] = [[0, startNode]];

  const getGraphNodes = (activeId?: string): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === Infinity ? '∞' : dist[id]})`,
      state: id === activeId ? 'active' : visited.has(id) ? 'visited' : 'default',
    }));

  const getGraphEdges = (activeEdge?: { from: string; to: string }): GraphEdgeItem[] =>
    rawEdges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight,
      isTraversed:
        activeEdge?.from === e.from && activeEdge?.to === e.to ? true : visited.has(e.from) && visited.has(e.to),
    }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Initialize distance table. Set dist['${startNode}'] = 0, all other nodes = ∞. Push (0, '${startNode}') into Priority Queue.`,
      why: 'Source vertex has 0 distance to itself while all other tentative distances default to infinity. Priority Queue orders unvisited vertices by distance to enforce the greedy choice property.',
    },
    primarySnapshot: { kind: 'graph', nodes: getGraphNodes(startNode), edges: getGraphEdges() },
    auxiliaryState: {
      queue: pq.map(([d, u]) => `${u}:${d}`),
      visited: Array.from(visited),
      distanceTable: { ...dist },
    },
    variables: { startNode, currentDist: 0 },
  });

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Extracted node '${u}' from Priority Queue with distance ${d}. Mark '${u}' as visited.`,
        why: `Dijkstra Greedy Choice: Node '${u}' currently holds the minimum tentative distance (${d}) among all unvisited vertices. Non-negative edge weights guarantee that no alternate unvisited path can reach '${u}' with a smaller cost, so dist['${u}'] is finalized.`,
      },
      primarySnapshot: { kind: 'graph', nodes: getGraphNodes(u), edges: getGraphEdges() },
      auxiliaryState: {
        queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { u, d },
    });

    const neighbors = rawEdges.filter((e) => e.from === u);
    for (const edge of neighbors) {
      const v = edge.to;
      const oldDist = dist[v];
      const newDist = dist[u] + edge.weight;

      if (newDist < dist[v]) {
        dist[v] = newDist;
        pq.push([newDist, v]);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 19,
          explanation: {
            what: `Relaxed edge (${u} → ${v}, weight ${edge.weight}). Updated dist['${v}'] = ${newDist}. Push (${newDist}, '${v}') to PQ.`,
            why: `Triangle Inequality Relaxation: dist['${u}'] (${dist[u] - edge.weight}) + weight (${edge.weight}) = ${newDist} < previous dist['${v}'] (${oldDist === Infinity ? '∞' : oldDist}). Shorter path discovered to '${v}' via '${u}'.`,
          },
          primarySnapshot: {
            kind: 'graph',
            nodes: getGraphNodes(v),
            edges: getGraphEdges({ from: u, to: v }),
          },
          auxiliaryState: {
            queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
            visited: Array.from(visited),
            distanceTable: { ...dist },
          },
          variables: { u, v, weight: edge.weight, newDist },
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Dijkstra algorithm execution completed. Shortest path distances from '${startNode}' computed for all nodes.`,
      why: 'All reachable graph vertices have been visited and finalized; Priority Queue is empty.',
    },
    primarySnapshot: { kind: 'graph', nodes: getGraphNodes(), edges: getGraphEdges() },
    auxiliaryState: {
      visited: Array.from(visited),
      distanceTable: { ...dist },
    },
    variables: { completed: true },
  });

  return steps;
};

export const dijkstraShortestPath: AlgorithmDefinition<DijkstraInput> = {
  id: 'dijkstra-shortest-path',
  title: "Dijkstra's Shortest Path Algorithm",
  category: 'graph_shortest_paths',
  difficulty: 'Medium',
  description:
    'Dijkstra\'s algorithm finds the single-source shortest paths from a starting node to all other vertices in a weighted graph with non-negative edge weights. Using a Greedy strategy backed by a Min-Priority Queue (min-heap), the algorithm repeatedly extracts the unvisited vertex with the smallest tentative distance, marks its distance as finalized, and relaxes all of its outgoing edges. The greedy choice property guarantees that once a vertex is popped from the priority queue, its current tentative distance is optimal and cannot be improved by any other path.',
  constraints: [
    '1 <= Vertices V <= 10^4',
    '0 <= Edges E <= 10^5',
    '0 <= Edge Weight <= 10^4 (non-negative edge weights required)',
    'Graph can be directed or undirected',
    'Source vertex must exist in the graph',
  ],
  examples: [
    {
      input: 'StartNode = A, Nodes = [A, B, C, D, E], Edges = [A->B(4), A->C(2), B->C(1), B->D(5), C->D(8), C->E(10), D->E(2)]',
      output: 'Distances: A:0, B:4, C:2, D:9, E:11',
      explanation:
        '1. Start A at dist 0. 2. Pop C (dist 2), relax C->E (12) and C->D (10). 3. Pop B (dist 4), relax B->D (9). 4. Pop D (dist 9), relax D->E (11). Final shortest path distances computed.',
    },
    {
      input: 'StartNode = A, disconnected graph with nodes [A, B, C] and edge A->B(5)',
      output: 'Distances: A:0, B:5, C:∞',
      explanation:
        'Node C is unreachable from source node A, maintaining an infinite distance value.',
    },
  ],
  code: DIJKSTRA_CODE,
  timeComplexity: { best: 'O((V + E) log V)', average: 'O((V + E) log V)', worst: 'O((V + E) log V)' },
  spaceComplexity: 'O(V + E)',
  defaultInput: DEFAULT_DIJKSTRA_INPUT,
  generateSteps: generateDijkstraSteps,
};

