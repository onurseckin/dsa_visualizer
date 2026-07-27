export const NUMBER_OF_ISLANDS_CODE = `from collections import deque

def num_islands(grid):
    if not grid or not grid[0]:
        return 0
    
    maxRow, maxCol = len(grid), len(grid[0])
    directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    visited = set()
    count = 0
    
    def getNeighbors(row, col):
        for rowDiff, colDiff in directions:
            newRow = row + rowDiff
            newCol = col + colDiff
            if not (0 <= newRow < maxRow and 0 <= newCol < maxCol):
                continue
            if grid[newRow][newCol] == "0" or (newRow, newCol) in visited:
                continue
            yield (newRow, newCol)

    for row in range(maxRow):
        for col in range(maxCol):
            if grid[row][col] == "1" and (row, col) not in visited:
                count += 1
                visited.add((row, col))
                queue = deque([(row, col)])
                while queue:
                    currRow, currCol = queue.popleft()
                    for newRow, newCol in getNeighbors(currRow, currCol):
                        visited.add((newRow, newCol))
                        queue.append((newRow, newCol))
                        
    return count`;
