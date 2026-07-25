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
        what: 'Initialize on an empty graph',
        why: 'There are no nodes to explore, so we finish immediately with an empty distance table.',
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
      what: `Set dist['${startNode}'] to 0`,
      why: `We only know one distance for sure: '${startNode}' is 0 away from itself, so every other node starts at ∞ until we find a path to it. We seed the priority queue with (0, '${startNode}') so the closest frontier node is always the next one out.`,
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
        what: `Pop '${u}' at distance ${d}`,
        why: `Of everything we haven't visited, '${u}' is the closest we can currently reach, at distance ${d}. Since no edge weight is negative, no detour could ever beat that, so we lock ${d} in as final and mark '${u}' visited.`,
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
            what: `Relax edge ${u} → ${v}`,
            why: `Going through '${u}' reaches '${v}' at cost ${newDist - edge.weight} + ${edge.weight} = ${newDist}, beating its old distance of ${oldDist === Infinity ? '∞' : oldDist}. We record the shortcut and queue (${newDist}, '${v}') so its neighbors get a chance to benefit too.`,
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
      what: 'Read off the completed distance table',
      why: `The queue is empty, so every node reachable from '${startNode}' has been visited and finalized. As a closing note: with a binary heap, all those pops and pushes together cost O((V + E) log V).`,
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
    "Dijkstra's algorithm finds the shortest path from one starting node to every other vertex in a weighted graph, as long as no edge weight is negative. It works greedily with a min-priority queue: repeatedly pop the unvisited vertex with the smallest tentative distance, finalize that distance, and relax its outgoing edges to see if any neighbor just got cheaper to reach. Because weights are non-negative, a vertex's distance can never improve after it is popped — which is exactly why the greedy choice is safe.",
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
  complexityAnalysis: {
    time: 'Every vertex is popped from the priority queue at most once, and every edge relaxation can push at most one new entry into it. Each heap push or pop costs O(log V), so across V pops and up to E pushes the total work is O((V + E) log V). Best and worst case match because we always drain the whole queue before stopping.',
    space: 'The distance table and visited set each hold one entry per vertex, and the priority queue can briefly hold one stale entry per edge relaxation, so extra memory grows as O(V + E).',
  },
  defaultInput: DEFAULT_DIJKSTRA_INPUT,
  generateSteps: generateDijkstraSteps,
};

