import { AlgorithmDefinition, AlgorithmStep, GraphNodeItem, GraphEdgeItem } from '../../types/dsa';

export interface DijkstraInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
  startNode: string;
}

const code = `function dijkstra(nodes, edges, startNode) {
  const dist = {};
  nodes.forEach(n => dist[n] = Infinity);
  dist[startNode] = 0;
  const pq = [[0, startNode]];
  const visited = new Set();

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);

    edges.filter(e => e.from === u).forEach(edge => {
      if (dist[u] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[u] + edge.weight;
        pq.push([dist[edge.to], edge.to]);
      }
    });
  }
  return dist;
}`;

export const dijkstraShortestPath: AlgorithmDefinition<DijkstraInput> = {
  id: 'dijkstra-shortest-path',
  title: "Dijkstra's Shortest Path Algorithm",
  category: 'advanced_graphs',
  difficulty: 'Medium',
  description:
    "Finds the shortest paths from a single source node to all other nodes in a weighted graph with non-negative edge weights.",
  constraints: ['1 <= V <= 100', '0 <= weight <= 10^4'],
  examples: [{ input: 'StartNode = A', output: 'Distances: A:0, B:2, C:5, D:4' }],
  code,
  timeComplexity: { best: 'O((V + E) log V)', average: 'O((V + E) log V)', worst: 'O((V + E) log V)' },
  spaceComplexity: 'O(V + E)',
  defaultInput: {
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
  },
  generateSteps: (input: DijkstraInput): AlgorithmStep[] => {
    const rawNodes = input.nodes || ['A', 'B', 'C', 'D', 'E'];
    const rawEdges = input.edges || [];
    const startNode = input.startNode || 'A';

    const steps: AlgorithmStep[] = [];
    let stepIndex = 0;

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
      codeLine: 4,
      explanation: {
        what: `Initialize distance table. Set dist[${startNode}] = 0, all other nodes = ∞. Push [0, '${startNode}'] to Priority Queue.`,
        why: 'Source node has 0 distance to itself. Priority Queue will process nodes in ascending order of current shortest distance.',
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
        codeLine: 11,
        explanation: {
          what: `Extracted node '${u}' from Priority Queue with distance ${d}. Mark '${u}' as visited.`,
          why: `Dijkstra Greedy Choice: '${u}' currently has the smallest unvisited tentative distance (${d}).`,
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
        const newDist = dist[u] + edge.weight;

        if (newDist < dist[v]) {
          dist[v] = newDist;
          pq.push([newDist, v]);

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 16,
            explanation: {
              what: `Relaxed edge (${u} → ${v}, weight ${edge.weight}). Updated dist[${v}] = ${newDist}. Push to PQ.`,
              why: `Found shorter path to '${v}' via '${u}': ${dist[u]} + ${edge.weight} = ${newDist} < previous dist (${dist[v] === newDist ? 'updated' : 'older'}).`,
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
      codeLine: 21,
      explanation: {
        what: `Dijkstra algorithm execution completed. Shortest path distances from '${startNode}' computed for all nodes.`,
        why: 'All reachable graph nodes evaluated.',
      },
      primarySnapshot: { kind: 'graph', nodes: getGraphNodes(), edges: getGraphEdges() },
      auxiliaryState: {
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { completed: true },
    });

    return steps;
  },
};
