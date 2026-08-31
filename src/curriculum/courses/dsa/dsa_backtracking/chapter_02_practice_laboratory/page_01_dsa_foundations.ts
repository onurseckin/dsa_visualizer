import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_backtracking_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Constraint Satisfaction & Backtracking Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "n-queens-ii-bitmask",
      title: "N-Queens II via Single-Cycle Bitmask Register Backtracking",
      difficulty: "Hard",
      rationale:
        "Implement N-Queens II: Return the total number of distinct solutions to the $N$-queens puzzle using 3 bitmask integer registers (`cols`, `diag1`, `diag2`) and lowest-set-bit isolation in $O(1)$ CPU cycles per placement.",
      starterCode: `/**
 * N-Queens II (Fast Bitmask Solver)
 */

export function totalNQueens(n: number): number {
  let count = 0;
  const fullMask = (1 << n) - 1;

  function solve(cols: number, diag1: number, diag2: number): void {
    // If all columns are filled, we found a valid N-Queens solution
    if (cols === fullMask) {
      count++;
      return;
    }

    // Available valid positions on current row: bitwise NOT of occupied paths
    let available = ~(cols | diag1 | diag2) & fullMask;

    while (available > 0) {
      // Isolate the lowest set bit (pick first valid candidate column)
      const bit = available & -available;
      available ^= bit; // Clear candidate bit

      // Recurse to next row: shift main diagonal left, shift anti-diagonal right
      solve(
        cols | bit,
        (diag1 | bit) << 1,
        (diag2 | bit) >> 1
      );
    }
  }

  solve(0, 0, 0);
  return count;
}`,
    },
  ],
};
