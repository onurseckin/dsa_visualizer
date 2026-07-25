import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
  GridVisualSnapshot,
} from '../../types/dsa';

export interface NumberOfIslandsInput {
  grid: string[][];
}

export const DEFAULT_NUMBER_OF_ISLANDS_INPUT: NumberOfIslandsInput = {
  grid: [
    ['1', '1', '0', '0', '0'],
    ['1', '1', '0', '0', '0'],
    ['0', '0', '1', '0', '0'],
    ['0', '0', '0', '1', '1'],
  ],
};

export const NUMBER_OF_ISLANDS_CODE = `from collections import deque

def num_islands(grid):
    if not grid or not grid[0]:
        return 0
    
    rows, cols = len(grid), len(grid[0])
    visited = set()
    count = 0
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in visited:
                count += 1
                visited.add((r, c))
                queue = deque([(r, c)])
                
                while queue:
                    cr, cc = queue.popleft()
                    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
                    for dr, dc in dirs:
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in visited:
                            visited.add((nr, nc))
                            queue.append((nr, nc))
                            
    return count`;

export const generateNumberOfIslandsSteps = (
  input: NumberOfIslandsInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const rawGrid = input?.grid || DEFAULT_NUMBER_OF_ISLANDS_INPUT.grid;
  let stepIndex = 0;

  if (!rawGrid || rawGrid.length === 0 || rawGrid[0].length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: 'Empty grid provided.',
        why: 'No islands can exist in an empty grid.',
      },
      primarySnapshot: {
        kind: 'grid',
        grid: [],
      },
      auxiliaryState: {
        visited: [],
        customState: { islandCount: 0 },
      },
      variables: { count: 0 },
    });
    return steps;
  }

  const rows = rawGrid.length;
  const cols = rawGrid[0].length;
  const visitedSet = new Set<string>();
  let count = 0;

  const createGridSnapshot = (
    activePos?: [number, number],
    queuedPositions: Array<[number, number]> = []
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    const queuedSet = new Set(queuedPositions.map(([r, c]) => `${r},${c}`));

    for (let r = 0; r < rows; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const isWater = rawGrid[r][c] === '0';
        const isVisited = visitedSet.has(key);
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isQueued = queuedSet.has(key);

        rowNodes.push({
          row: r,
          col: c,
          isWall: isWater,
          isVisited: isVisited && !isActive,
          state: isActive ? 'active' : isQueued ? 'queued' : isVisited ? 'visited' : 'default',
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: 'grid', grid: gridNodes };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize Number of Islands grid scan (${rows}x${cols}).`,
      why: 'Start scanning row by row to discover connected land components.',
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: {
      visited: [],
      customState: { islandCount: 0 },
    },
    variables: { count: 0, rows, cols },
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const isLand = rawGrid[r][c] === '1';

      if (isLand && !visitedSet.has(key)) {
        count++;
        visitedSet.add(key);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 14,
          explanation: {
            what: `Discovered new island #${count} starting at cell (${r}, ${c}).`,
            why: 'Found unvisited land cell. Increment island count and initiate BFS to visit all connected land.',
          },
          primarySnapshot: createGridSnapshot([r, c]),
          auxiliaryState: {
            queue: [`(${r},${c})`],
            visited: Array.from(visitedSet),
            customState: { islandCount: count, currentCell: `(${r},${c})` },
          },
          variables: { r, c, islandCount: count },
        });

        const queue: Array<[number, number]> = [[r, c]];

        while (queue.length > 0) {
          const [cr, cc] = queue.shift()!;

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 19,
            explanation: {
              what: `Exploring cell (${cr}, ${cc}) on island #${count}.`,
              why: 'Processing neighbors in 4 directions (up, down, left, right).',
            },
            primarySnapshot: createGridSnapshot([cr, cc], queue),
            auxiliaryState: {
              queue: queue.map(([qr, qc]) => `(${qr},${qc})`),
              visited: Array.from(visitedSet),
              customState: { islandCount: count, activeCell: `(${cr},${cc})` },
            },
            variables: { cr, cc, queueLength: queue.length },
          });

          const dirs = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ];

          for (const [dr, dc] of dirs) {
            const nr = cr + dr;
            const nc = cc + dc;
            const neighborKey = `${nr},${nc}`;

            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              rawGrid[nr][nc] === '1' &&
              !visitedSet.has(neighborKey)
            ) {
              visitedSet.add(neighborKey);
              queue.push([nr, nc]);

              steps.push({
                stepIndex: stepIndex++,
                codeLine: 24,
                explanation: {
                  what: `Neighbor land cell (${nr}, ${nc}) connected to island #${count}.`,
                  why: 'Added neighbor land cell to visited set and BFS queue.',
                },
                primarySnapshot: createGridSnapshot([cr, cc], queue),
                auxiliaryState: {
                  queue: queue.map(([qr, qc]) => `(${qr},${qc})`),
                  visited: Array.from(visitedSet),
                  customState: { islandCount: count, addedNeighbor: `(${nr},${nc})` },
                },
                variables: { nr, nc, queueLength: queue.length },
              });
            }
          }
        }
      }
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: `Grid traversal complete. Total islands found: ${count}.`,
      why: 'All cells scanned. Returned total count of connected land components.',
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: {
      visited: Array.from(visitedSet),
      customState: { totalIslands: count },
    },
    variables: { totalIslands: count },
  });

  return steps;
};

export const numberOfIslands: AlgorithmDefinition<NumberOfIslandsInput> = {
  id: 'number-of-islands',
  title: 'Number of Islands',
  category: 'graph_traversal',
  difficulty: 'Medium',
  description:
    'Counts the number of connected land components ("1") surrounded by water ("0") in a 2D grid using BFS/DFS graph traversal.',
  constraints: ['1 <= m, n <= 30', 'grid[i][j] is "0" or "1"'],
  examples: [
    {
      input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]',
      output: '2',
      explanation: 'Two separate land masses exist.',
    },
  ],
  code: NUMBER_OF_ISLANDS_CODE,
  timeComplexity: {
    best: 'O(M * N)',
    average: 'O(M * N)',
    worst: 'O(M * N)',
  },
  spaceComplexity: 'O(M * N)',
  defaultInput: DEFAULT_NUMBER_OF_ISLANDS_INPUT,
  generateSteps: generateNumberOfIslandsSteps,
};
