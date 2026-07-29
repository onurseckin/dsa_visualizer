import type { AlgorithmStep, ElementState, TreeNodeItem } from "../../../types/dsa";

export interface TreeDiameterInput {
  nodes: TreeNodeItem[];
  rootId: string;
}

export const DEFAULT_TREE_DIAMETER_INPUT: TreeDiameterInput = {
  rootId: "1",
  nodes: [
    { id: "1", val: 1, leftId: "2", rightId: "3", state: "default" },
    { id: "2", val: 2, leftId: "4", rightId: "5", state: "default" },
    { id: "3", val: 3, rightId: "6", state: "default" },
    { id: "4", val: 4, leftId: "7", state: "default" },
    { id: "5", val: 5, state: "default" },
    { id: "6", val: 6, rightId: "8", state: "default" },
    { id: "7", val: 7, state: "default" },
    { id: "8", val: 8, state: "default" },
  ],
};

export const generateTreeDiameterSteps = (input: TreeDiameterInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const nodes =
    Array.isArray(input?.nodes) && input.nodes.length > 0
      ? input.nodes
      : DEFAULT_TREE_DIAMETER_INPUT.nodes;
  const rootId = input?.rootId ?? DEFAULT_TREE_DIAMETER_INPUT.rootId;

  const nodeMap = new Map<string, TreeNodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const valOf = (id: string | null | undefined): string => {
    if (!id) return "None";
    return String(nodeMap.get(id)?.val ?? id);
  };

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
          "Endpoint A": nodeAId ? `Node ${valOf(nodeAId)}` : "None",
          "Endpoint B": nodeBId ? `Node ${valOf(nodeBId)}` : "None",
          "Max Dist": String(extraVars.max_dist ?? extraVars.maxDist ?? 0),
        },
      },
      variables: { root: nodeMap.get(rootId)?.val ?? rootId, ...extraVars },
    });
  };

  // Line 1: def tree_diameter(n, adj, start_node=1)
  addStep(
    1,
    "Initialize 2-DFS Tree Diameter computation",
    "A single DFS from an arbitrary start node finds one endpoint of a longest path; a second DFS from that endpoint finds the opposite endpoint and exact diameter.",
    undefined,
    undefined,
    undefined,
    undefined,
    { start_node: valOf(rootId) },
  );

  callStack.length = 0;
  visitedSet.clear();

  // DFS 1: Find farthest node from root (Endpoint A)
  const runDfs1 = (u: string, parent: string | null, dist: number): [string, number] => {
    visitedSet.add(u);
    callStack.push(`DFS1(${valOf(u)}, dist=${dist})`);

    let maxNode = u;
    let maxDist = dist;

    // Line 3: max_node, max_dist = node, dist
    addStep(
      3,
      `Pass 1 DFS: Visit node ${valOf(u)}`,
      `Seed the running farthest node with node ${valOf(u)} itself at distance ${dist}. We'll update if any child subtree reaches deeper.`,
      u,
      undefined,
      undefined,
      undefined,
      { node: valOf(u), parent: valOf(parent), dist, max_node: valOf(maxNode), max_dist: maxDist },
    );

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      // Line 4: for neighbor in adj[node]
      addStep(
        4,
        `Pass 1 DFS: Inspect neighbor ${valOf(v)} of node ${valOf(u)}`,
        `Traversing undirected tree edge to evaluate candidate path extending to neighbor ${valOf(v)}.`,
        u,
        undefined,
        undefined,
        undefined,
        { node: valOf(u), neighbor: valOf(v) },
      );

      // Line 5: if neighbor != parent
      if (v !== parent) {
        addStep(
          5,
          `Pass 1 DFS: Advance to child node ${valOf(v)}`,
          `Node ${valOf(v)} is an unvisited child branch, stepping into it while guarding against parent backtracking.`,
          v,
          undefined,
          undefined,
          undefined,
          { node: valOf(u), neighbor: valOf(v), parent: valOf(parent) },
        );

        // Line 6: cand_node, cand_dist = dfs(neighbor, node, dist + 1)
        addStep(
          6,
          `Pass 1 DFS: Recurse into child node ${valOf(v)}`,
          `Recurse one edge deeper into node ${valOf(v)}'s subtree at distance ${dist + 1}.`,
          v,
          undefined,
          undefined,
          undefined,
          { neighbor: valOf(v), parent: valOf(u), next_dist: dist + 1 },
        );

        const [candNode, candDist] = runDfs1(v, u, dist + 1);

        // Line 7: if cand_dist > max_dist
        addStep(
          7,
          `Pass 1 DFS: Compare child subtree depth`,
          `Compare child's deepest node ${valOf(candNode)} (dist=${candDist}) with current best max_dist=${maxDist}.`,
          u,
          undefined,
          undefined,
          undefined,
          { cand_node: valOf(candNode), cand_dist: candDist, max_dist: maxDist },
        );

        if (candDist > maxDist) {
          maxNode = candNode;
          maxDist = candDist;
          // Line 8: max_node, max_dist = cand_node, cand_dist
          addStep(
            8,
            `Pass 1 DFS: New maximum distance discovered (${maxDist})`,
            `Child branch reached further! Adopt node ${valOf(maxNode)} at distance ${maxDist} as new farthest node.`,
            u,
            undefined,
            undefined,
            undefined,
            { max_node: valOf(maxNode), max_dist: maxDist },
          );
        }
      }
    }

    // Line 9: return max_node, max_dist
    addStep(
      9,
      `Pass 1 DFS: Return farthest node from subtree (${valOf(maxNode)})`,
      `Return the deepest node found in node ${valOf(u)}'s entire subtree back to caller.`,
      u,
      undefined,
      undefined,
      undefined,
      { max_node: valOf(maxNode), max_dist: maxDist },
    );

    callStack.pop();
    return [maxNode, maxDist];
  };

  // Line 11: node_a, _ = dfs(start_node, None, 0)
  addStep(
    11,
    `Pass 1 DFS: Start traversal from root node ${valOf(rootId)}`,
    "The first pass starts at the root node and finds the farthest node in the tree — guaranteed to be one endpoint of the diameter (Endpoint A).",
    rootId,
    undefined,
    undefined,
    undefined,
    { start_node: valOf(rootId) },
  );

  const [farthestNodeA, maxDistA] = runDfs1(rootId, null, 0);

  addStep(
    11,
    `Pass 1 complete: Confirmed Endpoint A as node ${valOf(farthestNodeA)}`,
    `Node ${valOf(farthestNodeA)} is as far as possible from the start node (${maxDistA} edges away). It is guaranteed to be one endpoint of the diameter.`,
    undefined,
    farthestNodeA,
    undefined,
    undefined,
    { node_a: valOf(farthestNodeA), max_dist: maxDistA },
  );

  callStack.length = 0;
  visitedSet.clear();

  // DFS 2: Find farthest node from Endpoint A (Endpoint B) and diameter
  const runDfs2 = (u: string, parent: string | null, dist: number): [string, number, string[]] => {
    visitedSet.add(u);
    callStack.push(`DFS2(${valOf(u)}, dist=${dist})`);

    let maxNode = u;
    let maxDist = dist;
    let maxPath = [u];

    // Line 3: max_node, max_dist = node, dist
    addStep(
      3,
      `Pass 2 DFS: Visit node ${valOf(u)} from Endpoint A`,
      `Seed running farthest node from Endpoint A (${valOf(farthestNodeA)}) with node ${valOf(u)} at distance ${dist}.`,
      u,
      farthestNodeA,
      undefined,
      undefined,
      { node: valOf(u), parent: valOf(parent), dist, max_node: valOf(maxNode), max_dist: maxDist },
    );

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      // Line 4: for neighbor in adj[node]
      addStep(
        4,
        `Pass 2 DFS: Inspect neighbor ${valOf(v)}`,
        `Checking neighbor ${valOf(v)} connected to node ${valOf(u)}.`,
        u,
        farthestNodeA,
        undefined,
        undefined,
        { node: valOf(u), neighbor: valOf(v) },
      );

      // Line 5: if neighbor != parent
      if (v !== parent) {
        addStep(
          5,
          `Pass 2 DFS: Advance to neighbor ${valOf(v)}`,
          `Node ${valOf(v)} is an unvisited neighbor, stepping into it from Endpoint A side.`,
          v,
          farthestNodeA,
          undefined,
          undefined,
          { node: valOf(u), neighbor: valOf(v), parent: valOf(parent) },
        );

        // Line 6: cand_node, cand_dist = dfs(neighbor, node, dist + 1)
        addStep(
          6,
          `Pass 2 DFS: Recurse into child node ${valOf(v)}`,
          `Recurse one edge deeper from Endpoint A into node ${valOf(v)}'s subtree.`,
          v,
          farthestNodeA,
          undefined,
          undefined,
          { neighbor: valOf(v), parent: valOf(u), next_dist: dist + 1 },
        );

        const [candNode, candDist, candPath] = runDfs2(v, u, dist + 1);

        // Line 7: if cand_dist > max_dist
        addStep(
          7,
          `Pass 2 DFS: Compare path length from Endpoint A`,
          `Compare child's farthest node ${valOf(candNode)} (dist=${candDist}) with current best max_dist=${maxDist}.`,
          u,
          farthestNodeA,
          undefined,
          undefined,
          { cand_node: valOf(candNode), cand_dist: candDist, max_dist: maxDist },
        );

        if (candDist > maxDist) {
          maxNode = candNode;
          maxDist = candDist;
          maxPath = [u, ...candPath];
          // Line 8: max_node, max_dist = cand_node, cand_dist
          addStep(
            8,
            `Pass 2 DFS: New longest path discovered (${maxDist} edges)`,
            `Found deeper path! Adopt node ${valOf(maxNode)} at distance ${maxDist} from Endpoint A as new candidate for Endpoint B.`,
            u,
            farthestNodeA,
            undefined,
            undefined,
            { max_node: valOf(maxNode), max_dist: maxDist },
          );
        }
      }
    }

    // Line 9: return max_node, max_dist
    addStep(
      9,
      `Pass 2 DFS: Return farthest node from Endpoint A (${valOf(maxNode)})`,
      `Return maximum distance and farthest node found from Endpoint A in node ${valOf(u)}'s subtree.`,
      u,
      farthestNodeA,
      undefined,
      undefined,
      { max_node: valOf(maxNode), max_dist: maxDist },
    );

    callStack.pop();
    return [maxNode, maxDist, maxPath];
  };

  // Line 12: node_b, diameter = dfs(node_a, None, 0)
  addStep(
    12,
    `Pass 2 DFS: Start search from Endpoint A (${valOf(farthestNodeA)})`,
    `Run second DFS starting from Endpoint A (node ${valOf(farthestNodeA)}). The farthest node found will be Endpoint B, measuring the exact tree diameter.`,
    farthestNodeA,
    farthestNodeA,
    undefined,
    undefined,
    { node_a: valOf(farthestNodeA) },
  );

  const [farthestNodeB, diameter, diameterPathNodes] = runDfs2(farthestNodeA, null, 0);

  const pathSet = new Set<string>(diameterPathNodes);

  addStep(
    12,
    `Pass 2 complete: Confirmed Endpoint B as node ${valOf(farthestNodeB)}`,
    `The farthest node reached from Endpoint A is node ${valOf(farthestNodeB)} at distance ${diameter}. Endpoint B is confirmed!`,
    undefined,
    farthestNodeA,
    farthestNodeB,
    pathSet,
    { node_a: valOf(farthestNodeA), node_b: valOf(farthestNodeB), diameter },
  );

  const pathStr = diameterPathNodes.map((id) => valOf(id)).join(" -> ");

  // Line 13: return node_a, node_b, diameter
  addStep(
    13,
    `Return Tree Diameter (${diameter} edges)`,
    `The longest simple path in the tree is ${pathStr} with diameter ${diameter} edges, computed in O(V + E) time via two linear DFS passes.`,
    undefined,
    farthestNodeA,
    farthestNodeB,
    pathSet,
    {
      node_a: valOf(farthestNodeA),
      node_b: valOf(farthestNodeB),
      diameter,
      diameter_path: pathStr,
    },
  );

  return steps;
};
