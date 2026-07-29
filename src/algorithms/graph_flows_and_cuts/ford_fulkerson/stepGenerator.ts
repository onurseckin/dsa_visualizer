import type {
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import type { FordFulkersonInput } from "./types";
import { DEFAULT_NODE_POSITIONS } from "./types";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Maximum Flow problem seeks to route the maximum possible throughput from a source vertex S to a sink vertex T through a directed graph with capacity limits.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (Source)", state: "active" },
        { id: "A", label: "A", state: "default" },
        { id: "B", label: "B", state: "default" },
        { id: "T", label: "T (Sink)", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 10 },
        { from: "S", to: "B", weight: 10 },
        { from: "A", to: "T", weight: 10 },
        { from: "B", to: "T", weight: 10 },
      ],
    },
  },
  {
    narrative:
      "The Bottleneck Constraint specifies that the flow pushed along any simple path from S to T is strictly limited by the edge with the smallest remaining capacity.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S", state: "visited" },
        { id: "A", label: "A (Bottleneck)", state: "swap" },
        { id: "T", label: "T", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 10, isTraversed: true },
        { from: "A", to: "T", weight: 4, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "The Residual Graph G_f tracks unused capacity c(u,v) - f(u,v) on forward edges and flow cancellation capacity f(u,v) on reverse edges.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S", state: "visited" },
        { id: "A", label: "A", state: "visited" },
        { id: "T", label: "T", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 6, isPath: true },
        { from: "A", to: "T", weight: 0, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "An Augmenting Path is any simple directed path from S to T in the residual graph G_f along which every edge has positive residual capacity.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S", state: "visited" },
        { id: "A", label: "Path A", state: "active" },
        { id: "B", label: "Path B", state: "active" },
        { id: "T", label: "T", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 10, isTraversed: true },
        { from: "A", to: "B", weight: 5, isTraversed: true },
        { from: "B", to: "T", weight: 8, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Augmenting a path pushes bottleneck flow delta along forward edges and adds delta to reverse edge capacities, enabling future flow redirection.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S", state: "visited" },
        { id: "A", label: "A (+5)", state: "swap" },
        { id: "B", label: "B (+5)", state: "swap" },
        { id: "T", label: "T", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 5, isPath: true },
        { from: "A", to: "B", weight: 0, isPath: true },
        { from: "B", to: "T", weight: 3, isPath: true },
      ],
    },
  },
  {
    narrative:
      "Reverse residual edges allow Ford-Fulkerson to dynamically cancel previously sent flow if a superior routing path becomes available later.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S", state: "visited" },
        { id: "A", label: "A", state: "active" },
        { id: "B", label: "B", state: "active" },
        { id: "T", label: "T", state: "visited" },
      ],
      edges: [
        { from: "S", to: "B", weight: 5, isTraversed: true },
        { from: "B", to: "A", weight: 5, isTraversed: true },
        { from: "A", to: "T", weight: 5, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "According to the Max-Flow Min-Cut Theorem, the maximum throughput from S to T equals the total capacity sum of the bottleneck cut separating S and T.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "Cut S", state: "visited" },
        { id: "A", label: "Cut S", state: "visited" },
        { id: "B", label: "Cut T", state: "compare" },
        { id: "T", label: "Cut T", state: "compare" },
      ],
      edges: [
        { from: "S", to: "A", weight: 0, isPath: true },
        { from: "A", to: "B", weight: 0, isPath: true },
        { from: "B", to: "T", weight: 0, isPath: true },
      ],
    },
  },
  {
    narrative:
      "The algorithm terminates when DFS finds no remaining augmenting path from S to T with positive residual capacity.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (No Path)", state: "default" },
        { id: "A", label: "A", state: "default" },
        { id: "B", label: "B", state: "default" },
        { id: "T", label: "T", state: "default" },
      ],
      edges: [
        { from: "S", to: "A", weight: 0 },
        { from: "S", to: "B", weight: 0 },
        { from: "A", to: "T", weight: 0 },
        { from: "B", to: "T", weight: 0 },
      ],
    },
  },
  {
    narrative:
      "With integer capacities, Ford-Fulkerson runs in O(E * max_flow) time and uses O(V + E) memory to maintain residual graph structures.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "Max Flow: 20", state: "sorted" },
        { id: "A", label: "A", state: "sorted" },
        { id: "B", label: "B", state: "sorted" },
        { id: "T", label: "T", state: "sorted" },
      ],
      edges: [
        { from: "S", to: "A", weight: 0, isPath: true },
        { from: "S", to: "B", weight: 0, isPath: true },
        { from: "A", to: "T", weight: 0, isPath: true },
        { from: "B", to: "T", weight: 0, isPath: true },
      ],
    },
  },
];

export const generateFordFulkersonSteps = (input: FordFulkersonInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];
  const source = input?.source || (rawNodes[0] ?? "");
  const sink = input?.sink || (rawNodes[rawNodes.length - 1] ?? "");

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  if (rawNodes.length === 0 || !source || !sink) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "Network contains no nodes or valid source/sink, returning max flow 0.",
        primarySnapshot: { kind: "graph", directed: true, nodes: [], edges: [] },
        variables: { completed: true, maxFlow: 0 },
      }),
    );
    return steps;
  }

  const capMap: Record<string, number> = {};
  const flowMap: Record<string, number> = {};
  const aggregatedEdges: FordFulkersonInput["edges"] = [];
  const aggregatedEdgeIndex = new Map<string, number>();

  rawEdges.forEach((e) => {
    const key = `${e.from}->${e.to}`;
    capMap[key] = (capMap[key] ?? 0) + e.capacity;
    const index = aggregatedEdgeIndex.get(key);
    if (index === undefined) {
      aggregatedEdgeIndex.set(key, aggregatedEdges.length);
      aggregatedEdges.push({ ...e });
    } else {
      const current = aggregatedEdges[index];
      if (current) current.capacity += e.capacity;
    }
  });
  aggregatedEdges.forEach((e) => {
    const reverseKey = `${e.to}->${e.from}`;
    capMap[reverseKey] ??= 0;
  });
  Object.keys(capMap).forEach((key) => {
    flowMap[key] = 0;
  });

  const getResidualCapacity = (u: string, v: string): number => {
    const key = `${u}->${v}`;
    return (capMap[key] ?? 0) - (flowMap[key] ?? 0);
  };

  const getGraphNodes = (
    activeNodeId?: string,
    pathNodeSet?: Set<string>,
    visitedNodeSet?: Set<string>,
    nodeStateOverride?: "active" | "swap" | "compare" | "visited" | "default",
  ): GraphNodeItem[] =>
    rawNodes.map((id, index) => {
      let label = id;
      if (id === source) label = `${id} (S)`;
      if (id === sink) label = `${id} (T)`;

      let state: GraphNodeItem["state"] = nodeStateOverride ?? "default";
      if (!nodeStateOverride) {
        if (id === activeNodeId) {
          state = "active";
        } else if (pathNodeSet && pathNodeSet.has(id)) {
          state = "path";
        } else if (visitedNodeSet && visitedNodeSet.has(id)) {
          state = "visited";
        }
      }

      const pos = DEFAULT_NODE_POSITIONS[id] || {
        x: Math.round(260 + 150 * Math.cos((2 * Math.PI * index) / Math.max(rawNodes.length, 1))),
        y: Math.round(190 + 120 * Math.sin((2 * Math.PI * index) / Math.max(rawNodes.length, 1))),
      };

      return {
        id,
        label,
        state,
        x: pos.x,
        y: pos.y,
      };
    });

  const getGraphEdges = (
    activePathEdges?: Array<{ from: string; to: string }>,
  ): GraphEdgeItem[] => {
    const pathEdgeSet = new Set((activePathEdges || []).map((e) => `${e.from}->${e.to}`));

    return aggregatedEdges.map((e) => {
      const key = `${e.from}->${e.to}`;
      const f = flowMap[key] || 0;
      const c = capMap[key] ?? 0;
      const res = c - f;
      const isPath = pathEdgeSet.has(key);

      return {
        from: e.from,
        to: e.to,
        weight: res,
        isTraversed: isPath,
        isPath,
      };
    });
  };

  let currentMaxFlow = 0;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initialized flow network from source '${source}' to sink '${sink}' with 0 initial flow on all edges.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: getGraphNodes(source, undefined, undefined, "active"),
        edges: getGraphEdges(),
      },
      auxiliaryState: {
        visited: [],
      },
      variables: { source, sink, currentMaxFlow: 0 },
    }),
  );

  let searching = true;
  while (searching) {
    const visited = new Set<string>();
    const path: string[] = [];

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Starting fresh DFS search from source '${source}' to locate residual augmenting path to sink '${sink}'.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: getGraphNodes(source, undefined, undefined, "compare"),
          edges: getGraphEdges(),
        },
        auxiliaryState: {
          visited: [],
        },
        variables: { currentMaxFlow },
      }),
    );

    const findAugmentingPath = (
      u: string,
      target: string,
      currentFlow: number,
    ): { bottleneck: number; pathNodes: string[] } | null => {
      path.push(u);
      visited.add(u);

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `DFS visited node '${u}' (current path bottleneck = ${currentFlow === Infinity ? "∞" : currentFlow}).`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: getGraphNodes(u, new Set(path), visited),
            edges: getGraphEdges(),
          },
          auxiliaryState: {
            visited: Array.from(visited),
          },
          variables: { currentNode: u, bottleneck: currentFlow === Infinity ? "∞" : currentFlow },
        }),
      );

      if (u === target) {
        return { bottleneck: currentFlow, pathNodes: [...path] };
      }

      for (const node of rawNodes) {
        if (!visited.has(node)) {
          const resCap = getResidualCapacity(u, node);
          if (resCap > 0) {
            const result = findAugmentingPath(node, target, Math.min(currentFlow, resCap));
            if (result) return result;
          }
        }
      }

      path.pop();
      return null;
    };

    const pathResult = findAugmentingPath(source, sink, Infinity);

    if (!pathResult || pathResult.bottleneck === 0) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `No further augmenting path exists from '${source}' to '${sink}' in the residual graph. Maximum Flow is finalized at ${currentMaxFlow}.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: getGraphNodes(undefined, undefined, visited, "visited"),
            edges: getGraphEdges(),
          },
          auxiliaryState: {
            visited: Array.from(visited),
          },
          variables: { maxFlow: currentMaxFlow, completed: true },
        }),
      );
      searching = false;
      break;
    }

    const { bottleneck, pathNodes } = pathResult;
    const pathNodeSet = new Set(pathNodes);
    const pathEdges: Array<{ from: string; to: string }> = [];

    for (let i = 0; i < pathNodes.length - 1; i++) {
      pathEdges.push({ from: pathNodes[i], to: pathNodes[i + 1] });
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Found augmenting path [${pathNodes.join(" -> ")}] with bottleneck capacity ${bottleneck}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: getGraphNodes(
            pathResult.pathNodes[pathResult.pathNodes.length - 1],
            pathNodeSet,
            visited,
            "swap",
          ),
          edges: getGraphEdges(pathEdges),
        },
        auxiliaryState: {
          visited: Array.from(visited),
        },
        variables: { bottleneck, path: pathNodes.join(" -> "), currentMaxFlow },
      }),
    );

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const u = pathNodes[i];
      const v = pathNodes[i + 1];
      const forwardKey = `${u}->${v}`;
      const revKey = `${v}->${u}`;

      flowMap[forwardKey] = (flowMap[forwardKey] ?? 0) + bottleneck;
      flowMap[revKey] = (flowMap[revKey] ?? 0) - bottleneck;
    }

    currentMaxFlow += bottleneck;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Augmented flow by ${bottleneck} along path [${pathNodes.join(" -> ")}]. Total max flow is now ${currentMaxFlow}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: getGraphNodes(undefined, pathNodeSet, undefined, "visited"),
          edges: getGraphEdges(pathEdges),
        },
        auxiliaryState: {
          visited: Array.from(visited),
        },
        variables: { bottleneck, currentMaxFlow },
      }),
    );
  }

  return steps;
};
