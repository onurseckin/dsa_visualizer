import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  TreeNodeItem,
} from '../../types/dsa';

export interface LazySegmentTreeOperation {
  type: 'rangeUpdate' | 'rangeQuery' | 'update' | 'query';
  left: number;
  right: number;
  value?: number;
}

export interface SegmentTreeLazyInput {
  array: number[];
  operations?: LazySegmentTreeOperation[];
}

export const SEGMENT_TREE_LAZY_CODE = `class SegmentTreeLazy:
    def __init__(self, arr: list[int]):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.lazy = [0] * (4 * self.n)
        self.build(arr, 1, 0, self.n - 1)

    def build(self, arr: list[int], node: int, start: int, end: int):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self.build(arr, 2 * node, start, mid)
        self.build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def push(self, node: int, start: int, end: int):
        if self.lazy[node] != 0:
            mid = (start + end) // 2
            self.lazy[2 * node] += self.lazy[node]
            self.tree[2 * node] += self.lazy[node] * (mid - start + 1)
            self.lazy[2 * node + 1] += self.lazy[node]
            self.tree[2 * node + 1] += self.lazy[node] * (end - mid)
            self.lazy[node] = 0

    def update_range(self, node: int, start: int, end: int, l: int, r: int, val: int):
        if self.lazy[node] != 0 and start != end:
            self.push(node, start, end)

        if r < start or end < l:
            return

        if l <= start and end <= r:
            self.tree[node] += (end - start + 1) * val
            if start != end:
                self.lazy[node] += val
            return

        mid = (start + end) // 2
        self.update_range(2 * node, start, mid, l, r, val)
        self.update_range(2 * node + 1, mid + 1, end, l, r, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query_range(self, node: int, start: int, end: int, l: int, r: int) -> int:
        if r < start or end < l:
            return 0

        if self.lazy[node] != 0 and start != end:
            self.push(node, start, end)

        if l <= start and end <= r:
            return self.tree[node]

        mid = (start + end) // 2
        left_sum = self.query_range(2 * node, start, mid, l, r)
        right_sum = self.query_range(2 * node + 1, mid + 1, end, l, r)
        return left_sum + right_sum`;

export const DEFAULT_SEGMENT_TREE_LAZY_INPUT: SegmentTreeLazyInput = {
  array: [1, 2, 3, 4, 5],
  operations: [
    { type: 'rangeQuery', left: 1, right: 3 },
    { type: 'rangeUpdate', left: 1, right: 3, value: 5 },
    { type: 'rangeQuery', left: 1, right: 3 },
    { type: 'rangeQuery', left: 0, right: 4 },
  ],
};

interface InternalNode {
  nodeIdx: number;
  start: number;
  end: number;
}

export const generateSegmentTreeLazySteps = (
  input: SegmentTreeLazyInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = input.array.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: 'Initialize Lazy Segment Tree',
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
  const lazyValues = new Array<number>(maxTreeNodes).fill(0);
  const activeNodeMap = new Map<number, InternalNode>();

  const dummyBuild = (node: number, start: number, end: number) => {
    activeNodeMap.set(node, { nodeIdx: node, start, end });
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

  const getAuxiliaryState = (currentOp: string) => {
    const lazyTable: Record<string, string | number> = {};
    activeNodeMap.forEach((meta, nodeIdx) => {
      lazyTable[`Node ${nodeIdx} [${meta.start}..${meta.end}] Lazy`] = lazyValues[nodeIdx];
    });

    return {
      hashMap: lazyTable,
      customState: {
        operation: currentOp,
        array: input.array.join(', '),
      },
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stateMap?: Record<number, ElementState>,
    currentOp: string = 'Building'
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
      auxiliaryState: getAuxiliaryState(currentOp),
      variables,
    });
  };

  addStep(
    1,
    `Initialize Segment Tree with Lazy Propagation for array size ${n}`,
    `Create tree and lazy propagation arrays of size 4*N = ${maxTreeNodes}. Lazy propagation allows performing range updates in O(log N) time.`,
    { n }
  );

  // Build tree recursion
  const buildTree = (node: number, start: number, end: number) => {
    addStep(
      7,
      `Build node ${node} covering range [${start}..${end}]`,
      start === end
        ? `Leaf node covering index ${start} (value = ${input.array[start]}).`
        : `Internal node covering range [${start}..${end}]. Recurse on children.`,
      { node, start, end },
      { [node]: 'compare' }
    );

    if (start === end) {
      treeValues[node] = input.array[start];
      addStep(
        9,
        `Set leaf node ${node} sum = ${treeValues[node]}`,
        `Assigned arr[${start}] = ${treeValues[node]}.`,
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
      `Node ${node} sum = left child (${treeValues[2 * node]}) + right child (${treeValues[2 * node + 1]}) = ${treeValues[node]}`,
      `Combined sums of children for range [${start}..${end}].`,
      { node, start, end, val: treeValues[node] },
      { [node]: 'active', [2 * node]: 'sorted', [2 * node + 1]: 'sorted' }
    );
  };

  buildTree(1, 0, n - 1);

  addStep(
    14,
    'Lazy Segment Tree build complete',
    'Tree initialized with array values and all lazy values set to 0.',
    { rootSum: treeValues[1] },
    undefined,
    'Build Complete'
  );

  // Helper push function
  const pushLazy = (node: number, start: number, end: number) => {
    if (lazyValues[node] !== 0 && start !== end) {
      const mid = Math.floor((start + end) / 2);
      const val = lazyValues[node];

      const leftNode = 2 * node;
      const rightNode = 2 * node + 1;
      const leftCount = mid - start + 1;
      const rightCount = end - mid;

      lazyValues[leftNode] += val;
      treeValues[leftNode] += val * leftCount;

      lazyValues[rightNode] += val;
      treeValues[rightNode] += val * rightCount;

      lazyValues[node] = 0;

      addStep(
        17,
        `Push lazy tag ${val} down from node ${node} [${start}..${end}] to children`,
        `Updated left child ${leftNode} (+${val * leftCount}) and right child ${rightNode} (+${val * rightCount}), cleared lazy[${node}] = 0.`,
        { node, val, leftNode, rightNode, newLeftSum: treeValues[leftNode], newRightSum: treeValues[rightNode] },
        { [node]: 'active', [leftNode]: 'swap', [rightNode]: 'swap' },
        'Propagating Lazy Tag'
      );
    }
  };

  // Range Update function
  const updateRange = (node: number, start: number, end: number, l: number, r: number, val: number) => {
    pushLazy(node, start, end);

    if (r < start || end < l) {
      addStep(
        30,
        `Node ${node} [${start}..${end}] is completely outside update range [${l}..${r}]`,
        `No update needed for this branch.`,
        { node, start, end, l, r },
        { [node]: 'visited' },
        `Range Update [${l}..${r}] += ${val}`
      );
      return;
    }

    if (l <= start && end <= r) {
      const count = end - start + 1;
      const addTotal = count * val;
      treeValues[node] += addTotal;
      if (start !== end) {
        lazyValues[node] += val;
      }

      addStep(
        33,
        `Node ${node} [${start}..${end}] is fully inside update range [${l}..${r}]`,
        `Updated node sum by ${addTotal} to ${treeValues[node]}. ${
          start !== end ? `Set lazy tag lazy[${node}] += ${val}.` : 'Leaf node, no lazy tag stored.'
        }`,
        { node, start, end, count, val, newSum: treeValues[node], lazyVal: lazyValues[node] },
        { [node]: 'sorted' },
        `Range Update [${l}..${r}] += ${val}`
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      39,
      `Node ${node} [${start}..${end}] partially overlaps update range [${l}..${r}]`,
      `Recurse update into left child [${start}..${mid}] and right child [${mid + 1}..${end}].`,
      { node, start, end, l, r, mid },
      { [node]: 'compare' },
      `Range Update [${l}..${r}] += ${val}`
    );

    updateRange(2 * node, start, mid, l, r, val);
    updateRange(2 * node + 1, mid + 1, end, l, r, val);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      41,
      `Recalculate node ${node} [${start}..${end}] sum after children update -> ${treeValues[node]}`,
      `Combined updated child sums (${treeValues[2 * node]} + ${treeValues[2 * node + 1]}).`,
      { node, start, end, newSum: treeValues[node] },
      { [node]: 'active' },
      `Range Update [${l}..${r}] += ${val}`
    );
  };

  // Range Query function
  const queryRange = (node: number, start: number, end: number, l: number, r: number): number => {
    if (r < start || end < l) {
      addStep(
        46,
        `Query node ${node} [${start}..${end}] is completely outside target [${l}..${r}]`,
        `Range [${start}..${end}] has no overlap with query range [${l}..${r}]. Return 0.`,
        { node, start, end, l, r },
        { [node]: 'visited' },
        `Range Query [${l}..${r}]`
      );
      return 0;
    }

    pushLazy(node, start, end);

    if (l <= start && end <= r) {
      addStep(
        51,
        `Query node ${node} [${start}..${end}] is fully inside target [${l}..${r}]`,
        `Range [${start}..${end}] is fully enclosed by [${l}..${r}]. Return node sum ${treeValues[node]}.`,
        { node, start, end, l, r, sum: treeValues[node] },
        { [node]: 'sorted' },
        `Range Query [${l}..${r}]`
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      53,
      `Query node ${node} [${start}..${end}] partially overlaps target [${l}..${r}]`,
      `Split query between left child [${start}..${mid}] and right child [${mid + 1}..${end}].`,
      { node, start, end, l, r, mid },
      { [node]: 'compare' },
      `Range Query [${l}..${r}]`
    );

    const leftSum = queryRange(2 * node, start, mid, l, r);
    const rightSum = queryRange(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addStep(
      56,
      `Node ${node} [${start}..${end}] query sum = left (${leftSum}) + right (${rightSum}) = ${result}`,
      `Combined query contributions for range [${start}..${end}].`,
      { node, start, end, leftSum, rightSum, result },
      { [node]: 'active' },
      `Range Query [${l}..${r}]`
    );

    return result;
  };

  // Process operations
  const ops = input.operations ?? [];
  for (const op of ops) {
    const isUpdate = op.type === 'rangeUpdate' || op.type === 'update';
    const isQuery = op.type === 'rangeQuery' || op.type === 'query';

    if (isUpdate) {
      const val = op.value ?? 1;
      addStep(
        27,
        `Start Range Update operation on range [${op.left}..${op.right}] with value +${val}`,
        `Add +${val} to all elements in range [${op.left}..${op.right}] using lazy propagation.`,
        { op: 'rangeUpdate', left: op.left, right: op.right, value: val },
        undefined,
        `Range Update [${op.left}..${op.right}] += ${val}`
      );

      updateRange(1, 0, n - 1, op.left, op.right, val);

      addStep(
        42,
        `Range Update [${op.left}..${op.right}] += ${val} complete`,
        `Tree updated lazily. Root sum is now ${treeValues[1]}.`,
        { newRootSum: treeValues[1] },
        undefined,
        'Update Complete'
      );
    } else if (isQuery) {
      addStep(
        44,
        `Start Range Query operation on range [${op.left}..${op.right}]`,
        `Calculate range sum for interval [${op.left}..${op.right}], pushing lazy updates down as needed.`,
        { op: 'rangeQuery', left: op.left, right: op.right },
        undefined,
        `Range Query [${op.left}..${op.right}]`
      );

      const totalSum = queryRange(1, 0, n - 1, op.left, op.right);

      addStep(
        57,
        `Range Query [${op.left}..${op.right}] Result = ${totalSum}`,
        `Range sum query finished. Final total sum is ${totalSum}.`,
        { left: op.left, right: op.right, totalSum },
        undefined,
        'Query Complete'
      );
    }
  }

  addStep(
    57,
    'All Lazy Segment Tree operations completed',
    'Finished processing range updates and queries.',
    { finalRootSum: treeValues[1] },
    undefined,
    'All Done'
  );

  return steps;
};

export const segmentTreeLazy: AlgorithmDefinition<SegmentTreeLazyInput> = {
  id: 'segment-tree-lazy',
  title: 'Segment Tree (Lazy Propagation)',
  category: 'advanced_range_queries',
  difficulty: 'Hard',
  description:
    'A Segment Tree with Lazy Propagation supports range updates and range sum queries in O(log N) time. Range updates are postponed and stored in lazy tags, pushing modifications down to child subtrees only when those subtrees are traversed during future queries or updates.',
  constraints: [
    '1 <= N <= 10^5',
    '1 <= Q <= 10^5',
    '-10^9 <= val <= 10^9',
  ],
  examples: [
    {
      input: 'array = [1, 2, 3, 4, 5], operations = [Range Query [1..3], Range Update [1..3] += 5, Range Query [1..3]]',
      output: 'Query 1: 9, Query 2: 24',
      explanation: 'Initial sum arr[1..3] = 2+3+4 = 9. Adding 5 to range [1..3] updates 3 elements by 5 (+15 total), giving new sum 24.',
    },
  ],
  code: SEGMENT_TREE_LAZY_CODE,
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_SEGMENT_TREE_LAZY_INPUT,
  generateSteps: generateSegmentTreeLazySteps,
};
