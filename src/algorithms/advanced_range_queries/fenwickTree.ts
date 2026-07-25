import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface FenwickTreeOperation {
  type: 'update' | 'query';
  index?: number;
  delta?: number;
  left?: number;
  right?: number;
}

export interface FenwickTreeInput {
  array: number[];
  operations?: FenwickTreeOperation[];
}

export const FENWICK_TREE_CODE = `class FenwickTree:
    def __init__(self, size: int):
        self.tree = [0] * (size + 1)

    def update(self, index: int, delta: int):
        i = index
        while i < len(self.tree):
            self.tree[i] += delta
            i += i & -i

    def query(self, index: int) -> int:
        sum_val = 0
        i = index
        while i > 0:
            sum_val += self.tree[i]
            i -= i & -i
        return sum_val

    def range_query(self, left: int, right: int) -> int:
        return self.query(right) - self.query(left - 1)`;

export const DEFAULT_FENWICK_INPUT: FenwickTreeInput = {
  array: [3, 2, -1, 6, 5, 4, -3, 37],
  operations: [
    { type: 'query', left: 1, right: 5 },
    { type: 'update', index: 3, delta: 5 },
    { type: 'query', left: 1, right: 5 },
  ],
};

export const generateFenwickTreeSteps = (input: FenwickTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = input.array.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: 'Initialize Fenwick Tree',
        why: 'Input array is empty. No Fenwick tree constructed.',
      },
      primarySnapshot: {
        kind: 'array',
        elements: [],
      },
      auxiliaryState: {
        customState: {
          originalArray: '',
          treeArray: '',
        },
      },
      variables: { n: 0 },
    });
    return steps;
  }

  // 1-indexed tree array of size n + 1
  const tree = new Array<number>(n + 1).fill(0);

  // Array elements to represent tree[1..n] for visualization
  const getElements = (
    highlightIdx?: number,
    highlightState: ArrayElement['state'] = 'active',
    pointers?: Record<number, string[]>
  ): ArrayElement[] => {
    const elements: ArrayElement[] = [];
    for (let i = 1; i <= n; i++) {
      let state: ArrayElement['state'] = 'default';
      if (highlightIdx === i) {
        state = highlightState;
      }
      elements.push({
        id: `tree-${i}`,
        value: tree[i],
        state,
        pointers: pointers && pointers[i] ? pointers[i] : undefined,
      });
    }
    return elements;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    elements: ArrayElement[]
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements,
      },
      auxiliaryState: {
        customState: {
          originalArray: input.array.join(', '),
          treeArray: tree.slice(1).join(', '),
        },
      },
      variables,
    });
  };

  // Helper point update function
  const updateFenwick = (idx: number, delta: number) => {
    addStep(
      5,
      `Start update at index ${idx} with delta = ${delta}`,
      `Propagate update upward through tree indices using i += i & -i.`,
      { index: idx, delta },
      getElements(idx, 'compare', { [idx]: ['idx'] })
    );

    let i = idx;
    while (i <= n) {
      const lowbit = i & -i;
      tree[i] += delta;

      addStep(
        8,
        `Update tree[${i}] += ${delta} -> new val = ${tree[i]}`,
        `Lowbit for index ${i} is ${lowbit} (bin: 0b${lowbit.toString(2)}). Next index to update is ${i} + ${lowbit} = ${i + lowbit}.`,
        { i, lowbit, delta, 'tree[i]': tree[i] },
        getElements(i, 'swap', { [i]: ['updated'] })
      );

      i += lowbit;
    }
  };

  // Helper prefix query function
  const queryFenwick = (idx: number): number => {
    let sum = 0;
    let i = idx;

    addStep(
      11,
      `Start prefix sum query for index 1..${idx}`,
      `Accumulate tree values downwards using i -= i & -i.`,
      { index: idx, sum },
      getElements(idx, 'compare', { [idx]: ['idx'] })
    );

    while (i > 0) {
      const lowbit = i & -i;
      sum += tree[i];

      addStep(
        15,
        `Add tree[${i}] (${tree[i]}) to prefix sum -> current sum = ${sum}`,
        `Lowbit for index ${i} is ${lowbit}. Next tree index to query will be ${i} - ${lowbit} = ${i - lowbit}.`,
        { i, lowbit, 'tree[i]': tree[i], sum },
        getElements(i, 'active', { [i]: ['contrib'] })
      );

      i -= lowbit;
    }

    return sum;
  };

  addStep(
    3,
    `Initialize Fenwick Tree of size ${n}`,
    `Create binary indexed tree array of length ${n + 1} initialized to 0.`,
    { n },
    getElements()
  );

  // Build tree from input array
  for (let i = 0; i < n; i++) {
    const val = input.array[i];
    if (val !== 0) {
      updateFenwick(i + 1, val);
    }
  }

  addStep(
    3,
    'Fenwick Tree construction complete',
    `Tree is fully built from initial array [${input.array.join(', ')}].`,
    { n },
    getElements()
  );

  // Process operations if provided
  const ops = input.operations ?? [];
  for (const op of ops) {
    if (op.type === 'update' && op.index !== undefined && op.delta !== undefined) {
      addStep(
        5,
        `Execute Operation: Update index ${op.index} by delta ${op.delta}`,
        `Apply point update of ${op.delta} to position ${op.index}.`,
        { op: 'update', index: op.index, delta: op.delta },
        getElements(op.index, 'compare', { [op.index]: ['update'] })
      );
      updateFenwick(op.index, op.delta);
    } else if (op.type === 'query' && op.left !== undefined && op.right !== undefined) {
      addStep(
        19,
        `Execute Operation: Range Query [${op.left}..${op.right}]`,
        `Calculate range sum using prefixQuery(${op.right}) - prefixQuery(${op.left - 1}).`,
        { op: 'query', left: op.left, right: op.right },
        getElements()
      );

      const sumRight = queryFenwick(op.right);
      const sumLeftMinus1 = op.left > 1 ? queryFenwick(op.left - 1) : 0;
      const rangeSum = sumRight - sumLeftMinus1;

      addStep(
        20,
        `Range Query [${op.left}..${op.right}] Result = ${rangeSum}`,
        `prefixQuery(${op.right}) [${sumRight}] - prefixQuery(${op.left - 1}) [${sumLeftMinus1}] = ${rangeSum}.`,
        { left: op.left, right: op.right, sumRight, sumLeftMinus1, rangeSum },
        getElements()
      );
    }
  }

  addStep(
    20,
    'All Fenwick Tree operations complete',
    'Finished processing range queries and point updates.',
    { n },
    getElements()
  );

  return steps;
};

export const fenwickTree: AlgorithmDefinition<FenwickTreeInput> = {
  id: 'fenwick-tree',
  title: 'Binary Indexed Tree (Fenwick Tree)',
  category: 'advanced_range_queries',
  difficulty: 'Medium',
  description:
    'A Binary Indexed Tree (Fenwick Tree) is a compact array-based data structure that supports logarithmic time O(log N) point updates and range sum queries. Each index i covers a sub-interval of length equal to its least significant set bit (i & -i).',
  constraints: [
    '1 <= N <= 10^5',
    '1 <= Q <= 10^5',
    '-10^9 <= array[i] <= 10^9',
  ],
  examples: [
    {
      input: 'array = [3, 2, -1, 6, 5, 4, -3, 37], operations = [Range Query [1..5], Update index 3 by +5, Range Query [1..5]]',
      output: 'Query 1: 15, Query 2: 20',
      explanation: 'Initial prefix sum up to index 5 is 3+2+(-1)+6+5 = 15. Adding 5 to index 3 updates tree elements responsibility ranges, increasing range sum to 20.',
    },
  ],
  code: FENWICK_TREE_CODE,
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_FENWICK_INPUT,
  generateSteps: generateFenwickTreeSteps,
};
