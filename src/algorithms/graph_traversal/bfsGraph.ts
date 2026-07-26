import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

export interface BFSGraphInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  startNodeId: string;
}

export const BFS_GRAPH_CODE = `from collections import deque

def bfs(graph, start_node):
    visited = {start_node}
    queue = deque([start_node])
    
    while queue:
        current = queue.popleft()
        for neighbor in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`;

export const DEFAULT_BFS_INPUT: BFSGraphInput = {
  startNodeId: 'A',
  nodes: [
    { id: 'A', label: 'A', x: 100, y: 100, state: 'default' },
    { id: 'B', label: 'B', x: 200, y: 50, state: 'default' },
    { id: 'C', label: 'C', x: 200, y: 150, state: 'default' },
    { id: 'D', label: 'D', x: 300, y: 50, state: 'default' },
    { id: 'E', label: 'E', x: 300, y: 150, state: 'default' },
    { id: 'F', label: 'F', x: 400, y: 100, state: 'default' },
  ],
  edges: [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'C', to: 'E' },
    { from: 'D', to: 'F' },
    { from: 'E', to: 'F' },
  ],
};

export const generateBFSGraphSteps = (input: BFSGraphInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes: GraphNodeItem[] = input.nodes.map((node) => ({
    ...node,
    state: 'default',
  }));

  const edges: GraphEdgeItem[] = input.edges.map((edge) => ({
    ...edge,
    isTraversed: false,
  }));

  const queue: string[] = [];
  const visitedSet = new Set<string>();

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'graph',
        nodes: nodes.map((n) => ({ ...n })),
        edges: edges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        queue: [...queue],
        visited: Array.from(visitedSet),
      },
      variables,
    });
  };

  const startId = input.startNodeId;
  const startNodeExists = nodes.some((n) => n.id === startId);

  addStep(
    3,
    `Start BFS from node ${startId}`,
    `We'll explore the graph in rings of distance from '${startId}': first its direct neighbors, then their neighbors, and so on — a first-in-first-out queue keeps that order for us.`,
    { startNode: startId }
  );

  if (!startNodeExists || nodes.length === 0) {
    addStep(
      3,
      'BFS complete — no valid start node',
      `'${startId}' isn't a vertex of this graph, so there is nothing to explore and we stop right away.`,
      { startNode: startId }
    );
    return steps;
  }

  // Line 4: visited = {start_node}
  visitedSet.add(startId);
  const startNode = nodes.find((n) => n.id === startId);
  if (startNode) {
    startNode.state = 'visited';
  }

  addStep(
    4,
    `Mark ${startId} as visited`,
    `We record '${startId}' as seen before exploring anything, so if a cycle ever leads back here we won't process it twice.`,
    { startNode: startId, visitedCount: visitedSet.size }
  );

  // Line 5: queue = deque([start_node])
  queue.push(startId);
  if (startNode) {
    startNode.state = 'queued';
  }

  addStep(
    5,
    `Enqueue start node ${startId}`,
    `The queue now holds our entire frontier — just '${startId}', the only node at distance 0.`,
    { startNode: startId, queueLength: queue.length }
  );

  // Helper to find undirected neighbors
  const getNeighbors = (nodeId: string): string[] => {
    const neighbors: string[] = [];
    for (const edge of edges) {
      if (edge.from === nodeId) neighbors.push(edge.to);
      else if (edge.to === nodeId) neighbors.push(edge.from);
    }
    return neighbors;
  };

  while (queue.length > 0) {
    addStep(
      7,
      `Check the queue (${queue.length} waiting)`,
      `The queue still has nodes in it, which means part of the frontier is unexplored — so we keep going.`,
      { queueLength: queue.length }
    );

    const currentId = queue.shift()!;
    const currentNode = nodes.find((n) => n.id === currentId);
    if (currentNode) {
      currentNode.state = 'active';
    }

    addStep(
      8,
      `Dequeue node ${currentId}`,
      `Because the queue is first-in-first-out, '${currentId}' comes out at the smallest edge distance we could ever reach it — this is exactly why BFS finds shortest paths in unweighted graphs.`,
      { current: currentId, queueLength: queue.length }
    );

    const neighbors = getNeighbors(currentId);

    addStep(
      9,
      `Explore ${currentId}'s neighbors`,
      `We follow every edge out of '${currentId}' to see which of [${neighbors.join(', ')}] we haven't met yet.`,
      { current: currentId, neighborCount: neighbors.length }
    );

    for (const neighborId of neighbors) {
      // Mark edge traversed
      const edge = edges.find(
        (e) =>
          (e.from === currentId && e.to === neighborId) ||
          (e.from === neighborId && e.to === currentId)
      );
      if (edge) {
        edge.isTraversed = true;
      }

      const isVisited = visitedSet.has(neighborId);

      addStep(
        10,
        `Check neighbor ${neighborId}`,
        isVisited
          ? `We've already seen '${neighborId}' — an earlier, equally short or shorter path got there first, so we skip it.`
          : `'${neighborId}' is new to us, so we'll mark it as seen and queue it up for the next ring.`,
        { current: currentId, neighbor: neighborId, isVisited }
      );

      if (!isVisited) {
        visitedSet.add(neighborId);
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode) {
          neighborNode.state = 'visited';
        }

        addStep(
          11,
          `Mark neighbor ${neighborId} as visited`,
          `We flag '${neighborId}' the moment we discover it, so another node in this same layer can't add it to the queue a second time.`,
          { neighbor: neighborId, visitedCount: visitedSet.size }
        );

        queue.push(neighborId);
        if (neighborNode) {
          neighborNode.state = 'queued';
        }

        addStep(
          12,
          `Enqueue neighbor ${neighborId}`,
          `'${neighborId}' joins the back of the queue, scheduled for expansion after everything already waiting — that's what keeps the layers in order.`,
          { neighbor: neighborId, queueLength: queue.length }
        );
      }
    }

    if (currentNode) {
      currentNode.state = 'visited';
    }
  }

  addStep(
    7,
    'Queue is empty — stop',
    `Nothing is left to expand, so every node reachable from '${startId}' has been visited.`,
    { queueLength: 0 }
  );

  addStep(
    3,
    'Traversal complete',
    `We visited all ${visitedSet.size} reachable nodes, layer by layer, from '${startId}'. Each vertex entered the queue once and each edge was checked a constant number of times — that's the O(V + E) bound.`,
    { startNode: startId, totalVisited: visitedSet.size }
  );

  return steps;
};

/* The `def` header is skipped, but the deque import is not: forgetting it is a
   real recall failure. Distractors cover the two ways BFS degenerates — popping
   the wrong end, and marking visited at dequeue time instead of discovery. */
const BFS_GRAPH_TRIVIA: TriviaMeta = {
  skipLines: [3],
  distractors: [
    'current = queue.pop()',
    'visited = set()',
    'queue.appendleft(neighbor)',
    'if neighbor in visited:',
    'visited.add(current)',
  ],
  hints: [
    {
      line: 4,
      hint: 'Seed the seen-set with the origin itself, so it can never be discovered a second time.',
    },
    {
      line: 5,
      hint: 'Build the frontier from a structure with a cheap front, holding just the origin to begin with.',
    },
    {
      line: 8,
      hint: 'Take whichever node has waited longest — that FIFO choice is the whole difference from DFS.',
    },
    {
      line: 11,
      hint: 'Claim the neighbour the moment it is discovered, not when it is later processed, or it can enter the frontier twice.',
    },
  ],
};

export const bfsGraph: AlgorithmDefinition<BFSGraphInput> = {
  id: 'bfs-graph',
  title: 'BFS Graph Traversal',
  category: 'graph_traversal',
  difficulty: 'Medium',
  description:
    'Breadth-First Search (BFS) explores a graph layer by layer from a source node: all distance-1 neighbors first, then distance-2, and so on. A first-in-first-out queue keeps the layers in order while a visited set stops cycles from causing repeat visits. Because nodes are reached in order of distance, BFS finds the shortest path (fewest edges) from the source to every reachable vertex in an unweighted graph.',
  constraints: [
    '1 <= Number of vertices V <= 10^4',
    '0 <= Number of edges E <= 10^5',
    'Vertices are uniquely labeled strings or integers',
    'The graph can be directed or undirected and may contain cycles',
    'Start node must be a valid vertex present in the graph',
  ],
  examples: [
    {
      input: 'startNode = "A", edges = [A-B, A-C, B-D, C-E, D-F, E-F]',
      output: 'Visited order: A, B, C, D, E, F',
      explanation:
        'Starting at A, BFS first visits distance-1 neighbors B and C, then distance-2 neighbors D and E, and finally distance-3 neighbor F.',
    },
    {
      input: 'startNode = "A", disconnected components {A-B} and {C-D}',
      output: 'Visited set: {A, B}',
      explanation:
        'BFS only visits nodes in the connected component reachable from source node A. Isolated component {C, D} remains unvisited.',
    },
  ],
  code: BFS_GRAPH_CODE,
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  complexityAnalysis: {
    time: 'Each vertex enters the queue at most once — the visited set guarantees it — and is dequeued and processed once, which accounts for the V term. When a vertex is dequeued we scan its incident edges, and over the whole run every edge is looked at only a constant number of times, adding the E term. The total is O(V + E) in every case, because BFS always sweeps the entire reachable component.',
    space: 'The visited set can end up holding every vertex, and the queue can hold a whole frontier of vertices at once, so extra memory grows with the vertex count — O(V).',
  },
  topicGuide: {
    overview:
      'Breadth-first search explores a graph in rings around a starting vertex: everything one edge away, then everything two edges away, and so on until the reachable part of the graph is exhausted. That ordering is not a stylistic preference but the source of its main guarantee, because the first time BFS reaches a vertex it has necessarily arrived by a path with the fewest possible edges. It is the traversal to reach for whenever "shortest", "fewest moves", or "closest" appears in an unweighted setting, and it is the backbone of grid puzzles, maze solving, social-distance queries, and web crawling. The whole algorithm is a queue, a visited set, and the discipline to never look at a vertex twice.',
    sections: [
      {
        heading: 'The core idea: a queue turns a graph into layers',
        body: 'A traversal is defined by which discovered-but-unexplored vertex you choose to expand next, and BFS always chooses the one that has been waiting longest. A first-in-first-out queue enforces that choice mechanically, so vertices leave the queue in the same order they were discovered. Because a vertex is discovered from a neighbour one edge closer to the source, this ordering keeps the queue sorted by distance from the source at all times. In the sample graph, starting at A the queue holds B and C, then D and E, then F, which is exactly the layer structure of the graph drawn out. Swap the queue for a stack and you get depth-first search instead, which is why these two famous traversals differ by a single data-structure choice.',
      },
      {
        heading: 'How the mechanism works: visit, mark, enqueue',
        body: 'You seed the visited set and the queue with the source, then loop while the queue is non-empty. Each iteration pops the front vertex, scans its adjacency list, and for every neighbour not yet in the visited set adds it to visited and pushes it onto the back of the queue. The critical detail is that a vertex is marked visited the moment it is enqueued, not when it is later dequeued. If you delay the mark until dequeue, a vertex with several neighbours in the current layer gets pushed multiple times, and the queue can blow up while your traversal reports duplicate visits. If you need distances or the actual path, store a distance or parent value alongside the mark at the same instant, since that is exactly when the shortest path to that vertex is fixed.',
      },
      {
        heading: 'Why it is correct: distances never go backwards',
        body: 'The invariant that carries BFS is that at every moment the queue contains vertices from at most two consecutive layers, with the nearer layer in front, and every vertex in the queue is labelled with its true shortest distance from the source. Expanding a vertex at distance d can only discover unvisited neighbours at distance d + 1, so appending them to the back keeps the queue ordered and the invariant intact. This is what licenses the first-visit rule: when you reach a vertex for the first time, no shorter route can exist, because every route with fewer edges would have come from an earlier layer that was already fully expanded. Any later edge into that vertex therefore offers nothing better and can be ignored, which is why marking on discovery loses no correctness. Notice how much this argument depends on all edges costing the same, and that is precisely the assumption Dijkstra has to replace when weights differ.',
      },
      {
        heading: 'When to use BFS versus the alternatives',
        body: 'Choose BFS when edges are unweighted or uniformly weighted and you care about distance, since it gives shortest paths with nothing more than a queue. Choose depth-first search when you want to go deep rather than wide, as in cycle detection, topological ordering, or exploring every path, and when its recursion structure makes the bookkeeping natural. Once edges carry different positive weights, BFS is simply wrong and you need Dijkstra with a priority queue; the special case of weights that are only 0 or 1 has a neat middle ground called 0-1 BFS using a deque. If you are searching a huge space toward a known target, bidirectional BFS from both ends can cut the explored frontier dramatically, and A-star adds a heuristic when you have a sensible distance estimate.',
      },
      {
        heading: 'Pitfalls and edge cases',
        body: 'BFS only reaches the connected component containing the source, so counting all components means restarting it from every unvisited vertex, and the sample disconnected case is a reminder that unvisited does not mean unreachable by mistake. Watch out for graphs represented so that a missing key throws instead of returning an empty neighbour list, and for the source vertex needing to be in visited before the loop starts. Self loops and parallel edges are harmless if you check visited before enqueuing, but they will cause duplicates if you skip that check. Memory is the sneakier problem: the frontier of a broad graph can be a large fraction of all vertices at once, so BFS can use far more memory than DFS on the same graph. Directed graphs also make the traversal one-way, so reachability from A says nothing about reachability back to A.',
      },
      {
        heading: 'How the pattern generalizes',
        body: 'Once the loop is familiar, most BFS problems are small variations on it. Recording the queue length before each round and draining exactly that many vertices gives you an explicit layer number, which is how minimum-moves puzzles report their answer. Seeding the queue with several vertices at once turns it into multi-source BFS, which computes the distance to the nearest of many starts in one sweep and solves rotting-oranges and nearest-exit problems directly. Colouring vertices by alternating layers checks whether a graph is bipartite. On grids the graph is implicit, with cells as vertices and the four or eight step directions as edges, so no adjacency list needs building at all. State-space search generalizes further still, treating any configuration such as a board layout or a word as a vertex and legal transformations as edges.',
      },
    ],
    keyTerms: [
      {
        term: 'Frontier',
        definition:
          'The set of discovered vertices still waiting to be expanded, which is exactly what the queue holds. Its size at the widest layer determines the memory BFS actually needs.',
      },
      {
        term: 'Layer',
        definition:
          'All vertices at the same edge distance from the source. BFS processes layers strictly in order, and that order is what makes its distances shortest.',
      },
      {
        term: 'Visited set',
        definition:
          'The record of vertices already discovered, which prevents cycles from causing infinite loops and repeated work. Adding to it at discovery time rather than expansion time is what keeps the queue free of duplicates.',
      },
      {
        term: 'Adjacency list',
        definition:
          'A representation storing, for each vertex, the collection of vertices it links to. It lets BFS scan only the edges that actually exist rather than testing every possible pair.',
      },
      {
        term: 'Connected component',
        definition:
          'A maximal group of vertices mutually reachable through edges. A single BFS explores exactly one of them, which is why component counting restarts the search from each unvisited vertex.',
      },
    ],
  },
  trivia: BFS_GRAPH_TRIVIA,
  defaultInput: DEFAULT_BFS_INPUT,
  generateSteps: generateBFSGraphSteps,
};
