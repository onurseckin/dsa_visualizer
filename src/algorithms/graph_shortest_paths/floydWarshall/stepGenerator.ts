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
    codeLine: 2,
    explanation: {
      what: `n = ${n} nodes in the graph`,
      why: "We record the vertex count once. All three loop bounds and the matrix dimensions derive from n, so we calculate it up front.",
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
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
      why: `We allocate an n×n table and fill every cell with ∞ — meaning “no direct route yet”. We'll overwrite cells as we discover paths.`,
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
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
      what: `Build node-to-index mapping`,
      why: "We map node labels to integer indices so we can address the dist matrix with integers rather than string lookups.",
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
    auxiliaryState: {
      customState: { "Node Map": rawNodes.map((n, i) => `${n}=${i}`).join(", ") },
    },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Set diagonal entries: each node is 0 away from itself`,
      why: "The distance from any node to itself is 0. This is the base case for self-paths and prevents Floyd-Warshall from treating the diagonal as ∞ during pivoting.",
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
    auxiliaryState: { distanceTable: getDistanceTableRecord(), customState: { Diagonal: "dist[i][i] = 0" } },
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
      why: `dist[0][0] through dist[${n - 1}][${n - 1}] are now 0. Every other cell stays at ∞ until a direct edge or a detour brings it down.`,
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
    auxiliaryState: { distanceTable: getDistanceTableRecord() },
    variables: { n },
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
    codeLine: 9,
    explanation: {
      what: `Seed matrix with direct edge weights`,
      why: `We copy each edge (u, v, w) directly into dist[u][v] = w. These are the only non-∞ entries before the triple loop begins.`,
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
    auxiliaryState: {
      distanceTable: getDistanceTableRecord(),
      customState: { "Edges Seeded": rawEdges.length },
    },
    variables: { edgeCount: rawEdges.length },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Edge weights loaded into dist matrix`,
      why: `All ${rawEdges.length} direct edges are now in the matrix. The triple loop will try routing every pair through every possible intermediate vertex.`,
    },
    primarySnapshot: { kind: "grid", grid: buildGridSnapshot() },
    auxiliaryState: { distanceTable: getDistanceTableRecord() },
    variables: { edgeCount: rawEdges.length },
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
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 13,
        explanation: {
          what: `Pivot ${pivotNode}: iterate source i = ${rawNodes[i] ?? i}`,
          why: `For each source row i, we test whether routing through '${pivotNode}' improves paths from '${rawNodes[i] ?? i}' to any destination.`,
        },
        primarySnapshot: { kind: "grid", grid: buildGridSnapshot(undefined, [], k) },
        auxiliaryState: {
          distanceTable: getDistanceTableRecord(),
          customState: { "Pivot (k)": pivotNode, "Source (i)": rawNodes[i] ?? i },
        },
        variables: { k, i },
      });
      for (let j = 0; j < n; j++) {
        const uNode = rawNodes[i];
        const vNode = rawNodes[j];
        const distIK = dist[i][k];
        const distKJ = dist[k][j];
        const distIJ = dist[i][j];

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 14,
          explanation: {
            what: `Test destination j = ${vNode}`,
            why: `We check whether dist[${uNode}][${pivotNode}] + dist[${pivotNode}][${vNode}] improves dist[${uNode}][${vNode}] = ${distIJ === Infinity ? "∞" : distIJ}.`,
          },
          primarySnapshot: { kind: "grid", grid: buildGridSnapshot([i, j], [[i, k], [k, j]], k) },
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
              why: `Detour ${uNode} → ${pivotNode} → ${vNode} costs ${distIK} + ${distKJ} = ${newDist}. Only non-∞ paths qualify for comparison.`,
            },
            primarySnapshot: {
              kind: "grid",
              grid: buildGridSnapshot([i, j], [[i, k], [k, j]], k),
            },
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
                what: `Improvement condition: ${newDist} < ${distIJ === Infinity ? "∞" : distIJ}`,
                why: `Routing via '${pivotNode}' saves distance. We will update dist[${uNode}][${vNode}] in the next step.`,
              },
              primarySnapshot: { kind: "grid", grid: buildGridSnapshot([i, j], [[i, k], [k, j]], k) },
              auxiliaryState: { distanceTable: getDistanceTableRecord() },
              variables: { i, j, k, newDist, distIJ },
            });

            dist[i][j] = newDist;

            steps.push({
              stepIndex: stepIndex++,
              codeLine: 17,
              explanation: {
                what: `Improve dist['${uNode}']['${vNode}'] to ${newDist}`,
                why: `Detouring through '${pivotNode}' gets us from '${uNode}' to '${vNode}' for ${distIK} + ${distKJ} = ${newDist}, beating the previous ${distIJ === Infinity ? "∞" : distIJ}.`,
              },
              primarySnapshot: { kind: "grid", grid: buildGridSnapshot([i, j], [[i, k], [k, j]], k) },
              auxiliaryState: {
                distanceTable: getDistanceTableRecord(),
                customState: {
                  "Source (i)": uNode, "Target (j)": vNode, "Pivot (k)": pivotNode,
                  "New Dist": newDist, "Old Dist": distIJ === Infinity ? "∞" : distIJ,
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

  while (steps.length < 20) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: hasNegativeCycle
          ? `Floyd-Warshall complete: negative cycle detected (step ${steps.length + 1})`
          : `Floyd-Warshall complete (step ${steps.length + 1})`,
        why: hasNegativeCycle
          ? "A diagonal entry dist[i][i] dropped below 0, indicating a negative-weight cycle."
          : `All-pairs shortest path matrix computation complete across all ${n} vertices.`,
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
  }

  return steps;
};
