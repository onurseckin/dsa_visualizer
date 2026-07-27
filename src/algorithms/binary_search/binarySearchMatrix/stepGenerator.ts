import type { AlgorithmStep, GridCellNode } from "../../../types/dsa";

export interface BinarySearchMatrixInput {
  matrix: number[][];
  target: number;
}

export const generateBinarySearchMatrixSteps = (
  input: BinarySearchMatrixInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { matrix, target } = input;

  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: "Check matrix bounds",
        why: "The matrix has no elements, so the target cannot possibly be inside. We return False immediately.",
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
    "Search 2D Matrix Entry Point",
    `Searching for target = ${target} in an ${rows}x${cols} grid containing ${totalElements} total sorted elements.`,
    0,
    totalElements - 1,
  );

  addStep(
    4,
    `Cache dimensions m = ${rows}, n = ${cols}`,
    `Storing row count m = ${rows} and column count n = ${cols} for index coordinate mapping.`,
    0,
    totalElements - 1,
    undefined,
    undefined,
    { m: rows, n: cols },
  );

  addStep(
    5,
    "Treat the matrix as one virtual sorted list",
    `Each row is sorted and every row starts above where the previous one ended, so reading the ${rows}x${cols} grid row by row gives one sorted list of ${totalElements} values. We initialize low = 0 and high = ${totalElements - 1}.`,
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
      `Check search loop condition: low (${low}) <= high (${high})`,
      `Active search space contains ${high - low + 1} candidate virtual cells between index ${low} and ${high}.`,
      low,
      high,
      undefined,
      undefined,
      { low, high, remaining: high - low + 1 },
    );

    const mid = Math.floor((low + high) / 2);
    addStep(
      8,
      `Compute virtual midpoint index: mid = (${low} + ${high}) // 2 = ${mid}`,
      `Selected 1D virtual midpoint index ${mid}.`,
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
      `Compute row index: row = ${mid} // ${cols} = ${r}`,
      `Virtual midpoint index ${mid} lands in grid row ${r}.`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r },
    );

    addStep(
      10,
      `Compute col index: col = ${mid} % ${cols} = ${c}`,
      `Virtual midpoint index ${mid} lands at column offset ${c} in row ${r}. Coordinate is (${r}, ${c}).`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r, col: c },
    );

    const midVal = matrix[r][c];
    addStep(
      11,
      `Read cell matrix[${r}][${c}] = ${midVal}`,
      `Retrieved value ${midVal} at coordinate (${r}, ${c}) to compare with target ${target}.`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r, col: c, midVal },
    );

    addStep(
      13,
      `Compare mid_val (${midVal}) with target (${target})`,
      `Evaluating whether mid_val ${midVal} equals target ${target}.`,
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
        `Return True — target ${target} found at [${r}][${c}]`,
        `matrix[${r}][${c}] is exactly ${target}, so the search is over. Located target in O(log(m*n)) steps.`,
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
        `mid_val (${midVal}) < target (${target}): Search upper half`,
        `${midVal} is strictly smaller than ${target}. Target must lie in higher index range.`,
        low,
        high,
        mid,
        undefined,
        { midVal, target },
      );
      low = mid + 1;
      addStep(
        16,
        `Set low = mid + 1 = ${low}`,
        `Discarded lower half [0..${mid}]. Next active search window is [${low}..${high}].`,
        low,
        high,
        mid,
        undefined,
        { low, high, mid },
      );
    } else {
      addStep(
        17,
        `mid_val (${midVal}) > target (${target}): Search lower half`,
        `${midVal} is strictly larger than ${target}. Target must lie in lower index range.`,
        low,
        high,
        mid,
        undefined,
        { midVal, target },
      );
      high = mid - 1;
      addStep(
        18,
        `Set high = mid - 1 = ${high}`,
        `Discarded upper half [${mid}..${totalElements - 1}]. Next active search window is [${low}..${high}].`,
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
      `Return False — target ${target} not found`,
      `low (${low}) has crossed past high (${high}), so the search range is empty and no cell ever matched ${target}.`,
      low,
      high,
      undefined,
      undefined,
      { found: false },
    );
  }

  return steps;
};
