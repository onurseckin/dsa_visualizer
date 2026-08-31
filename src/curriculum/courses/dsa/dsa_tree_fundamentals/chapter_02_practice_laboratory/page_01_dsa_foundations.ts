import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_tree_fundamentals_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Tree Topologies & BST Validation Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "validate-binary-search-tree",
      title: "Validate Binary Search Tree via Strict Global Range Bounds",
      difficulty: "Medium",
      rationale:
        "Implement a mathematically rigorous BST validator. Given the root of a binary tree, determine if it is a valid Binary Search Tree by propagating strict open intervals $(-\\infty, +\\infty)$ down the tree hierarchy in $O(N)$ time and $O(H)$ auxiliary space.",
      starterCode: `/**
 * Binary Search Tree Validator
 */

export interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export function isValidBST(root: TreeNode | null): boolean {
  // Helper function to validate node within strict open range (minVal, maxVal)
  function validate(node: TreeNode | null, minVal: number, maxVal: number): boolean {
    if (node === null) return true;

    // Node value must strictly satisfy: minVal < node.val < maxVal
    if (node.val <= minVal || node.val >= maxVal) {
      return false;
    }

    // Left subtree must be < node.val; Right subtree must be > node.val
    return (
      validate(node.left, minVal, node.val) &&
      validate(node.right, node.val, maxVal)
    );
  }

  return validate(root, -Infinity, Infinity);
}`,
    },
  ],
};
