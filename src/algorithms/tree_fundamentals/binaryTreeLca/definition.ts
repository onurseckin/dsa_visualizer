import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { BINARY_TREE_LCA_CODE } from "./pythonCode";
import { generateBinaryTreeLcaSteps, type BinaryTreeLcaInput } from "./stepGenerator";

export const DEFAULT_BINARY_TREE_LCA_INPUT: BinaryTreeLcaInput = {
  rootId: "3",
  pVal: 5,
  qVal: 1,
  nodes: [
    { id: "3", val: 3, leftId: "5", rightId: "1", state: "default" },
    { id: "5", val: 5, leftId: "6", rightId: "2", state: "default" },
    { id: "1", val: 1, leftId: "0", rightId: "8", state: "default" },
    { id: "6", val: 6, state: "default" },
    { id: "2", val: 2, leftId: "7", rightId: "4", state: "default" },
    { id: "0", val: 0, state: "default" },
    { id: "8", val: 8, state: "default" },
    { id: "7", val: 7, state: "default" },
    { id: "4", val: 4, state: "default" },
  ],
};

const BINARY_TREE_LCA_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function header defining lowest_common_ancestor(root, p, q), accepting current subtree root node and target node values p and q.",
    2: "Base case guard evaluating if root is None, or if root.val matches target p or target q.",
    3: "Returns root immediately if root is None (empty subtree) or matches p or q (target found).",
    4: "Blank line separating base case evaluation from recursive subtree traversal calls.",
    5: "Recursively calls lowest_common_ancestor on the left child (root.left) to search left subtree for target nodes p and q.",
    6: "Recursively calls lowest_common_ancestor on the right child (root.right) to search right subtree for target nodes p and q.",
    7: "Blank line separating recursive subtree searches from ancestor decision logic.",
    8: "Evaluates split condition 'if left and right:' checking if both subtrees returned non-null node references.",
    9: "Returns current root as the lowest common ancestor because target nodes p and q diverge across left and right subtrees.",
    10: "Evaluates fallback return 'return left if left else right', forwarding non-null subtree result upward.",
  },
};

export const binaryTreeLca: AlgorithmDefinition<BinaryTreeLcaInput> = {
  id: "binary-tree-lca",
  title: "Lowest Common Ancestor of a Binary Tree",
  topicIds: ["tree_fundamentals"],
  difficulty: "Medium",
  description: `Find the Lowest Common Ancestor (LCA) node for two given target nodes $p$ and $q$ in a binary tree.

### Problem Statement
Given the root node \`root\` of a binary tree and two distinct target nodes $p$ and $q$ existing within the tree, find their Lowest Common Ancestor (LCA). The LCA is defined as the deepest node $T$ in the tree that has both $p$ and $q$ as descendants (where a node is allowed to be a descendant of itself per standard tree graph theory conventions).

Formally, for a binary tree node hierarchy, the Lowest Common Ancestor is defined as:

$$ \\text{LCA}(u, p, q) = \\begin{cases} u & \\text{if } u = p \\text{ or } u = q \\\\ u & \\text{if } \\text{LCA}(u.\\text{left}, p, q) \\neq \\text{None} \\text{ and } \\text{LCA}(u.\\text{right}, p, q) \\neq \\text{None} \\\\ \\text{LCA}(u.\\text{left}, p, q) & \\text{if } \\text{LCA}(u.\\text{left}, p, q) \\neq \\text{None} \\\\ \\text{LCA}(u.\\text{right}, p, q) & \\text{otherwise} \\end{cases} $$

### Why It Exists & Real-World Applications
LCA resolution is a fundamental algorithmic pattern across software engineering and system architecture:
- **Version Control Systems (Git)**: Git computes the LCA of two commits (\`git merge-base\`) to establish the shared base commit when performing a three-way merge.
- **Compilers & Static Analysis**: Abstract Syntax Trees (ASTs) query LCA to determine the narrowest enclosing lexical scope containing two variable references or expressions.
- **Distributed Systems & Control Groups**: Linux cgroups cgroup-v2 tree managers calculate common parent hierarchy nodes for memory and CPU quota enforcement.
- **Autograd Engine Computation Graphs**: PyTorch and TensorFlow execute post-order LCA queries to locate bifurcation points in DAGs for gradient tape propagation.

### Algorithmic Approach & DFS Intuition
The solution uses a bottom-up post-order Depth-First Search (DFS) traversal. The recursive contract relies on three conditions:
1. **Base Case**: If \`root\` is null or \`root.val\` equals either target $p$ or $q$, return \`root\`.
2. **Subtree Traversal**: Recursively search the left subtree ($\text{left} = \\text{LCA}(\\text{root.left}, p, q)$) and right subtree ($\text{right} = \\text{LCA}(\\text{root.right}, p, q)$).
3. **Decision & Bubble Up**:
   - If both $\\text{left}$ and $\\text{right}$ return non-null node references, target $p$ lies in one subtree and target $q$ lies in the other. Thus, $\\text{root}$ is the unique Lowest Common Ancestor!
   - If only one side returns non-null, forward that result upward to the parent caller.
   - If both return null, return null.

### Complexity Summary
- **Time Complexity**: $O(N)$ worst/average case, visiting every node at most once.
- **Space Complexity**: $O(H)$ auxiliary call stack space, where $H$ is tree height ($O(\\log N)$ for balanced trees, $O(N)$ for degenerate skewed chains).

$$ T_{\\text{time}}(N) = O(N), \\quad S_{\\text{space}}(N) = O(H) \\quad \\text{where } H \\in [\\lfloor \\log_2 N \\rfloor, N] $$`,
  constraints: [
    "2 <= Number of nodes N <= 10^5",
    "-10^9 <= Node.val <= 10^9",
    "All Node.val are unique",
    "p != q",
    "Both nodes p and q are guaranteed to exist in the tree",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "root = [3, 5, 1, 6, 2, 0, 8], p = 5, q = 1",
      outputDisplay: "3",
      title: "Basic Example",
      input: {
        rootId: "3",
        pVal: 5,
        qVal: 1,
        nodes: [
          { id: "3", val: 3, leftId: "5", rightId: "1", state: "default" },
          { id: "5", val: 5, leftId: "6", rightId: "2", state: "default" },
          { id: "1", val: 1, leftId: "0", rightId: "8", state: "default" },
          { id: "6", val: 6, state: "default" },
          { id: "2", val: 2, state: "default" },
          { id: "0", val: 0, state: "default" },
          { id: "8", val: 8, state: "default" },
        ],
      },
      output: "3",
      explanation:
        "Node 5 is in the left subtree and Node 1 is in the right subtree of Root 3. The lowest common ancestor is Node 3.",
    },
    {
      kind: "complex",
      inputDisplay: "root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 7, q = 4",
      outputDisplay: "2",
      title: "Complex Edge Case",
      input: {
        rootId: "3",
        pVal: 7,
        qVal: 4,
        nodes: [
          { id: "3", val: 3, leftId: "5", rightId: "1", state: "default" },
          { id: "5", val: 5, leftId: "6", rightId: "2", state: "default" },
          { id: "1", val: 1, leftId: "0", rightId: "8", state: "default" },
          { id: "6", val: 6, state: "default" },
          { id: "2", val: 2, leftId: "7", rightId: "4", state: "default" },
          { id: "0", val: 0, state: "default" },
          { id: "8", val: 8, state: "default" },
          { id: "7", val: 7, state: "default" },
          { id: "4", val: 4, state: "default" },
        ],
      },
      output: "2",
      explanation:
        "Both Node 7 and Node 4 lie deep within the subtree rooted at Node 2. Their paths diverge at Node 2, making Node 2 the LCA.",
    },
    {
      kind: "negative",
      inputDisplay: "root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 5, q = 4",
      outputDisplay: "5",
      title: "Failing / Boundary Case",
      input: {
        rootId: "1",
        pVal: 1,
        qVal: 2,
        nodes: [
          { id: "1", val: 1, leftId: "2", state: "default" },
          { id: "2", val: 2, state: "default" },
        ],
      },
      output: "1",
      explanation:
        "Node 1 is the ancestor (root) of target Node 2. By definition, a node can be a descendant of itself, so Node 1 is its own and Node 2's LCA.",
    },
  ],
  code: BINARY_TREE_LCA_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(H)",
  complexityAnalysis: {
    time: "The recursion touches each of the N nodes at most once, performing O(1) work per node: comparing node value against p and q and combining left/right subtree results. Total time complexity is O(N).",
    space:
      "Stack space usage is proportional to tree height H, yielding O(H) auxiliary space (O(log N) for balanced trees, O(N) for degenerate linked lists).",
  },
  topicGuide: {
    overview:
      "The Lowest Common Ancestor (LCA) of two nodes $p$ and $q$ in a binary tree is the lowest (deepest) node $T$ that has both $p$ and $q$ as descendants. Geometrically, it marks the exact divergence point where the root-to-$p$ path and root-to-$q$ path split into distinct branches.\n\nA bottom-up post-order Depth-First Search (DFS) evaluates subtrees independently and bubbles node references upward. This single-pass recursive pattern solves the LCA problem in $O(N)$ time and $O(H)$ stack space without requiring parent pointers or storing full root-to-node path lists.",
    sections: [
      {
        heading: "1. The Bottom-Up Recursive Contract",
        body: "The core secret to single-pass LCA resolution lies in defining an unambiguous recursive contract: for any node $u$, `lowest_common_ancestor(u, p, q)` returns a non-null reference if $u$'s subtree contains $p$, $q$, or their already-identified LCA, and returns `None` if the subtree contains neither target. Because children evaluate fully before their parent decides, each node receives complete structural information from both subtrees.",
      },
      {
        heading: "2. Decision Logic & Branch Divergence",
        body: "When evaluating node $u$, after receiving `left` and `right` subtree results:\n- **Case A (`left` != None and `right` != None)**: $p$ is in one subtree and $q$ is in the other. Node $u$ is the exact split point, making $u$ the LCA. Return $u$.\n- **Case B (One side != None, other == None)**: Both targets lie inside the same subtree, or one target has been found while searching for the second. Return the non-null result upward.\n- **Case C (`left` == None and `right` == None)**: Neither target exists beneath $u$. Return `None`.",
      },
      {
        heading: "3. Ancestor-As-Self & Early Termination",
        body: "By standard convention, a node can be a descendant of itself. If target $q$ resides in target $p$'s subtree, returning $p$ immediately upon encountering `root.val == p` is mathematically correct: $p$ is indeed the ancestor of $q$, and searching deeper inside $p$'s subtree is unnecessary.",
      },
      {
        heading: "4. Trade-offs: Single Query vs. Multi-Query Precomputation",
        body: "For a single online query on an unindexed binary tree, post-order DFS is optimal ($O(N)$ time, $O(H)$ space). However, if an application requires thousands of LCA queries on a static tree (e.g. network routing tables or graph algorithms), precomputing Binary Lifting (ancestor tables) or using Euler Tour + RMQ (Range Minimum Query via Segment Tree or Sparse Table) reduces query time to $O(\\log N)$ or $O(1)$ after an $O(N \\log N)$ preprocessing phase.",
      },
      {
        heading: "5. Skewed Trees & Call Stack Memory Limits",
        body: "In a balanced binary tree of $N$ nodes, height $H = \\log_2 N$, requiring minimal stack frames ($O(\\log N)$). On degenerate skewed trees (resembling a single linked list), $H = N$, driving memory usage to $O(N)$. For extremely deep production trees, an iterative parent-map approach using an explicit hash table and ancestor set avoids stack overflow limits.",
      },
    ],
    keyTerms: [
      {
        term: "Lowest Common Ancestor (LCA)",
        definition: "The deepest node in a tree that has both target nodes p and q as descendants.",
      },
      {
        term: "Post-Order DFS",
        definition:
          "A depth-first traversal that processes left and right subtrees completely before inspecting the parent node.",
      },
      {
        term: "Self-Descendant Property",
        definition:
          "The convention where a node counts as an ancestor and descendant of itself, allowing early return when p is an ancestor of q.",
      },
      {
        term: "Binary Lifting",
        definition:
          "An advanced multi-query LCA technique using power-of-two jump tables to answer LCA queries in O(log N) time.",
      },
      {
        term: "Euler Tour RMQ",
        definition:
          "Flattening a tree walk into an array where LCA corresponds to the minimum depth node between p and q in O(1) query time.",
      },
    ],
  },
  trivia: BINARY_TREE_LCA_TRIVIA,
  leetcode: {
    id: 236,
    url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #236",
      leetcodeId: 236,
      url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 18",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 18,
      section: "18.3 Lowest common ancestor",
    },
  ],
  defaultInput: DEFAULT_BINARY_TREE_LCA_INPUT,
  generateSteps: generateBinaryTreeLcaSteps,
};

export default binaryTreeLca;
