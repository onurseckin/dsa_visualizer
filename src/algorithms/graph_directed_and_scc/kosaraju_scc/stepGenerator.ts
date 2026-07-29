import type {
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import type { KosarajuSccInput } from "./types";
import { DEFAULT_KOSARAJU_INPUT } from "./types";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Strongly Connected Component (SCC) is a maximal subgraph of a directed graph where every pair of vertices (u, v) is mutually reachable from each other.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "active" },
        { id: "1", label: "1", state: "active" },
        { id: "2", label: "2", state: "active" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1", isTraversed: true },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "0", isTraversed: true },
        { from: "1", to: "3" },
      ],
    },
  },
  {
    narrative:
      "Condensing each SCC into a single supernode simplifies any directed graph into a Directed Acyclic Graph (DAG) of component dependencies.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "SCC-1", label: "SCC 1 {0,1,2}", state: "visited" },
        { id: "SCC-2", label: "SCC 2 {3}", state: "default" },
      ],
      edges: [{ from: "SCC-1", to: "SCC-2" }],
    },
  },
  {
    narrative:
      "The graph transpose G^T is constructed by reversing the direction of every edge in G, preserving internal SCCs while inverting component reachability.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "visited" },
        { id: "1", label: "1", state: "visited" },
        { id: "2", label: "2", state: "visited" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "1", to: "0", isTraversed: true },
        { from: "2", to: "1", isTraversed: true },
        { from: "0", to: "2", isTraversed: true },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Kosaraju's algorithm uses a two-pass DFS strategy: Pass 1 computes post-order finish times on G; Pass 2 explores G^T in decreasing finish order to extract SCCs.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0 (Finish 3)", state: "sorted" },
        { id: "1", label: "1 (Finish 2)", state: "sorted" },
        { id: "2", label: "2 (Finish 1)", state: "sorted" },
        { id: "3", label: "3 (Finish 4)", state: "active" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "0" },
        { from: "1", to: "3" },
      ],
    },
  },
  {
    narrative:
      "In Pass 1, a DFS traversal on original graph G pushes each vertex onto a finish stack as its recursive exploration completes.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "visited" },
        { id: "1", label: "1", state: "visited" },
        { id: "2", label: "2 (Stack Top)", state: "active" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "0" },
        { from: "1", to: "3" },
      ],
    },
  },
  {
    narrative:
      "The vertex on top of the finish stack is guaranteed to be a sink component in transposed graph G^T, making it ideal for Pass 2 root selection.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "default" },
        { id: "1", label: "1", state: "default" },
        { id: "2", label: "2", state: "default" },
        { id: "3", label: "3 (Top)", state: "active" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "0" },
        { from: "1", to: "3" },
      ],
    },
  },
  {
    narrative:
      "In Pass 2, reversing edge directions traps DFS traversals within a single component, preventing traversal leaks into other SCCs.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0 (SCC 1)", state: "swap" },
        { id: "1", label: "1 (SCC 1)", state: "swap" },
        { id: "2", label: "2 (SCC 1)", state: "swap" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "1", to: "0", isPath: true },
        { from: "2", to: "1", isPath: true },
        { from: "0", to: "2", isPath: true },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Popping each unvisited vertex from the finish stack launches a new Transpose DFS pass, peeling off one maximal SCC at a time.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0 (SCC 1)", state: "sorted" },
        { id: "1", label: "1 (SCC 1)", state: "sorted" },
        { id: "2", label: "2 (SCC 1)", state: "sorted" },
        { id: "3", label: "3 (SCC 2)", state: "active" },
      ],
      edges: [
        { from: "1", to: "0", isPath: true },
        { from: "2", to: "1", isPath: true },
        { from: "0", to: "2", isPath: true },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Two linear DFS passes plus one graph transposition partition all vertices into their strongly connected components in optimal O(V + E) time.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0 (SCC 1)", state: "sorted" },
        { id: "1", label: "1 (SCC 1)", state: "sorted" },
        { id: "2", label: "2 (SCC 1)", state: "sorted" },
        { id: "3", label: "3 (SCC 2)", state: "sorted" },
      ],
      edges: [
        { from: "1", to: "0", isPath: true },
        { from: "2", to: "1", isPath: true },
        { from: "0", to: "2", isPath: true },
        { from: "3", to: "1" },
      ],
    },
  },
];

export const generateKosarajuSccSteps = (input: KosarajuSccInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeNodes = Array.isArray(input?.nodes) ? input.nodes : DEFAULT_KOSARAJU_INPUT.nodes;
  const safeEdges = Array.isArray(input?.edges) ? input.edges : DEFAULT_KOSARAJU_INPUT.edges;

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
  const currentNodes: GraphNodeItem[] = safeNodes.map((n) => ({
    ...n,
    state: "default",
  }));

  let currentEdges: GraphEdgeItem[] = safeEdges.map((e) => ({
    ...e,
    isTraversed: false,
    isPath: false,
  }));

  const adj = new Map<string, string[]>();
  const revAdj = new Map<string, string[]>();

  currentNodes.forEach((n) => {
    adj.set(n.id, []);
    revAdj.set(n.id, []);
  });

  currentEdges.forEach((e) => {
    adj.get(e.from)?.push(e.to);
    revAdj.get(e.to)?.push(e.from);
  });

  const finishStack: string[] = [];
  const pass1Visited = new Set<string>();
  const pass2Visited = new Set<string>();
  const sccs: string[][] = [];

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Kosaraju's algorithm for ${currentNodes.length} vertices and ${currentEdges.length} directed edges. Pass 1 will run DFS to compute finish times.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: currentNodes.map((n) => ({ ...n, state: "active" })),
        edges: currentEdges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { nodeCount: currentNodes.length, edgeCount: currentEdges.length },
    }),
  );

  const dfs1 = (u: string) => {
    pass1Visited.add(u);
    const nodeObj = currentNodes.find((n) => n.id === u);
    if (nodeObj) {
      nodeObj.state = "active";
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Pass 1 DFS: visiting node '${u}' and exploring its unvisited outgoing neighbors.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: currentNodes.map((n) => ({ ...n })),
          edges: currentEdges.map((e) => ({ ...e })),
        },
        auxiliaryState: {
          stack: [...finishStack],
          visited: Array.from(pass1Visited),
        },
        variables: { pass: 1, current: u },
      }),
    );

    const neighbors = adj.get(u)!;
    for (const v of neighbors) {
      const edge = currentEdges.find((e) => e.from === u && e.to === v);
      if (edge) edge.isTraversed = true;

      if (!pass1Visited.has(v)) {
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Pass 1 DFS: following directed edge '${u}' -> '${v}' to recurse deeper.`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: currentNodes.map((n) => ({ ...n })),
              edges: currentEdges.map((e) => ({ ...e })),
            },
            auxiliaryState: {
              stack: [...finishStack],
              visited: Array.from(pass1Visited),
            },
            variables: { pass: 1, from: u, to: v },
          }),
        );
        dfs1(v);
      }
    }

    finishStack.push(u);
    if (nodeObj) {
      nodeObj.state = "compare";
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Pass 1 DFS: finished exploring node '${u}'; pushed '${u}' onto finish stack (stack size ${finishStack.length}).`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: currentNodes.map((n) => ({ ...n })),
          edges: currentEdges.map((e) => ({ ...e })),
        },
        auxiliaryState: {
          stack: [...finishStack],
          visited: Array.from(pass1Visited),
        },
        variables: { pass: 1, finishedNode: u, stackSize: finishStack.length },
      }),
    );
  };

  for (const node of currentNodes) {
    if (!pass1Visited.has(node.id)) {
      dfs1(node.id);
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Completed Pass 1 DFS. Computed finish stack (top first): [${[...finishStack].reverse().join(", ")}].`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: currentNodes.map((n) => ({ ...n, state: "visited" })),
        edges: currentEdges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        stack: [...finishStack],
        visited: Array.from(pass1Visited),
      },
      variables: { pass1Complete: true, finishOrder: [...finishStack].reverse().join(", ") },
    }),
  );

  // Transpose graph
  currentEdges = currentEdges.map((e) => ({
    from: e.to,
    to: e.from,
    isTraversed: true,
    isPath: false,
  }));

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: "Transposing graph: reversed the direction of all edges to form G^T for Pass 2.",
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: currentNodes.map((n) => ({ ...n, state: "default" })),
        edges: currentEdges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        stack: [...finishStack],
        visited: [],
      },
      variables: { graphTransposed: true },
    }),
  );

  const dfs2 = (u: string, component: string[]) => {
    pass2Visited.add(u);
    component.push(u);
    const nodeObj = currentNodes.find((n) => n.id === u);
    if (nodeObj) {
      nodeObj.state = "active";
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Pass 2 DFS: added node '${u}' to SCC #${sccs.length + 1}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: currentNodes.map((n) => ({ ...n })),
          edges: currentEdges.map((e) => ({ ...e })),
        },
        auxiliaryState: {
          stack: [...finishStack],
          visited: Array.from(pass2Visited),
        },
        variables: { pass: 2, sccIndex: sccs.length + 1, current: u },
      }),
    );

    const revNeighbors = revAdj.get(u)!;
    for (const v of revNeighbors) {
      const edge = currentEdges.find((e) => e.from === u && e.to === v);
      if (edge) edge.isTraversed = true;

      if (!pass2Visited.has(v)) {
        dfs2(v, component);
      }
    }
  };

  while (finishStack.length > 0) {
    const u = finishStack.pop()!;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: pass2Visited.has(u)
          ? `Popped node '${u}' from finish stack: already assigned to an SCC. Skipping.`
          : `Popped node '${u}' from finish stack: launching Pass 2 DFS on G^T to extract new SCC #${sccs.length + 1}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: currentNodes.map((n) => ({
            ...n,
            state: n.id === u ? "swap" : n.state,
          })),
          edges: currentEdges.map((e) => ({ ...e })),
        },
        auxiliaryState: {
          stack: [...finishStack],
          visited: Array.from(pass2Visited),
        },
        variables: { poppedNode: u, alreadyAssigned: pass2Visited.has(u) },
      }),
    );

    if (!pass2Visited.has(u)) {
      const component: string[] = [];
      dfs2(u, component);
      sccs.push(component);

      const compSet = new Set(component);
      component.forEach((nodeId) => {
        const nodeObj = currentNodes.find((n) => n.id === nodeId);
        if (nodeObj) {
          nodeObj.state = "sorted";
        }
      });
      currentEdges.forEach((e) => {
        if (compSet.has(e.from) && compSet.has(e.to)) {
          e.isPath = true;
        }
      });

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Completed SCC #${sccs.length}: extracted strongly connected component {${component.join(", ")}}.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: currentNodes.map((n) => ({ ...n })),
            edges: currentEdges.map((e) => ({ ...e })),
          },
          auxiliaryState: {
            stack: [...finishStack],
            visited: Array.from(pass2Visited),
          },
          variables: { sccCompleted: sccs.length, members: component.join(", ") },
        }),
      );
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Kosaraju's algorithm complete. Partitioned graph into ${sccs.length} strongly connected component(s).`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: currentNodes.map((n) => ({ ...n, state: "sorted" })),
        edges: currentEdges.map((e) => ({ ...e, isPath: true })),
      },
      auxiliaryState: {
        stack: [],
        visited: Array.from(pass2Visited),
      },
      variables: { completed: true, sccCount: sccs.length },
    }),
  );

  return steps;
};
