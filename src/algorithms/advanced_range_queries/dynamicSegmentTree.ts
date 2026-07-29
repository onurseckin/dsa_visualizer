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

export interface DynamicSegOp {
  type: "update" | "query";
  index?: number;
  value?: number;
  left?: number;
  right?: number;
}

export interface DynamicSegmentTreeInput {
  rangeMin: number;
  rangeMax: number;
  operations: DynamicSegOp[];
}

export const DYNAMIC_SEGMENT_TREE_CODE = `class Node:
    def __init__(self, l: int, r: int):
        self.l = l
        self.r = r
        self.val = 0
        self.left = None
        self.right = None

class DynamicSegmentTree:
    def __init__(self, l: int, r: int):
        self.root = Node(l, r)

    def update(self, node: Node, idx: int, val: int):
        if node.l == node.r:
            node.val += val
            return
        mid = (node.l + node.r) // 2
        if idx <= mid:
            if not node.left:
                node.left = Node(node.l, mid)
            self.update(node.left, idx, val)
        else:
            if not node.right:
                node.right = Node(mid + 1, node.r)
            self.update(node.right, idx, val)
        node.val = (node.left.val if node.left else 0) + (node.right.val if node.right else 0)

    def query(self, node: Node, ql: int, qr: int) -> int:
        if not node or qr < node.l or ql > node.r:
            return 0
        if ql <= node.l and node.r <= qr:
            return node.val
        return self.query(node.left, ql, qr) + self.query(node.right, ql, qr)`;

export const DEFAULT_DYNAMIC_SEGMENT_TREE_INPUT: DynamicSegmentTreeInput = {
  rangeMin: 1,
  rangeMax: 16,
  operations: [
    { type: "update", index: 3, value: 5 },
    { type: "update", index: 12, value: 8 },
    { type: "query", left: 1, right: 10 },
  ],
};

interface InternalNode {
  id: string;
  l: number;
  r: number;
  val: number;
  leftNode?: InternalNode;
  rightNode?: InternalNode;
}

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Standard Segment Trees pre-allocate a fixed array of 4N nodes, which becomes impossible when the coordinate range C is huge (e.g. C = 10^9).",
    primarySnapshot: {
      kind: "array",
      name: "fixedTreeArray",
      elements: [
        { id: "e1", value: 0, label: "node 1 [1..10^9]", state: "default" },
        { id: "e2", value: 0, label: "node 2 [1..5*10^8]", state: "default" },
        { id: "e3", value: 0, label: "node 3 [5*10^8+1..10^9]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Pre-allocating 4 billion nodes in memory leads to catastrophic Out-Of-Memory crashes even if only a few array coordinates are ever modified.",
    primarySnapshot: {
      kind: "array",
      name: "fixedTreeArray",
      elements: [
        { id: "e1", value: 0, label: "4 * 10^9 nodes", state: "active" },
        { id: "e2", value: 0, label: "OOM Crash", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Coordinate Compression maps values to contiguous indices, but requires knowing all query points offline ahead of time.",
    primarySnapshot: {
      kind: "array",
      name: "compressedIndices",
      elements: [
        { id: "c1", value: 3, label: "val=3 -> idx=0", state: "visited" },
        { id: "c2", value: 12, label: "val=12 -> idx=1", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "The Dynamic Segment Tree solves this by instantiating nodes lazily on demand only when point updates actually touch specific coordinates.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [{ id: "n1", val: 0, state: "default" }],
    },
  },
  {
    narrative:
      "At initialization, only a single root node covering the entire coordinate domain [1..C] is allocated.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [{ id: "n1", val: 0, state: "active" }],
    },
  },
  {
    narrative:
      "When updating a target index K, child pointers (left and right) are instantiated dynamically if they do not yet exist.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 0, leftId: "n2", state: "visited" },
        { id: "n2", val: 0, state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Unvisited subtrees remain unallocated (None), taking zero memory cells and preserving a compact sparse tree structure.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 5, leftId: "n2", state: "default" },
        { id: "n2", val: 5, leftId: "n3", state: "default" },
        { id: "n3", val: 5, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Each point update creates at most log2(C) new nodes along its single root-to-leaf branch, executing in O(log C) time.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 13, leftId: "n2", rightId: "n4", state: "visited" },
        { id: "n2", val: 5, leftId: "n3", state: "visited" },
        { id: "n3", val: 5, state: "visited" },
        { id: "n4", val: 8, rightId: "n5", state: "swap" },
        { id: "n5", val: 8, state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Range queries walk the dynamic tree and prune missing subtrees instantly, returning default identity 0 in O(log C) time without allocating new nodes.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 13, leftId: "n2", rightId: "n4", state: "compare" },
        { id: "n2", val: 5, leftId: "n3", state: "active" },
        { id: "n3", val: 5, state: "visited" },
        { id: "n4", val: 8, rightId: "n5", state: "default" },
        { id: "n5", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Across Q operations on domain C = 10^9, total memory is capped at O(Q log C) nodes instead of O(C).",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 13, leftId: "n2", rightId: "n4", state: "sorted" },
        { id: "n2", val: 5, leftId: "n3", state: "sorted" },
        { id: "n3", val: 5, state: "sorted" },
        { id: "n4", val: 8, rightId: "n5", state: "sorted" },
        { id: "n5", val: 8, state: "sorted" },
      ],
    },
  },
];

export const generateDynamicSegmentTreeSteps = (
  input: DynamicSegmentTreeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

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
    rangeMin: input?.rangeMin ?? DEFAULT_DYNAMIC_SEGMENT_TREE_INPUT.rangeMin,
    rangeMax: input?.rangeMax ?? DEFAULT_DYNAMIC_SEGMENT_TREE_INPUT.rangeMax,
    operations: Array.isArray(input?.operations)
      ? input.operations
      : DEFAULT_DYNAMIC_SEGMENT_TREE_INPUT.operations,
  };
  const rangeL = safeInput.rangeMin;
  const rangeR = safeInput.rangeMax;
  const ops = safeInput.operations;

  const root: InternalNode = {
    id: `node-[${rangeL}..${rangeR}]`,
    l: rangeL,
    r: rangeR,
    val: 0,
  };

  const collectTreeNodes = (
    activeId?: string,
    activeState: ElementState = "active",
  ): TreeNodeItem[] => {
    const list: TreeNodeItem[] = [];
    const traverse = (node: InternalNode) => {
      list.push({
        id: node.id,
        val: node.val,
        leftId: node.leftNode?.id,
        rightId: node.rightNode?.id,
        state: node.id === activeId ? activeState : "default",
      });
      if (node.leftNode) traverse(node.leftNode);
      if (node.rightNode) traverse(node.rightNode);
    };
    traverse(root);
    return list;
  };

  const addWalkthroughStep = (
    narrative: string,
    activeId?: string,
    activeState: ElementState = "active",
  ) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot: {
          kind: "tree",
          name: "dynamicSegmentTree",
          nodes: collectTreeNodes(activeId, activeState),
          rootId: root.id,
        },
      }),
    );
  };

  addWalkthroughStep(
    `Initializing Dynamic Segment Tree root node covering coordinate range [${rangeL}..${rangeR}].`,
    root.id,
    "active",
  );

  const updateNode = (node: InternalNode, idx: number, val: number) => {
    if (node.l === node.r) {
      node.val += val;
      addWalkthroughStep(
        `Reached leaf node covering index ${idx}. Added value increment +${val} (new leaf sum = ${node.val}).`,
        node.id,
        "swap",
      );
      return;
    }

    const mid = Math.floor((node.l + node.r) / 2);

    if (idx <= mid) {
      if (!node.leftNode) {
        node.leftNode = {
          id: `node-[${node.l}..${mid}]`,
          l: node.l,
          r: mid,
          val: 0,
        };
        addWalkthroughStep(
          `Lazily allocated new left child node covering range [${node.l}..${mid}] on demand.`,
          node.leftNode.id,
          "compare",
        );
      }
      updateNode(node.leftNode, idx, val);
    } else {
      if (!node.rightNode) {
        node.rightNode = {
          id: `node-[${mid + 1}..${node.r}]`,
          l: mid + 1,
          r: node.r,
          val: 0,
        };
        addWalkthroughStep(
          `Lazily allocated new right child node covering range [${mid + 1}..${node.r}] on demand.`,
          node.rightNode.id,
          "compare",
        );
      }
      updateNode(node.rightNode, idx, val);
    }

    node.val = (node.leftNode?.val ?? 0) + (node.rightNode?.val ?? 0);
    addWalkthroughStep(
      `Updated node [${node.l}..${node.r}] cached sum to ${node.val} after child update.`,
      node.id,
      "active",
    );
  };

  const queryNode = (node: InternalNode | undefined, ql: number, qr: number): number => {
    if (!node || qr < node.l || ql > node.r) {
      return 0;
    }

    if (ql <= node.l && node.r <= qr) {
      addWalkthroughStep(
        `Node [${node.l}..${node.r}] is fully inside query range [${ql}..${qr}]. Returning cached value ${node.val}.`,
        node.id,
        "sorted",
      );
      return node.val;
    }

    addWalkthroughStep(
      `Node [${node.l}..${node.r}] partially overlaps query range [${ql}..${qr}]. Recursing down populated subtrees.`,
      node.id,
      "active",
    );

    const leftRes = queryNode(node.leftNode, ql, qr);
    const rightRes = queryNode(node.rightNode, ql, qr);
    const total = leftRes + rightRes;

    addWalkthroughStep(
      `Combined query responses at node [${node.l}..${node.r}]: left (${leftRes}) + right (${rightRes}) = ${total}.`,
      node.id,
      "swap",
    );

    return total;
  };

  for (const op of ops) {
    if (op.type === "update" && op.index !== undefined && op.value !== undefined) {
      addWalkthroughStep(
        `Executing dynamic point update at index ${op.index} with value +${op.value}.`,
        root.id,
        "compare",
      );

      updateNode(root, op.index, op.value);

      addWalkthroughStep(
        `Completed point update at index ${op.index}. The updated root sum is now ${root.val}.`,
        root.id,
        "visited",
      );
    } else if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      addWalkthroughStep(
        `Executing range sum query for interval [${op.left}..${op.right}].`,
        root.id,
        "compare",
      );

      const res = queryNode(root, op.left, op.right);

      addWalkthroughStep(
        `Completed range sum query for [${op.left}..${op.right}], obtaining sum ${res}.`,
        root.id,
        "visited",
      );
    }
  }

  const finalNodes = collectTreeNodes().map((n) => ({ ...n, state: "sorted" as const }));
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `All operations completed on the Dynamic Segment Tree. Total nodes allocated: ${finalNodes.length}.`,
      primarySnapshot: {
        kind: "tree",
        name: "dynamicSegmentTree",
        nodes: finalNodes,
        rootId: root.id,
      },
    }),
  );

  return steps;
};

const DYNAMIC_SEGMENT_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>Dynamic Segment Tree</strong> supports <code>O(log C)</code> point updates and range queries over huge coordinate ranges (up to <code>10⁹</code>) by allocating tree nodes lazily on demand. This approach optimizes memory usage to <code>O(Q log C)</code> by creating only the nodes required to represent the sparse set of updated indices.</p>",
  sections: [
    {
      heading: "Lazy Node Allocation",
      body: "<p>Instead of pre-allocating an entire <code>4C</code> array, child pointers start as <code>None</code> and are instantiated only when accessed by an update.</p>",
    },
  ],
};

const DYNAMIC_SEGMENT_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    26: "Defines DynamicSegmentTree class.",
    36: "Lazily instantiates left child node if None.",
  },
};

export const dynamicSegmentTree: AlgorithmDefinition<DynamicSegmentTreeInput> = {
  id: "dynamic-segment-tree",
  title: "Dynamic Segment Tree (Sparse Range Queries)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>A <strong>Dynamic Segment Tree</strong> supports <code>O(log C)</code> point updates and range queries over huge coordinate ranges (up to <code>10⁹</code>) by allocating tree nodes lazily on demand. This approach optimizes memory usage to <code>O(Q log C)</code> by creating only the nodes required to represent the sparse set of updated indices.</p><h3>Input Parameters</h3><ul><li><code>rangeMin</code>: Minimum coordinate bound.</li><li><code>rangeMax</code>: Maximum coordinate bound.</li><li><code>operations</code>: Array of point updates and range queries.</li></ul><h3>Output</h3><ul><li><code>int / Array</code>: Answers to range queries and sparse tree node state.</li></ul>",
  constraints: ["1 <= rangeMax <= 10^9", "1 <= Q <= 10^5", "-10^9 <= value <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Basic Example",
      inputDisplay: "range = [1..16], ops = [update(3, 5), update(12, 8), query(1, 10)]",
      outputDisplay: "Query [1..10]: 5",
      input: {
        rangeMin: 1,
        rangeMax: 16,
        operations: [
          { type: "update", index: 3, value: 5 },
          { type: "update", index: 12, value: 8 },
          { type: "query", left: 1, right: 10 },
        ],
      },
      output: "Query [1..10]: 5",
      explanation:
        "Nodes covering index 3 and 12 are created lazily; query [1..10] picks up index 3 (value 5).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Complex Edge Case",
      inputDisplay: "range = [1..1000000], ops = [update(500000, 100), query(1, 1000000)]",
      outputDisplay: "Query [1..1000000]: 100",
      input: {
        rangeMin: 1,
        rangeMax: 1000000,
        operations: [
          { type: "update", index: 500000, value: 100 },
          { type: "query", left: 1, right: 1000000 },
        ],
      },
      output: "Query [1..1000000]: 100",
      explanation: "Massive coordinate range domain 10^6 creates only log2(10^6) ~ 20 nodes.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Failing / Boundary Case",
      inputDisplay: "range = [1..1], ops = [update(1, 42), query(1, 1)]",
      outputDisplay: "Query [1..1]: 42",
      input: {
        rangeMin: 1,
        rangeMax: 1,
        operations: [
          { type: "update", index: 1, value: 42 },
          { type: "query", left: 1, right: 1 },
        ],
      },
      output: "Query [1..1]: 42",
      explanation: "Single element domain rangeMax=1; root is directly the leaf node.",
    },
  ],
  code: DYNAMIC_SEGMENT_TREE_CODE,
  timeComplexity: {
    best: "O(log C)",
    average: "O(log C)",
    worst: "O(log C)",
  },
  spaceComplexity: "O(Q log C)",
  complexityAnalysis: {
    time: "Both update and query descend down at most log2(C) levels of the dynamic segment tree, taking O(log C) time.",
    space:
      "Each update adds at most log2(C) nodes, taking O(Q log C) total space across Q operations.",
  },
  topicGuide: DYNAMIC_SEGMENT_TREE_TOPIC_GUIDE,
  trivia: DYNAMIC_SEGMENT_TREE_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.3 Segment tree / Dynamic segment tree",
      label: "Competitive Programmer's Handbook, Ch 9",
    },
  ],
  defaultInput: DEFAULT_DYNAMIC_SEGMENT_TREE_INPUT,
  generateSteps: generateDynamicSegmentTreeSteps,
};

export default dynamicSegmentTree;
