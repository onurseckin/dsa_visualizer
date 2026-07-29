import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const SEGMENT_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>Segment Tree</strong> is a versatile tree-based data structure designed to answer range queries and execute point updates over an array of <code>N</code> elements in <code>O(log N)</code> time per operation. The root node represents the full array interval <code>[0 ... N-1]</code>. Each internal node recursively splits its interval into two equal halves: <code>[start ... mid]</code> and <code>[mid+1 ... end]</code>, precomputing and caching the aggregate value (such as sum, minimum, maximum, or GCD) of its subsegment.</p>",
  sections: [
    {
      heading: "Interval Hierarchy & Tree Topology",
      body: "<p>An array of <code>N</code> elements forms a binary tree of intervals containing roughly <code>2N - 1</code> total nodes. The tree is represented in a flat array of size <code>4N</code> using heap-style indexing:</p><ul><li>The root is at index <code>1</code> (covering range <code>[0 ... N-1]</code>).</li><li>For any node at index <code>v</code>, its left child is at <code>2v</code> (covering <code>[start ... mid]</code>) and its right child is at <code>2v + 1</code> (covering <code>[mid+1 ... end]</code>).</li><li>Leaf nodes at depth <code>&lceil;log<sub>2</sub> N&rceil;</code> hold single elements.</li></ul>",
    },
    {
      heading: "Point Updates & Ancestor Re-evaluation",
      body: "<p>Updating an array element at index <code>idx</code> to value <code>v</code> requires traversing the unique root-to-leaf path of length <code>O(log N)</code>:</p><ol><li>Descend to the target leaf where <code>start = end = idx</code>.</li><li>Mutate the leaf value: <code>tree[node] &larr; v</code>.</li><li>As recursion unwinds, recompute each ancestor's cached aggregate: <code>tree[node] = tree[2v] + tree[2v+1]</code>.</li></ol>",
    },
    {
      heading: "Range Query Mechanics & Pruning",
      body: "<p>A range query over <code>[L ... R]</code> evaluates three cases at each visited node:</p><ul><li><strong>Disjoint Range:</strong> Return the identity element (<code>0</code> for sum, <code>&infin;</code> for minimum).</li><li><strong>Complete Coverage:</strong> Return the precomputed node aggregate <code>tree[node]</code> immediately without searching deeper.</li><li><strong>Partial Overlap:</strong> Recurse into both left and right children and merge their partial contributions.</li></ul>",
    },
    {
      heading: "Segment Tree vs Fenwick Tree vs Sparse Table",
      body: "<p>Comparing range query data structures:</p><ul><li><strong>Segment Tree:</strong> <code>O(log N)</code> query, <code>O(log N)</code> update, <code>4N</code> space, supports any associative operation.</li><li><strong>Fenwick Tree:</strong> <code>O(log N)</code> query, <code>O(log N)</code> update, <code>N+1</code> space, requires invertible operations.</li><li><strong>Sparse Table:</strong> <code>O(1)</code> query, static only, <code>O(N log N)</code> space, requires idempotent operations.</li></ul>",
    },
    {
      heading: "Sizing & Optimization",
      body: "<p>Always allocate <code>4N</code> array slots for tree storage to prevent out-of-bounds access on non-power-of-2 input lengths. For range updates, defer sub-tree updates using a <code>lazy</code> array to maintain <code>O(log N)</code> complexity.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Canonical Decomposition",
      definition:
        "The minimal set of at most 2 log_2 N disjoint sub-intervals that together cover a query range [L ... R].",
    },
    {
      term: "Associative Merge",
      definition:
        "A binary operation f(a, b) satisfying f(f(a,b), c) = f(a, f(b,c)), allowing child values to be combined in any order.",
    },
    {
      term: "Identity Element",
      definition:
        "The neutral value returned for disjoint query branches (0 for sum, infinity for minimum).",
    },
    {
      term: "Heap-style Indexing",
      definition:
        "Storing tree nodes in a flat array where node v has left child 2v and right child 2v+1.",
    },
  ],
};

export const SEGMENT_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the SegmentTree class — a binary tree over array intervals where every node caches the sum of the range it covers.",
    2: "The constructor takes the raw array and kicks off construction.",
    3: "Records n, the array length, since every recursive call needs to know the valid index range.",
    4: "Allocates 4*n zeroed slots for the flat, heap-indexed tree — oversized because an uneven n can push the deepest node index past 2n.",
    5: "Kicks off the recursive build, rooted at node 1, covering the whole array from index 0 to n-1.",
    6: "Blank line separating constructor.",
    7: "Defines build(node, start, end): recursively fills in the node responsible for the interval [start, end].",
    8: "Checks whether the interval has shrunk to one element — the base case where recursion must stop.",
    9: "A single-element interval is a leaf: it just stores that element's value directly, with no children to combine.",
    10: "Returns immediately once a leaf is set — there's nothing further to compute in the base case.",
    11: "Splits the current interval at its midpoint, dividing it into a left half and a right half of roughly equal size.",
    12: "Recursively builds the left child, covering [start, mid].",
    13: "Recursively builds the right child, covering [mid+1, end].",
    14: "Once both children are built, this node's cached value is just the sum of its two children — a parent never has to look further than one level down.",
    15: "Blank line separating build method.",
    16: "Defines update(node, start, end, idx, val): walks a single root-to-leaf path to change one array element, then repairs cached sums on the way back up.",
    17: "Checks whether this node is the leaf for the target index — again, the base case.",
    18: "At the target leaf, overwrites the stored value directly.",
    19: "Returns once the leaf is updated — the caller's frame still needs to recompute its own cached sum, which happens after this recursive call returns.",
    20: "Computes the midpoint to decide which half contains idx.",
    21: "Checks whether the target index falls in the left half.",
    22: "If so, recurses only into the left child — the right subtree is provably unaffected and stays untouched.",
    23: "Otherwise the index must be in the right half.",
    24: "Recurses into the right child instead.",
    25: "After the recursive call returns, recombines this node's value from its two now-current children — this keeps every ancestor on the path consistent after a single leaf changed.",
    26: "Blank line separating update method.",
    27: 'Defines query(node, start, end, l, r): answers "what is the sum over [l, r]?" by descending only into branches that actually overlap the query.',
    28: "If this node's entire interval falls outside [l, r], it can't contribute anything.",
    29: "Returns 0 — the identity value for sum — so a fully-disjoint branch adds nothing to the result.",
    30: "If this node's entire interval falls inside [l, r], the query is fully answered by this one cached value with no need to look at any descendant.",
    31: "Returns the cached sum directly — this early return, whenever it fires, is what keeps queries logarithmic instead of linear.",
    32: "Otherwise the query range only partially overlaps this node's interval, so the work has to be split between both children.",
    33: "Recurses into the left child, asking it for its share of the overlap.",
    34: "Recurses into the right child, asking it for its share of the overlap.",
    35: "Combines the two partial answers into this subtree's total contribution to the range query.",
  },
};
