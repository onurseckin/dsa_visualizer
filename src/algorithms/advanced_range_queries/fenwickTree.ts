import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

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

const FENWICK_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    'A Fenwick tree, also called a binary indexed tree, is a compact array that keeps running totals of a changing sequence so you can still answer prefix-sum questions almost instantly. It exists to resolve a tension: a precomputed prefix-sum table answers queries in one step but must be rebuilt after every edit, while the raw array is trivial to edit but slow to sum. The Fenwick tree stores partial sums over cleverly chosen blocks so that any prefix is a handful of blocks and any single position belongs to only a handful of blocks. Remarkably, the entire structure is navigated with one bit trick on the index itself.',
  sections: [
    {
      heading: 'The trade-off it resolves',
      body: 'Consider the two obvious ways to answer the question of what the first k elements sum to. You can precompute every prefix sum, which makes queries free but forces you to rewrite the whole tail of that table whenever one element changes. Or you can keep the raw array and add up k values on demand, which makes edits free but queries slow. A Fenwick tree refuses to pick a side: it stores sums over blocks chosen so that any prefix is the disjoint union of a few blocks, and any single position sits inside only a few blocks. That symmetry between the two directions is exactly why both edits and queries stay cheap.',
    },
    {
      heading: 'The lowbit decides who owns what',
      body: 'Cell i of the tree stores the sum of a block that ends at position i and whose length is i & -i, the value of the lowest set bit of i. So cell 6, binary 110 with lowbit 2, covers positions 5 and 6, while cell 8, binary 1000 with lowbit 8, covers positions 1 through 8. To read a prefix sum up to i you repeatedly strip the lowbit with i -= i & -i, which walks leftward through blocks that tile the range 1 to i exactly once each. To apply a change at position i you repeatedly add the lowbit with i += i & -i, which visits precisely the cells whose blocks contain i. The two loops travel in opposite directions through the same bit structure, which is why each is only four lines long.',
    },
    {
      heading: 'Why the blocks tile perfectly',
      body: 'The invariant is that the blocks you reach by stripping lowbits from i have lengths matching the set bits of i, so together they cover positions 1 through i with no gap and no overlap. Stripping the lowest set bit subtracts the smallest power of two present in i, so every hop consumes one bit and the loop runs once per set bit. Update correctness is the mirror image: the cells reached by adding the lowbit are exactly the blocks that contain position i, so adding the delta to each keeps every stored block sum truthful. Because both walks agree about which block owns which position, a query issued right after an update sees the change exactly once, never twice and never zero times.',
    },
    {
      heading: 'When to reach for it',
      body: 'Choose a Fenwick tree when your aggregate is invertible, such as sums, counts, or XOR, and you need point updates together with prefix or range queries. It is smaller, faster in practice, and far shorter to write than a segment tree, which makes it the default tool for counting inversions, maintaining frequency tables, and order statistics over compressed values. The catch is invertibility: range sums work because you subtract the prefix ending before the left bound, but a range minimum has no subtraction, so a Fenwick tree cannot answer it in general. Once you need non-invertible merges, arbitrary range updates, or descents guided by complicated predicates, move up to a segment tree.',
    },
    {
      heading: 'Indexing traps and edge cases',
      body: 'The structure is one-indexed, and that is not a stylistic preference: cell 0 has a lowbit of zero, so the update loop would never advance, which is why slot 0 stays permanently unused. That means a user-facing index 0 becomes tree index 1, and a range query must subtract the prefix up to the left bound minus one, short-circuiting to zero when the left bound is already 1. Building by n separate point updates is correct but wasteful; you can instead copy the values in and let each cell push its total into cell i plus its lowbit in a single linear pass. Finally, remember the update takes a delta, not a target value, so assigning a new value means updating by the difference from the old one.',
    },
    {
      heading: 'Variations built on the same trick',
      body: 'Because the loops only care about combining block values, you can swap sums for XOR or counts without touching them. Two Fenwick trees side by side extend the structure to range updates with range queries: one holds a linear coefficient and the other a constant, and the pair reconstructs any prefix of the correction. Nesting the idea produces a two-dimensional Fenwick tree, where each cell of the outer tree holds an entire inner tree and rectangle sums on a grid become possible. And by walking bits from the highest downward instead of the lowest, you can binary-search inside the tree for the smallest prefix whose sum reaches a target, turning it into an order-statistics structure.',
    },
  ],
  keyTerms: [
    {
      term: 'Prefix sum',
      definition:
        'The total of the first k elements of a sequence. Nearly every range question reduces to two prefix sums, since the sum over a window equals the prefix at its right end minus the prefix just before its left end.',
    },
    {
      term: 'Lowbit (i & -i)',
      definition:
        'The value of the lowest set bit of i, equivalently the largest power of two dividing it. It is both the length of the block that cell i is responsible for and the step size that moves you to the next relevant cell.',
    },
    {
      term: 'Responsibility range',
      definition:
        'The contiguous slice of the original array whose sum a given tree cell stores. It always ends at that cell index and contains exactly lowbit many elements.',
    },
    {
      term: 'Point update',
      definition:
        'Changing a single position by a delta. In a Fenwick tree the change ripples upward through every cell whose block contains that position.',
    },
    {
      term: 'Invertible aggregate',
      definition:
        'An operation that has an inverse, like addition paired with subtraction, which is what lets a window answer be assembled from two prefix answers. Minimum and maximum are not invertible, so Fenwick trees do not handle them directly.',
    },
  ],
};

const FENWICK_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Declares the FenwickTree class — a compact array that answers prefix-sum queries and point updates in O(log n) using bit tricks on the index.',
    2: 'The constructor takes the number of elements the tree will cover.',
    3: 'Allocates size + 1 zeroed cells, one-indexed so index 0 is deliberately unused — it has no set bits, and the update/query hops would never move past it.',
    5: 'Defines update(index, delta): applies a change at one position and ripples it through every cell whose responsibility range covers that position.',
    6: 'Starts the climb at the target index — the position being changed.',
    7: 'Keeps climbing as long as i is still inside the tree array.',
    8: "Folds delta into tree[i]: this cell's cached block-sum must include the change at the original index.",
    9: "Adds i's lowbit (i & -i) to jump to the next cell whose block also covers the original index — this bit trick is what keeps the climb to O(log n) cells.",
    11: 'Defines query(index): returns the prefix sum of everything from position 1 up to index.',
    12: 'Starts the running total at zero before folding in any blocks.',
    13: 'Starts the descent at the given index.',
    14: 'Keeps descending while i is still a valid, positive index — this loop also strips one bit per iteration, so it runs O(log n) times.',
    15: "Adds tree[i]'s cached block-sum into the running total — this cell owns the block ending at i.",
    16: "Subtracts i's lowbit to move to the previous, disjoint block, guaranteeing no position is ever counted twice.",
    17: 'Returns the accumulated prefix sum once the descent reaches 0.',
    19: 'Defines range_query(left, right): the tree only knows how to answer prefix sums, so any arbitrary range has to be built from two of them.',
    20: 'Computes the range sum as query(right) minus query(left - 1) — subtracting off everything before the window cancels out whatever lies outside [left, right].',
  },
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
  topicGuide: FENWICK_TREE_TOPIC_GUIDE,
  trivia: FENWICK_TREE_TRIVIA,
  defaultInput: DEFAULT_FENWICK_INPUT,
  generateSteps: generateFenwickTreeSteps,
};
