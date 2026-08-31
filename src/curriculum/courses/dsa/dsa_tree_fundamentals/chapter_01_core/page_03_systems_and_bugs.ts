import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_tree_fundamentals_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Memory Hierarchy, Pointer Chasing & B-Tree Cache Density",
      content:
        "High-performance database storage engines (InnoDB, RocksDB, SQLite) evaluate tree layouts under CPU memory cache constraints:\n\n1. **The Binary Tree Cache Miss Bottleneck:** A standard binary search tree node (`struct Node { int key; Node* left; Node* right; }`) consumes $32$ bytes on 64-bit architectures. Searching down a tree of depth 20 triggers 20 non-contiguous DRAM reads ($20 \\times 60\\text{ ns} = 1200\\text{ ns}$). Because nodes are scattered across the virtual heap, hardware stream prefetchers cannot predict child addresses.\n2. **B-Trees for Hardware Cache Line Saturation:** B-Trees solve the binary tree memory wall by grouping $B$ keys per node (e.g. $B = 15$). A single 64-byte L1 cache line fetch loads 15 keys simultaneously, allowing SIMD binary search within the node and reducing total DRAM tree hops by a factor of $\\log_2 B \\approx 4\\times$.\n3. **Morris Threading Memory Safety:** Morris traversal modifies existing unallocated child pointers dynamically. In concurrent multi-threaded environments, reading a tree during active Morris threading produces race conditions unless read-copy-update (RCU) or locking wrappers are employed.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Local Validation Bugs & Rotation Height Sequencing",
      content:
        "1. **The Local BST Validation Fallacy:** Validating a BST by checking only direct child nodes (`node.left.val < node.val && node.right.val > node.val`) falsely approves invalid trees (e.g. root 5 with right child 6 having left grandchild 3). A valid BST check *must* pass global range boundaries: `isValidBST(node, minBound, maxBound)`.\n2. **AVL Height Update Order Bug:** In AVL tree rotations, failing to update the displaced child node's height *before* updating the new parent node's height propagates corrupted balance factors, destroying self-balancing guarantees.\n3. **Unsevered Morris Thread Memory Corruption:** If an exception occurs or traversal is aborted early during Morris traversal before threads are severed, dangling right-pointers leave cycles in the tree, corrupting subsequent algorithms into infinite loops.\n4. **Call Stack Exhaustion on Deep BSTs:** Constructing a standard BST from sorted input creates a degenerate linked list of depth $10^5$, triggering instant `StackOverflowError` in recursive traversals.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Advanced Self-Adjusting Trees: Splay Trees & Randomized Treaps",
      content:
        "Advanced balanced tree frontiers provide dynamic access adaptation:\n- **Splay Trees (Sleator & Tarjan 1985):** Self-adjusting BSTs that rotate accessed nodes to the root via double rotations (**Zig-Zig** and **Zig-Zag**). Proved to achieve $O(\\log N)$ amortized time per operation, satisfying the **Working Set Property** (frequently accessed elements are retrieved in $O(\\log(\\text{rank}))$) and conjectured to be **Dynamically Optimal**.\n- **Treaps (Aragon & Seidel 1989):** Randomized binary search trees where each node possesses a key and a random priority. Maintains the BST property on keys and the Heap property on priorities, guaranteeing $O(\\log N)$ expected height with high probability and enabling $O(\\log N)$ tree split and merge operations.",
    },
    {
      type: "prose",
      title: "Tree Data Structure Selection Matrix",
      content: `
| Tree Structure | Search Time (Worst) | Insert Time (Worst) | Height Bound | Rebalancing Cost | Best Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unbalanced BST** | $O(N)$ | $O(N)$ | $N$ | None | Randomly shuffled static inputs |
| **AVL Tree** | $O(\\log N)$ | $O(\\log N)$ | $1.44 \\log_2 N$ | Strict (rotations on insert/delete) | Read-heavy in-memory databases |
| **Red-Black Tree** | $O(\\log N)$ | $O(\\log N)$ | $2.00 \\log_2 N$ | Relaxed (fewer rotations) | General-purpose maps (\`std::map\`, Linux CFS) |
| **Splay Tree** | $O(N)$ worst, $O(\\log N)$ amortized | $O(\\log N)$ amortized | Dynamic | Splays on every access | Cache replacement, network routers |
| **Treap (Cartesian)** | $O(\\log N)$ expected | $O(\\log N)$ expected | $O(\\log N)$ w.h.p. | Rotations on priority heap | Range split/merge, rope string data structures |
| **B-Tree / B+ Tree** | $O(\\log_B N)$ | $O(\\log_B N)$ | $\\log_B N$ | Node splits / merges | Disk & database page storage (InnoDB, Postgres) |
      `,
    },
  ],
};
