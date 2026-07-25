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

const DEFAULT_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 80, y: 190 },
  A: { x: 260, y: 80 },
  B: { x: 260, y: 300 },
  T: { x: 440, y: 190 },
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
        what: 'Handle the empty network',
        why: 'There are no usable nodes or the source/sink is missing, so no flow can travel anywhere — the answer is simply 0.',
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
    rawNodes.map((id, index) => {
      let label = id;
      if (id === source) label = `${id} (S)`;
      if (id === sink) label = `${id} (T)`;

      let state: GraphNodeItem['state'] = 'default';
      if (id === activeNodeId) state = 'active';
      else if (pathNodeSet?.has(id)) state = 'path';
      else if (visitedNodeSet?.has(id)) state = 'visited';

      const pos = DEFAULT_NODE_POSITIONS[id] || {
        x: Math.round(
          260 +
            150 *
              Math.cos(
                (2 * Math.PI * index) / Math.max(rawNodes.length, 1)
              )
        ),
        y: Math.round(
          190 +
            120 *
              Math.sin(
                (2 * Math.PI * index) / Math.max(rawNodes.length, 1)
              )
        ),
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
    codeLine: 1,
    explanation: {
      what: `Set up flow network from '${source}' to '${sink}'`,
      why: `Every edge starts carrying 0 of its capacity, and we want to push as much flow as possible from '${source}' to '${sink}'. As long as some path with spare capacity exists, we can still do better.`,
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
        codeLine: 30,
        explanation: {
          what: `Stop — no augmenting path remains`,
          why: `We searched the residual graph and found no route from '${source}' to '${sink}' with spare capacity left. The max-flow min-cut theorem tells us that means our total of ${currentMaxFlow} cannot be improved — the saturated edges form a minimum cut sealing off the sink.`,
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
      codeLine: 25,
      explanation: {
        what: `Find augmenting path ${pathNodes.join(' → ')}`,
        why: `Every edge along this route still has spare capacity, and the tightest one allows only ${bottleneck} more units — that bottleneck is exactly how much we can push in one go.`,
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
      codeLine: 28,
      explanation: {
        what: `Push ${bottleneck} units along the path`,
        why: `We add ${bottleneck} to the flow on each forward edge and record the same amount as reverse capacity, so a later path can undo part of this routing if a better one exists. Total flow is now ${currentMaxFlow}.`,
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
  category: 'graph_flows_and_cuts',
  difficulty: 'Hard',
  description:
    'Computes the maximum flow from a source vertex S to a sink vertex T in a flow network by repeatedly finding augmenting paths in the residual graph. The algorithm terminates when no path with positive residual capacity exists, guaranteeing maximum throughput according to the Max-Flow Min-Cut Theorem.',
  constraints: [
    '2 <= V <= 50',
    '1 <= capacity <= 10^4',
    'Graph is a directed network with non-negative capacities',
    'Source S and Sink T must exist in the network',
  ],
  examples: [
    {
      input: 'Source = S, Sink = T, Nodes: [S, A, B, T], Edges with capacities S->A:10, S->B:10, A->B:2, A->T:10, B->T:10',
      output: 'Max Flow = 20',
      explanation:
        'Flow of 10 is pushed along S->A->T and 10 along S->B->T. Total capacity of 20 reaches sink T.',
    },
  ],
  code: FORD_FULKERSON_CODE,
  timeComplexity: {
    best: 'O(E)',
    average: 'O(E * MaxFlow)',
    worst: 'O(E * MaxFlow)',
  },
  spaceComplexity: 'O(V + E)',
  complexityAnalysis: {
    time: 'Each search for an augmenting path is a DFS over the residual graph, costing O(E). With integer capacities every path found pushes at least 1 unit of flow, so there are at most MaxFlow rounds — O(E × MaxFlow) overall. That is why the bound depends on the answer itself: unlucky 1-unit paths can force many rounds, while the best case is a single O(E) search that finds no path at all.',
    space: 'We store a capacity and flow entry per edge plus a visited set per search — O(V + E). The DFS recursion stack can also reach V frames on a long path.',
  },
  topicGuide: {
    overview:
      'A flow network is a directed graph whose edges carry capacities, and the maximum-flow problem asks how much you can ship from a source to a sink without exceeding any capacity or letting material pile up at an intermediate vertex. Ford-Fulkerson answers it with a strikingly plain loop: while some path from source to sink still has spare capacity, push as much as that path allows, then look again. The idea that makes the loop work is the residual graph, a piece of bookkeeping that lets a later path undo part of an earlier commitment. Because the finished flow is certified by a cut, this one algorithm also delivers minimum cuts, bipartite matchings, and a surprising range of problems that look nothing like plumbing.',
    sections: [
      {
        heading: 'The core idea: never treat a routing decision as final',
        body: 'A feasible flow assigns each edge a non-negative amount no larger than its capacity, and every vertex other than the source and the sink must send out exactly what it takes in. The obvious greedy approach — find any path, saturate it, repeat — can strand you, because committing traffic to a middle edge such as A to B in the default network can leave capacity elsewhere unusable, and no purely additive repair recovers it. Ford-Fulkerson escapes that trap by making every commitment reversible: each unit you push forward is simultaneously recorded as permission to push a unit back the other way. The greedy loop becomes correct not because it chooses well but because it can always change its mind.',
      },
      {
        heading: 'How the residual graph actually works',
        body: 'Rather than searching the original network you search the residual graph, where a forward edge from u to v offers capacity minus current flow, and a matching reverse edge from v to u offers exactly the flow already pushed forward. Sending flow along that reverse edge is not shipping anything upstream; it cancels part of a previous decision and frees the original edge to serve a different route. An augmenting path is any source-to-sink path through this residual graph, and its bottleneck is the smallest residual capacity along it, which is the most you can push without breaking a capacity. Augmenting means subtracting the bottleneck from every forward residual on the path and adding it to every reverse one, and doing both keeps conservation intact automatically at each intermediate vertex.',
      },
      {
        heading: 'Why it stops at the true maximum',
        body: 'The loop ends when a search finds no augmenting path, and the reason that means maximum is worth understanding rather than memorising. Let S be the set of vertices still reachable from the source in the final residual graph; the sink is not in S, so the edges leaving S form a cut. Every edge leaving S must be saturated, or the search would have crossed it, and every edge entering S must carry zero flow, or its reverse residual would have offered a way across. So the flow value equals the capacity of that cut, and since no flow can ever exceed the capacity of any cut, the flow is maximum and the cut is minimum at the same moment. That reachable set is also how you read the real bottleneck edges out of a finished run rather than just the final number.',
      },
      {
        heading: 'Which path to pick, and why people say Edmonds-Karp',
        body: 'Ford-Fulkerson deliberately does not say how to find the augmenting path, and that freedom is the source of its reputation for fragility. With integer capacities every augmentation moves at least one unit, so the loop always terminates, but a depth-first search that keeps rediscovering a small middle edge can need as many rounds as the answer is large. Always choosing the shortest augmenting path with a breadth-first search gives Edmonds-Karp, whose round count no longer depends on the capacity values at all, and Dinic\'s algorithm goes further by pushing along many shortest paths per phase. Use plain depth-first augmentation while you are learning or when capacities are small, switch to breadth-first the moment capacities grow, and reach for Dinic on large dense networks.',
      },
      {
        heading: 'Pitfalls and edge cases',
        body: 'The reverse edge is where implementations go wrong: omit it and you get a greedy answer that is quietly too small, or double-count it and you produce a flow that violates capacities. Store residuals so an edge\'s twin is reachable in constant time, and reset the visited set before every search rather than once at the start. Real-valued capacities are the classic pathological case, since adversarial path choice can make the loop converge without ever terminating, which is one more argument for shortest-path augmentation. Then check the small inputs deliberately: a source that equals the sink, a network with no path at all, antiparallel edges between the same pair of vertices, and duplicate edges between the same pair all need a deliberate decision instead of a silent assumption.',
      },
      {
        heading: 'How the pattern generalises: problems in disguise',
        body: 'Most of the value of maximum flow lies in modelling rather than in the loop itself. Bipartite matching becomes a flow problem when you add a source feeding every left vertex, a sink drawing from every right vertex, and unit capacities everywhere, at which point the maximum flow is the size of the maximum matching. A capacity on a vertex is modelled by splitting it into an in-copy and an out-copy joined by an edge of that capacity, several sources and sinks collapse into one super-source and one super-sink, and counting edge-disjoint paths is just maximum flow with every capacity set to one. Once you recognise these gadgets, image segmentation, project selection, and assignment problems all turn into a network you already know how to solve.',
      },
    ],
    keyTerms: [
      {
        term: 'Residual capacity',
        definition:
          'How much more flow an edge can still accept, equal to its capacity minus the flow currently on it. The reverse direction of that edge carries a residual equal to the flow already pushed, which represents the option to cancel.',
      },
      {
        term: 'Augmenting path',
        definition:
          'A source-to-sink path whose every edge has positive residual capacity. Its existence means the current flow is not yet maximum, and its absence is the proof that it is.',
      },
      {
        term: 'Bottleneck',
        definition:
          'The minimum residual capacity along an augmenting path, which is the amount of flow that path can carry. Pushing more than the bottleneck would overfill the tightest edge on the route.',
      },
      {
        term: 'Cut',
        definition:
          'A split of the vertices into two sides with the source on one and the sink on the other; its capacity is the total capacity of the edges crossing forward. Every flow is bounded by every cut, which is why matching one to the other proves optimality.',
      },
      {
        term: 'Flow conservation',
        definition:
          'The requirement that every vertex except the source and the sink sends out exactly as much as it receives. Updating forward and reverse residuals together along a whole path is what preserves it without extra checks.',
      },
    ],
  },
  defaultInput: DEFAULT_FORD_FULKERSON_INPUT,
  generateSteps: generateFordFulkersonSteps,
};
