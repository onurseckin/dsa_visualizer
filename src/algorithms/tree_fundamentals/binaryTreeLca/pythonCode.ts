export const BINARY_TREE_LCA_CODE = `def lowest_common_ancestor(root, p, q):
    if not root or root.val == p or root.val == q:
        return root

    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)

    if left and right:
        return root
    return left if left else right`;
