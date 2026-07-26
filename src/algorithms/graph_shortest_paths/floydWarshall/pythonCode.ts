export const FLOYD_WARSHALL_CODE = `def floyd_warshall(nodes, edges):
    n = len(nodes)
    dist = [[float('inf')] * n for _ in range(n)]
    node_to_idx = {node: i for i, node in enumerate(nodes)}

    for i in range(n):
        dist[i][i] = 0

    for u, v, w in edges:
        dist[node_to_idx[u]][node_to_idx[v]] = w

    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] != float('inf') and dist[k][j] != float('inf'):
                    if dist[i][k] + dist[k][j] < dist[i][j]:
                        dist[i][j] = dist[i][k] + dist[k][j]

    return dist`;
