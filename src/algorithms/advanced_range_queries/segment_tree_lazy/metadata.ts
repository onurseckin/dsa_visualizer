import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const SEGMENT_TREE_LAZY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Lazy Propagation turns the linear-time bottleneck of range updates on a plain segment tree into a fast O(log N) operation. Instead of immediately pushing an update all the way down to individual leaves, a node that sits entirely inside the update interval takes the change on its cached sum and records a lazy tag to remember that its descendants are owed the same change. Those pending tags are pushed down to children only when a subsequent query or update actually needs to walk deeper into that subtree.",
  sections: [
    {
      heading: "Deferred Work and The Lazy Tag",
      body: "When updating a whole interval like 2 to 5, any tree node whose range fits completely inside 2 to 5 already knows how many elements it covers. Adding val to each element in a k element node raises that node sum by val times k. We apply that total increment to the node sum immediately, store val in its lazy tag, and stop. The leaves underneath never get touched during this step because their updates are deferred until someone asks to read or modify them.",
    },
    {
      heading: "The Push Operation Paying Deferred Debt",
      body: "A lazy tag on a node means I have updated my own sum but my children have not heard about it yet. Whenever a later query or update must recurse into a node children, it calls push first. Push transfers the node lazy tag to its left and right children, adjusts their cached sums by their respective interval lengths, and zeroes out the node own tag. By pushing tags down strictly on demand, we preserve correctness without ever doing unnecessary work.",
    },
    {
      heading: "Range Updates versus Single Element Updates",
      body: "A single element update on a plain segment tree takes logarithmic time because only one path of nodes is visited. Updating a range without lazy propagation would repeat that path for all elements in the range, taking linear time. With lazy propagation, a range update visits only the boundary nodes where the range intersects interval edges, giving a true logarithmic upper bound regardless of how large the range is.",
    },
    {
      heading: "Common Pitfalls and Implementation Details",
      body: "Always call push before recursing into children during both updates and queries, otherwise you will read stale values. A push call on a leaf does nothing because a leaf has no children to receive tags. If a node already has a pending tag from a previous update, a new tag must accumulate into it. Sum segment trees multiply the lazy tag by interval length while min or max segment trees do not scale by interval length.",
    },
  ],
  keyTerms: [
    {
      term: "Lazy Tag",
      definition:
        "A pending change stored on a node that has already updated its own cached aggregate but has not yet forwarded that change to its descendants.",
    },
    {
      term: "Push down",
      definition:
        "The operation that transfers a node's pending lazy tag down to its immediate left and right children, applying the change to their cached values and resetting the parent's tag to zero.",
    },
    {
      term: "Fully Covered Interval",
      definition:
        "A node whose interval lies entirely inside the update or query range. Updates stop descending here, and that early stop is where all the savings come from.",
    },
    {
      term: "Tag composition",
      definition:
        "The rule for merging a new pending change into one that is already waiting. Additions compose by summing, while assignments overwrite, which is why assignment tags must be ordered carefully.",
    },
    {
      term: "Interval-length scaling",
      definition:
        "The factor that converts a per-element change into its effect on an aggregate over a whole interval. Adding a value to k elements raises their sum by the value times k.",
    },
  ],
};

export const SEGMENT_TREE_LAZY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the SegmentTreeLazy class, extending the plain segment tree with a parallel lazy array so range updates don't have to touch every leaf.",
    2: "The constructor takes the initial array and builds both the sum tree and the (initially empty) lazy tags.",
    3: "Records n, the array length, since every recursive call's bounds are checked against it.",
    4: "Allocates 4*n zeroed slots for the sum tree — the same oversized flat layout as the plain segment tree.",
    5: "Allocates a same-sized lazy array — lazy[node] holds a pending change already reflected in tree[node] but not yet pushed to its children.",
    6: "Kicks off construction, rooted at node 1, covering the whole array — every lazy tag starts at 0 since nothing is pending yet.",
    8: "Defines build(node, start, end): identical to the plain segment tree's build — lazy propagation only changes how updates and queries behave, not how the tree is constructed.",
    9: "Checks whether this interval has shrunk to a single element — the recursion's base case.",
    10: "A leaf just stores its one array value directly.",
    11: "Returns once the leaf is set.",
    12: "Splits the interval at its midpoint into a left half and a right half.",
    13: "Recursively builds the left child.",
    14: "Recursively builds the right child.",
    15: "Combines both children's sums into this node's cached value, exactly as in the non-lazy tree.",
    17: "Defines push(node, start, end): clears a pending lazy tag by transferring it to this node's two children before anyone descends past this node.",
    18: "Only does work if this node actually has a pending tag — a zero lazy value means nothing is owed.",
    19: "Computes the midpoint so each child's share of the interval — and how many elements it covers — is known.",
    20: "Merges the parent's pending change into the left child's own lazy tag, since the left child may already have unrelated pending work of its own.",
    21: "Applies the pending change to the left child's cached sum, scaled by (mid - start + 1) — its element count — because adding a value to k elements raises their sum by value times k.",
    22: "Merges the same pending change into the right child's lazy tag.",
    23: "Applies it to the right child's cached sum too, scaled by its own element count (end - mid).",
    24: "Clears this node's lazy tag to 0 — the debt has been paid to both children, so this node owes nothing further.",
    26: "Defines update_range(node, start, end, l, r, val): adds val to every element in [l, r], stopping early at any node fully covered by the range instead of visiting every leaf.",
    27: "Before doing anything else here, checks whether this node has a pending tag that would make its children's data stale — only relevant for a non-leaf, since a leaf has no children to push to.",
    28: "Pushes that pending tag down first, so any decision made below this point is based on up-to-date children.",
    30: "If this node's interval doesn't overlap [l, r] at all, there's nothing to update here.",
    31: "Returns immediately — a disjoint branch is left completely untouched.",
    33: "If this node's entire interval sits inside [l, r], the update can be applied and recorded right here without descending any further.",
    34: "Adds val times this interval's element count directly to the cached sum — the interval-length scaling that keeps the aggregate honest without touching individual elements.",
    35: "Only a non-leaf needs to remember the debt for its children — a leaf has none to notify.",
    36: "Records val as this node's own pending lazy tag, to be pushed down whenever some later operation actually needs to look inside this subtree.",
    37: "Returns — this early exit is what keeps whole-range updates logarithmic instead of linear.",
    39: "Otherwise the range only partially overlaps, so the update must be split between both children — computes the midpoint to know where.",
    40: "Recurses the update into the left child's portion of the overlap.",
    41: "Recurses the update into the right child's portion of the overlap.",
    42: "Recomputes this node's cached sum from its two children, now that at least one of them has actually changed.",
    44: "Defines query_range(node, start, end, l, r): sums every element in [l, r], pushing down any pending tags it needs to pass through along the way.",
    45: "If this node's interval doesn't overlap [l, r] at all, it can't contribute to the answer.",
    46: "Returns 0 — the identity value for a sum — for a fully-disjoint branch.",
    48: "Checks whether there's a pending tag to resolve before reading or descending into this node's children — again only for a non-leaf, since a leaf has no children to mislead.",
    49: "Pushes the tag down so the values this call is about to read — its own cached sum, or its children's — are current.",
    51: "If this node's entire interval sits inside [l, r], its cached sum — now guaranteed up to date — answers this whole subtree's contribution directly.",
    52: "Returns that cached sum without visiting a single child — the same early-exit pruning that makes segment tree queries fast.",
    54: "Otherwise the query only partially overlaps this node, so computes the midpoint to split the question between children.",
    55: "Recurses into the left child for its share of the range.",
    56: "Recurses into the right child for its share of the range.",
    57: "Adds the two partial sums together as this subtree's total contribution to the query.",
  },
};
