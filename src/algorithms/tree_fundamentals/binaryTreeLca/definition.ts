import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { BINARY_TREE_LCA_CODE } from "./pythonCode";
import {
  DEFAULT_BINARY_TREE_LCA_INPUT,
  generateBinaryTreeLcaSteps,
  type BinaryTreeLcaInput,
} from "./stepGenerator";

export { DEFAULT_BINARY_TREE_LCA_INPUT };

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
  description: `<p>Find the Lowest Common Ancestor (LCA) node for two given target nodes <em>p</em> and <em>q</em> in a binary tree.</p>
<h3>Problem Statement</h3>
<p>Given the root node <code>root</code> of a binary tree and two distinct target nodes <em>p</em> and <em>q</em> existing within the tree, find their Lowest Common Ancestor (LCA). The LCA is defined as the deepest node <em>T</em> in the tree that has both <em>p</em> and <em>q</em> as descendants (where a node is allowed to be a descendant of itself per standard tree graph theory conventions).</p>
<h3>Why It Exists &amp; Real-World Applications</h3>
<p>LCA resolution is a fundamental algorithmic pattern across software engineering and system architecture:</p>
<ul>
  <li><strong>Version Control Systems (Git)</strong>: Git computes the LCA of two commits (<code>git merge-base</code>) to establish the shared base commit when performing a three-way merge.</li>
  <li><strong>Compilers &amp; Static Analysis</strong>: Abstract Syntax Trees (ASTs) query LCA to determine the narrowest enclosing lexical scope containing two variable references or expressions.</li>
  <li><strong>Distributed Systems &amp; Control Groups</strong>: Linux cgroups cgroup-v2 tree managers calculate common parent hierarchy nodes for memory and CPU quota enforcement.</li>
  <li><strong>Autograd Engine Computation Graphs</strong>: PyTorch and TensorFlow execute post-order LCA queries to locate bifurcation points in DAGs for gradient tape propagation.</li>
</ul>
<h3>Algorithmic Approach &amp; DFS Intuition</h3>
<p>The solution uses a bottom-up post-order Depth-First Search (DFS) traversal. The recursive contract relies on three conditions:</p>
<ul>
  <li><strong>Base Case</strong>: If <code>root</code> is null or <code>root.val</code> equals either target <em>p</em> or <em>q</em>, return <code>root</code>.</li>
  <li><strong>Subtree Traversal</strong>: Recursively search the left subtree (<code>left = LCA(root.left, p, q)</code>) and right subtree (<code>right = LCA(root.right, p, q)</code>).</li>
  <li><strong>Decision &amp; Bubble Up</strong>:
    <ul>
      <li>If both <code>left</code> and <code>right</code> return non-null node references, target <em>p</em> lies in one subtree and target <em>q</em> lies in the other. Thus, <code>root</code> is the unique Lowest Common Ancestor!</li>
      <li>If only one side returns non-null, forward that result upward to the parent caller.</li>
      <li>If both return null, return null.</li>
    </ul>
  </li>
</ul>
<h3>Complexity Summary</h3>
<ul>
  <li><strong>Time Complexity</strong>: <em>O(N)</em> worst/average case, visiting every node at most once.</li>
  <li><strong>Space Complexity</strong>: <em>O(H)</em> auxiliary call stack space, where <em>H</em> is tree height (<em>O(log N)</em> for balanced trees, <em>O(N)</em> for degenerate skewed chains).</li>
</ul>`,
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
      "<p>The Lowest Common Ancestor (LCA) of two nodes <em>p</em> and <em>q</em> in a binary tree is the lowest (deepest) node <em>T</em> that has both <em>p</em> and <em>q</em> as descendants. Geometrically, it marks the exact divergence point where the root-to-<em>p</em> path and root-to-<em>q</em> path split into distinct branches.</p><p>A bottom-up post-order Depth-First Search (DFS) evaluates subtrees independently and bubbles node references upward. This single-pass recursive pattern solves the LCA problem in <em>O(N)</em> time and <em>O(H)</em> stack space without requiring parent pointers.</p>",
    sections: [
      {
        heading: "1. The Bottom-Up Recursive Contract",
        body: "<p>The core secret to single-pass LCA resolution lies in defining an unambiguous recursive contract: for any node <em>u</em>, <code>lowest_common_ancestor(u, p, q)</code> returns a non-null reference if <em>u</em>'s subtree contains <em>p</em>, <em>q</em>, or their already-identified LCA, and returns <code>None</code> if the subtree contains neither target. Because children evaluate fully before their parent decides, each node receives complete structural information from both subtrees.</p>",
      },
      {
        heading: "2. Decision Logic & Branch Divergence",
        body: "<p>When evaluating node <em>u</em>, after receiving <code>left</code> and <code>right</code> subtree results:<br />- <strong>Case A (left != None and right != None)</strong>: <em>p</em> is in one subtree and <em>q</em> is in the other. Node <em>u</em> is the exact split point, making <em>u</em> the LCA. Return <em>u</em>.<br />- <strong>Case B (One side != None, other == None)</strong>: Both targets lie inside the same subtree, or one target has been found while searching for the second. Return the non-null result upward.<br />- <strong>Case C (left == None and right == None)</strong>: Neither target exists beneath <em>u</em>. Return <code>None</code>.</p>",
      },
      {
        heading: "3. Ancestor-As-Self & Early Termination",
        body: "<p>By standard convention, a node can be a descendant of itself. If target <em>q</em> resides in target <em>p</em>'s subtree, returning <em>p</em> immediately upon encountering <code>root.val == p</code> is mathematically correct: <em>p</em> is indeed the ancestor of <em>q</em>, and searching deeper inside <em>p</em>'s subtree is unnecessary.</p>",
      },
      {
        heading: "4. Trade-offs: Single Query vs. Multi-Query Precomputation",
        body: "<p>For a single online query on an unindexed binary tree, post-order DFS is optimal (<em>O(N)</em> time, <em>O(H)</em> space). However, if an application requires thousands of LCA queries on a static tree, precomputing Binary Lifting or using Euler Tour + RMQ reduces query time to <em>O(log N)</em> or <em>O(1)</em> after preprocessing.</p>",
      },
      {
        heading: "5. Skewed Trees & Call Stack Memory Limits",
        body: "<p>In a balanced binary tree of <em>N</em> nodes, height <em>H = log<sub>2</sub> N</em>, requiring minimal stack frames (<em>O(log N)</em>). On degenerate skewed trees, <em>H = N</em>, driving memory usage to <em>O(N)</em>. For extremely deep production trees, an iterative parent-map approach using an explicit hash table avoids stack overflow limits.</p>",
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
