import type {
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface BFSGraphInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  startNodeId: string;
}

export const DEFAULT_BFS_INPUT: BFSGraphInput = {
  startNodeId: "A",
  nodes: [
    { id: "A", label: "A", x: 100, y: 100, state: "default" },
    { id: "B", label: "B", x: 200, y: 50, state: "default" },
    { id: "C", label: "C", x: 200, y: 150, state: "default" },
    { id: "D", label: "D", x: 300, y: 50, state: "default" },
    { id: "E", label: "E", x: 300, y: 150, state: "default" },
    { id: "F", label: "F", x: 400, y: 100, state: "default" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "E" },
    { from: "D", to: "F" },
    { from: "E", to: "F" },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Breadth-First Search (BFS) traverses graph vertices layer by layer in expanding concentric rings starting from a designated source node.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A", x: 100, y: 100, state: "active" },
        { id: "B", label: "B", x: 250, y: 50, state: "default" },
        { id: "C", label: "C", x: 250, y: 150, state: "default" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: false },
        { from: "A", to: "C", isTraversed: false },
      ],
    },
  },
  {
    narrative:
      "Layer-by-Layer Propagation: starting at source node S at distance 0, BFS explores all direct neighbors at distance 1 before advancing to distance 2 neighbors.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A (dist 0)", x: 100, y: 100, state: "sorted" },
        { id: "B", label: "B (dist 1)", x: 250, y: 50, state: "compare" },
        { id: "C", label: "C (dist 1)", x: 250, y: 150, state: "compare" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "A", to: "C", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "FIFO Queue Frontier: a First-In-First-Out (FIFO) queue manages the discovery frontier, guaranteeing that vertices are processed in non-decreasing order of distance.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A", x: 100, y: 100, state: "visited" },
        { id: "B", label: "B [FIFO]", x: 250, y: 50, state: "pivot" },
        { id: "C", label: "C [FIFO]", x: 250, y: 150, state: "pivot" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "A", to: "C", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Visited Set Prevention: maintaining a visited lookup set prevents duplicate queueing and stops infinite loops in cyclic or dense graphs.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A", x: 100, y: 100, state: "visited" },
        { id: "B", label: "B", x: 250, y: 50, state: "visited" },
        { id: "C", label: "C", x: 250, y: 150, state: "visited" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "A", to: "C", isTraversed: true },
        { from: "B", to: "C", isTraversed: false },
      ],
    },
  },
  {
    narrative:
      "Dequeue Operation: on each iteration, pop the front node u from the queue and inspect all outgoing edges (u, v).",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "B", label: "B (dequeued)", x: 200, y: 50, state: "active" },
        { id: "D", label: "D", x: 350, y: 50, state: "default" },
      ],
      edges: [{ from: "B", to: "D", isTraversed: false }],
    },
  },
  {
    narrative:
      "Neighbor Discovery & Queueing: when an unvisited neighbor v is discovered, mark v visited immediately and push v into the queue.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "B", label: "B", x: 200, y: 50, state: "active" },
        { id: "D", label: "D (queued)", x: 350, y: 50, state: "pivot" },
      ],
      edges: [{ from: "B", to: "D", isTraversed: true }],
    },
  },
  {
    narrative:
      "Traversal Completion: the search terminates when the FIFO queue becomes empty, guaranteeing all reachable vertices have been explored.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A", x: 100, y: 100, state: "sorted" },
        { id: "B", label: "B", x: 200, y: 50, state: "sorted" },
        { id: "C", label: "C", x: 200, y: 150, state: "sorted" },
        { id: "D", label: "D", x: 350, y: 50, state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "A", to: "C", isTraversed: true },
        { from: "B", to: "D", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Time & Space Bounds: BFS visits each vertex once and traverses each edge once, delivering optimal O(V + E) time and O(V) space complexity.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "A", label: "A", x: 100, y: 100, state: "sorted" },
        { id: "B", label: "B", x: 200, y: 50, state: "sorted" },
        { id: "C", label: "C", x: 200, y: 150, state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "A", to: "C", isTraversed: true },
      ],
    },
  },
];

export const generateBFSGraphSteps = (input: BFSGraphInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) && input.nodes.length > 0
    ? input.nodes
    : DEFAULT_BFS_INPUT.nodes;
  const rawEdges = Array.isArray(input?.edges) ? input.edges : DEFAULT_BFS_INPUT.edges;
  const startId =
    typeof input?.startNodeId === "string" ? input.startNodeId : DEFAULT_BFS_INPUT.startNodeId;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.startNodeId === DEFAULT_BFS_INPUT.startNodeId &&
      Array.isArray(input.nodes) &&
      input.nodes.length === DEFAULT_BFS_INPUT.nodes.length);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const nodeStates = new Map<string, ElementState>();
  const traversedEdgeKeys = new Set<string>();
  const visitedSet = new Set<string>();
  const queue: string[] = [];

  rawNodes.forEach((n) => nodeStates.set(n.id, "default"));

  const makeSnapshot = (
    activeId?: string,
    evalNeighborId?: string,
    isComplete?: boolean,
  ): PrimaryVisualSnapshot => {
    const nodes: GraphNodeItem[] = rawNodes.map((n) => {
      let state: ElementState = nodeStates.get(n.id) ?? "default";
      if (isComplete) {
        state = visitedSet.has(n.id) ? "sorted" : "default";
      } else if (n.id === activeId) {
        state = "active";
      } else if (n.id === evalNeighborId) {
        state = "compare";
      } else if (queue.includes(n.id) && state !== "visited" && state !== "sorted") {
        state = "pivot";
      }
      return {
        ...n,
        state,
      };
    });

    const edges: GraphEdgeItem[] = rawEdges.map((e) => {
      const key1 = `${e.from}->${e.to}`;
      const key2 = `${e.to}->${e.from}`;
      const isTraversed = traversedEdgeKeys.has(key1) || traversedEdgeKeys.has(key2);
      return {
        ...e,
        isTraversed,
      };
    });

    return {
      kind: "graph",
      nodes,
      edges,
    };
  };

  const startNodeExists = rawNodes.some((n) => n.id === startId);

  addStep(
    `Having established the mental model, let's now transition to BFS traversal starting from node '${startId}'.`,
    makeSnapshot(startId),
  );

  if (!startNodeExists) {
    addStep(
      `Start node '${startId}' is not found in the graph: terminating BFS traversal immediately.`,
      makeSnapshot(undefined, undefined, true),
    );
    return steps;
  }

  visitedSet.add(startId);
  queue.push(startId);
  nodeStates.set(startId, "pivot");

  addStep(
    `Marked start node '${startId}' visited and enqueued into FIFO queue.`,
    makeSnapshot(undefined),
  );

  const getNeighbors = (nodeId: string): string[] => {
    const neighbors: string[] = [];
    for (const edge of rawEdges) {
      if (edge.from === nodeId) neighbors.push(edge.to);
      else if (edge.to === nodeId) neighbors.push(edge.from);
    }
    return neighbors;
  };

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    nodeStates.set(currentId, "active");

    addStep(
      `Dequeued node '${currentId}': expanding layer neighbors from current active vertex.`,
      makeSnapshot(currentId),
    );

    const neighbors = getNeighbors(currentId);

    for (const neighborId of neighbors) {
      const key = `${currentId}->${neighborId}`;
      traversedEdgeKeys.add(key);

      if (!visitedSet.has(neighborId)) {
        visitedSet.add(neighborId);
        queue.push(neighborId);
        nodeStates.set(neighborId, "pivot");

        addStep(
          `Discovered unvisited neighbor '${neighborId}' from node '${currentId}': marked visited and enqueued to FIFO queue.`,
          makeSnapshot(currentId, neighborId),
        );
      } else {
        addStep(
          `Neighbor '${neighborId}' from node '${currentId}' is ALREADY visited: skipping redundant queue insertion.`,
          makeSnapshot(currentId, neighborId),
        );
      }
    }

    nodeStates.set(currentId, "visited");

    addStep(
      `Finished expanding all neighbors for node '${currentId}': marked node completed.`,
      makeSnapshot(undefined),
    );
  }

  addStep(
    `BFS Graph Traversal complete! Visited all ${visitedSet.size} reachable node(s) in layer-by-layer order.`,
    makeSnapshot(undefined, undefined, true),
  );

  return steps;
};

export default generateBFSGraphSteps;
