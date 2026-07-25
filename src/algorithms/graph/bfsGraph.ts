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

export const BFS_GRAPH_CODE = `function bfs(graph, startNode) {
  const visited = new Set([startNode]);
  const queue = [startNode];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const neighbor of graph.neighbors(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`;

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
    1,
    `Initialize BFS from node ${startId}`,
    `Starting Breadth-First Search traversal with node '${startId}'.`,
    { startNode: startId }
  );

  if (!startNodeExists || nodes.length === 0) {
    addStep(
      13,
      'BFS complete',
      'Start node not found or empty graph.',
      { startNode: startId }
    );
    return steps;
  }

  // Line 2: visited.add(startNode)
  visitedSet.add(startId);
  const startNode = nodes.find((n) => n.id === startId);
  if (startNode) {
    startNode.state = 'visited';
  }

  addStep(
    2,
    `Mark start node ${startId} as visited`,
    `Added '${startId}' to visited set to prevent duplicate processing.`,
    { startNode: startId, visitedCount: visitedSet.size }
  );

  // Line 3: queue.push(startNode)
  queue.push(startId);
  if (startNode) {
    startNode.state = 'queued';
  }

  addStep(
    3,
    `Enqueue start node ${startId}`,
    `Pushed '${startId}' into the FIFO queue.`,
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
      4,
      `Check queue condition (queue length: ${queue.length})`,
      `Queue is not empty. Continue BFS iteration.`,
      { queueLength: queue.length }
    );

    const currentId = queue.shift()!;
    const currentNode = nodes.find((n) => n.id === currentId);
    if (currentNode) {
      currentNode.state = 'active';
    }

    addStep(
      5,
      `Dequeue node ${currentId}`,
      `Removed '${currentId}' from front of queue to explore its neighbors.`,
      { current: currentId, queueLength: queue.length }
    );

    const neighbors = getNeighbors(currentId);

    addStep(
      6,
      `Explore neighbors of node ${currentId}`,
      `Node '${currentId}' has neighbors: [${neighbors.join(', ')}].`,
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
        7,
        `Check if neighbor ${neighborId} is visited`,
        isVisited
          ? `Neighbor '${neighborId}' is already in visited set. Skipping.`
          : `Neighbor '${neighborId}' is not yet visited. Proceeding to visit and queue.`,
        { current: currentId, neighbor: neighborId, isVisited }
      );

      if (!isVisited) {
        visitedSet.add(neighborId);
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode) {
          neighborNode.state = 'visited';
        }

        addStep(
          8,
          `Mark neighbor ${neighborId} as visited`,
          `Added '${neighborId}' to visited set.`,
          { neighbor: neighborId, visitedCount: visitedSet.size }
        );

        queue.push(neighborId);
        if (neighborNode) {
          neighborNode.state = 'queued';
        }

        addStep(
          9,
          `Enqueue neighbor ${neighborId}`,
          `Pushed '${neighborId}' into the FIFO queue.`,
          { neighbor: neighborId, queueLength: queue.length }
        );
      }
    }

    if (currentNode) {
      currentNode.state = 'visited';
    }
  }

  addStep(
    4,
    'Check queue condition (queue is empty)',
    'Queue is now empty. No more nodes to process.',
    { queueLength: 0 }
  );

  addStep(
    13,
    'BFS Graph Traversal complete',
    `All reachable nodes from '${startId}' have been visited level by level.`,
    { startNode: startId, totalVisited: visitedSet.size }
  );

  return steps;
};

export const bfsGraph: AlgorithmDefinition<BFSGraphInput> = {
  id: 'bfs-graph',
  title: 'BFS Graph Traversal',
  category: 'graph',
  difficulty: 'Medium',
  description:
    'Breadth-First Search (BFS) is a graph traversal algorithm that explores nodes layer by layer using a queue data structure to visit all neighbor nodes at current depth before moving deeper.',
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
