import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_game_theory_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Bouton's Theorem for the Game of Nim (1901)",
      theorem:
        "In a normal-play game of Nim with $k$ piles of sizes $(x_1, x_2, \\dots, x_k)$, a position is a $P$-position (Previous-player / Second-player winning state) if and only if its Nim-sum is zero:\n$$S = x_1 \\oplus x_2 \\oplus \\dots \\oplus x_k = 0$$\nConversely, a position is an $N$-position (Next-player / First-player winning state) if and only if $S \\neq 0$.",
      proof: `
**Proof via Three Characterization Lemmas:**
1. **Lemma 1 (Terminal Position Invariant):** The terminal position has all piles empty: $(0, 0, \\dots, 0)$. Its Nim-sum is $0 \\oplus 0 \\oplus \\dots \\oplus 0 = 0$. By definition of normal play, the player facing this position has no moves and loses, so it is a $P$-position.
2. **Lemma 2 (From $S \\neq 0$, there exists a move to $S = 0$):**
   - Suppose $S = x_1 \\oplus \\dots \\oplus x_k \\neq 0$. Let $d$ be the index of the most significant bit (MSB) of $S$, so $2^d \\le S < 2^{d+1}$.
   - Because bit $d$ is set in $S$, there must exist at least one pile $x_i$ whose $d$-th bit is 1.
   - Consider setting the new pile size $x_i' = x_i \\oplus S$.
   - Because bit $d$ is set in both $x_i$ and $S$, in $x_i'$ bit $d$ becomes 0, while all higher bits $> d$ remain identical to $x_i$. Therefore, $x_i' < x_i$, making this a legal Nim move (reducing pile $i$ from $x_i$ to $x_i'$).
   - The new Nim-sum after this move is:
     $$S' = x_1 \\oplus \\dots \\oplus x_i' \\oplus \\dots \\oplus x_k = S \\oplus x_i \\oplus (x_i \\oplus S) = S \\oplus S = 0$$
   - Thus, from any position with $S \\neq 0$, there exists at least one legal move leading to a position with $S = 0$.
3. **Lemma 3 (From $S = 0$, every legal move leads to $S \\neq 0$):**
   - Suppose $S = 0$. Any legal move must strictly reduce some pile $x_i$ to $x_i' < x_i$, meaning $x_i' \\neq x_i$.
   - The new Nim-sum is $S' = S \\oplus x_i \\oplus x_i' = 0 \\oplus x_i \\oplus x_i' = x_i \\oplus x_i'$.
   - Since $x_i' \\neq x_i$, $x_i \\oplus x_i' \\neq 0$. Therefore $S' \\neq 0$.
4. By structural induction, the set of positions with Nim-sum 0 satisfies all conditions of $P$-positions, and positions with Nim-sum $\\neq 0$ are $N$-positions. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: The Sprague-Grundy Theorem (Sprague 1935, Grundy 1939)",
      theorem:
        "Every state $s$ in an impartial two-player zero-sum game under normal play convention is equivalent to a single Nim pile of size $G(s)$, where the Grundy function $G(s)$ is defined recursively as:\n$$G(s) = \\text{mex}(\\{ G(s') \\mid s \\to s' \\})$$\nwhere $\\text{mex}(A) = \\min(\\mathbb{N}_0 \\setminus A)$. For a composite game $S = (s_1, s_2, \\dots, s_k)$ consisting of independent subgames, $G(S) = \\bigoplus_{i=1}^k G(s_i)$.",
      proof: `
**Proof by Structural Induction on Game DAG:**
1. Base case: Terminal state $s_{term}$ has no outgoing moves ($\\{ s' \\mid s_{term} \\to s' \\} = \\emptyset$).
   - $G(s_{term}) = \\text{mex}(\\emptyset) = 0$, which is equivalent to a Nim pile of size 0 (a $P$-position).
2. Inductive step: Assume that for all successor states $s'$, $s'$ is equivalent to a Nim pile of size $G(s')$.
3. From state $s$, moving to $s'$ is equivalent to changing the Nim pile from size $G(s)$ to $G(s')$.
4. By definition of $\\text{mex}$, the set $\\{ G(s') \\mid s \\to s' \\}$ contains every non-negative integer $0, 1, \\dots, G(s) - 1$.
   - Therefore, from state $s$, a player can transition to a state equivalent to any Nim pile of size strictly smaller than $G(s)$ (satisfying the downward move property of Nim).
5. Furthermore, by definition of $\\text{mex}$, the set contains no state with Grundy value exactly equal to $G(s)$.
   - Therefore, no single move from $s$ can transition to another state with value $G(s)$ (preventing self-equivalent moves).
6. Hence, state $s$ satisfies the identical move options as a Nim pile of size $G(s)$.
7. By Bouton's Theorem, the sum of independent Nim piles is their bitwise XOR sum. Thus $G(s_1, \\dots, s_k) = \\bigoplus_{i=1}^k G(s_i)$, and the composite position is a first-player winning state if and only if $\\bigoplus_{i=1}^k G(s_i) \\neq 0$. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Exponential Minimax Search Baseline",
          code: `export function minimaxNaive(
  state: number[],
  isMaximizing: boolean,
  depth: number
): number {
  // Terminal state check (no stones left)
  const total = state.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return isMaximizing ? -1 : 1; // Previous player won
  }

  if (isMaximizing) {
    let bestVal = -Infinity;
    // Try all possible moves
    for (let i = 0; i < state.length; i++) {
      for (let take = 1; take <= state[i]; take++) {
        state[i] -= take;
        const val = minimaxNaive(state, false, depth + 1);
        state[i] += take;
        bestVal = Math.max(bestVal, val);
      }
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (let i = 0; i < state.length; i++) {
      for (let take = 1; take <= state[i]; take++) {
        state[i] -= take;
        const val = minimaxNaive(state, true, depth + 1);
        state[i] += take;
        bestVal = Math.min(bestVal, val);
      }
    }
    return bestVal;
  }
}`,
          explanation:
            "Explores all paths in the game tree without pruning or state hashing. For a game with branching factor $b$ and depth $d$, runtime is $\\Theta(b^d)$, causing immediate timeout for non-trivial games.",
          timeComplexity: "O(b^d)",
          spaceComplexity: "O(d) recursion stack",
        },
        {
          label: "Stage 2: Sprague-Grundy MEX Dynamic Programming",
          code: `export class SpragueGrundySolver {
  private memo: Int32Array;

  constructor(maxState: number = 100000) {
    this.memo = new Int32Array(maxState).fill(-1);
    this.memo[0] = 0; // Base case: 0 stones has Grundy value 0
  }

  // Compute Grundy value for subtraction game (can take 1, 2, or 3 stones)
  public getGrundy(n: number): number {
    if (n < 0) return 0;
    if (this.memo[n] !== -1) return this.memo[n];

    const visited = new Uint8Array(4); // Reachable Grundy values bounded by max moves + 1

    // Transitions from state n
    if (n >= 1) visited[this.getGrundy(n - 1)] = 1;
    if (n >= 2) visited[this.getGrundy(n - 2)] = 1;
    if (n >= 3) visited[this.getGrundy(n - 3)] = 1;

    // Compute MEX (Minimum Excluded non-negative integer)
    let mex = 0;
    while (visited[mex]) {
      mex++;
    }

    this.memo[n] = mex;
    return mex;
  }

  // Evaluate composite multi-pile game in O(K) time
  public evaluateCompositeGame(piles: number[]): boolean {
    let nimSum = 0;
    for (const p of piles) {
      nimSum ^= this.getGrundy(p);
    }
    // Nim-sum != 0 indicates First Player (Next) Winning Position
    return nimSum !== 0;
  }
}`,
          explanation:
            "Applies memoized dynamic programming to compute Grundy values via the $\\text{mex}$ operator. Reduces game evaluation across multiple independent piles to $O(N)$ precomputation and $O(K)$ bitwise XOR evaluation.",
          timeComplexity: "Precomputation: O(N), Game Query: O(K)",
          spaceComplexity: "O(N) memoization buffer",
        },
        {
          label: "Stage 3: Negamax Engine with Alpha-Beta Pruning & 64-Bit Zobrist Hashing",
          code: `export class AlphaBetaEngine {
  private transpositionTable: Map<bigint, { depth: number; flag: number; value: number }>;
  private zobristTable: bigint[][]; // zobristTable[cell][piece]

  constructor(boardSize: number = 9, numPieces: number = 3) {
    this.transpositionTable = new Map();
    this.zobristTable = Array.from({ length: boardSize }, () =>
      Array.from({ length: numPieces }, () => this.randomBigInt64())
    );
  }

  private randomBigInt64(): bigint {
    const low = BigInt(Math.floor(Math.random() * 0xffffffff));
    const high = BigInt(Math.floor(Math.random() * 0xffffffff));
    return (high << 32n) | low;
  }

  // High-Performance Negamax with Alpha-Beta Window & Zobrist Transpositions
  public negamax(
    board: Int32Array,
    depth: number,
    alpha: number,
    beta: number,
    color: number, // +1 (Max), -1 (Min)
    hashKey: bigint
  ): number {
    const origAlpha = alpha;

    // Transposition Table Lookup
    const entry = this.transpositionTable.get(hashKey);
    if (entry && entry.depth >= depth) {
      if (entry.flag === 0) return entry.value; // Exact value
      if (entry.flag === 1 && entry.value <= alpha) return alpha; // Upper bound
      if (entry.flag === 2 && entry.value >= beta) return beta; // Lower bound
    }

    if (depth === 0) {
      return color * this.evaluateStaticBoard(board);
    }

    let maxEval = -Infinity;
    const legalMoves = this.generateMoves(board);

    if (legalMoves.length === 0) {
      return -100000; // Terminal loss
    }

    for (const move of legalMoves) {
      // Apply move and update Zobrist hash in O(1) via XOR
      const prevHash = hashKey;
      const piece = color === 1 ? 1 : 2;
      board[move] = piece;
      const newHash = hashKey ^ this.zobristTable[move][piece];

      const score = -this.negamax(board, depth - 1, -beta, -alpha, -color, newHash);

      // Undo move
      board[move] = 0;

      if (score > maxEval) maxEval = score;
      if (score > alpha) alpha = score;

      // Alpha-Beta Cutoff
      if (alpha >= beta) {
        break; // Prune sibling branches
      }
    }

    // Store in Transposition Table
    let flag = 0; // Exact
    if (maxEval <= origAlpha) flag = 1; // Upper bound
    else if (maxEval >= beta) flag = 2; // Lower bound

    this.transpositionTable.set(hashKey, { depth, flag, value: maxEval });
    return maxEval;
  }

  private evaluateStaticBoard(board: Int32Array): number {
    let score = 0;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 1) score += 1;
      else if (board[i] === 2) score -= 1;
    }
    return score;
  }

  private generateMoves(board: Int32Array): number[] {
    const moves: number[] = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 0) moves.push(i);
    }
    return moves;
  }
}`,
          explanation:
            "Stage 3 combines Negamax symmetry, dynamic $[\\alpha, \\beta]$ window pruning, and 64-bit Zobrist hash transposition tables. Dynamic move ordering and transposition caching eliminate redundant sub-tree traversals, reducing search complexity from $O(b^d)$ to $O(b^{d/2})$.",
          timeComplexity: "Alpha-Beta with optimal move ordering: O(b^(d/2))",
          spaceComplexity: "O(d) stack + O(T) fixed transposition table",
        },
      ],
      stepByStep: [
        "For impartial games under normal play, compute Grundy values $G(s) = \\text{mex}(\\{G(s')\\})$ and evaluate Nim-sums via bitwise XOR.",
        "For partisan games, apply Negamax formulation to unify maximizing and minimizing player logic under a single symmetric function.",
        "Update 64-bit Zobrist keys in $O(1)$ via bitwise XOR and cache $[\\alpha, \\beta]$ bounds in a transposition table to prune transpositions.",
      ],
    },
  ],
};
