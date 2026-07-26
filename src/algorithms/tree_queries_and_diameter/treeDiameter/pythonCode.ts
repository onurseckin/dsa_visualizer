export const TREE_DIAMETER_CODE = `def tree_diameter(n, adj, start_node=1):
    # DFS function to return (farthest_node, max_distance)
    def dfs(node, parent, dist):
        max_node, max_dist = node, dist
        for neighbor in adj[node]:
            if neighbor != parent:
                cand_node, cand_dist = dfs(neighbor, node, dist + 1)
                if cand_dist > max_dist:
                    max_node, max_dist = cand_node, cand_dist
        return max_node, max_dist

    # DFS 1: Find endpoint A (farthest from start_node)
    node_a, _ = dfs(start_node, None, 0)
    # DFS 2: Find endpoint B and max diameter from A
    node_b, diameter = dfs(node_a, None, 0)
    return node_a, node_b, diameter`;
