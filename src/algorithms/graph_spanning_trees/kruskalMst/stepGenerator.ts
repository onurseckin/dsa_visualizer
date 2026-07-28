import type { AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";

export interface KruskalInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const generateKruskalSteps = (input: KruskalInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes: GraphNodeItem[] = input.nodes.map((n) => ({
    ...n,
    state: "default",
  }));

  const edges: GraphEdgeItem[] = input.edges.map((e) => ({
    ...e,
    isTraversed: false,
    isPath: false,
  }));

  const parent: Record<string, string> = {};
  const mstEdges: GraphEdgeItem[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    const parentHashMap: Record<string, string> = {};
    for (const n of nodes) {
      if (parent[n.id] !== undefined) {
        parentHashMap[`parent[${n.id}]`] = parent[n.id];
      }
    }

    const mstEdgeLabels = mstEdges.map((e) => `(${e.from}-${e.to}: w=${e.weight ?? 1})`);

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({ ...n })),
        edges: edges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        hashMap: parentHashMap,
        visited: mstEdges.flatMap((e) => [e.from, e.to]),
        customState: {
          "DSU Parents": Object.entries(parent)
            .map(([k, v]) => `${k} -> ${v}`)
            .join(", "),
          "MST Edges Count": mstEdges.length,
          "MST Total Weight": mstEdges.reduce((acc, e) => acc + (e.weight ?? 0), 0),
          "MST Edges": mstEdgeLabels.join(", ") || "None",
        },
      },
      variables,
    });
  };

  addStep(
    27,
    "Start Kruskal's MST algorithm",
    "We want the cheapest set of edges that still connects every node. The plan: sort the edges by weight, then greedily keep each one that joins two components that are not yet connected.",
    { nodeCount: nodes.length, edgeCount: edges.length },
  );

  if (nodes.length === 0) {
    addStep(
      39,
      "Kruskal's MST complete",
      "With no nodes there is nothing to connect, so the spanning tree is empty.",
      { mstEdgeCount: 0 },
    );
    return steps;
  }

  const rank: Record<string, number> = {};
  for (const n of nodes) {
    parent[n.id] = n.id;
    rank[n.id] = 1;
  }

  addStep(
    29,
    "Make each node its own set",
    "We give every node parent[v] = v and rank[v] = 1, so each starts as a singleton component. From here, UnionFind tracks component roots and ranks.",
    { dsuInitialized: true },
  );

  const find = (i: string): string => {
    let curr = i;
    while (parent[curr] !== curr) {
      curr = parent[curr];
    }
    return curr;
  };

  const union = (i: string, j: string): boolean => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      const rI = rank[rootI] ?? 1;
      const rJ = rank[rootJ] ?? 1;
      if (rI > rJ) {
        parent[rootJ] = rootI;
      } else if (rI < rJ) {
        parent[rootI] = rootJ;
      } else {
        parent[rootJ] = rootI;
        rank[rootI] = rI + 1;
      }
      return true;
    }
    return false;
  };

  const sortedEdges = [...edges].sort((a, b) => (a.weight ?? 1) - (b.weight ?? 1));

  addStep(
    30,
    `Sort the ${sortedEdges.length} edges by weight`,
    `Cheapest-first is the whole greedy idea: [${sortedEdges
      .map((e) => `${e.from}-${e.to}(w=${e.weight ?? 1})`)
      .join(
        ", ",
      )}]. The lightest edge that bridges two separate components is always safe to keep, so we want to meet those edges first.`,
    { sortedEdgeCount: sortedEdges.length },
  );

  for (const edge of sortedEdges) {
    const origEdge = edges.find(
      (e) =>
        (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from),
    );

    if (origEdge) {
      origEdge.isTraversed = true;
    }

    const uNode = nodes.find((n) => n.id === edge.from);
    const vNode = nodes.find((n) => n.id === edge.to);

    if (uNode) uNode.state = "compare";
    if (vNode) vNode.state = "compare";

    const rootU = find(edge.from);
    const rootV = find(edge.to);

    addStep(
      35,
      `Examine edge ${edge.from} - ${edge.to} (weight ${edge.weight ?? 1})`,
      `Before deciding, we ask UnionFind which component each endpoint lives in: find('${edge.from}') = '${rootU}' and find('${edge.to}') = '${rootV}'. Different roots mean this edge connects new territory.`,
      {
        from: edge.from,
        to: edge.to,
        weight: edge.weight ?? 1,
        rootU,
        rootV,
      },
    );

    const merged = union(edge.from, edge.to);

    if (merged) {
      if (origEdge) {
        origEdge.isPath = true;
      }
      mstEdges.push(edge);

      if (uNode) uNode.state = "active";
      if (vNode) vNode.state = "active";

      addStep(
        36,
        `Add edge ${edge.from} - ${edge.to} to the MST`,
        `'${edge.from}' and '${edge.to}' live in different components ('${rootU}' vs '${rootV}'), so this edge connects them without closing a loop. We keep it and merge the two sets using rank heuristics.`,
        {
          from: edge.from,
          to: edge.to,
          weight: edge.weight ?? 1,
          newParent: rootV,
          mstSize: mstEdges.length,
        },
      );
    } else {
      addStep(
        35,
        `Skip edge ${edge.from} - ${edge.to} (cycle)`,
        `Both '${edge.from}' and '${edge.to}' already trace back to the same root '${rootU}', so they're connected already. Keeping this edge would only close a loop — and a tree never has one.`,
        {
          from: edge.from,
          to: edge.to,
          weight: edge.weight ?? 1,
          sameRoot: rootU,
          skipped: true,
        },
      );
    }

    if (uNode) uNode.state = "visited";
    if (vNode) vNode.state = "visited";
  }

  const totalMstWeight = mstEdges.reduce((sum, e) => sum + (e.weight ?? 1), 0);

  addStep(
    39,
    `Kruskal's MST complete: total weight ${totalMstWeight}`,
    `We kept ${mstEdges.length} edges that connect every node for a total weight of ${totalMstWeight}, and no cheaper spanning tree exists. Fittingly, the up-front sort was the most expensive part — O(E log E) overall.`,
    {
      totalEdgesInMst: mstEdges.length,
      totalMstWeight,
    },
  );

  return steps;
};
