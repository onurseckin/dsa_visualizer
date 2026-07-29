import type { AlgorithmStep, ArrayElement, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface KruskalInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const generateKruskalSteps = (input: KruskalInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];

  const nodes: GraphNodeItem[] = rawNodes.map((n) => ({
    ...n,
    state: "default",
  }));

  const edges: GraphEdgeItem[] = rawEdges.map((e) => ({
    ...e,
    isTraversed: false,
    isPath: false,
  }));

  const parent: Record<string, string> = {};
  const mstEdges: GraphEdgeItem[] = [];

  const conceptualNodes = (stage: number): GraphNodeItem[] =>
    ["P", "Q", "R", "S"].map((id, index) => ({
      id,
      label: id,
      state:
        index === stage % 4
          ? "active"
          : index === (stage + 1) % 4
            ? "compare"
            : index < Math.floor(stage / 4)
              ? "visited"
              : "default",
    }));
  const conceptualEdges = (stage: number): GraphEdgeItem[] =>
    [
      { from: "P", to: "Q", weight: 1 },
      { from: "Q", to: "R", weight: 2 },
      { from: "R", to: "S", weight: 3 },
      { from: "P", to: "S", weight: 4 },
    ].map((edge, index) => ({
      ...edge,
      isTraversed: index === stage % 4,
      isPath: index === Math.floor(stage / 4),
    }));

  const addStep = (
    what: string,
    customNodes?: GraphNodeItem[],
    customEdges?: GraphEdgeItem[],
    customDsuHighlight?: Record<string, "default" | "active" | "comparing" | "visited">,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    const currentNodes = customNodes || nodes;
    const currentEdges = customEdges || edges;

    const dsuElements: ArrayElement[] = currentNodes.map((n) => {
      const parentVal = parent[n.id] ?? n.id;
      const highlighted =
        customDsuHighlight?.[n.id] ??
        (n.state === "active"
          ? "active"
          : n.state === "compare"
            ? "compare"
            : n.state === "visited"
              ? "visited"
              : "default");
      const status = highlighted === "comparing" ? "compare" : highlighted;
      return {
        id: n.id,
        value: parentVal,
        label: n.id,
        state: status,
      };
    });

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase,
        narrative: what,
        primarySnapshot: {
          kind: "composite",
          layout: "grid",
          columns: 2,
          items: [
            {
              id: "kruskal-graph",
              role: "primary",
              snapshot: {
                kind: "graph",
                nodes: currentNodes.map((n) => ({ ...n })),
                edges: currentEdges.map((e) => ({ ...e })),
              },
            },
            {
              id: "kruskal-parent",
              role: "auxiliary",
              snapshot: {
                kind: "array",
                name: "parent",
                elements: dsuElements,
              },
            },
          ],
        },
        auxiliaryState:
          phase === "walkthrough"
            ? {
                customState: {
                  Accepted: mstEdges.length,
                  Weight: mstEdges.reduce((total, edge) => total + (edge.weight ?? 0), 0),
                },
              }
            : undefined,
      }),
    );
  };

  // Phase 1: Inputless Intro (12 Conceptual Steps)
  const conceptualNarratives = [
    "Kruskal's Minimum Spanning Tree method connects a weighted network with the lightest possible collection of edges while keeping every route cycle-free.",
    "A spanning tree reaches every node through one connected structure, so each accepted edge must contribute a new connection rather than redundancy.",
    "The cut property says that the lightest edge crossing a separation between components is always a safe candidate for an optimal tree.",
    "Kruskal makes that safety visible by arranging every candidate edge from the smallest weight toward the largest before any decisions begin.",
    "A tempting edge can still be rejected when its endpoints already share a route, because adding it would close a cycle without expanding reach.",
    "A disjoint-set structure keeps track of the separate components so the algorithm can test each candidate connection quickly.",
    "Each component has a representative root, giving the forest a compact way to answer whether two nodes already belong together.",
    "Finding a representative can compress the route toward its root, keeping future component checks fast as the forest grows.",
    "When two different representatives meet, union merges their components and records one larger connected region.",
    "When the representatives match, the candidate edge stays outside the tree because its endpoints already have a path between them.",
    "When the representatives differ, the candidate edge becomes part of the tree because it joins two previously separate regions.",
    "The process finishes after enough safe joins connect the network, with sorting the candidates providing the dominant cost.",
  ];
  conceptualNarratives.forEach((narrative, stage) => {
    addStep(narrative, conceptualNodes(stage), conceptualEdges(stage), undefined, "intro");
  });

  // Phase 2: Concrete Walkthrough
  if (nodes.length === 0) {
    addStep("Kruskal's MST complete with empty graph: 0 edges added to the spanning tree.");
    return steps;
  }

  const rank: Record<string, number> = {};
  for (const n of nodes) {
    parent[n.id] = n.id;
    rank[n.id] = 1;
  }

  addStep(
    `Initialize DSU with ${nodes.length} singleton sets where each vertex starts as its own representative root leader.`,
    nodes.map((n) => ({ ...n, state: "default" as const })),
    edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
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
    `Sort all ${sortedEdges.length} edges in ascending order of weight: [${sortedEdges
      .map((e) => `${e.from}-${e.to}(w=${e.weight ?? 1})`)
      .join(", ")}].`,
    nodes.map((n) => ({ ...n, state: "default" as const })),
    edges.map((e, idx) => (idx === 0 ? { ...e, isTraversed: true } : { ...e, isTraversed: false })),
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
      `Examine edge ${edge.from} - ${edge.to} (weight ${edge.weight ?? 1}) connecting roots '${rootU}' and '${rootV}'.`,
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
        `Add edge ${edge.from} - ${edge.to} (weight ${edge.weight ?? 1}) to the MST, merging components '${rootU}' and '${rootV}'.`,
      );
    } else {
      if (uNode) uNode.state = "visited";
      if (vNode) vNode.state = "visited";

      addStep(
        `Skip edge ${edge.from} - ${edge.to} (weight ${edge.weight ?? 1}) because both endpoints belong to root '${rootU}', forming a cycle.`,
        nodes.map((n) =>
          n.id === edge.from || n.id === edge.to ? { ...n, state: "visited" as const } : { ...n },
        ),
      );
    }

    if (uNode) uNode.state = "visited";
    if (vNode) vNode.state = "visited";
  }

  const totalMstWeight = mstEdges.reduce((sum, e) => sum + (e.weight ?? 1), 0);

  addStep(
    `Kruskal's MST complete: accepted ${mstEdges.length} edges for a total Minimum Spanning Tree weight of ${totalMstWeight}.`,
    nodes.map((n) => ({ ...n, state: "active" as const })),
  );

  return steps;
};
