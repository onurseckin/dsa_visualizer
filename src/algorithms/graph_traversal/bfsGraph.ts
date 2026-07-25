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
    `Initialize Breadth-First Search (BFS) from source node ${startId}`,
    `BFS systematically discovers graph nodes in increasing order of distance from source '${startId}' using a FIFO queue to enforce level-order processing.`,
    { startNode: startId }
  );

  if (!startNodeExists || nodes.length === 0) {
    addStep(
      3,
      'BFS complete: start node not found or graph empty',
      'Without a valid source vertex, no connected component can be explored.',
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
    `Mark start node ${startId} as visited`,
    `Inserting '${startId}' into the visited set prevents cyclic revisit loops during neighbor expansion.`,
    { startNode: startId, visitedCount: visitedSet.size }
  );

  // Line 5: queue = deque([start_node])
  queue.push(startId);
  if (startNode) {
    startNode.state = 'queued';
  }

  addStep(
    5,
    `Enqueue start node ${startId} into FIFO queue`,
    `Placing '${startId}' into the FIFO queue establishes the initial level-0 traversal frontier.`,
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
      `Check queue frontier state (Queue size: ${queue.length})`,
      `As long as the FIFO queue is non-empty, unexplored nodes remain in the current level frontier.`,
      { queueLength: queue.length }
    );

    const currentId = queue.shift()!;
    const currentNode = nodes.find((n) => n.id === currentId);
    if (currentNode) {
      currentNode.state = 'active';
    }

    addStep(
      8,
      `Dequeue node ${currentId} from front of queue`,
      `The FIFO invariant guarantees that node '${currentId}' is expanded at its minimum possible edge distance from source.`,
      { current: currentId, queueLength: queue.length }
    );

    const neighbors = getNeighbors(currentId);

    addStep(
      9,
      `Explore neighbors of node ${currentId}`,
      `Inspecting all incident edges from node '${currentId}' to discover unvisited adjacent nodes: [${neighbors.join(', ')}].`,
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
        `Check if neighbor ${neighborId} is visited`,
        isVisited
          ? `Neighbor '${neighborId}' is already in visited set. A shorter or equal path was already discovered; skipping.`
          : `Neighbor '${neighborId}' is unvisited. Proceed to mark visited and queue for next-level expansion.`,
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
          `Immediately marking '${neighborId}' as visited upon discovery prevents duplicate queue insertions from other nodes in the same level.`,
          { neighbor: neighborId, visitedCount: visitedSet.size }
        );

        queue.push(neighborId);
        if (neighborNode) {
          neighborNode.state = 'queued';
        }

        addStep(
          12,
          `Enqueue neighbor ${neighborId} into FIFO queue`,
          `Pushed '${neighborId}' to tail of FIFO queue to schedule it for expansion in the next depth layer.`,
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
    'Check queue condition (queue is empty)',
    'The FIFO queue is empty, confirming all reachable vertices in the current connected component have been visited.',
    { queueLength: 0 }
  );

  addStep(
    3,
    'BFS Graph Traversal complete!',
    `Successfully visited all ${visitedSet.size} reachable nodes layer by layer starting from source '${startId}'.`,
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
    'Breadth-First Search (BFS) is a fundamental graph traversal algorithm that systematically explores graph vertices layer by layer starting from a source node. Utilizing a First-In-First-Out (FIFO) queue and a visited tracking set, BFS visits all unvisited direct neighbors (distance 1) of the start node before advancing to distance-2 neighbors, distance-3 neighbors, and so on. In unweighted graphs, BFS guarantees finding the shortest path (minimum number of edges) from the source vertex to any reachable destination vertex.',
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
  defaultInput: DEFAULT_BFS_INPUT,
  generateSteps: generateBFSGraphSteps,
};
