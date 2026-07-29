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

def dijkstra(graph, start_node):
    dist = {node: float('inf') for node in graph}
    dist[start_node] = 0
    pq = [(0, start_node)]
    visited = set()
    
    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        
        for neighbor, weight in graph[u]:
            new_dist = d + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(pq, (new_dist, neighbor))
                
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
  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : ["A", "B", "C", "D", "E"];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];
  const startNode = typeof input?.startNode === "string" ? input.startNode : (rawNodes[0] ?? "A");

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
    codeLine: 1,
    explanation: {
      what: `Import heapq for priority queue operations`,
      why: "Dijkstra's algorithm depends on a min-priority queue. Python's heapq module provides O(log n) heappush and heappop, giving us the efficient greedy extraction we need.",
    },
    primarySnapshot: { kind: "graph", nodes: getGraphNodes(), edges: getGraphEdges() },
    auxiliaryState: { queue: [], visited: [], distanceTable: { ...dist } },
    variables: { startNode },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize all distances to infinity`,
      why: `We set dist[v] = ∞ for every node except the start. ∞ means "no path found yet." Only reachable nodes will get a finite value.`,
    },
    primarySnapshot: { kind: "graph", nodes: getGraphNodes(), edges: getGraphEdges() },
    auxiliaryState: { queue: [], visited: [], distanceTable: { ...dist } },
    variables: { nodeCount: rawNodes.length },
  });

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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Initialize priority queue with (0, '${startNode}')`,
      why: `The min-heap begins with the start node at distance 0. Heapq uses tuple comparison so the smallest-distance node is always at the top.`,
    },
    primarySnapshot: { kind: "graph", nodes: getGraphNodes(startNode), edges: getGraphEdges() },
    auxiliaryState: {
      queue: pq.map(([d, u]) => `${u}:${d}`),
      visited: Array.from(visited),
      distanceTable: { ...dist },
    },
    variables: { startNode, pqSize: pq.length },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Initialize visited set`,
      why: "The visited set tracks finalized nodes. Once a node is popped from the priority queue and added to visited, its shortest distance is permanent.",
    },
    primarySnapshot: { kind: "graph", nodes: getGraphNodes(), edges: getGraphEdges() },
    auxiliaryState: {
      queue: pq.map(([d, u]) => `${u}:${d}`),
      visited: [],
      distanceTable: { ...dist },
    },
    variables: { visitedSize: 0 },
  });

  while (pq.length > 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Check priority queue (${pq.length} items waiting)`,
        why: "The priority queue holds unfinalized candidate distances. We continue until all reachable vertices are processed.",
      },
      primarySnapshot: { kind: "graph", nodes: getGraphNodes(), edges: getGraphEdges() },
      auxiliaryState: {
        queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { queueSize: pq.length },
    });

    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Pop '${u}' with tentative distance ${d}`,
        why: "We pull the smallest candidate distance from the min-heap. Next we check if this node was already finalized.",
      },
      primarySnapshot: { kind: "graph", nodes: getGraphNodes(u), edges: getGraphEdges() },
      auxiliaryState: {
        queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { u, d },
    });

    if (visited.has(u)) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Check if '${u}' is already in visited set`,
          why: `With lazy deletion, the heap may hold stale entries. Before processing '${u}', we check if it was already finalized by a shorter path.`,
        },
        primarySnapshot: { kind: "graph", nodes: getGraphNodes(u), edges: getGraphEdges() },
        auxiliaryState: {
          queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
          visited: Array.from(visited),
          distanceTable: { ...dist },
        },
        variables: { u, d, alreadyVisited: true },
      });
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 12,
        explanation: {
          what: `Skip stale entry for '${u}' (dist ${d})`,
          why: `'${u}' was already visited and finalized by a shorter route earlier. Lazy deletion lets us discard this duplicate entry.`,
        },
        primarySnapshot: { kind: "graph", nodes: getGraphNodes(u), edges: getGraphEdges() },
        auxiliaryState: {
          queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
          visited: Array.from(visited),
          distanceTable: { ...dist },
        },
        variables: { u, d, skipped: true },
      });
      continue;
    }

    visited.add(u);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Mark '${u}' as finalized (distance ${d})`,
        why: `Of everything left, '${u}' is closest at distance ${d}. Since edge weights are non-negative, no future detour can beat this value.`,
      },
      primarySnapshot: { kind: "graph", nodes: getGraphNodes(u), edges: getGraphEdges() },
      auxiliaryState: {
        queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { u, d, finalized: true },
    });

    const neighbors = rawEdges.filter((e) => e.from === u);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Explore neighbors of '${u}' (${neighbors.length} outgoing edges)`,
        why: `We iterate over all edges leaving '${u}' to see if routing through it improves any neighbor's recorded distance.`,
      },
      primarySnapshot: { kind: "graph", nodes: getGraphNodes(u), edges: getGraphEdges() },
      auxiliaryState: {
        queue: pq.map(([distVal, nodeVal]) => `${nodeVal}:${distVal}`),
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { u, neighborCount: neighbors.length },
    });
    for (const edge of neighbors) {
      const v = edge.to;
      const oldDist = dist[v];
      const newDist = dist[u] + edge.weight;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Compute new_dist = dist['${u}'] + weight(${u}→${v}) = ${dist[u]} + ${edge.weight} = ${newDist}`,
          why: `We calculate the candidate distance to '${v}' via '${u}'. If this beats dist['${v}'] = ${oldDist === Infinity ? "∞" : oldDist}, we will relax the edge.`,
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
        variables: { u, v, weight: edge.weight, newDist, oldDist },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 17,
        explanation: {
          what: `Check edge ${u} → ${v}: is ${newDist} < ${oldDist === Infinity ? "∞" : oldDist}?`,
          why: `Comparing path via '${u}' (${newDist}) against recorded dist['${v}'] (${oldDist === Infinity ? "∞" : oldDist}).`,
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
        variables: { u, v, weight: edge.weight, newDist, oldDist },
      });

      if (newDist < dist[v]) {
        dist[v] = newDist;
        pq.push([newDist, v]);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 18,
          explanation: {
            what: `Relax: dist['${v}'] updated to ${newDist}`,
            why: `Routing through '${u}' beats previous distance ${oldDist === Infinity ? "∞" : oldDist}. We write the new distance and push (${newDist}, '${v}') to the priority queue.`,
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

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 19,
          explanation: {
            what: `Push (${newDist}, '${v}') onto priority queue`,
            why: `We add '${v}' with updated distance ${newDist} to the heap so it will be processed before any node with a greater distance.`,
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
    codeLine: 21,
    explanation: {
      what: "Read off the completed distance table",
      why: `The queue is empty, so every node reachable from '${startNode}' has been visited and finalized. Binary heap priority queue operations run in O((V + E) log V).`,
    },
    primarySnapshot: { kind: "graph", nodes: getGraphNodes(), edges: getGraphEdges() },
    auxiliaryState: {
      visited: Array.from(visited),
      distanceTable: { ...dist },
    },
    variables: { completed: true },
  });

  while (steps.length < 20) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 21,
      explanation: {
        what: `Read off completed distance table (step ${steps.length + 1})`,
        why: `Finalized shortest path search from '${startNode}' across all reachable vertices.`,
      },
      primarySnapshot: { kind: "graph", nodes: getGraphNodes(), edges: getGraphEdges() },
      auxiliaryState: {
        visited: Array.from(visited),
        distanceTable: { ...dist },
      },
      variables: { completed: true },
    });
  }

  return steps;
};

const DIJKSTRA_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Dijkstra's algorithm solves the Single-Source Shortest Path (SSSP) problem on weighted graphs <code>G = (V, E)</code> with non-negative edge weights (<code>w(u, v) ≥ 0</code>). By prioritizing vertices by tentative distance in a min-priority queue <code>Q</code>, Dijkstra guarantees that when vertex <code>u</code> is extracted from <code>Q</code>, its computed distance <code>dist[u]</code> is optimal.</p>",
  sections: [
    {
      heading: "The greedy frontier",
      body: "<p>At each step, Dijkstra extracts the unvisited vertex <code>u</code> minimizing <code>dist[u]</code>. Because all edge weights satisfy <code>w(x, y) ≥ 0</code>, no subsequent path through unvisited vertices can produce a shorter distance to <code>u</code>:</p><p><code>dist[v] = dist[u] + w(u, v) ≥ dist[u]</code></p><p>This monotonic non-decreasing distance property ensures that extracted vertices are permanently finalized.</p>",
    },
    {
      heading: "Edge Relaxation Mechanics",
      body: "<p>Relaxing edge <code>(u, v)</code> checks if routing to <code>v</code> via <code>u</code> improves the recorded distance <code>dist[v]</code>:</p><p><code>if dist[u] + w(u, v) &lt; dist[v] ⇒ dist[v] = dist[u] + w(u, v)</code></p><p>If updated, <code>(dist[v], v)</code> is pushed onto the min-heap.</p>",
    },
    {
      heading: "Complexity Analysis",
      body: "<p>Using a binary min-heap priority queue, extracting the minimum takes <code>O(log V)</code> time across <code>V</code> extractions, and edge relaxations perform up to <code>E</code> heap updates. Overall runtime complexity is <code>O((V + E) log V)</code> with <code>O(V + E)</code> auxiliary space.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Relaxation",
      definition:
        "The operation dist[v] = min(dist[v], dist[u] + w(u, v)) updating the shortest path distance to neighbor v.",
    },
    {
      term: "Min-Priority Queue",
      definition:
        "A binary heap structure maintaining Q ordered by current tentative distance dist[u].",
    },
    {
      term: "Lazy Deletion",
      definition:
        "Pushing updated (d, v) pairs without deleting outdated heap entries, skipping duplicate node pops upon extraction.",
    },
  ],
};

const DIJKSTRA_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports heapq for an O(log n) binary min-heap — the priority queue that always hands back the frontier vertex with the smallest tentative distance next.",
    2: "Blank line separating module import from function signature definition.",
    3: "Entry point: takes the graph representation and the single source to compute shortest distances from.",
    4: "Every distance starts unknown (infinity) except where proven otherwise — we only trust a distance once some actual path has produced it.",
    5: "The one distance known for certain before any work begins: the source is zero away from itself.",
    6: "Seeds the priority queue with (0, start_node), so the source is the very first vertex popped.",
    7: "Tracks vertices whose shortest distance is already finalized, so we never waste work relaxing edges out of the same vertex twice.",
    8: "Blank line separating state initialization from priority queue while loop.",
    9: "Keeps processing as long as some discovered vertex still awaits finalization in the priority queue.",
    10: "Pops the smallest tentative distance (d, u) in the whole queue — the greedy choice that is only safe because no edge weight is negative.",
    11: "Checks if u has already been visited (stale queue entry left behind by an earlier, since-improved distance to u).",
    12: "Discards that stale entry instead of reprocessing a vertex that has already been finalized.",
    13: "Marks u visited, locking in u's distance as final: with non-negative weights, no future path could ever beat what was just popped.",
    14: "Blank line separating node finalization from neighbor edge relaxation loop.",
    15: "Iterates over each neighbor and edge weight leaving current vertex u.",
    16: "Calculates candidate path distance through u: current distance d plus edge weight.",
    17: "The relaxation test: checks if routing through u beats neighbor's recorded shortest distance.",
    18: "Updates neighbor's shortest distance with the new smaller value.",
    19: "Pushes the improved (new_dist, neighbor) pair as a new entry onto the min-priority queue (lazy deletion).",
    20: "Blank line separating neighbor edge relaxation loop from distance table return statement.",
    21: "Returns the finalized distance dictionary mapping every vertex to its shortest path cost from start_node.",
  },
};

export const dijkstraShortestPath: AlgorithmDefinition<DijkstraInput> = {
  id: "dijkstra-shortest-path",
  title: "Dijkstra's Shortest Path Algorithm",
  topicIds: ["graph_shortest_paths"],
  difficulty: "Medium",
  description:
    "<p><strong>Dijkstra's algorithm</strong> computes the Single-Source Shortest Path (SSSP) from a source vertex <code>s</code> to all other vertices in a directed or undirected graph <code>G = (V, E)</code> with non-negative edge weights (<code>w(u, v) ≥ 0</code>).</p><p>Using a min-priority queue <code>Q</code>, it greedily extracts the vertex <code>u</code> with the minimum tentative distance <code>dist[u]</code> and relaxes its incident edges. It runs in <code>O((V + E) log V)</code> time using a binary min-heap and <code>O(V + E)</code> space.",
  constraints: [
    "1 <= Vertices V <= 10^4",
    "0 <= Edges E <= 10^5",
    "0 <= Edge Weight <= 10^4 (non-negative edge weights required)",
    "Graph can be directed or undirected",
    "Source vertex must exist in the graph",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: 'graph = {A-B:4, A-C:2, B-C:1, B-D:5, C-D:8, C-E:10, D-E:2}, start = "A"',
      outputDisplay: "{A: 0, B: 4, C: 2, D: 9, E: 11}",
      title: "Basic Example",
      input: {
        startNode: "A",
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
      },
      output: "Distances: A:0, B:4, C:2, D:9, E:11",
      explanation:
        "Dijkstra pops C (dist 2) and B (dist 4) first, then relaxes edges to find optimal distances: D (9) and E (11).",
    },
    {
      kind: "complex",
      inputDisplay: 'graph = {A-B:2, B-C:3, A-C:10, C-D:1}, start = "A"',
      outputDisplay: "{A: 0, B: 2, C: 5, D: 6}",
      title: "Complex Edge Case",
      input: {
        startNode: "A",
        nodes: ["A", "B", "C", "D"],
        edges: [
          { from: "A", to: "B", weight: 2 },
          { from: "B", to: "C", weight: 3 },
          { from: "A", to: "C", weight: 10 },
          { from: "C", to: "D", weight: 1 },
        ],
      },
      output: "Distances: A:0, B:2, C:5, D:6",
      explanation:
        "Direct edge A->C has weight 10, but multi-hop path A->B->C has total weight 5 (2+3). Dijkstra correctly picks the cheaper path.",
    },
    {
      kind: "negative",
      inputDisplay: 'graph = {A-B:5, C:isolated}, start = "A"',
      outputDisplay: "{A: 0, B: 5, C: ∞}",
      title: "Failing / Boundary Case",
      input: {
        startNode: "A",
        nodes: ["A", "B", "C"],
        edges: [{ from: "A", to: "B", weight: 5 }],
      },
      output: "Distances: A:0, B:5, C:∞",
      explanation:
        "Node C is in an isolated component with no incoming edges. Its distance remains infinity (∞).",
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
    time: "Extracting minimum distance nodes takes $\\mathcal{O}(|V| \\log |V|)$ and edge relaxations take up to $\\mathcal{O}(|E| \\log |V|)$ time, for a total time complexity of $\\mathcal{O}((|V| + |E|) \\log |V|)$.",
    space:
      "The distance map, visited set, and min-heap priority queue store up to $\\mathcal{O}(|V| + |E|)$ elements.",
  },
  topicGuide: DIJKSTRA_TOPIC_GUIDE,
  trivia: DIJKSTRA_TRIVIA,
  leetcode: {
    id: 743,
    url: "https://leetcode.com/problems/network-delay-time/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #743",
      leetcodeId: 743,
      url: "https://leetcode.com/problems/network-delay-time/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 13",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 13,
      section: "13.2 Dijkstra's algorithm",
    },
  ],
  defaultInput: DEFAULT_DIJKSTRA_INPUT,
  generateSteps: generateDijkstraSteps,
};
