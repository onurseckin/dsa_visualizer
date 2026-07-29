import type {
  AlgorithmStep,
  ArrayElement,
  DsuNodeItem,
  GraphEdgeDecisionState,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface KruskalInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

type IndexedEdge = {
  readonly index: number;
  readonly from: string;
  readonly to: string;
  readonly weight: number;
};

type NodeState = GraphNodeItem["state"];

const CONCEPTUAL_NODES: readonly GraphNodeItem[] = [
  { id: "P", label: "P", x: 105, y: 145, state: "default" },
  { id: "Q", label: "Q", x: 270, y: 55, state: "default" },
  { id: "R", label: "R", x: 325, y: 225, state: "default" },
  { id: "S", label: "S", x: 500, y: 150, state: "default" },
];

const conceptualNodes = (
  states: Partial<Record<string, NodeState>> = {},
  groups: Partial<Record<string, number>> = {},
): GraphNodeItem[] =>
  CONCEPTUAL_NODES.map((node) => ({
    ...node,
    state: states[node.id] ?? "default",
    group: groups[node.id],
  }));

const conceptualEdges = (states: readonly GraphEdgeDecisionState[]): GraphEdgeItem[] =>
  [
    { from: "P", to: "Q", weight: 1 },
    { from: "R", to: "S", weight: 2 },
    { from: "Q", to: "R", weight: 3 },
    { from: "P", to: "S", weight: 5 },
    { from: "P", to: "R", weight: 4 },
  ].map((edge, index) => ({ ...edge, state: states[index] ?? "default" }));

const conceptualForestEdges = (): GraphEdgeItem[] => [
  { from: "P", to: "Q", weight: 1, state: "selected" },
  { from: "R", to: "S", weight: 2, state: "selected" },
];

const conceptualDsu = (
  parents: Readonly<Record<string, string>>,
  groups: Partial<Record<string, number>> = {},
  activeIds: readonly string[] = [],
): { kind: "dsu"; nodes: DsuNodeItem[]; activeIds: string[] } => ({
  kind: "dsu",
  nodes: CONCEPTUAL_NODES.map((node) => ({
    id: node.id,
    label: node.id,
    parentId: parents[node.id] ?? node.id,
    rank: node.id === "P" && parents.Q === "P" ? 2 : 1,
    group: groups[node.id],
  })),
  activeIds: [...activeIds],
});

const conceptualEdgeOrder = (
  currentIndex: number | undefined,
  states: readonly ArrayElement["state"][] = [],
): { kind: "array"; name: string; mode: "box"; elements: ArrayElement[] } => ({
  kind: "array",
  name: "order",
  mode: "box",
  elements: [
    ["P-Q:1", "P-Q"],
    ["R-S:2", "R-S"],
    ["Q-R:3", "Q-R"],
    ["P-R:4", "P-R"],
    ["P-S:5", "P-S"],
  ].map(([value, id], index) => ({
    id,
    value,
    state: states[index] ?? "default",
    pointers: index === currentIndex ? ["next"] : undefined,
  })),
});

/**
 * The conceptual opening is deliberately data-independent: a learner sees the
 * same model before the tutorial starts applying it to their chosen graph.
 */
const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Imagine that P, Q, R, and S are places that need a network connection, and each edge label is that connection's cost; Kruskal's goal is to reach every place while spending as little as possible.",
    primarySnapshot: {
      kind: "graph" as const,
      nodes: conceptualNodes(),
      edges: conceptualEdges(["default", "default", "default", "default", "default"]),
    },
  },
  {
    narrative:
      "A spanning tree is one connected set of links: the three green links reach all four places, so every place has a route without needing an extra connection.",
    primarySnapshot: {
      kind: "graph" as const,
      nodes: conceptualNodes({}, { P: 0, Q: 0, R: 0, S: 0 }),
      edges: conceptualEdges(["selected", "selected", "selected", "default", "default"]),
    },
  },
  {
    narrative:
      "The orange P-R edge would close the already visible P-Q-R route into a loop, so it is redundant: it costs money but does not help us reach a new place.",
    primarySnapshot: {
      kind: "graph" as const,
      nodes: conceptualNodes({ P: "compare", R: "compare" }, { P: 0, Q: 0, R: 0, S: 1 }),
      edges: conceptualEdges(["selected", "default", "selected", "default", "candidate"]),
    },
  },
  {
    narrative:
      "The P color group is separate from the Q-R-S color group, and P-Q with cost 1 is the cheapest visible edge crossing that cut, ahead of P-R with cost 4 and P-S with cost 5, so it is a safe choice to consider first.",
    primarySnapshot: {
      kind: "graph" as const,
      nodes: conceptualNodes({ P: "compare", Q: "compare" }, { P: 0, Q: 1, R: 1, S: 1 }),
      edges: conceptualEdges(["candidate", "default", "default", "default", "default"]),
    },
  },
  {
    narrative:
      "Sorting puts every candidate into this low-to-high order before the decisions begin; that O(E log E) sort is the dominant cost of Kruskal's algorithm.",
    primarySnapshot: conceptualEdgeOrder(0),
  },
  {
    narrative:
      "Before accepting an edge, the DSU starts with one singleton component per place, shown by every node pointing to itself as its own ROOT; without it, we would repeatedly search the growing network just to ask whether two places are already connected.",
    primarySnapshot: {
      kind: "composite" as const,
      layout: "horizontal" as const,
      items: [
        {
          id: "concept-network",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            nodes: conceptualNodes({}, { P: 0, Q: 1, R: 2, S: 3 }),
            edges: conceptualEdges(["default", "default", "default", "default", "default"]),
          },
        },
        {
          id: "concept-dsu",
          role: "auxiliary" as const,
          snapshot: conceptualDsu({ P: "P", Q: "Q", R: "R", S: "S" }, { P: 0, Q: 1, R: 2, S: 3 }),
        },
      ],
    },
  },
  {
    narrative:
      "For candidate P-Q, follow the highlighted parent entries: P is its own root and Q is its own root, so their different roots show that the edge crosses between components rather than looping inside one.",
    primarySnapshot: {
      kind: "composite" as const,
      layout: "grid" as const,
      columns: 2,
      items: [
        {
          id: "concept-network",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            nodes: conceptualNodes({ P: "active", Q: "active" }, { P: 0, Q: 1, R: 2, S: 3 }),
            edges: conceptualEdges(["candidate", "default", "default", "default", "default"]),
          },
        },
        {
          id: "concept-dsu",
          role: "auxiliary" as const,
          snapshot: conceptualDsu({ P: "P", Q: "Q", R: "R", S: "S" }, { P: 0, Q: 1, R: 2, S: 3 }, [
            "P",
            "Q",
          ]),
        },
      ],
    },
  },
  {
    narrative:
      "Different roots make P-Q safe to accept: the green edge joins the two components, and the DSU now points Q at P to record their shared component.",
    primarySnapshot: {
      kind: "composite" as const,
      layout: "grid" as const,
      columns: 2,
      items: [
        {
          id: "concept-network",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            nodes: conceptualNodes({ P: "active", Q: "active" }, { P: 0, Q: 0, R: 1, S: 2 }),
            edges: conceptualEdges(["selected", "default", "default", "default", "default"]),
          },
        },
        {
          id: "concept-dsu",
          role: "auxiliary" as const,
          snapshot: conceptualDsu({ P: "P", Q: "P", R: "R", S: "S" }, { P: 0, Q: 0, R: 1, S: 2 }, [
            "P",
            "Q",
          ]),
        },
      ],
    },
  },
  {
    narrative:
      "For the orange P-R candidate, follow R's parent arrow to Q and then Q's arrow to the shared root P; because P and R already lead into one component, accepting the edge would make a cycle.",
    primarySnapshot: {
      kind: "composite" as const,
      layout: "grid" as const,
      columns: 2,
      items: [
        {
          id: "concept-network",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            nodes: conceptualNodes({ P: "compare", R: "compare" }, { P: 0, Q: 0, R: 0, S: 1 }),
            edges: conceptualEdges(["selected", "default", "selected", "default", "candidate"]),
          },
        },
        {
          id: "concept-dsu",
          role: "auxiliary" as const,
          snapshot: conceptualDsu({ P: "P", Q: "P", R: "Q", S: "S" }, { P: 0, Q: 0, R: 0, S: 1 }, [
            "P",
            "Q",
            "R",
          ]),
        },
      ],
    },
  },
  {
    narrative:
      "Finding R's root first compresses its path so R now points directly to P while the orange P-R candidate remains under consideration; this visible shortcut, together with rank, keeps later root checks near-constant on average.",
    primarySnapshot: {
      kind: "composite" as const,
      layout: "grid" as const,
      columns: 2,
      items: [
        {
          id: "concept-network",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            nodes: conceptualNodes({ P: "active", R: "active" }, { P: 0, Q: 0, R: 0, S: 1 }),
            edges: conceptualEdges(["selected", "default", "selected", "default", "candidate"]),
          },
        },
        {
          id: "concept-dsu",
          role: "auxiliary" as const,
          snapshot: conceptualDsu({ P: "P", Q: "P", R: "P", S: "S" }, { P: 0, Q: 0, R: 0, S: 1 }, [
            "P",
            "R",
          ]),
        },
      ],
    },
  },
  {
    narrative:
      "P and R still share root P after that shortcut, so Kruskal rejects P-R in red: the green forest already provides their route, and this extra edge would only add a redundant cycle.",
    primarySnapshot: {
      kind: "composite" as const,
      layout: "grid" as const,
      columns: 2,
      items: [
        {
          id: "concept-network",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            nodes: conceptualNodes({ P: "visited", R: "visited" }, { P: 0, Q: 0, R: 0, S: 1 }),
            edges: conceptualEdges(["selected", "default", "selected", "default", "rejected"]),
          },
        },
        {
          id: "concept-dsu",
          role: "auxiliary" as const,
          snapshot: conceptualDsu({ P: "P", Q: "P", R: "P", S: "S" }, { P: 0, Q: 0, R: 0, S: 1 }, [
            "P",
            "R",
          ]),
        },
      ],
    },
  },
  {
    narrative:
      "A connected four-place graph finishes as soon as it has three accepted edges, while the separate two-edge picture on the right must exhaust its options and remains a minimum spanning forest instead of one spanning tree.",
    primarySnapshot: {
      kind: "composite" as const,
      layout: "horizontal" as const,
      items: [
        {
          id: "connected-completion",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            name: "connected",
            nodes: conceptualNodes({}, { P: 0, Q: 0, R: 0, S: 0 }),
            edges: conceptualEdges(["selected", "selected", "selected", "default", "rejected"]),
          },
        },
        {
          id: "forest-completion",
          role: "comparison" as const,
          snapshot: {
            kind: "graph" as const,
            name: "disconnected forest",
            nodes: conceptualNodes({}, { P: 0, Q: 0, R: 1, S: 1 }),
            edges: conceptualForestEdges(),
          },
        },
      ],
    },
  },
];

export const generateKruskalSteps = (input: KruskalInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const addStep = (
    narrative: string,
    primarySnapshot: AlgorithmStep["primarySnapshot"],
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const sourceNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const sourceEdges = Array.isArray(input?.edges) ? input.edges : [];
  const nodeIds = new Set<string>();
  for (const node of sourceNodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`Kruskal visualizer input has duplicate vertex ID "${node.id}".`);
    }
    nodeIds.add(node.id);
  }
  const undirectedPairs = new Set<string>();
  const indexedEdges: IndexedEdge[] = [];
  for (const [index, edge] of sourceEdges.entries()) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(
        `Kruskal visualizer edge ${edge.from}-${edge.to} references a vertex that is not listed.`,
      );
    }
    if (edge.from === edge.to) {
      throw new Error(`Kruskal visualizer does not support self-loop ${edge.from}-${edge.to}.`);
    }
    const pair = [edge.from, edge.to].sort().join("\u0000");
    if (undirectedPairs.has(pair)) {
      throw new Error(
        `Kruskal visualizer does not support duplicate undirected edge ${edge.from}-${edge.to}.`,
      );
    }
    undirectedPairs.add(pair);

    const weight = edge.weight ?? 1;
    if (!Number.isFinite(weight)) {
      throw new Error(
        `Kruskal visualizer edge ${edge.from}-${edge.to} must have a finite numeric weight.`,
      );
    }
    if (weight < -10_000 || weight > 10_000) {
      throw new Error(
        `Kruskal visualizer edge ${edge.from}-${edge.to} has weight ${weight}, outside the supported range [-10000, 10000].`,
      );
    }
    indexedEdges.push({ index, from: edge.from, to: edge.to, weight });
  }

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input.nodes) &&
      input.nodes.length === 6 &&
      input.nodes.some((n) => n.id === "F"));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const nodes = sourceNodes.map((node) => ({ ...node, state: "default" as const }));
  const edgeStates: GraphEdgeDecisionState[] = indexedEdges.map(() => "default");

  const graphNodes = (
    activeIds: readonly string[] = [],
    activeState: NodeState = "active",
  ): GraphNodeItem[] => {
    const active = new Set(activeIds);
    const rootToGroup = new Map<string, number>();
    let nextGroup = 0;

    for (const node of nodes) {
      const root = rootOf(node.id);
      if (!rootToGroup.has(root)) rootToGroup.set(root, nextGroup++);
    }

    return nodes.map((node) => ({
      ...node,
      state: active.has(node.id) ? activeState : "default",
      group: rootToGroup.get(rootOf(node.id)),
    }));
  };

  const graphEdges = (candidateIndex?: number): GraphEdgeItem[] =>
    indexedEdges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      weight: edge.weight,
      state: candidateIndex === edge.index ? "candidate" : edgeStates[edge.index],
    }));

  const graphSnapshot = (activeIds: readonly string[] = [], activeState: NodeState = "active") => ({
    kind: "graph" as const,
    layout: "weighted" as const,
    nodes: graphNodes(activeIds, activeState),
    edges: graphEdges(),
  });

  const sortedEdges = [...indexedEdges].sort(
    (left, right) => left.weight - right.weight || left.index - right.index,
  );
  const parent: Record<string, string> = {};
  const rank: Record<string, number> = {};
  for (const node of nodes) {
    parent[node.id] = node.id;
    rank[node.id] = 1;
  }

  const rootOf = (id: string): string => {
    let root = id;
    const seen = new Set<string>();
    while (parent[root] !== undefined && parent[root] !== root && !seen.has(root)) {
      seen.add(root);
      root = parent[root];
    }
    return root;
  };

  const find = (id: string): string => {
    if (parent[id] === undefined) return id;
    if (parent[id] !== id) parent[id] = find(parent[id]);
    return parent[id];
  };

  const componentCount = (): number => new Set(nodes.map((node) => rootOf(node.id))).size;

  const dsuSnapshot = (activeIds: readonly string[] = [], density?: "compact") => {
    const rootToGroup = new Map<string, number>();
    let nextGroup = 0;
    const dsuNodes: DsuNodeItem[] = nodes.map((node) => {
      const root = rootOf(node.id);
      if (!rootToGroup.has(root)) rootToGroup.set(root, nextGroup++);
      return {
        id: node.id,
        label: node.label ?? node.id,
        parentId: parent[node.id] ?? node.id,
        rank: rank[node.id] ?? 1,
        group: rootToGroup.get(root),
      };
    });

    return { kind: "dsu" as const, nodes: dsuNodes, activeIds: [...activeIds], density };
  };

  const edgeOrderSnapshot = (
    currentPosition?: number,
    pointerPosition?: number,
    orderedEdges: readonly IndexedEdge[] = sortedEdges,
  ): {
    kind: "array";
    name: string;
    mode: "box";
    density: "compact";
    elements: ArrayElement[];
  } => ({
    kind: "array" as const,
    name: "order",
    mode: "box" as const,
    density: "compact" as const,
    elements: orderedEdges.map((edge, position) => ({
      id: `edge-${edge.index}`,
      value: `${edge.from}-${edge.to}:${edge.weight}`,
      state:
        edgeStates[edge.index] === "selected"
          ? "sorted"
          : edgeStates[edge.index] === "rejected"
            ? "visited"
            : currentPosition === position
              ? "compare"
              : "default",
      pointers: pointerPosition === position ? ["next"] : undefined,
    })),
  });

  const persistentSnapshot = (
    activeIds: readonly string[] = [],
    activeState: NodeState = "active",
    candidateIndex?: number,
    currentPosition?: number,
    pointerPosition?: number,
    heading?: string,
    orderedEdges: readonly IndexedEdge[] = sortedEdges,
  ) => ({
    kind: "composite" as const,
    layout: "persistent" as const,
    heading,
    items: [
      {
        id: "kruskal-network",
        role: "primary" as const,
        snapshot: {
          kind: "graph" as const,
          layout: "weighted" as const,
          nodes: graphNodes(activeIds, activeState),
          edges: graphEdges(candidateIndex),
        },
        colSpan: 7,
        rowSpan: 2,
      },
      {
        id: "kruskal-dsu",
        role: "auxiliary" as const,
        snapshot: dsuSnapshot(activeIds, "compact"),
        colSpan: 5,
        rowSpan: 2,
      },
      {
        id: "kruskal-edge-order",
        role: "auxiliary" as const,
        snapshot: edgeOrderSnapshot(currentPosition, pointerPosition, orderedEdges),
        colSpan: 12,
      },
    ],
  });

  if (nodes.length === 0) {
    addStep(
      "This selected input has no vertices, so there is no network to connect and no edges for Kruskal to inspect.",
      graphSnapshot(),
    );
    addStep(
      "The sorted edge order is empty as well, which is why the result is an empty forest with total weight 0.",
      {
        kind: "composite",
        layout: "vertical",
        heading: "Empty forest — total weight 0",
        items: [
          {
            id: "kruskal-edge-order",
            role: "primary",
            snapshot: edgeOrderSnapshot(),
          },
        ],
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected graph input containing ${nodes.length} ${nodes.length === 1 ? "vertex" : "vertices"} and ${indexedEdges.length} ${indexedEdges.length === 1 ? "edge" : "edges"}, all currently unvisited.`,
    {
      kind: "graph",
      layout: "weighted",
      name: "input network",
      nodes: graphNodes(),
      edges: graphEdges(),
    },
  );

  addStep(
    `To execute Kruskal's algorithm on this network, we set up our multi-panel environment: the primary graph on top, a Disjoint Set Union (DSU) panel on the right to track component roots, and a candidate edge array at the bottom.`,
    persistentSnapshot([], "active", undefined, undefined, undefined, undefined, indexedEdges),
  );

  addStep(
    indexedEdges.length > 0
      ? `Sort the ${indexedEdges.length} edge cards by weight from smallest to largest; this O(E log E) preparation determines the exact order in which candidate edges will be evaluated.`
      : "There are no edges to sort, so the graph cannot gain any new connections from this input.",
    persistentSnapshot(
      [],
      "active",
      undefined,
      indexedEdges.length > 0 ? 0 : undefined,
      indexedEdges.length > 0 ? 0 : undefined,
    ),
  );

  addStep(
    `Initialize the DSU with ${nodes.length} singleton ${nodes.length === 1 ? "component" : "components"}; each vertex starts pointing to itself as ROOT with rank 1 until an accepted edge merges it into a larger component.`,
    persistentSnapshot(
      nodes.map((node) => node.id),
      "active",
      undefined,
      indexedEdges.length > 0 ? 0 : undefined,
      indexedEdges.length > 0 ? 0 : undefined,
    ),
  );

  if (nodes.length === 1) {
    addStep(
      "One vertex is already a spanning tree by itself, so the target of |V| - 1 is 0 accepted edges and Kruskal stops without inspecting any edge.",
      persistentSnapshot(
        [nodes[0].id],
        "active",
        undefined,
        undefined,
        undefined,
        "MST — total weight 0",
      ),
    );
    return steps;
  }

  const accepted: IndexedEdge[] = [];
  for (const [position, edge] of sortedEdges.entries()) {
    if (accepted.length === nodes.length - 1) break;

    addStep(
      `Inspect ${edge.from}-${edge.to} with weight ${edge.weight}: the orange edge identifies the candidate, while the highlighted endpoints and their parent arrows ask whether their DSU roots differ.`,
      persistentSnapshot(
        [edge.from, edge.to, rootOf(edge.from), rootOf(edge.to)],
        "compare",
        edge.index,
        position,
        position,
      ),
    );

    const parentsBeforeFind = { ...parent };
    const rootFrom = find(edge.from);
    const rootTo = find(edge.to);
    const compressedIds = nodes
      .map((node) => node.id)
      .filter((id) => parentsBeforeFind[id] !== parent[id]);
    if (compressedIds.length > 0) {
      const compressionChanges = compressedIds
        .map((id) => `${id} now points directly to ${parent[id]}`)
        .join(" and ");
      addStep(
        `Finding the roots shortens the DSU path: ${compressionChanges}, so future root checks can reach that component leader faster while the orange candidate is still under consideration.`,
        persistentSnapshot(
          [edge.from, edge.to, rootOf(edge.from), rootOf(edge.to)],
          "active",
          edge.index,
          position,
          position,
        ),
      );
    }

    if (rootFrom !== rootTo) {
      const rankFrom = rank[rootFrom] ?? 1;
      const rankTo = rank[rootTo] ?? 1;
      let unionChange: string;
      if (rankFrom < rankTo) {
        parent[rootFrom] = rootTo;
        unionChange = `${rootFrom} now points to ${rootTo}`;
      } else {
        parent[rootTo] = rootFrom;
        if (rankFrom === rankTo) {
          rank[rootFrom] = rankFrom + 1;
          unionChange = `${rootTo} now points to ${rootFrom}, and ${rootFrom}'s rank becomes ${rank[rootFrom]}`;
        } else {
          unionChange = `${rootTo} now points to ${rootFrom}`;
        }
      }
      edgeStates[edge.index] = "selected";
      accepted.push(edge);
      addStep(
        `${edge.from} and ${edge.to} had different roots, ${rootFrom} and ${rootTo}, so accepting this green edge safely joins two components; union by rank records the merge because ${unionChange}.`,
        persistentSnapshot(
          [edge.from, edge.to, rootOf(edge.from), rootOf(edge.to)],
          "active",
          undefined,
          undefined,
          position + 1 < sortedEdges.length ? position + 1 : undefined,
        ),
      );
    } else {
      edgeStates[edge.index] = "rejected";
      addStep(
        `${edge.from} and ${edge.to} both lead to root ${rootFrom}, so this edge would close a cycle; it turns red and no union is needed because it cannot reach a new component.`,
        persistentSnapshot(
          [edge.from, edge.to, rootOf(edge.from), rootOf(edge.to)],
          "visited",
          undefined,
          undefined,
          position + 1 < sortedEdges.length ? position + 1 : undefined,
        ),
      );
    }
  }

  const totalWeight = accepted.reduce((total, edge) => total + edge.weight, 0);
  const components = componentCount();
  if (accepted.length === nodes.length - 1) {
    addStep(
      `The graph is connected: ${accepted.length} accepted edges equal |V| - 1, so the green edges form the minimum spanning tree with total weight ${totalWeight}; the remaining gray graph edges need no decision.`,
      persistentSnapshot(
        nodes.map((node) => node.id),
        "active",
        undefined,
        undefined,
        undefined,
        `MST — total weight ${totalWeight}`,
      ),
    );
  } else {
    addStep(
      `Every available graph edge has now been decided, yet the DSU still shows ${components} separate ROOT groups, so the ${accepted.length} green edges form a minimum spanning forest with total weight ${totalWeight}.`,
      persistentSnapshot(
        nodes.map((node) => node.id),
        "active",
        undefined,
        undefined,
        undefined,
        `Minimum spanning forest — total weight ${totalWeight}`,
      ),
    );
  }

  return steps;
};
