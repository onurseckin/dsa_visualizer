import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  TopicGuide,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

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
    3,
    "Start Kahn's topological sort",
    "We want a line-up of the nodes where every edge points forward — each node appears only after everything it depends on. Kahn's idea: repeatedly pick off a node that has no remaining prerequisites.",
    { nodeCount: nodes.length, edgeCount: edges.length }
  );

  if (nodes.length === 0) {
    addStep(21, 'Topological Sort complete', 'The graph has no nodes, so the ordering is trivially empty.', { orderLength: 0 });
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
    'Count incoming edges per node',
    "A node's in-degree is how many prerequisites it's still waiting on. Anything sitting at 0 depends on nothing, so it can safely go first.",
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
    `Enqueue zero in-degree nodes: [${queue.join(', ')}]`,
    'These nodes have no incoming edges, meaning nothing needs to come before them. We queue them up as valid starting points for the ordering.',
    { initialQueueSize: queue.length }
  );

  while (queue.length > 0) {
    addStep(
      13,
      `Check the queue (${queue.length} waiting)`,
      'The queue still holds dependency-free nodes, so we have more to place before the ordering is done.',
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
      `We take '${u}' from the front of the queue. Every prerequisite it ever had is already placed in the order, so '${u}' is free to be scheduled next.`,
      { current: u }
    );

    order.push(u);
    if (uNode) {
      uNode.state = 'sorted';
    }

    addStep(
      15,
      `Place '${u}' in the order`,
      `We commit '${u}' to the output sequence, which now reads [${order.join(' -> ')}].`,
      { current: u, orderLength: order.length }
    );

    // Find outgoing edges from u
    const outgoingEdges = edges.filter((e) => e.from === u);

    addStep(
      16,
      `Follow edges out of '${u}'`,
      `Now that '${u}' is placed, its ${outgoingEdges.length} outgoing edge(s) count as satisfied dependencies — each downstream neighbor has one fewer thing to wait for.`,
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
        `Drop '${v}' in-degree to ${inDegree[v]}`,
        `The dependency '${u}' -> '${v}' is now resolved, so '${v}' waits on ${inDegree[v]} prerequisite(s).`,
        { u, v, newInDegree: inDegree[v] }
      );

      if (inDegree[v] === 0) {
        queue.push(v);
        if (vNode) {
          vNode.state = 'queued';
        }

        addStep(
          19,
          `Enqueue '${v}'`,
          `'${v}' just hit in-degree 0 — everything it was waiting for has been placed, so it joins the queue as ready to schedule.`,
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
    "No node with zero remaining prerequisites is left, so we've placed everything we possibly can.",
    { queueSize: 0 }
  );

  addStep(
    21,
    hasCycle
      ? `Cycle detected: ${order.length}/${nodes.length} nodes placed`
      : `Topological Sort complete: [${order.join(' -> ')}]`,
    hasCycle
      ? 'Some nodes never reached in-degree 0 because they are waiting on each other in a loop. A cycle makes a valid linear ordering impossible, so we return an empty result.'
      : 'Every edge points forward in this sequence, so it is a valid schedule. Since each node and each edge was handled exactly once, the whole run cost O(V + E).',
    { hasCycle, order: order.join(', '), isComplete: !hasCycle }
  );

  return steps;
};

const TOPOLOGICAL_SORT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A topological order takes a set of items constrained by must-come-before rules and flattens them into a single sequence that never violates one. Whenever you model those constraints as a directed graph — courses and prerequisites, build targets and their dependencies, tasks and their blockers — the ordering you want is a topological sort of that graph. Kahn's algorithm computes one by counting, for each item, how many prerequisites it is still waiting on, and repeatedly releasing whichever items are waiting on nothing. It only works on a directed acyclic graph, and pleasantly, its failure mode is itself the standard way to detect that a dependency cycle exists.",
  sections: [
    {
      heading: 'Ready means nothing is pointing at you',
      body: 'The idea is to think in terms of readiness rather than position. An item can be placed next in the sequence exactly when every item that must precede it has already been placed, and you can measure that with a single number: the count of incoming edges still unresolved, called the in-degree. Items whose in-degree is zero right now are free to go in any order, so you keep them in a pool of ready work and pull from it. Placing an item resolves its outgoing constraints, which lowers the in-degree of everything downstream and may promote some of those to ready — so the ordering emerges from a chain reaction rather than from any comparison between items.',
    },
    {
      heading: 'How the run actually proceeds',
      body: "First you sweep the edge list once to build the in-degree count for every vertex, then seed a queue with every vertex whose count is already zero, which are the items with no prerequisites at all. Then you loop: remove a vertex from the queue, append it to the output order, and for each of its outgoing edges decrement the target's in-degree, pushing that target onto the queue the moment its count reaches zero. Nothing is ever revisited, and each edge is examined exactly once — at the moment its source is dequeued — which is why a single pass suffices. When the queue empties, the output holds every vertex you were able to schedule.",
    },
    {
      heading: 'Why the output is a valid ordering',
      body: 'The invariant is that a vertex is enqueued only after every one of its predecessors has already been appended to the output. That holds at the start, since the seeded vertices have no predecessors, and it is preserved by the decrement step, because a count only reaches zero once each incoming edge has been retired by its source being placed. Since appending happens after enqueueing, every edge in the graph points from an earlier position in the output to a later one, which is precisely the definition of a topological order. Note that the invariant says nothing about uniqueness — whenever the ready pool holds more than one vertex, any choice yields a correct answer, which is why a graph usually has many valid topological orders.',
    },
    {
      heading: 'Cycles come out for free',
      body: "If a group of vertices depends on itself in a loop, none of them can ever reach in-degree zero, because each is permanently waiting on another member of the loop. The queue therefore empties while those vertices are still unplaced, and comparing the output length against the vertex count tells you immediately whether the graph was acyclic. This is the reason Kahn's algorithm is routinely used as a cycle detector rather than only as a sorter, in deadlock checks and dependency validation alike. The vertices missing from the output are exactly those trapped in or downstream of a cycle, which is a useful starting point when you have to report which dependencies are circular.",
    },
    {
      heading: 'Kahn versus the depth-first variant',
      body: "The other classic approach runs a depth-first search and prepends each vertex to the result as its exploration finishes, which produces a valid order because a vertex finishes only after everything it reaches has finished. That version is shorter to write and natural when you are already recursing, but it detects cycles by tracking vertices currently on the recursion stack and it hands you the whole order only at the end. Kahn's version is preferable when you want the ordering produced incrementally, when you want to control tie-breaking, or when recursion depth is a concern on a large graph. If you specifically need the lexicographically smallest valid order, swap the queue for a min-heap — an option the depth-first formulation does not give you at all.",
    },
    {
      heading: 'What else the ready pool tells you',
      body: 'Because everything currently in the ready pool is mutually independent, draining it one full round at a time partitions the graph into layers, and those layers are exactly the batches you could execute in parallel — the number of rounds is then the length of the critical path. Once you have a topological order you can also run dynamic programming along it in a single pass, which is how longest paths, earliest and latest start times, and reachability counts are computed on a directed acyclic graph. The same ordering makes shortest paths on such a graph trivial and immune to negative weights, since relaxing edges in topological order settles each distance permanently the first time. If the pool ever holds two or more vertices, the order is not unique, and that observation is what you build on to count all valid orderings or to prove one is forced.',
    },
  ],
  keyTerms: [
    {
      term: 'Directed acyclic graph (DAG)',
      definition:
        'A directed graph containing no cycle, so you can never follow edges forward and return to where you started. Exactly these graphs admit a topological order.',
    },
    {
      term: 'In-degree',
      definition:
        "The number of edges pointing into a vertex — that is, how many prerequisites it still has. Kahn's algorithm treats a vertex as ready to schedule the moment this count falls to zero.",
    },
    {
      term: 'Topological order',
      definition:
        'A linear arrangement of the vertices in which every edge points forward. It is a valid execution schedule for the dependencies the graph encodes.',
    },
    {
      term: 'Source vertex',
      definition:
        'A vertex with in-degree zero, depending on nothing. Every non-empty acyclic graph has at least one, which is what guarantees the algorithm can always start.',
    },
    {
      term: 'Critical path',
      definition:
        'The longest chain of dependencies in the graph, which sets the minimum number of sequential rounds needed even with unlimited parallelism. It equals the number of layers the ready pool passes through.',
    },
  ],
};

const TOPOLOGICAL_SORT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "deque gives O(1) FIFO operations for the ready-queue, and defaultdict lets the adjacency list auto-create empty lists for nodes with no recorded neighbors yet.",
    3: 'Entry point: takes every node and every directed edge (dependency) and returns a valid linear ordering, or an empty list if none exists.',
    4: 'Every node starts assumed to have zero unresolved prerequisites; the loop below fills in the real counts.',
    5: 'Builds the outgoing adjacency list so that once a node is placed, we can instantly find everything waiting on it.',
    6: 'Walks every edge once to build both the adjacency list and the in-degree counts in a single pass.',
    7: 'Records that v depends on u, so placing u later needs to notify v.',
    8: "Increments v's prerequisite count for this edge — the number Kahn's algorithm watches to decide when v is finally ready.",
    10: 'Seeds the ready queue with every node that starts with zero prerequisites — the only valid starting points for the ordering.',
    11: 'The output sequence being built, one ready node at a time.',
    13: 'Keeps scheduling as long as some node with no remaining prerequisites is available.',
    14: 'Pulls the next ready node off the front of the queue.',
    15: "Commits u to the schedule — every prerequisite it ever had is already placed before this line runs.",
    16: "Looks at everything that depended on u, since placing u just resolved one of their prerequisites.",
    17: "Decrements v's remaining-prerequisite count now that u — one of its dependencies — has been scheduled.",
    18: 'Checks whether v has just become fully unblocked.',
    19: 'v has no prerequisites left, so it joins the ready queue as a valid next pick.',
    21: 'If every node made it into the order, the schedule is valid; if some are missing, they were stuck waiting on each other in a cycle, so we report failure with an empty list.',
  },
};

export const topologicalSort: AlgorithmDefinition<TopologicalSortInput> = {
  id: 'topological-sort',
  title: "Topological Sort (Kahn's Algorithm)",
  category: 'graph_directed_and_scc',
  difficulty: 'Medium',
  description:
    "Kahn's algorithm produces a linear ordering of the vertices in a Directed Acyclic Graph (DAG) such that for every edge u -> v, vertex u appears before vertex v. It works by tracking each node's in-degree and repeatedly dequeuing nodes with no remaining prerequisites. This is the classic tool for task scheduling, build-order resolution, and course prerequisite planning.",
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
  complexityAnalysis: {
    time: "Every vertex enters and leaves the queue exactly once, and every edge is examined exactly once — at the moment its source node is dequeued and the neighbor's in-degree is decremented. That single pass over vertices plus edges gives O(V + E) in every case.",
    space: 'The in-degree map, the queue, and the output order each hold at most one entry per vertex, so extra memory grows linearly with the vertex count — O(V).',
  },
  topicGuide: TOPOLOGICAL_SORT_TOPIC_GUIDE,
  trivia: TOPOLOGICAL_SORT_TRIVIA,
  defaultInput: DEFAULT_TOPO_SORT_INPUT,
  generateSteps: generateTopologicalSortSteps,
};
