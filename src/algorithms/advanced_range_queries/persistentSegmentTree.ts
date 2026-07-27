import type { AlgorithmDefinition, AlgorithmStep, TopicGuide, TreeNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface PersistentSegOp {
  type: "update" | "query";
  version: number;
  index?: number;
  value?: number;
  left?: number;
  right?: number;
}

export interface PersistentSegmentTreeInput {
  array: number[];
  operations: PersistentSegOp[];
}

export const PERSISTENT_SEGMENT_TREE_CODE = `
class Node:
    def __init__(self, val: int, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(arr: list[int], l: int, r: int) -> Node:
    if l == r:
        return Node(arr[l])
    mid = (l + r) // 2
    left = build(arr, l, mid)
    right = build(arr, mid + 1, r)
    return Node(left.val + right.val, left, right)

def update(prev: Node, l: int, r: int, idx: int, val: int) -> Node:
    if l == r:
        return Node(val)
    mid = (l + r) // 2
    if idx <= mid:
        left = update(prev.left, l, mid, idx, val)
        right = prev.right
    else:
        left = prev.left
        right = update(prev.right, mid + 1, r, idx, val)
    return Node(left.val + right.val, left, right)

def query(node: Node, l: int, r: int, ql: int, qr: int) -> int:
    if not node or qr < l or ql > r:
        return 0
    if ql <= l and r <= qr:
        return node.val
    mid = (l + r) // 2
    return query(node.left, l, mid, ql, qr) + query(node.right, mid + 1, r, ql, qr)
`;

export const DEFAULT_PERSISTENT_SEGMENT_TREE_INPUT: PersistentSegmentTreeInput = {
  array: [1, 3, 5, 7],
  operations: [
    { type: "update", version: 0, index: 1, value: 10 },
    { type: "query", version: 0, left: 0, right: 3 },
    { type: "query", version: 1, left: 0, right: 3 },
  ],
};

interface PNode {
  id: string;
  l: number;
  r: number;
  val: number;
  left?: PNode;
  right?: PNode;
  version: number;
}

export const generatePersistentSegmentTreeSteps = (
  input: PersistentSegmentTreeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  let nodeCounter = 0;

  const arr = [...input.array];
  const n = arr.length;
  const versions: PNode[] = [];

  const collectAllNodes = (activeId?: string): TreeNodeItem[] => {
    const list: TreeNodeItem[] = [];
    const visited = new Set<string>();

    const traverse = (node: PNode) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      list.push({
        id: node.id,
        val: node.val,
        leftId: node.left?.id,
        rightId: node.right?.id,
        state: node.id === activeId ? "active" : "default",
      });
      if (node.left) traverse(node.left);
      if (node.right) traverse(node.right);
    };

    for (const rootNode of versions) {
      traverse(rootNode);
    }
    return list;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeId?: string,
    customState?: Record<string, string | number>,
  ) => {
    const activeRoot = versions.length > 0 ? versions[versions.length - 1].id : undefined;
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "tree",
        nodes: collectAllNodes(activeId),
        rootId: activeRoot,
      },
      auxiliaryState: {
        customState: customState ?? {
          numVersions: String(versions.length),
          arrayLength: String(n),
        },
      },
      variables,
    });
  };

  if (n === 0) {
    addStep(8, "Array is empty", "No tree built for empty array.", { n: 0 });
    return steps;
  }

  const buildTree = (l: number, r: number, v: number): PNode => {
    const id = `pnode-v${v}-${nodeCounter++}`;
    if (l === r) {
      return { id, l, r, val: arr[l], version: v };
    }
    const mid = Math.floor((l + r) / 2);
    const leftChild = buildTree(l, mid, v);
    const rightChild = buildTree(mid + 1, r, v);
    return {
      id,
      l,
      r,
      val: leftChild.val + rightChild.val,
      left: leftChild,
      right: rightChild,
      version: v,
    };
  };

  const rootV0 = buildTree(0, n - 1, 0);
  versions.push(rootV0);

  addStep(
    7,
    "Initialize Persistent Segment Tree v0",
    `Building version 0 of Segment Tree over array [${arr.join(", ")}].`,
    { n },
  );

  addStep(
    13,
    `Built root version 0 (val = ${rootV0.val})`,
    "Version 0 tree constructed. Subsequent updates will clone only modified path nodes and reuse unmodified subtrees.",
    { version: 0, rootValue: rootV0.val },
    rootV0.id,
  );

  const updateTree = (
    prev: PNode,
    l: number,
    r: number,
    idx: number,
    val: number,
    v: number,
  ): PNode => {
    const id = `pnode-v${v}-${nodeCounter++}`;
    if (l === r) {
      addStep(
        17,
        `Created new leaf node for v${v} at index ${idx} with val ${val}`,
        `Leaf replacement at index ${idx}. Path node cloned for new version v${v}.`,
        { v, idx, val },
        id,
      );
      return { id, l, r, val, version: v };
    }

    const mid = Math.floor((l + r) / 2);
    let newLeft = prev.left;
    let newRight = prev.right;

    if (idx <= mid) {
      newLeft = updateTree(prev.left!, l, mid, idx, val, v);
    } else {
      newRight = updateTree(prev.right!, mid + 1, r, idx, val, v);
    }

    const newNodeVal = (newLeft?.val ?? 0) + (newRight?.val ?? 0);
    const newNode: PNode = {
      id,
      l,
      r,
      val: newNodeVal,
      left: newLeft,
      right: newRight,
      version: v,
    };

    addStep(
      21,
      `Created version v${v} node [${l}..${r}] (val = ${newNodeVal})`,
      `Cloned parent node for v${v}. Left child is ${newLeft?.id}, right child is ${newRight?.id} (shared or new).`,
      { v, l, r, val: newNodeVal },
      id,
    );

    return newNode;
  };

  const queryTree = (
    node: PNode | undefined,
    l: number,
    r: number,
    ql: number,
    qr: number,
  ): number => {
    if (!node || qr < l || ql > r) return 0;
    if (ql <= l && r <= qr) {
      addStep(
        30,
        `Node [${l}..${r}] fully inside query range. Returning ${node.val}`,
        `Exact match. Returning version v${node.version} precomputed node value ${node.val}.`,
        { l, r, val: node.val, v: node.version },
        node.id,
      );
      return node.val;
    }
    const mid = Math.floor((l + r) / 2);
    return queryTree(node.left, l, mid, ql, qr) + queryTree(node.right, mid + 1, r, ql, qr);
  };

  const ops = input.operations ?? [];
  for (let opIdx = 0; opIdx < ops.length; opIdx++) {
    const op = ops[opIdx];
    const targetVersion = Math.max(0, Math.min(op.version ?? 0, versions.length - 1));
    const rootTarget = versions[targetVersion];

    if (op.type === "update") {
      const idx = Math.max(0, Math.min(op.index ?? 0, n - 1));
      const val = op.value ?? 0;
      const newV = versions.length;

      addStep(
        15,
        `Update v${targetVersion} at index ${idx} to value ${val} -> Creates v${newV}`,
        `Branching from version ${targetVersion} to generate version ${newV} via path copying.`,
        { baseVersion: targetVersion, newVersion: newV, idx, val },
        rootTarget.id,
      );

      const newRoot = updateTree(rootTarget, 0, n - 1, idx, val, newV);
      versions.push(newRoot);

      addStep(
        21,
        `Version v${newV} generated (root val = ${newRoot.val})`,
        `Successfully generated persistent version ${newV}. Version ${targetVersion} remains completely unmodified.`,
        { newVersion: newV, rootVal: newRoot.val },
        newRoot.id,
      );
    } else if (op.type === "query") {
      const ql = Math.max(0, Math.min(op.left ?? 0, n - 1));
      const qr = Math.max(ql, Math.min(op.right ?? n - 1, n - 1));

      addStep(
        26,
        `Query Range [${ql}..${qr}] on Tree Version v${targetVersion}`,
        `Querying version ${targetVersion} without affecting any other tree version.`,
        { targetVersion, ql, qr },
        rootTarget.id,
      );

      const res = queryTree(rootTarget, 0, n - 1, ql, qr);
      addStep(
        32,
        `Query Result on v${targetVersion}: sum([${ql}..${qr}]) = ${res}`,
        `Completed persistent segment tree query on version ${targetVersion}. Result is ${res}.`,
        { targetVersion, ql, qr, result: res },
        rootTarget.id,
        { queryResult: String(res) },
      );
    }
  }

  return steps;
};

export const PERSISTENT_SEGMENT_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A Persistent Segment Tree preserves past states of the tree after updates. By applying path copying (cloning only the O(log N) nodes on the search path from root to leaf and pointing unchanged branches to previous versions), every version remains fully accessible and queryable.",
  sections: [
    {
      heading: "Path Copying Mechanism",
      body: "When updating a leaf at index i, only the nodes along the path from the root to index i are modified. Rather than overwriting them in place, new nodes are allocated for the new version while copying unchanged subtrees from the previous version.",
    },
    {
      heading: "Space and Time Efficiency",
      body: "Each point update creates exactly log2(N) + 1 new nodes and takes O(log N) time. After K updates, total memory used is O(N + K log N).",
    },
    {
      heading: "Applications",
      body: "Persistent Segment Trees are essential for solving advanced range problems like finding the kth smallest element in a subarray (Range Kth Smallest), spatial range queries, and undoing/rewinding data structure operations.",
    },
  ],
  keyTerms: [
    {
      term: "Persistent Data Structure",
      definition: "A data structure that preserves previous versions of itself when modified.",
    },
    {
      term: "Path Copying",
      definition:
        "Duplicating only the nodes along the update path while re-using existing nodes for unchanged subtrees.",
    },
  ],
};

export const PERSISTENT_SEGMENT_TREE_TRIVIA: TriviaMeta = {
  skipLines: [1, 6, 14, 25],
  distractors: [
    "return Node(prev.val + val, prev.left, prev.right)",
    "prev.left = new_left",
    "def query(node, l, r, ql, qr): return node.val",
  ],
  hints: [
    {
      line: 21,
      hint: "Create a new node pointing to new_left and prev.right",
    },
    {
      line: 30,
      hint: "Return node.val when node range is fully contained in query range",
    },
  ],
  lineExplanations: {
    7: "Recursive build function constructing initial tree version (v0).",
    15: "Path copying update creating a new version of the segment tree.",
    21: "Clone parent node: connect newly created left child and keep previous right child.",
    26: "Query range minimum/sum over a specific persistent version.",
    30: "Base case for range query returning precomputed version node aggregate.",
  },
};

export const persistentSegmentTree: AlgorithmDefinition<PersistentSegmentTreeInput> = {
  id: "persistent-segment-tree",
  title: "Persistent Segment Tree (Versioned Range Queries)",
  category: "advanced_range_queries",
  categories: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "Persistent Segment Tree maintains full historical versioning of range data structures via path copying, creating O(log N) new nodes per update while preserving access to all previous versions.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay:
        "arr = [1, 3, 5, 7], ops = [update(v0, idx=1, val=10) -> v1, query(v0, 0..3), query(v1, 0..3)]",
      outputDisplay: "Query v0[0..3]: 16, Query v1[0..3]: 23",
      input: {
        array: [1, 3, 5, 7],
        operations: [
          { type: "update", version: 0, index: 1, value: 10 },
          { type: "query", version: 0, left: 0, right: 3 },
          { type: "query", version: 1, left: 0, right: 3 },
        ],
      },
      output: "Query v0[0..3]: 16, Query v1[0..3]: 23",
      explanation:
        "Version 0 preserves original sum 16; Version 1 has updated arr[1] = 10 with sum 23.",
    },
    {
      kind: "complex",
      title: "Complex Edge Case",
      inputDisplay:
        "arr = [2, 4, 6, 8, 10], ops = [update(v0, 0, 20)->v1, update(v1, 4, 30)->v2, query(v0, 0..4)]",
      outputDisplay: "Query v0[0..4]: 30, Query v2[0..4]: 74",
      input: {
        array: [2, 4, 6, 8, 10],
        operations: [
          { type: "update", version: 0, index: 0, value: 20 },
          { type: "update", version: 1, index: 4, value: 30 },
          { type: "query", version: 0, left: 0, right: 4 },
          { type: "query", version: 2, left: 0, right: 4 },
        ],
      },
      output: "Query v0[0..4]: 30, Query v2[0..4]: 74",
      explanation:
        "Chained updates v0 -> v1 -> v2 generate independent tree roots via path copying.",
    },
    {
      kind: "negative",
      title: "Failing / Boundary Case",
      inputDisplay: "arr = [99], ops = [update(v0, 0, 100), query(v0, 0..0)]",
      outputDisplay: "Query v0[0..0]: 99",
      input: {
        array: [99],
        operations: [
          { type: "update", version: 0, index: 0, value: 100 },
          { type: "query", version: 0, left: 0, right: 0 },
        ],
      },
      output: "Query v0[0..0]: 99",
      explanation: "Querying v0 after creating v1 confirms v0 remains intact.",
    },
  ],
  code: PERSISTENT_SEGMENT_TREE_CODE,
  timeComplexity: {
    best: "O(log n)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(n + q log n)",
  complexityAnalysis: {
    time: "Each update creates log2(n) new nodes in O(log n) time. Range queries traverse at most log2(n) levels in O(log n) time.",
    space:
      "Initial tree construction takes O(n) space. Each update adds O(log n) nodes, requiring O(n + q log n) overall space for q updates.",
  },
  topicGuide: PERSISTENT_SEGMENT_TREE_TOPIC_GUIDE,
  trivia: PERSISTENT_SEGMENT_TREE_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.3 Segment tree / Persistent segment tree",
      label: "Competitive Programmer's Handbook, Ch 9",
    },
  ],
  defaultInput: DEFAULT_PERSISTENT_SEGMENT_TREE_INPUT,
  generateSteps: generatePersistentSegmentTreeSteps,
};
