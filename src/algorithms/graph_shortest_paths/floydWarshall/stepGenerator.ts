import type {
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import type { FloydWarshallInput } from "./definition";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "All-Pairs Shortest Path (APSP) computes the shortest path distance between every pair of vertices (u, v) in a weighted directed graph.",
    primarySnapshot: {
      kind: "matrix",
      name: "dist",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: 4, state: "default" },
        { row: 0, col: 2, value: "∞", state: "default" },
        { row: 1, col: 0, value: "∞", state: "default" },
        { row: 1, col: 1, value: 0, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "default" },
        { row: 2, col: 0, value: 1, state: "default" },
        { row: 2, col: 1, value: "∞", state: "default" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Running Single-Source Shortest Path (SSSP) like Dijkstra's algorithm V times requires O(V * E log V) time, complex priority queues, and fails when negative weights exist.",
    primarySnapshot: {
      kind: "matrix",
      name: "dist",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "active" },
        { row: 0, col: 1, value: 4, state: "compared" },
        { row: 0, col: 2, value: "∞", state: "default" },
        { row: 1, col: 0, value: "∞", state: "default" },
        { row: 1, col: 1, value: 0, state: "active" },
        { row: 1, col: 2, value: 2, state: "compared" },
        { row: 2, col: 0, value: 1, state: "compared" },
        { row: 2, col: 1, value: "∞", state: "default" },
        { row: 2, col: 2, value: 0, state: "active" },
      ],
    },
  },
  {
    narrative:
      "Floyd-Warshall uses Dynamic Programming over a 2D distance matrix D, where entry D[i][j] holds the shortest distance found so far from vertex i to vertex j.",
    primarySnapshot: {
      kind: "matrix",
      name: "D",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: 4, state: "default" },
        { row: 0, col: 2, value: "∞", state: "default" },
        { row: 1, col: 0, value: "∞", state: "default" },
        { row: 1, col: 1, value: 0, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "default" },
        { row: 2, col: 0, value: 1, state: "default" },
        { row: 2, col: 1, value: "∞", state: "default" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Base matrix initialization sets diagonal entries D[i][i] = 0 (distance to self), direct edge weights D[i][j] = w, and all remaining unconnected pairs to ∞.",
    primarySnapshot: {
      kind: "matrix",
      name: "D",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: 4, state: "active" },
        { row: 0, col: 2, value: "∞", state: "default" },
        { row: 1, col: 0, value: "∞", state: "default" },
        { row: 1, col: 1, value: 0, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "active" },
        { row: 2, col: 0, value: 1, state: "active" },
        { row: 2, col: 1, value: "∞", state: "default" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The core intuition introduces pivot stage k: for every pair (i, j), we check if detouring through intermediate vertex k yields a shorter path: i -> k -> j.",
    primarySnapshot: {
      kind: "matrix",
      name: "Pivot Stage k=2",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: 4, state: "pivot" },
        { row: 0, col: 2, value: 6, state: "active" },
        { row: 1, col: 0, value: "∞", state: "pivot" },
        { row: 1, col: 1, value: 0, state: "pivot" },
        { row: 1, col: 2, value: 2, state: "pivot" },
        { row: 2, col: 0, value: 1, state: "default" },
        { row: 2, col: 1, value: "∞", state: "pivot" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The DP recurrence updates D[i][j] = min(D[i][j], D[i][k] + D[k][j]), combining the optimal subpaths i -> k and k -> j into a shorter route.",
    primarySnapshot: {
      kind: "matrix",
      name: "DP Relaxation",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: 4, state: "compared" },
        { row: 0, col: 2, value: 6, state: "swap" },
        { row: 1, col: 0, value: "∞", state: "default" },
        { row: 1, col: 1, value: 0, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "compared" },
        { row: 2, col: 0, value: 1, state: "default" },
        { row: 2, col: 1, value: "∞", state: "default" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Keeping pivot k as the outermost loop guarantees that when stage k runs, all paths using intermediate vertices indexed 0..k-1 have already been optimized.",
    primarySnapshot: {
      kind: "matrix",
      name: "Outer Pivot Order",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "pivot" },
        { row: 0, col: 1, value: 4, state: "pivot" },
        { row: 0, col: 2, value: 6, state: "pivot" },
        { row: 1, col: 0, value: "∞", state: "default" },
        { row: 1, col: 1, value: 0, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "default" },
        { row: 2, col: 0, value: 1, state: "default" },
        { row: 2, col: 1, value: "∞", state: "default" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Three nested loops sweep V pivots, V sources, and V targets, producing an O(V^3) runtime with simple contiguous O(V^2) memory access.",
    primarySnapshot: {
      kind: "matrix",
      name: "Complexity O(V³)",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: 4, state: "active" },
        { row: 0, col: 2, value: 6, state: "active" },
        { row: 1, col: 0, value: 3, state: "active" },
        { row: 1, col: 1, value: 0, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "active" },
        { row: 2, col: 0, value: 1, state: "active" },
        { row: 2, col: 1, value: 5, state: "active" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "If any diagonal cell D[i][i] becomes negative after completion, a reachable negative cycle exists because vertex i can reach itself at cost less than zero.",
    primarySnapshot: {
      kind: "matrix",
      name: "Negative Cycle Check",
      rows: 3,
      cols: 3,
      rowHeaders: ["1", "2", "3"],
      colHeaders: ["1", "2", "3"],
      cells: [
        { row: 0, col: 0, value: -2, state: "swap" },
        { row: 0, col: 1, value: 4, state: "default" },
        { row: 0, col: 2, value: 6, state: "default" },
        { row: 1, col: 0, value: 3, state: "default" },
        { row: 1, col: 1, value: 0, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "default" },
        { row: 2, col: 0, value: 1, state: "default" },
        { row: 2, col: 1, value: 5, state: "default" },
        { row: 2, col: 2, value: 0, state: "sorted" },
      ],
    },
  },
];

export const generateFloydWarshallSteps = (input: FloydWarshallInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];
  const n = rawNodes.length;

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  if (n === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "The input graph has no vertices, so the all-pairs distance matrix is empty.",
        primarySnapshot: {
          kind: "matrix",
          name: "dist",
          rows: 0,
          cols: 0,
          cells: [],
          rowHeaders: [],
          colHeaders: [],
        },
        variables: { completed: true },
      }),
    );
    return steps;
  }

  const nodeToIdx: Record<string, number> = {};
  rawNodes.forEach((node, idx) => {
    nodeToIdx[node] = idx;
  });

  const dist: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(Infinity));

  const buildMatrixSnapshot = (
    activePos?: [number, number],
    comparePositions: Array<[number, number]> = [],
    pivotIdx?: number,
    isSwap?: boolean,
  ): MatrixVisualSnapshot => {
    const compSet = new Set(comparePositions.map(([r, c]) => `${r},${c}`));
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isCompare = compSet.has(`${r},${c}`);
        const isPivotRowOrCol = pivotIdx !== undefined && (r === pivotIdx || c === pivotIdx);

        let state: MatrixCellItem["state"] = "default";
        if (isActive) {
          state = isSwap ? "swap" : "active";
        } else if (isCompare) {
          state = "compared";
        } else if (isPivotRowOrCol) {
          state = "pivot";
        } else if (r === c) {
          state = "sorted";
        }

        const val = dist[r][c];
        cells.push({
          row: r,
          col: c,
          value: val === Infinity ? "∞" : val,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      name: pivotIdx !== undefined ? `dist (k=${rawNodes[pivotIdx]})` : "dist",
      rows: n,
      cols: n,
      cells,
      rowHeaders: rawNodes,
      colHeaders: rawNodes,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing an ${n} × ${n} distance matrix with all non-diagonal cells set to ∞.`,
      primarySnapshot: buildMatrixSnapshot(),
      variables: { n, edgeCount: rawEdges.length },
    }),
  );

  for (let i = 0; i < n; i++) {
    dist[i][i] = 0;
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "Setting all diagonal entries dist[i][i] = 0, reflecting that every vertex is 0 distance away from itself.",
      primarySnapshot: buildMatrixSnapshot(),
      variables: { diagonalSeeded: true },
    }),
  );

  for (const edge of rawEdges) {
    const uIdx = nodeToIdx[edge.from];
    const vIdx = nodeToIdx[edge.to];
    if (uIdx !== undefined && vIdx !== undefined) {
      dist[uIdx][vIdx] = edge.weight;
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Loaded all ${rawEdges.length} direct edge weights into the distance matrix.`,
      primarySnapshot: buildMatrixSnapshot(),
      variables: { edgeWeightsLoaded: true },
    }),
  );

  for (let k = 0; k < n; k++) {
    const pivotNode = rawNodes[k];

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Starting outer loop stage with pivot vertex k = '${pivotNode}' (index ${k}). Highlighted pivot row and column ${k}.`,
        primarySnapshot: buildMatrixSnapshot(undefined, [], k),
        variables: { k, pivotNode },
      }),
    );

    for (let i = 0; i < n; i++) {
      const uNode = rawNodes[i];
      for (let j = 0; j < n; j++) {
        const vNode = rawNodes[j];
        const distIK = dist[i][k];
        const distKJ = dist[k][j];
        const distIJ = dist[i][j];

        if (distIK !== Infinity && distKJ !== Infinity) {
          const newDist = distIK + distKJ;
          if (newDist < distIJ) {
            steps.push(
              createTutorialStep({
                stepIndex: stepIndex++,
                phase: "walkthrough",
                narrative: `Checking pair (${uNode}, ${vNode}) via pivot '${pivotNode}': detour ${uNode} -> ${pivotNode} -> ${vNode} cost ${distIK} + (${distKJ}) = ${newDist} beats current dist[${uNode}][${vNode}] (${distIJ === Infinity ? "∞" : distIJ}).`,
                primarySnapshot: buildMatrixSnapshot(
                  [i, j],
                  [
                    [i, k],
                    [k, j],
                  ],
                  k,
                  false,
                ),
                variables: { i, j, k, newDist, oldDist: distIJ === Infinity ? "∞" : distIJ },
              }),
            );

            dist[i][j] = newDist;

            steps.push(
              createTutorialStep({
                stepIndex: stepIndex++,
                phase: "walkthrough",
                narrative: `Relaxation succeeds: updated dist[${uNode}][${vNode}] to ${newDist}.`,
                primarySnapshot: buildMatrixSnapshot(
                  [i, j],
                  [
                    [i, k],
                    [k, j],
                  ],
                  k,
                  true,
                ),
                variables: { i, j, k, updatedDist: newDist },
              }),
            );
          }
        }
      }
    }
  }

  let hasNegativeCycle = false;
  for (let i = 0; i < n; i++) {
    if (dist[i][i] < 0) {
      hasNegativeCycle = true;
      break;
    }
  }

  if (hasNegativeCycle) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative:
          "Floyd-Warshall complete: a diagonal entry dist[i][i] dropped below 0, signaling a reachable negative-weight cycle.",
        primarySnapshot: buildMatrixSnapshot(),
        variables: { completed: true, hasNegativeCycle: true },
      }),
    );
  } else {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Floyd-Warshall complete. Tested all vertex pairs across all ${n} pivots; matrix dist contains final all-pairs shortest path distances.`,
        primarySnapshot: buildMatrixSnapshot(),
        variables: { completed: true, hasNegativeCycle: false },
      }),
    );
  }

  return steps;
};
