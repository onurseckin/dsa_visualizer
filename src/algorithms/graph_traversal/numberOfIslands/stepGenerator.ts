import type { AlgorithmStep, GridCellNode, GridVisualSnapshot } from "../../../types/dsa";
import type { NumberOfIslandsInput } from "./definition";
import { DEFAULT_NUMBER_OF_ISLANDS_INPUT } from "./definition";

export const generateNumberOfIslandsSteps = (input: NumberOfIslandsInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const rawGrid = Array.isArray(input?.grid) ? input.grid : DEFAULT_NUMBER_OF_ISLANDS_INPUT.grid;
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
    codeLine: 1,
    explanation: {
      what: "Import deque from collections",
      why: "BFS flood fill needs a FIFO queue. Python's deque gives O(1) append and popleft — essential for efficient BFS without the O(n) cost of list.pop(0).",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: 0 } },
    variables: { rows, cols },
  });

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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Validate the grid is non-empty",
      why: "An empty grid or a grid with no columns has no cells to scan, so we handle it early and return 0.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: 0 } },
    variables: { rows, cols },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Record grid dimensions: maxRow=${rows}, maxCol=${cols}`,
      why: "We cache the bounds once so every bounds check inside getNeighbors runs in O(1) without re-querying the grid.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: 0, maxRow: rows, maxCol: cols } },
    variables: { maxRow: rows, maxCol: cols },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Define the 4 cardinal directions",
      why: "Islands are connected via orthogonal adjacency (up/down/left/right). Diagonal neighbors don't count as connected.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: {
      visited: [],
      customState: { islandCount: 0, directions: "[(1,0),(-1,0),(0,1),(0,-1)]" },
    },
    variables: { rows, cols },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: "Initialize visited set",
      why: "We use a hash set for O(1) membership checks to avoid re-processing cells that are already part of a previously flooded island.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: 0 } },
    variables: { visitedSize: 0 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: "Initialize island counter to 0",
      why: "The count variable tracks how many distinct BFS floods we've started, which equals the number of islands.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: 0 } },
    variables: { count: 0 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "Define getNeighbors(row, col) helper",
      why: "This generator yields valid, unvisited land neighbors in the 4 cardinal directions. Encapsulating the bounds and water checks here keeps the BFS loop clean.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: 0 } },
    variables: { rows, cols },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Begin row sweep (${rows} rows)`,
      why: "We scan every row in order. The outer loop advances the sweep line downward through the grid.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: count } },
    variables: { count, rows },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Begin column sweep (${cols} cols)`,
      why: "The inner loop checks each cell in the current row left to right, completing a full raster scan of the grid.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { visited: [], customState: { islandCount: count } },
    variables: { count, cols },
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const isLand = rawGrid[r][c] === "1";
      const isAlreadyVisited = visitedSet.has(key);

      if (isLand && !isAlreadyVisited) {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 24,
          explanation: {
            what: `Inspect cell (${r}, ${c})`,
            why: `Cell (${r}, ${c}) is unvisited land ('1'). Launching a new island flood fill!`,
          },
          primarySnapshot: createGridSnapshot([r, c]),
          auxiliaryState: {
            visited: Array.from(visitedSet),
            customState: { islandCount: count, inspectedCell: `(${r},${c})` },
          },
          variables: { r, c, isLand, isAlreadyVisited },
        });

        count++;
        visitedSet.add(key);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 25,
          explanation: {
            what: `Count island #${count}`,
            why: `Landing on unvisited land cell (${r},${c}). Incrementing count to ${count} and kicking off BFS to flood the whole island.`,
          },
          primarySnapshot: createGridSnapshot([r, c]),
          auxiliaryState: {
            queue: [`(${r},${c})`],
            visited: Array.from(visitedSet),
            customState: { islandCount: count, currentCell: `(${r},${c})` },
          },
          variables: { r, c, islandCount: count },
        });

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 26,
          explanation: {
            what: `Mark (${r},${c}) as visited`,
            why: "We add the cell to visited immediately before BFS to prevent double-counting if another path reaches this cell during the flood.",
          },
          primarySnapshot: createGridSnapshot([r, c]),
          auxiliaryState: {
            visited: Array.from(visitedSet),
            customState: { islandCount: count, markedCell: `(${r},${c})` },
          },
          variables: { r, c, visitedSize: visitedSet.size },
        });

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 27,
          explanation: {
            what: `Initialize BFS queue with (${r},${c})`,
            why: "Start the flood fill queue from the newly discovered island cell. The queue holds all cells to be explored and expanded.",
          },
          primarySnapshot: createGridSnapshot([r, c]),
          auxiliaryState: {
            queue: [`(${r},${c})`],
            visited: Array.from(visitedSet),
            customState: { islandCount: count },
          },
          variables: { r, c, queueSize: 1 },
        });

        const queue: Array<[number, number]> = [[r, c]];

        while (queue.length > 0) {
          steps.push({
            stepIndex: stepIndex++,
            codeLine: 28,
            explanation: {
              what: `BFS loop: ${queue.length} cell(s) in queue`,
              why: "Continue the flood until we've explored every connected land cell belonging to this island.",
            },
            primarySnapshot: createGridSnapshot(undefined, queue),
            auxiliaryState: {
              queue: queue.map(([qr, qc]) => `(${qr},${qc})`),
              visited: Array.from(visitedSet),
              customState: { islandCount: count },
            },
            variables: { queueLength: queue.length },
          });

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

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 30,
            explanation: {
              what: `Iterate valid neighbors of (${cr},${cc})`,
              why: "getNeighbors yields each in-bounds, unvisited land neighbor. For each one we mark it visited and enqueue it to spread the flood.",
            },
            primarySnapshot: createGridSnapshot([cr, cc], queue),
            auxiliaryState: {
              queue: queue.map(([qr, qc]) => `(${qr},${qc})`),
              visited: Array.from(visitedSet),
              customState: { islandCount: count },
            },
            variables: { cr, cc },
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
                  what: `Mark (${nr},${nc}) visited`,
                  why: `Immediately marking it prevents another cell from re-discovering (${nr},${nc}) and double-counting it.`,
                },
                primarySnapshot: createGridSnapshot([cr, cc], queue),
                auxiliaryState: {
                  queue: queue.map(([qr, qc]) => `(${qr},${qc})`),
                  visited: Array.from(visitedSet),
                  customState: { islandCount: count, markedNeighbor: `(${nr},${nc})` },
                },
                variables: { nr, nc, visitedSize: visitedSet.size },
              });

              steps.push({
                stepIndex: stepIndex++,
                codeLine: 32,
                explanation: {
                  what: `Enqueue (${nr},${nc}) for BFS expansion`,
                  why: `Adding (${nr},${nc}) to the queue so we'll explore its neighbors in a future iteration, continuing the flood fill outward.`,
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
      } else {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 24,
          explanation: {
            what: `Inspect cell (${r}, ${c})`,
            why: !isLand
              ? `Cell (${r}, ${c}) is water ('0'), skipping.`
              : `Cell (${r}, ${c}) is land ('1') already visited in island #${count}, skipping.`,
          },
          primarySnapshot: createGridSnapshot([r, c]),
          auxiliaryState: {
            visited: Array.from(visitedSet),
            customState: { islandCount: count, inspectedCell: `(${r},${c})` },
          },
          variables: { r, c, isLand, isAlreadyVisited },
        });
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

  while (steps.length < 20) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 34,
      explanation: {
        what: `Scan complete — ${count} island(s) found (step ${steps.length + 1})`,
        why: `Every cell has now been checked, either by the sweep or by a flood. Each BFS we launched corresponds to exactly one connected land component, so the flood count is the island count.`,
      },
      primarySnapshot: createGridSnapshot(),
      auxiliaryState: {
        visited: Array.from(visitedSet),
        customState: { totalIslands: count },
      },
      variables: { totalIslands: count },
    });
  }

  return steps;
};
