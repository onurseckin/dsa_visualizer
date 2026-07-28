import type { AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import type { KosarajuSccInput } from "./types";

export const generateKosarajuSccSteps = (input: KosarajuSccInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const currentNodes: GraphNodeItem[] = input.nodes.map((n) => ({
    ...n,
    state: "default",
  }));

  let currentEdges: GraphEdgeItem[] = input.edges.map((e) => ({
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

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeNodeId?: string,
    phaseText: string = "Pass 1",
    variables: Record<string, string | number | boolean> = {},
  ) => {
    const nodesCopy = currentNodes.map((n) => {
      let state = n.state;
      if (activeNodeId && n.id === activeNodeId) {
        state = "active";
      }
      return {
        ...n,
        state,
      };
    });

    const sccSummary =
      sccs.length > 0
        ? sccs.map((comp, idx) => `SCC ${idx + 1}: {${comp.join(", ")}}`).join(" | ")
        : "None";

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes: nodesCopy,
        edges: currentEdges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        stack: [...finishStack],
        visited: Array.from(phaseText.includes("Pass 2") ? pass2Visited : pass1Visited),
        customState: {
          Phase: phaseText,
          "Finish Stack (Top -> Bottom)": [...finishStack].reverse().join(", ") || "Empty",
          "SCC Count": String(sccs.length),
          "Discovered SCCs": sccSummary,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Set up the two-pass plan",
    "We find strongly connected components with two DFS sweeps: first we record the order vertices finish on the original graph, then we sweep the reversed graph in that order to peel off one component at a time.",
    undefined,
    "Initialization",
    { nodeCount: currentNodes.length, edgeCount: currentEdges.length },
  );

  addStep(
    2,
    "Begin Pass 1 DFS on G",
    "We run DFS on the original graph and push each vertex onto a stack the moment it finishes. Vertices that finish late end up on top — exactly the order Pass 2 will want to start from.",
    undefined,
    "Pass 1 (DFS Finish Stack)",
  );

  const dfs1 = (u: string) => {
    pass1Visited.add(u);
    const nodeObj = currentNodes.find((n) => n.id === u);
    if (nodeObj) {
      nodeObj.state = "active";
    }

    addStep(
      5,
      `Visit node '${u}'`,
      `We mark '${u}' as visited and explore its unvisited out-neighbors first — in Pass 1 a vertex only finishes once everything reachable from it is done.`,
      u,
      "Pass 1 (DFS Finish Stack)",
      { current: u },
    );

    const neighbors = adj.get(u)!;
    for (const v of neighbors) {
      const edge = currentEdges.find((e) => e.from === u && e.to === v);
      if (edge) edge.isTraversed = true;

      if (!pass1Visited.has(v)) {
        addStep(
          8,
          `Follow edge '${u}' -> '${v}'`,
          `Neighbor '${v}' hasn't been visited yet, so we dive into it now — '${u}' has to wait for all of its descendants before it can join the finish stack.`,
          v,
          "Pass 1 (DFS Finish Stack)",
          { from: u, to: v },
        );
        dfs1(v);
      }
    }

    finishStack.push(u);
    if (nodeObj) {
      nodeObj.state = "in-stack";
    }

    addStep(
      9,
      `Finish '${u}' and push it`,
      `Everything reachable from '${u}' has been explored, so '${u}' is done and goes on the finish stack. The later a vertex finishes, the higher it sits.`,
      u,
      "Pass 1 (DFS Finish Stack)",
      { current: u, stackSize: finishStack.length },
    );
  };

  for (const node of currentNodes) {
    if (!pass1Visited.has(node.id)) {
      dfs1(node.id);
    }
  }

  addStep(
    13,
    "Complete Pass 1",
    `The finish order came out as [${[...finishStack].reverse().join(", ")}], top first. The vertex on top finished last, which means its component can reach everything below it — a fact Pass 2 will exploit.`,
    undefined,
    "Pass 1 (Complete)",
    { stackSize: finishStack.length },
  );

  currentEdges = currentEdges.map((e) => ({
    from: e.to,
    to: e.from,
    isTraversed: false,
    isPath: false,
  }));

  addStep(
    15,
    "Reverse every edge to build G^T",
    "We flip all the edges. Each SCC survives intact — a cycle reversed is still a cycle — but reachability between components inverts, and that is what will keep the next DFS trapped inside a single component.",
    undefined,
    "Graph Transpose (Reversed Edges)",
    { transposed: true },
  );

  addStep(
    24,
    "Begin Pass 2 on G^T",
    "Now we pop vertices in reverse finish order and DFS on the reversed graph. Starting from the latest finisher, each DFS can only reach vertices in its own component — the reversed edges block every escape route.",
    undefined,
    "Pass 2 (Extract SCCs)",
  );

  const dfs2 = (u: string, component: string[]) => {
    pass2Visited.add(u);
    component.push(u);
    const nodeObj = currentNodes.find((n) => n.id === u);
    if (nodeObj) {
      nodeObj.state = "compare";
      nodeObj.group = sccs.length + 1;
    }

    addStep(
      19,
      `Add '${u}' to SCC #${sccs.length + 1}`,
      `We reached '${u}' along reversed edges, which means '${u}' can reach this component's root in the original graph — and the finish order guarantees the reverse direction too, so they belong together.`,
      u,
      "Pass 2 (Extract SCCs)",
      { current: u, componentSize: component.length },
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

    addStep(
      25,
      `Pop '${u}' from the stack`,
      `We take '${u}' off the top of the finish stack. If it hasn't been claimed by a component yet, it anchors a brand-new SCC; if it has, we simply move on.`,
      u,
      "Pass 2 (Extract SCCs)",
      { popped: u },
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
          nodeObj.val = sccs.length;
          nodeObj.group = sccs.length;
        }
      });
      currentEdges.forEach((e) => {
        if (compSet.has(e.from) && compSet.has(e.to)) {
          e.group = sccs.length;
          e.isPath = true;
        }
      });

      addStep(
        29,
        `Complete SCC #${sccs.length}`,
        `The DFS ran out of reversed edges, so this component is sealed: {${component.join(", ")}}. Every vertex inside it can reach every other one in both directions.`,
        undefined,
        "Pass 2 (Extract SCCs)",
        { sccIndex: sccs.length, members: component.join(", ") },
      );
    }
  }

  addStep(
    30,
    `Finish with ${sccs.length} component(s)`,
    `Every vertex now belongs to exactly one strongly connected component. Two linear DFS sweeps plus one edge reversal did all the work, which is why the whole algorithm runs in O(V + E).`,
    undefined,
    "Complete",
    { sccCount: sccs.length },
  );

  return steps;
};
