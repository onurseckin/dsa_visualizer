import type { AlgorithmStep, GridCellNode } from "../../../types/dsa";

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

export const generateBinarySearchMatrixSteps = (
  input: BinarySearchMatrixInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const rawMatrix = input?.matrix;
  const target =
    typeof input?.target === "number" ? input.target : DEFAULT_BINARY_SEARCH_MATRIX_INPUT.target;

  if (
    !Array.isArray(rawMatrix) ||
    rawMatrix.length === 0 ||
    !Array.isArray(rawMatrix[0]) ||
    rawMatrix[0].length === 0
  ) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: "Target not found: empty or invalid matrix",
        why: "An empty matrix contains zero searchable elements. The algorithm immediately terminates with false.",
      },
      primarySnapshot: {
        kind: "grid",
        grid: [],
      },
      auxiliaryState: { customState: { result: "false" } },
      variables: { target, found: false },
    });
    return steps;
  }

  const matrix = rawMatrix;

  const rows = matrix.length;
  const cols = matrix[0].length;
  const totalElements = rows * cols;

  const createGridState = (
    low: number,
    high: number,
    mid?: number,
    foundCoord?: { r: number; c: number },
  ): GridCellNode[][] => {
    return matrix.map((rowArr, rIdx) =>
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
          cell.state = "active";
        } else if (flatIdx >= low && flatIdx <= high) {
          cell.state = "compare";
        } else {
          cell.isVisited = true;
        }

        return cell;
      }),
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    low: number,
    high: number,
    mid?: number,
    foundCoord?: { r: number; c: number },
    extraVars: Record<string, string | number | boolean> = {},
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGridState(low, high, mid, foundCoord),
      },
      auxiliaryState: {
        customState: {
          low,
          high,
          mid: mid !== undefined ? mid : "N/A",
          target,
        },
      },
      variables: {
        low,
        high,
        target,
        ...extraVars,
      },
    });
  };

  addStep(
    1,
    "Initialize 2D matrix binary search",
    `Preparing to search for target ${target} in an ${rows}x${cols} grid (${totalElements} total elements) using virtual 1D indexing.`,
    0,
    totalElements - 1,
  );

  addStep(
    4,
    "Cache matrix dimensions",
    `Storing row count m = ${rows} and column count n = ${cols} to perform arithmetic 1D-to-2D coordinate transformations on demand.`,
    0,
    totalElements - 1,
    undefined,
    undefined,
    { m: rows, n: cols },
  );

  addStep(
    5,
    "Establish virtual 1D search bounds",
    `Because every row is sorted and globally strictly increasing, we treat the grid as one contiguous sorted 1D array spanning indices [0..${totalElements - 1}].`,
    0,
    totalElements - 1,
    undefined,
    undefined,
    { low: 0, high: totalElements - 1 },
  );

  let low = 0;
  let high = totalElements - 1;
  let found = false;

  while (low <= high) {
    addStep(
      7,
      "Evaluate active virtual search window",
      `Active search space contains ${high - low + 1} candidate virtual elements between flat index ${low} and ${high}.`,
      low,
      high,
      undefined,
      undefined,
      { low, high, remaining: high - low + 1 },
    );

    const mid = Math.floor((low + high) / 2);
    addStep(
      8,
      "Calculate 1D virtual midpoint index",
      `Computing midpoint mid = (${low} + ${high}) // 2 = ${mid} to divide the remaining search domain in half.`,
      low,
      high,
      mid,
      undefined,
      { low, high, mid },
    );

    const r = Math.floor(mid / cols);
    const c = mid % cols;
    addStep(
      9,
      "Decompose 1D index to 2D row coordinate",
      `Virtual index ${mid} divided by column width ${cols} maps to row ${r} (mid // cols = ${r}).`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r },
    );

    addStep(
      10,
      "Decompose 1D index to 2D column coordinate",
      `Virtual index ${mid} modulo column width ${cols} maps to column ${c} (mid % cols = ${c}). Probing coordinate (${r}, ${c}).`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r, col: c },
    );

    const midVal = matrix[r][c];
    addStep(
      11,
      "Probe grid cell value",
      `Retrieved value ${midVal} at matrix[${r}][${c}] for target comparison.`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r, col: c, midVal },
    );

    addStep(
      13,
      "Compare probed element against target",
      `Evaluating probed cell value ${midVal} against target ${target}.`,
      low,
      high,
      mid,
      undefined,
      { midVal, target, match: midVal === target },
    );

    if (midVal === target) {
      found = true;
      addStep(
        14,
        "Target found in matrix",
        `matrix[${r}][${c}] matches target ${target}. Search succeeds in logarithmic O(log(m*n)) steps.`,
        low,
        high,
        mid,
        { r, c },
        { mid, row: r, col: c, midVal, found: true },
      );
      break;
    }

    if (midVal < target) {
      addStep(
        15,
        "Probed value smaller than target",
        `Probed value ${midVal} is strictly smaller than target ${target}. By monotonic sorting, target must lie in higher flat indices.`,
        low,
        high,
        mid,
        undefined,
        { midVal, target },
      );
      low = mid + 1;
      addStep(
        16,
        "Contract lower search boundary",
        `Updating low = mid + 1 (${low}). Discarding flat index range [0..${mid}]. Active window becomes [${low}..${high}].`,
        low,
        high,
        mid,
        undefined,
        { low, high, mid },
      );
    } else {
      addStep(
        17,
        "Probed value larger than target",
        `Probed value ${midVal} is strictly larger than target ${target}. Target must lie in lower flat indices.`,
        low,
        high,
        mid,
        undefined,
        { midVal, target },
      );
      high = mid - 1;
      addStep(
        18,
        "Contract upper search boundary",
        `Updating high = mid - 1 (${high}). Discarding flat index range [${mid}..${totalElements - 1}]. Active window becomes [${low}..${high}].`,
        low,
        high,
        mid,
        undefined,
        { low, high, mid },
      );
    }
  }

  if (!found) {
    addStep(
      20,
      "Target not found: search window exhausted",
      `Search bounds crossed (low=${low} > high=${high}). Target ${target} is not present in the matrix.`,
      low,
      high,
      undefined,
      undefined,
      { found: false },
    );
  }

  return steps;
};
