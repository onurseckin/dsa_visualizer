import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
  TreeNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MergeSortTreeQuery {
  left: number;
  right: number;
  k: number;
}

export interface MergeSortTreeInput {
  array: number[];
  queries: MergeSortTreeQuery[];
}

export const PYTHON_MERGE_SORT_TREE_CODE = `import bisect

class MergeSortTree:
    def __init__(self, arr: list[int]):
        self.n = len(arr)
        self.tree = [[] for _ in range(4 * self.n)]
        if self.n > 0:
            self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr: list[int], node: int, l: int, r: int):
        if l == r:
            self.tree[node] = [arr[l]]
            return
        mid = (l + r) // 2
        self._build(arr, 2 * node, l, mid)
        self._build(arr, 2 * node + 1, mid + 1, r)
        # Merge sorted left and right child vectors
        self.tree[node] = sorted(self.tree[2 * node] + self.tree[2 * node + 1])

    def query(self, node: int, l: int, r: int, ql: int, qr: int, k: int) -> int:
        if qr < l or ql > r:
            return 0
        if ql <= l and r <= qr:
            # Binary search upper_bound on pre-sorted vector
            return bisect.bisect_right(self.tree[node], k)
        mid = (l + r) // 2
        return self.query(2 * node, l, mid, ql, qr, k) + self.query(2 * node + 1, mid + 1, r, ql, qr, k)

def merge_sort_tree(arr: list[int], ql: int, qr: int, k: int) -> int:
    mst = MergeSortTree(arr)
    return mst.query(1, 0, len(arr) - 1, ql, qr, k)`;

export const DEFAULT_MERGE_SORT_TREE_INPUT: MergeSortTreeInput = {
  array: [5, 2, 8, 1, 9, 3],
  queries: [
    { left: 1, right: 4, k: 5 },
    { left: 0, right: 5, k: 3 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Standard Segment Trees store scalar values (like sum or max), which cannot count elements less than K across arbitrary range intervals.",
    primarySnapshot: {
      kind: "array",
      name: "scalarTreeLimit",
      elements: [
        { id: "s1", value: 28, label: "sum = 28", state: "default" },
        { id: "s2", value: 9, label: "max = 9", state: "default" },
        { id: "s3", value: 0, label: "Count <= K ?", state: "active" },
      ],
    },
  },
  {
    narrative:
      "A Merge Sort Tree stores a sorted list of elements inside EVERY node of the segment tree.",
    primarySnapshot: {
      kind: "tree",
      rootId: "r1",
      nodes: [
        { id: "r1", val: 6, leftId: "c1", rightId: "c2", state: "active" },
        { id: "c1", val: 3, state: "visited" },
        { id: "c2", val: 3, state: "visited" },
      ],
    },
  },
  {
    narrative: "During tree construction, leaf nodes store single-element vectors [arr[i]].",
    primarySnapshot: {
      kind: "tree",
      rootId: "l1",
      nodes: [
        { id: "l1", val: 5, state: "sorted" },
        { id: "l2", val: 2, state: "sorted" },
        { id: "l3", val: 8, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Parent nodes merge the sorted vectors of their left and right children in O(N log N) total tree build time.",
    primarySnapshot: {
      kind: "tree",
      rootId: "p1",
      nodes: [
        { id: "p1", val: 4, leftId: "l1", rightId: "l2", state: "swap" },
        { id: "l1", val: 2, state: "visited" },
        { id: "l2", val: 2, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "When querying range [L, R] for count <= K, we decompose [L, R] into O(log N) canonical tree subsegments.",
    primarySnapshot: {
      kind: "tree",
      rootId: "p1",
      nodes: [
        { id: "p1", val: 8, leftId: "c1", rightId: "c2", state: "compare" },
        { id: "c1", val: 4, state: "active" },
        { id: "c2", val: 4, state: "active" },
      ],
    },
  },
  {
    narrative:
      "For each canonical tree node, binary search (upper_bound) counts how many elements in its pre-sorted vector are <= K.",
    primarySnapshot: {
      kind: "array",
      name: "nodeVectorBinarySearch",
      elements: [
        { id: "v1", value: 1, label: "<= 5", state: "sorted" },
        { id: "v2", value: 2, label: "<= 5", state: "sorted" },
        { id: "v3", value: 5, label: "<= 5", state: "sorted" },
        { id: "v4", value: 8, label: "> 5", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Binary search takes O(log N) time per canonical node, executing fast logarithmic scans.",
    primarySnapshot: {
      kind: "array",
      name: "bsComplexity",
      elements: [
        { id: "b1", value: 0, label: "Vector size M", state: "default" },
        { id: "b2", value: 0, label: "log2(M) steps", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Summing the counts from all O(log N) canonical nodes returns the exact total count in range [L, R] <= K.",
    primarySnapshot: {
      kind: "array",
      name: "rangeSumResult",
      elements: [
        { id: "r1", value: 2, label: "Node 1 count = 2", state: "active" },
        { id: "r2", value: 1, label: "Node 2 count = 1", state: "active" },
        { id: "r3", value: 3, label: "Total = 3", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Each query executes in O(log^2 N) overall time across the segment tree traversal and internal binary searches.",
    primarySnapshot: {
      kind: "array",
      name: "queryComplexity",
      elements: [
        { id: "q1", value: 0, label: "O(log N) nodes", state: "visited" },
        { id: "q2", value: 0, label: "O(log N) search", state: "visited" },
        { id: "q3", value: 0, label: "Total O(log^2 N)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Space complexity is O(N log N) because each of the log N tree levels stores N total numbers across all node vectors.",
    primarySnapshot: {
      kind: "array",
      name: "spaceComplexity",
      elements: [
        { id: "sc1", value: 0, label: "log(N) levels", state: "default" },
        { id: "sc2", value: 0, label: "N items/level", state: "default" },
        { id: "sc3", value: 0, label: "O(N log N) space", state: "sorted" },
      ],
    },
  },
];

interface MSTNode {
  id: string;
  l: number;
  r: number;
  sortedVec: number[];
  left?: MSTNode;
  right?: MSTNode;
}

export const generateMergeSortTreeSteps = (input: MergeSortTreeInput): AlgorithmStep[] => {
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
    array: Array.isArray(input?.array) ? input.array : DEFAULT_MERGE_SORT_TREE_INPUT.array,
    queries: Array.isArray(input?.queries) ? input.queries : DEFAULT_MERGE_SORT_TREE_INPUT.queries,
  };
  const arr = [...safeInput.array];
  const queries = safeInput.queries;
  const n = arr.length;

  if (n === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "Input array is empty, so no Merge Sort Tree can be constructed.",
        primarySnapshot: {
          kind: "array",
          name: "mstArray",
          elements: [],
        },
      }),
    );
    return steps;
  }

  const allNodes: MSTNode[] = [];

  const buildMST = (l: number, r: number): MSTNode => {
    const id = `mst_node_${nodeCounter++}`;
    if (l === r) {
      const leaf: MSTNode = { id, l, r, sortedVec: [arr[l]] };
      allNodes.push(leaf);
      return leaf;
    }

    const mid = Math.floor((l + r) / 2);
    const leftChild = buildMST(l, mid);
    const rightChild = buildMST(mid + 1, r);

    const mergedVec: number[] = [];
    let i = 0;
    let j = 0;
    while (i < leftChild.sortedVec.length && j < rightChild.sortedVec.length) {
      if (leftChild.sortedVec[i] <= rightChild.sortedVec[j]) {
        mergedVec.push(leftChild.sortedVec[i++]);
      } else {
        mergedVec.push(rightChild.sortedVec[j++]);
      }
    }
    while (i < leftChild.sortedVec.length) mergedVec.push(leftChild.sortedVec[i++]);
    while (j < rightChild.sortedVec.length) mergedVec.push(rightChild.sortedVec[j++]);

    const node: MSTNode = { id, l, r, sortedVec: mergedVec, left: leftChild, right: rightChild };
    allNodes.push(node);
    return node;
  };

  const root = buildMST(0, n - 1);

  const collectTreeNodes = (activeId?: string): TreeNodeItem[] => {
    return allNodes.map((node) => ({
      id: node.id,
      val: node.sortedVec.length,
      leftId: node.left?.id,
      rightId: node.right?.id,
      state: node.id === activeId ? "active" : "default",
    }));
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Built Merge Sort Tree for array of size ${n}. Each node stores a sorted vector of items in its range.`,
      primarySnapshot: {
        kind: "tree",
        name: "mergeSortTree",
        nodes: collectTreeNodes(),
        rootId: root.id,
      },
    }),
  );

  const queryMST = (node: MSTNode, ql: number, qr: number, k: number): number => {
    if (qr < node.l || ql > node.r) return 0;

    if (ql <= node.l && node.r <= qr) {
      let count = 0;
      for (const val of node.sortedVec) {
        if (val <= k) count++;
      }

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Canonical node [${node.l}..${node.r}] covers interval range. Binary search on vector [${node.sortedVec.join(", ")}] yields ${count} elements <= ${k}.`,
          primarySnapshot: {
            kind: "tree",
            name: "mergeSortTree",
            nodes: allNodes.map((nItem) => ({
              id: nItem.id,
              val: nItem.sortedVec.length,
              leftId: nItem.left?.id,
              rightId: nItem.right?.id,
              state: nItem.id === node.id ? "sorted" : "default",
            })),
            rootId: root.id,
          },
        }),
      );

      return count;
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Node [${node.l}..${node.r}] partially overlaps query [${ql}..${qr}]. Recursing left and right subtrees.`,
        primarySnapshot: {
          kind: "tree",
          name: "mergeSortTree",
          nodes: allNodes.map((nItem) => ({
            id: nItem.id,
            val: nItem.sortedVec.length,
            leftId: nItem.left?.id,
            rightId: nItem.right?.id,
            state: nItem.id === node.id ? "compare" : "default",
          })),
          rootId: root.id,
        },
      }),
    );

    const leftRes = node.left ? queryMST(node.left, ql, qr, k) : 0;
    const rightRes = node.right ? queryMST(node.right, ql, qr, k) : 0;
    return leftRes + rightRes;
  };

  const results: number[] = [];
  for (let qIdx = 0; qIdx < queries.length; qIdx++) {
    const q = queries[qIdx];
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Processing Query ${qIdx + 1}/${queries.length}: count elements <= ${q.k} in range [${q.left}..${q.right}].`,
        primarySnapshot: {
          kind: "tree",
          name: "mergeSortTree",
          nodes: collectTreeNodes(root.id),
          rootId: root.id,
        },
      }),
    );

    const ans = queryMST(root, q.left, q.right, q.k);
    results.push(ans);

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Completed Query ${qIdx + 1}: found ${ans} elements <= ${q.k} in range [${q.left}..${q.right}].`,
        primarySnapshot: {
          kind: "tree",
          name: "mergeSortTree",
          nodes: allNodes.map((nItem) => ({
            id: nItem.id,
            val: nItem.sortedVec.length,
            leftId: nItem.left?.id,
            rightId: nItem.right?.id,
            state: "visited" as const,
          })),
          rootId: root.id,
        },
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `All ${queries.length} range count queries completed successfully. Results: [${results.join(", ")}].`,
      primarySnapshot: {
        kind: "tree",
        name: "mergeSortTree",
        nodes: allNodes.map((nItem) => ({
          id: nItem.id,
          val: nItem.sortedVec.length,
          leftId: nItem.left?.id,
          rightId: nItem.right?.id,
          state: "sorted" as const,
        })),
        rootId: root.id,
      },
    }),
  );

  return steps;
};

const MERGE_SORT_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>Merge Sort Tree</strong> is a Segment Tree variant where each node stores a sorted vector of elements from its corresponding range, enabling logarithmic range frequency queries.</p>",
  sections: [
    {
      heading: "Vector Segment Tree Structure",
      body: "<p>Each tree node contains the sorted subsegment of its subtree, built by merging child vectors in <code>O(N log N)</code> total time.</p>",
    },
  ],
};

const MERGE_SORT_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    8: "Defines MergeSortTree class.",
    26: "Performs upper_bound binary search on node vector.",
  },
};

export const mergeSortTree: AlgorithmDefinition<MergeSortTreeInput> = {
  id: "merge-sort-tree",
  title: "Merge Sort Tree / Vector Segment Tree",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>A <strong>Merge Sort Tree</strong> is a Segment Tree variant where each node stores a sorted vector of elements from its corresponding range, enabling <code>O(log^2 N)</code> range frequency queries via binary search.</p><h3>Input Parameters</h3><ul><li><code>array</code>: Numerical input array.</li><li><code>queries</code>: List of range threshold queries <code>[left, right, k]</code>.</li></ul><h3>Output</h3><ul><li><code>Array</code>: Count of elements &le; <code>k</code> in range <code>[left..right]</code> for each query.</li></ul>",
  constraints: ["1 <= array.length <= 10^5", "1 <= queries.length <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: {
        array: [5, 2, 8, 1, 9, 3],
        queries: [
          { left: 1, right: 4, k: 5 },
          { left: 0, right: 5, k: 3 },
        ],
      },
      output: "[3, 3]",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: {
        array: [42],
        queries: [{ left: 0, right: 0, k: 10 }],
      },
      output: "[0]",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: {
        array: [10, 20, 30, 40, 50],
        queries: [
          { left: 0, right: 4, k: 25 },
          { left: 2, right: 4, k: 45 },
        ],
      },
      output: "[2, 2]",
    },
  ],
  code: PYTHON_MERGE_SORT_TREE_CODE,
  timeComplexity: {
    best: "O(Q \\log^2 N)",
    average: "O(Q \\log^2 N)",
    worst: "O(Q \\log^2 N)",
  },
  spaceComplexity: "O(N \\log N)",
  complexityAnalysis: {
    time: "Each range query identifies O(log N) canonical nodes and performs O(log N) binary search on each, total O(Q log^2 N) runtime.",
    space:
      "Each element is stored once at each of the O(log N) tree levels, taking O(N log N) total space.",
  },
  topicGuide: MERGE_SORT_TREE_TOPIC_GUIDE,
  trivia: MERGE_SORT_TREE_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer Handbook",
      bookTitle: "Competitive Programmer Handbook",
      chapter: 28,
    },
  ],
  defaultInput: DEFAULT_MERGE_SORT_TREE_INPUT,
  generateSteps: generateMergeSortTreeSteps,
};

export default mergeSortTree;
