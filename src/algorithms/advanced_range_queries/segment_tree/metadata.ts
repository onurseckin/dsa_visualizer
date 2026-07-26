import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const SEGMENT_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A segment tree is a binary tree of intervals laid over an array: the root owns the whole array, every internal node splits its interval in half between two children, and every leaf owns a single element. Each node caches the answer for its own interval, here the sum, so a question about an arbitrary range can be assembled from a few cached answers instead of scanning elements one by one. Because the tree is only about log n levels deep, reading a range and changing an element both stay cheap even when the array is edited constantly. It is the general-purpose workhorse of range queries, and a surprising number of range problems turn out to be a segment tree in disguise.",
  sections: [
    {
      heading: "Intervals as a designed cache",
      body: "There are roughly n squared possible query ranges, so precomputing all of them is hopeless, but you never actually need all of them. The insight is to precompute answers for one carefully chosen family of about 2n intervals, namely the halving structure of a binary tree, because any range can then be cut into at most two of those intervals per level. The tree is therefore a cache whose entries were picked so that arbitrary questions are covered by very few of them. Building it is a single post-order traversal in which each node takes the merge of its two children, so construction touches every node exactly once and never revisits it.",
    },
    {
      heading: "How a query descends",
      body: "A query for a range starts at the root and asks each node one of three questions. If the node interval is disjoint from the query range you return the identity value, zero for sums, and stop, because that branch contributes nothing. If the node interval lies entirely inside the query range you return its cached value immediately without looking at a single leaf, and this is the step that makes the query fast. Otherwise the range straddles the midpoint, so you recurse into both children and merge whatever they report. An update is simpler still: you walk the one path down to the target leaf, write the new value there, and recompute each ancestor from its two children as the recursion unwinds.",
    },
    {
      heading: "The invariant that keeps it honest",
      body: "Every node holds one promise: its stored value equals the merge of the values stored by its two children, and for a leaf it equals the array element itself. Building establishes that promise bottom-up, and an update breaks it only along a single root-to-leaf path before immediately repairing it on the way back up. Query correctness then follows from the promise plus the fact that the fully covered nodes where recursion stops partition the query range exactly, so no element is counted twice and none is missed. Almost every segment tree bug is a violated promise somewhere: a node whose cached value was never recomputed after a descendant changed.",
    },
    {
      heading: "Choosing it over the alternatives",
      body: "If the array never changes, do not build a segment tree, because a plain prefix-sum array or a sparse table answers the same queries faster and in far less code. If it does change but the aggregate is invertible and only point updates are needed, a Fenwick tree does the job in a quarter of the lines. Reach for a segment tree when the merge is not invertible, as with minimum, maximum, or greatest common divisor, when you need to descend into the structure searching for a position, or when range updates with lazy propagation are on the horizon. Its real advantage is generality: it works for any associative merge that has an identity, and each node can hold a rich summary rather than a single number.",
    },
    {
      heading: "Implementation pitfalls",
      body: "The flat layout puts the root at index 1 and gives node v children 2v and 2v plus 1, which is convenient but needs an array of size 4n rather than 2n, because when n is not a power of two the tree is uneven and the deepest indices overshoot. Recursion must carry the interval bounds along, since a node index by itself does not reveal what it covers. Mind the split: the left child takes start through mid and the right takes mid plus 1 through end, and getting that wrong creates overlapping intervals that double-count elements. The disjoint case must return a genuine identity for your merge, zero for sums or positive infinity for minimum, because a wrong neutral value corrupts results silently rather than crashing.",
    },
    {
      heading: "The same skeleton, different payloads",
      body: "Once the traversal exists, changing what a node stores changes what the tree can answer. Store a minimum along with how many times it occurs and you can ask how often the smallest value in a range appears. Store the best prefix, best suffix, best subarray, and total sum and you get maximum-subarray queries over any range, the classic example of storing just enough to make merging possible. Store a sorted list at each node and you get a merge-sort tree that counts how many values in a range fall below a threshold. The mental move never changes: ask what a parent needs from its children in order to answer the question, then store exactly that.",
    },
  ],
  keyTerms: [
    {
      term: "Node interval",
      definition:
        "The contiguous slice of the array that a node is responsible for. The root covers everything, each internal node splits its slice at the midpoint, and every leaf covers one element.",
    },
    {
      term: "Merge function",
      definition:
        "The rule that computes a parent's value from its two children, addition in this implementation. It must be associative, because the tree groups elements in whatever way its intervals dictate rather than in query order.",
    },
    {
      term: "Identity element",
      definition:
        "The value a disjoint branch returns so it cannot affect the answer, such as zero for sums or positive infinity for minimums. An associative merge plus an identity is precisely what a segment tree requires.",
    },
    {
      term: "Canonical decomposition",
      definition:
        "The set of fully covered nodes at which a query stops recursing. There are at most two per level of the tree, which is why a query visits only a logarithmic number of nodes.",
    },
    {
      term: "Heap-style indexing",
      definition:
        "Storing the tree in a flat array with the root at index 1 and node v children at 2v and 2v plus 1. It avoids pointers entirely at the cost of allocating roughly 4n slots.",
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
    7: "Defines build(node, start, end): recursively fills in the node responsible for the interval [start, end].",
    8: "Checks whether the interval has shrunk to one element — the base case where recursion must stop.",
    9: "A single-element interval is a leaf: it just stores that element's value directly, with no children to combine.",
    10: "Returns immediately once a leaf is set — there's nothing further to compute in the base case.",
    11: "Splits the current interval at its midpoint, dividing it into a left half and a right half of roughly equal size.",
    12: "Recursively builds the left child, covering [start, mid].",
    13: "Recursively builds the right child, covering [mid+1, end].",
    14: "Once both children are built, this node's cached value is just the sum of its two children — a parent never has to look further than one level down.",
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
