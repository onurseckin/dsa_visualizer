import type { AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import type { BellmanFordInput } from "./definition";

export const generateBellmanFordSteps = (input: BellmanFordInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];
  const startNode = typeof input?.startNode === "string" ? input.startNode : (rawNodes[0] ?? "S");

  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  if (startNode && dist[startNode] !== undefined) {
    dist[startNode] = 0;
  }

  const getGraphNodes = (activeNodeId?: string): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === undefined || dist[id] === Infinity ? "∞" : dist[id]})`,
      state:
        id === activeNodeId
          ? "active"
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

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNodeId?: string,
    activeEdge?: { from: string; to: string },
    extraCustomState?: Record<string, string | number | boolean>,
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
        visited: rawNodes.filter((n) => dist[n] !== undefined && dist[n] !== Infinity),
        customState: {
          "Start Node": startNode,
          "Node Count": rawNodes.length,
          "Edge Count": rawEdges.length,
          ...extraCustomState,
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
    2,
    `Initialize all distances to infinity`,
    `We create a distance table where every node starts at ∞ (unreachable). This is our starting state before any relaxation — only the source will break out of infinity.`,
    { nodeCount: rawNodes.length },
  );

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
      5,
      `Start relaxation pass ${pass + 1} of ${numPasses}`,
      `Each sweep lets shortest-path information travel one more edge outward from the source. After pass ${pass + 1}, every vertex whose best path uses at most ${pass + 1} edges will have its true distance.`,
      { pass: pass + 1, numPasses },
    );

    for (const edge of rawEdges) {
      const u = edge.from;
      const v = edge.to;
      const weight = edge.weight;

      addStep(
        6,
        `Examine edge ${u} → ${v} (weight ${weight})`,
        `In pass ${pass + 1}, we inspect edge ${u} → ${v} to test if routing through '${u}' improves the shortest path to '${v}'.`,
        { pass: pass + 1, u, v, weight },
        u,
        { from: u, to: v },
      );

      const uDist = dist[u];
      const vDist = dist[v];
      const isUReachable = uDist !== undefined && uDist !== Infinity;
      const canRelax = isUReachable && uDist + weight < vDist;

      if (canRelax) {
        addStep(
          7,
          `Condition met: dist[${u}] + ${weight} < dist[${v}]`,
          `Node '${u}' is reachable (${uDist}) and ${uDist} + ${weight} = ${uDist + weight} is strictly less than current dist['${v}'] (${vDist === Infinity ? "∞" : vDist}). Relaxation condition is true!`,
          {
            pass: pass + 1,
            u,
            v,
            weight,
            candidateDist: uDist + weight,
            currentDist: vDist === Infinity ? "∞" : vDist,
          },
          u,
          { from: u, to: v },
        );

        const oldDist = dist[v];
        dist[v] = uDist + weight;
        anyRelaxedInPass = true;

        addStep(
          8,
          `Relax edge ${u} → ${v}: update dist[${v}] = ${dist[v]}`,
          `Going through '${u}' reaches '${v}' at cost ${uDist} + ${weight} = ${dist[v]}, beating the previous ${oldDist === Infinity ? "∞" : oldDist}. We update dist['${v}'] to ${dist[v]}.`,
          { pass: pass + 1, u, v, weight, newDist: dist[v] },
          v,
          { from: u, to: v },
        );
      } else {
        addStep(
          7,
          `Skip edge ${u} → ${v}`,
          !isUReachable
            ? `Node '${u}' is unreachable (dist['${u}'] = ∞), so this edge cannot offer '${v}' a valid path in this pass.`
            : `The route through '${u}' (${uDist} + ${weight} = ${uDist + weight}) is not shorter than current dist['${v}'] (${vDist}). No update made.`,
          {
            pass: pass + 1,
            u,
            v,
            weight,
            uDist: uDist === Infinity ? "∞" : uDist,
            vDist: vDist === Infinity ? "∞" : vDist,
          },
          u,
          { from: u, to: v },
        );
      }
    }

    if (!anyRelaxedInPass) {
      addStep(
        5,
        `Stop early after pass ${pass + 1}`,
        "An entire sweep changed nothing, so every distance has already settled. Running remaining passes would produce no further changes.",
        { convergedEarly: true, pass: pass + 1 },
      );
      break;
    }
  }

  let hasNegativeCycle = false;
  addStep(
    10,
    `Initialize negative-cycle flag to False`,
    `We set up a flag before the extra validation sweep. If any edge can still improve a distance after V-1 passes, this flag will be set to True.`,
    { hasNegativeCycle: false },
  );
  addStep(
    11,
    "Check for negative-weight cycles",
    "After V - 1 passes every true shortest path is settled, so we do one more sweep as a test. If any edge can still improve a distance, the only possible explanation is a cycle with negative total weight.",
    { checkingNegativeCycles: true },
  );

  for (const edge of rawEdges) {
    const u = edge.from;
    const v = edge.to;
    const weight = edge.weight;

    addStep(
      11,
      `Examine edge ${u} → ${v} for negative cycle`,
      `Testing edge ${u} → ${v} in the extra validation pass to check for ongoing relaxations.`,
      { u, v, weight },
      u,
      { from: u, to: v },
    );

    const uDist = dist[u];
    const vDist = dist[v];
    const canRelax = uDist !== undefined && uDist !== Infinity && uDist + weight < vDist;

    if (canRelax) {
      hasNegativeCycle = true;
      addStep(
        12,
        `Negative cycle condition met: dist[${u}] + ${weight} < dist[${v}]`,
        `${uDist} + ${weight} = ${uDist + weight} is less than dist['${v}'] (${vDist === Infinity ? "∞" : vDist}). Distances should be stable after V-1 passes — further improvement proves a negative cycle exists.`,
        {
          u,
          v,
          weight,
          candidateDist: uDist + weight,
          currentDist: vDist === Infinity ? "∞" : vDist,
        },
        v,
        { from: u, to: v },
      );
      addStep(
        13,
        `Mark negative cycle found: has_negative_cycle = True`,
        `Setting has_negative_cycle = True to signal that shortest paths are undefined — the graph contains a reachable negative-weight cycle.`,
        { u, v, weight, hasNegativeCycle: true },
        v,
        { from: u, to: v },
      );
      addStep(
        14,
        `Break out of validation loop`,
        `One confirmed negative cycle is sufficient. We terminate the validation sweep immediately.`,
        { hasNegativeCycle: true },
      );
      break;
    }
  }

  if (!hasNegativeCycle) {
    addStep(
      18,
      "Bellman-Ford complete",
      `No edge can improve any distance, so the table now holds the true shortest path from '${startNode}' to every reachable vertex. In total we ran up to V - 1 passes over all E edges — completing in O(V * E) time.`,
      { hasNegativeCycle: false, completed: true },
    );
  } else {
    addStep(
      17,
      "Bellman-Ford complete: negative cycle found",
      'Because a reachable cycle has negative total weight, "shortest path" is not well-defined — looping around that cycle infinitely lowers the cost without bound.',
      {
        hasNegativeCycle: true,
        returnedDistances: "None",
        returnedHasNegativeCycle: true,
        completed: true,
      },
      undefined,
      undefined,
      { Output: "(None, True)" },
    );
  }

  while (steps.length < 20) {
    addStep(
      hasNegativeCycle ? 17 : 18,
      !hasNegativeCycle
        ? `Bellman-Ford complete (step ${steps.length + 1})`
        : `Bellman-Ford complete: negative cycle found (step ${steps.length + 1})`,
      `Finalizing algorithm state and confirming shortest paths.`,
      {
        hasNegativeCycle,
        ...(hasNegativeCycle ? { returnedDistances: "None", returnedHasNegativeCycle: true } : {}),
        completed: true,
      },
      undefined,
      undefined,
      hasNegativeCycle ? { Output: "(None, True)" } : undefined,
    );
  }

  return steps;
};
