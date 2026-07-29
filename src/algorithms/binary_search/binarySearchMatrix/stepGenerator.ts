import type {
  AlgorithmStep,
  ElementState,
  GridCellNode,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface BinarySearchMatrixInput {
  matrix: number[][];
  target: number;
}

export const DEFAULT_BINARY_SEARCH_MATRIX_INPUT: BinarySearchMatrixInput = {
  matrix: [
    [1, 3, 5, 7, 9],
    [10, 12, 14, 16, 18],
    [20, 22, 24, 26, 28],
    [30, 32, 34, 36, 38],
    [40, 42, 44, 46, 48],
  ],
  target: 34,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Search a 2D Matrix finds a target value in an m × n grid where each row is sorted and each row starts with a number strictly greater than the last number of the previous row.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "default" },
          { row: 0, col: 1, distance: 3, state: "default" },
          { row: 0, col: 2, distance: 5, state: "default" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "default" },
          { row: 1, col: 1, distance: 12, state: "default" },
          { row: 1, col: 2, distance: 14, state: "default" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "default" },
          { row: 2, col: 1, distance: 22, state: "default" },
          { row: 2, col: 2, distance: 24, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Instead of a 2D scan taking O(M · N) time or allocating a new 1D array, we treat the grid as a virtual 1D sorted array of length M · N using coordinate math in O(1) space.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "compare" },
          { row: 0, col: 1, distance: 3, state: "compare" },
          { row: 0, col: 2, distance: 5, state: "compare" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "compare" },
          { row: 1, col: 1, distance: 12, state: "compare" },
          { row: 1, col: 2, distance: 14, state: "compare" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "compare" },
          { row: 2, col: 1, distance: 22, state: "compare" },
          { row: 2, col: 2, distance: 24, state: "compare" },
        ],
      ],
    },
  },
  {
    narrative:
      "We initialize binary search bounds over the flat index space [0 ... M · N - 1], setting low = 0 and high = M · N - 1.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "active" },
          { row: 0, col: 1, distance: 3, state: "compare" },
          { row: 0, col: 2, distance: 5, state: "compare" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "compare" },
          { row: 1, col: 1, distance: 12, state: "compare" },
          { row: 1, col: 2, distance: 14, state: "compare" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "compare" },
          { row: 2, col: 1, distance: 22, state: "compare" },
          { row: 2, col: 2, distance: 24, state: "active" },
        ],
      ],
    },
  },
  {
    narrative:
      "In each iteration, we calculate the virtual 1D midpoint index mid = (low + high) // 2.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "compare" },
          { row: 0, col: 1, distance: 3, state: "compare" },
          { row: 0, col: 2, distance: 5, state: "compare" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "compare" },
          { row: 1, col: 1, distance: 12, state: "active" },
          { row: 1, col: 2, distance: 14, state: "compare" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "compare" },
          { row: 2, col: 1, distance: 22, state: "compare" },
          { row: 2, col: 2, distance: 24, state: "compare" },
        ],
      ],
    },
  },
  {
    narrative:
      "Coordinate Conversion Math: we convert 1D index mid to 2D grid coordinates using row = mid // cols and col = mid % cols.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "visited" },
          { row: 0, col: 1, distance: 3, state: "visited" },
          { row: 0, col: 2, distance: 5, state: "visited" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "visited" },
          { row: 1, col: 1, distance: 12, state: "active" },
          { row: 1, col: 2, distance: 14, state: "compare" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "compare" },
          { row: 2, col: 1, distance: 22, state: "compare" },
          { row: 2, col: 2, distance: 24, state: "compare" },
        ],
      ],
    },
  },
  {
    narrative:
      "We probe cell matrix[row][col]: if equal to target, return true; if less than target, set low = mid + 1; if greater than target, set high = mid - 1.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "visited" },
          { row: 0, col: 1, distance: 3, state: "visited" },
          { row: 0, col: 2, distance: 5, state: "visited" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "visited" },
          { row: 1, col: 1, distance: 12, state: "visited" },
          { row: 1, col: 2, distance: 14, state: "compare" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "compare" },
          { row: 2, col: 1, distance: 22, state: "swap" },
          { row: 2, col: 2, distance: 24, state: "compare" },
        ],
      ],
    },
  },
  {
    narrative:
      "By halving the virtual 1D search space in every step, binary search eliminates half of the remaining grid cells in O(1) step time.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "visited" },
          { row: 0, col: 1, distance: 3, state: "visited" },
          { row: 0, col: 2, distance: 5, state: "visited" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "visited" },
          { row: 1, col: 1, distance: 12, state: "visited" },
          { row: 1, col: 2, distance: 14, state: "visited" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "visited" },
          { row: 2, col: 1, distance: 22, state: "active" },
          { row: 2, col: 2, distance: 24, state: "visited" },
        ],
      ],
    },
  },
  {
    narrative:
      "This delivers optimal O(log(M · N)) logarithmic search time and O(1) auxiliary space complexity.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "visited" },
          { row: 0, col: 1, distance: 3, state: "visited" },
          { row: 0, col: 2, distance: 5, state: "visited" },
        ],
        [
          { row: 1, col: 0, distance: 10, state: "visited" },
          { row: 1, col: 1, distance: 12, state: "visited" },
          { row: 1, col: 2, distance: 14, state: "visited" },
        ],
        [
          { row: 2, col: 0, distance: 20, state: "visited" },
          { row: 2, col: 1, distance: 22, state: "sorted" },
          { row: 2, col: 2, distance: 24, state: "visited" },
        ],
      ],
    },
  },
];

export const generateBinarySearchMatrixSteps = (
  input: BinarySearchMatrixInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawMatrix = input?.matrix;
  const target =
    typeof input?.target === "number" ? input.target : DEFAULT_BINARY_SEARCH_MATRIX_INPUT.target;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  for (const intro of createIntroSnapshots()) {
    addStep(intro.narrative, intro.primarySnapshot, "intro");
  }

  if (
    !Array.isArray(rawMatrix) ||
    rawMatrix.length === 0 ||
    !Array.isArray(rawMatrix[0]) ||
    rawMatrix[0].length === 0
  ) {
    addStep(
      "The input matrix is empty or invalid, so target cannot be located; returning false immediately.",
      {
        kind: "grid",
        grid: [],
      },
    );
    return steps;
  }

  const matrix = rawMatrix;
  const rows = matrix.length;
  const cols = matrix[0].length;
  const totalElements = rows * cols;

  const createGridSnapshot = (
    low: number,
    high: number,
    mid?: number,
    midState: ElementState = "active",
    foundCoord?: { r: number; c: number },
  ): PrimaryVisualSnapshot => {
    const grid: GridCellNode[][] = matrix.map((rowArr, rIdx) =>
      rowArr.map((val, cIdx) => {
        const flatIdx = rIdx * cols + cIdx;
        const cell: GridCellNode = {
          row: rIdx,
          col: cIdx,
          distance: val,
          state: "default",
        };

        if (foundCoord && foundCoord.r === rIdx && foundCoord.c === cIdx) {
          cell.state = "sorted";
          cell.isPath = true;
        } else if (mid !== undefined && flatIdx === mid) {
          cell.state = midState;
        } else if (flatIdx >= low && flatIdx <= high) {
          cell.state = "compare";
        } else {
          cell.isVisited = true;
        }

        return cell;
      }),
    );

    return {
      kind: "grid",
      grid,
    };
  };

  addStep(
    `Having established the mental model, let's now transition to our selected ${rows}x${cols} grid (${totalElements} total cells) searching for target = ${target}.`,
    createGridSnapshot(0, totalElements - 1),
  );

  let low = 0;
  let high = totalElements - 1;
  let found = false;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const r = Math.floor(mid / cols);
    const c = mid % cols;
    const midVal = matrix[r][c];

    addStep(
      `Calculate virtual midpoint mid = ${mid} (range [${low} ... ${high}]): maps to 2D cell matrix[${r}][${c}] with value ${midVal}.`,
      createGridSnapshot(low, high, mid, "active"),
    );

    if (midVal === target) {
      found = true;
      addStep(
        `Probed matrix[${r}][${c}] = ${midVal} matches target ${target}! Target located successfully; returning true.`,
        createGridSnapshot(low, high, mid, "sorted", { r, c }),
      );
      break;
    } else if (midVal < target) {
      addStep(
        `Probed value ${midVal} < target ${target}: target must lie to the right; advance low from ${low} to ${mid + 1}.`,
        createGridSnapshot(mid + 1, high, mid, "swap"),
      );
      low = mid + 1;
    } else {
      addStep(
        `Probed value ${midVal} > target ${target}: target must lie to the left; decrease high from ${high} to ${mid - 1}.`,
        createGridSnapshot(low, mid - 1, mid, "swap"),
      );
      high = mid - 1;
    }
  }

  if (!found) {
    addStep(
      `Search range exhausted (low ${low} > high ${high}): target ${target} does not exist in matrix; returning false.`,
      createGridSnapshot(-1, -1),
    );
  }

  return steps;
};

export default generateBinarySearchMatrixSteps;
