import type {
  AlgorithmStep,
  ElementState,
  PrimaryVisualSnapshot,
  TreeNodeItem,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Tree Diameter problem finds the maximum number of edges on any simple path connecting two vertices in an unweighted tree using two passes of Depth-First Search (2-DFS).",
    primarySnapshot: {
      kind: "tree",
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
    },
  },
  {
    narrative:
      "The 2-DFS Theorem states that starting a DFS from any arbitrary node S discovers a node A that is guaranteed to be one true endpoint of a longest simple path in the tree.",
    primarySnapshot: {
      kind: "tree",
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "active" },
        { id: "2", val: 2, leftId: "4", rightId: "5", state: "compare" },
        { id: "3", val: 3, rightId: "6", state: "compare" },
        { id: "4", val: 4, leftId: "7", state: "default" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, rightId: "8", state: "default" },
        { id: "7", val: 7, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Pass 1 DFS: we traverse from arbitrary start node S, exploring all reachable branches to measure node distances.",
    primarySnapshot: {
      kind: "tree",
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "visited" },
        { id: "2", val: 2, leftId: "4", rightId: "5", state: "visited" },
        { id: "3", val: 3, rightId: "6", state: "default" },
        { id: "4", val: 4, leftId: "7", state: "active" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, rightId: "8", state: "default" },
        { id: "7", val: 7, state: "compare" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Endpoint A Discovery: Pass 1 identifies node 7 (dist 3 from start node 1) as the farthest reachable node, locking it as Endpoint A.",
    primarySnapshot: {
      kind: "tree",
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "visited" },
        { id: "2", val: 2, leftId: "4", rightId: "5", state: "visited" },
        { id: "3", val: 3, rightId: "6", state: "visited" },
        { id: "4", val: 4, leftId: "7", state: "visited" },
        { id: "5", val: 5, state: "visited" },
        { id: "6", val: 6, rightId: "8", state: "visited" },
        { id: "7", val: 7, state: "pivot" },
        { id: "8", val: 8, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Pass 2 DFS: we launch a second DFS starting directly from confirmed Endpoint A to measure distances across the entire tree.",
    primarySnapshot: {
      kind: "tree",
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "active" },
        { id: "2", val: 2, leftId: "4", rightId: "5", state: "visited" },
        { id: "3", val: 3, rightId: "6", state: "compare" },
        { id: "4", val: 4, leftId: "7", state: "visited" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, rightId: "8", state: "default" },
        { id: "7", val: 7, state: "pivot" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Endpoint B Discovery: Pass 2 reaches node 8 at distance 6 from Endpoint A, establishing node 8 as Endpoint B and proving tree diameter D = 6.",
    primarySnapshot: {
      kind: "tree",
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "compare" },
        { id: "2", val: 2, leftId: "4", rightId: "5", state: "compare" },
        { id: "3", val: 3, rightId: "6", state: "compare" },
        { id: "4", val: 4, leftId: "7", state: "compare" },
        { id: "5", val: 5, state: "visited" },
        { id: "6", val: 6, rightId: "8", state: "compare" },
        { id: "7", val: 7, state: "pivot" },
        { id: "8", val: 8, state: "pivot" },
      ],
    },
  },
  {
    narrative:
      "Diameter Path Highlight: the 6-edge simple path 7 → 4 → 2 → 1 → 3 → 6 → 8 represents the longest possible path between any pair of nodes in the tree.",
    primarySnapshot: {
      kind: "tree",
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "sorted" },
        { id: "2", val: 2, leftId: "4", rightId: "5", state: "sorted" },
        { id: "3", val: 3, rightId: "6", state: "sorted" },
        { id: "4", val: 4, leftId: "7", state: "sorted" },
        { id: "5", val: 5, state: "default" },
        { id: "6", val: 6, rightId: "8", state: "sorted" },
        { id: "7", val: 7, state: "sorted" },
        { id: "8", val: 8, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Using two linear DFS passes (O(V + E) = O(N)) avoids evaluating all O(N²) node pairs, delivering optimal linear time and O(H) space complexity.",
    primarySnapshot: {
      kind: "tree",
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "visited" },
        { id: "2", val: 2, leftId: "4", rightId: "5", state: "visited" },
        { id: "3", val: 3, rightId: "6", state: "visited" },
        { id: "4", val: 4, leftId: "7", state: "visited" },
        { id: "5", val: 5, state: "visited" },
        { id: "6", val: 6, rightId: "8", state: "visited" },
        { id: "7", val: 7, state: "pivot" },
        { id: "8", val: 8, state: "pivot" },
      ],
    },
  },
];

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

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.rootId === DEFAULT_TREE_DIAMETER_INPUT.rootId &&
      Array.isArray(input.nodes) &&
      input.nodes.length === DEFAULT_TREE_DIAMETER_INPUT.nodes.length);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const visitedSet = new Set<string>();

  const makeSnapshot = (
    activeId?: string,
    nodeAId?: string,
    nodeBId?: string,
    diameterPath?: Set<string>,
  ): PrimaryVisualSnapshot => {
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

      return {
        ...node,
        state,
      };
    });

    return {
      kind: "tree",
      rootId,
      nodes: updatedNodes,
    };
  };

  if (!rootId || !nodeMap.has(rootId)) {
    addStep(
      "The input tree root is null or empty, so tree diameter is 0 edges; returning 0.",
      {
        kind: "tree",
        rootId: "",
        nodes: [],
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected tree of ${nodes.length} nodes starting Pass 1 from root Node(${valOf(rootId)}).`,
    makeSnapshot(undefined),
  );

  // DFS 1: Find farthest node from root (Endpoint A)
  let farthestNodeA = rootId;
  let maxDistA = 0;

  const parentMap = new Map<string, string | null>();

  const runDfs1 = (u: string, p: string | null, dist: number) => {
    visitedSet.add(u);
    parentMap.set(u, p);

    if (dist > maxDistA) {
      maxDistA = dist;
      farthestNodeA = u;
    }

    addStep(
      `Pass 1 DFS: visit Node(${valOf(u)}) at distance ${dist} from start Node(${valOf(rootId)}). Current farthest candidate: Node(${valOf(farthestNodeA)}) at distance ${maxDistA}.`,
      makeSnapshot(u),
    );

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (v !== p) {
        runDfs1(v, u, dist + 1);
      }
    }
  };

  runDfs1(rootId, null, 0);

  addStep(
    `Pass 1 DFS complete! Node(${valOf(farthestNodeA)}) at distance ${maxDistA} from start node is locked as Endpoint A of the tree diameter.`,
    makeSnapshot(undefined, farthestNodeA),
  );

  // DFS 2: Find farthest node from Endpoint A (Endpoint B)
  visitedSet.clear();
  parentMap.clear();

  let farthestNodeB = farthestNodeA;
  let maxDistB = 0;

  const runDfs2 = (u: string, p: string | null, dist: number) => {
    visitedSet.add(u);
    parentMap.set(u, p);

    if (dist > maxDistB) {
      maxDistB = dist;
      farthestNodeB = u;
    }

    addStep(
      `Pass 2 DFS: visit Node(${valOf(u)}) at distance ${dist} from Endpoint A Node(${valOf(farthestNodeA)}). Current max distance: ${maxDistB}.`,
      makeSnapshot(u, farthestNodeA, farthestNodeB),
    );

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (v !== p) {
        runDfs2(v, u, dist + 1);
      }
    }
  };

  runDfs2(farthestNodeA, null, 0);

  // Reconstruct path from B back to A using parentMap
  const diameterPathSet = new Set<string>();
  let curr: string | null = farthestNodeB;
  while (curr !== null) {
    diameterPathSet.add(curr);
    curr = parentMap.get(curr) ?? null;
  }

  addStep(
    `Tree Diameter complete! Pass 2 from Endpoint A Node(${valOf(farthestNodeA)}) found Endpoint B Node(${valOf(farthestNodeB)}) at distance ${maxDistB}. Diameter path contains ${maxDistB} edges.`,
    makeSnapshot(undefined, farthestNodeA, farthestNodeB, diameterPathSet),
  );

  return steps;
};

export default generateTreeDiameterSteps;
