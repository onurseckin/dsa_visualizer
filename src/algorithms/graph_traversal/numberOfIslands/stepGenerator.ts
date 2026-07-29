import type {
  AlgorithmStep,
  ElementState,
  GridCellNode,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import type { NumberOfIslandsInput } from "./definition";
import { DEFAULT_NUMBER_OF_ISLANDS_INPUT } from "./definition";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Number of Islands problem counts maximal connected land components in a 2D binary grid in O(R * C) time using BFS or DFS flood fill.",
    primarySnapshot: {
      kind: "grid",
      name: "Binary Grid",
      grid: [
        [
          { row: 0, col: 0, state: "active" },
          { row: 0, col: 1, state: "active" },
          { row: 0, col: 2, isWall: true, state: "default" },
        ],
        [
          { row: 1, col: 0, state: "active" },
          { row: 1, col: 1, state: "active" },
          { row: 1, col: 2, isWall: true, state: "default" },
        ],
        [
          { row: 2, col: 0, isWall: true, state: "default" },
          { row: 2, col: 1, isWall: true, state: "default" },
          { row: 2, col: 2, state: "sorted" },
        ],
      ],
    },
  },
  {
    narrative:
      "Implicit Graph Model: land cells ('1') act as vertices and orthogonal connections (up, down, left, right) act as edges. Water cells ('0') form boundaries.",
    primarySnapshot: {
      kind: "grid",
      name: "Implicit Edges",
      grid: [
        [
          { row: 0, col: 0, state: "pivot" },
          { row: 0, col: 1, state: "compare" },
        ],
        [
          { row: 1, col: 0, state: "compare" },
          { row: 1, col: 1, isWall: true, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Grid Sweep Strategy: iterate row by row across every cell. Encountering unvisited land ('1') signals the top-left corner of a new island.",
    primarySnapshot: {
      kind: "grid",
      name: "Sweep Inspection",
      grid: [
        [
          { row: 0, col: 0, state: "visited" },
          { row: 0, col: 1, state: "visited" },
        ],
        [
          { row: 1, col: 0, isWall: true, state: "default" },
          { row: 1, col: 1, state: "active" },
        ],
      ],
    },
  },
  {
    narrative:
      "Island Counter Increment: upon discovering unvisited land, increment islandCount by 1 and initiate a flood fill from that seed cell.",
    primarySnapshot: {
      kind: "grid",
      name: "New Island Discovered",
      grid: [
        [
          { row: 0, col: 0, state: "visited" },
          { row: 0, col: 1, isWall: true, state: "default" },
        ],
        [
          { row: 1, col: 0, isWall: true, state: "default" },
          { row: 1, col: 1, state: "active" },
        ],
      ],
    },
  },
  {
    narrative:
      "Flood Fill Propagation: BFS queue or DFS recursion traverses all orthogonally reachable land cells, expanding the component outward.",
    primarySnapshot: {
      kind: "grid",
      name: "Flood Expanding",
      grid: [
        [
          { row: 0, col: 0, state: "active" },
          { row: 0, col: 1, state: "pivot" },
        ],
        [
          { row: 1, col: 0, state: "pivot" },
          { row: 1, col: 1, isWall: true, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Early Visitor Tracking: mark land cells as visited immediately upon queue insertion to prevent redundant processing or stack overflow.",
    primarySnapshot: {
      kind: "grid",
      name: "Visited Land",
      grid: [
        [
          { row: 0, col: 0, state: "visited" },
          { row: 0, col: 1, state: "visited" },
        ],
        [
          { row: 1, col: 0, state: "visited" },
          { row: 1, col: 1, isWall: true, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Water Boundary Exclusion: water cells ('0') and out-of-bound coordinates terminate flood expansion in that direction.",
    primarySnapshot: {
      kind: "grid",
      name: "Water Boundary",
      grid: [
        [
          { row: 0, col: 0, state: "visited" },
          { row: 0, col: 1, isWall: true, state: "swap" },
        ],
        [
          { row: 1, col: 0, isWall: true, state: "swap" },
          { row: 1, col: 1, isWall: true, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Completeness & Complexity: visiting every cell once ensures no island is counted twice, yielding O(R * C) time and O(min(R, C)) auxiliary space.",
    primarySnapshot: {
      kind: "grid",
      name: "All Islands Counted",
      grid: [
        [
          { row: 0, col: 0, state: "sorted" },
          { row: 0, col: 1, state: "sorted" },
        ],
        [
          { row: 1, col: 0, isWall: true, state: "default" },
          { row: 1, col: 1, state: "sorted" },
        ],
      ],
    },
  },
];

export const generateNumberOfIslandsSteps = (input: NumberOfIslandsInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawGrid =
    Array.isArray(input?.grid) && input.grid.length > 0
      ? input.grid
      : DEFAULT_NUMBER_OF_ISLANDS_INPUT.grid;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input.grid) &&
      input.grid.length === DEFAULT_NUMBER_OF_ISLANDS_INPUT.grid.length &&
      input.grid.every(
        (row, r) =>
          row.length === DEFAULT_NUMBER_OF_ISLANDS_INPUT.grid[r].length &&
          row.every((val, c) => val === DEFAULT_NUMBER_OF_ISLANDS_INPUT.grid[r][c]),
      ));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  if (!rawGrid || rawGrid.length === 0 || rawGrid[0].length === 0) {
    addStep("The input grid is empty: returning 0 islands immediately.", {
      kind: "grid",
      name: "Empty Grid",
      grid: [],
    });
    return steps;
  }

  const rows = rawGrid.length;
  const cols = rawGrid[0].length;
  const visitedSet = new Set<string>();
  let islandCount = 0;

  const createGridSnapshot = (
    activePos?: [number, number],
    queuedPositions: Array<[number, number]> = [],
    evalPos?: [number, number],
    isComplete?: boolean,
    discoveredPos?: [number, number],
  ): PrimaryVisualSnapshot => {
    const queuedSet = new Set(queuedPositions.map(([r, c]) => `${r},${c}`));
    const gridNodes: GridCellNode[][] = [];

    for (let r = 0; r < rows; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const isWater = rawGrid[r][c] === "0";
        const isVisited = visitedSet.has(key);
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isDiscovered = discoveredPos && discoveredPos[0] === r && discoveredPos[1] === c;
        const isEval = evalPos && evalPos[0] === r && evalPos[1] === c;
        const isQueued = queuedSet.has(key);

        let state: ElementState = "default";
        if (isComplete) {
          state = isWater ? "default" : "sorted";
        } else if (isDiscovered) {
          state = "compare";
        } else if (isActive) {
          state = "active";
        } else if (isEval) {
          state = isWater ? "swap" : "compare";
        } else if (isQueued) {
          state = "pivot";
        } else if (isVisited) {
          state = "visited";
        }

        rowNodes.push({
          row: r,
          col: c,
          isWall: isWater,
          isVisited: isVisited && !isActive,
          state,
        });
      }
      gridNodes.push(rowNodes);
    }
    return {
      kind: "grid",
      name: `Grid (${rows}x${cols}) - Islands: ${islandCount}`,
      grid: gridNodes,
    };
  };

  addStep(
    `Having established the mental model, let's now transition to grid sweep across ${rows}x${cols} grid to count islands.`,
    createGridSnapshot(undefined),
  );

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;

      if (rawGrid[r][c] === "1" && !visitedSet.has(key)) {
        islandCount++;
        visitedSet.add(key);

        addStep(
          `Discovered new Island #${islandCount} at cell (${r}, ${c}): incrementing island counter and initiating BFS flood fill.`,
          createGridSnapshot(undefined, [], undefined, false, [r, c]),
        );

        const bfsQueue: Array<[number, number]> = [[r, c]];

        while (bfsQueue.length > 0) {
          const [currR, currC] = bfsQueue.shift()!;

          addStep(
            `Dequeued cell (${currR}, ${currC}) during flood fill: inspecting 4-directional orthogonal neighbors.`,
            createGridSnapshot([currR, currC], bfsQueue),
          );

          for (const [dr, dc] of directions) {
            const nr = currR + dr;
            const nc = currC + dc;
            const nKey = `${nr},${nc}`;

            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              rawGrid[nr][nc] === "1" &&
              !visitedSet.has(nKey)
            ) {
              visitedSet.add(nKey);
              bfsQueue.push([nr, nc]);

              addStep(
                `Flooded connected land cell (${nr}, ${nc}): marked visited and enqueued for further expansion.`,
                createGridSnapshot([currR, currC], bfsQueue, [nr, nc]),
              );
            }
          }
        }

        addStep(
          `Completed flood fill for Island #${islandCount}: all connected land cells claimed.`,
          createGridSnapshot(undefined, [], undefined),
        );
      } else if (rawGrid[r][c] === "0") {
        addStep(
          `Grid sweep at cell (${r}, ${c}): water cell '0' — moving to next position.`,
          createGridSnapshot(undefined, [], [r, c]),
        );
      }
    }
  }

  addStep(
    `Number of Islands complete! Scanned all ${rows * cols} cells and found a total of ${islandCount} distinct island component(s).`,
    createGridSnapshot(undefined, [], undefined, true),
  );

  return steps;
};

export default generateNumberOfIslandsSteps;
