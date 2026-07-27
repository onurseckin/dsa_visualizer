import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const SEGMENT_TREE_LAZY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A **Segment Tree with Lazy Propagation** optimizes range updates from naive linear $O(N)$ time down to $O(\\log N)$ logarithmic time. In a standard segment tree, modifying every element in range $[L \\dots R]$ requires visiting every leaf in that interval. Lazy propagation resolves this by **deferring** updates: when a range update completely covers a node's interval $[\\text{start} \\dots \\text{end}]$, the node updates its aggregate sum immediately and stores a **lazy tag** to remember the pending delta. Lazy tags are pushed down to children on-demand only when subsequent queries or updates descend deeper.",
  sections: [
    {
      heading: "1. Deferred Work & Lazy Tags",
      body: "Updating range $[L \\dots R]$ by value $v$ touching an interval of length $K = \\text{end} - \\text{start} + 1$ increases the node sum by $K \\cdot v$ in $O(1)$ time:\n\n$$\\text{tree}[\\text{node}] \\leftarrow \\text{tree}[\\text{node}] + K \\cdot v$$\n$$\\text{lazy}[\\text{node}] \\leftarrow \\text{lazy}[\\text{node}] + v$$\n\nThe traversal terminates immediately at this node without visiting descendants, guaranteeing that range updates touch at most $2 \\log_2 N$ canonical nodes.",
    },
    {
      heading: "2. The Push Operation: On-Demand Propagation",
      body: "Before traversing into left or right children during queries or updates, we execute `push(node, start, end)`:\n\n1. Check if $\\text{lazy}[\\text{node}] \\ne 0$.\n2. Propagate $\\text{lazy}[\\text{node}]$ to child tags: $\\text{lazy}[2v] += \\text{lazy}[v]$ and $\\text{lazy}[2v+1] += \\text{lazy}[v]$.\n3. Update child cached sums: $\\text{tree}[2v] += \\text{lazy}[v] \\cdot K_{\\text{left}}$ and $\\text{tree}[2v+1] += \\text{lazy}[v] \\cdot K_{\\text{right}}$.\n4. Reset parent tag: $\\text{lazy}[v] \\leftarrow 0$.",
    },
    {
      heading: "3. Execution Pipeline: Updates & Queries",
      body: "For both range update and range query operations, the tree traversal follows four core conditions:\n\n- **Pending Tag Resolution**: Flush lazy tag down via `push` if $\\text{lazy}[v] \\ne 0$.\n- **Disjoint Range**: Return immediately if $[\\text{start} \\dots \\text{end}] \\cap [L \\dots R] = \\emptyset$.\n- **Complete Coverage**: Apply/return node value directly if $[\\text{start} \\dots \\text{end}] \\subseteq [L \\dots R]$.\n- **Partial Overlap**: Recurse into left and right subtrees and merge child results.",
    },
    {
      heading: "4. Scaling Factor & Operation Composition",
      body: "- **Range Sum Query**: Multiplying lazy tag $v$ by interval size $K$ gives delta $K \\cdot v$.\n- **Range Min/Max Query**: Adding $v$ to range shifts min/max by $v$ directly (scaling by $K$ is omitted).\n- **Tag Composition**: Multiple updates accumulate via $\\text{lazy}[\\text{child}] \\leftarrow \\text{lazy}[\\text{child}] + \\text{lazy}[\\text{parent}]$.",
    },
    {
      heading: "5. Interview Pitfalls & Complexities",
      body: "- **Push Before Descending**: Always invoke `push()` before making recursive child calls to prevent reading stale cached sums.\n- **Leaf Boundaries**: Check `start != end` before pushing lazy tags down, as leaf nodes do not have children.",
    },
  ],
  keyTerms: [
    {
      term: "Lazy Tag",
      definition:
        "A pending update value stored at an internal tree node, indicating that its descendants are owed a deferred update.",
    },
    {
      term: "Push Operation",
      definition:
        "The action that flushes a pending lazy tag from parent down to its children, updating child sums and clearing parent debt.",
    },
    {
      term: "Interval Scaling",
      definition:
        "Multiplying additive delta $v$ by interval length $K = (\\text{end} - \\text{start} + 1)$ for Range Sum calculations.",
    },
    {
      term: "Canonical Covering Set",
      definition:
        "The minimal set of at most $2 \\log_2 N$ tree nodes that completely cover target interval $[L \\dots R]$.",
    },
  ],
};

export const SEGMENT_TREE_LAZY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the SegmentTreeLazy class supporting O(log N) range updates and range queries.",
    2: "Constructor accepting input array arr.",
    3: "Stores array size n.",
    4: "Allocates 4*n zeroed slots for precomputed range sum tree.",
    5: "Allocates 4*n zeroed slots for deferred lazy update tags.",
    6: "Triggers recursive build over full array interval [0..n-1].",
    7: "Blank line separating constructor.",
    8: "Defines build(node, start, end) recursively constructing segment tree.",
    9: "Base case: if start == end, leaf node reached.",
    10: "Stores array value arr[start] into tree[node].",
    11: "Returns from leaf node build.",
    12: "Calculates interval midpoint: mid = (start + end) // 2.",
    13: "Recursively builds left child (2*node) over interval [start..mid].",
    14: "Recursively builds right child (2*node+1) over interval [mid+1..end].",
    15: "Recomputes parent sum by combining left and right child sums.",
    16: "Blank line separating build method.",
    17: "Defines push(node, start, end) to propagate pending lazy tags to child nodes.",
    18: "Checks if parent node has a pending non-zero lazy tag.",
    19: "Calculates interval midpoint: mid = (start + end) // 2.",
    20: "Propagates lazy tag to left child lazy array.",
    21: "Applies scaled lazy update to left child sum: lazy * left_len.",
    22: "Propagates lazy tag to right child lazy array.",
    23: "Applies scaled lazy update to right child sum: lazy * right_len.",
    24: "Clears parent lazy tag to 0 after pushing debt to children.",
    25: "Blank line separating push method.",
    26: "Defines update_range(node, start, end, l, r, val) for range update.",
    27: "Pushes pending lazy tag down if node has pending debt and is not a leaf.",
    28: "Calls push helper method to flush lazy tag.",
    29: "Blank line in update_range.",
    30: "Checks if node interval is completely outside update interval [l..r].",
    31: "Returns immediately for non-overlapping interval.",
    32: "Blank line in update_range.",
    33: "Checks if node interval [start..end] is completely inside update interval [l..r].",
    34: "Updates cached node sum immediately by scaling val by interval length.",
    35: "Checks if node is an internal node (start != end).",
    36: "Stores lazy tag val into lazy[node] for future push down.",
    37: "Early return stopping recursion for completely covered sub-interval.",
    38: "Blank line in update_range.",
    39: "Calculates interval midpoint: mid = (start + end) // 2.",
    40: "Recursively updates left child over [start..mid].",
    41: "Recursively updates right child over [mid+1..end].",
    42: "Recomputes parent node sum from updated left and right children.",
    43: "Blank line separating update_range method.",
    44: "Defines query_range(node, start, end, l, r) returning range sum over [l..r].",
    45: "Checks if node interval is completely outside query range [l..r].",
    46: "Returns neutral identity value 0 for non-overlapping branch.",
    47: "Blank line in query_range.",
    48: "Pushes pending lazy tag down if node has pending debt and is not a leaf.",
    49: "Calls push helper method to flush lazy tag.",
    50: "Blank line in query_range.",
    51: "Checks if node interval [start..end] is completely inside query range [l..r].",
    52: "Returns cached node sum tree[node] directly for complete match.",
    53: "Blank line in query_range.",
    54: "Calculates interval midpoint: mid = (start + end) // 2.",
    55: "Recursively queries left child over [start..mid].",
    56: "Recursively queries right child over [mid+1..end].",
    57: "Returns sum of left and right child query results.",
  },
};

