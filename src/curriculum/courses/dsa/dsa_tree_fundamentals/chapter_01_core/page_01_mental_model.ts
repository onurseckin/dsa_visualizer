import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_tree_fundamentals_c1_p1",
  pageNumber: 1,
  title: "Hierarchical Topologies, BST Invariants & Self-Balancing Trees",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Linear Search vs Dynamic Mutation Dilemma",
      content:
        "Linear arrays provide $O(1)$ random indexing but suffer $O(N)$ insertion/deletion costs. Linked lists allow $O(1)$ node splicing but force $O(N)$ sequential traversal. Trees bridge this fundamental algorithmic gap: by organizing elements into a 2D branching hierarchy where each node partitions the remaining key space into disjoint subtrees, trees enable $O(\\log N)$ dynamic search, insertion, deletion, predecessor/successor queries, and range aggregations.",
    },
    {
      type: "prose",
      title: "Taxonomy of Tree Topologies & Self-Balancing Invariants",
      content:
        "Hierarchical data structures are governed by recursive invariants and structural balancing constraints:\n\n1. **Fundamental Tree Properties & Height Relations:**\n   - **Binary Tree:** A connected acyclic graph where every node has out-degree $\\le 2$. A binary tree of height $H$ contains at most $\\sum_{i=0}^H 2^i = 2^{H+1} - 1$ nodes. Conversely, a tree of size $N$ has minimum height $H_{\\min} = \\lceil \\log_2(N + 1) \\rceil - 1$.\n   - **The BST Invariant:** For every node $u$, all keys in the left subtree satisfy $\\text{key}(v) < \\text{key}(u)$, and all keys in the right subtree satisfy $\\text{key}(w) > \\text{key}(u)$. An in-order traversal of a valid BST produces keys in strictly sorted order in $O(N)$ time.\n\n2. **AVL Trees (Adelson-Velsky & Landis 1962):**\n   - Strictly height-balanced BST. For every node $u$, the **Balance Factor** $\\text{BF}(u) = \\text{height}(\\text{left}) - \\text{height}(\\text{right}) \\in \\{-1, 0, +1\\}$.\n   - When an insertion causes $|\\text{BF}(u)| = 2$, balance is restored via one of **4 Rotation Cases**:\n     1. **Left-Left (LL):** Single Right Rotation at $u$.\n     2. **Right-Right (RR):** Single Left Rotation at $u$.\n     3. **Left-Right (LR):** Left Rotation at $u.\\text{left}$, followed by Right Rotation at $u$.\n     4. **Right-Left (RL):** Right Rotation at $u.\\text{right}$, followed by Left Rotation at $u$.\n   - Maximum height is strictly bounded by $H \\le 1.44 \\log_2 N$.\n\n3. **Red-Black Trees (Bayer 1972, Guibas & Sedgewick 1978):**\n   - A relaxed height-balanced BST isomorphic to 2-3-4 B-trees. Governed by **5 Invariants**:\n     1. Every node is colored either **Red** or **Black**.\n     2. The root is always **Black**.\n     3. All leaf nodes (NIL sentinels) are **Black**.\n     4. If a node is **Red**, both of its children must be **Black** (no two consecutive red nodes).\n     5. Every path from a node to any of its descendant NIL leaves contains the exact same number of black nodes (**Black-Height** $bh(u)$).\n   - Guarantees worst-case height $H \\le 2 \\log_2(N + 1)$, forming the core engine of C++ `std::map`, Java `TreeMap`, and the Linux kernel Completely Fair Scheduler (CFS).",
    },
    {
      type: "mental_model",
      title: "Tree Rotations & Morris Threading Invariant",
      visualIntuition: `
=== AVL TREE ROTATION MECHANICS (RIGHT ROTATION AT Y) ===
        Y (BF = +2)                   X (BF = 0)
       / \\                           / \\
      X   gamma   ──Right Rot──>    alpha  Y
     / \\                                  / \\
   alpha beta                            beta gamma

Invariant Preserved: alpha < X < beta < Y < gamma!
Pointer Updates: Y.left = X.right (beta); X.right = Y;

=== MORRIS IN-ORDER TRAVERSAL (O(1) AUXILIARY SPACE) ===
To visit node Curr without a recursion call stack:
1. If Curr.left is NULL: Visit Curr, Curr = Curr.right.
2. If Curr.left exists: Find the in-order predecessor Pred (rightmost node in left subtree).
   - If Pred.right is NULL: Pred.right = Curr (Create temporary thread!), Curr = Curr.left.
   - If Pred.right is Curr: Pred.right = NULL (Sever thread!), Visit Curr, Curr = Curr.right.
      `,
      invariant:
        "Structural Invariants:\n1. BST Invariant: For all $u$, $\\max(\\text{Left}(u)) < \\text{key}(u) < \\min(\\text{Right}(u))$. Rotations strictly preserve this in-order symmetric sequence.\n2. Morris Threading: Temporary right-pointers on in-order predecessors allow constant-memory traversal without call-stack recursion frames.",
      stateTransitions:
        "AVL Rebalance: If $\\text{BF}(u) = +2$ and $\\text{BF}(u.\\text{left}) \\ge 0 \\implies$ RotateRight($u$). If $\\text{BF}(u) = +2$ and $\\text{BF}(u.\\text{left}) < 0 \\implies$ RotateLeft($u.\\text{left}$), RotateRight($u$).\nMorris Step: If no thread, attach `pred.right = curr` and descend left; if thread exists, sever `pred.right = null`, visit `curr`, and ascend right.",
      naiveBottleneck:
        "Unbalanced BSTs degrade to linear linked lists of height $H = N$ on sorted insertions, turning $O(\\log N)$ lookups into disastrous $\\Theta(N)$ scans.",
      optimalInsight:
        "AVL/Red-Black rotation invariants maintain logarithmic height $O(\\log N)$ under all insertion sequences, while Morris threading eliminates the $O(H)$ recursion stack.",
    },
  ],
};
