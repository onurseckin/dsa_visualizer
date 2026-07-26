import type { AlgorithmStep, GridCellNode } from "../../../types/dsa";
import type { FloydWarshallInput } from "./definition";

export const generateFloydWarshallSteps = (input: FloydWarshallInput): AlgorithmStep[] => {
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
        what: "Initialize on an empty graph",
        why: "There are no vertices, so the all-pairs table is empty and we are done before we start.",
      },
      primarySnapshot: { kind: "grid", grid: [] },
      auxiliaryState: { customState: { NodeCount: 0 } },
      variables: { completed: true },
    });
    return steps;
  }

  const nodeToIdx: Record<string, number> = {};
  rawNodes.forEach((node, idx) => {
    nodeToIdx[node] = idx;
  });

  const dist: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(Infinity));

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
    pivotIdx?: number,
  ) => {
    const compSet = new Set(comparePositions.map(([r, c]) => `${r},${c}`));
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c): GridCellNode => {
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isCompare = compSet.has(`${r},${c}`);
        const isPivotRowOrCol = pivotIdx !== undefined && (r === pivotIdx || c === pivotIdx);

        return {
          row: r,
          col: c,
          distance: dist[r][c],
          state: isActive
            ? "active"
            : isCompare
              ? "compare"
              : isPivotRowOrCol
                ? "pivot"
                : r === c
                  ? "visited"
                  : "default",
        };
      }),
    );
  };

  const getDistanceTableRecord = (): Record<string, number> => {
    const rec: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rec[`${rawNodes[i]}→${rawNodes[j]}`] = dist[i][j];
      }
    }
    return rec;
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize the ${n}x${n} distance matrix`,
      why: "We seed the table with what we know directly: every node is 0 away from itself, and each edge fills in its own weight. Every other pair starts at ∞ until we discover some route between them.",
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: { "Total Nodes": n, "Total Edges": rawEdges.length },
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
      primarySnapshot: { kind: "grid", grid: buildGridSnapshot(undefined, [], k) },
      auxiliaryState: {
        distanceTable: getDistanceTableRecord(),
        customState: { "Pivot Node (k)": pivotNode, "Pivot Index": k },
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
                why: `Detouring through '${pivotNode}' gets us from '${uNode}' to '${vNode}' for ${distIK} + ${distKJ} = ${newDist}, beating the previous ${distIJ === Infinity ? "∞" : distIJ}. We write the cheaper value into the table.`,
              },
              primarySnapshot: {
                kind: "grid",
                grid: buildGridSnapshot(
                  [i, j],
                  [
                    [i, k],
                    [k, j],
                  ],
                  k,
                ),
              },
              auxiliaryState: {
                distanceTable: getDistanceTableRecord(),
                customState: {
                  "Source (i)": uNode,
                  "Target (j)": vNode,
                  "Pivot (k)": pivotNode,
                  "New Dist": newDist,
                  "Old Dist": distIJ === Infinity ? "∞" : distIJ,
                },
              },
              variables: { i, j, k, uNode, vNode, pivotNode, newDist },
            });
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: hasNegativeCycle
        ? "Floyd-Warshall complete: negative cycle detected"
        : "Floyd-Warshall complete",
      why: hasNegativeCycle
        ? "A diagonal entry dist[i][i] dropped below 0, meaning some node can reach itself at negative total cost — a negative-weight cycle. Shortest paths that touch it are unbounded."
        : `Every pair has now been tested against all ${n} possible pivots, so the matrix holds the true shortest distance between every pair of nodes. Those three nested loops are exactly where the O(V^3) cost comes from.`,
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: {
        "Has Negative Cycle": hasNegativeCycle ? "Yes" : "No",
        Completed: "True",
      },
    },
    variables: { completed: true, hasNegativeCycle },
  });

  return steps;
};
