import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
  TopicGuide,
} from '../../types/dsa';

export interface FloydWarshallInput {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
}

export const FLOYD_WARSHALL_CODE = `def floyd_warshall(nodes, edges):
    n = len(nodes)
    dist = [[float('inf')] * n for _ in range(n)]
    node_to_idx = {node: i for i, node in enumerate(nodes)}

    for i in range(n):
        dist[i][i] = 0

    for u, v, w in edges:
        dist[node_to_idx[u]][node_to_idx[v]] = w

    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] != float('inf') and dist[k][j] != float('inf'):
                    if dist[i][k] + dist[k][j] < dist[i][j]:
                        dist[i][j] = dist[i][k] + dist[k][j]

    return dist`;

export const DEFAULT_FLOYD_WARSHALL_INPUT: FloydWarshallInput = {
  nodes: ['1', '2', '3', '4'],
  edges: [
    { from: '1', to: '3', weight: -2 },
    { from: '2', to: '1', weight: 4 },
    { from: '2', to: '3', weight: 3 },
    { from: '3', to: '4', weight: 2 },
    { from: '4', to: '2', weight: -1 },
  ],
};

export const generateFloydWarshallSteps = (
  input: FloydWarshallInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = input?.nodes || [];
  const rawEdges = input?.edges || [];
  const n = rawNodes.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: 'Initialize on an empty graph',
        why: 'There are no vertices, so the all-pairs table is empty and we are done before we start.',
      },
      primarySnapshot: { kind: 'grid', grid: [] },
      auxiliaryState: { customState: { NodeCount: 0 } },
      variables: { completed: true },
    });
    return steps;
  }

  const nodeToIdx: Record<string, number> = {};
  rawNodes.forEach((node, idx) => {
    nodeToIdx[node] = idx;
  });

  const dist: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(Infinity)
  );

  for (let i = 0; i < n; i++) {
    dist[i][i] = 0;
  }

  for (const edge of rawEdges) {
    const uIdx = nodeToIdx[edge.from];
    const vIdx = nodeToIdx[edge.to];
    if (uIdx !== undefined && vIdx !== undefined) {
      dist[uIdx][vIdx] = edge.weight;
    }
  }

  const buildGridSnapshot = (
    activePos?: [number, number],
    comparePositions: Array<[number, number]> = [],
    pivotIdx?: number
  ) => {
    const grid: GridCellNode[][] = [];
    const compSet = new Set(comparePositions.map(([r, c]) => `${r},${c}`));

    for (let r = 0; r < n; r++) {
      const row: GridCellNode[] = [];
      for (let c = 0; c < n; c++) {
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isCompare = compSet.has(`${r},${c}`);
        const isPivotRowOrCol = pivotIdx !== undefined && (r === pivotIdx || c === pivotIdx);

        row.push({
          row: r,
          col: c,
          distance: dist[r][c],
          state: isActive
            ? 'active'
            : isCompare
            ? 'compare'
            : isPivotRowOrCol
            ? 'pivot'
            : r === c
            ? 'visited'
            : 'default',
        });
      }
      grid.push(row);
    }
    return grid;
  };

  const getDistanceTableRecord = (): Record<string, number> => {
    const rec: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const key = `${rawNodes[i]}→${rawNodes[j]}`;
        rec[key] = dist[i][j];
      }
    }
    return rec;
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize the ${n}x${n} distance matrix`,
      why: 'We seed the table with what we know directly: every node is 0 away from itself, and each edge fills in its own weight. Every other pair starts at ∞ until we discover some route between them.',
    },
    primarySnapshot: {
      kind: 'grid',
      grid: buildGridSnapshot(),
    },
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: {
        'Total Nodes': n,
        'Total Edges': rawEdges.length,
      },
    },
    variables: { n, edgeCount: rawEdges.length },
  });

  for (let k = 0; k < n; k++) {
    const pivotNode = rawNodes[k];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Try node ${pivotNode} as the pivot`,
        why: `We now allow paths to pass through '${pivotNode}'. For every pair (i, j), we ask the same question: is going i → ${pivotNode} → j cheaper than the best route we've found so far?`,
      },
      primarySnapshot: {
        kind: 'grid',
        grid: buildGridSnapshot(undefined, [], k),
      },
      auxiliaryState: {
        distanceTable: getDistanceTableRecord(),
        customState: {
          'Pivot Node (k)': pivotNode,
          'Pivot Index': k,
        },
      },
      variables: { k, pivotNode },
    });

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const uNode = rawNodes[i];
        const vNode = rawNodes[j];
        const distIK = dist[i][k];
        const distKJ = dist[k][j];
        const distIJ = dist[i][j];

        if (distIK !== Infinity && distKJ !== Infinity) {
          const newDist = distIK + distKJ;
          if (newDist < distIJ) {
            dist[i][j] = newDist;

            steps.push({
              stepIndex: stepIndex++,
              codeLine: 17,
              explanation: {
                what: `Improve dist['${uNode}']['${vNode}'] to ${newDist}`,
                why: `Detouring through '${pivotNode}' gets us from '${uNode}' to '${vNode}' for ${distIK} + ${distKJ} = ${newDist}, beating the previous ${distIJ === Infinity ? '∞' : distIJ}. We write the cheaper value into the table.`,
              },
              primarySnapshot: {
                kind: 'grid',
                grid: buildGridSnapshot(
                  [i, j],
                  [
                    [i, k],
                    [k, j],
                  ],
                  k
                ),
              },
              auxiliaryState: {
                distanceTable: getDistanceTableRecord(),
                customState: {
                  'Source (i)': uNode,
                  'Target (j)': vNode,
                  'Pivot (k)': pivotNode,
                  'New Dist': newDist,
                  'Old Dist': distIJ === Infinity ? '∞' : distIJ,
                },
              },
              variables: { i, j, k, uNode, vNode, pivotNode, newDist },
            });
          }
        }
      }
    }
  }

  // Negative cycle check
  let hasNegativeCycle = false;
  for (let i = 0; i < n; i++) {
    if (dist[i][i] < 0) {
      hasNegativeCycle = true;
      break;
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: hasNegativeCycle
        ? 'Floyd-Warshall complete: negative cycle detected'
        : 'Floyd-Warshall complete',
      why: hasNegativeCycle
        ? 'A diagonal entry dist[i][i] dropped below 0, meaning some node can reach itself at negative total cost — a negative-weight cycle. Shortest paths that touch it are unbounded.'
        : `Every pair has now been tested against all ${n} possible pivots, so the matrix holds the true shortest distance between every pair of nodes. Those three nested loops are exactly where the O(V^3) cost comes from.`,
    },
    primarySnapshot: {
      kind: 'grid',
      grid: buildGridSnapshot(),
    },
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: {
        'Has Negative Cycle': hasNegativeCycle ? 'Yes' : 'No',
        Completed: 'True',
      },
    },
    variables: { completed: true, hasNegativeCycle },
  });

  return steps;
};

const FLOYD_WARSHALL_TOPIC_GUIDE: TopicGuide = {
  overview:
    'Floyd-Warshall answers the all-pairs shortest path question in one shot: for every ordered pair of vertices, what is the cheapest way to get from the first to the second? Instead of running a source-by-source search, it treats the whole answer as a matrix and improves that matrix in place through dynamic programming. It tolerates negative edge weights, needs no priority queue, and is short enough to write from memory, which makes it the standard choice for small dense graphs and for any situation where you will query many pairs. It also happens to be a template: the same triple loop solves reachability, bottleneck, and closure problems by swapping the operation inside.',
  sections: [
    {
      heading: 'One matrix, one question asked repeatedly',
      body: 'Start with a matrix whose entry for (i, j) is the weight of the direct edge from i to j, zero on the diagonal, and infinity where no edge exists. Now permit exactly one vertex — call it the pivot — to be used as an intermediate stop, and ask for every pair whether hopping through that pivot is cheaper than what you already have. Then permit two vertices as intermediates, then three, until every vertex has had its turn. The quantity you are computing at stage k is the shortest distance between each pair using only the first k vertices as intermediate stops, and once k reaches the total vertex count that restriction is no longer a restriction at all.',
    },
    {
      heading: 'How the triple loop implements that',
      body: 'The outer loop is the pivot k, and the two inner loops walk every source i and every target j, performing one comparison: if the distance from i to k plus the distance from k to j undercuts the distance from i to j, replace it. The ordering of those loops is not cosmetic — putting k anywhere but outermost computes something that is simply not the shortest-path recurrence, and it is the single most common way to get this algorithm wrong. Updating in place is nevertheless safe, because during pivot k the entries in row k and column k cannot change: improving them would require a path from k to itself with negative weight, which only happens if the graph has a negative cycle. That is why you need no second copy of the matrix even though every cell may be rewritten.',
    },
    {
      heading: 'Why the pivot ordering is correct',
      body: 'Look at any shortest path between two vertices and find the highest-numbered vertex it passes through in the middle. That path splits at that vertex into two shorter paths whose own intermediate vertices are all lower numbered, so both halves were already computed correctly at an earlier stage. When the pivot loop reaches that highest-numbered vertex, the comparison joins the two halves and records the full path. Every shortest path has such a highest intermediate vertex, so every shortest path is discovered at exactly the stage where its pivot comes up, and none is missed.',
    },
    {
      heading: 'Negative weights and negative cycles',
      body: 'Negative edges are perfectly welcome here, because nothing in the recurrence assumes that adding an edge makes a path worse. Negative cycles are a different matter: they make shortest paths undefined, and the algorithm exposes them cleanly, since a diagonal entry dropping below zero means some vertex reaches itself at a negative total cost. Once you see that, treat every distance whose path can touch the offending cycle as meaningless rather than merely inaccurate. If you need reliable answers on such a graph, you must first decide what question you are actually asking — for instance shortest simple path, which is a much harder problem, or shortest walk of bounded length.',
    },
    {
      heading: 'When to prefer it over running a single-source algorithm many times',
      body: "Floyd-Warshall wins when the vertex count is modest and the graph is dense, because its cost depends only on the number of vertices and it has almost no constant-factor overhead — no heap, no adjacency traversal, just tight array arithmetic. On a large sparse graph, running Dijkstra from every vertex is dramatically faster, and when such a graph also has negative edges, Johnson's algorithm reweights it first so that repeated Dijkstra becomes legal. Also consider what you actually need: if you only ever query one source, computing the entire matrix is wasted effort, whereas if you will answer thousands of arbitrary pair queries, the matrix is exactly the lookup table you want. The other practical constraint is memory, since storing a cell per ordered pair grows quadratically and becomes the binding limit well before running time does.",
    },
    {
      heading: 'The same loop, other problems',
      body: 'Replace addition with logical AND and the minimum with logical OR, and the identical triple loop computes the transitive closure of a graph, telling you which vertices can reach which — that variant is known as the Warshall algorithm. Replace the sum with "the larger of the two" and you get minimum-bottleneck paths, the route whose heaviest edge is as light as possible, which is what you want for maximum-capacity routing. To recover actual routes rather than costs, keep a parallel matrix recording the next hop for each pair and update it whenever you improve a distance, then follow those hops to walk the path out. Recognizing this family — a closed semiring with a combine operation and a select operation — is what lets you reuse the pattern on problems that have nothing to do with distance.',
    },
  ],
  keyTerms: [
    {
      term: 'Pivot (intermediate vertex)',
      definition:
        'The vertex the outer loop is currently allowing paths to route through. Each pivot round asks, for every pair, whether stopping at that vertex on the way is cheaper than the route already known.',
    },
    {
      term: 'Distance matrix',
      definition:
        'The table holding one cell per ordered pair of vertices, seeded with direct edge weights and refined in place until each cell holds a true shortest distance.',
    },
    {
      term: 'In-place update',
      definition:
        'Overwriting the same matrix during a pivot round instead of writing into a fresh copy. It is safe because the row and column belonging to the pivot cannot change during that round.',
    },
    {
      term: 'Transitive closure',
      definition:
        'The yes-or-no version of the same computation: for every pair, can the first vertex reach the second at all? You get it by swapping the arithmetic for boolean operations.',
    },
    {
      term: 'Next-hop matrix',
      definition:
        'An optional companion table storing, for each pair, the first vertex to move to along the best route. Following those entries reconstructs the path itself rather than just its cost.',
    },
  ],
};

export const floydWarshall: AlgorithmDefinition<FloydWarshallInput> = {
  id: 'floyd-warshall',
  title: 'Floyd-Warshall All-Pairs Shortest Path',
  category: 'graph_shortest_paths',
  difficulty: 'Medium',
  description:
    'Floyd-Warshall computes the shortest path between every pair of vertices in a weighted directed graph using dynamic programming over a distance matrix. It considers each vertex k in turn as a potential intermediate stop between every pair (i, j): whenever routing through k is cheaper (dist[i][k] + dist[k][j] < dist[i][j]), the matrix entry is updated. Once every vertex has had its turn as the pivot, the matrix holds the true shortest distance between every pair of vertices in the graph.',
  constraints: [
    '1 <= Vertices V <= 200',
    '0 <= Edges E <= V * (V - 1)',
    '-10^4 <= Edge Weight <= 10^4',
    'Graph can be directed or undirected',
    'Can handle negative edge weights, provided no negative-weight cycles exist',
  ],
  examples: [
    {
      input: '4 nodes (1-4), 5 edges: [1->3(-2), 2->1(4), 2->3(3), 3->4(2), 4->2(-1)]',
      output: 'Full 4x4 shortest path distance matrix',
      explanation:
        '1. Init direct edges. 2. Pivot k=3 updates dist[1][4] = dist[1][3] + dist[3][4] = (-2)+2 = 0. 3. Pivot k=4 updates dist[4][3] via node 2. Complete 4x4 matrix computed.',
    },
    {
      input: '2 nodes, edge 1->2(5), no 2->1 edge',
      output: 'dist[1][2]=5, dist[2][1]=∞',
      explanation:
        'Direct path 1 to 2 is distance 5. Node 1 is unreachable from Node 2, maintaining dist[2][1] = ∞.',
    },
  ],
  code: FLOYD_WARSHALL_CODE,
  timeComplexity: {
    best: 'O(V^3)',
    average: 'O(V^3)',
    worst: 'O(V^3)',
  },
  spaceComplexity: 'O(V^2)',
  complexityAnalysis: {
    time: "The algorithm is three nested loops over the vertices: every pivot k, against every source i, against every target j, doing a constant-time comparison each time. That's V * V * V iterations no matter what the graph looks like, so the running time is O(V^3) in every case — the edge count never even enters the formula.",
    space: 'The V x V distance matrix dominates memory: one cell for every ordered pair of vertices, updated in place, giving O(V^2).',
  },
  topicGuide: FLOYD_WARSHALL_TOPIC_GUIDE,
  defaultInput: DEFAULT_FLOYD_WARSHALL_INPUT,
  generateSteps: generateFloydWarshallSteps,
};
