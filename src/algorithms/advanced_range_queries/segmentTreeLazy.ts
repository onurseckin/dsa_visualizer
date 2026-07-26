import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  TopicGuide,
  TreeNodeItem,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

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
        what: 'Check the input array',
        why: 'The input array is empty, so there is no tree to build — we stop here.',
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
    'Set up the tree and lazy arrays',
    `We allocate 4 x ${n} = ${maxTreeNodes} slots for interval sums plus a parallel lazy array; the lazy tags will let us postpone range updates instead of touching every element right away.`,
    { n }
  );

  // Build tree recursion
  const buildTree = (node: number, start: number, end: number) => {
    addStep(
      7,
      `Visit node ${node} for range [${start}..${end}]`,
      start === end
        ? `This interval is down to a single element, so node ${node} becomes a leaf holding arr[${start}] = ${input.array[start]}.`
        : `This interval still spans several elements, so we split it in half and build both children before this node can know its sum.`,
      { node, start, end },
      { [node]: 'compare' }
    );

    if (start === end) {
      treeValues[node] = input.array[start];
      addStep(
        9,
        `Store ${treeValues[node]} in leaf ${node}`,
        `This leaf now answers exactly index ${start}; its lazy slot stays 0 because leaves have no children to defer work to.`,
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
      `Sum the children into node ${node}`,
      `With both halves built, node ${node} caches ${treeValues[2 * node]} + ${treeValues[2 * node + 1]} = ${treeValues[node]} for range [${start}..${end}].`,
      { node, start, end, val: treeValues[node] },
      { [node]: 'active', [2 * node]: 'sorted', [2 * node + 1]: 'sorted' }
    );
  };

  buildTree(1, 0, n - 1);

  addStep(
    14,
    'Finish building the tree',
    `The root holds the full sum ${treeValues[1]}, and every lazy tag starts at 0 — no work is pending anywhere yet.`,
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
        `Push lazy tag ${val} down from node ${node}`,
        `Before working below node ${node} we settle its deferred update: the left child's sum grows by ${val * leftCount} and the right child's by ${val * rightCount}, each inheriting the tag for its own children, and lazy[${node}] resets to 0.`,
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
        `Skip node ${node} — outside update range`,
        `Its range [${start}..${end}] doesn't touch [${l}..${r}], so nothing in this branch needs to change.`,
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
        `Apply the update lazily at node ${node}`,
        `Its whole range [${start}..${end}] is being increased, so we bump this sum by ${count} x ${val} = ${addTotal} and ${
          start !== end
            ? `park lazy[${node}] = ${lazyValues[node]} for the children to pick up later — we never descend further`
            : 'since this is a leaf there are no children to notify'
        }.`,
        { node, start, end, count, val, newSum: treeValues[node], lazyVal: lazyValues[node] },
        { [node]: 'sorted' },
        `Range Update [${l}..${r}] += ${val}`
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      39,
      `Split the update at node ${node}`,
      `Only part of [${start}..${end}] falls inside [${l}..${r}], so we recurse into the left half [${start}..${mid}] and the right half [${mid + 1}..${end}] and let each handle its own overlap.`,
      { node, start, end, l, r, mid },
      { [node]: 'compare' },
      `Range Update [${l}..${r}] += ${val}`
    );

    updateRange(2 * node, start, mid, l, r, val);
    updateRange(2 * node + 1, mid + 1, end, l, r, val);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      41,
      `Refresh node ${node}'s sum to ${treeValues[node]}`,
      `With both children settled we recombine ${treeValues[2 * node]} + ${treeValues[2 * node + 1]} so this node's cached sum stays honest.`,
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
        `Skip node ${node} — no overlap`,
        `Its range [${start}..${end}] lies entirely outside the query [${l}..${r}], so this branch contributes 0.`,
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
        `Take node ${node}'s sum ${treeValues[node]}`,
        `Its whole range [${start}..${end}] sits inside the query [${l}..${r}], and any pending tags above it were already pushed down on the way here, so the cached sum ${treeValues[node]} is up to date.`,
        { node, start, end, l, r, sum: treeValues[node] },
        { [node]: 'sorted' },
        `Range Query [${l}..${r}]`
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      53,
      `Split the query at node ${node}`,
      `The target [${l}..${r}] only partially covers [${start}..${end}], so we ask the left child about [${start}..${mid}] and the right child about [${mid + 1}..${end}].`,
      { node, start, end, l, r, mid },
      { [node]: 'compare' },
      `Range Query [${l}..${r}]`
    );

    const leftSum = queryRange(2 * node, start, mid, l, r);
    const rightSum = queryRange(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addStep(
      56,
      `Combine partial sums at node ${node}`,
      `The left branch reported ${leftSum} and the right branch reported ${rightSum}, so this subtree contributes ${result} to the query.`,
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
        `Start range update [${op.left}..${op.right}] += ${val}`,
        `Rather than visiting all ${op.right - op.left + 1} elements one by one, we descend only until an interval fits entirely inside the range and record the addition lazily there.`,
        { op: 'rangeUpdate', left: op.left, right: op.right, value: val },
        undefined,
        `Range Update [${op.left}..${op.right}] += ${val}`
      );

      updateRange(1, 0, n - 1, op.left, op.right, val);

      addStep(
        42,
        `Finish range update [${op.left}..${op.right}]`,
        `The additions are all accounted for — some applied directly, some parked in lazy tags — and the root's total now reads ${treeValues[1]}.`,
        { newRootSum: treeValues[1] },
        undefined,
        'Update Complete'
      );
    } else if (isQuery) {
      addStep(
        44,
        `Start range query [${op.left}..${op.right}]`,
        `We descend toward the covered intervals, pushing any pending lazy tags down as we pass so every sum we read is current.`,
        { op: 'rangeQuery', left: op.left, right: op.right },
        undefined,
        `Range Query [${op.left}..${op.right}]`
      );

      const totalSum = queryRange(1, 0, n - 1, op.left, op.right);

      addStep(
        57,
        `Range query [${op.left}..${op.right}] equals ${totalSum}`,
        `The covered intervals sum to ${totalSum}, and lazy work was only performed along the paths we actually walked.`,
        { left: op.left, right: op.right, totalSum },
        undefined,
        'Query Complete'
      );
    }
  }

  addStep(
    57,
    'All operations complete',
    'Every range update and query finished in O(log n) node visits — deferring work with lazy tags is what made whole-range updates that cheap.',
    { finalRootSum: treeValues[1] },
    undefined,
    'All Done'
  );

  return steps;
};

const SEGMENT_TREE_LAZY_TOPIC_GUIDE: TopicGuide = {
  overview:
    'Lazy propagation is the technique that lets a segment tree modify an entire range as cheaply as it reads one value. Instead of pushing an update down to every affected leaf, you stop at the highest nodes fully covered by the range, fix their aggregates on the spot, and leave a note saying that their descendants still owe this change. That note, the lazy tag, is only paid off later, when some other operation genuinely needs to walk into the subtree below it. The payoff is a structure where range add, range assign, and range query all cost the same small logarithmic amount of work.',
  sections: [
    {
      heading: 'Why a plain segment tree stalls',
      body: 'In an ordinary segment tree, adding a value to every element of a wide range means rewriting each leaf in the range and repairing all their ancestors, which is linear work. But notice that you never need the leaves to be correct; you only need every answer you eventually report to be correct. If a node\'s whole interval receives the same addition, you can adjust that node\'s cached sum by the value times its interval length in one arithmetic step, and the node is instantly truthful again. The only unfinished business is its children, and right now nobody is looking at them. Lazy propagation is the discipline of writing that unfinished business down instead of doing it.',
    },
    {
      heading: 'The contract a lazy tag makes',
      body: 'A tag on a node means one specific thing: my own aggregate already includes this pending change, but my children know nothing about it. That deliberate asymmetry is the whole design, and it is why you must push before you descend. Pushing down takes the parent\'s tag, applies it to each child\'s aggregate scaled by that child\'s interval length, since adding a value across k elements raises their sum by the value times k, merges it into the child\'s own tag, and then clears the parent\'s tag. After the push the parent is unchanged and both children are individually truthful, so recursion can safely continue downward.',
    },
    {
      heading: 'Correctness by local truth',
      body: 'The invariant to hold in your head is that every node\'s aggregate is correct for its own interval at all times, while its tag records only what the subtree beneath it has yet to receive. A range update preserves this because covered nodes are fixed directly and tagged, and straddling nodes push down, recurse, then recompute themselves from their now-correct children. A range query preserves it too, because it pushes down before reading anything beneath a tagged node. Since every value you ever read comes from a locally truthful node, the answers are exact even though most of the tree is deliberately out of date.',
    },
    {
      heading: 'Composing tags, and when order matters',
      body: 'Range addition is forgiving because additions commute: two pending adds merge by summing them, so a tag can be a single number. Range assignment is not forgiving, because assigning three and then adding one differs from adding one and then assigning three, so a tag must carry enough structure to represent the composition, typically an optional assignment followed by an addition. Before writing any lazy tree, check two things: that your tag type is closed under composition, and that applying a tag to a node can be done in constant time from the interval length alone. If either fails, no amount of pushing will rescue you and you need to redesign what each node summarizes.',
    },
    {
      heading: 'Where it goes wrong in practice',
      body: 'The most common bug is descending without pushing first, which lets a child answer with a stale aggregate. The second is dropping the interval-length factor, which is invisible on ranges of size one and then quietly wrong everywhere else. Leaves need care because they have no children, so tagging a leaf accomplishes nothing and in some formulations does harm; apply the change and stop there. And after recursing into children you must recompute the current node from them, otherwise the parent keeps a sum that predates the update it just performed.',
    },
    {
      heading: 'The deferral pattern generalizes',
      body: 'Once you can defer work, whole families of problems open up: range assign with range sum, range add with range minimum, range multiply and add for affine transformations, and flipping a range of bits while tracking how many are set. The same reasoning powers persistent and implicit segment trees, where subtrees are created lazily only when a range is actually touched, letting you index enormous coordinate spaces. Outside data structures the idea recurs constantly: record work as pending at the coarsest level that can express it, and materialize the detail only when someone looks. If you can define how a tag applies to an aggregate and how two tags compose, you can make almost any segment tree lazy.',
    },
  ],
  keyTerms: [
    {
      term: 'Lazy tag',
      definition:
        'A pending modification parked at a node. It is already reflected in that node\'s own aggregate but has not yet reached any of its descendants.',
    },
    {
      term: 'Push down',
      definition:
        'Transferring a node\'s tag to both children by applying it to their aggregates and merging it into their tags, then clearing it. It must happen before any descent below a tagged node.',
    },
    {
      term: 'Covering node',
      definition:
        'A node whose interval lies entirely inside the update or query range. Updates stop descending here, and that early stop is where all the savings come from.',
    },
    {
      term: 'Tag composition',
      definition:
        'The rule for merging a new pending change into one that is already waiting. Additions compose by summing, while assignments overwrite, which is why assignment tags must be ordered carefully.',
    },
    {
      term: 'Interval-length scaling',
      definition:
        'The factor that converts a per-element change into its effect on an aggregate over a whole interval. Adding a value to k elements raises their sum by the value times k.',
    },
  ],
};

const SEGMENT_TREE_LAZY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Declares the SegmentTreeLazy class, extending the plain segment tree with a parallel lazy array so range updates don\'t have to touch every leaf.',
    2: 'The constructor takes the initial array and builds both the sum tree and the (initially empty) lazy tags.',
    3: "Records n, the array length, since every recursive call's bounds are checked against it.",
    4: 'Allocates 4*n zeroed slots for the sum tree — the same oversized flat layout as the plain segment tree.',
    5: 'Allocates a same-sized lazy array — lazy[node] holds a pending change already reflected in tree[node] but not yet pushed to its children.',
    6: 'Kicks off construction, rooted at node 1, covering the whole array — every lazy tag starts at 0 since nothing is pending yet.',
    8: "Defines build(node, start, end): identical to the plain segment tree's build — lazy propagation only changes how updates and queries behave, not how the tree is constructed.",
    9: "Checks whether this interval has shrunk to a single element — the recursion's base case.",
    10: "A leaf just stores its one array value directly.",
    11: 'Returns once the leaf is set.',
    12: 'Splits the interval at its midpoint into a left half and a right half.',
    13: 'Recursively builds the left child.',
    14: 'Recursively builds the right child.',
    15: "Combines both children's sums into this node's cached value, exactly as in the non-lazy tree.",
    17: "Defines push(node, start, end): clears a pending lazy tag by transferring it to this node's two children before anyone descends past this node.",
    18: 'Only does work if this node actually has a pending tag — a zero lazy value means nothing is owed.',
    19: "Computes the midpoint so each child's share of the interval — and how many elements it covers — is known.",
    20: "Merges the parent's pending change into the left child's own lazy tag, since the left child may already have unrelated pending work of its own.",
    21: "Applies the pending change to the left child's cached sum, scaled by (mid - start + 1) — its element count — because adding a value to k elements raises their sum by value times k.",
    22: "Merges the same pending change into the right child's lazy tag.",
    23: "Applies it to the right child's cached sum too, scaled by its own element count (end - mid).",
    24: 'Clears this node\'s lazy tag to 0 — the debt has been paid to both children, so this node owes nothing further.',
    26: "Defines update_range(node, start, end, l, r, val): adds val to every element in [l, r], stopping early at any node fully covered by the range instead of visiting every leaf.",
    27: "Before doing anything else here, checks whether this node has a pending tag that would make its children's data stale — only relevant for a non-leaf, since a leaf has no children to push to.",
    28: 'Pushes that pending tag down first, so any decision made below this point is based on up-to-date children.',
    30: "If this node's interval doesn't overlap [l, r] at all, there's nothing to update here.",
    31: 'Returns immediately — a disjoint branch is left completely untouched.',
    33: "If this node's entire interval sits inside [l, r], the update can be applied and recorded right here without descending any further.",
    34: "Adds val times this interval's element count directly to the cached sum — the interval-length scaling that keeps the aggregate honest without touching individual elements.",
    35: 'Only a non-leaf needs to remember the debt for its children — a leaf has none to notify.',
    36: 'Records val as this node\'s own pending lazy tag, to be pushed down whenever some later operation actually needs to look inside this subtree.',
    37: 'Returns — this early exit is what keeps whole-range updates logarithmic instead of linear.',
    39: 'Otherwise the range only partially overlaps, so the update must be split between both children — computes the midpoint to know where.',
    40: "Recurses the update into the left child's portion of the overlap.",
    41: "Recurses the update into the right child's portion of the overlap.",
    42: "Recomputes this node's cached sum from its two children, now that at least one of them has actually changed.",
    44: 'Defines query_range(node, start, end, l, r): sums every element in [l, r], pushing down any pending tags it needs to pass through along the way.',
    45: "If this node's interval doesn't overlap [l, r] at all, it can't contribute to the answer.",
    46: 'Returns 0 — the identity value for a sum — for a fully-disjoint branch.',
    48: "Checks whether there's a pending tag to resolve before reading or descending into this node's children — again only for a non-leaf, since a leaf has no children to mislead.",
    49: "Pushes the tag down so the values this call is about to read — its own cached sum, or its children's — are current.",
    51: "If this node's entire interval sits inside [l, r], its cached sum — now guaranteed up to date — answers this whole subtree's contribution directly.",
    52: 'Returns that cached sum without visiting a single child — the same early-exit pruning that makes segment tree queries fast.',
    54: 'Otherwise the query only partially overlaps this node, so computes the midpoint to split the question between children.',
    55: 'Recurses into the left child for its share of the range.',
    56: 'Recurses into the right child for its share of the range.',
    57: "Adds the two partial sums together as this subtree's total contribution to the query.",
  },
};

export const segmentTreeLazy: AlgorithmDefinition<SegmentTreeLazyInput> = {
  id: 'segment-tree-lazy',
  title: 'Segment Tree (Lazy Propagation)',
  category: 'advanced_range_queries',
  difficulty: 'Hard',
  description:
    'A Segment Tree with Lazy Propagation supports both range updates and range sum queries in O(log N) time. Instead of touching every element in an updated range, it records the pending change as a lazy tag on the highest covering nodes and pushes those tags down only when a later query or update actually walks into the affected subtree.',
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
  complexityAnalysis: {
    time: 'A range update no longer visits every element in the range: once a node\'s interval fits entirely inside the update, we adjust its sum, leave a lazy tag, and stop descending. Each level halves the interval, so both range updates and range queries touch only O(log n) nodes; pending tags get pushed down one level at a time as later operations pass through. Building the tree once up front is O(n).',
    space: 'We keep two arrays of about 4n entries each — the interval sums and their lazy tags — so memory grows linearly with the input, O(n).',
  },
  topicGuide: SEGMENT_TREE_LAZY_TOPIC_GUIDE,
  trivia: SEGMENT_TREE_LAZY_TRIVIA,
  defaultInput: DEFAULT_SEGMENT_TREE_LAZY_INPUT,
  generateSteps: generateSegmentTreeLazySteps,
};
