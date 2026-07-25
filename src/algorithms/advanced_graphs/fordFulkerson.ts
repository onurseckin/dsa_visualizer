import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface FordFulkersonInput {
  nodes: string[];
  edges: { from: string; to: string; capacity: number }[];
  source: string;
  sink: string;
}

export const FORD_FULKERSON_CODE = `def ford_fulkerson(nodes, edges, source, sink):
    # Initialize capacity & flow tables
    capacity = {}
    flow = {}
    for u, v, cap in edges:
        capacity[(u, v)] = cap
        flow[(u, v)] = 0

    def dfs(u, target, visited, current_flow):
        if u == target:
            return current_flow
        visited.add(u)
        for (u_node, v_node), cap in capacity.items():
            if u_node == u and v_node not in visited:
                res_cap = cap - flow[(u, v_node)]
                if res_cap > 0:
                    bottleneck = dfs(v_node, target, visited, min(current_flow, res_cap))
                    if bottleneck > 0:
                        return bottleneck
        return 0

    max_flow = 0
    while True:
        visited = set()
        pushed = dfs(source, sink, visited, float('inf'))
        if pushed == 0:
            break
        max_flow += pushed

    return max_flow`;

export const DEFAULT_FORD_FULKERSON_INPUT: FordFulkersonInput = {
  nodes: ['S', 'A', 'B', 'T'],
  edges: [
    { from: 'S', to: 'A', capacity: 10 },
    { from: 'S', to: 'B', capacity: 10 },
    { from: 'A', to: 'B', capacity: 2 },
    { from: 'A', to: 'T', capacity: 10 },
    { from: 'B', to: 'T', capacity: 10 },
  ],
  source: 'S',
  sink: 'T',
};

export const generateFordFulkersonSteps = (
  input: FordFulkersonInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = input?.nodes || [];
  const rawEdges = input?.edges || [];
  const source = input?.source || (rawNodes[0] ?? '');
  const sink = input?.sink || (rawNodes[rawNodes.length - 1] ?? '');

  if (rawNodes.length === 0 || !source || !sink) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: 'Initialize Ford-Fulkerson Maximum Flow',
        why: 'Empty node set or invalid source/sink provided.',
      },
      primarySnapshot: { kind: 'graph', nodes: [], edges: [] },
      auxiliaryState: { customState: { 'Max Flow': 0 } },
      variables: { completed: true },
    });
    return steps;
  }

  // Flow and capacity mapping: (u, v) -> number
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
    visitedNodeSet?: Set<string>
  ): GraphNodeItem[] =>
    rawNodes.map((id) => {
      let label = id;
      if (id === source) label = `${id} (S)`;
      if (id === sink) label = `${id} (T)`;

      let state: GraphNodeItem['state'] = 'default';
      if (id === activeNodeId) state = 'active';
      else if (pathNodeSet?.has(id)) state = 'path';
      else if (visitedNodeSet?.has(id)) state = 'visited';

      return { id, label, state };
    });

  const getGraphEdges = (
    activePathEdges?: Array<{ from: string; to: string }>
  ): GraphEdgeItem[] => {
    const pathEdgeSet = new Set(
      (activePathEdges || []).map((e) => `${e.from}->${e.to}`)
    );

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

  const getFormattedCustomState = (
    extra?: Record<string, string | number>
  ): Record<string, string | number> => {
    const edgeFlowSummary: string[] = [];
    rawEdges.forEach((e) => {
      const key = `${e.from}->${e.to}`;
      edgeFlowSummary.push(`${key}: ${flowMap[key]}/${e.capacity}`);
    });

    return {
      Source: source,
      Sink: sink,
      'Max Flow': currentMaxFlow,
      'Flows (F/C)': edgeFlowSummary.join(', '),
      ...(extra || {}),
    };
  };

  let currentMaxFlow = 0;

  // Step 1: Initial step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize Ford-Fulkerson Max Flow from source '${source}' to sink '${sink}'`,
      why: 'Residual graph set up with initial flow 0 across all edges.',
    },
    primarySnapshot: {
      kind: 'graph',
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
      currentFlow: number
    ): { bottleneck: number; pathNodes: string[] } | null => {
      path.push(u);
      visited.add(u);

      if (u === target) {
        return { bottleneck: currentFlow, pathNodes: [...path] };
      }

      // Check all neighbors
      for (const node of rawNodes) {
        if (!visited.has(node)) {
          const resCap = getResidualCapacity(u, node);
          if (resCap > 0) {
            const result = findAugmentingPath(
              node,
              target,
              Math.min(currentFlow, resCap)
            );
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
        codeLine: 28,
        explanation: {
          what: `No more augmenting paths found. Maximum Flow algorithm complete!`,
          why: `Residual graph has no remaining path from source '${source}' to sink '${sink}' with capacity > 0.`,
        },
        primarySnapshot: {
          kind: 'graph',
          nodes: getGraphNodes(),
          edges: getGraphEdges(),
        },
        auxiliaryState: {
          visited: Array.from(visited),
          customState: getFormattedCustomState({ Status: 'Terminated' }),
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
      codeLine: 18,
      explanation: {
        what: `Found augmenting path: ${pathNodes.join(' → ')} with bottleneck capacity ${bottleneck}`,
        why: `Minimum available residual capacity along path is ${bottleneck}.`,
      },
      primarySnapshot: {
        kind: 'graph',
        nodes: getGraphNodes(undefined, pathNodeSet, visited),
        edges: getGraphEdges(pathEdges),
      },
      auxiliaryState: {
        visited: Array.from(visited),
        customState: getFormattedCustomState({
          'Augmenting Path': pathNodes.join(' → '),
          Bottleneck: bottleneck,
        }),
      },
      variables: {
        bottleneck,
        path: pathNodes.join(' → '),
        currentMaxFlow,
      },
    });

    // Augment flow along the path
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const u = pathNodes[i];
      const v = pathNodes[i + 1];
      const forwardKey = `${u}->${v}`;
      const revKey = `${v}->${u}`;

      if (capMap[forwardKey] !== undefined) {
        flowMap[forwardKey] = (flowMap[forwardKey] || 0) + bottleneck;
      } else if (capMap[revKey] !== undefined) {
        flowMap[revKey] = (flowMap[revKey] || 0) - bottleneck;
      }
    }

    currentMaxFlow += bottleneck;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 29,
      explanation: {
        what: `Augmented flow by ${bottleneck}. Updated total Max Flow = ${currentMaxFlow}`,
        why: `Added bottleneck flow along augmenting path and updated residual network edge capacities.`,
      },
      primarySnapshot: {
        kind: 'graph',
        nodes: getGraphNodes(undefined, pathNodeSet),
        edges: getGraphEdges(pathEdges),
      },
      auxiliaryState: {
        customState: getFormattedCustomState({
          'Last Bottleneck': bottleneck,
          'Total Max Flow': currentMaxFlow,
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

export const fordFulkerson: AlgorithmDefinition<FordFulkersonInput> = {
  id: 'ford-fulkerson',
  title: 'Ford-Fulkerson Maximum Flow',
  category: 'advanced_graphs',
  difficulty: 'Hard',
  description:
    'Computes the maximum flow from a source vertex to a sink vertex in a flow network by iteratively finding augmenting paths in the residual graph.',
  constraints: ['2 <= V <= 50', '1 <= capacity <= 10^4'],
  examples: [
    {
      input: 'Source = S, Sink = T, 4 nodes, 5 capacity edges',
      output: 'Max Flow = 20',
    },
  ],
  code: FORD_FULKERSON_CODE,
  timeComplexity: {
    best: 'O(E)',
    average: 'O(E * MaxFlow)',
    worst: 'O(E * MaxFlow)',
  },
  spaceComplexity: 'O(V + E)',
  defaultInput: DEFAULT_FORD_FULKERSON_INPUT,
  generateSteps: generateFordFulkersonSteps,
};
