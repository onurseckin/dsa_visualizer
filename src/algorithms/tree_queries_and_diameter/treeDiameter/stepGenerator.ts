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
    "Enter tree_diameter",
    "We want the longest path anywhere in this tree. The trick we lean on: a DFS from any node always lands on one true endpoint of that longest path, so two well-aimed DFS passes are all we need.",
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
      `DFS 1: node ${valOf(u)} set max_node=${valOf(maxNode)}, max_dist=${maxDist}`,
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
        `DFS 1: inspect neighbor ${valOf(v)} of node ${valOf(u)}`,
        `Checking neighbor ${valOf(v)} connected to node ${valOf(u)}.`,
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
          `DFS 1: neighbor ${valOf(v)} != parent (${valOf(parent)})`,
          `Node ${valOf(v)} is an unvisited child branch, so we step into it.`,
          v,
          undefined,
          undefined,
          undefined,
          { node: valOf(u), neighbor: valOf(v), parent: valOf(parent) },
        );

        // Line 6: cand_node, cand_dist = dfs(neighbor, node, dist + 1)
        addStep(
          6,
          `DFS 1: recurse dfs(node=${valOf(v)}, parent=${valOf(u)}, dist=${dist + 1})`,
          `Recurse one edge deeper into node ${valOf(v)}'s subtree.`,
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
          `DFS 1: check if cand_dist (${candDist}) > max_dist (${maxDist})`,
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
            `DFS 1: update max_node=${valOf(maxNode)}, max_dist=${maxDist}`,
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
      `DFS 1: return max_node=${valOf(maxNode)}, max_dist=${maxDist} for subtree at node ${valOf(u)}`,
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
    `DFS 1: call dfs(start_node=${valOf(rootId)}, None, 0)`,
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
    `DFS 1 complete: Endpoint A confirmed as node ${valOf(farthestNodeA)} (max_dist=${maxDistA})`,
    `Node ${valOf(farthestNodeA)} is as far as possible from the start node (${maxDistA} edges away). It is Endpoint A of the diameter.`,
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
      `DFS 2: node ${valOf(u)} set max_node=${valOf(maxNode)}, max_dist=${maxDist}`,
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
        `DFS 2: inspect neighbor ${valOf(v)} of node ${valOf(u)}`,
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
          `DFS 2: neighbor ${valOf(v)} != parent (${valOf(parent)})`,
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
          `DFS 2: recurse dfs(node=${valOf(v)}, parent=${valOf(u)}, dist=${dist + 1})`,
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
          `DFS 2: check if cand_dist (${candDist}) > max_dist (${maxDist})`,
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
            `DFS 2: update max_node=${valOf(maxNode)}, max_dist=${maxDist}`,
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
      `DFS 2: return max_node=${valOf(maxNode)}, max_dist=${maxDist} for subtree at node ${valOf(u)}`,
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
    `DFS 2: call dfs(node_a=${valOf(farthestNodeA)}, None, 0)`,
    `Run second DFS starting from Endpoint A (node ${valOf(farthestNodeA)}). The farthest node found will be Endpoint B, and the distance is the exact Tree Diameter!`,
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
    `DFS 2 complete: node_b = ${valOf(farthestNodeB)}, diameter = ${diameter}`,
    `Farthest node from Endpoint A is node ${valOf(farthestNodeB)} at distance ${diameter}. Endpoint B is confirmed!`,
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
    `Return node_a=${valOf(farthestNodeA)}, node_b=${valOf(farthestNodeB)}, diameter=${diameter}`,
    `The longest simple path in the tree is ${pathStr} with diameter ${diameter} edges. Finding it took only two linear DFS passes O(V + E).`,
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
