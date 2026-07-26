export const N_QUEENS_CODE = `def solve_n_queens(n: int) -> list[list[str]]:
    board = [["."] * n for _ in range(n)]
    cols, diag1, diag2 = set(), set(), set()
    solutions = []

    def backtrack(row: int):
        if row == n:
            solutions.append(["".join(r) for r in board])
            return

        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue

            board[row][col] = "Q"
            cols.add(col)
            diag1.add(row - col)
            diag2.add(row + col)

            backtrack(row + 1)

            board[row][col] = "."
            cols.remove(col)
            diag1.remove(row - col)
            diag2.remove(row + col)

    backtrack(0)
    return solutions`;
