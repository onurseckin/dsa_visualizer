import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface TopologicalSortInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const TOPOLOGICAL_SORT_CODE = `from collections import deque, defaultdict

def topological_sort(nodes, edges):
    in_degree = {node: 0 for node in nodes}
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1

    queue = deque([node for node in nodes if in_degree[node] == 0])
    order = []

    while queue:
        u = queue.popleft()
        order.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    return order if len(order) == len(nodes) else []`;

export const DEFAULT_TOPO_SORT_INPUT: TopologicalSortInput = {
  nodes: [
    { id: '5', label: '5', x: 100, y: 100, state: 'default' },
    { id: '4', label: '4', x: 100, y: 200, state: 'default' },
    { id: '2', label: '2', x: 250, y: 100, state: 'default' },
    { id: '0', label: '0', x: 400, y: 100, state: 'default' },
    { id: '1', label: '1', x: 400, y: 200, state: 'default' },
    { id: '3', label: '3', x: 250, y: 200, state: 'default' },
  ],
  edges: [
    { from: '5', to: '2' },
    { from: '5', to: '0' },
    { from: '4', to: '0' },
    { from: '4', to: '1' },
    { from: '2', to: '3' },
    { from: '3', to: '1' },
  ],
};

export const generateTopologicalSortSteps = (input: TopologicalSortInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes: GraphNodeItem[] = input.nodes.map((n) => ({
    ...n,
    state: 'default',
  }));

  const edges: GraphEdgeItem[] = input.edges.map((e) => ({
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
    variables: Record<string, string | number | boolean>
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
        kind: 'graph',
        nodes: nodesCopy,
        edges: edges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        hashMap: hashMapInDegree,
        queue: [...queue],
        stack: [...order],
        visited: [...order],
        customState: {
          'In-Degrees': Object.entries(inDegree)
            .map(([k, v]) => `${k}:${v}`)
            .join(', '),
          'Zero In-Degree Queue': queue.join(', ') || 'Empty',
          'Topological Order': order.join(' -> ') || 'None',
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Topological Sort (Kahn's Algorithm)",
    "Beginning process to compute linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u -> v, vertex u appears before vertex v.",
    { nodeCount: nodes.length, edgeCount: edges.length }
  );

  if (nodes.length === 0) {
    addStep(21, 'Topological Sort complete', 'Graph is empty. Return empty linear ordering.', { orderLength: 0 });
    return steps;
  }

  // Calculate in-degrees
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
    'Calculate in-degree for all nodes',
    'Computed the number of incoming directed edges for each node. Nodes with an in-degree of 0 have no unmet dependencies and can be processed immediately.',
    { inDegrees: JSON.stringify(inDegree) }
  );

  // Enqueue nodes with in-degree 0
  for (const n of nodes) {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      n.state = 'queued';
    }
  }

  addStep(
    10,
    `Enqueue all nodes with in-degree 0: [${queue.join(', ')}]`,
    'Nodes with 0 incoming dependencies are placed into the BFS processing queue as initial candidates for topological ordering.',
    { initialQueueSize: queue.length }
  );

  while (queue.length > 0) {
    addStep(
      13,
      `Check queue condition (queue size: ${queue.length})`,
      'Queue is not empty. Continue extracting zero-dependency nodes in BFS order.',
      { queueSize: queue.length }
    );

    const u = queue.shift()!;
    const uNode = nodes.find((n) => n.id === u);
    if (uNode) {
      uNode.state = 'active';
    }

    addStep(
      14,
      `Dequeue node '${u}'`,
      `Extracted Node '${u}' from the front of the queue. Node '${u}' is free of unfulfilled prerequisite dependencies.`,
      { current: u }
    );

    order.push(u);
    if (uNode) {
      uNode.state = 'sorted';
    }

    addStep(
      15,
      `Append node '${u}' to topological order`,
      `Node '${u}' is appended to the output sequence. Current order: [${order.join(' -> ')}].`,
      { current: u, orderLength: order.length }
    );

    // Find outgoing edges from u
    const outgoingEdges = edges.filter((e) => e.from === u);

    addStep(
      16,
      `Explore outgoing edges from node '${u}'`,
      `Node '${u}' has ${outgoingEdges.length} outgoing edge(s). Removing node '${u}' reduces the in-degree of all its downstream neighbors.`,
      { current: u, outgoingCount: outgoingEdges.length }
    );

    for (const edge of outgoingEdges) {
      edge.isTraversed = true;
      const v = edge.to;
      const vNode = nodes.find((n) => n.id === v);

      if (vNode && vNode.state !== 'sorted') {
        vNode.state = 'compare';
      }

      inDegree[v]--;

      addStep(
        17,
        `Decrement in-degree of neighbor '${v}' to ${inDegree[v]}`,
        `Removed dependency '${u}' -> '${v}'. Neighbor '${v}' now has in-degree ${inDegree[v]}.`,
        { u, v, newInDegree: inDegree[v] }
      );

      if (inDegree[v] === 0) {
        queue.push(v);
        if (vNode) {
          vNode.state = 'queued';
        }

        addStep(
          19,
          `Enqueue neighbor '${v}' (in-degree reached 0)`,
          `Node '${v}' has no remaining incoming prerequisites. Added to queue for topological sequencing.`,
          { v, queueSize: queue.length }
        );
      } else if (vNode && vNode.state !== 'sorted') {
        vNode.state = 'default';
      }
    }
  }

  const hasCycle = order.length < nodes.length;

  addStep(
    13,
    'Queue is empty',
    'Finished processing all reachable 0 in-degree nodes.',
    { queueSize: 0 }
  );

  addStep(
    21,
    hasCycle
      ? `Cycle detected in graph! Processed ${order.length}/${nodes.length} nodes.`
      : `Topological Sort complete: [${order.join(' -> ')}]`,
    hasCycle
      ? 'The graph contains at least one directed cycle; impossible to find a valid linear topological ordering.'
      : 'Successfully computed valid topological ordering for all nodes in the DAG.',
    { hasCycle, order: order.join(', '), isComplete: !hasCycle }
  );

  return steps;
};

export const topologicalSort: AlgorithmDefinition<TopologicalSortInput> = {
  id: 'topological-sort',
  title: "Topological Sort (Kahn's Algorithm)",
  category: 'graph_directed_and_scc',
  difficulty: 'Medium',
  description:
    'Computes a linear ordering of vertices in a Directed Acyclic Graph (DAG) using Kahn\'s in-degree queue-based algorithm. For every directed edge u -> v, vertex u appears before vertex v in the ordering. Used for task scheduling, build order dependency resolution, and course prerequisites.',
  constraints: [
    '1 <= V <= 10^4',
    '0 <= E <= 2 * 10^4',
    'Graph must be a Directed Acyclic Graph (DAG) for a full topological ordering; cycles return empty order',
  ],
  examples: [
    {
      input: 'Nodes [5, 4, 2, 0, 1, 3], Edges: 5->2, 5->0, 4->0, 4->1, 2->3, 3->1',
      output: '[5, 4, 2, 0, 3, 1]',
      explanation:
        'Nodes 5 and 4 have in-degree 0 and are processed first. Removing their edges reduces in-degrees of downstream nodes, resolving dependencies sequentially.',
    },
  ],
  code: TOPOLOGICAL_SORT_CODE,
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  defaultInput: DEFAULT_TOPO_SORT_INPUT,
  generateSteps: generateTopologicalSortSteps,
};
