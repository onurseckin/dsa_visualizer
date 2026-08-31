import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_game_theory_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Combinatorial Game Theory Solver",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "sprague-grundy-composite-nim-solver",
      title: "Sprague-Grundy Composite Subtraction Game Engine",
      difficulty: "Hard",
      rationale:
        "Implement a complete Sprague-Grundy Game Engine: Given $K$ independent piles of stones and a set of allowable subtractions $S = \\{s_1, s_2, \\dots, s_m\\}$, compute the Grundy function for each pile size using dynamic programming and the $\\text{mex}$ operator. Determine whether the current state is a winning position ($N$-position) or losing position ($P$-position), and if winning, output the exact winning move (which pile and how many stones to subtract).",
      starterCode: `/**
 * Sprague-Grundy Game Theory Engine
 */

export interface WinningMove {
  pileIndex: number;
  newPileSize: number;
}

export class SpragueGrundyEngine {
  private allowableMoves: number[];
  private memo: Int32Array;

  constructor(moves: number[], maxPileSize: number = 100000) {
    this.allowableMoves = [...moves].sort((a, b) => a - b);
    this.memo = new Int32Array(maxPileSize + 1).fill(-1);
    this.memo[0] = 0; // Terminal 0 stones has Grundy value 0

    // Precompute Grundy values up to maxPileSize
    for (let i = 1; i <= maxPileSize; i++) {
      this.computeGrundy(i);
    }
  }

  // Compute Grundy value G(n) = mex({ G(n - s) | s in allowableMoves })
  public computeGrundy(n: number): number {
    if (n < 0) return 0;
    if (this.memo[n] !== -1) return this.memo[n];

    const visited = new Uint8Array(this.allowableMoves.length + 2);

    for (const move of this.allowableMoves) {
      if (n >= move) {
        const nextG = this.computeGrundy(n - move);
        if (nextG < visited.length) {
          visited[nextG] = 1;
        }
      }
    }

    let mex = 0;
    while (mex < visited.length && visited[mex]) {
      mex++;
    }

    this.memo[n] = mex;
    return mex;
  }

  // Evaluate multi-pile game and compute winning move
  public solveGame(piles: number[]): { isWinning: boolean; winningMove: WinningMove | null } {
    let nimSum = 0;
    for (const p of piles) {
      nimSum ^= this.computeGrundy(p);
    }

    if (nimSum === 0) {
      return { isWinning: false, winningMove: null };
    }

    // Find the winning transition that changes Nim-sum to 0
    for (let i = 0; i < piles.length; i++) {
      const currentG = this.computeGrundy(piles[i]);
      const targetG = currentG ^ nimSum;

      // We need a move from pile i to a new size with Grundy value targetG < currentG
      if (targetG < currentG) {
        for (const move of this.allowableMoves) {
          if (piles[i] >= move) {
            const nextG = this.computeGrundy(piles[i] - move);
            if (nextG === targetG) {
              return {
                isWinning: true,
                winningMove: { pileIndex: i, newPileSize: piles[i] - move },
              };
            }
          }
        }
      }
    }

    return { isWinning: true, winningMove: null };
  }
}`,
    },
  ],
};
