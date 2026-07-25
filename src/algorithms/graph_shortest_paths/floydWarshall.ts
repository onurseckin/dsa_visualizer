import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
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
        what: 'Initialize Floyd-Warshall Algorithm',
        why: 'Empty node set provided.',
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
      what: `Initialize ${n}x${n} distance matrix`,
      why: 'Set self-distances dist[i][i] = 0 and populate direct edge weights. All other non-adjacent cell pairs default to ∞.',
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
        what: `Consider intermediate pivot node k = ${pivotNode} (index ${k})`,
        why: `Evaluate if routing paths through intermediate pivot node '${pivotNode}' yields shorter paths for any (i, j) cell pair.`,
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
                what: `Update dist['${uNode}']['${vNode}']: ${distIJ === Infinity ? '∞' : distIJ} → ${newDist}`,
                why: `Subpath Optimization: Routing via intermediate pivot '${pivotNode}' reduces distance: dist['${uNode}']['${pivotNode}'] (${distIK}) + dist['${pivotNode}']['${vNode}'] (${distKJ}) = ${newDist} < previous dist['${uNode}']['${vNode}'] (${distIJ === Infinity ? '∞' : distIJ}).`,
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
        ? 'Floyd-Warshall completed with negative cycle detected!'
        : 'Floyd-Warshall execution complete.',
      why: hasNegativeCycle
        ? 'A negative self-distance dist[i][i] < 0 indicates a negative-weight cycle in the graph.'
        : 'All-pairs shortest path distance matrix fully computed for all node pairs.',
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

export const floydWarshall: AlgorithmDefinition<FloydWarshallInput> = {
  id: 'floyd-warshall',
  title: 'Floyd-Warshall All-Pairs Shortest Path',
  category: 'graph_shortest_paths',
  difficulty: 'Medium',
  description:
    'Floyd-Warshall computes the all-pairs shortest paths for a weighted directed graph using dynamic programming matrix tabulation. It considers every vertex k as a potential intermediate pivot node between every pair of vertices (i, j). If passing through pivot k yields a shorter path distance (dist[i][k] + dist[k][j] < dist[i][j]), the matrix entry is updated. After trying all V possible pivot vertices across all V^2 cell pairs (O(V^3) total iterations), the distance matrix contains the absolute shortest path length between any pair of vertices in the graph.',
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
  defaultInput: DEFAULT_FLOYD_WARSHALL_INPUT,
  generateSteps: generateFloydWarshallSteps,
};
