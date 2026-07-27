import type { AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import { FordFulkersonInput, DEFAULT_NODE_POSITIONS } from "./types";

export const generateFordFulkersonSteps = (input: FordFulkersonInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = input?.nodes || [];
  const rawEdges = input?.edges || [];
  const source = input?.source || (rawNodes[0] ?? "");
  const sink = input?.sink || (rawNodes[rawNodes.length - 1] ?? "");

  if (rawNodes.length === 0 || !source || !sink) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: "Handle the empty network",
        why: "There are no usable nodes or the source/sink is missing, so no flow can travel anywhere — the answer is simply 0.",
      },
      primarySnapshot: { kind: "graph", nodes: [], edges: [] },
      auxiliaryState: { customState: { "Max Flow": 0 } },
      variables: { completed: true },
    });
    return steps;
  }

  const capMap: Record<string, number> = {};
  const flowMap: Record<string, number> = {};

  rawEdges.forEach((e) => {
    const key = `${e.from}->${e.to}`;
    capMap[key] = e.capacity;
    flowMap[key] = 0;
  });

  const getResidualCapacity = (u: string, v: string): number => {
    const key = `${u}->${v}`;
    const revKey = `${v}->${u}`;
    if (capMap[key] !== undefined) {
      return capMap[key] - (flowMap[key] || 0);
    }
    if (capMap[revKey] !== undefined) {
      return flowMap[revKey] || 0;
    }
    return 0;
  };

  const getGraphNodes = (
    activeNodeId?: string,
    pathNodeSet?: Set<string>,
    visitedNodeSet?: Set<string>,
  ): GraphNodeItem[] =>
    rawNodes.map((id, index) => {
      let label = id;
      if (id === source) label = `${id} (S)`;
      if (id === sink) label = `${id} (T)`;

      let state: GraphNodeItem["state"] = "default";
      if (id === activeNodeId) {
        state = "active";
      } else if (pathNodeSet && pathNodeSet.has(id)) {
        state = "path";
      } else if (visitedNodeSet && visitedNodeSet.has(id)) {
        state = "visited";
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

    return rawEdges.map((e) => {
      const key = `${e.from}->${e.to}`;
      const f = flowMap[key] || 0;
      const c = e.capacity;
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

  const getFormattedCustomState = (
    extra?: Record<string, string | number>,
  ): Record<string, string | number> => {
    const edgeFlowSummary: string[] = [];
    rawEdges.forEach((e) => {
      const key = `${e.from}->${e.to}`;
      edgeFlowSummary.push(`${key}: ${flowMap[key]}/${e.capacity}`);
    });

    return {
      Source: source,
      Sink: sink,
      "Max Flow": currentMaxFlow,
      "Flows (F/C)": edgeFlowSummary.join(", "),
      ...(extra || {}),
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Set up flow network from '${source}' to '${sink}'`,
      why: `Every edge starts carrying 0 of its capacity, and we want to push as much flow as possible from '${source}' to '${sink}'. As long as some path with spare capacity exists, we can still do better.`,
    },
    primarySnapshot: {
      kind: "graph",
      nodes: getGraphNodes(),
      edges: getGraphEdges(),
    },
    auxiliaryState: {
      customState: getFormattedCustomState(),
    },
    variables: { source, sink, maxFlow: 0 },
  });

  let searching = true;
  while (searching) {
    const visited = new Set<string>();
    const path: string[] = [];

    const findAugmentingPath = (
      u: string,
      target: string,
      currentFlow: number,
    ): { bottleneck: number; pathNodes: string[] } | null => {
      path.push(u);
      visited.add(u);

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
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 26,
        explanation: {
          what: `Stop — no augmenting path remains`,
          why: `We searched the residual graph and found no route from '${source}' to '${sink}' with spare capacity left. The max-flow min-cut theorem tells us that means our total of ${currentMaxFlow} cannot be improved — the saturated edges form a minimum cut sealing off the sink.`,
        },
        primarySnapshot: {
          kind: "graph",
          nodes: getGraphNodes(),
          edges: getGraphEdges(),
        },
        auxiliaryState: {
          visited: Array.from(visited),
          customState: getFormattedCustomState({ Status: "Terminated" }),
        },
        variables: { maxFlow: currentMaxFlow, completed: true },
      });
      searching = false;
      break;
    }

    const { bottleneck, pathNodes } = pathResult;
    const pathNodeSet = new Set(pathNodes);
    const pathEdges: Array<{ from: string; to: string }> = [];

    for (let i = 0; i < pathNodes.length - 1; i++) {
      pathEdges.push({ from: pathNodes[i], to: pathNodes[i + 1] });
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 24,
      explanation: {
        what: `Find augmenting path ${pathNodes.join(" → ")}`,
        why: `Every edge along this route still has spare capacity, and the tightest one allows only ${bottleneck} more units — that bottleneck is exactly how much we can push in one go.`,
      },
      primarySnapshot: {
        kind: "graph",
        nodes: getGraphNodes(
          pathResult.pathNodes[pathResult.pathNodes.length - 1],
          pathNodeSet,
          visited,
        ),
        edges: getGraphEdges(pathEdges),
      },
      auxiliaryState: {
        visited: Array.from(visited),
        customState: getFormattedCustomState({
          "Augmenting Path": pathNodes.join(" → "),
          Bottleneck: bottleneck,
        }),
      },
      variables: {
        bottleneck,
        path: pathNodes.join(" → "),
        currentMaxFlow,
      },
    });

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const u = pathNodes[i];
      const v = pathNodes[i + 1];
      const forwardKey = `${u}->${v}`;
      const revKey = `${v}->${u}`;

      if (capMap[forwardKey] !== undefined) {
        flowMap[forwardKey] += bottleneck;
      } else if (capMap[revKey] !== undefined) {
        flowMap[revKey] -= bottleneck;
      }
    }

    currentMaxFlow += bottleneck;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 27,
      explanation: {
        what: `Push ${bottleneck} units along the path`,
        why: `We add ${bottleneck} to the flow on each forward edge and record the same amount as reverse capacity, so a later path can undo part of this routing if a better one exists. Total flow is now ${currentMaxFlow}.`,
      },
      primarySnapshot: {
        kind: "graph",
        nodes: getGraphNodes(undefined, pathNodeSet),
        edges: getGraphEdges(pathEdges),
      },
      auxiliaryState: {
        customState: getFormattedCustomState({
          "Last Bottleneck": bottleneck,
          "Total Max Flow": currentMaxFlow,
        }),
      },
      variables: {
        bottleneck,
        maxFlow: currentMaxFlow,
      },
    });
  }

  return steps;
};
