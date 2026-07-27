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
    return query(node.left, l, mid, ql, qr) + query(node.right, mid + 1, r, ql, qr)`;

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

  const collectAllNodes = (activeId?: string, extraRoot?: PNode): TreeNodeItem[] => {
    const list: TreeNodeItem[] = [];
    const visited = new Set<string>();

    const traverse = (node: PNode) => {
      if (!node || visited.has(node.id)) return;
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
    if (extraRoot) {
      traverse(extraRoot);
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
    extraRoot?: PNode,
  ) => {
    const activeRoot = versions.length > 0 ? versions[versions.length - 1].id : extraRoot?.id;
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "tree",
        nodes: collectAllNodes(activeId, extraRoot),
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
    addStep(28, "Array is empty", "No tree built for empty array.", { n: 0 });
    return steps;
  }

  const buildTree = (l: number, r: number, v: number): PNode => {
    const id = `pnode-v${v}-${nodeCounter++}`;
    if (l === r) {
      const leafNode = { id, l, r, val: arr[l], version: v };
      addStep(
        9,
        `Build leaf node [${l}..${r}] = ${arr[l]} for v${v}`,
        `Created base leaf for index ${l} holding value ${arr[l]}.`,
        { l, r, val: arr[l], version: v },
        id,
        undefined,
        leafNode,
      );
      return leafNode;
    }
    const mid = Math.floor((l + r) / 2);
    const leftChild = buildTree(l, mid, v);
    const rightChild = buildTree(mid + 1, r, v);
    const nodeVal = leftChild.val + rightChild.val;
    const internalNode = {
      id,
      l,
      r,
      val: nodeVal,
      left: leftChild,
      right: rightChild,
      version: v,
    };
    addStep(
      13,
      `Build internal node [${l}..${r}] = ${nodeVal} for v${v}`,
      `Combined left child (${leftChild.val}) and right child (${rightChild.val}).`,
      { l, r, val: nodeVal, version: v },
      id,
      undefined,
      internalNode,
    );
    return internalNode;
  };

  const rootV0 = buildTree(0, n - 1, 0);
  versions.push(rootV0);

  addStep(
    7,
    "Initialize Persistent Segment Tree v0",
    `Building version 0 of Segment Tree over array [${arr.join(", ")}].`,
    { n },
    rootV0.id,
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
      addStep(
        20,
        `Path clone left: descending into [${l}..${mid}] for v${v}`,
        `Target index ${idx} is in left half. Cloning left path and sharing previous right child.`,
        { v, l, mid, idx },
        id,
      );
      newLeft = updateTree(prev.left!, l, mid, idx, val, v);
    } else {
      addStep(
        24,
        `Path clone right: descending into [${mid + 1}..${r}] for v${v}`,
        `Target index ${idx} is in right half. Cloning right path and sharing previous left child.`,
        { v, mid: mid + 1, r, idx },
        id,
      );
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
      25,
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
    addStep(
      27,
      `Querying node [${l}..${r}] on v${node.version} for interval [${ql}..${qr}]`,
      `Traversing node [${l}..${r}] of version ${node.version}.`,
      { l, r, ql, qr, v: node.version },
      node.id,
    );
    if (ql <= l && r <= qr) {
      addStep(
        31,
        `Node [${l}..${r}] fully inside query range. Returning ${node.val}`,
        `Exact match. Returning version v${node.version} precomputed node value ${node.val}.`,
        { l, r, val: node.val, v: node.version },
        node.id,
      );
      return node.val;
    }
    const mid = Math.floor((l + r) / 2);
    const leftSum = queryTree(node.left, l, mid, ql, qr);
    const rightSum = queryTree(node.right, mid + 1, r, ql, qr);
    const totalSum = leftSum + rightSum;
    addStep(
      33,
      `Combined query results for node [${l}..${r}]: ${leftSum} + ${rightSum} = ${totalSum}`,
      `Combined child queries for range [${ql}..${qr}].`,
      { l, r, leftSum, rightSum, totalSum },
      node.id,
    );
    return totalSum;
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
        25,
        `Version v${newV} generated (root val = ${newRoot.val})`,
        `Successfully generated persistent version ${newV}. Version ${targetVersion} remains completely unmodified.`,
        { newVersion: newV, rootVal: newRoot.val },
        newRoot.id,
      );
    } else if (op.type === "query") {
      const ql = Math.max(0, Math.min(op.left ?? 0, n - 1));
      const qr = Math.max(ql, Math.min(op.right ?? n - 1, n - 1));

      addStep(
        27,
        `Query Range [${ql}..${qr}] on Tree Version v${targetVersion}`,
        `Querying version ${targetVersion} without affecting any other tree version.`,
        { targetVersion, ql, qr },
        rootTarget.id,
      );

      const res = queryTree(rootTarget, 0, n - 1, ql, qr);
      addStep(
        33,
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
    "A **Persistent Segment Tree** preserves all historical versions of range data structures over time. By utilizing **path copying** (cloning only the $O(\\log N)$ nodes on the search path from root to leaf while sharing unmodified subtrees with prior versions), every historical version remains permanently valid and queryable in $O(\\log N)$ time per operation.",
  sections: [
    {
      heading: "1. The Path Copying Technique",
      body: "When updating a single element at index $\\text{idx}$ in version $v$, only the $O(\\log N)$ ancestors on the path from root to leaf are modified:\n\n- Rather than overwriting existing nodes, we allocate new node instances for the path in version $v+1$.\n- The new ancestor nodes link to the newly created child along the update path and share existing, unmodified child pointers from version $v$.\n- Space cost per update is strictly bounded by $O(\\log N)$ new nodes.",
    },
    {
      heading: "2. Version Roots Array Architecture",
      body: "Historical versions are tracked via a root pointer array:\n\n$$\\text{roots} = [\\text{root}_0, \\, \\text{root}_1, \\, \\dots, \\, \\text{root}_K]$$\n\n- **Initial Build ($v=0$)**: Constructs full tree of $N$ elements in $O(N)$ space.\n- **Point Update ($v+1$)**: Creates a new root $\\text{root}_{v+1}$ with $\\approx \\log_2 N$ cloned nodes.\n- **Versioned Query**: Querying range $[L \\dots R]$ on version $v$ executes `query(roots[v], L, R)` in $O(\\log N)$ time.",
    },
    {
      heading: "3. Range K-th Smallest Element (Chairman Tree)",
      body: "Persistent segment trees solve the famous Range K-th Smallest Query offline:\n\n1. Insert values $1 \\dots N$ sequentially into persistent frequency trees, where version $i$ represents array prefix $[0 \\dots i]$.\n2. Querying sub-interval $[L \\dots R]$ evaluates the frequency difference $\\text{roots}[R] - \\text{roots}[L-1]$.\n3. Binary searching down the difference tree locates the exact $k$-th smallest element in $O(\\log N)$ time.",
    },
    {
      heading: "4. Trade-off Matrix: Persistent Segment Tree vs Standard Segment Tree",
      body: "| Feature | Persistent Segment Tree | Standard Segment Tree |\n| :--- | :--- | :--- |\n| **History Preservation** | Fully Persistent (All past states available) | Single State (Overwritten in-place) |\n| **Update Space** | $O(\\log N)$ new nodes per update | $O(1)$ in-place modification |\n| **Total Space** | $O(N + Q \\log N)$ across $Q$ updates | $O(N)$ fixed space |\n| **Pointers** | Explicit `left`/`right` object references | Flat Heap Array ($2v$, $2v+1$) |",
    },
    {
      heading: "5. Interview Pitfalls & Garbage Collection",
      body: "- **Explicit Pointers Required**: Flat array indexing ($2v$, $2v+1$) cannot be used because versions share subtrees dynamically.\n- **Garbage Collection Safety**: Root pointers in `roots` array must remain referenced to prevent memory sweeps of historical versions.",
    },
  ],
  keyTerms: [
    {
      term: "Path Copying",
      definition:
        "Allocating new nodes strictly along the updated root-to-leaf path while sharing unmodified subtrees with prior versions.",
    },
    {
      term: "Version Roots Array",
      definition: "An array of pointers holding the root node reference for each historical version of the segment tree.",
    },
    {
      term: "Fully Persistent",
      definition:
        "A data structure property allowing both read queries and update writes on any arbitrary historical version.",
    },
    {
      term: "Range K-th Smallest Query",
      definition:
        "Finding the $k$-th smallest element in subarray $[L \\dots R]$ using persistent frequency segment trees.",
    },
  ],
};

export const PERSISTENT_SEGMENT_TREE_TRIVIA: TriviaMeta = {
  skipLines: [6, 14, 26],
  distractors: [
    "return Node(prev.val + val, prev.left, prev.right)",
    "prev.left = new_left",
    "def query(node, l, r, ql, qr): return node.val",
  ],
  hints: [
    {
      line: 20,
      hint: "Create a new node pointing to new_left and prev.right",
    },
    {
      line: 30,
      hint: "Return node.val when node range is fully contained in query range",
    },
  ],
  lineExplanations: {
    1: "Defines Node class for persistent segment tree with explicit left and right pointers.",
    2: "Node constructor taking value val and optional child node references.",
    3: "Stores aggregate range value.",
    4: "Stores reference to left child node.",
    5: "Stores reference to right child node.",
    6: "Blank line separating Node definition.",
    7: "Defines build(arr, l, r) constructing initial version 0 of tree.",
    8: "Checks for base case leaf node (l == r).",
    9: "Returns leaf Node containing array value arr[l].",
    10: "Calculates interval midpoint: mid = (l + r) // 2.",
    11: "Recursively builds left child for interval [l..mid].",
    12: "Recursively builds right child for interval [mid+1..r].",
    13: "Returns parent Node combining left and right child values.",
    14: "Blank line separating build function.",
    15: "Defines update(prev, l, r, idx, val) creating a new persistent version via path copying.",
    16: "Checks for base case leaf update (l == r).",
    17: "Returns new leaf Node holding updated value val.",
    18: "Calculates interval midpoint: mid = (l + r) // 2.",
    19: "Checks if target update index falls in left half (idx <= mid).",
    20: "Recursively updates left child while preserving prev.right pointer.",
    21: "Shares unmodified right child pointer from previous version prev.",
    22: "Else branch when target index falls in right half (idx > mid).",
    23: "Shares unmodified left child pointer from previous version prev.",
    24: "Recursively updates right child while preserving prev.left pointer.",
    25: "Returns new parent Node combining new child with shared child.",
    26: "Blank line separating update function.",
    27: "Defines query(node, l, r, ql, qr) querying range sum on a specific version root.",
    28: "Base case returning 0 for missing node or non-overlapping query bounds.",
    29: "Helper line return statement.",
    30: "Checks if node interval [l..r] is completely inside query range [ql..qr].",
    31: "Returns cached node value directly for complete range match.",
    32: "Calculates interval midpoint: mid = (l + r) // 2.",
    33: "Recursively queries left and right subtrees and returns their sum.",
  },
};

export const persistentSegmentTree: AlgorithmDefinition<PersistentSegmentTreeInput> = {
  id: "persistent-segment-tree",
  title: "Persistent Segment Tree (Versioned Range Queries)",
  category: "advanced_range_queries",
  categories: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "A **Persistent Segment Tree** maintains historical versions of range data structures via **path copying**, allocating $O(\\log N)$ new nodes per update while preserving full read/write access to all previous versions.",
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
