import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  TreeNodeItem,
} from '../../types/dsa';

export interface SegmentTreeOperation {
  type: 'update' | 'query';
  index?: number;
  value?: number;
  left?: number;
  right?: number;
}

export interface SegmentTreeInput {
  array: number[];
  operations?: SegmentTreeOperation[];
}

export const SEGMENT_TREE_CODE = `class SegmentTree:
    def __init__(self, arr: list[int]):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.build(arr, 1, 0, self.n - 1)

    def build(self, arr: list[int], node: int, start: int, end: int):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self.build(arr, 2 * node, start, mid)
        self.build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def update(self, node: int, start: int, end: int, idx: int, val: int):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, node: int, start: int, end: int, l: int, r: int) -> int:
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        left_sum = self.query(2 * node, start, mid, l, r)
        right_sum = self.query(2 * node + 1, mid + 1, end, l, r)
        return left_sum + right_sum`;

export const DEFAULT_SEGMENT_TREE_INPUT: SegmentTreeInput = {
  array: [1, 3, 5, 7, 9, 11],
  operations: [
    { type: 'query', left: 1, right: 3 },
    { type: 'update', index: 2, value: 6 },
    { type: 'query', left: 1, right: 3 },
  ],
};

interface InternalNode {
  nodeIdx: number;
  start: number;
  end: number;
  val: number;
}

export const generateSegmentTreeSteps = (input: SegmentTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = input.array.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: 'Initialize Segment Tree',
        why: 'Input array is empty. No segment tree built.',
      },
      primarySnapshot: {
        kind: 'tree',
        nodes: [],
      },
      auxiliaryState: {},
      variables: { n: 0 },
    });
    return steps;
  }

  const maxTreeNodes = 4 * n;
  const treeValues = new Array<number>(maxTreeNodes).fill(0);
  const activeNodeMap = new Map<number, InternalNode>();

  const dummyBuild = (node: number, start: number, end: number) => {
    activeNodeMap.set(node, { nodeIdx: node, start, end, val: 0 });
    if (start === end) return;
    const mid = Math.floor((start + end) / 2);
    dummyBuild(2 * node, start, mid);
    dummyBuild(2 * node + 1, mid + 1, end);
  };
  dummyBuild(1, 0, n - 1);

  const getTreeSnapshot = (stateMap?: Record<number, ElementState>): TreeNodeItem[] => {
    const nodes: TreeNodeItem[] = [];
    activeNodeMap.forEach((_, nodeIdx) => {
      const state = stateMap && stateMap[nodeIdx] ? stateMap[nodeIdx] : 'default';
      const hasLeft = activeNodeMap.has(2 * nodeIdx);
      const hasRight = activeNodeMap.has(2 * nodeIdx + 1);

      nodes.push({
        id: `node-${nodeIdx}`,
        val: treeValues[nodeIdx],
        leftId: hasLeft ? `node-${2 * nodeIdx}` : undefined,
        rightId: hasRight ? `node-${2 * nodeIdx + 1}` : undefined,
        state,
      });
    });
    return nodes;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stateMap?: Record<number, ElementState>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'tree',
        nodes: getTreeSnapshot(stateMap),
        rootId: 'node-1',
      },
      auxiliaryState: {
        customState: {
          originalArray: input.array.join(', '),
        },
      },
      variables,
    });
  };

  addStep(
    5,
    `Initialize Segment Tree for array of size ${n}`,
    `Create segment tree structure for input array [${input.array.join(', ')}].`,
    { n }
  );

  // Segment Tree build recursion
  const buildTree = (node: number, start: number, end: number) => {
    addStep(
      7,
      `Build node ${node} covering range [${start}..${end}]`,
      start === end
        ? `Leaf node covering element at index ${start} (val = ${input.array[start]}).`
        : `Internal node covering range [${start}..${end}]. Recurse left and right subtrees.`,
      { node, start, end },
      { [node]: 'compare' }
    );

    if (start === end) {
      treeValues[node] = input.array[start];
      addStep(
        9,
        `Leaf node ${node} set to ${treeValues[node]}`,
        `Assigned arr[${start}] = ${treeValues[node]} to leaf node ${node}.`,
        { node, start, end, val: treeValues[node] },
        { [node]: 'sorted' }
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    buildTree(2 * node, start, mid);
    buildTree(2 * node + 1, mid + 1, end);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      14,
      `Node ${node} sum = left (${treeValues[2 * node]}) + right (${treeValues[2 * node + 1]}) = ${treeValues[node]}`,
      `Combined child sums for node ${node} covering range [${start}..${end}].`,
      { node, start, end, leftVal: treeValues[2 * node], rightVal: treeValues[2 * node + 1], val: treeValues[node] },
      { [node]: 'active', [2 * node]: 'sorted', [2 * node + 1]: 'sorted' }
    );
  };

  buildTree(1, 0, n - 1);

  addStep(
    14,
    'Segment Tree Construction Complete',
    'Root node contains total array sum. Tree is fully constructed.',
    { totalSum: treeValues[1] }
  );

  // Segment Tree query
  const queryTree = (node: number, start: number, end: number, l: number, r: number): number => {
    if (r < start || end < l) {
      addStep(
        29,
        `Query node ${node} [${start}..${end}] is completely outside target [${l}..${r}]`,
        `Range [${start}..${end}] has no overlap with query range [${l}..${r}]. Return sum 0.`,
        { node, start, end, l, r },
        { [node]: 'visited' }
      );
      return 0;
    }

    if (l <= start && end <= r) {
      addStep(
        31,
        `Query node ${node} [${start}..${end}] is fully inside target [${l}..${r}]`,
        `Range [${start}..${end}] is fully enclosed by [${l}..${r}]. Return precomputed node sum ${treeValues[node]}.`,
        { node, start, end, l, r, val: treeValues[node] },
        { [node]: 'sorted' }
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);

    addStep(
      32,
      `Query node ${node} [${start}..${end}] partially overlaps target [${l}..${r}]`,
      `Split query between left child [${start}..${mid}] and right child [${mid + 1}..${end}].`,
      { node, start, end, l, r, mid },
      { [node]: 'compare' }
    );

    const leftSum = queryTree(2 * node, start, mid, l, r);
    const rightSum = queryTree(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addStep(
      35,
      `Node ${node} [${start}..${end}] query result = ${leftSum} + ${rightSum} = ${result}`,
      `Combined query contributions from left (${leftSum}) and right (${rightSum}) subtrees.`,
      { node, start, end, leftSum, rightSum, result },
      { [node]: 'active' }
    );

    return result;
  };

  // Segment Tree update
  const updateTree = (node: number, start: number, end: number, idx: number, val: number) => {
    if (start === end) {
      const oldVal = treeValues[node];
      treeValues[node] = val;
      addStep(
        18,
        `Update leaf node ${node} (index ${idx}): ${oldVal} -> ${val}`,
        `Leaf value updated to ${val}.`,
        { node, idx, oldVal, val },
        { [node]: 'swap' }
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      21,
      `Traverse node ${node} [${start}..${end}] towards update index ${idx}`,
      idx <= mid ? `Index ${idx} <= mid ${mid}. Go left.` : `Index ${idx} > mid ${mid}. Go right.`,
      { node, start, end, idx, val },
      { [node]: 'compare' }
    );

    if (idx <= mid) {
      updateTree(2 * node, start, mid, idx, val);
    } else {
      updateTree(2 * node + 1, mid + 1, end, idx, val);
    }

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      25,
      `Recalculate parent node ${node} [${start}..${end}] sum -> ${treeValues[node]}`,
      `Updated node ${node} sum after child update.`,
      { node, start, end, val: treeValues[node] },
      { [node]: 'active' }
    );
  };

  // Process operations
  const ops = input.operations ?? [];
  for (const op of ops) {
    if (op.type === 'query' && op.left !== undefined && op.right !== undefined) {
      addStep(
        27,
        `Execute Query operation for range [${op.left}..${op.right}]`,
        `Start recursive range sum query traversal on Segment Tree.`,
        { op: 'query', left: op.left, right: op.right }
      );

      const totalSum = queryTree(1, 0, n - 1, op.left, op.right);

      addStep(
        35,
        `Range Query [${op.left}..${op.right}] Result = ${totalSum}`,
        `Range sum calculation complete. Final sum is ${totalSum}.`,
        { left: op.left, right: op.right, totalSum }
      );
    } else if (op.type === 'update' && op.index !== undefined && op.value !== undefined) {
      addStep(
        16,
        `Execute Update operation: set index ${op.index} to ${op.value}`,
        `Update element at index ${op.index} and recalculate parent node sums up to root.`,
        { op: 'update', index: op.index, value: op.value }
      );

      updateTree(1, 0, n - 1, op.index, op.value);

      addStep(
        25,
        `Update operation complete for index ${op.index}`,
        `Segment Tree root sum is now ${treeValues[1]}.`,
        { index: op.index, newRootSum: treeValues[1] }
      );
    }
  }

  addStep(
    35,
    'All Segment Tree operations complete',
    'Finished processing range queries and updates on Segment Tree.',
    { rootSum: treeValues[1] }
  );

  return steps;
};

export const segmentTree: AlgorithmDefinition<SegmentTreeInput> = {
  id: 'segment-tree',
  title: 'Segment Tree (Range Sum Query & Update)',
  category: 'advanced_range_queries',
  difficulty: 'Hard',
  description:
    'A Segment Tree is a full binary tree used for storing interval information. It enables querying range sums and executing point updates in O(log N) time by dividing array intervals recursively into left and right sub-ranges.',
  constraints: [
    '1 <= N <= 10^5',
    '1 <= Q <= 10^5',
    '-10^9 <= array[i] <= 10^9',
  ],
  examples: [
    {
      input: 'array = [1, 3, 5, 7, 9, 11], operations = [Query [1..3], Update index 2 to 6, Query [1..3]]',
      output: 'Query 1: 15, Query 2: 16',
      explanation: 'Initial sum arr[1..3] = 3+5+7 = 15. Updating arr[2] from 5 to 6 changes range sum to 3+6+7 = 16.',
    },
  ],
  code: SEGMENT_TREE_CODE,
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_SEGMENT_TREE_INPUT,
  generateSteps: generateSegmentTreeSteps,
};
