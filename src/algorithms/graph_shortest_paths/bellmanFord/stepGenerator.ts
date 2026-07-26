import type { AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import type { BellmanFordInput } from "./definition";

export const generateBellmanFordSteps = (input: BellmanFordInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = input.nodes || [];
  const rawEdges = input.edges || [];
  const startNode = input.startNode || (rawNodes[0] ?? "");

  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  if (startNode && dist[startNode] !== undefined) {
    dist[startNode] = 0;
  }

  const getGraphNodes = (activeNodeId?: string): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === Infinity ? "∞" : dist[id]})`,
      state: id === activeNodeId ? "active" : dist[id] !== Infinity ? "visited" : "default",
    }));

  const getGraphEdges = (activeEdge?: { from: string; to: string }): GraphEdgeItem[] =>
    rawEdges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight,
      isTraversed: activeEdge?.from === e.from && activeEdge?.to === e.to,
      isPath:
        dist[e.to] !== Infinity &&
        dist[e.from] !== Infinity &&
        dist[e.from] + e.weight === dist[e.to],
    }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNodeId?: string,
    activeEdge?: { from: string; to: string },
  ) => {
    const distTableFormatted: Record<string, number> = {};
    for (const n of rawNodes) {
      distTableFormatted[n] = dist[n];
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes: getGraphNodes(activeNodeId),
        edges: getGraphEdges(activeEdge),
      },
      auxiliaryState: {
        distanceTable: distTableFormatted,
        visited: rawNodes.filter((n) => dist[n] !== Infinity),
        customState: {
          "Start Node": startNode,
          "Node Count": rawNodes.length,
          "Edge Count": rawEdges.length,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Start Bellman-Ford",
    `Our plan is to sweep over every edge up to ${Math.max(0, rawNodes.length - 1)} times, because a shortest path in a graph with ${rawNodes.length} vertices can use at most ${Math.max(0, rawNodes.length - 1)} edges. Each sweep lets improvements travel one edge further from the source.`,
    { nodeCount: rawNodes.length, edgeCount: rawEdges.length },
  );

  if (rawNodes.length === 0) {
    addStep(
      18,
      "Bellman-Ford complete",
      "The graph has no vertices, so there is nothing to relax — we return an empty distance table.",
      { completed: true },
    );
    return steps;
  }

  addStep(
    3,
    `Set dist['${startNode}'] to 0`,
    `We know exactly one distance so far: '${startNode}' is 0 away from itself. Every other node starts at ∞, which is our way of saying "no path found yet."`,
    { startNode, "dist[startNode]": 0 },
    startNode,
  );

  const numPasses = Math.max(0, rawNodes.length - 1);

  for (let pass = 0; pass < numPasses; pass++) {
    let anyRelaxedInPass = false;
    addStep(
      6,
      `Start relaxation pass ${pass + 1} of ${numPasses}`,
      `Each sweep lets shortest-path information travel one more edge outward from the source. After pass ${pass + 1}, every vertex whose best path uses at most ${pass + 1} edges will have its true distance.`,
      { pass: pass + 1, numPasses },
    );

    for (const edge of rawEdges) {
      const u = edge.from;
      const v = edge.to;
      const weight = edge.weight;

      if (dist[u] !== Infinity && dist[u] + weight < dist[v]) {
        const oldDist = dist[v];
        dist[v] = dist[u] + weight;
        anyRelaxedInPass = true;

        addStep(
          9,
          `Relax edge ${u} → ${v}`,
          `Going through '${u}' reaches '${v}' at cost ${dist[v] - weight} + ${weight} = ${dist[v]}, which beats the previous ${oldDist === Infinity ? "∞" : oldDist}. We take the cheaper route and keep sweeping.`,
          { pass: pass + 1, u, v, weight, newDist: dist[v] },
          v,
          { from: u, to: v },
        );
      } else {
        addStep(
          8,
          `Skip edge ${u} → ${v}`,
          dist[u] === Infinity
            ? `We haven't found any path to '${u}' yet — its distance is still ∞ — so this edge can't offer '${v}' a real route this pass.`
            : `The best known route to '${v}' (${dist[v]}) is already at least as good as going through '${u}' (${dist[u]} + ${weight} = ${dist[u] + weight}), so we leave it alone.`,
          { pass: pass + 1, u, v, weight },
          u,
          { from: u, to: v },
        );
      }
    }

    if (!anyRelaxedInPass) {
      addStep(
        6,
        `Stop early after pass ${pass + 1}`,
        "An entire sweep changed nothing, so every distance has already settled. Running the remaining passes would only re-confirm what we know.",
        { convergedEarly: true, pass: pass + 1 },
      );
      break;
    }
  }

  let hasNegativeCycle = false;
  addStep(
    12,
    "Check for negative-weight cycles",
    "After V - 1 passes every true shortest path is settled, so we do one more sweep as a test. If any edge can still improve a distance, the only possible explanation is a cycle with negative total weight.",
    { checkingNegativeCycles: true },
  );

  for (const edge of rawEdges) {
    const u = edge.from;
    const v = edge.to;
    const weight = edge.weight;

    if (dist[u] !== Infinity && dist[u] + weight < dist[v]) {
      hasNegativeCycle = true;
      addStep(
        15,
        `Find a negative cycle at ${u} → ${v}`,
        `Even after all passes, '${v}' can still get cheaper (${dist[u]} + ${weight} < ${dist[v]}). Distances that keep shrinking mean a negative-weight cycle is reachable from '${startNode}'.`,
        { u, v, weight, hasNegativeCycle: true },
        v,
        { from: u, to: v },
      );
      break;
    }
  }

  if (!hasNegativeCycle) {
    addStep(
      18,
      "Bellman-Ford complete",
      `No edge can improve any distance, so the table now holds the true shortest path from '${startNode}' to every reachable vertex. In the end we did up to V - 1 sweeps over all E edges — that's the O(V * E) bound.`,
      { hasNegativeCycle: false, completed: true },
    );
  } else {
    addStep(
      18,
      "Bellman-Ford complete: negative cycle found",
      'Because a reachable cycle has negative total weight, "shortest path" stops being well-defined — we could loop around that cycle forever, driving the cost down without bound.',
      { hasNegativeCycle: true, completed: true },
    );
  }

  return steps;
};
