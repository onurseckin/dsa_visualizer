import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface BFSGraphInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  startNodeId: string;
}

export const BFS_GRAPH_CODE = `from collections import deque

def bfs(graph, start_node):
    visited = {start_node}
    queue = deque([start_node])
    
    while queue:
        current = queue.popleft()
        for neighbor in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`;

export const DEFAULT_BFS_INPUT: BFSGraphInput = {
  startNodeId: 'A',
  nodes: [
    { id: 'A', label: 'A', x: 100, y: 100, state: 'default' },
    { id: 'B', label: 'B', x: 200, y: 50, state: 'default' },
    { id: 'C', label: 'C', x: 200, y: 150, state: 'default' },
    { id: 'D', label: 'D', x: 300, y: 50, state: 'default' },
    { id: 'E', label: 'E', x: 300, y: 150, state: 'default' },
    { id: 'F', label: 'F', x: 400, y: 100, state: 'default' },
  ],
  edges: [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'C', to: 'E' },
    { from: 'D', to: 'F' },
    { from: 'E', to: 'F' },
  ],
};

export const generateBFSGraphSteps = (input: BFSGraphInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes: GraphNodeItem[] = input.nodes.map((node) => ({
    ...node,
    state: 'default',
  }));

  const edges: GraphEdgeItem[] = input.edges.map((edge) => ({
    ...edge,
    isTraversed: false,
  }));

  const queue: string[] = [];
  const visitedSet = new Set<string>();

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>
  ) => {
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
        queue: [...queue],
        visited: Array.from(visitedSet),
      },
      variables,
    });
  };

  const startId = input.startNodeId;
  const startNodeExists = nodes.some((n) => n.id === startId);

  addStep(
    3,
    `Start BFS from node ${startId}`,
    `We'll explore the graph in rings of distance from '${startId}': first its direct neighbors, then their neighbors, and so on — a first-in-first-out queue keeps that order for us.`,
    { startNode: startId }
  );

  if (!startNodeExists || nodes.length === 0) {
    addStep(
      3,
      'BFS complete — no valid start node',
      `'${startId}' isn't a vertex of this graph, so there is nothing to explore and we stop right away.`,
      { startNode: startId }
    );
    return steps;
  }

  // Line 4: visited = {start_node}
  visitedSet.add(startId);
  const startNode = nodes.find((n) => n.id === startId);
  if (startNode) {
    startNode.state = 'visited';
  }

  addStep(
    4,
    `Mark ${startId} as visited`,
    `We record '${startId}' as seen before exploring anything, so if a cycle ever leads back here we won't process it twice.`,
    { startNode: startId, visitedCount: visitedSet.size }
  );

  // Line 5: queue = deque([start_node])
  queue.push(startId);
  if (startNode) {
    startNode.state = 'queued';
  }

  addStep(
    5,
    `Enqueue start node ${startId}`,
    `The queue now holds our entire frontier — just '${startId}', the only node at distance 0.`,
    { startNode: startId, queueLength: queue.length }
  );

  // Helper to find undirected neighbors
  const getNeighbors = (nodeId: string): string[] => {
    const neighbors: string[] = [];
    for (const edge of edges) {
      if (edge.from === nodeId) neighbors.push(edge.to);
      else if (edge.to === nodeId) neighbors.push(edge.from);
    }
    return neighbors;
  };

  while (queue.length > 0) {
    addStep(
      7,
      `Check the queue (${queue.length} waiting)`,
      `The queue still has nodes in it, which means part of the frontier is unexplored — so we keep going.`,
      { queueLength: queue.length }
    );

    const currentId = queue.shift()!;
    const currentNode = nodes.find((n) => n.id === currentId);
    if (currentNode) {
      currentNode.state = 'active';
    }

    addStep(
      8,
      `Dequeue node ${currentId}`,
      `Because the queue is first-in-first-out, '${currentId}' comes out at the smallest edge distance we could ever reach it — this is exactly why BFS finds shortest paths in unweighted graphs.`,
      { current: currentId, queueLength: queue.length }
    );

    const neighbors = getNeighbors(currentId);

    addStep(
      9,
      `Explore ${currentId}'s neighbors`,
      `We follow every edge out of '${currentId}' to see which of [${neighbors.join(', ')}] we haven't met yet.`,
      { current: currentId, neighborCount: neighbors.length }
    );

    for (const neighborId of neighbors) {
      // Mark edge traversed
      const edge = edges.find(
        (e) =>
          (e.from === currentId && e.to === neighborId) ||
          (e.from === neighborId && e.to === currentId)
      );
      if (edge) {
        edge.isTraversed = true;
      }

      const isVisited = visitedSet.has(neighborId);

      addStep(
        10,
        `Check neighbor ${neighborId}`,
        isVisited
          ? `We've already seen '${neighborId}' — an earlier, equally short or shorter path got there first, so we skip it.`
          : `'${neighborId}' is new to us, so we'll mark it as seen and queue it up for the next ring.`,
        { current: currentId, neighbor: neighborId, isVisited }
      );

      if (!isVisited) {
        visitedSet.add(neighborId);
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode) {
          neighborNode.state = 'visited';
        }

        addStep(
          11,
          `Mark neighbor ${neighborId} as visited`,
          `We flag '${neighborId}' the moment we discover it, so another node in this same layer can't add it to the queue a second time.`,
          { neighbor: neighborId, visitedCount: visitedSet.size }
        );

        queue.push(neighborId);
        if (neighborNode) {
          neighborNode.state = 'queued';
        }

        addStep(
          12,
          `Enqueue neighbor ${neighborId}`,
          `'${neighborId}' joins the back of the queue, scheduled for expansion after everything already waiting — that's what keeps the layers in order.`,
          { neighbor: neighborId, queueLength: queue.length }
        );
      }
    }

    if (currentNode) {
      currentNode.state = 'visited';
    }
  }

  addStep(
    7,
    'Queue is empty — stop',
    `Nothing is left to expand, so every node reachable from '${startId}' has been visited.`,
    { queueLength: 0 }
  );

  addStep(
    3,
    'Traversal complete',
    `We visited all ${visitedSet.size} reachable nodes, layer by layer, from '${startId}'. Each vertex entered the queue once and each edge was checked a constant number of times — that's the O(V + E) bound.`,
    { startNode: startId, totalVisited: visitedSet.size }
  );

  return steps;
};

export const bfsGraph: AlgorithmDefinition<BFSGraphInput> = {
  id: 'bfs-graph',
  title: 'BFS Graph Traversal',
  category: 'graph_traversal',
  difficulty: 'Medium',
  description:
    'Breadth-First Search (BFS) explores a graph layer by layer from a source node: all distance-1 neighbors first, then distance-2, and so on. A first-in-first-out queue keeps the layers in order while a visited set stops cycles from causing repeat visits. Because nodes are reached in order of distance, BFS finds the shortest path (fewest edges) from the source to every reachable vertex in an unweighted graph.',
  constraints: [
    '1 <= Number of vertices V <= 10^4',
    '0 <= Number of edges E <= 10^5',
    'Vertices are uniquely labeled strings or integers',
    'The graph can be directed or undirected and may contain cycles',
    'Start node must be a valid vertex present in the graph',
  ],
  examples: [
    {
      input: 'startNode = "A", edges = [A-B, A-C, B-D, C-E, D-F, E-F]',
      output: 'Visited order: A, B, C, D, E, F',
      explanation:
        'Starting at A, BFS first visits distance-1 neighbors B and C, then distance-2 neighbors D and E, and finally distance-3 neighbor F.',
    },
    {
      input: 'startNode = "A", disconnected components {A-B} and {C-D}',
      output: 'Visited set: {A, B}',
      explanation:
        'BFS only visits nodes in the connected component reachable from source node A. Isolated component {C, D} remains unvisited.',
    },
  ],
  code: BFS_GRAPH_CODE,
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  complexityAnalysis: {
    time: 'Each vertex enters the queue at most once — the visited set guarantees it — and is dequeued and processed once, which accounts for the V term. When a vertex is dequeued we scan its incident edges, and over the whole run every edge is looked at only a constant number of times, adding the E term. The total is O(V + E) in every case, because BFS always sweeps the entire reachable component.',
    space: 'The visited set can end up holding every vertex, and the queue can hold a whole frontier of vertices at once, so extra memory grows with the vertex count — O(V).',
  },
  defaultInput: DEFAULT_BFS_INPUT,
  generateSteps: generateBFSGraphSteps,
};
