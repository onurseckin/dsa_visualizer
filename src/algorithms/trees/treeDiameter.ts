import type {
  AlgorithmDefinition,
  AlgorithmStep,
  TreeNodeItem,
} from '../../types/dsa';

export interface TreeDiameterInput {
  nodes: TreeNodeItem[];
  rootId: string;
}

export const TREE_DIAMETER_CODE = `def tree_diameter(n, adj):
    # DFS function to return (farthest_node, max_distance)
    def dfs(node, parent, dist):
        max_node, max_dist = node, dist
        for neighbor in adj[node]:
            if neighbor != parent:
                cand_node, cand_dist = dfs(neighbor, node, dist + 1)
                if cand_dist > max_dist:
                    max_node, max_dist = cand_node, cand_dist
        return max_node, max_dist

    # DFS 1: Find endpoint A (farthest from root)
    node_a, _ = dfs(start_node, None, 0)
    # DFS 2: Find endpoint B and max diameter from A
    node_b, diameter = dfs(node_a, None, 0)
    return node_a, node_b, diameter`;

export const DEFAULT_TREE_DIAMETER_INPUT: TreeDiameterInput = {
  rootId: '1',
  nodes: [
    { id: '1', val: 1, leftId: '2', rightId: '3', state: 'default' },
    { id: '2', val: 2, leftId: '4', rightId: '5', state: 'default' },
    { id: '3', val: 3, rightId: '6', state: 'default' },
    { id: '4', val: 4, leftId: '7', state: 'default' },
    { id: '5', val: 5, state: 'default' },
    { id: '6', val: 6, rightId: '8', state: 'default' },
    { id: '7', val: 7, state: 'default' },
    { id: '8', val: 8, state: 'default' },
  ],
};

export const generateTreeDiameterSteps = (
  input: TreeDiameterInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { nodes, rootId } = input;

  const nodeMap = new Map<string, TreeNodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Build undirected adjacency list for the tree
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));

  nodes.forEach((n) => {
    if (n.leftId && nodeMap.has(n.leftId)) {
      adj.get(n.id)?.push(n.leftId);
      adj.get(n.leftId)?.push(n.id);
    }
    if (n.rightId && nodeMap.has(n.rightId)) {
      adj.get(n.id)?.push(n.rightId);
      adj.get(n.rightId)?.push(n.id);
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
    extraVars: Record<string, string | number | boolean> = {}
  ) => {
    const updatedNodes: TreeNodeItem[] = nodes.map((node) => {
      let state = node.state || 'default';

      if (diameterPath && diameterPath.has(node.id)) {
        state = 'sorted';
      } else if (activeId && node.id === activeId) {
        state = 'active';
      } else if (node.id === nodeAId || node.id === nodeBId) {
        state = 'pivot';
      } else if (visitedSet.has(node.id)) {
        state = 'visited';
      }

      return {
        ...node,
        state,
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'tree',
        nodes: updatedNodes,
        rootId,
      },
      auxiliaryState: {
        stack: [...callStack],
        visited: Array.from(visitedSet),
        customState: {
          'Endpoint A': nodeAId ? `Node ${nodeMap.get(nodeAId)?.val ?? nodeAId}` : 'None',
          'Endpoint B': nodeBId ? `Node ${nodeMap.get(nodeBId)?.val ?? nodeBId}` : 'None',
          'Max Distance': extraVars.maxDist !== undefined ? String(extraVars.maxDist) : '0',
        },
      },
      variables: {
        root: nodeMap.get(rootId)?.val ?? rootId,
        ...extraVars,
      },
    });
  };

  addStep(
    1,
    'Initialize 2-DFS Tree Diameter Algorithm',
    `Starting 2-DFS algorithm to find tree diameter from arbitrary start root Node '${nodeMap.get(rootId)?.val ?? rootId}'.`
  );

  // DFS 1: Find farthest node A from root
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
      3,
      `DFS 1: Exploring Node ${nodeMap.get(u)?.val ?? u} at distance ${dist}`,
      `Evaluating current node distance from start root. Max distance so far: ${maxDistA} at Node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}.`,
      u,
      farthestNodeA,
      undefined,
      undefined,
      { current: nodeMap.get(u)?.val ?? u, dist, maxDistA, nodeA: nodeMap.get(farthestNodeA)?.val ?? farthestNodeA }
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
    13,
    `DFS 1: Start search from root Node ${nodeMap.get(rootId)?.val ?? rootId}`,
    `First DFS pass will find the farthest node A from root.`,
    rootId
  );

  runDfs1(rootId, null, 0);

  addStep(
    13,
    `DFS 1 Complete: Farthest node A found is Node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}`,
    `Max distance from root is ${maxDistA}. Node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA} is chosen as diameter endpoint A.`,
    undefined,
    farthestNodeA,
    undefined,
    undefined,
    { nodeA: nodeMap.get(farthestNodeA)?.val ?? farthestNodeA, maxDistA }
  );

  // DFS 2: Find farthest node B from Node A and track path
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
      7,
      `DFS 2: Exploring Node ${nodeMap.get(u)?.val ?? u} at distance ${dist} from Node A (${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA})`,
      `Traversing tree from endpoint A. Current max distance: ${diameter}.`,
      u,
      farthestNodeA,
      farthestNodeB,
      undefined,
      { current: nodeMap.get(u)?.val ?? u, dist, diameter, nodeB: nodeMap.get(farthestNodeB)?.val ?? farthestNodeB }
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
    15,
    `DFS 2: Start search from endpoint A (Node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA})`,
    `Second DFS pass from endpoint A will find the farthest node B and the full diameter path.`,
    farthestNodeA,
    farthestNodeA
  );

  runDfs2(farthestNodeA, null, 0, []);

  const pathSet = new Set<string>(diameterPathNodes);

  addStep(
    15,
    `DFS 2 Complete: Endpoint B is Node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}`,
    `Farthest node from A is Node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB} at distance ${diameter}.`,
    undefined,
    farthestNodeA,
    farthestNodeB,
    pathSet,
    { nodeA: nodeMap.get(farthestNodeA)?.val ?? farthestNodeA, nodeB: nodeMap.get(farthestNodeB)?.val ?? farthestNodeB, diameter }
  );

  const pathVals = diameterPathNodes.map((id) => nodeMap.get(id)?.val ?? id).join(' -> ');

  addStep(
    16,
    `Tree Diameter Computation Complete! Diameter = ${diameter}`,
    `The longest simple path in the tree is between Node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA} and Node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB} with path: ${pathVals}.`,
    undefined,
    farthestNodeA,
    farthestNodeB,
    pathSet,
    { diameter, path: pathVals }
  );

  return steps;
};

export const treeDiameter: AlgorithmDefinition<TreeDiameterInput> = {
  id: 'tree-diameter',
  title: 'Tree Diameter (2-DFS Algorithm)',
  category: 'trees',
  difficulty: 'Medium',
  description:
    'Computes the diameter (longest simple path) of an unweighted tree using the classic two-pass Depth-First Search algorithm.',
  code: TREE_DIAMETER_CODE,
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  defaultInput: DEFAULT_TREE_DIAMETER_INPUT,
  generateSteps: generateTreeDiameterSteps,
};
