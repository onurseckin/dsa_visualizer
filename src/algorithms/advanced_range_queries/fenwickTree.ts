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
        what: 'Check the input array',
        why: 'The input array is empty, so there is nothing to build — we stop right away.',
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
      `Add ${delta} at index ${idx}`,
      `We only need to touch the cells responsible for position ${idx}: starting here, we climb upward with i += i & -i, updating each range that covers it.`,
      { index: idx, delta },
      getElements(idx, 'compare', { [idx]: ['idx'] })
    );

    let i = idx;
    while (i <= n) {
      const lowbit = i & -i;
      tree[i] += delta;

      addStep(
        8,
        `Update tree[${i}] to ${tree[i]}`,
        `Cell ${i} covers a block that includes our position, so we add ${delta} to it. Its lowbit is ${lowbit}, which sends us up to the next responsible cell at ${i} + ${lowbit} = ${i + lowbit}.`,
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
      `Query the prefix sum up to ${idx}`,
      `We want the total of positions 1..${idx}, so we hop downward with i -= i & -i, collecting each cell's stored block sum along the way.`,
      { index: idx, sum },
      getElements(idx, 'compare', { [idx]: ['idx'] })
    );

    while (i > 0) {
      const lowbit = i & -i;
      sum += tree[i];

      addStep(
        15,
        `Add tree[${i}] = ${tree[i]} to the sum`,
        `Cell ${i} holds the sum of a block ending at position ${i}, so we fold it in and our running total becomes ${sum}. Stripping the lowbit ${lowbit} jumps us to the previous block at index ${i - lowbit}.`,
        { i, lowbit, 'tree[i]': tree[i], sum },
        getElements(i, 'active', { [i]: ['contrib'] })
      );

      i -= lowbit;
    }

    return sum;
  };

  addStep(
    3,
    `Create an empty tree of size ${n}`,
    `We start with ${n + 1} zeroed cells (slot 0 stays unused) and will build the structure by feeding in each array value as a point update.`,
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
    'Finish building the tree',
    `Every value from [${input.array.join(', ')}] has been folded in, so each cell now stores the sum of exactly the block it is responsible for.`,
    { n },
    getElements()
  );

  // Process operations if provided
  const ops = input.operations ?? [];
  for (const op of ops) {
    if (op.type === 'update' && op.index !== undefined && op.delta !== undefined) {
      addStep(
        5,
        `Run update at index ${op.index}`,
        `The operation asks us to add ${op.delta} at position ${op.index}, so we let the same upward climb ripple the change through every covering cell.`,
        { op: 'update', index: op.index, delta: op.delta },
        getElements(op.index, 'compare', { [op.index]: ['update'] })
      );
      updateFenwick(op.index, op.delta);
    } else if (op.type === 'query' && op.left !== undefined && op.right !== undefined) {
      addStep(
        19,
        `Run range query [${op.left}..${op.right}]`,
        `A Fenwick tree only knows prefix sums, so we compute the range as prefixQuery(${op.right}) minus prefixQuery(${op.left - 1}) — everything before position ${op.left} cancels out.`,
        { op: 'query', left: op.left, right: op.right },
        getElements()
      );

      const sumRight = queryFenwick(op.right);
      const sumLeftMinus1 = op.left > 1 ? queryFenwick(op.left - 1) : 0;
      const rangeSum = sumRight - sumLeftMinus1;

      addStep(
        20,
        `Range query [${op.left}..${op.right}] equals ${rangeSum}`,
        `Subtracting the two prefix sums leaves exactly our window: ${sumRight} - ${sumLeftMinus1} = ${rangeSum}.`,
        { left: op.left, right: op.right, sumRight, sumLeftMinus1, rangeSum },
        getElements()
      );
    }
  }

  addStep(
    20,
    'All operations complete',
    'We handled every update and query with just a handful of bit-hops each — that O(log n) cost per operation is the whole appeal of the Fenwick tree.',
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
    'A Binary Indexed Tree (Fenwick Tree) is a compact array-based structure that answers prefix-sum queries and applies point updates in O(log N) time. Each index i is responsible for a block of elements whose length equals its lowest set bit (i & -i), so updates and queries move through the array in short bit-arithmetic hops.',
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
  complexityAnalysis: {
    time: 'Every update and prefix query walks the implicit tree by repeatedly adding or stripping the lowest set bit of the index, and an index below n has at most log n set bits to hop through. So each operation touches O(log n) cells regardless of the data — best and worst case are identical. Building the tree by inserting all n values as point updates costs O(n log n) up front.',
    space: 'The whole structure is one flat array with a single cell per element (plus an unused slot 0), so extra memory grows linearly with the input — O(n).',
  },
  defaultInput: DEFAULT_FENWICK_INPUT,
  generateSteps: generateFenwickTreeSteps,
};
