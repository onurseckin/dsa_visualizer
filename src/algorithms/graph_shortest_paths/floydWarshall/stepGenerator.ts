import type { AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../../types/dsa";
import type { FloydWarshallInput } from "./definition";

export const generateFloydWarshallSteps = (input: FloydWarshallInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];
  const n = rawNodes.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: "Initialize on an empty graph",
        why: "There are no vertices, so the all-pairs table is empty and we are done before we start.",
      },
      primarySnapshot: {
        kind: "matrix",
        rows: 0,
        cols: 0,
        cells: [],
        rowHeaders: [],
        colHeaders: [],
        title: "Empty Matrix",
      },
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

  const buildMatrixSnapshot = (
    activePos?: [number, number],
    comparePositions: Array<[number, number]> = [],
    pivotIdx?: number,
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
          state = "active";
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
      rows: n,
      cols: n,
      cells,
      rowHeaders: rawNodes,
      colHeaders: rawNodes,
      title:
        pivotIdx !== undefined
          ? `Distance Matrix (Pivot k = ${rawNodes[pivotIdx]})`
          : "Distance Matrix",
    };
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
    codeLine: 2,
    explanation: {
      what: `n = ${n} nodes in the graph`,
      why: "We record the vertex count once. All three loop bounds and matrix dimensions derive from n.",
    },
    primarySnapshot: buildMatrixSnapshot(),
    auxiliaryState: {
      customState: { n, "Total Edges": rawEdges.length },
    },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize the ${n}x${n} distance matrix to infinity`,
      why: "We allocate an n×n table and fill every cell with ∞ — meaning 'no direct route yet'.",
    },
    primarySnapshot: buildMatrixSnapshot(),
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: { "Total Nodes": n, "Total Edges": rawEdges.length },
    },
    variables: { n, edgeCount: rawEdges.length },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Build node-to-index mapping",
      why: "We map node labels to integer indices so we can address the dist matrix with integers.",
    },
    primarySnapshot: buildMatrixSnapshot(),
    auxiliaryState: {
      customState: { "Node Map": rawNodes.map((node, i) => `${node}=${i}`).join(", ") },
    },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Set diagonal entries: each node is 0 away from itself",
      why: "The distance from any node to itself is 0. This is the base case for self-paths.",
    },
    primarySnapshot: buildMatrixSnapshot(),
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: { Diagonal: "dist[i][i] = 0" },
    },
    variables: { n },
  });

  for (let i = 0; i < n; i++) {
    dist[i][i] = 0;
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `All ${n} diagonal cells set to 0`,
      why: `dist[0][0] through dist[${n - 1}][${n - 1}] are now 0. Every other cell stays at ∞ until populated.`,
    },
    primarySnapshot: buildMatrixSnapshot(),
    auxiliaryState: { distanceTable: getDistanceTableRecord() },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: "Seed matrix with direct edge weights",
      why: "We copy each direct edge (u, v, w) directly into dist[u][v] = w.",
    },
    primarySnapshot: buildMatrixSnapshot(),
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: { "Edges Seeded": rawEdges.length },
    },
    variables: { edgeCount: rawEdges.length },
  });

  for (const edge of rawEdges) {
    const uIdx = nodeToIdx[edge.from];
    const vIdx = nodeToIdx[edge.to];
    if (uIdx !== undefined && vIdx !== undefined) {
      dist[uIdx][vIdx] = edge.weight;
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `All ${rawEdges.length} direct edge weights loaded into dist matrix`,
      why: "The matrix now holds initial edge costs. The triple loop will evaluate detours through intermediate pivots.",
    },
    primarySnapshot: buildMatrixSnapshot(),
    auxiliaryState: { distanceTable: getDistanceTableRecord() },
    variables: { edgeCount: rawEdges.length },
  });

  for (let k = 0; k < n; k++) {
    const pivotNode = rawNodes[k];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Try node '${pivotNode}' (index ${k}) as the pivot`,
        why: `We now allow paths to pass through '${pivotNode}'. For every pair (i, j), we check if going i → ${pivotNode} → j is cheaper than current dist[i][j].`,
      },
      primarySnapshot: buildMatrixSnapshot(undefined, [], k),
      auxiliaryState: {
        distanceTable: getDistanceTableRecord(),
        customState: { "Pivot Node (k)": pivotNode, "Pivot Index": k },
      },
      variables: { k, pivotNode },
    });

    for (let i = 0; i < n; i++) {
      const uNode = rawNodes[i];
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 13,
        explanation: {
          what: `Pivot ${pivotNode}: iterate source i = ${uNode}`,
          why: `Testing source '${uNode}' to see if routing through '${pivotNode}' improves any paths starting at '${uNode}'.`,
        },
        primarySnapshot: buildMatrixSnapshot(undefined, [], k),
        auxiliaryState: {
          distanceTable: getDistanceTableRecord(),
          customState: { "Pivot (k)": pivotNode, "Source (i)": uNode },
        },
        variables: { k, i },
      });

      for (let j = 0; j < n; j++) {
        const vNode = rawNodes[j];
        const distIK = dist[i][k];
        const distKJ = dist[k][j];
        const distIJ = dist[i][j];

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 14,
          explanation: {
            what: `Test destination j = ${vNode}`,
            why: `Check whether dist[${uNode}][${pivotNode}] + dist[${pivotNode}][${vNode}] improves dist[${uNode}][${vNode}] = ${distIJ === Infinity ? "∞" : distIJ}.`,
          },
          primarySnapshot: buildMatrixSnapshot(
            [i, j],
            [
              [i, k],
              [k, j],
            ],
            k,
          ),
          auxiliaryState: {
            distanceTable: getDistanceTableRecord(),
            customState: { "Source (i)": uNode, "Target (j)": vNode, "Pivot (k)": pivotNode },
          },
          variables: { i, j, k },
        });

        if (distIK !== Infinity && distKJ !== Infinity) {
          const newDist = distIK + distKJ;
          steps.push({
            stepIndex: stepIndex++,
            codeLine: 15,
            explanation: {
              what: `Check if detour is finite: dist[${uNode}][${pivotNode}] and dist[${pivotNode}][${vNode}] are both finite`,
              why: `Detour ${uNode} → ${pivotNode} → ${vNode} costs ${distIK} + ${distKJ} = ${newDist}.`,
            },
            primarySnapshot: buildMatrixSnapshot(
              [i, j],
              [
                [i, k],
                [k, j],
              ],
              k,
            ),
            auxiliaryState: {
              distanceTable: getDistanceTableRecord(),
              customState: {
                "Source (i)": uNode,
                "Target (j)": vNode,
                "Pivot (k)": pivotNode,
                "Detour Dist": newDist,
                "Current Dist": distIJ === Infinity ? "∞" : distIJ,
              },
            },
            variables: { i, j, k, uNode, vNode, pivotNode, newDist, distIJ },
          });

          if (newDist < distIJ) {
            steps.push({
              stepIndex: stepIndex++,
              codeLine: 16,
              explanation: {
                what: `Improvement condition: detour cost ${newDist} < current ${distIJ === Infinity ? "∞" : distIJ}`,
                why: `Routing via '${pivotNode}' saves distance. We will update dist[${uNode}][${vNode}] in the next step.`,
              },
              primarySnapshot: buildMatrixSnapshot(
                [i, j],
                [
                  [i, k],
                  [k, j],
                ],
                k,
              ),
              auxiliaryState: { distanceTable: getDistanceTableRecord() },
              variables: { i, j, k, newDist, distIJ },
            });

            dist[i][j] = newDist;

            steps.push({
              stepIndex: stepIndex++,
              codeLine: 17,
              explanation: {
                what: `Update dist['${uNode}']['${vNode}'] = ${newDist}`,
                why: `Detouring through '${pivotNode}' gets us from '${uNode}' to '${vNode}' for ${distIK} + ${distKJ} = ${newDist}, beating the previous ${distIJ === Infinity ? "∞" : distIJ}.`,
              },
              primarySnapshot: buildMatrixSnapshot(
                [i, j],
                [
                  [i, k],
                  [k, j],
                ],
                k,
              ),
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
        ? "A diagonal entry dist[i][i] dropped below 0, indicating a negative-weight cycle."
        : `Every pair has now been tested against all ${n} possible pivots, so the matrix holds the true shortest distance between every pair of nodes.`,
    },
    primarySnapshot: buildMatrixSnapshot(),
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
