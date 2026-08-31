import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_tree_fundamentals_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_tree_fundamentals",
      title: "Tree Fundamentals Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Validate Binary Search Tree",
          problemId: "validate-binary-search-tree",
          difficulty: "Medium",
          description:
            "Given the root of a binary tree, determine if it is a valid binary search tree (BST) by propagating global strict open intervals $(minVal, maxVal)$ down the tree hierarchy in $O(N)$ time and $O(H)$ auxiliary space.",
          rationale:
            "Tests invariant preservation across entire subtrees rather than local child checks.",
        },
        {
          title: "Construct Binary Tree from Preorder and Inorder Traversal",
          problemId: "construct-binary-tree-preorder-inorder",
          difficulty: "Medium",
          description:
            "Given preorder and inorder traversal arrays, reconstruct the exact binary tree in $O(N)$ time using a hash map to look up inorder partition pivots in $O(1)$ time.",
          rationale: "Evaluates tree boundary slicing and divide-and-conquer tree reconstruction.",
        },
        {
          title: "Lowest Common Ancestor of a Binary Search Tree",
          problemId: "lowest-common-ancestor-bst",
          difficulty: "Easy",
          description:
            "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes $p$ and $q$ in $O(H)$ time and $O(1)$ space by exploiting the BST key ordering invariant.",
          rationale: "Tests algebraic navigation using BST key intervals without backtracking.",
        },
        {
          title: "Recover Binary Search Tree via Morris Traversal",
          problemId: "recover-binary-search-tree",
          difficulty: "Hard",
          description:
            "Two elements of a binary search tree (BST) are swapped by mistake. Recover the tree without changing its structure in strictly $O(N)$ time and $O(1)$ auxiliary space using Morris In-Order Traversal.",
          rationale:
            "Tests in-order inversion identification combined with threaded tree constant-space traversal.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Splay Tree Amortized Logarithmic Access Lemma",
          statement:
            "Prove that splaying a node $x$ to the root using Zig-Zig and Zig-Zag double rotations runs in amortized time $O(\\log N)$ under the potential function $\\Phi = \\sum_{u \\in T} \\log(\\text{size}(u))$.",
          proofOutline:
            "Let $r(x) = \\log(\\text{size}(x))$. For a Zig-Zig step (where $x$ and parent $p$ are both left children), actual cost is 2, and $\\Delta \\Phi = r'(x) + r'(p) + r'(g) - (r(x) + r(p) + r(g)) \\le 3(r'(x) - r(x)) - 2$ by convexity of $\\log$. The $-2$ cancels the actual cost. Summing across all splay steps yields total amortized cost $\\le 3(r(\\text{root}) - r(x)) + 1 = O(\\log N)$.",
          engineeringContext:
            "Foundational for self-adjusting data structures and online caching heuristics.",
        },
        {
          title: "Treap Expected Height Logarithmic Bound",
          statement:
            "Prove that a Treap containing $N$ keys with independently uniform random continuous priorities has expected height $\\mathbb{E}[H] = O(\\log N)$ and that the depth of the $i$-th smallest key is $O(\\log N)$.",
          proofOutline:
            "Node $j$ is an ancestor of node $i$ if and only if node $j$ has the maximum priority among all keys between $i$ and $j$ ($[\\min(i, j), \\max(i, j)]$). The probability of this occurring is $\\frac{1}{|i - j| + 1}$. The expected depth of node $i$ is $\\sum_{j \\neq i} \\frac{1}{|i - j| + 1} = H_i + H_{N - i} = O(\\ln N)$.",
          engineeringContext:
            "Guarantees that randomized tree balancing requires zero rotation bookkeeping metadata.",
        },
        {
          title: "Cayley's Tree Formula via Prüfer Sequence Bijection",
          statement:
            "Prove Cayley's formula: The number of distinct labeled trees on $N$ vertices is exactly $N^{N-2}$.",
          proofOutline:
            "Construct a bijection between labeled trees on $N$ vertices and Prüfer sequences of length $N-2$ with symbols from $\\{1, \\dots, N\\}$. Iteratively remove the lowest-degree leaf and record its neighbor. Since each of the $N-2$ positions in the sequence can independently take any of the $N$ vertex labels, the total number of trees is $N^{N-2}$.",
          engineeringContext:
            "Used in statistical network modeling and random graph percolation theory.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Tree Pointer Dereference Latency vs B-Tree Node Cache Saturation",
          prompt:
            "Why do production storage engines (InnoDB, PostgreSQL) use B-Trees with 4 KB to 64 KB page nodes rather than AVL or Red-Black trees for indexing?",
          engineeringContext:
            "Binary trees incur an L1/L2 cache miss on every node hop ($20$ hops for $10^6$ rows). A B-Tree with branching factor $B = 100$ reaches $10^6$ rows in 3 page fetches, packing hundreds of keys into sequential cache lines.",
        },
        {
          title: "Morris Traversal Concurrency Hazards in Multi-Threaded Read Kernels",
          prompt:
            "Why is Morris traversal unsafe for concurrent read-only threads without synchronization, even though it leaves the tree unmodified upon completion?",
          engineeringContext:
            "Morris traversal temporarily overwrites `pred.right` child pointers with back-threads to parent nodes. A concurrent reader will follow these temporary threads, causing infinite loops or incorrect data reads.",
        },
        {
          title: "Flat Array Implicit Binary Search Tree Cache Layouts",
          prompt:
            "Explain how storing a complete binary search tree in a contiguous 1D array (`left = 2i+1, right = 2i+2`) eliminates pointer overhead and enables hardware stream prefetching.",
          engineeringContext:
            "Contiguous arrays eliminate 16 bytes of pointer metadata per node. Parent-to-child indexing evaluates via bitwise arithmetic in CPU registers, enabling hardware prefetchers to stream subtrees into L1 cache.",
        },
      ],
      partD_stressTests: [
        {
          title: "Local BST Validation Fallacy with Deep Grandchild Inversion",
          scenario:
            "Validating a tree using `node.left.val < node.val && node.right.val > node.val` on tree `[10, 5, 15, null, null, 6, 20]`.",
          failureMode:
            "The node with value 6 is greater than its parent 5, but smaller than the root 10. Local validation falsely returns true, corrupting binary search invariants.",
        },
        {
          title: "AVL Tree Height Update Order Inversion",
          scenario:
            "Updating parent height before child height in AVL right rotation (`updateHeight(y); updateHeight(x)` instead of child first).",
          failureMode:
            "Parent height is calculated using outdated child heights, corrupting balance factor calculations and causing the tree to fail to self-balance.",
        },
        {
          title: "Memory Corruption from Unsevered Morris Traversal Thread Cycles",
          scenario:
            "An uncaught exception aborts Morris traversal halfway through an operation before all temporary predecessor threads are severed.",
          failureMode:
            "The tree retains permanent cyclical right-child pointers, causing subsequent recursive traversals to enter infinite loops and crash.",
        },
      ],
    },
  ],
};
