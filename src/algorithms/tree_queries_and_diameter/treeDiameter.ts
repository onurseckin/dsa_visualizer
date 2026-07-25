import type {
  AlgorithmDefinition,
  AlgorithmStep,
  TreeNodeItem,
} from '../../types/dsa';

export interface TreeDiameterInput {
  nodes: TreeNodeItem[];
  rootId: string;
}

export const TREE_DIAMETER_CODE = `def tree_diameter(n, adj, start_node=1):
    # DFS function to return (farthest_node, max_distance)
    def dfs(node, parent, dist):
        max_node, max_dist = node, dist
        for neighbor in adj[node]:
            if neighbor != parent:
                cand_node, cand_dist = dfs(neighbor, node, dist + 1)
                if cand_dist > max_dist:
                    max_node, max_dist = cand_node, cand_dist
        return max_node, max_dist

    # DFS 1: Find endpoint A (farthest from start_node)
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
    'Set up the two-DFS diameter search',
    `We want the longest path anywhere in this tree. The trick we lean on: a DFS from any node always lands on one true endpoint of that longest path, so two well-aimed DFS passes are all we need.`
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
      4,
      `DFS 1: visit node ${nodeMap.get(u)?.val ?? u} at distance ${dist}`,
      `Node ${nodeMap.get(u)?.val ?? u} sits ${dist} edges from our starting point. The farthest we've seen so far is ${maxDistA} edges, at node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA} — if a deeper branch turns up, the record moves with it.`,
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
    `DFS 1: start from node ${nodeMap.get(rootId)?.val ?? rootId}`,
    `The first pass starts anywhere — we use the root — and simply asks which node lies farthest away. That farthest node is guaranteed to be one end of the diameter.`,
    rootId
  );

  runDfs1(rootId, null, 0);

  addStep(
    13,
    `DFS 1 done: endpoint A is node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}`,
    `Nothing lies farther from the root than node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}, at ${maxDistA} edges — so it must be one endpoint of the diameter. Now we measure from there.`,
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
      4,
      `DFS 2: visit node ${nodeMap.get(u)?.val ?? u} at distance ${dist}`,
      `From endpoint A, node ${nodeMap.get(u)?.val ?? u} is ${dist} edges away. Our longest path so far runs ${diameter} edges, ending at node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}.`,
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
    `DFS 2: start from endpoint A, node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA}`,
    `Measuring from a known endpoint changes everything: the node farthest from A is the diameter's other endpoint, and the distance between them is the diameter itself.`,
    farthestNodeA,
    farthestNodeA
  );

  runDfs2(farthestNodeA, null, 0, []);

  const pathSet = new Set<string>(diameterPathNodes);

  addStep(
    15,
    `DFS 2 done: endpoint B is node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}`,
    `Node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}, at ${diameter} edges from A, is as far as anything gets — so A and B are the two ends of the longest path in the tree.`,
    undefined,
    farthestNodeA,
    farthestNodeB,
    pathSet,
    { nodeA: nodeMap.get(farthestNodeA)?.val ?? farthestNodeA, nodeB: nodeMap.get(farthestNodeB)?.val ?? farthestNodeB, diameter }
  );

  const pathVals = diameterPathNodes.map((id) => nodeMap.get(id)?.val ?? id).join(' -> ');

  addStep(
    16,
    `The diameter is ${diameter}`,
    `The longest path runs ${pathVals}, spanning ${diameter} edges between node ${nodeMap.get(farthestNodeA)?.val ?? farthestNodeA} and node ${nodeMap.get(farthestNodeB)?.val ?? farthestNodeB}. Two linear DFS passes were all it took — O(V + E) overall.`,
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
  category: 'tree_queries_and_diameter',
  difficulty: 'Medium',
  description:
    'Computes the diameter (the length of the longest simple path between any two nodes) of an unweighted tree using the double Depth-First Search (2-DFS) algorithm. The algorithm relies on the fundamental structural invariant: starting a DFS from any arbitrary root node finds a node A that is guaranteed to be one of the diameter\'s endpoints. A second DFS starting from node A discovers the opposite endpoint B and the exact diameter distance.',
  constraints: [
    '1 <= Number of nodes N <= 10^5',
    'The graph is guaranteed to be a valid connected tree with N - 1 undirected edges',
    'Node values are unique identifiers or integers within [1, 10^9]',
    'Edge weights are uniform (unweighted tree)',
  ],
  examples: [
    {
      input: 'rootId = "1", nodes = 8-node binary tree',
      output: '6',
      explanation:
        'DFS 1 from root node 1 finds leaf node 7 (distance 3). DFS 2 from node 7 finds leaf node 8 (distance 6). The path 7 -> 4 -> 2 -> 1 -> 3 -> 6 -> 8 contains 6 edges.',
    },
    {
      input: 'rootId = "1", nodes = [1 -> 2 -> 3]',
      output: '2',
      explanation:
        'In a 3-node linear chain tree, the path between endpoint leaf 3 and endpoint leaf 1 spans 2 edges.',
    },
  ],
  code: TREE_DIAMETER_CODE,
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  complexityAnalysis: {
    time: "We run depth-first search twice, and each pass walks every node and edge exactly once — in a tree that's V nodes and V − 1 edges, so one pass costs O(V + E). Two linear passes are still linear, which is why the whole algorithm stays O(V + E) no matter what shape the tree has.",
    space: 'We keep an adjacency list with an entry per node, plus the DFS recursion stack, which in a chain-shaped tree can stack up every node at once — so extra memory grows with the number of nodes, O(V).',
  },
  defaultInput: DEFAULT_TREE_DIAMETER_INPUT,
  generateSteps: generateTreeDiameterSteps,
};
