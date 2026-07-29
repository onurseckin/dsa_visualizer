import type {
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import type { BellmanFordInput } from "./definition";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Single-Source Shortest Path (SSSP) problem calculates the minimum path cost from a source node to all reachable nodes in a weighted directed graph.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (0)", state: "active" },
        { id: "A", label: "A (∞)", state: "default" },
        { id: "B", label: "B (∞)", state: "default" },
        { id: "C", label: "C (∞)", state: "default" },
      ],
      edges: [
        { from: "S", to: "A", weight: 4 },
        { from: "S", to: "B", weight: 2 },
        { from: "B", to: "A", weight: 1 },
        { from: "A", to: "C", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "Greedy algorithms like Dijkstra's algorithm assume non-negative edge weights to permanently finalize node distances, but fail when graphs contain negative edge weights.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (0)", state: "visited" },
        { id: "A", label: "A (4)", state: "active" },
        { id: "B", label: "B (2)", state: "default" },
        { id: "C", label: "C (∞)", state: "default" },
      ],
      edges: [
        { from: "S", to: "A", weight: 4, isTraversed: true },
        { from: "S", to: "B", weight: 2 },
        { from: "B", to: "A", weight: -3 },
        { from: "A", to: "C", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "Bellman-Ford avoids greedy finalization by using edge relaxation: for edge u -> v with weight w, if dist[u] + w < dist[v], dist[v] is updated to dist[u] + w.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (0)", state: "visited" },
        { id: "A", label: "A (-1)", state: "visited" },
        { id: "B", label: "B (2)", state: "active" },
        { id: "C", label: "C (∞)", state: "default" },
      ],
      edges: [
        { from: "S", to: "A", weight: 4 },
        { from: "S", to: "B", weight: 2, isTraversed: true },
        { from: "B", to: "A", weight: -3, isTraversed: true },
        { from: "A", to: "C", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "Instead of deciding which node to process next, Bellman-Ford performs complete sweeps, relaxing every single edge in the graph during each pass.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (0)", state: "visited" },
        { id: "A", label: "A (-1)", state: "visited" },
        { id: "B", label: "B (2)", state: "visited" },
        { id: "C", label: "C (2)", state: "active" },
      ],
      edges: [
        { from: "S", to: "A", weight: 4 },
        { from: "S", to: "B", weight: 2 },
        { from: "B", to: "A", weight: -3 },
        { from: "A", to: "C", weight: 3, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "After k full passes over all edges, Bellman-Ford guarantees that shortest paths requiring at most k edges are correctly computed.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (0)", state: "visited" },
        { id: "A", label: "A (-1)", state: "visited" },
        { id: "B", label: "B (2)", state: "visited" },
        { id: "C", label: "C (2)", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 4 },
        { from: "S", to: "B", weight: 2, isPath: true },
        { from: "B", to: "A", weight: -3, isPath: true },
        { from: "A", to: "C", weight: 3, isPath: true },
      ],
    },
  },
  {
    narrative:
      "In any simple graph with |V| vertices, a shortest path without cycles contains at most |V| - 1 edges, so |V| - 1 passes are sufficient.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (Pass 1)", state: "visited" },
        { id: "A", label: "A (Pass 2)", state: "visited" },
        { id: "B", label: "B (Pass 2)", state: "visited" },
        { id: "C", label: "C (Pass 3)", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 4 },
        { from: "S", to: "B", weight: 2 },
        { from: "B", to: "A", weight: -3 },
        { from: "A", to: "C", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "If a complete pass over all edges produces no distance updates, distances have converged early, allowing the algorithm to terminate before |V| - 1 passes.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "S", label: "S (Stable)", state: "visited" },
        { id: "A", label: "A (Stable)", state: "visited" },
        { id: "B", label: "B (Stable)", state: "visited" },
        { id: "C", label: "C (Stable)", state: "visited" },
      ],
      edges: [
        { from: "S", to: "A", weight: 4 },
        { from: "S", to: "B", weight: 2 },
        { from: "B", to: "A", weight: -3 },
        { from: "A", to: "C", weight: 3 },
      ],
    },
  },
  {
    narrative:
      "A negative-weight cycle is a cycle whose total weight is strictly less than 0, allowing path costs to decrease infinitely by cycling continuously.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Cycle)", state: "active" },
        { id: "B", label: "B (Cycle)", state: "active" },
      ],
      edges: [
        { from: "A", to: "B", weight: -5, isTraversed: true },
        { from: "B", to: "A", weight: 2, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Running one extra |V|-th validation pass checks for negative cycles: if any edge can still be relaxed, a negative cycle exists and shortest paths are undefined.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (-3)", state: "swap" },
        { id: "B", label: "B (-8)", state: "swap" },
      ],
      edges: [
        { from: "A", to: "B", weight: -5, isPath: true },
        { from: "B", to: "A", weight: 2, isPath: true },
      ],
    },
  },
];

export const generateBellmanFordSteps = (input: BellmanFordInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];
  const startNode = typeof input?.startNode === "string" ? input.startNode : (rawNodes[0] ?? "S");

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
  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  if (startNode && dist[startNode] !== undefined) {
    dist[startNode] = 0;
  }

  const getGraphNodes = (
    activeNodeId?: string,
    highlightState: "active" | "visited" | "swap" | "compare" | "default" = "active",
    allStateOverride?: "active" | "visited" | "default",
  ): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === undefined || dist[id] === Infinity ? "∞" : dist[id]})`,
      state: allStateOverride
        ? allStateOverride
        : id === activeNodeId
          ? highlightState
          : dist[id] !== undefined && dist[id] !== Infinity
            ? "visited"
            : "default",
    }));

  const getGraphEdges = (activeEdge?: { from: string; to: string }): GraphEdgeItem[] =>
    rawEdges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight,
      isTraversed: activeEdge?.from === e.from && activeEdge?.to === e.to,
      isPath:
        dist[e.to] !== undefined &&
        dist[e.to] !== Infinity &&
        dist[e.from] !== undefined &&
        dist[e.from] !== Infinity &&
        dist[e.from] + e.weight === dist[e.to],
    }));

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize the distance table with start node '${startNode}' at distance 0 and all other ${rawNodes.length - 1} vertices at distance ∞.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: getGraphNodes(startNode, "active"),
        edges: getGraphEdges(),
      },
      auxiliaryState: {
        distanceTable: { ...dist },
      },
      variables: { startNode, "dist[startNode]": 0 },
    }),
  );

  const numPasses = Math.max(0, rawNodes.length - 1);

  for (let pass = 0; pass < numPasses; pass++) {
    let anyRelaxedInPass = false;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Beginning relaxation pass ${pass + 1} of ${numPasses}. We will inspect all ${rawEdges.length} edges to find shorter paths reachable within ${pass + 1} hops.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: getGraphNodes(undefined, "default"),
          edges: getGraphEdges(),
        },
        auxiliaryState: {
          distanceTable: { ...dist },
        },
        variables: { pass: pass + 1, totalPasses: numPasses },
      }),
    );

    for (const edge of rawEdges) {
      const u = edge.from;
      const v = edge.to;
      const weight = edge.weight;

      const uDist = dist[u];
      const vDist = dist[v];
      const isUReachable = uDist !== undefined && uDist !== Infinity;
      const canRelax = isUReachable && uDist + weight < vDist;

      if (canRelax) {
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Inspecting edge ${u} -> ${v} with weight ${weight}: source ${u} has distance ${uDist}, offering a shorter path ${uDist} + (${weight}) = ${uDist + weight} to vertex ${v} (currently ${vDist === Infinity ? "∞" : vDist}).`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: getGraphNodes(u, "compare"),
              edges: getGraphEdges({ from: u, to: v }),
            },
            auxiliaryState: {
              distanceTable: { ...dist },
            },
            variables: {
              pass: pass + 1,
              edge: `${u}->${v}`,
              candidate: uDist + weight,
              current: vDist === Infinity ? "∞" : vDist,
            },
          }),
        );

        dist[v] = uDist + weight;
        anyRelaxedInPass = true;

        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Relaxation succeeds on edge ${u} -> ${v}: updating dist[${v}] to ${dist[v]}.`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: getGraphNodes(v, "swap"),
              edges: getGraphEdges({ from: u, to: v }),
            },
            auxiliaryState: {
              distanceTable: { ...dist },
            },
            variables: { pass: pass + 1, node: v, newDist: dist[v] },
          }),
        );
      } else {
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: !isUReachable
              ? `Inspecting edge ${u} -> ${v} with weight ${weight}: source vertex ${u} is unreachable (∞), so no path can be relaxed through this edge.`
              : `Inspecting edge ${u} -> ${v} with weight ${weight}: proposed cost ${uDist} + (${weight}) = ${uDist + weight} is not shorter than current dist[${v}] (${vDist}). No update made.`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: getGraphNodes(u, "active"),
              edges: getGraphEdges({ from: u, to: v }),
            },
            auxiliaryState: {
              distanceTable: { ...dist },
            },
            variables: { pass: pass + 1, edge: `${u}->${v}`, status: "skipped" },
          }),
        );
      }
    }

    if (!anyRelaxedInPass) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Pass ${pass + 1} completed with zero distance updates. All shortest path distances have fully converged, so we terminate relaxation early.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: getGraphNodes(undefined, "visited"),
            edges: getGraphEdges(),
          },
          auxiliaryState: {
            distanceTable: { ...dist },
          },
          variables: { convergedEarly: true, pass: pass + 1 },
        }),
      );
      break;
    }
  }

  let hasNegativeCycle = false;
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "All relaxation passes are complete. Now performing the final validation pass over all edges to check for reachable negative-weight cycles.",
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: getGraphNodes(undefined, "active", "active"),
        edges: getGraphEdges(),
      },
      auxiliaryState: {
        distanceTable: { ...dist },
      },
      variables: { checkingCycles: true },
    }),
  );

  for (const edge of rawEdges) {
    const u = edge.from;
    const v = edge.to;
    const weight = edge.weight;

    const uDist = dist[u];
    const vDist = dist[v];
    const canRelax = uDist !== undefined && uDist !== Infinity && uDist + weight < vDist;

    if (canRelax) {
      hasNegativeCycle = true;
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Validation pass detected relaxation on edge ${u} -> ${v}: ${uDist} + (${weight}) = ${uDist + weight} < dist[${v}] (${vDist}). A reachable negative-weight cycle exists!`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: getGraphNodes(v, "swap"),
            edges: getGraphEdges({ from: u, to: v }),
          },
          auxiliaryState: {
            distanceTable: { ...dist },
          },
          variables: { negativeCycleDetected: true, edge: `${u}->${v}` },
        }),
      );
      break;
    }
  }

  if (!hasNegativeCycle) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Bellman-Ford traversal complete. No negative cycles were found, and final shortest distances from start node '${startNode}' have been computed for all vertices.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: getGraphNodes(undefined, "visited", "visited"),
          edges: getGraphEdges(),
        },
        auxiliaryState: {
          distanceTable: { ...dist },
        },
        variables: { completed: true, negativeCycleDetected: false },
      }),
    );
  } else {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative:
          "Bellman-Ford complete: a reachable negative-weight cycle was detected, making single-source shortest path distances undefined.",
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: getGraphNodes(undefined, "active", "default"),
          edges: getGraphEdges(),
        },
        auxiliaryState: {
          distanceTable: { ...dist },
        },
        variables: { completed: true, negativeCycleDetected: true },
      }),
    );
  }

  return steps;
};
