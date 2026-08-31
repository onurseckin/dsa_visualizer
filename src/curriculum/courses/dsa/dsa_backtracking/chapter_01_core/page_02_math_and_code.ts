import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_backtracking_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: N-Queens Non-Attacking Diagonal Invariants",
      theorem:
        "On an $N \\times N$ board, two queens placed at coordinates $(r_1, c_1)$ and $(r_2, c_2)$ ($r_1 \\neq r_2$) share a diagonal if and only if $|r_1 - r_2| = |c_1 - c_2|$. This holds if and only if $r_1 - c_1 = r_2 - c_2$ (main diagonal) or $r_1 + c_1 = r_2 + c_2$ (anti-diagonal). Consequently, tracking diagonal threats via bit shifts `(diag1 | bit) << 1` and `(diag2 | bit) >> 1` preserves exact diagonal exclusion across successive rows.",
      proof: `
**Proof via Coordinate Geometry & Diagonal Invariant Shifts:**
1. A diagonal line in the 2D Cartesian grid has slope $m = \\pm 1$.
2. The equation of a line through $(r_1, c_1)$ and $(r_2, c_2)$ with slope $m = +1$ is:
   $$\\frac{c_2 - c_1}{r_2 - r_1} = 1 \\iff c_2 - c_1 = r_2 - r_1 \\iff r_1 - c_1 = r_2 - c_2$$
   Thus, the quantity $r - c$ is strictly constant along any main diagonal (top-left to bottom-right).
3. The equation of a line with slope $m = -1$ is:
   $$\\frac{c_2 - c_1}{r_2 - r_1} = -1 \\iff c_2 - c_1 = -(r_2 - r_1) \\iff r_1 + c_1 = r_2 + c_2$$
   Thus, the quantity $r + c$ is strictly constant along any anti-diagonal (top-right to bottom-left).
4. **Bitmask Shift Invariance across Rows:**
   - Suppose queen $k$ is placed at row $r$, column $c$ (represented as bit $2^c$).
   - On row $r + 1$, the main diagonal projected from this queen extends to column $c + 1$ (which corresponds to bit $2^{c+1} = 2^c \\ll 1$).
   - The anti-diagonal projected from this queen extends to column $c - 1$ (which corresponds to bit $2^{c-1} = 2^c \\gg 1$).
   - Therefore, updating the main diagonal mask as $\\text{diag1}' = (\\text{diag1} \\mid \\text{bit}) \\ll 1$ and anti-diagonal mask as $\\text{diag2}' = (\\text{diag2} \\mid \\text{bit}) \\gg 1$ precisely tracks all diagonal attack paths on row $r + 1$.
5. The bitwise expression $\\text{available} = \\sim(\\text{cols} \\mid \\text{diag1} \\mid \\text{diag2}) \\ \\& \\ ((1 \\ll N) - 1)$ identifies all legal non-threatened columns on row $r + 1$ in $O(1)$ operations without board scanning. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title:
        "Theorem 2: Knuth's Dancing Links (DLX) Cover/Uncover Idempotence Theorem (Knuth 2000)",
      theorem:
        "Let $x$ be a node in a circular doubly linked list. Unlinking $x$ via $x.\\text{left}.\\text{right} = x.\\text{right}$ and $x.\\text{right}.\\text{left} = x.\\text{left}$ preserves $x$'s internal references $x.\\text{left}$ and $x.\\text{right}$. Restoring $x$ via $x.\\text{left}.\\text{right} = x$ and $x.\\text{right}.\\text{left} = x$ in exact reverse LIFO order restores the exact global pointer topology with zero memory reallocation.",
      proof: `
**Proof via Node Self-Referential Pointers:**
1. Let node $x$ have predecessor $L = x.\\text{left}$ and successor $R = x.\\text{right}$ in a doubly linked list.
2. **The Cover (Removal) Operation:**
   - Execute:
     $$L.\\text{right} \\leftarrow R, \\quad R.\\text{left} \\leftarrow L$$
   - Notice that node $x$ is bypassed by the active list pointers.
   - Crucially, the internal pointers of node $x$ ($x.\\text{left}$ and $x.\\text{right}$) are **not modified**; they still point to $L$ and $R$ respectively.
3. **The Uncover (Restoration) Operation:**
   - When backtracking, execute:
     $$x.\\text{left}.\\text{right} \\leftarrow x, \\quad x.\\text{right}.\\text{left} \\leftarrow x$$
   - Since $x.\\text{left} = L$ and $x.\\text{right} = R$, this evaluates to:
     $$L.\\text{right} \\leftarrow x, \\quad R.\\text{left} \\leftarrow x$$
   - This cleanly reinstates $x$ into its original position between $L$ and $R$.
4. **LIFO Stack Invariance in Exact Cover:**
   - During Algorithm X, multiple nodes and columns are covered in sequence: $C_1, C_2, \\dots, C_k$.
   - When backtracking, uncovering is performed in exact reverse order (LIFO): $C_k, C_{k-1}, \\dots, C_1$.
   - Because restorations happen in reverse chronological order, the neighbor nodes $L$ and $R$ for each node $x$ are guaranteed to be present and properly linked when $x$ is uncovered.
5. Thus, matrix mutations are 100% reversible in $O(1)$ pointer operations per element with zero memory allocations or garbage collection overhead. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Recursive Tree Search with Full Array Cloning",
          code: `export function solveNQueensNaive(n: number): string[][] {
  const results: string[][] = [];

  function isSafe(board: string[][], row: number, col: number): boolean {
    for (let i = 0; i < row; i++) {
      if (board[i][col] === "Q") return false;
      if (col - (row - i) >= 0 && board[i][col - (row - i)] === "Q") return false;
      if (col + (row - i) < n && board[i][col + (row - i)] === "Q") return false;
    }
    return true;
  }

  function backtrack(row: number, currentBoard: string[][]): void {
    if (row === n) {
      results.push(currentBoard.map((r) => r.join("")));
      return;
    }
    for (let col = 0; col < n; col++) {
      if (isSafe(currentBoard, row, col)) {
        // Deep clone board on every recursion frame!
        const nextBoard = currentBoard.map((r) => [...r]);
        nextBoard[row][col] = "Q";
        backtrack(row + 1, nextBoard);
      }
    }
  }

  const emptyBoard = Array.from({ length: n }, () => Array(n).fill("."));
  backtrack(0, emptyBoard);
  return results;
}`,
          explanation:
            "Naive recursion with 2D array cloning per step. Allocates $O(N^2)$ memory per frame, triggering heavy GC pressure and $\\Theta(N)$ safety checks per placement.",
          timeComplexity: "O(N! * N)",
          spaceComplexity: "O(N^3) from deep copies",
        },
        {
          label: "Stage 2: In-Place Mutation with Backtracking Restoration",
          code: `export class InPlaceNQueens {
  public static totalNQueens(n: number): number {
    let solutions = 0;
    const cols = new Uint8Array(n);
    const diag1 = new Uint8Array(2 * n); // row - col + n
    const diag2 = new Uint8Array(2 * n); // row + col

    function solve(row: number): void {
      if (row === n) {
        solutions++;
        return;
      }
      for (let col = 0; col < n; col++) {
        const d1 = row - col + n;
        const d2 = row + col;
        if (cols[col] === 0 && diag1[d1] === 0 && diag2[d2] === 0) {
          // Choose
          cols[col] = diag1[d1] = diag2[d2] = 1;
          // Recurse
          solve(row + 1);
          // Un-choose (Backtrack)
          cols[col] = diag1[d1] = diag2[d2] = 0;
        }
      }
    }

    solve(0);
    return solutions;
  }
}`,
          explanation:
            "Stage 2 uses in-place array mutation with $O(1)$ boolean constraint lookups. Eliminates array cloning, reducing memory overhead to $O(N)$.",
          timeComplexity: "O(N!) with O(1) candidate checks",
          spaceComplexity: "O(N) recursion stack",
        },
        {
          label: "Stage 3: High-Performance Bitmask N-Queens Engine in CPU Registers",
          code: `export class FastBitmaskNQueens {
  // N-Queens solver executing entirely in CPU registers via bitwise shifts
  public static totalNQueens(n: number): number {
    let solutions = 0;
    const fullMask = (1 << n) - 1;

    function backtrack(cols: number, diag1: number, diag2: number): void {
      if (cols === fullMask) {
        solutions++;
        return;
      }

      // Available valid columns on current row: bitwise NOT of occupied paths
      let available = ~(cols | diag1 | diag2) & fullMask;

      while (available > 0) {
        // Isolate lowest set bit (pick candidate column in 1 CPU cycle)
        const bit = available & -available;
        available ^= bit; // Clear candidate bit

        // Next row bitmask transitions
        backtrack(
          cols | bit,
          (diag1 | bit) << 1,
          (diag2 | bit) >> 1
        );
      }
    }

    backtrack(0, 0, 0);
    return solutions;
  }
}`,
          explanation:
            "Stage 3 demonstrates **Bitmask N-Queens**. Encodes entire board state into 3 integer registers (`cols`, `diag1`, `diag2`). Available positions and lowest-set-bit candidates are computed via 1-cycle bitwise ALU instructions (`available & -available`), executing up to $30\\times$ faster than standard backtracking.",
          timeComplexity: "O(N!) with single-instruction branch evaluation",
          spaceComplexity: "O(N) stack registers, zero heap allocations",
        },
      ],
      stepByStep: [
        "Encode board constraints into bitmask integers: `cols`, `diag1`, `diag2`.",
        "Extract candidate placements via bitwise NOT and lowest-set-bit isolation: `bit = available & (-available)`.",
        "Advance row while shifting diagonals: `(diag1 | bit) << 1` and `(diag2 | bit) >> 1`.",
      ],
    },
  ],
};
