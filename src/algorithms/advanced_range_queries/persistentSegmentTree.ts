import type {
  AlgorithmDefinition,
  AlgorithmStep,
  DisplayValue,
  TopicGuide,
  TreeNodeItem,
} from "../../types/dsa";
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
  const allCreatedNodes: PNode[] = [];

  const addNode = (node: PNode): PNode => {
    allCreatedNodes.push(node);
    return node;
  };

  const collectAllNodes = (activeId?: string, highlightedIds?: Set<string>): TreeNodeItem[] => {
    return allCreatedNodes.map((node) => {
      let state: TreeNodeItem["state"] = "default";
      if (node.id === activeId) {
        state = "active";
      } else if (highlightedIds?.has(node.id)) {
        state = "highlighted";
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

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, DisplayValue>,
    activeId?: string,
    customState?: Record<string, DisplayValue>,
    highlightedIds?: Set<string>,
  ) => {
    const activeRoot =
      versions.length > 0
        ? versions[versions.length - 1].id
        : allCreatedNodes.length > 0
          ? allCreatedNodes[allCreatedNodes.length - 1].id
          : undefined;

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "tree",
        nodes: collectAllNodes(activeId, highlightedIds),
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
    addStep(28, "Array is empty", "No segment tree created for empty input array.", { n: 0 });
    return steps;
  }

  const buildTree = (l: number, r: number, v: number): PNode => {
    const id = `pnode-v${v}-${nodeCounter++}`;
    if (l === r) {
      const leafNode = addNode({ id, l, r, val: arr[l], version: v });
      addStep(
        8,
        `Base case (l == r == ${l}): Create leaf node = ${arr[l]} for v${v}`,
        `At single element range [${l}..${r}], construct leaf node storing array value ${arr[l]}.`,
        { l, r, val: arr[l], version: v },
        id,
      );
      addStep(
        9,
        `Return leaf node [${l}..${r}] (val = ${arr[l]}) for v${v}`,
        `Leaf node returned to parent node constructor.`,
        { l, r, val: arr[l], version: v },
        id,
      );
      return leafNode;
    }

    addStep(
      8,
      `Check range [${l}..${r}] for v${v}: not a leaf (l != r)`,
      `Range spans multiple elements. Divide interval into left and right subtrees.`,
      { l, r, version: v },
    );

    const mid = Math.floor((l + r) / 2);
    addStep(
      10,
      `Calculate midpoint mid = (${l} + ${r}) // 2 = ${mid} for v${v}`,
      `Splitting interval [${l}..${r}] into [${l}..${mid}] and [${mid + 1}..${r}].`,
      { l, r, mid, version: v },
    );

    addStep(
      11,
      `Build left child range [${l}..${mid}] for v${v}`,
      `Recursively constructing left subtree.`,
      { l, mid, version: v },
    );
    const leftChild = buildTree(l, mid, v);

    addStep(
      12,
      `Build right child range [${mid + 1}..${r}] for v${v}`,
      `Recursively constructing right subtree.`,
      { mid: mid + 1, r, version: v },
    );
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

    addStep(
      13,
      `Combine children for range [${l}..${r}]: left (${leftChild.val}) + right (${rightChild.val}) = ${nodeVal}`,
      `Created internal node for v${v} combining left child (${leftChild.val}) and right child (${rightChild.val}).`,
      {
        l,
        r,
        val: nodeVal,
        leftVal: leftChild.val,
        rightVal: rightChild.val,
        version: v,
      },
      id,
    );
    return internalNode;
  };

  addStep(
    7,
    "Start build(arr, 0, n-1) to construct version 0 tree",
    `Constructing initial segment tree version 0 over array [${arr.join(", ")}].`,
    { n },
  );

  const rootV0 = buildTree(0, n - 1, 0);
  versions.push(rootV0);

  addStep(
    13,
    `Completed build for version 0 (root sum = ${rootV0.val})`,
    `Version 0 root registered. Ready for persistent updates or queries.`,
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
      const newLeaf = addNode({ id, l, r, val, version: v });
      addStep(
        16,
        `Base case (l == r == ${l}) on update: target index ${idx}`,
        `Reached target leaf node for index ${idx}.`,
        { l, r, idx, val, v },
        prev.id,
      );
      addStep(
        17,
        `Return new cloned leaf node [${l}..${r}] with updated value ${val} for v${v}`,
        `Allocated new leaf node for version v${v} holding updated value ${val} without mutating prev version leaf.`,
        { v, idx, val },
        newLeaf.id,
      );
      return newLeaf;
    }

    addStep(
      16,
      `Check range [${l}..${r}] on update v${v}: not leaf (l != r)`,
      `Target index ${idx} falls within interval [${l}..${r}].`,
      { l, r, idx, v },
      prev.id,
    );

    const mid = Math.floor((l + r) / 2);
    addStep(
      18,
      `Calculate mid = (${l} + ${r}) // 2 = ${mid} for update v${v}`,
      `Determining whether target index ${idx} lies in left or right half.`,
      { l, r, mid, idx, v },
      prev.id,
    );

    let newLeft = prev.left;
    let newRight = prev.right;

    if (idx <= mid) {
      addStep(
        19,
        `Target idx ${idx} <= mid ${mid}: descend into left subtree [${l}..${mid}]`,
        `Left child will be updated and cloned. Right child pointer will be shared from version ${prev.version}.`,
        { v, l, mid, idx },
        prev.id,
      );
      addStep(
        20,
        `Recurse update on left child prev.left (version ${prev.left?.version})`,
        `Cloning left path for version v${v}.`,
        { v, l, mid, idx },
        prev.left?.id,
      );
      newLeft = updateTree(prev.left!, l, mid, idx, val, v);
      addStep(
        21,
        `Share unmodified right subtree from version ${prev.version} (root ${prev.right?.id})`,
        `Right branch is unchanged; reusing existing subtree from previous version.`,
        { v, rightId: prev.right?.id },
        prev.right?.id,
      );
    } else {
      addStep(
        19,
        `Target idx ${idx} > mid ${mid}: descend into right subtree [${mid + 1}..${r}]`,
        `Right child will be updated and cloned. Left child pointer will be shared from version ${prev.version}.`,
        { v, mid: mid + 1, r, idx },
        prev.id,
      );
      addStep(
        23,
        `Share unmodified left subtree from version ${prev.version} (root ${prev.left?.id})`,
        `Left branch is unchanged; reusing existing subtree from previous version.`,
        { v, leftId: prev.left?.id },
        prev.left?.id,
      );
      addStep(
        24,
        `Recurse update on right child prev.right (version ${prev.right?.version})`,
        `Cloning right path for version v${v}.`,
        { v, mid: mid + 1, r, idx },
        prev.right?.id,
      );
      newRight = updateTree(prev.right!, mid + 1, r, idx, val, v);
    }

    const newNodeVal = (newLeft?.val ?? 0) + (newRight?.val ?? 0);
    const newNode = addNode({
      id,
      l,
      r,
      val: newNodeVal,
      left: newLeft,
      right: newRight,
      version: v,
    });

    addStep(
      25,
      `Return new node [${l}..${r}] for v${v} (val = ${newNodeVal})`,
      `Constructed cloned ancestor node combining new child (${idx <= mid ? newLeft?.val : newRight?.val}) and shared child.`,
      { v, l, r, val: newNodeVal },
      newNode.id,
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
    if (!node || qr < l || ql > r) {
      addStep(
        28,
        `Base case: node is empty or range [${l}..${r}] does not overlap [${ql}..${qr}]`,
        `Out-of-bounds range query returns 0 contribution.`,
        { l, r, ql, qr },
        node?.id,
      );
      addStep(
        29,
        `Return 0 for non-overlapping subsegment [${l}..${r}]`,
        `Zero returned to caller.`,
        { l, r, ql, qr },
        node?.id,
      );
      return 0;
    }

    addStep(
      28,
      `Check overlap for node [${l}..${r}] on version v${node.version} against query [${ql}..${qr}]`,
      `Evaluating query interval against node [${l}..${r}].`,
      { l, r, ql, qr, v: node.version },
      node.id,
    );

    if (ql <= l && r <= qr) {
      addStep(
        30,
        `Range match: node [${l}..${r}] is completely inside query range [${ql}..${qr}]`,
        `Segment [${l}..${r}] is fully covered by query range [${ql}..${qr}].`,
        { l, r, ql, qr, val: node.val, v: node.version },
        node.id,
      );
      addStep(
        31,
        `Return precomputed sum ${node.val} from node [${l}..${r}] of v${node.version}`,
        `Directly return stored node aggregate value ${node.val} without traversing further down.`,
        { l, r, val: node.val, v: node.version },
        node.id,
      );
      return node.val;
    }

    const mid = Math.floor((l + r) / 2);
    addStep(
      32,
      `Calculate midpoint mid = (${l} + ${r}) // 2 = ${mid} for query on node [${l}..${r}]`,
      `Partial overlap: split query into left [${l}..${mid}] and right [${mid + 1}..${r}] child queries.`,
      { l, r, mid, ql, qr, v: node.version },
      node.id,
    );

    const leftSum = queryTree(node.left, l, mid, ql, qr);
    const rightSum = queryTree(node.right, mid + 1, r, ql, qr);
    const totalSum = leftSum + rightSum;

    addStep(
      33,
      `Combine query results for node [${l}..${r}]: ${leftSum} + ${rightSum} = ${totalSum}`,
      `Summed responses from left child (${leftSum}) and right child (${rightSum}) for node [${l}..${r}].`,
      { l, r, leftSum, rightSum, totalSum, v: node.version },
      node.id,
      { queryResult: String(totalSum) },
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
      definition:
        "An array of pointers holding the root node reference for each historical version of the segment tree.",
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
  topicIds: ["advanced_range_queries"],
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
