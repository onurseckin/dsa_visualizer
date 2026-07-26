import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphEdgeItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface DijkstraInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
  startNode: string;
}

export const DIJKSTRA_CODE = `import heapq

def dijkstra(nodes, edges, start_node):
    dist = {node: float('inf') for node in nodes}
    dist[start_node] = 0
    pq = [(0, start_node)]
    visited = set()

    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)

        for edge in edges:
            if edge['from'] == u:
                v, weight = edge['to'], edge['weight']
                if dist[u] + weight < dist[v]:
                    dist[v] = dist[u] + weight
                    heapq.heappush(pq, (dist[v], v))

    return dist`;

export const DEFAULT_DIJKSTRA_INPUT: DijkstraInput = {
  nodes: ["A", "B", "C", "D", "E"],
  edges: [
    { from: "A", to: "B", weight: 4 },
    { from: "A", to: "C", weight: 2 },
    { from: "B", to: "C", weight: 1 },
    { from: "B", to: "D", weight: 5 },
    { from: "C", to: "D", weight: 8 },
    { from: "C", to: "E", weight: 10 },
    { from: "D", to: "E", weight: 2 },
  ],
  startNode: "A",
};

export const generateDijkstraSteps = (input: DijkstraInput): AlgorithmStep[] => {
  const rawNodes = input.nodes || ["A", "B", "C", "D", "E"];
  const rawEdges = input.edges || [];
  const startNode = input.startNode || "A";

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  if (rawNodes.length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 3,
      explanation: {
        what: "Initialize on an empty graph",
        why: "There are no nodes to explore, so we finish immediately with an empty distance table.",
      },
      primarySnapshot: { kind: "graph", nodes: [], edges: [] },
      auxiliaryState: { customState: { NodeCount: 0 } },
      variables: { completed: true },
    });
    return steps;
  }

  const dist: Record<string, number> = {};
  rawNodes.forEach((n) => (dist[n] = Infinity));
  dist[startNode] = 0;

  const visited = new Set<string>();
  const pq: [number, string][] = [[0, startNode]];

  const getGraphNodes = (activeId?: string): GraphNodeItem[] =>
    rawNodes.map((id) => ({
      id,
      label: `${id} (${dist[id] === Infinity ? "∞" : dist[id]})`,
      state: id === activeId ? "active" : visited.has(id) ? "visited" : "default",
    }));

  const getGraphEdges = (activeEdge?: { from: string; to: string }): GraphEdgeItem[] =>
    rawEdges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight,
      isTraversed:
        activeEdge?.from === e.from && activeEdge?.to === e.to
          ? true
          : visited.has(e.from) && visited.has(e.to),
    }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Set dist['${startNode}'] to 0`,
      why: `We only know one distance for sure: '${startNode}' is 0 away from itself, so every other node starts at ∞ until we find a path to it. We seed the priority queue with (0, '${startNode}') so the closest frontier node is always the next one out.`,
    },
    primarySnapshot: { kind: "graph", nodes: getGraphNodes(startNode), edges: getGraphEdges() },
    auxiliaryState: {
      queue: pq.map(([d, u]) => `${u}:${d}`),
      visited: Array.from(visited),
      distanceTable: { ...dist },
    },
    variables: { startNode, currentDist: 0 },
  });

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Pop '${u}' at distance ${d}`,
        why: `Of everything we haven't visited, '${u}' is the closest we can currently reach, at distance ${d}. Since no edge weight is negative, no detour could ever beat that, so we lock ${d} in as final and mark '${u}' visited.`,
      },
      primarySnapshot: { kind: "graph", nodes: getGraphNodes(u), edges: getGraphEdges() },
      auxiliaryState: {
        queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { u, d },
    });

    const neighbors = rawEdges.filter((e) => e.from === u);
    for (const edge of neighbors) {
      const v = edge.to;
      const oldDist = dist[v];
      const newDist = dist[u] + edge.weight;

      if (newDist < dist[v]) {
        dist[v] = newDist;
        pq.push([newDist, v]);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 19,
          explanation: {
            what: `Relax edge ${u} → ${v}`,
            why: `Going through '${u}' reaches '${v}' at cost ${newDist - edge.weight} + ${edge.weight} = ${newDist}, beating its old distance of ${oldDist === Infinity ? "∞" : oldDist}. We record the shortcut and queue (${newDist}, '${v}') so its neighbors get a chance to benefit too.`,
          },
          primarySnapshot: {
            kind: "graph",
            nodes: getGraphNodes(v),
            edges: getGraphEdges({ from: u, to: v }),
          },
          auxiliaryState: {
            queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
            visited: Array.from(visited),
            distanceTable: { ...dist },
          },
          variables: { u, v, weight: edge.weight, newDist },
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: "Read off the completed distance table",
      why: `The queue is empty, so every node reachable from '${startNode}' has been visited and finalized. As a closing note: with a binary heap, all those pops and pushes together cost O((V + E) log V).`,
    },
    primarySnapshot: { kind: "graph", nodes: getGraphNodes(), edges: getGraphEdges() },
    auxiliaryState: {
      visited: Array.from(visited),
      distanceTable: { ...dist },
    },
    variables: { completed: true },
  });

  return steps;
};

const DIJKSTRA_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Dijkstra's algorithm answers the single-source shortest path question: starting from one vertex of a weighted graph, how cheaply can you reach every other vertex? Think of it as the weighted generalization of breadth-first search — instead of expanding whichever vertex is fewest hops away, you expand whichever vertex is cheapest to reach. You reach for it whenever edges carry a non-negative cost such as distance, travel time, toll, or network latency and you need the best route rather than merely some route. The price of admission is that no edge may be negative, and understanding why that restriction exists is most of understanding the algorithm.",
  sections: [
    {
      heading: "The greedy frontier",
      body: "Everything rests on a single observation: among all the vertices you have not finalized yet, the one with the smallest tentative distance cannot possibly get any cheaper. Any rival route to it would have to leave the finalized region through some other unfinalized vertex, and that vertex already costs at least as much to reach, so the detour can only add weight on top. That is why you are allowed to declare the cheapest frontier vertex solved and never look at it again. Seen this way you are not really searching for paths at all — you are growing a region of proven distances outward from the source, one vertex at a time, cheapest first.",
    },
    {
      heading: "How the mechanism actually runs",
      body: "You keep a distance table that starts at zero for the source and infinity everywhere else, plus a min-priority queue seeded with the source. Each round you pop the smallest entry; if that vertex is already visited you discard the entry, because it is a stale copy left behind by an earlier improvement. Otherwise you mark the vertex visited and relax each of its outgoing edges, meaning you check whether the vertex's own distance plus the edge weight beats the neighbour's recorded distance, and overwrite the table plus push the improved pair onto the queue when it does. Notice that nothing is ever deleted from the queue when a distance improves — you simply let the better entry surface first and skip the worse one later, a trick known as lazy deletion. When the queue drains, every reachable vertex has been popped exactly once and the table is final.",
    },
    {
      heading: "The invariant that makes it correct",
      body: "Stated precisely, the invariant is this: at the top of every round, each visited vertex holds its true shortest distance, and each unvisited vertex holds the cost of the best path that reaches it using only visited vertices as intermediate stops. Popping the minimum keeps both halves true, because the popped vertex could not have been reached more cheaply by any route, and relaxing its outgoing edges is exactly the bookkeeping needed to extend the second half to include the newly visited vertex. This is where non-negativity carries the whole argument: with a negative edge, a path could dip below the popped value after leaving the visited region, so the vertex you just declared finished would be wrong. Dijkstra gives you no warning when that happens — it quietly reports a distance that is too large, which is why negative weights force you to a different algorithm rather than a patched version of this one.",
    },
    {
      heading: "When to reach for it, and when not to",
      body: "If every edge weight is identical, plain breadth-first search produces the same answer with none of the priority-queue machinery, so save Dijkstra for genuinely weighted graphs. If even one weight can be negative, switch to Bellman-Ford, which sweeps every edge repeatedly instead of trusting a greedy order and can also report that a negative cycle makes the question meaningless. When you need distances between every pair of vertices rather than from one source, running Dijkstra once per vertex is a fine strategy on sparse graphs, while Floyd-Warshall's matrix formulation is simpler and often faster on dense ones. And when you have a geometric or domain hint about where the target lies, A* is this exact loop with a heuristic added to the queue key, ordering by estimated total trip cost instead of distance travelled so far.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "The bug that bites hardest is skipping the visited check after a pop: without it you reprocess vertices through stale entries and the run bloats badly on graphs where distances improve many times. Vertices with no path from the source stay at infinity, so treat that as a genuine answer meaning unreachable, and never add an edge weight to it or you will produce a nonsense finite number. Undirected graphs must store each edge in both directions; storing one direction quietly turns your map into a network of one-way streets. Zero-weight edges are perfectly legal, and ties in the queue can be broken any way you like, since when two frontier vertices are equally cheap either one is equally safe to finalize.",
    },
    {
      heading: "Generalizing the pattern",
      body: 'If you record, for each vertex, which edge last improved it, you get a parent pointer, and walking those pointers backwards from any target reconstructs the actual route instead of just its cost. The same loop also handles objectives other than a sum: replace "distance plus weight" with "the larger of distance and weight" and you compute minimum-bottleneck paths, or multiply survival probabilities and pop the largest instead of the smallest to find the most reliable route. What all of these share is monotonicity — extending a path must never make it better — which is the real precondition hiding behind the usual "no negative weights" phrasing. Recognizing that lets you apply the same frontier argument to problems that do not look like distances at all, such as cheapest currency conversions or lowest-latency service chains.',
    },
  ],
  keyTerms: [
    {
      term: "Tentative distance",
      definition:
        "The cheapest cost to a vertex that you have discovered so far. It only ever shrinks, and it becomes final the moment that vertex is popped from the priority queue.",
    },
    {
      term: "Relaxation",
      definition:
        "The check-and-update step that asks whether routing through the vertex you just finalized reaches a neighbour more cheaply, and rewrites that neighbour's tentative distance when the answer is yes.",
    },
    {
      term: "Visited (settled) set",
      definition:
        "The vertices whose shortest distances are already proven. Once a vertex joins this set it is never reprocessed, which is what lets you throw away stale queue entries on sight.",
    },
    {
      term: "Min-priority queue",
      definition:
        'The structure that always hands you the smallest pending distance next, normally a binary heap. It is what turns "find the closest unvisited vertex" from a scan of every vertex into a cheap pop.',
    },
    {
      term: "Lazy deletion",
      definition:
        "The convention of pushing an improved distance as a new queue entry rather than trying to update the old one, then ignoring outdated entries when they surface. It keeps the heap simple at the cost of holding a few obsolete pairs.",
    },
  ],
};

const DIJKSTRA_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "heapq gives an O(log n) binary min-heap — the priority queue that always hands back the frontier vertex with the smallest tentative distance next.",
    3: "Entry point: takes the vertex list, the weighted edge list, and the single source to compute shortest distances from.",
    4: "Every distance starts unknown (infinity) except where proven otherwise — we only trust a distance once some actual path has produced it.",
    5: "The one distance known for certain before any work begins: the source is zero away from itself.",
    6: "Seeds the priority queue with the source at distance 0, so it is the very first vertex popped.",
    7: "Tracks vertices whose shortest distance is already finalized, so we never waste work relaxing edges out of the same vertex twice.",
    9: "Keeps processing as long as some discovered vertex still awaits finalization.",
    10: "Pops the smallest tentative distance in the whole queue — the greedy choice that is only safe because no edge weight is negative.",
    11: "Detects a stale queue entry left behind by an earlier, since-improved distance to u.",
    12: "Discards that stale entry instead of reprocessing a vertex that has already been finalized.",
    13: "Locks in u's distance as final: with non-negative weights, no future path could ever beat what was just popped.",
    15: "Scans the edge list for every edge, since this implementation has no adjacency-list index to jump straight to u's outgoing edges.",
    16: "Filters down to just the edges leaving u — the only edges relaxation from u can possibly affect.",
    17: "Unpacks the neighbor and the cost of stepping onto it from u.",
    18: "The relaxation test: does routing through u beat the best route to v found so far?",
    19: "Records the cheaper route the instant one is found, improving v's tentative distance.",
    20: "Pushes the improved (distance, vertex) pair as a new entry rather than updating the old one in place — lazy deletion, which keeps the heap simple at the cost of a few stale duplicates.",
    22: "The queue is empty, so every reachable vertex has been popped and finalized — the table now holds true shortest distances.",
  },
};

export const dijkstraShortestPath: AlgorithmDefinition<DijkstraInput> = {
  id: "dijkstra-shortest-path",
  title: "Dijkstra's Shortest Path Algorithm",
  category: "graph_shortest_paths",
  difficulty: "Medium",
  description:
    "Dijkstra's algorithm finds the shortest path from one starting node to every other vertex in a weighted graph, as long as no edge weight is negative. It works greedily with a min-priority queue: repeatedly pop the unvisited vertex with the smallest tentative distance, finalize that distance, and relax its outgoing edges to see if any neighbor just got cheaper to reach. Because weights are non-negative, a vertex's distance can never improve after it is popped — which is exactly why the greedy choice is safe.",
  constraints: [
    "1 <= Vertices V <= 10^4",
    "0 <= Edges E <= 10^5",
    "0 <= Edge Weight <= 10^4 (non-negative edge weights required)",
    "Graph can be directed or undirected",
    "Source vertex must exist in the graph",
  ],
  examples: [
    {
      input:
        "StartNode = A, Nodes = [A, B, C, D, E], Edges = [A->B(4), A->C(2), B->C(1), B->D(5), C->D(8), C->E(10), D->E(2)]",
      output: "Distances: A:0, B:4, C:2, D:9, E:11",
      explanation:
        "1. Start A at dist 0. 2. Pop C (dist 2), relax C->E (12) and C->D (10). 3. Pop B (dist 4), relax B->D (9). 4. Pop D (dist 9), relax D->E (11). Final shortest path distances computed.",
    },
    {
      input: "StartNode = A, disconnected graph with nodes [A, B, C] and edge A->B(5)",
      output: "Distances: A:0, B:5, C:∞",
      explanation:
        "Node C is unreachable from source node A, maintaining an infinite distance value.",
    },
  ],
  code: DIJKSTRA_CODE,
  timeComplexity: {
    best: "O((V + E) log V)",
    average: "O((V + E) log V)",
    worst: "O((V + E) log V)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Every vertex is popped from the priority queue at most once, and every edge relaxation can push at most one new entry into it. Each heap push or pop costs O(log V), so across V pops and up to E pushes the total work is O((V + E) log V). Best and worst case match because we always drain the whole queue before stopping.",
    space:
      "The distance table and visited set each hold one entry per vertex, and the priority queue can briefly hold one stale entry per edge relaxation, so extra memory grows as O(V + E).",
  },
  topicGuide: DIJKSTRA_TOPIC_GUIDE,
  trivia: DIJKSTRA_TRIVIA,
  defaultInput: DEFAULT_DIJKSTRA_INPUT,
  generateSteps: generateDijkstraSteps,
};
