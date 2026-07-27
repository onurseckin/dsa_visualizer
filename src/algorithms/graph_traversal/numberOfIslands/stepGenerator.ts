import type { AlgorithmStep, GridCellNode, GridVisualSnapshot } from "../../../types/dsa";
import type { NumberOfIslandsInput } from "./definition";
import { DEFAULT_NUMBER_OF_ISLANDS_INPUT } from "./definition";

export const generateNumberOfIslandsSteps = (input: NumberOfIslandsInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const rawGrid = input?.grid || DEFAULT_NUMBER_OF_ISLANDS_INPUT.grid;
  let stepIndex = 0;

  if (!rawGrid || rawGrid.length === 0 || rawGrid[0].length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: "Handle an empty grid",
        why: "There are no cells at all, so the island count is 0 and we're done before we start.",
      },
      primarySnapshot: { kind: "grid", grid: [] },
      auxiliaryState: { visited: [], customState: { islandCount: 0 } },
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
    queuedPositions: Array<[number, number]> = [],
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    const queuedSet = new Set(queuedPositions.map(([r, c]) => `${r},${c}`));

    for (let r = 0; r < rows; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const isWater = rawGrid[r][c] === "0";
        const isVisited = visitedSet.has(key);
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isQueued = queuedSet.has(key);

        rowNodes.push({
          row: r,
          col: c,
          isWall: isWater,
          isVisited: isVisited && !isActive,
          state: isActive ? "active" : isQueued ? "queued" : isVisited ? "visited" : "default",
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: "grid", grid: gridNodes };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Scan the ${rows}x${cols} grid`,
      why: "We sweep the grid cell by cell, row by row. Whenever we step on land we haven't seen before, we know we've found the corner of a brand-new island.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: 0 } },
    variables: { count: 0, rows, cols },
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const isLand = rawGrid[r][c] === "1";

      if (isLand && !visitedSet.has(key)) {
        count++;
        visitedSet.add(key);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 25,
          explanation: {
            what: `Found island #${count} at (${r}, ${c})`,
            why: `This land cell isn't part of any island we've flooded yet, so we count a new island and launch a BFS to claim every cell connected to it — that way none of them can be counted again.`,
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
            codeLine: 29,
            explanation: {
              what: `Explore cell (${cr}, ${cc})`,
              why: `We take the next cell of island #${count} off the queue and look at its four orthogonal neighbors, pushing the island's known boundary outward.`,
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
              rawGrid[nr][nc] === "1" &&
              !visitedSet.has(neighborKey)
            ) {
              visitedSet.add(neighborKey);
              queue.push([nr, nc]);

              steps.push({
                stepIndex: stepIndex++,
                codeLine: 31,
                explanation: {
                  what: `Add neighbor (${nr}, ${nc})`,
                  why: `It's unvisited land touching the current cell, so it belongs to island #${count} — we mark it visited right away and queue it so the flood keeps spreading.`,
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
    codeLine: 34,
    explanation: {
      what: `Scan complete — ${count} island(s) found`,
      why: `Every cell has now been checked, either by the sweep or by a flood. Each BFS we launched corresponds to exactly one connected land component, so the flood count is the island count. Touching each cell a constant number of times is what keeps this O(M * N).`,
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
