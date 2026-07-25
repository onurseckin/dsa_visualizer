import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  TopicGuide,
} from '../../types/dsa';

export interface BellmanFordInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
  startNode: string;
}

export const BELLMAN_FORD_CODE = `def bellman_ford(nodes, edges, start_node):
    dist = {node: float('inf') for node in nodes}
    dist[start_node] = 0

    # Relax edges V - 1 times
    for i in range(len(nodes) - 1):
        for u, v, weight in edges:
            if dist[u] != float('inf') and dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight

    # Check for negative-weight cycles
    has_negative_cycle = False
    for u, v, weight in edges:
        if dist[u] != float('inf') and dist[u] + weight < dist[v]:
            has_negative_cycle = True
            break

    return dist, has_negative_cycle`;

export const DEFAULT_BELLMAN_FORD_INPUT: BellmanFordInput = {
  nodes: ['S', 'A', 'B', 'C', 'D'],
  edges: [
    { from: 'S', to: 'A', weight: 4 },
    { from: 'S', to: 'B', weight: 2 },
    { from: 'B', to: 'A', weight: 1 },
    { from: 'A', to: 'C', weight: 3 },
    { from: 'B', to: 'C', weight: 5 },
    { from: 'B', to: 'D', weight: 4 },
    { from: 'C', to: 'D', weight: -2 },
  ],
  startNode: 'S',
};

export const generateBellmanFordSteps = (input: BellmanFordInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = input.nodes || [];
  const rawEdges = input.edges || [];
  const startNode = input.startNode || (rawNodes[0] ?? '');

  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  if (startNode && dist[startNode] !== undefined) {
    dist[startNode] = 0;
  }

  const getGraphNodes = (activeNodeId?: string): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === Infinity ? '∞' : dist[id]})`,
      state: id === activeNodeId ? 'active' : dist[id] !== Infinity ? 'visited' : 'default',
    }));

  const getGraphEdges = (activeEdge?: { from: string; to: string }): GraphEdgeItem[] =>
    rawEdges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight,
      isTraversed: activeEdge?.from === e.from && activeEdge?.to === e.to,
      isPath: dist[e.to] !== Infinity && dist[e.from] !== Infinity && dist[e.from] + e.weight === dist[e.to],
    }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNodeId?: string,
    activeEdge?: { from: string; to: string }
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
        kind: 'graph',
        nodes: getGraphNodes(activeNodeId),
        edges: getGraphEdges(activeEdge),
      },
      auxiliaryState: {
        distanceTable: distTableFormatted,
        visited: rawNodes.filter((n) => dist[n] !== Infinity),
        customState: {
          'Start Node': startNode,
          'Node Count': rawNodes.length,
          'Edge Count': rawEdges.length,
        },
      },
      variables,
    });
  };

  // Line 1 & 2: Initialization
  addStep(
    1,
    'Start Bellman-Ford',
    `Our plan is to sweep over every edge up to ${Math.max(0, rawNodes.length - 1)} times, because a shortest path in a graph with ${rawNodes.length} vertices can use at most ${Math.max(0, rawNodes.length - 1)} edges. Each sweep lets improvements travel one edge further from the source.`,
    { nodeCount: rawNodes.length, edgeCount: rawEdges.length }
  );

  if (rawNodes.length === 0) {
    addStep(18, 'Bellman-Ford complete', 'The graph has no vertices, so there is nothing to relax — we return an empty distance table.', { completed: true });
    return steps;
  }

  addStep(
    3,
    `Set dist['${startNode}'] to 0`,
    `We know exactly one distance so far: '${startNode}' is 0 away from itself. Every other node starts at ∞, which is our way of saying "no path found yet."`,
    { startNode, 'dist[startNode]': 0 },
    startNode
  );

  // Outer loop: V - 1 passes
  const numPasses = Math.max(0, rawNodes.length - 1);

  for (let pass = 0; pass < numPasses; pass++) {
    let anyRelaxedInPass = false;
    addStep(
      6,
      `Start relaxation pass ${pass + 1} of ${numPasses}`,
      `Each sweep lets shortest-path information travel one more edge outward from the source. After pass ${pass + 1}, every vertex whose best path uses at most ${pass + 1} edges will have its true distance.`,
      { pass: pass + 1, numPasses }
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
          `Going through '${u}' reaches '${v}' at cost ${dist[v] - weight} + ${weight} = ${dist[v]}, which beats the previous ${oldDist === Infinity ? '∞' : oldDist}. We take the cheaper route and keep sweeping.`,
          { pass: pass + 1, u, v, weight, newDist: dist[v] },
          v,
          { from: u, to: v }
        );
      } else {
        addStep(
          8,
          `Skip edge ${u} → ${v}`,
          dist[u] === Infinity
            ? `We haven't found any path to '${u}' yet — its distance is still ∞ — so this edge can't offer '${v}' a real route this pass.`
            : `The best known route to '${v}' (${dist[v] === Infinity ? '∞' : dist[v]}) is already at least as good as going through '${u}' (${dist[u]} + ${weight} = ${dist[u] + weight}), so we leave it alone.`,
          { pass: pass + 1, u, v, weight },
          u,
          { from: u, to: v }
        );
      }
    }

    if (!anyRelaxedInPass) {
      addStep(
        6,
        `Stop early after pass ${pass + 1}`,
        'An entire sweep changed nothing, so every distance has already settled. Running the remaining passes would only re-confirm what we know.',
        { convergedEarly: true, pass: pass + 1 }
      );
      break;
    }
  }

  // Check for negative weight cycles
  let hasNegativeCycle = false;
  addStep(
    12,
    'Check for negative-weight cycles',
    'After V - 1 passes every true shortest path is settled, so we do one more sweep as a test. If any edge can still improve a distance, the only possible explanation is a cycle with negative total weight.',
    { checkingNegativeCycles: true }
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
        { from: u, to: v }
      );
      break;
    }
  }

  if (!hasNegativeCycle) {
    addStep(
      18,
      'Bellman-Ford complete',
      `No edge can improve any distance, so the table now holds the true shortest path from '${startNode}' to every reachable vertex. In the end we did up to V - 1 sweeps over all E edges — that's the O(V * E) bound.`,
      { hasNegativeCycle: false, completed: true }
    );
  } else {
    addStep(
      18,
      'Bellman-Ford complete: negative cycle found',
      'Because a reachable cycle has negative total weight, "shortest path" stops being well-defined — we could loop around that cycle forever, driving the cost down without bound.',
      { hasNegativeCycle: true, completed: true }
    );
  }

  return steps;
};

const BELLMAN_FORD_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Bellman-Ford solves the same single-source shortest path problem as Dijkstra's algorithm, but it abandons the requirement that edge weights be non-negative. Rather than trusting a greedy order, it relaxes every edge in the graph over and over and lets improvements ripple outward one hop per sweep. That makes it the right tool whenever a cost can be negative — a rebate, a currency gain, energy recovered instead of spent — and it comes with a bonus no greedy method can offer: it can tell you when the question has no answer at all because a negative cycle exists. The trade you accept is doing far more redundant work in exchange for that robustness.",
  sections: [
    {
      heading: 'Relax everything, then do it again',
      body: "The insight is that you do not need to know which edge to relax next if you are willing to relax all of them. After one full sweep over the edge list, every shortest path that uses a single edge is definitely correct; after two sweeps, every shortest path using at most two edges is correct, and so on. Since a shortest path never needs to repeat a vertex, it can span at most V - 1 edges, so V - 1 sweeps are enough to settle every distance in the graph. You are effectively doing dynamic programming where the stage is the number of edges a path is allowed to use, and the edge list is the transition table.",
    },
    {
      heading: 'What one sweep actually does',
      body: "A sweep walks the edge list in whatever order it happens to be stored and, for each edge from u to v, asks whether the distance already known for u plus that edge's weight beats the distance recorded for v. When it does, you overwrite v's entry, and that improvement is immediately visible to later edges in the same sweep — which is why a lucky edge ordering can converge in one pass while an unlucky one needs all V - 1. You must guard the comparison by checking that u is reachable at all, because adding a weight to infinity is meaningless and, with negative weights, can even manufacture a finite distance to an unreachable vertex. A sweep that changes nothing proves the table has converged, so tracking that flag lets you stop early instead of grinding through the remaining passes.",
    },
    {
      heading: 'Why V - 1 sweeps are exactly enough',
      body: 'The invariant to hold in mind is that after k sweeps, the table holds the true cost of the best path to each vertex among all paths using no more than k edges. Proving the step is easy: an optimal path with k + 1 edges is an optimal path with k edges followed by one final edge, and that final edge is guaranteed to be relaxed during sweep k + 1. Because an optimal path in a graph with no negative cycle never revisits a vertex, it has at most V - 1 edges, so the invariant at k = V - 1 already covers every optimal path there is. This is also why the bound is tight rather than pessimistic — a long chain of vertices relaxed in exactly the wrong order really does need every sweep.',
    },
    {
      heading: 'Negative cycles: detection, not repair',
      body: 'Run one extra sweep after the V - 1 are done. If any edge can still be relaxed, no simple path explanation is possible, so some negative-weight cycle must be reachable from the source, and that is precisely what the extra pass detects. When such a cycle exists, "shortest path" stops being well defined for the vertices it can reach, because looping the cycle once more always lowers the total, driving the cost toward negative infinity. Bellman-Ford does not repair this — it reports it, which in practice is often the whole point, as in arbitrage detection where the negative cycle is the profitable trade you were looking for. If you need to know which vertices are spoiled rather than just that something is wrong, you can propagate the "unbounded" mark forward from any still-relaxable edge.',
    },
    {
      heading: 'Choosing it over the alternatives',
      body: "With strictly non-negative weights Dijkstra's algorithm is the better choice and you should default to it; Bellman-Ford earns its keep only when negativity or cycle detection is in play. If the graph happens to be acyclic, forget sweeps entirely and relax edges in topological order, which settles every distance in a single pass regardless of sign. For all-pairs questions on graphs with negative edges, Bellman-Ford becomes a subroutine rather than the answer: Johnson's algorithm runs it once from an artificial source to compute a reweighting that removes negative weights, then runs Dijkstra from every vertex. The queue-based refinement often called SPFA keeps only vertices whose distance changed, which is much faster on typical graphs but has no better worst case, so it is an optimization rather than a different algorithm.",
    },
    {
      heading: 'Pitfalls and practical notes',
      body: "Do not confuse a negative edge with a negative cycle: negative edges alone are entirely fine here, and only a cycle whose total weight is negative breaks the problem. Remember that detection is scoped to cycles reachable from your source — a negative cycle sitting in a disconnected corner of the graph cannot affect any distance you compute, so it will not and should not be flagged. On undirected graphs a single negative edge is automatically a negative cycle, since you can walk back and forth across it, which is why negative weights are really a directed-graph topic. Finally, keep the early-exit check honest: stop when a sweep changes nothing, not when it changes little, or you will report distances that have not finished settling.",
    },
  ],
  keyTerms: [
    {
      term: 'Edge relaxation',
      definition:
        "The single operation the whole algorithm is built from: if the distance to u plus the weight of edge u to v is smaller than the recorded distance to v, replace v's distance with the better value.",
    },
    {
      term: 'Sweep (pass)',
      definition:
        'One complete traversal of the entire edge list, relaxing each edge once. Each sweep extends the set of correct answers by one more edge of path length.',
    },
    {
      term: 'Negative-weight cycle',
      definition:
        'A directed cycle whose edge weights sum to less than zero. Any vertex reachable through one has no shortest distance, because every extra lap around the cycle makes the total cheaper.',
    },
    {
      term: 'Reachability guard',
      definition:
        'The check that skips an edge whose source is still at infinity. It stops the algorithm from arithmetic on an unreachable distance, which negative weights would otherwise turn into a bogus finite answer.',
    },
    {
      term: 'Early termination',
      definition:
        'Stopping as soon as a full sweep produces no update. The table cannot change again after such a sweep, so the remaining passes would be pure waste.',
    },
  ],
};

export const bellmanFord: AlgorithmDefinition<BellmanFordInput> = {
  id: 'bellman-ford',
  title: 'Bellman-Ford Shortest Path',
  category: 'graph_shortest_paths',
  difficulty: 'Medium',
  description:
    "Bellman-Ford computes shortest paths from one source vertex to every other vertex in a weighted graph — and unlike Dijkstra's algorithm, it tolerates negative edge weights. The idea is simple: relax every edge, and repeat that sweep V - 1 times so improvements can propagate along even the longest simple path. A final extra sweep doubles as a detector: if any edge can still be relaxed after V - 1 passes, the graph must contain a negative-weight cycle reachable from the source.",
  constraints: [
    '1 <= Vertices V <= 250',
    '0 <= Edges E <= 2500',
    '-10^4 <= Edge Weight <= 10^4',
    'Start node must exist in the graph',
    'Graphs may contain negative edge weights and negative cycles',
  ],
  examples: [
    {
      input: 'StartNode = S, Nodes = [S,A,B,C,D], Edges = [S->A(4), S->B(2), B->A(1), A->C(3), B->C(5), B->D(4), C->D(-2)]',
      output: 'Distances: S:0, A:3, B:2, C:6, D:4',
      explanation:
        'Iterative edge relaxation updates S->B (2), S->A via B (2+1=3), S->C via A (3+3=6), and S->D via C (6-2=4). No negative cycles detected.',
    },
    {
      input: 'StartNode = A, Nodes = [A, B, C], Edges = [A->B(1), B->C(-2), C->B(-1)]',
      output: 'Negative Cycle Detected: True',
      explanation:
        'Cycle B -> C -> B has total weight (-2) + (-1) = -3. Iterative relaxation continues decreasing distance indefinitely.',
    },
  ],
  code: BELLMAN_FORD_CODE,
  timeComplexity: {
    best: 'O(E)',
    average: 'O(V * E)',
    worst: 'O(V * E)',
  },
  spaceComplexity: 'O(V)',
  complexityAnalysis: {
    time: 'Each pass sweeps all E edges once, and we run up to V - 1 passes so that an improvement can travel across the longest possible simple path — that product gives the O(V * E) worst case. When the graph converges early, a pass with zero updates lets us stop, so the best case is a single O(E) sweep.',
    space: 'We keep one distance value per vertex, so extra memory grows linearly with the vertex count — O(V). The edge list is just the input; nothing else accumulates.',
  },
  topicGuide: BELLMAN_FORD_TOPIC_GUIDE,
  defaultInput: DEFAULT_BELLMAN_FORD_INPUT,
  generateSteps: generateBellmanFordSteps,
};
