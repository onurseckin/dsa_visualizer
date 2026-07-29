import type { AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import type { TopologicalSortInput } from "./definition";

export const generateTopologicalSortSteps = (input: TopologicalSortInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];

  const nodes: GraphNodeItem[] = rawNodes.map((n) => ({
    ...n,
    state: "default",
  }));

  const edges: GraphEdgeItem[] = rawEdges.map((e) => ({
    ...e,
    isTraversed: false,
    isPath: false,
  }));

  const inDegree: Record<string, number> = {};
  const queue: string[] = [];
  const order: string[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    const nodesCopy = nodes.map((n) => ({
      ...n,
      val: inDegree[n.id] !== undefined ? inDegree[n.id] : undefined,
    }));

    const hashMapInDegree: Record<string, number> = {};
    for (const n of nodes) {
      if (inDegree[n.id] !== undefined) {
        hashMapInDegree[`Node ${n.id}`] = inDegree[n.id];
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes: nodesCopy,
        edges: edges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        hashMap: hashMapInDegree,
        queue: [...queue],
        stack: [...order],
        visited: [...order],
        customState: {
          "In-Degrees": Object.entries(inDegree)
            .map(([k, v]) => `${k}:${v}`)
            .join(", "),
          "Zero In-Degree Queue": queue.join(", ") || "Empty",
          "Topological Order": order.join(" -> ") || "None",
        },
      },
      variables,
    });
  };

  addStep(
    3,
    "Start Kahn's topological sort",
    "We want a line-up of the nodes where every edge points forward — each node appears only after everything it depends on. Kahn's idea: repeatedly pick off a node that has no remaining prerequisites.",
    { nodeCount: nodes.length, edgeCount: edges.length },
  );

  if (nodes.length === 0) {
    addStep(
      21,
      "Topological Sort complete",
      "The graph has no nodes, so the ordering is trivially empty.",
      { orderLength: 0 },
    );
    return steps;
  }

  for (const n of nodes) {
    inDegree[n.id] = 0;
  }
  for (const e of edges) {
    if (inDegree[e.to] !== undefined) {
      inDegree[e.to]++;
    }
  }

  addStep(
    8,
    "Count incoming edges per node",
    "A node's in-degree is how many prerequisites it's still waiting on. Anything sitting at 0 depends on nothing, so it can safely go first.",
    { inDegrees: JSON.stringify(inDegree) },
  );

  for (const n of nodes) {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      n.state = "queued";
    }
  }

  addStep(
    10,
    `Enqueue zero in-degree nodes: [${queue.join(", ")}]`,
    "These nodes have no incoming edges, meaning nothing needs to come before them. We queue them up as valid starting points for the ordering.",
    { initialQueueSize: queue.length },
  );

  while (queue.length > 0) {
    addStep(
      13,
      `Check the queue (${queue.length} waiting)`,
      "The queue still holds dependency-free nodes, so we have more to place before the ordering is done.",
      { queueSize: queue.length },
    );

    const u = queue.shift()!;
    const uNode = nodes.find((n) => n.id === u);
    if (uNode) {
      uNode.state = "active";
    }

    addStep(
      14,
      `Dequeue node '${u}'`,
      `We take '${u}' from the front of the queue. Every prerequisite it ever had is already placed in the order, so '${u}' is free to be scheduled next.`,
      { current: u },
    );

    order.push(u);
    if (uNode) {
      uNode.state = "sorted";
    }

    addStep(
      15,
      `Place '${u}' in the order`,
      `We commit '${u}' to the output sequence, which now reads [${order.join(" -> ")}].`,
      { current: u, orderLength: order.length },
    );

    const outgoingEdges = edges.filter((e) => e.from === u);

    addStep(
      16,
      `Follow edges out of '${u}'`,
      `Now that '${u}' is placed, its ${outgoingEdges.length} outgoing edge(s) count as satisfied dependencies — each downstream neighbor has one fewer thing to wait for.`,
      { current: u, outgoingCount: outgoingEdges.length },
    );

    for (const edge of outgoingEdges) {
      edge.isTraversed = true;
      const v = edge.to;
      const vNode = nodes.find((n) => n.id === v);

      if (vNode && vNode.state !== "sorted") {
        vNode.state = "compare";
      }

      inDegree[v]--;

      addStep(
        17,
        `Drop '${v}' in-degree to ${inDegree[v]}`,
        `The dependency '${u}' -> '${v}' is now resolved, so '${v}' waits on ${inDegree[v]} prerequisite(s).`,
        { u, v, newInDegree: inDegree[v] },
      );

      if (inDegree[v] === 0) {
        queue.push(v);
        if (vNode) {
          vNode.state = "queued";
        }

        addStep(
          19,
          `Enqueue '${v}'`,
          `'${v}' just hit in-degree 0 — everything it was waiting for has been placed, so it joins the queue as ready to schedule.`,
          { v, queueSize: queue.length },
        );
      } else if (vNode && vNode.state !== "sorted") {
        vNode.state = "default";
      }
    }
  }

  const hasCycle = order.length < nodes.length;

  addStep(
    13,
    "Queue is empty",
    "No node with zero remaining prerequisites is left, so we've placed everything we possibly can.",
    { queueSize: 0 },
  );

  addStep(
    21,
    hasCycle
      ? `Cycle detected: ${order.length}/${nodes.length} nodes placed`
      : `Topological Sort complete: [${order.join(" -> ")}]`,
    hasCycle
      ? "Some nodes never reached in-degree 0 because they are waiting on each other in a loop. A cycle makes a valid linear ordering impossible, so we return an empty result."
      : "Every edge points forward in this sequence, so it is a valid schedule. Since each node and each edge was handled exactly once, the whole run cost O(V + E).",
    { hasCycle, order: order.join(", "), isComplete: !hasCycle },
  );

  return steps;
};
