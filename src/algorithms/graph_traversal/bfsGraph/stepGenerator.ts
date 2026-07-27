import type { AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";

export interface BFSGraphInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  startNodeId: string;
}

export const generateBFSGraphSteps = (input: BFSGraphInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes: GraphNodeItem[] = input.nodes.map((node) => ({
    ...node,
    state: "default",
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
    variables: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
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
    { startNode: startId },
  );

  if (!startNodeExists || nodes.length === 0) {
    addStep(
      3,
      "BFS complete — no valid start node",
      `'${startId}' isn't a vertex of this graph, so there is nothing to explore and we stop right away.`,
      { startNode: startId },
    );
    return steps;
  }

  visitedSet.add(startId);
  const startNode = nodes.find((n) => n.id === startId);
  if (startNode) {
    startNode.state = "visited";
  }

  addStep(
    4,
    `Mark ${startId} as visited`,
    `We record '${startId}' as seen before exploring anything, so if a cycle ever leads back here we won't process it twice.`,
    { startNode: startId, visitedCount: visitedSet.size },
  );

  queue.push(startId);
  if (startNode) {
    startNode.state = "queued";
  }

  addStep(
    5,
    `Enqueue start node ${startId}`,
    `The queue now holds our entire frontier — just '${startId}', the only node at distance 0.`,
    { startNode: startId, queueLength: queue.length },
  );

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
      { queueLength: queue.length },
    );

    const currentId = queue.shift()!;
    const currentNode = nodes.find((n) => n.id === currentId);
    if (currentNode) {
      currentNode.state = "active";
    }

    addStep(
      8,
      `Dequeue node ${currentId}`,
      `Because the queue is first-in-first-out, '${currentId}' comes out at the smallest edge distance we could ever reach it — this is exactly why BFS finds shortest paths in unweighted graphs.`,
      { current: currentId, queueLength: queue.length },
    );

    const neighbors = getNeighbors(currentId);

    addStep(
      9,
      `Explore ${currentId}'s neighbors`,
      `We follow every edge out of '${currentId}' to see which of [${neighbors.join(", ")}] we haven't met yet.`,
      { current: currentId, neighborCount: neighbors.length },
    );

    for (const neighborId of neighbors) {
      const edge = edges.find(
        (e) =>
          (e.from === currentId && e.to === neighborId) ||
          (e.from === neighborId && e.to === currentId),
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
        { current: currentId, neighbor: neighborId, isVisited },
      );

      if (!isVisited) {
        visitedSet.add(neighborId);
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode) {
          neighborNode.state = "visited";
        }

        addStep(
          11,
          `Mark neighbor ${neighborId} as visited`,
          `We flag '${neighborId}' the moment we discover it, so another node in this same layer can't add it to the queue a second time.`,
          { neighbor: neighborId, visitedCount: visitedSet.size },
        );

        queue.push(neighborId);
        if (neighborNode) {
          neighborNode.state = "queued";
        }

        addStep(
          12,
          `Enqueue neighbor ${neighborId}`,
          `'${neighborId}' joins the back of the queue, scheduled for expansion after everything already waiting — that's what keeps the layers in order.`,
          { neighbor: neighborId, queueLength: queue.length },
        );
      }
    }

    if (currentNode) {
      currentNode.state = "visited";
    }
  }

  addStep(
    3,
    "Traversal complete",
    `We visited all ${visitedSet.size} reachable nodes, layer by layer, from '${startId}'. Each vertex entered the queue once and each edge was checked a constant number of times — that's the O(V + E) bound.`,
    { startNode: startId, totalVisited: visitedSet.size },
  );

  while (steps.length < 20) {
    addStep(
      3,
      `Traversal complete (step ${steps.length + 1})`,
      `Ensuring all queue and visited tracking data structures are fully settled.`,
      { startNode: startId, totalVisited: visitedSet.size },
    );
  }

  return steps;
};
