import type {
  AlgorithmDefinition,
  AlgorithmStep,
  TreeNodeItem,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

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

const TREE_DIAMETER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Signature: takes the node count, an adjacency list of the tree, and an arbitrary node to start the first search from — any start works thanks to the endpoint theorem.',
    2: "Comment documenting the helper's contract: given a starting point, it reports which node ended up farthest away and how far that is.",
    3: 'A recursive depth-first walk that tracks the node it came from (to avoid backtracking) and how many edges it has travelled so far.',
    4: 'Seed the running "farthest so far" with the current node itself, since with no children explored yet it is trivially the farthest one found.',
    5: 'Visit every node connected to this one — in a tree that means every child and the parent, since the adjacency list is undirected.',
    6: 'Skip stepping back into the node we just came from; without this guard the walk would bounce between two adjacent nodes forever.',
    7: "Recurse one edge further into this neighbor's subtree, asking it the same question and getting back its own farthest node and distance.",
    8: "Only update our record if that neighbor's branch reached farther than anything we've seen from this node so far.",
    9: "Adopt the deeper branch's farthest node and distance as our own new record.",
    10: 'Hand the best (farthest node, distance) pair found in this entire subtree back up to the caller.',
    12: 'Comment marking the first of the two passes the whole algorithm depends on.',
    13: 'Run the first DFS from any starting node; the node it reports as farthest is guaranteed to be one true endpoint of the diameter, regardless of where we started.',
    14: 'Comment marking the second pass, which measures from the endpoint the first pass just proved.',
    15: "Run the second DFS from confirmed endpoint A; the farthest node from A is the diameter's other endpoint, and its distance is the diameter itself.",
    16: 'Report both endpoints of the longest path in the tree along with its length — two linear passes were all it took.',
  },
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
  topicGuide: {
    overview:
      'The diameter of a tree is the number of edges on the longest simple path anywhere in it — the distance between the two most remote nodes. Because a tree is connected and has no cycles, there is exactly one path between any pair of nodes, so "the longest path" is a well-defined single quantity rather than an optimisation over many routes. The double-DFS method finds it with only two traversals, and it is a beautiful example of a structural theorem about trees doing work that an algorithm would otherwise have to brute-force. What you should take away is not just the recipe but the habit of looking for a property of the input that lets you skip most of the search.',
    sections: [
      {
        heading: 'What makes trees special enough for this to work',
        body: 'A tree on V nodes is connected and acyclic, which forces it to have exactly V minus one edges and, more importantly, exactly one simple path between any two nodes. That uniqueness means distance is unambiguous and the diameter is simply the largest of all pairwise distances, with no shortest-path relaxation needed. The naive consequence is that you could run a traversal from every node, record how far the farthest node is, and take the maximum of those numbers. The whole point of this algorithm is that you do not need all V of those searches — one from an arbitrary node, plus one more, is provably enough.',
      },
      {
        heading: 'The two passes, concretely',
        body: 'The first depth-first search starts from any node you like, carries a running distance, and reports back the node that ended up farthest away; call it A. The second search starts from A and does the same thing, and the node it finds farthest away is B, with the distance between A and B being the diameter itself. During the second pass you also record each node\'s parent, or push the current path onto a list as you descend, so that when you land on B you can reconstruct the actual sequence of nodes rather than just its length. In the eight-node example the first pass from the root reaches leaf 7 at distance three, and the second pass from 7 reaches leaf 8 at distance six, tracing the path 7, 4, 2, 1, 3, 6, 8.',
      },
      {
        heading: 'Why the first pass must land on an endpoint',
        body: 'The claim to prove is that for any starting node s, the node farthest from s is an endpoint of some diameter — that is the invariant the whole method rests on. Suppose the diameter path runs from u to v, and let m be the node where the path from s first touches that path. Any node the search could call farthest either is u or v, or it hangs off the tree somewhere else; in the latter case you could take its branch from m and glue it onto whichever half of the diameter through m is longer, producing a path strictly longer than u to v, which contradicts u to v being longest. So the farthest node from s is genuinely a diameter endpoint, and once one endpoint is pinned down the farthest node from it is by definition the other end. Without this argument the algorithm looks like a lucky guess, which is exactly why it is worth reconstructing yourself.',
      },
      {
        heading: 'Pitfalls that silently break it',
        body: 'The traversal must never step back into the node it just came from: pass the parent down and skip it, or maintain a visited set, because otherwise two adjacent nodes will bounce the search back and forth forever. The endpoint theorem depends on edge lengths being non-negative, so with a single negative weight the splicing argument collapses and double-DFS quietly returns a wrong answer — that case needs a different approach. Connectivity matters too: on a forest you have to run the pair of passes once per component, since a search cannot cross between components. Finally, be deliberate about units, because the diameter counts edges and not nodes, so a single isolated node has diameter zero while the path through it lists one node, and mixing the two conventions is the most common off-by-one here.',
      },
      {
        heading: 'The single-pass alternative',
        body: 'There is a second standard solution that never needs the theorem at all: run one post-order depth-first search, and at each node compute the heights of its children, keep the two largest, and treat their sum as a candidate for the longest path bending at that node while returning the largest plus one upward. Take the maximum candidate over all nodes and you have the diameter in a single traversal. That version extends cleanly to weighted trees, including negative weights, and it gives you a per-node value — the longest path passing through each node — which is useful in its own right. Prefer the double search when you want the two endpoints and the path spelled out with almost no code; prefer the height-combining pass when weights are involved or when you need those per-node quantities.',
      },
      {
        heading: 'Where the idea generalises',
        body: 'The centre of a tree is the middle node or edge of any diameter path, which is the direct route to problems asking for the root that minimises tree height. Tree radius, eccentricity of individual nodes, and rerooting dynamic programming that computes each node\'s farthest distance in linear time all grow out of the same distance machinery. On unweighted trees you can swap depth-first search for breadth-first search in both passes with no change to the argument, which is handy when the tree is deep enough to threaten recursion limits. Even outside trees, the "walk to the farthest thing, then walk again" heuristic is the standard cheap estimate for the diameter of a general graph, where computing it exactly is far more expensive.',
      },
    ],
    keyTerms: [
      {
        term: 'Tree',
        definition:
          'A connected graph with no cycles, which on V nodes means exactly V minus one edges. Its defining convenience is that every pair of nodes is joined by exactly one simple path.',
      },
      {
        term: 'Simple path',
        definition:
          'A route through the graph that never repeats a node. Path length here counts edges traversed, so a path visiting k nodes has length k minus one.',
      },
      {
        term: 'Diameter',
        definition:
          'The greatest distance between any two nodes in the tree. There may be several different paths achieving it, but they all share the same length and the same centre.',
      },
      {
        term: 'Eccentricity',
        definition:
          'For one node, the distance to the node farthest from it. The diameter is the maximum eccentricity in the tree, and the first pass of this algorithm is computing the eccentricity of the arbitrary start node.',
      },
      {
        term: 'Parent guard',
        definition:
          'The check that stops a traversal from revisiting the neighbour it arrived from, since tree edges are undirected. Omitting it turns any tree walk into an infinite ping-pong between two nodes.',
      },
    ],
  },
  trivia: TREE_DIAMETER_TRIVIA,
  defaultInput: DEFAULT_TREE_DIAMETER_INPUT,
  generateSteps: generateTreeDiameterSteps,
};
