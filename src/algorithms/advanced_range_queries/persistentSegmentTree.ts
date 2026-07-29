import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  PrimaryVisualSnapshot,
  TopicGuide,
  TreeNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

export const PERSISTENT_SEGMENT_TREE_CODE = `class Node:
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

def persistent_segment_tree_operations(arr: list[int], index: int, value: int, left: int, right: int) -> dict:
    roots = [build(arr, 0, len(arr) - 1)]
    v1 = update(roots[0], 0, len(arr) - 1, index, value)
    roots.append(v1)
    return {
        "before": query(roots[0], 0, len(arr) - 1, left, right),
        "after": query(roots[1], 0, len(arr) - 1, left, right),
        "originalTotal": query(roots[0], 0, len(arr) - 1, 0, len(arr) - 1),
        "updatedTotal": query(roots[1], 0, len(arr) - 1, 0, len(arr) - 1),
    }`;

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Persistent Data Structure preserves access to all historical versions of data after updates, allowing queries against past states.",
    primarySnapshot: {
      kind: "array",
      name: "versionHistory",
      elements: [
        { id: "v0", value: 16, label: "v0 (sum=16)", state: "visited" },
        { id: "v1", value: 23, label: "v1 (sum=23)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Duplicating the entire tree on every update requires O(N) memory and O(N) setup time per version, which is unsustainable for large datasets.",
    primarySnapshot: {
      kind: "array",
      name: "fullCopyWarning",
      elements: [
        { id: "fc1", value: 0, label: "copy full tree O(N)", state: "active" },
        { id: "fc2", value: 0, label: "O(N * Q) OOM Memory", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Functional persistence uses path copying: when updating an index, we allocate new nodes strictly along the single updated root-to-leaf path.",
    primarySnapshot: {
      kind: "tree",
      rootId: "v1_root",
      nodes: [
        { id: "v0_root", val: 16, leftId: "v0_l", rightId: "v0_r", state: "default" },
        { id: "v0_l", val: 4, state: "default" },
        { id: "v0_r", val: 12, state: "default" },
        { id: "v1_root", val: 23, leftId: "v1_l", rightId: "v0_r", state: "swap" },
        { id: "v1_l", val: 11, state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Unchanged subtrees are shared between versions via direct pointer reference, avoiding duplicate memory allocation.",
    primarySnapshot: {
      kind: "tree",
      rootId: "v1_root",
      nodes: [
        { id: "v0_root", val: 16, leftId: "v0_l", rightId: "v0_r", state: "default" },
        { id: "v0_l", val: 4, state: "default" },
        { id: "v0_r", val: 12, state: "visited" },
        { id: "v1_root", val: 23, leftId: "v1_l", rightId: "v0_r", state: "active" },
        { id: "v1_l", val: 11, state: "active" },
      ],
    },
  },
  {
    narrative:
      "Building initial version 0 creates a standard Segment Tree over the array in O(N) time and space.",
    primarySnapshot: {
      kind: "tree",
      rootId: "v0_root",
      nodes: [
        { id: "v0_root", val: 16, leftId: "n2", rightId: "n3", state: "active" },
        { id: "n2", val: 4, leftId: "n4", rightId: "n5", state: "default" },
        { id: "n3", val: 12, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 1, state: "default" },
        { id: "n5", val: 3, state: "default" },
        { id: "n6", val: 5, state: "default" },
        { id: "n7", val: 7, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Updating version V creates a brand new root node for version V+1 covering the complete interval range [0..N-1].",
    primarySnapshot: {
      kind: "tree",
      rootId: "v1_root",
      nodes: [
        { id: "v0_root", val: 16, leftId: "n2", rightId: "n3", state: "default" },
        { id: "v1_root", val: 23, state: "swap" },
        { id: "n2", val: 4, state: "default" },
        { id: "n3", val: 12, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Path copying allocates new node copies only down the branch containing target index K.",
    primarySnapshot: {
      kind: "tree",
      rootId: "v1_root",
      nodes: [
        { id: "v0_root", val: 16, leftId: "n2", rightId: "n3", state: "default" },
        { id: "v1_root", val: 23, leftId: "v1_l", rightId: "n3", state: "visited" },
        { id: "n2", val: 4, state: "default" },
        { id: "n3", val: 12, state: "visited" },
        { id: "v1_l", val: 11, state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Because each update creates exactly log2(N) new nodes, version updates run in fast O(log N) time and space.",
    primarySnapshot: {
      kind: "tree",
      rootId: "v1_root",
      nodes: [
        { id: "v0_root", val: 16, leftId: "n2", rightId: "n3", state: "default" },
        { id: "v1_root", val: 23, leftId: "v1_l", rightId: "n3", state: "sorted" },
        { id: "n2", val: 4, state: "default" },
        { id: "n3", val: 12, state: "sorted" },
        { id: "v1_l", val: 11, leftId: "n4", rightId: "v1_leaf", state: "sorted" },
        { id: "v1_leaf", val: 10, state: "sorted" },
        { id: "n4", val: 1, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Any historical version root v_i can be queried independently in O(log N) time without mutating other version trees.",
    primarySnapshot: {
      kind: "tree",
      rootId: "v0_root",
      nodes: [
        { id: "v0_root", val: 16, leftId: "n2", rightId: "n3", state: "active" },
        { id: "v1_root", val: 23, leftId: "v1_l", rightId: "n3", state: "default" },
        { id: "n2", val: 4, state: "active" },
        { id: "n3", val: 12, state: "active" },
      ],
    },
  },
  {
    narrative:
      "Persistent Segment Trees enable advanced algorithms such as range K-th smallest queries, 2D range counting, and version rollbacks.",
    primarySnapshot: {
      kind: "array",
      name: "persistentApplications",
      elements: [
        { id: "p1", value: 0, label: "Path Copying O(log N)", state: "sorted" },
        { id: "p2", value: 0, label: "Shared Subtrees O(1)", state: "sorted" },
        { id: "p3", value: 0, label: "Time-Travel Queries", state: "sorted" },
      ],
    },
  },
];

export const generatePersistentSegmentTreeSteps = (
  input: PersistentSegmentTreeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  let nodeCounter = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  const safeInput = {
    array: Array.isArray(input?.array) ? input.array : DEFAULT_PERSISTENT_SEGMENT_TREE_INPUT.array,
    operations: Array.isArray(input?.operations)
      ? input.operations
      : DEFAULT_PERSISTENT_SEGMENT_TREE_INPUT.operations,
  };
  const arr = [...safeInput.array];
  const n = arr.length;
  const versions: PNode[] = [];
  const allCreatedNodes: PNode[] = [];

  const addNode = (node: PNode): PNode => {
    allCreatedNodes.push(node);
    return node;
  };

  const collectAllNodes = (
    activeId?: string,
    activeState: ElementState = "active",
  ): TreeNodeItem[] => {
    return allCreatedNodes.map((node) => {
      let state: TreeNodeItem["state"] = "default";
      if (node.id === activeId) {
        state = activeState;
      }
      return {
        id: node.id,
        val: node.val,
        leftId: node.left?.id,
        rightId: node.right?.id,
        state,
      };
    });
  };

  const addWalkthroughStep = (
    narrative: string,
    activeId?: string,
    activeState: ElementState = "active",
  ) => {
    const activeRoot =
      versions.length > 0
        ? versions[versions.length - 1].id
        : allCreatedNodes.length > 0
          ? allCreatedNodes[allCreatedNodes.length - 1].id
          : undefined;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot: {
          kind: "tree",
          name: "persistentSegmentTree",
          nodes: collectAllNodes(activeId, activeState),
          rootId: activeRoot,
        },
      }),
    );
  };

  addWalkthroughStep(
    `Initializing Persistent Segment Tree for array [${arr.join(", ")}] of size ${n}.`,
  );

  if (n === 0) {
    addWalkthroughStep("The input array is empty, so no persistent version tree can be built.");
    return steps;
  }

  const buildTree = (l: number, r: number, v: number): PNode => {
    const id = `node-v${v}-${nodeCounter++}`;
    if (l === r) {
      const leafNode = addNode({ id, l, r, val: arr[l], version: v });
      addWalkthroughStep(
        `Built leaf node v${v} covering index ${l} with value arr[${l}] = ${arr[l]}.`,
        id,
        "swap",
      );
      return leafNode;
    }

    const mid = Math.floor((l + r) / 2);
    const leftChild = buildTree(l, mid, v);
    const rightChild = buildTree(mid + 1, r, v);

    const nodeVal = leftChild.val + rightChild.val;
    const internalNode = addNode({
      id,
      l,
      r,
      val: nodeVal,
      left: leftChild,
      right: rightChild,
      version: v,
    });

    addWalkthroughStep(
      `Built internal node v${v} [${l}..${r}] combining left (${leftChild.val}) + right (${rightChild.val}) = ${nodeVal}.`,
      id,
      "active",
    );

    return internalNode;
  };

  const v0Root = buildTree(0, n - 1, 0);
  versions.push(v0Root);

  addWalkthroughStep(
    `Completed base tree Version 0 (v0) with root sum ${v0Root.val}.`,
    v0Root.id,
    "visited",
  );

  const updateTree = (
    prevNode: PNode,
    l: number,
    r: number,
    idx: number,
    val: number,
    newVersion: number,
  ): PNode => {
    const id = `node-v${newVersion}-${nodeCounter++}`;
    if (l === r) {
      const leafNode = addNode({ id, l, r, val, version: newVersion });
      addWalkthroughStep(
        `Path copying leaf node for v${newVersion} at index ${idx}: old value = ${prevNode.val}, new value = ${val}.`,
        id,
        "swap",
      );
      return leafNode;
    }

    const mid = Math.floor((l + r) / 2);
    let leftChild: PNode;
    let rightChild: PNode;

    if (idx <= mid) {
      rightChild = prevNode.right!;
      addWalkthroughStep(
        `Path copying node v${newVersion} [${l}..${r}]: recursing left for index ${idx}, sharing right subtree v${rightChild.version} [${mid + 1}..${r}].`,
        prevNode.id,
        "active",
      );
      leftChild = updateTree(prevNode.left!, l, mid, idx, val, newVersion);
    } else {
      leftChild = prevNode.left!;
      addWalkthroughStep(
        `Path copying node v${newVersion} [${l}..${r}]: sharing left subtree v${leftChild.version} [${l}..${mid}], recursing right for index ${idx}.`,
        prevNode.id,
        "compare",
      );
      rightChild = updateTree(prevNode.right!, mid + 1, r, idx, val, newVersion);
    }

    const newSum = leftChild.val + rightChild.val;
    const parentNode = addNode({
      id,
      l,
      r,
      val: newSum,
      left: leftChild,
      right: rightChild,
      version: newVersion,
    });

    addWalkthroughStep(
      `Created version v${newVersion} parent node [${l}..${r}] with updated cached sum ${newSum}.`,
      id,
      "active",
    );

    return parentNode;
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
      addWalkthroughStep(
        `Query on v${node.version}: node [${l}..${r}] fully inside query [${ql}..${qr}]. Returning cached sum ${node.val}.`,
        node.id,
        "sorted",
      );
      return node.val;
    }

    const mid = Math.floor((l + r) / 2);
    addWalkthroughStep(
      `Query on v${node.version}: node [${l}..${r}] partially overlaps query [${ql}..${qr}]. Recursing left and right.`,
      node.id,
      "compare",
    );

    const leftSum = queryTree(node.left, l, mid, ql, qr);
    const rightSum = queryTree(node.right, mid + 1, r, ql, qr);
    const total = leftSum + rightSum;

    addWalkthroughStep(
      `Combined query responses on v${node.version} [${l}..${r}]: left (${leftSum}) + right (${rightSum}) = ${total}.`,
      node.id,
      "active",
    );

    return total;
  };

  for (const op of safeInput.operations) {
    if (op.type === "update" && op.index !== undefined && op.value !== undefined) {
      const parentVersion = op.version < versions.length ? op.version : versions.length - 1;
      const targetVersion = versions.length;

      addWalkthroughStep(
        `Starting version update from v${parentVersion}: updating index ${op.index} to value ${op.value} (creating v${targetVersion}).`,
        versions[parentVersion].id,
        "compare",
      );

      const newRoot = updateTree(
        versions[parentVersion],
        0,
        n - 1,
        op.index,
        op.value,
        targetVersion,
      );
      versions.push(newRoot);

      addWalkthroughStep(
        `Completed Version v${targetVersion} creation. New root ${newRoot.id} cached sum is ${newRoot.val}.`,
        newRoot.id,
        "visited",
      );
    } else if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      const qVersion = op.version < versions.length ? op.version : versions.length - 1;

      addWalkthroughStep(
        `Starting range query on Version v${qVersion} for range [${op.left}..${op.right}].`,
        versions[qVersion].id,
        "compare",
      );

      const qResult = queryTree(versions[qVersion], 0, n - 1, op.left, op.right);

      addWalkthroughStep(
        `Completed range query on Version v${qVersion} for [${op.left}..${op.right}], obtaining sum ${qResult}.`,
        versions[qVersion].id,
        "visited",
      );
    }
  }

  addWalkthroughStep(
    `All Persistent Segment Tree operations completed. Total versions created: ${versions.length}.`,
    versions[versions.length - 1].id,
    "sorted",
  );

  return steps;
};

const PERSISTENT_SEGMENT_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>Persistent Segment Tree</strong> maintains historical versions of range data structures via <strong>path copying</strong>, allocating <code>O(log N)</code> new nodes per update while preserving full read/write access to all previous versions.</p>",
  sections: [
    {
      heading: "Path Copying & Subtree Sharing",
      body: "<p>Only nodes along the update path are cloned into the new version; all unchanged branches are shared by reference in O(1) space.</p>",
    },
  ],
};

const PERSISTENT_SEGMENT_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    24: "Defines Node class with value and left/right child pointers.",
    38: "Path copies updated nodes while linking unchanged subtrees.",
  },
};

export const persistentSegmentTree: AlgorithmDefinition<PersistentSegmentTreeInput> = {
  id: "persistent-segment-tree",
  title: "Persistent Segment Tree (Versioned Range Queries)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>A <strong>Persistent Segment Tree</strong> maintains historical versions of range data structures via <strong>path copying</strong>, allocating <code>O(log N)</code> new nodes per update while preserving full read/write access to all previous versions.</p><h3>Input Parameters</h3><ul><li><code>array</code>: Initial numerical sequence.</li><li><code>operations</code>: Array of versioned updates and queries.</li></ul><h3>Output</h3><ul><li><code>int / Array</code>: Query answers across version states.</li></ul>",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
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
      scenario: "adversarial",
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
      scenario: "boundary",
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
      chapter: 28,
      section: "28.3 Data structures",
      label: "Competitive Programmer's Handbook, Ch 28",
    },
  ],
  defaultInput: DEFAULT_PERSISTENT_SEGMENT_TREE_INPUT,
  generateSteps: generatePersistentSegmentTreeSteps,
};

export default persistentSegmentTree;
