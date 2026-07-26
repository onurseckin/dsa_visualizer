export const TOPOLOGICAL_SORT_CODE = `from collections import deque, defaultdict

def topological_sort(nodes, edges):
    in_degree = {node: 0 for node in nodes}
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1

    queue = deque([node for node in nodes if in_degree[node] == 0])
    order = []

    while queue:
        u = queue.popleft()
        order.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    return order if len(order) == len(nodes) else []`;
