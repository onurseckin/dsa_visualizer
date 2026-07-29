export const BFS_GRAPH_CODE = `from collections import deque

def bfs(graph, start_node):
    visited = {start_node}
    queue = deque([start_node])
    traversal = []
    
    while queue:
        current = queue.popleft()
        traversal.append(current)
        for neighbor in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return traversal`;
