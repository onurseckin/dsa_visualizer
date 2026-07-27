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

export const DYNAMIC_SEGMENT_TREE_CODE = `class Node:
    def __init__(self, l: int, r: int):
        self.l = l
        self.r = r
        self.val = 0
        self.left = None
        self.right = None

class DynamicSegmentTree:
    """
    Dynamic Segment Tree allocating nodes lazily on demand for range [l, r].
    """
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
    14,
    "Initialize Dynamic Segment Tree",
    `Created root node representing interval [${rangeL}..${rangeR}]. Child nodes will be allocated lazily on demand when point updates arrive.`,
    { rangeL, rangeR },
    root.id,
  );

  const ops = input.operations ?? [];

  const updateNode = (node: InternalNode, idx: number, val: number) => {
    addStep(
      16,
      `Visiting node [${node.l}..${node.r}] for update at index ${idx}`,
      `Traversing node [${node.l}..${node.r}]. Target index is ${idx}.`,
      { l: node.l, r: node.r, idx, val },
      node.id,
    );

    if (node.l === node.r) {
      node.val += val;
      addStep(
        18,
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
          23,
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
          27,
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
      29,
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
      32,
      `Querying node [${node.l}..${node.r}] for interval [${ql}..${qr}]`,
      `Checking if node range [${node.l}..${node.r}] overlaps or is inside query interval [${ql}..${qr}].`,
      { l: node.l, r: node.r, ql, qr },
      node.id,
    );

    if (ql <= node.l && node.r <= qr) {
      addStep(
        35,
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
      36,
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
        16,
        `Operation ${opIdx + 1}: Point update at index ${idx} with value ${val}`,
        `Starting recursive point update traversal for index ${idx}.`,
        { opIndex: opIdx + 1, idx, val },
      );
      updateNode(root, idx, val);
    } else if (op.type === "query") {
      const ql = op.left ?? rangeL;
      const qr = op.right ?? rangeR;
      addStep(
        31,
        `Operation ${opIdx + 1}: Range query [${ql}..${qr}]`,
        `Starting range query traversal over dynamic tree.`,
        { opIndex: opIdx + 1, ql, qr },
      );
      const res = queryNode(root, ql, qr);
      addStep(
        36,
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
    "A **Dynamic Segment Tree** (also known as a **Sparse Segment Tree**) constructs tree nodes **lazily on demand** as point updates occur, rather than allocating a full tree up front. This enables range queries and updates over massive coordinate domains (e.g. $[1 \\dots 10^9]$) using memory proportional strictly to the number of update operations: $O(Q \\log C)$ total space.",
  sections: [
    {
      heading: "1. Lazy Pointer Allocation Architecture",
      body: "Standard segment trees allocate $4N$ nodes upfront, which fails when coordinate ranges reach $10^9$.\n\n- Starts with a single root covering full domain $[1 \\dots C]$.\n- When descending toward target index $i$, if a child pointer is `null`, a new node covering half interval $[\\text{l} \\dots \\text{mid}]$ or $[\\text{mid}+1 \\dots \\text{r}]$ is instantiated dynamically on the fly.",
    },
    {
      heading: "2. Logarithmic Space Bound: $O(Q \\log C)$",
      body: "Each point update creates at most $\\lceil \\log_2 C \\rceil$ nodes along its root-to-leaf path:\n\n$$\\text{Total Memory} = O(Q \\log_2 C)$$\n\nFor $Q = 10^5$ operations on domain $C = 10^9$, $\\log_2(10^9) \\approx 30$ levels, allocating only $\\approx 3 \\times 10^6$ nodes instead of $4 \\times 10^9$.",
    },
    {
      heading: "3. Implicit Zero Queries",
      body: "Range queries traverse existing nodes in the dynamic tree. If a child pointer is `null` (unallocated), its contribution is implicitly $0$. Query operations never instantiate missing nodes, preserving space efficiency during read-only passes.",
    },
    {
      heading: "4. Trade-off Matrix: Dynamic Segment Tree vs Coordinate Compression",
      body: "| Feature | Dynamic Segment Tree | Coordinate Compression |\n| :--- | :--- | :--- |\n| **Processing Mode** | Pure Online | Offline Only (requires all coordinates up front) |\n| **Domain Range** | Up to $10^9$ (32-bit int) | Mapped to $[1 \\dots N]$ |\n| **Query Complexity** | $O(\\log C)$ | $O(\\log N)$ |\n| **Space Complexity** | $O(Q \\log C)$ | $O(N)$ |",
    },
    {
      heading: "5. Implementation Details & Pointer Safety",
      body: "- **Pointer Traversal**: Uses explicit `node.left` and `node.right` object pointers instead of fixed array indices $2v$ and $2v+1$.\n- **Midpoint Overflow Protection**: Compute midpoint as `mid = (node.l + node.r) // 2` carefully when coordinates extend into large integer ranges.",
    },
  ],
  keyTerms: [
    {
      term: "Sparse Segment Tree",
      definition:
        "A segment tree structure where missing subtrees are treated as default zero values without allocating memory.",
    },
    {
      term: "Lazy Pointer Allocation",
      definition:
        "Creating child pointers (`left` and `right`) dynamically on demand only when visited by an update operation.",
    },
    {
      term: "Online Algorithm",
      definition:
        "An algorithm that processes input requests sequentially as they arrive without requiring pre-sorted inputs.",
    },
    {
      term: "Coordinate Domain",
      definition:
        "The total numerical interval $[\\text{rangeMin} \\dots \\text{rangeMax}]$ over which operations take place.",
    },
  ],
};

export const DYNAMIC_SEGMENT_TREE_TRIVIA: TriviaMeta = {
  skipLines: [8, 15, 30],
  distractors: [
    "node.left = Node(node.l, node.r)",
    "if node.left and node.right: return",
    "node.val = node.left.val * node.right.val",
  ],
  hints: [
    {
      line: 23,
      hint: "Allocate left child node covering range [node.l..mid]",
    },
    {
      line: 33,
      hint: "Return 0 if node is None or out of query bounds",
    },
  ],
  lineExplanations: {
    1: "Defines Node class representing a dynamic segment tree node.",
    2: "Node constructor taking interval bounds l and r.",
    3: "Stores lower interval boundary l.",
    4: "Stores upper interval boundary r.",
    5: "Initializes node value aggregate to 0.",
    6: "Initializes left child pointer to None.",
    7: "Initializes right child pointer to None.",
    8: "Blank line separating Node definition.",
    9: "Defines DynamicSegmentTree wrapper class.",
    10: "Docstring describing dynamic on-demand node allocation.",
    11: "Docstring continuation.",
    12: "Docstring continuation.",
    13: "Constructor initializing root node over range [l, r].",
    14: "Instantiates root node covering full domain interval [l, r].",
    15: "Blank line separating constructor.",
    16: "Defines point update method recursing down dynamic tree.",
    17: "Checks if leaf node is reached (node.l == node.r).",
    18: "Adds value increment to leaf node value.",
    19: "Returns from leaf update.",
    20: "Calculates midpoint of interval: mid = (node.l + node.r) // 2.",
    21: "Checks if target index falls in left half (idx <= mid).",
    22: "Checks if left child is unallocated (not node.left).",
    23: "Lazily instantiates new left child Node covering range [node.l..mid].",
    24: "Recurses into left child to complete point update.",
    25: "Else branch when target index falls in right half (idx > mid).",
    26: "Checks if right child is unallocated (not node.right).",
    27: "Lazily instantiates new right child Node covering range [mid + 1..node.r].",
    28: "Recurses into right child to complete point update.",
    29: "Recomputes parent node value by combining left and right child values.",
    30: "Blank line separating update method.",
    31: "Defines range query method returning sum over interval [ql..qr].",
    32: "Checks for empty node or disjoint query interval bounds.",
    33: "Returns default identity value 0 for non-overlapping or missing subtrees.",
    34: "Checks if node interval is completely inside query interval [ql..qr].",
    35: "Returns cached node value directly for complete range match.",
    36: "Recursively queries left and right subtrees and returns their sum.",
  },
};

export const dynamicSegmentTree: AlgorithmDefinition<DynamicSegmentTreeInput> = {
  id: "dynamic-segment-tree",
  title: "Dynamic Segment Tree (Sparse Range Queries)",
  category: "advanced_range_queries",
  categories: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "A **Dynamic Segment Tree** supports $O(\\log C)$ point updates and range queries over huge coordinate ranges (up to $10^9$) by allocating tree nodes lazily on demand. This approach optimizes memory usage to $O(Q \\log C)$ by creating only the nodes required to represent the sparse set of updated indices.",
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
