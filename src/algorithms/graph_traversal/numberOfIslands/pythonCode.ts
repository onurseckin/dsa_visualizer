export const NUMBER_OF_ISLANDS_CODE = `from collections import deque

def num_islands(grid):
    if not grid or not grid[0]:
        return 0
    
    rows, cols = len(grid), len(grid[0])
    visited = set()
    count = 0
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in visited:
                count += 1
                visited.add((r, c))
                queue = deque([(r, c)])
                
                while queue:
                    cr, cc = queue.popleft()
                    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
                    for dr, dc in dirs:
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in visited:
                            visited.add((nr, nc))
                            queue.append((nr, nc))
                            
    return count`;
