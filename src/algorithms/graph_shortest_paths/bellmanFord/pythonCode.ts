export const BELLMAN_FORD_CODE = `def bellman_ford(nodes, edges, start_node):
    dist = {node: float('inf') for node in nodes}
    dist[start_node] = 0

    for i in range(len(nodes) - 1):
        for u, v, weight in edges:
            if dist[u] != float('inf') and dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight

    has_negative_cycle = False
    for u, v, weight in edges:
        if dist[u] != float('inf') and dist[u] + weight < dist[v]:
            has_negative_cycle = True
            break

    if has_negative_cycle:
        return None, True
    return dist, False`;
