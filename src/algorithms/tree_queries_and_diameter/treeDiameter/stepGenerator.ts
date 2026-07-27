import type { AlgorithmStep, ElementState, TreeNodeItem } from "../../../types/dsa";

export interface TreeDiameterInput {
  nodes: TreeNodeItem[];
  rootId: string;
}

export const generateTreeDiameterSteps = (input: TreeDiameterInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { nodes, rootId } = input;

  const nodeMap = new Map<string, TreeNodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const adj = new Map<string, string[]>();
  nodes.forEach((n) => {
    if (!adj.has(n.id)) adj.set(n.id, []);
    if (n.leftId && nodeMap.has(n.leftId)) {
      adj.get(n.id)!.push(n.leftId);
      if (!adj.has(n.leftId)) adj.set(n.leftId, []);
      adj.get(n.leftId)!.push(n.id);
    }
    if (n.rightId && nodeMap.has(n.rightId)) {
      adj.get(n.id)!.push(n.rightId);
      if (!adj.has(n.rightId)) adj.set(n.rightId, []);
      adj.get(n.rightId)!.push(n.id);
    }
  });

  const callStack: string[] = [];
  const visitedSet = new Set<string>();

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeId?: string,
    nodeAId?: string,
    nodeBId?: string,
    diameterPath?: Set<string>,
    extraVars: Record<string, string | number | boolean> = {},
  ) => {
    const updatedNodes: TreeNodeItem[] = nodes.map((node) => {
      let state: ElementState = node.state || "default";
      if (diameterPath && diameterPath.has(node.id)) {
        state = "sorted";
      } else if (activeId && node.id === activeId) {
        state = "active";
      } else if (node.id === nodeAId || node.id === nodeBId) {
        state = "pivot";
      } else if (visitedSet.has(node.id)) {
        state = "visited";
      }
      return { ...node, state };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: { kind: "tree", nodes: updatedNodes, rootId },
      auxiliaryState: {
        stack: [...callStack],
        visited: Array.from(visitedSet),
        customState: {
          "Endpoint A": nodeAId ? `Node ${nodeMap.get(nodeAId)?.val ?? nodeAId}` : "None",
          "Endpoint B": nodeBId ? `Node ${nodeMap.get(nodeBId)?.val ?? nodeBId}` : "None",
          "Max Distance": String(extraVars.maxDist ?? 0),
        },
      },
      variables: { root: nodeMap.get(rootId)?.val ?? rootId, ...extraVars },
    });
  };

  addStep(
    1,
    "Set up the two-DFS diameter search",
    "We want the longest path anywhere in this tree. The trick we lean on: a DFS from any node always lands on one true endpoint of that longest path, so two well-aimed DFS passes are all we need.",
  );

  callStack.length = 0;
  visitedSet.clear();
  let farthestNodeA = rootId;
  let maxDistA = -1;

  const runDfs1 = (u: string, parent: string | null, dist: number) => {
    visitedSet.add(u);
    callStack.push(`DFS1(${nodeMap.get(u)?.val ?? u}, dist=${dist})`);

    if (dist > maxDistA) {
      maxDistA = dist;
      farthestNodeA = u;
    }

    addStep(
      4,
      `DFS 1: visit node ${nodeMap.get(u)?.val ?? u} at distance ${dist}`,
      `Node ${nodeMap.get(u)?.val ?? u} sits ${dist} edges from our starting point. The farthest we've seen so far is ${maxDistA} edges, at node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA} — if a deeper branch turns up, the record moves with it.`,
      u,
      farthestNodeA,
      undefined,
      undefined,
      {
        current: nodeMap.get(u)?.val ?? u,
        dist,
        maxDistA,
        nodeA: nodeMap.get(farthestNodeA)?.val ?? farthestNodeA,
      },
    );

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (v !== parent) {
        runDfs1(v, u, dist + 1);
      }
    }

    callStack.pop();
  };

  addStep(
    11,
    `DFS 1: start from node ${nodeMap.get(rootId)?.val ?? rootId}`,
    "The first pass starts anywhere — we use the root — and simply asks which node lies farthest away. That farthest node is guaranteed to be one end of the diameter.",
    rootId,
  );

  runDfs1(rootId, null, 0);

  addStep(
    11,
    `DFS 1 done: endpoint A is node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}`,
    `Nothing lies farther from the root than node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}, at ${maxDistA} edges — so it must be one endpoint of the diameter. Now we measure from there.`,
    undefined,
    farthestNodeA,
    undefined,
    undefined,
    { nodeA: nodeMap.get(farthestNodeA)?.val ?? farthestNodeA, maxDistA },
  );

  callStack.length = 0;
  visitedSet.clear();
  let farthestNodeB = farthestNodeA;
  let diameter = -1;
  let diameterPathNodes: string[] = [];

  const runDfs2 = (u: string, parent: string | null, dist: number, currentPath: string[]) => {
    visitedSet.add(u);
    const newPath = [...currentPath, u];
    callStack.push(`DFS2(${nodeMap.get(u)?.val ?? u}, dist=${dist})`);

    if (dist > diameter) {
      diameter = dist;
      farthestNodeB = u;
      diameterPathNodes = newPath;
    }

    addStep(
      4,
      `DFS 2: visit node ${nodeMap.get(u)?.val ?? u} at distance ${dist}`,
      `From endpoint A, node ${nodeMap.get(u)?.val ?? u} is ${dist} edges away. Our longest path so far runs ${diameter} edges, ending at node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}.`,
      u,
      farthestNodeA,
      farthestNodeB,
      undefined,
      {
        current: nodeMap.get(u)?.val ?? u,
        dist,
        diameter,
        nodeB: nodeMap.get(farthestNodeB)?.val ?? farthestNodeB,
      },
    );

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (v !== parent) {
        runDfs2(v, u, dist + 1, newPath);
      }
    }

    callStack.pop();
  };

  addStep(
    12,
    `DFS 2: start from endpoint A, node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}`,
    `Measuring from a known endpoint changes everything: the node farthest from A is the diameter's other endpoint, and the distance between them is the diameter itself.`,
    farthestNodeA,
    farthestNodeA,
  );

  runDfs2(farthestNodeA, null, 0, []);

  const pathSet = new Set<string>(diameterPathNodes);

  addStep(
    12,
    `DFS 2 done: endpoint B is node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}`,
    `Node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}, at ${diameter} edges from A, is as far as anything gets — so A and B are the two ends of the longest path in the tree.`,
    undefined,
    farthestNodeA,
    farthestNodeB,
    pathSet,
    {
      nodeA: nodeMap.get(farthestNodeA)?.val ?? farthestNodeA,
      nodeB: nodeMap.get(farthestNodeB)?.val ?? farthestNodeB,
      diameter,
    },
  );

  const pathVals = diameterPathNodes.map((id) => nodeMap.get(id)?.val ?? id).join(" -> ");

  addStep(
    13,
    `The diameter is ${diameter}`,
    `The longest path runs ${pathVals}, spanning ${diameter} edges between node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA} and node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}. Two linear DFS passes were all it took — O(V + E) overall.`,
    undefined,
    farthestNodeA,
    farthestNodeB,
    pathSet,
    { diameter, path: pathVals },
  );

  return steps;
};
