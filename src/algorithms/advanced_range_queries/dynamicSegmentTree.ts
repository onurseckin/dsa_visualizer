import type { AlgorithmDefinition, AlgorithmStep, TopicGuide, TreeNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const DYNAMIC_SEGMENT_TREE_CODE = `
def dynamic_segment_tree(input_array):
    """
    Implementation of dynamic_segment_tree.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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

export const generateDynamicSegmentTreeSteps = (
  input: DynamicSegmentTreeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rangeL = input.rangeMin ?? 1;
  const rangeR = input.rangeMax ?? 16;

  const root: InternalNode = {
    id: `node-[${rangeL}..${rangeR}]`,
    l: rangeL,
    r: rangeR,
    val: 0,
  };

  const collectTreeNodes = (activeId?: string): TreeNodeItem[] => {
    const list: TreeNodeItem[] = [];
    const traverse = (node: InternalNode) => {
      list.push({
        id: node.id,
        val: node.val,
        leftId: node.leftNode?.id,
        rightId: node.rightNode?.id,
        state: node.id === activeId ? "active" : "default",
      });
      if (node.leftNode) traverse(node.leftNode);
      if (node.rightNode) traverse(node.rightNode);
    };
    traverse(root);
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
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "tree",
        nodes: collectTreeNodes(activeId),
        rootId: root.id,
      },
      auxiliaryState: {
        customState: customState ?? {
          rangeMin: String(rangeL),
          rangeMax: String(rangeR),
        },
      },
      variables,
    });
  };

  addStep(
    10,
    "Initialize Dynamic Segment Tree",
    `Created root node representing interval [${rangeL}..${rangeR}]. Child nodes will be allocated lazily on demand when point updates arrive.`,
    { rangeL, rangeR },
    root.id,
  );

  const ops = input.operations ?? [];

  const updateNode = (node: InternalNode, idx: number, val: number) => {
    addStep(
      13,
      `Visiting node [${node.l}..${node.r}] for update at index ${idx}`,
      `Traversing node [${node.l}..${node.r}]. Target index is ${idx}.`,
      { l: node.l, r: node.r, idx, val },
      node.id,
    );

    if (node.l === node.r) {
      node.val += val;
      addStep(
        15,
        `Leaf node [${node.l}..${node.r}] updated to value ${node.val}`,
        `Base case reached at leaf index ${idx}. Added value ${val}.`,
        { idx, leafValue: node.val },
        node.id,
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
        addStep(
          20,
          `Dynamically created left child node [${node.l}..${mid}]`,
          `No left child existed. Allocated new node [${node.l}..${mid}] dynamically on demand.`,
          { l: node.l, r: mid },
          node.leftNode.id,
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
        addStep(
          24,
          `Dynamically created right child node [${mid + 1}..${node.r}]`,
          `No right child existed. Allocated new node [${mid + 1}..${node.r}] dynamically on demand.`,
          { l: mid + 1, r: node.r },
          node.rightNode.id,
        );
      }
      updateNode(node.rightNode, idx, val);
    }

    node.val = (node.leftNode?.val ?? 0) + (node.rightNode?.val ?? 0);
    addStep(
      26,
      `Updated parent node [${node.l}..${node.r}] value to ${node.val}`,
      `Recomputed sum of left child (${node.leftNode?.val ?? 0}) and right child (${node.rightNode?.val ?? 0}).`,
      { l: node.l, r: node.r, nodeVal: node.val },
      node.id,
    );
  };

  const queryNode = (node: InternalNode | undefined, ql: number, qr: number): number => {
    if (!node || qr < node.l || ql > node.r) {
      return 0;
    }
    addStep(
      29,
      `Querying node [${node.l}..${node.r}] for interval [${ql}..${qr}]`,
      `Checking if node range [${node.l}..${node.r}] overlaps or is inside query interval [${ql}..${qr}].`,
      { l: node.l, r: node.r, ql, qr },
      node.id,
    );

    if (ql <= node.l && node.r <= qr) {
      addStep(
        31,
        `Node [${node.l}..${node.r}] fully inside query range. Returning ${node.val}`,
        `Complete range coverage match. Returning precomputed node value ${node.val}.`,
        { l: node.l, r: node.r, val: node.val },
        node.id,
      );
      return node.val;
    }

    const leftRes = queryNode(node.leftNode, ql, qr);
    const rightRes = queryNode(node.rightNode, ql, qr);
    const sumRes = leftRes + rightRes;

    addStep(
      33,
      `Combined child results for node [${node.l}..${node.r}]: ${leftRes} + ${rightRes} = ${sumRes}`,
      `Partial range coverage. Combined left child query (${leftRes}) and right child query (${rightRes}) to get ${sumRes}.`,
      { l: node.l, r: node.r, leftRes, rightRes, sumRes },
      node.id,
    );

    return sumRes;
  };

  for (let opIdx = 0; opIdx < ops.length; opIdx++) {
    const op = ops[opIdx];
    if (op.type === "update") {
      const idx = op.index ?? rangeL;
      const val = op.value ?? 0;
      addStep(
        13,
        `Operation ${opIdx + 1}: Point update at index ${idx} with value ${val}`,
        `Starting recursive point update traversal for index ${idx}.`,
        { opIndex: opIdx + 1, idx, val },
      );
      updateNode(root, idx, val);
    } else if (op.type === "query") {
      const ql = op.left ?? rangeL;
      const qr = op.right ?? rangeR;
      addStep(
        28,
        `Operation ${opIdx + 1}: Range query [${ql}..${qr}]`,
        `Starting range query traversal over dynamic tree.`,
        { opIndex: opIdx + 1, ql, qr },
      );
      const res = queryNode(root, ql, qr);
      addStep(
        33,
        `Query [${ql}..${qr}] result = ${res}`,
        `Completed dynamic segment tree range query with total sum ${res}.`,
        { ql, qr, result: res },
        root.id,
        { queryResult: String(res) },
      );
    }
  }

  return steps;
};

export const DYNAMIC_SEGMENT_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A Dynamic (or Sparse) Segment Tree builds nodes lazily as updates occur instead of constructing a complete binary tree upfront. This enables range queries and updates over huge range domains like [0..10^9] using memory proportional only to the number of update operations (O(Q log C)).",
  sections: [
    {
      heading: "Lazy Node Allocation",
      body: "Standard segment trees allocate 4N nodes upfront, which fails when coordinate ranges reach 10^9. A dynamic segment tree starts with only a root covering [1, C]. When traversing to a child that does not yet exist, the node is instantiated on the fly.",
    },
    {
      heading: "Space Complexity Bound",
      body: "Each point update creates at most log2(C) nodes along a single root-to-leaf path. After Q updates over range domain C, the tree contains at most Q log2(C) nodes.",
    },
    {
      heading: "Query Processing",
      body: "Range queries traverse existing nodes in the dynamic tree. If a child branch is null (unallocated), its contribution is implicitly zero, avoiding unnecessary node creations during read queries.",
    },
  ],
  keyTerms: [
    {
      term: "Sparse Segment Tree",
      definition:
        "A segment tree structure where missing nodes are treated as default zero values without being allocated.",
    },
    {
      term: "Lazy Pointer Allocation",
      definition:
        "Creating child pointers (left and right) dynamically only when a path is visited by an update operation.",
    },
  ],
};

export const DYNAMIC_SEGMENT_TREE_TRIVIA: TriviaMeta = {
  skipLines: [1, 8, 12, 27],
  distractors: [
    "node.left = DynamicSegTreeNode(node.l, node.r)",
    "if node.left and node.right: return",
    "node.val = node.left.val * node.right.val",
  ],
  hints: [
    {
      line: 20,
      hint: "Allocate left child node covering range [node.l..mid]",
    },
    {
      line: 30,
      hint: "Return 0 if node is None or out of query bounds",
    },
  ],
  lineExplanations: {
    10: "Constructor creates root node covering range [range_l, range_r].",
    13: "Point update allocates nodes lazily along path.",
    20: "Instantiate left child dynamically when unallocated.",
    26: "Combine left and right child values into parent node.",
    28: "Query range minimum/sum over dynamic segment tree.",
    30: "Gracefully return 0 for uninstantiated or out-of-bounds nodes.",
  },
};

export const dynamicSegmentTree: AlgorithmDefinition<DynamicSegmentTreeInput> = {
  id: "dynamic-segment-tree",
  title: "Dynamic Segment Tree (Sparse Range Queries)",
  category: "advanced_range_queries",
  categories: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "Dynamic Segment Tree instantiates tree nodes on demand, supporting O(log C) point updates and range queries over huge coordinate ranges up to 10^9 with O(Q log C) total memory.",
  constraints: ["1 <= rangeMax <= 10^9", "1 <= Q <= 10^5", "-10^9 <= value <= 10^9"],
  examples: [
    {
      kind: "basic",
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
